"""
Studies API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from backend.database import get_db
from backend.models import Study, StudyStatus, ClassificationResult
from loguru import logger


router = APIRouter(prefix="/studies", tags=["Studies"])


# Pydantic models
class StudyResponse(BaseModel):
    id: int
    study_instance_uid: str
    series_instance_uid: str = None
    sop_instance_uid: str = None
    accession_number: str = None
    patient_id: str = None
    patient_name: str = None
    patient_age: int = None
    patient_sex: str = None
    patient_birth_date: str = None
    study_date: str = None
    study_time: str = None
    study_description: str = None
    modality: str = None
    status: str
    classification: str = None
    confidence_score: float = None
    findings: str = None
    impression: str = None
    report_json: dict = None
    error_message: str = None
    received_at: str = None
    processed_at: str = None
    sent_at: str = None

    class Config:
        from_attributes = True


class StudyListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    studies: List[StudyResponse]


class StudyStats(BaseModel):
    total_studies: int
    received: int
    queued: int
    processing: int
    completed: int
    failed: int
    sent: int
    normal: int
    abnormal: int
    critical: int
    emergency: int


@router.get("/", response_model=StudyListResponse)
def get_studies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[StudyStatus] = None,
    classification: Optional[ClassificationResult] = None,
    study_date: Optional[str] = None,
    patient_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of studies with pagination and filters
    """
    query = db.query(Study)

    # Apply filters
    if status:
        query = query.filter(Study.status == status)

    if classification:
        query = query.filter(Study.classification == classification)

    if study_date:
        query = query.filter(Study.study_date == study_date)

    if patient_id:
        query = query.filter(Study.patient_id.contains(patient_id))

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    studies = query.order_by(Study.received_at.desc()).offset(offset).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "studies": studies
    }


@router.get("/stats", response_model=StudyStats)
def get_study_stats(db: Session = Depends(get_db)):
    """
    Get study statistics
    """
    total_studies = db.query(Study).count()

    # Status counts
    received = db.query(Study).filter(Study.status == StudyStatus.RECEIVED).count()
    queued = db.query(Study).filter(Study.status == StudyStatus.QUEUED).count()
    processing = db.query(Study).filter(Study.status == StudyStatus.PROCESSING).count()
    completed = db.query(Study).filter(Study.status == StudyStatus.COMPLETED).count()
    failed = db.query(Study).filter(Study.status == StudyStatus.FAILED).count()
    sent = db.query(Study).filter(Study.status == StudyStatus.SENT).count()

    # Classification counts
    normal = db.query(Study).filter(Study.classification == ClassificationResult.NORMAL).count()
    abnormal = db.query(Study).filter(Study.classification == ClassificationResult.ABNORMAL).count()
    critical = db.query(Study).filter(Study.classification == ClassificationResult.CRITICAL).count()
    emergency = db.query(Study).filter(Study.classification == ClassificationResult.EMERGENCY).count()

    return {
        "total_studies": total_studies,
        "received": received,
        "queued": queued,
        "processing": processing,
        "completed": completed,
        "failed": failed,
        "sent": sent,
        "normal": normal,
        "abnormal": abnormal,
        "critical": critical,
        "emergency": emergency,
    }


@router.get("/{study_uid}", response_model=StudyResponse)
def get_study(study_uid: str, db: Session = Depends(get_db)):
    """
    Get a specific study by UID
    """
    study = db.query(Study).filter(
        Study.study_instance_uid == study_uid
    ).first()

    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    return study


@router.delete("/{study_uid}", status_code=204)
def delete_study(study_uid: str, db: Session = Depends(get_db)):
    """
    Delete a study
    """
    try:
        study = db.query(Study).filter(
            Study.study_instance_uid == study_uid
        ).first()

        if not study:
            raise HTTPException(status_code=404, detail="Study not found")

        db.delete(study)
        db.commit()

        logger.info(f"Deleted study: {study_uid}")
        return None

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting study: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{study_uid}/reprocess", status_code=202)
def reprocess_study(study_uid: str, db: Session = Depends(get_db)):
    """
    Reprocess a failed study
    """
    try:
        study = db.query(Study).filter(
            Study.study_instance_uid == study_uid
        ).first()

        if not study:
            raise HTTPException(status_code=404, detail="Study not found")

        # Reset study status
        study.status = StudyStatus.RECEIVED
        study.error_message = None
        db.commit()

        # TODO: Re-publish to queue
        logger.info(f"Reprocessing study: {study_uid}")

        return {"message": "Study queued for reprocessing"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error reprocessing study: {e}")
        raise HTTPException(status_code=500, detail=str(e))
