"""
Database Initialization Script
Creates initial data and default prompt templates
"""
import sys
sys.path.append('/app')

from backend.database import init_db, SessionLocal
from backend.models import DicomNode, PromptTemplate
from loguru import logger


def create_default_nodes():
    """Create default DICOM nodes"""
    db = SessionLocal()
    try:
        # Check if local node exists
        local_node = db.query(DicomNode).filter(
            DicomNode.node_type == 'local'
        ).first()

        if not local_node:
            # Create local node
            local_node = DicomNode(
                ae_title='MEDGEMMA_SCP',
                ip_address='0.0.0.0',
                port=11112,
                node_type='local',
                description='Local DICOM SCP',
                is_active=True
            )
            db.add(local_node)
            logger.info("Created local DICOM node")

        db.commit()
        logger.info("Default DICOM nodes created")

    except Exception as e:
        logger.error(f"Error creating default nodes: {e}")
        db.rollback()
    finally:
        db.close()


def create_default_prompts():
    """Create default prompt templates"""
    db = SessionLocal()
    try:
        # Check if default prompt exists
        default_prompt = db.query(PromptTemplate).filter(
            PromptTemplate.is_default == True
        ).first()

        if not default_prompt:
            # Create default system prompt
            system_prompt = """You are an expert radiologist analyzing a chest X-ray image.
Provide a detailed and accurate analysis based on the clinical findings."""

            user_prompt_template = """Patient Information:
- Age: {patient_age} years
- Sex: {patient_sex}
- Study Description: {study_description}

Please provide a detailed analysis including:

1. FINDINGS: Describe all observable findings in the chest X-ray, including:
   - Heart size and contour
   - Lung fields (both right and left)
   - Mediastinum
   - Pleural spaces
   - Bony structures
   - Any abnormalities or lesions

2. IMPRESSION: Provide a concise summary and clinical interpretation of the findings.

3. CLASSIFICATION: Classify the overall result as one of the following:
   - NORMAL: No significant abnormalities detected
   - ABNORMAL: Minor abnormalities that require follow-up
   - CRITICAL: Significant abnormalities requiring urgent attention
   - EMERGENCY: Life-threatening findings requiring immediate intervention

Please structure your response clearly with these three sections."""

            default_prompt = PromptTemplate(
                name='Default Chest X-Ray Analysis',
                description='Default prompt template for chest X-ray analysis using MedGemma',
                system_prompt=system_prompt,
                user_prompt_template=user_prompt_template,
                temperature=0.7,
                max_tokens=2048,
                is_default=True,
                is_active=True,
                created_by='system'
            )
            db.add(default_prompt)
            logger.info("Created default prompt template")

        db.commit()
        logger.info("Default prompt templates created")

    except Exception as e:
        logger.error(f"Error creating default prompts: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """Main initialization function"""
    logger.info("Starting database initialization")

    # Initialize database tables
    init_db()
    logger.info("Database tables created")

    # Create default data
    create_default_nodes()
    create_default_prompts()

    logger.info("Database initialization completed")


if __name__ == "__main__":
    main()
