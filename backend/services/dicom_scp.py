"""
DICOM SCP (Service Class Provider) Service
Receives DICOM images from remote systems
"""
import os
import pydicom
from pynetdicom import AE, evt, StoragePresentationContexts
from pynetdicom.sop_class import Verification
from loguru import logger
from datetime import datetime
from pathlib import Path
from backend.config import settings
from backend.database import SessionLocal
from backend.models import Study, StudyStatus
from backend.services.message_queue import MessageQueueService


class DicomSCPService:
    """
    DICOM SCP Service to receive DICOM images
    """

    def __init__(self):
        self.ae = AE(ae_title=settings.DICOM_AE_TITLE)
        self.ae.supported_contexts = StoragePresentationContexts
        self.ae.add_supported_context(Verification)
        self.storage_path = Path(settings.DICOM_STORAGE_PATH)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.mq_service = MessageQueueService()

    def handle_store(self, event):
        """
        Handle C-STORE request
        """
        try:
            # Get the dataset
            ds = event.dataset
            ds.file_meta = event.file_meta

            # Extract study information
            study_uid = ds.get("StudyInstanceUID", "")
            series_uid = ds.get("SeriesInstanceUID", "")
            sop_uid = ds.get("SOPInstanceUID", "")

            # Patient information
            patient_id = ds.get("PatientID", "")
            patient_name = str(ds.get("PatientName", ""))
            patient_birth_date = ds.get("PatientBirthDate", "")
            patient_age = self._calculate_age(patient_birth_date)
            patient_sex = ds.get("PatientSex", "")

            # Study information
            study_date = ds.get("StudyDate", "")
            study_time = ds.get("StudyTime", "")
            study_description = ds.get("StudyDescription", "").lower()
            accession_number = ds.get("AccessionNumber", "")
            modality = ds.get("Modality", "")

            # Source information
            source_ae = event.assoc.requestor.ae_title
            source_ip = event.assoc.requestor.address

            logger.info(f"Received DICOM image: StudyUID={study_uid}, Patient={patient_name}")

            # Check if study description is allowed
            if not self._is_allowed_study(study_description):
                logger.warning(f"Study description not allowed: {study_description}")
                return 0xC000  # Failure

            # Check patient age
            if patient_age and patient_age < settings.MIN_AGE:
                logger.warning(f"Patient age {patient_age} is below minimum age {settings.MIN_AGE}")
                return 0xC000  # Failure

            # Create storage directory structure: year/month/day/study_uid/
            study_dir = self._create_study_directory(study_uid)

            # Save DICOM file
            file_name = f"{sop_uid}.dcm"
            file_path = study_dir / file_name
            ds.save_as(str(file_path), write_like_original=False)

            logger.info(f"DICOM file saved: {file_path}")

            # Store study information in database
            db = SessionLocal()
            try:
                # Check if study already exists
                existing_study = db.query(Study).filter(
                    Study.study_instance_uid == study_uid
                ).first()

                if existing_study:
                    logger.info(f"Study already exists: {study_uid}")
                    # Update file path if needed
                    existing_study.dicom_file_path = str(file_path)
                    existing_study.updated_at = datetime.now()
                else:
                    # Create new study record
                    new_study = Study(
                        study_instance_uid=study_uid,
                        series_instance_uid=series_uid,
                        sop_instance_uid=sop_uid,
                        accession_number=accession_number,
                        patient_id=patient_id,
                        patient_name=patient_name,
                        patient_age=patient_age,
                        patient_sex=patient_sex,
                        patient_birth_date=patient_birth_date,
                        study_date=study_date,
                        study_time=study_time,
                        study_description=study_description,
                        modality=modality,
                        dicom_file_path=str(file_path),
                        status=StudyStatus.RECEIVED,
                        source_ae_title=source_ae,
                        source_ip=source_ip,
                    )
                    db.add(new_study)
                    logger.info(f"New study created in database: {study_uid}")

                db.commit()

                # Send message to RabbitMQ for processing
                self.mq_service.publish_dicom_received(study_uid)
                logger.info(f"Study queued for processing: {study_uid}")

            except Exception as e:
                db.rollback()
                logger.error(f"Database error: {e}")
                raise
            finally:
                db.close()

            # Return success
            return 0x0000

        except Exception as e:
            logger.error(f"Error handling C-STORE: {e}")
            return 0xC000  # Failure

    def handle_echo(self, event):
        """
        Handle C-ECHO request (verification)
        """
        logger.info("Received C-ECHO request")
        return 0x0000

    def _calculate_age(self, birth_date: str) -> int:
        """
        Calculate age from birth date (YYYYMMDD format)
        """
        if not birth_date or len(birth_date) != 8:
            return None

        try:
            birth_year = int(birth_date[:4])
            current_year = datetime.now().year
            age = current_year - birth_year
            return age
        except:
            return None

    def _is_allowed_study(self, study_description: str) -> bool:
        """
        Check if study description is allowed
        """
        allowed_descriptions = [
            desc.strip().lower()
            for desc in settings.ALLOWED_STUDY_DESCRIPTIONS.split(",")
        ]

        # Check if any allowed description is in the study description
        for allowed in allowed_descriptions:
            if allowed in study_description:
                return True

        return False

    def _create_study_directory(self, study_uid: str) -> Path:
        """
        Create directory structure for study storage
        """
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        day = now.strftime("%d")

        study_dir = self.storage_path / year / month / day / study_uid
        study_dir.mkdir(parents=True, exist_ok=True)

        return study_dir

    def start(self):
        """
        Start DICOM SCP server
        """
        handlers = [
            (evt.EVT_C_STORE, self.handle_store),
            (evt.EVT_C_ECHO, self.handle_echo),
        ]

        logger.info(f"Starting DICOM SCP: {settings.DICOM_AE_TITLE}@{settings.DICOM_HOST}:{settings.DICOM_PORT}")

        self.ae.start_server(
            (settings.DICOM_HOST, settings.DICOM_PORT),
            evt_handlers=handlers,
            block=True
        )

    def stop(self):
        """
        Stop DICOM SCP server
        """
        logger.info("Stopping DICOM SCP server")
        self.ae.shutdown()


if __name__ == "__main__":
    # For testing
    scp = DicomSCPService()
    scp.start()
