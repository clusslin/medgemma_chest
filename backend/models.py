"""
Database models for MedGemma Chest X-Ray System
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SQLEnum, Float
from sqlalchemy.sql import func
from datetime import datetime
import enum
from backend.database import Base


# Enums
class StudyStatus(str, enum.Enum):
    """Study processing status"""
    RECEIVED = "received"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SENT = "sent"


class ClassificationResult(str, enum.Enum):
    """Classification results"""
    NORMAL = "normal"
    ABNORMAL = "abnormal"
    CRITICAL = "critical"
    EMERGENCY = "emergency"
    UNKNOWN = "unknown"


# Models
class DicomNode(Base):
    """DICOM Node configuration"""
    __tablename__ = "dicom_nodes"

    id = Column(Integer, primary_key=True, index=True)
    ae_title = Column(String(16), nullable=False, index=True)
    ip_address = Column(String(45), nullable=False)
    port = Column(Integer, nullable=False)
    node_type = Column(String(20), nullable=False)  # local, source, destination
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<DicomNode(ae_title='{self.ae_title}', ip={self.ip_address}:{self.port})>"


class Study(Base):
    """DICOM Study information"""
    __tablename__ = "studies"

    id = Column(Integer, primary_key=True, index=True)
    study_instance_uid = Column(String(128), unique=True, nullable=False, index=True)
    patient_id = Column(String(64), nullable=True, index=True)
    patient_name = Column(String(255), nullable=True)
    patient_age = Column(Integer, nullable=True)
    patient_sex = Column(String(1), nullable=True)
    study_date = Column(String(8), nullable=True)
    study_time = Column(String(6), nullable=True)
    study_description = Column(String(255), nullable=True)
    accession_number = Column(String(64), nullable=True, index=True)

    # Processing information
    status = Column(SQLEnum(StudyStatus), default=StudyStatus.RECEIVED, nullable=False, index=True)
    classification = Column(SQLEnum(ClassificationResult), nullable=True, index=True)
    confidence_score = Column(Float, nullable=True)

    # AI Analysis results
    findings = Column(Text, nullable=True)
    impression = Column(Text, nullable=True)

    # File paths
    dicom_file_path = Column(String(512), nullable=True)
    sr_file_path = Column(String(512), nullable=True)
    json_export_path = Column(String(512), nullable=True)

    # Source node
    source_ae_title = Column(String(16), nullable=True)
    source_ip_address = Column(String(45), nullable=True)

    # Processing metadata
    processing_started_at = Column(DateTime(timezone=True), nullable=True)
    processing_completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Study(uid='{self.study_instance_uid}', status='{self.status}')>"


class PromptTemplate(Base):
    """AI Prompt templates"""
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=False)
    user_prompt_template = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Prompt parameters
    temperature = Column(Float, default=0.7)
    max_tokens = Column(Integer, default=2048)

    # Metadata
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<PromptTemplate(name='{self.name}', is_default={self.is_default})>"
