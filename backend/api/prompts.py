"""
Prompt Templates API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend.models import PromptTemplate
from loguru import logger


router = APIRouter(prefix="/prompts", tags=["Prompt Templates"])


# Pydantic models
class PromptTemplateCreate(BaseModel):
    name: str
    description: str = None
    template_type: str  # system, findings, impression, classification
    prompt_text: str
    variables: dict = None
    output_structure: dict = None
    display_order: int = 0
    is_active: bool = True
    is_default: bool = False


class PromptTemplateUpdate(BaseModel):
    name: str = None
    description: str = None
    template_type: str = None
    prompt_text: str = None
    variables: dict = None
    output_structure: dict = None
    display_order: int = None
    is_active: bool = None
    is_default: bool = None


class PromptTemplateResponse(BaseModel):
    id: int
    name: str
    description: str = None
    template_type: str
    prompt_text: str
    variables: dict = None
    output_structure: dict = None
    display_order: int
    is_active: bool
    is_default: bool
    created_at: str = None
    updated_at: str = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PromptTemplateResponse])
def get_prompt_templates(
    template_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get all prompt templates with optional filters
    """
    query = db.query(PromptTemplate)

    if template_type:
        query = query.filter(PromptTemplate.template_type == template_type)

    if is_active is not None:
        query = query.filter(PromptTemplate.is_active == is_active)

    templates = query.order_by(PromptTemplate.display_order).all()
    return templates


@router.get("/{template_id}", response_model=PromptTemplateResponse)
def get_prompt_template(template_id: int, db: Session = Depends(get_db)):
    """
    Get a specific prompt template by ID
    """
    template = db.query(PromptTemplate).filter(
        PromptTemplate.id == template_id
    ).first()

    if not template:
        raise HTTPException(status_code=404, detail="Prompt template not found")

    return template


@router.post("/", response_model=PromptTemplateResponse, status_code=201)
def create_prompt_template(
    template_data: PromptTemplateCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new prompt template
    """
    try:
        # Check if name already exists
        existing_template = db.query(PromptTemplate).filter(
            PromptTemplate.name == template_data.name
        ).first()

        if existing_template:
            raise HTTPException(
                status_code=400,
                detail="Prompt template with this name already exists"
            )

        # If setting as default, unset other defaults
        if template_data.is_default:
            db.query(PromptTemplate).filter(
                PromptTemplate.template_type == template_data.template_type,
                PromptTemplate.is_default == True
            ).update({"is_default": False})

        # Create new template
        new_template = PromptTemplate(**template_data.dict())
        db.add(new_template)
        db.commit()
        db.refresh(new_template)

        logger.info(f"Created prompt template: {new_template.name}")
        return new_template

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating prompt template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{template_id}", response_model=PromptTemplateResponse)
def update_prompt_template(
    template_id: int,
    template_data: PromptTemplateUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a prompt template
    """
    try:
        template = db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id
        ).first()

        if not template:
            raise HTTPException(status_code=404, detail="Prompt template not found")

        # If setting as default, unset other defaults
        if template_data.is_default:
            db.query(PromptTemplate).filter(
                PromptTemplate.template_type == template.template_type,
                PromptTemplate.is_default == True,
                PromptTemplate.id != template_id
            ).update({"is_default": False})

        # Update fields
        update_data = template_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(template, key, value)

        db.commit()
        db.refresh(template)

        logger.info(f"Updated prompt template: {template.name}")
        return template

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating prompt template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{template_id}", status_code=204)
def delete_prompt_template(template_id: int, db: Session = Depends(get_db)):
    """
    Delete a prompt template
    """
    try:
        template = db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id
        ).first()

        if not template:
            raise HTTPException(status_code=404, detail="Prompt template not found")

        db.delete(template)
        db.commit()

        logger.info(f"Deleted prompt template: {template.name}")
        return None

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting prompt template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/set-default", response_model=PromptTemplateResponse)
def set_default_template(template_id: int, db: Session = Depends(get_db)):
    """
    Set a template as default for its type
    """
    try:
        template = db.query(PromptTemplate).filter(
            PromptTemplate.id == template_id
        ).first()

        if not template:
            raise HTTPException(status_code=404, detail="Prompt template not found")

        # Unset other defaults of same type
        db.query(PromptTemplate).filter(
            PromptTemplate.template_type == template.template_type,
            PromptTemplate.is_default == True
        ).update({"is_default": False})

        # Set this template as default
        template.is_default = True
        db.commit()
        db.refresh(template)

        logger.info(f"Set default prompt template: {template.name}")
        return template

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error setting default template: {e}")
        raise HTTPException(status_code=500, detail=str(e))
