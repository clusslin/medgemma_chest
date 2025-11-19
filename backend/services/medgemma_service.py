"""
MedGemma AI Model Service
Handles AI inference for chest X-ray analysis
"""
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from loguru import logger
from typing import Dict, Any
from pathlib import Path
from backend.config import settings
from backend.database import SessionLocal
from backend.models import PromptTemplate
import pydicom
from PIL import Image
import io


class MedGemmaService:
    """
    MedGemma Model Service for chest X-ray analysis
    """

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = settings.MODEL_DEVICE
        self.model_name = settings.MODEL_NAME
        self.load_model()

    def load_model(self):
        """
        Load MedGemma model and tokenizer
        """
        try:
            logger.info(f"Loading MedGemma model: {self.model_name}")

            # Configure quantization for 8-bit loading
            if settings.MODEL_LOAD_IN_8BIT:
                quantization_config = BitsAndBytesConfig(
                    load_in_8bit=True,
                    llm_int8_threshold=6.0,
                )
                logger.info("Using 8-bit quantization")
            else:
                quantization_config = None

            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir=settings.MODEL_CACHE_DIR,
                trust_remote_code=True
            )

            # Load model
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                cache_dir=settings.MODEL_CACHE_DIR,
                quantization_config=quantization_config,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            )

            if self.device == "cuda":
                logger.info(f"Model loaded on GPU: {torch.cuda.get_device_name(0)}")
            else:
                logger.info("Model loaded on CPU")

            logger.info("MedGemma model loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load MedGemma model: {e}")
            raise

    def analyze_chest_xray(self, dicom_path: str, study_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze chest X-ray image using MedGemma model
        """
        try:
            logger.info(f"Analyzing chest X-ray: {dicom_path}")

            # Load DICOM and convert to image
            image = self._load_dicom_image(dicom_path)

            # Get prompt template
            prompt = self._build_prompt(study_info)

            # Generate report
            findings, impression, classification, confidence = self._generate_report(
                image, prompt, study_info
            )

            result = {
                "findings": findings,
                "impression": impression,
                "classification": classification,
                "confidence_score": confidence,
            }

            logger.info(f"Analysis completed: Classification={classification}, Confidence={confidence}")
            return result

        except Exception as e:
            logger.error(f"Error analyzing chest X-ray: {e}")
            raise

    def _load_dicom_image(self, dicom_path: str) -> Image.Image:
        """
        Load DICOM file and convert to PIL Image
        """
        try:
            ds = pydicom.dcmread(dicom_path)

            # Get pixel array
            pixel_array = ds.pixel_array

            # Normalize to 0-255 range
            if pixel_array.max() > 255:
                pixel_array = (pixel_array / pixel_array.max() * 255).astype('uint8')

            # Convert to PIL Image
            image = Image.fromarray(pixel_array)

            # Convert to RGB if grayscale
            if image.mode != 'RGB':
                image = image.convert('RGB')

            return image

        except Exception as e:
            logger.error(f"Error loading DICOM image: {e}")
            raise

    def _build_prompt(self, study_info: Dict[str, Any]) -> str:
        """
        Build prompt from template
        """
        db = SessionLocal()
        try:
            # Get active prompt template
            template = db.query(PromptTemplate).filter(
                PromptTemplate.is_active == True,
                PromptTemplate.is_default == True,
                PromptTemplate.template_type == "system"
            ).first()

            if template:
                prompt_text = template.prompt_text
            else:
                # Default prompt if no template found
                prompt_text = self._get_default_prompt()

            # Replace variables in prompt
            for key, value in study_info.items():
                placeholder = "{" + key + "}"
                if placeholder in prompt_text:
                    prompt_text = prompt_text.replace(placeholder, str(value))

            return prompt_text

        finally:
            db.close()

    def _get_default_prompt(self) -> str:
        """
        Get default analysis prompt
        """
        return """You are an expert radiologist analyzing a chest X-ray image.

Patient Information:
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

    def _generate_report(
        self,
        image: Image.Image,
        prompt: str,
        study_info: Dict[str, Any]
    ) -> tuple:
        """
        Generate report using MedGemma model
        """
        try:
            # Format prompt with study info
            formatted_prompt = prompt.format(**study_info)

            # Tokenize input
            inputs = self.tokenizer(
                formatted_prompt,
                return_tensors="pt",
                max_length=settings.MODEL_MAX_LENGTH,
                truncation=True
            )

            if self.device == "cuda":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Generate response
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=1024,
                    temperature=0.7,
                    top_p=0.9,
                    do_sample=True,
                    num_return_sequences=1,
                    pad_token_id=self.tokenizer.eos_token_id,
                )

            # Decode response
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

            # Remove the prompt from response
            response = response.replace(formatted_prompt, "").strip()

            # Parse response
            findings, impression, classification, confidence = self._parse_response(response)

            return findings, impression, classification, confidence

        except Exception as e:
            logger.error(f"Error generating report: {e}")
            raise

    def _parse_response(self, response: str) -> tuple:
        """
        Parse model response into structured format
        """
        findings = ""
        impression = ""
        classification = "NORMAL"
        confidence = 0.8

        # Simple parsing logic - extract sections
        lines = response.split('\n')

        current_section = None
        for line in lines:
            line = line.strip()

            if not line:
                continue

            # Detect section headers
            if 'FINDINGS' in line.upper():
                current_section = 'findings'
                continue
            elif 'IMPRESSION' in line.upper():
                current_section = 'impression'
                continue
            elif 'CLASSIFICATION' in line.upper():
                current_section = 'classification'
                continue

            # Append content to appropriate section
            if current_section == 'findings':
                findings += line + " "
            elif current_section == 'impression':
                impression += line + " "
            elif current_section == 'classification':
                # Extract classification
                line_upper = line.upper()
                if 'EMERGENCY' in line_upper:
                    classification = 'EMERGENCY'
                    confidence = 0.95
                elif 'CRITICAL' in line_upper:
                    classification = 'CRITICAL'
                    confidence = 0.90
                elif 'ABNORMAL' in line_upper:
                    classification = 'ABNORMAL'
                    confidence = 0.85
                elif 'NORMAL' in line_upper:
                    classification = 'NORMAL'
                    confidence = 0.80

        return findings.strip(), impression.strip(), classification, confidence

    def unload_model(self):
        """
        Unload model from memory
        """
        if self.model:
            del self.model
            self.model = None
        if self.tokenizer:
            del self.tokenizer
            self.tokenizer = None

        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info("Model unloaded from memory")
