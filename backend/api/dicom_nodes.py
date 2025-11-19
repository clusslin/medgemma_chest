"""
DICOM Nodes API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from backend.database import get_db
from backend.models import DicomNode
from loguru import logger


router = APIRouter(prefix="/dicom-nodes", tags=["DICOM Nodes"])


# Pydantic models
class DicomNodeCreate(BaseModel):
    ae_title: str
    ip_address: str
    port: int
    node_type: str  # local, destination, source
    description: str = None
    is_active: bool = True


class DicomNodeUpdate(BaseModel):
    ae_title: str = None
    ip_address: str = None
    port: int = None
    node_type: str = None
    description: str = None
    is_active: bool = None


class DicomNodeResponse(BaseModel):
    id: int
    ae_title: str
    ip_address: str
    port: int
    node_type: str
    description: str = None
    is_active: bool
    created_at: str = None
    updated_at: str = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[DicomNodeResponse])
def get_dicom_nodes(
    node_type: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db)
):
    """
    Get all DICOM nodes with optional filters
    """
    query = db.query(DicomNode)

    if node_type:
        query = query.filter(DicomNode.node_type == node_type)

    if is_active is not None:
        query = query.filter(DicomNode.is_active == is_active)

    nodes = query.all()
    return nodes


@router.get("/{node_id}", response_model=DicomNodeResponse)
def get_dicom_node(node_id: int, db: Session = Depends(get_db)):
    """
    Get a specific DICOM node by ID
    """
    node = db.query(DicomNode).filter(DicomNode.id == node_id).first()

    if not node:
        raise HTTPException(status_code=404, detail="DICOM node not found")

    return node


@router.post("/", response_model=DicomNodeResponse, status_code=201)
def create_dicom_node(node_data: DicomNodeCreate, db: Session = Depends(get_db)):
    """
    Create a new DICOM node
    """
    try:
        # Check if AE title already exists
        existing_node = db.query(DicomNode).filter(
            DicomNode.ae_title == node_data.ae_title,
            DicomNode.ip_address == node_data.ip_address,
            DicomNode.port == node_data.port
        ).first()

        if existing_node:
            raise HTTPException(
                status_code=400,
                detail="DICOM node with this AE title, IP, and port already exists"
            )

        # Create new node
        new_node = DicomNode(**node_data.dict())
        db.add(new_node)
        db.commit()
        db.refresh(new_node)

        logger.info(f"Created DICOM node: {new_node.ae_title}")
        return new_node

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating DICOM node: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{node_id}", response_model=DicomNodeResponse)
def update_dicom_node(
    node_id: int,
    node_data: DicomNodeUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a DICOM node
    """
    try:
        node = db.query(DicomNode).filter(DicomNode.id == node_id).first()

        if not node:
            raise HTTPException(status_code=404, detail="DICOM node not found")

        # Update fields
        update_data = node_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(node, key, value)

        db.commit()
        db.refresh(node)

        logger.info(f"Updated DICOM node: {node.ae_title}")
        return node

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating DICOM node: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{node_id}", status_code=204)
def delete_dicom_node(node_id: int, db: Session = Depends(get_db)):
    """
    Delete a DICOM node
    """
    try:
        node = db.query(DicomNode).filter(DicomNode.id == node_id).first()

        if not node:
            raise HTTPException(status_code=404, detail="DICOM node not found")

        db.delete(node)
        db.commit()

        logger.info(f"Deleted DICOM node: {node.ae_title}")
        return None

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting DICOM node: {e}")
        raise HTTPException(status_code=500, detail=str(e))
