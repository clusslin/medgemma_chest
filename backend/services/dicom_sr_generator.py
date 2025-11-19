"""
DICOM Structured Report (SR) Generator
Creates DICOM SR files from AI analysis results
"""
import pydicom
from pydicom.dataset import Dataset, FileDataset
from pydicom.uid import generate_uid, ExplicitVRLittleEndian
from datetime import datetime
from pathlib import Path
from loguru import logger
from typing import Dict, Any
from backend.config import settings


class DicomSRGenerator:
    """
    DICOM SR Generator for creating structured reports
    """

    def __init__(self):
        self.storage_path = Path(settings.DICOM_STORAGE_PATH) / "sr"
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def generate_sr(
        self,
        original_dicom_path: str,
        report_data: Dict[str, Any],
        study_info: Dict[str, Any]
    ) -> str:
        """
        Generate DICOM SR from report data

        Returns: Path to generated SR file
        """
        try:
            logger.info(f"Generating DICOM SR for study: {study_info.get('study_instance_uid')}")

            # Load original DICOM to copy patient/study information
            original_ds = pydicom.dcmread(original_dicom_path)

            # Create new SR dataset
            sr_ds = self._create_sr_dataset(original_ds, report_data, study_info)

            # Save SR file
            sr_file_path = self._save_sr_file(sr_ds, study_info.get('study_instance_uid'))

            logger.info(f"DICOM SR generated: {sr_file_path}")
            return str(sr_file_path)

        except Exception as e:
            logger.error(f"Error generating DICOM SR: {e}")
            raise

    def _create_sr_dataset(
        self,
        original_ds: Dataset,
        report_data: Dict[str, Any],
        study_info: Dict[str, Any]
    ) -> FileDataset:
        """
        Create DICOM SR dataset
        """
        # File meta information
        file_meta = Dataset()
        file_meta.MediaStorageSOPClassUID = '1.2.840.10008.5.1.4.1.1.88.11'  # Basic Text SR
        file_meta.MediaStorageSOPInstanceUID = generate_uid()
        file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
        file_meta.ImplementationClassUID = generate_uid()
        file_meta.ImplementationVersionName = 'MEDGEMMA_SR_1.0'

        # Create SR dataset
        ds = FileDataset(
            filename="",
            dataset={},
            file_meta=file_meta,
            preamble=b"\0" * 128
        )

        # Patient Module
        ds.PatientName = original_ds.get('PatientName', '')
        ds.PatientID = original_ds.get('PatientID', '')
        ds.PatientBirthDate = original_ds.get('PatientBirthDate', '')
        ds.PatientSex = original_ds.get('PatientSex', '')
        ds.PatientAge = original_ds.get('PatientAge', '')

        # Study Module
        ds.StudyInstanceUID = original_ds.get('StudyInstanceUID', '')
        ds.StudyDate = original_ds.get('StudyDate', '')
        ds.StudyTime = original_ds.get('StudyTime', '')
        ds.StudyDescription = original_ds.get('StudyDescription', '')
        ds.AccessionNumber = original_ds.get('AccessionNumber', '')
        ds.ReferringPhysicianName = original_ds.get('ReferringPhysicianName', '')

        # SR Document Series Module
        ds.SeriesInstanceUID = generate_uid()
        ds.SeriesNumber = 9999
        ds.Modality = 'SR'
        ds.SeriesDescription = 'AI Generated Chest X-Ray Report'

        # SR Document General Module
        ds.InstanceNumber = 1
        ds.ContentDate = datetime.now().strftime('%Y%m%d')
        ds.ContentTime = datetime.now().strftime('%H%M%S')
        ds.SOPClassUID = file_meta.MediaStorageSOPClassUID
        ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID

        # SR Document Content Module
        ds.ValueType = 'CONTAINER'
        ds.ConceptNameCodeSequence = [self._create_code_sequence(
            'MEDGEMMA_001',
            'MEDGEMMA',
            'AI Chest X-Ray Analysis Report'
        )]
        ds.ContinuityOfContent = 'SEPARATE'

        # Content Sequence
        content_sequence = []

        # Add Findings section
        if report_data.get('findings'):
            findings_item = self._create_text_content_item(
                'FINDINGS',
                report_data['findings']
            )
            content_sequence.append(findings_item)

        # Add Impression section
        if report_data.get('impression'):
            impression_item = self._create_text_content_item(
                'IMPRESSION',
                report_data['impression']
            )
            content_sequence.append(impression_item)

        # Add Classification section
        if report_data.get('classification'):
            classification_item = self._create_text_content_item(
                'CLASSIFICATION',
                f"{report_data['classification']} (Confidence: {report_data.get('confidence_score', 0):.2f})"
            )
            content_sequence.append(classification_item)

        ds.ContentSequence = content_sequence

        # Completion Flag
        ds.CompletionFlag = 'COMPLETE'
        ds.VerificationFlag = 'UNVERIFIED'

        return ds

    def _create_code_sequence(self, code_value: str, coding_scheme: str, code_meaning: str) -> Dataset:
        """
        Create a code sequence item
        """
        code_item = Dataset()
        code_item.CodeValue = code_value
        code_item.CodingSchemeDesignator = coding_scheme
        code_item.CodeMeaning = code_meaning
        return code_item

    def _create_text_content_item(self, concept_name: str, text_value: str) -> Dataset:
        """
        Create a text content item
        """
        item = Dataset()
        item.ValueType = 'TEXT'
        item.ConceptNameCodeSequence = [self._create_code_sequence(
            concept_name.upper().replace(' ', '_'),
            'MEDGEMMA',
            concept_name
        )]
        item.TextValue = text_value
        return item

    def _save_sr_file(self, sr_ds: Dataset, study_uid: str) -> Path:
        """
        Save SR file to storage
        """
        # Create directory for study
        study_dir = self.storage_path / study_uid
        study_dir.mkdir(parents=True, exist_ok=True)

        # Generate filename
        sr_filename = f"SR_{sr_ds.SOPInstanceUID}.dcm"
        sr_file_path = study_dir / sr_filename

        # Save SR file
        sr_ds.save_as(str(sr_file_path), write_like_original=False)

        return sr_file_path

    def generate_json_report(self, report_data: Dict[str, Any], study_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate JSON format report
        """
        json_report = {
            "study_information": {
                "study_instance_uid": study_info.get('study_instance_uid'),
                "accession_number": study_info.get('accession_number'),
                "study_date": study_info.get('study_date'),
                "study_time": study_info.get('study_time'),
                "study_description": study_info.get('study_description'),
                "modality": study_info.get('modality'),
            },
            "patient_information": {
                "patient_id": study_info.get('patient_id'),
                "patient_name": study_info.get('patient_name'),
                "patient_age": study_info.get('patient_age'),
                "patient_sex": study_info.get('patient_sex'),
                "patient_birth_date": study_info.get('patient_birth_date'),
            },
            "report": {
                "findings": report_data.get('findings'),
                "impression": report_data.get('impression'),
                "classification": report_data.get('classification'),
                "confidence_score": report_data.get('confidence_score'),
            },
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "system_version": settings.APP_VERSION,
                "model_name": settings.MODEL_NAME,
            }
        }

        return json_report
