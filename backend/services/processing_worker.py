"""
Processing Worker
Handles AI analysis workflow
"""
import json
from datetime import datetime
from loguru import logger
from backend.database import SessionLocal
from backend.models import Study, StudyStatus, ClassificationResult
from backend.services.medgemma_service import MedGemmaService
from backend.services.dicom_sr_generator import DicomSRGenerator
from backend.services.message_queue import MessageQueueService
from backend.services.file_transfer import FileTransferService


class ProcessingWorker:
    """
    Worker to process DICOM studies and generate reports
    """

    def __init__(self):
        self.medgemma_service = MedGemmaService()
        self.sr_generator = DicomSRGenerator()
        self.mq_service = MessageQueueService()
        self.file_transfer_service = FileTransferService()

    def process_dicom(self, message: dict):
        """
        Process DICOM image and generate report
        """
        study_uid = message.get('study_uid')

        if not study_uid:
            logger.error("No study_uid in message")
            return

        logger.info(f"Processing study: {study_uid}")

        db = SessionLocal()
        try:
            # Get study from database
            study = db.query(Study).filter(
                Study.study_instance_uid == study_uid
            ).first()

            if not study:
                logger.error(f"Study not found: {study_uid}")
                return

            # Update status to processing
            study.status = StudyStatus.PROCESSING
            db.commit()

            # Prepare study info for AI analysis
            study_info = {
                'study_instance_uid': study.study_instance_uid,
                'patient_age': study.patient_age or 0,
                'patient_sex': study.patient_sex or 'Unknown',
                'study_description': study.study_description or 'Chest X-Ray',
                'patient_id': study.patient_id,
                'patient_name': study.patient_name,
                'patient_birth_date': study.patient_birth_date,
                'study_date': study.study_date,
                'study_time': study.study_time,
                'accession_number': study.accession_number,
                'modality': study.modality,
            }

            # Analyze with MedGemma
            logger.info(f"Starting AI analysis for study: {study_uid}")
            analysis_result = self.medgemma_service.analyze_chest_xray(
                study.dicom_file_path,
                study_info
            )

            # Update study with results
            study.findings = analysis_result['findings']
            study.impression = analysis_result['impression']
            study.classification = self._map_classification(analysis_result['classification'])
            study.confidence_score = analysis_result['confidence_score']

            # Generate JSON report
            json_report = self.sr_generator.generate_json_report(
                analysis_result,
                study_info
            )
            study.report_json = json_report

            # Generate DICOM SR
            logger.info(f"Generating DICOM SR for study: {study_uid}")
            sr_file_path = self.sr_generator.generate_sr(
                study.dicom_file_path,
                analysis_result,
                study_info
            )
            study.sr_file_path = sr_file_path

            # Update status
            study.status = StudyStatus.COMPLETED
            study.processed_at = datetime.now()

            db.commit()

            logger.info(f"Study processing completed: {study_uid}")

            # Publish report generated message
            self.mq_service.publish_report_generated(study_uid, json_report)

        except Exception as e:
            logger.error(f"Error processing study {study_uid}: {e}")

            # Update study status to failed
            study = db.query(Study).filter(
                Study.study_instance_uid == study_uid
            ).first()

            if study:
                study.status = StudyStatus.FAILED
                study.error_message = str(e)
                db.commit()

        finally:
            db.close()

    def send_report(self, message: dict):
        """
        Send report to destination nodes
        """
        study_uid = message.get('study_uid')
        report_data = message.get('report_data')

        if not study_uid:
            logger.error("No study_uid in message")
            return

        logger.info(f"Sending report for study: {study_uid}")

        db = SessionLocal()
        try:
            # Get study from database
            study = db.query(Study).filter(
                Study.study_instance_uid == study_uid
            ).first()

            if not study:
                logger.error(f"Study not found: {study_uid}")
                return

            # Send JSON report via file transfer
            if report_data:
                self.file_transfer_service.send_json_report(study_uid, report_data)

            # Send DICOM SR to destination nodes
            # TODO: Implement DICOM C-STORE to send SR files

            # Update status
            study.status = StudyStatus.SENT
            study.sent_at = datetime.now()
            db.commit()

            logger.info(f"Report sent for study: {study_uid}")

        except Exception as e:
            logger.error(f"Error sending report for study {study_uid}: {e}")

        finally:
            db.close()

    def _map_classification(self, classification_str: str) -> ClassificationResult:
        """
        Map classification string to enum
        """
        classification_map = {
            'NORMAL': ClassificationResult.NORMAL,
            'ABNORMAL': ClassificationResult.ABNORMAL,
            'CRITICAL': ClassificationResult.CRITICAL,
            'EMERGENCY': ClassificationResult.EMERGENCY,
        }
        return classification_map.get(classification_str.upper(), ClassificationResult.NORMAL)

    def start_dicom_consumer(self):
        """
        Start consuming DICOM queue
        """
        logger.info("Starting DICOM queue consumer")
        self.mq_service.consume_dicom_queue(self.process_dicom)

    def start_report_consumer(self):
        """
        Start consuming report queue
        """
        logger.info("Starting report queue consumer")
        self.mq_service.consume_report_queue(self.send_report)


if __name__ == "__main__":
    import sys

    worker = ProcessingWorker()

    if len(sys.argv) > 1 and sys.argv[1] == "report":
        # Start report consumer
        worker.start_report_consumer()
    else:
        # Start DICOM consumer (default)
        worker.start_dicom_consumer()
