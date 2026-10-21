"""
MedGemma AI Model Service
Handles AI inference for chest X-ray analysis

MedGemma 27B-it is a multimodal (image + text) Gemma 3 model. It must be:
  * loaded with AutoProcessor + AutoModelForImageTextToText
  * prompted through the chat template, with the X-ray passed as an image
  * stopped at <end_of_turn>
Feeding it plain text with no chat template makes it ramble and repeat
itself until max_new_tokens is reached.
"""
import re
from typing import Any, Dict, Optional, Tuple

import numpy as np
import pydicom
import torch
from loguru import logger
from PIL import Image
from pydicom.pixel_data_handlers.util import apply_voi_lut
from transformers import AutoModelForImageTextToText, AutoProcessor, BitsAndBytesConfig

from backend.config import settings
from backend.database import SessionLocal
from backend.models import PromptTemplate


DEFAULT_SYSTEM_PROMPT = (
    "You are an expert radiologist analyzing a chest X-ray image. "
    "Provide a concise, accurate report based only on what is visible in the image."
)

DEFAULT_USER_PROMPT = """Patient Information:
- Age: {patient_age} years
- Sex: {patient_sex}
- Study Description: {study_description}

Write the report using exactly these three sections, each section only once:

FINDINGS: heart size and contour, lungs, mediastinum, pleura, bones, and any abnormality.

IMPRESSION: a short clinical summary.

CLASSIFICATION: one word only - NORMAL, ABNORMAL, CRITICAL or EMERGENCY.
"""

SECTION_HEADER = re.compile(
    r"^[\s#>*_\-]*(?:\d+[.)]\s*)?[*_]*\s*(FINDINGS|IMPRESSION|CLASSIFICATION)\b\s*[*_]*\s*:?\s*[*_]*\s*(.*)$",
    re.IGNORECASE,
)
CLASS_KEYWORD = re.compile(r"\b(EMERGENCY|CRITICAL|ABNORMAL|NORMAL)\b", re.IGNORECASE)
CONFIDENCE_BY_CLASS = {"EMERGENCY": 0.95, "CRITICAL": 0.90, "ABNORMAL": 0.85, "NORMAL": 0.80}


class MedGemmaService:
    """
    MedGemma Model Service for chest X-ray analysis
    """

    def __init__(self):
        self.model = None
        self.processor = None
        self.device = settings.MODEL_DEVICE
        self.model_name = settings.MODEL_NAME
        self.load_model()

    # ------------------------------------------------------------------ #
    # Model loading
    # ------------------------------------------------------------------ #
    def _compute_dtype(self) -> torch.dtype:
        if self.device != "cuda" or not torch.cuda.is_available():
            return torch.float32
        # Gemma 3 is trained in bfloat16; float16 can overflow and produce garbage.
        if torch.cuda.is_bf16_supported():
            return torch.bfloat16
        logger.warning("GPU has no bfloat16 support (e.g. RTX 20 series); falling back to float16")
        return torch.float16

    def _max_memory(self) -> Optional[Dict[Any, str]]:
        """Per-GPU budget so device_map="auto" spreads layers across all cards."""
        if self.device != "cuda" or not torch.cuda.is_available():
            return None
        budget = {}
        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)
            total_gb = props.total_memory / 1024**3
            usable = max(1.0, total_gb - settings.MODEL_GPU_RESERVE_GB)
            budget[i] = f"{usable:.1f}GiB"
            logger.info(f"GPU {i}: {props.name}, {total_gb:.1f} GiB total, {usable:.1f} GiB for weights")
        budget["cpu"] = "48GiB"
        return budget

    def load_model(self):
        """
        Load MedGemma model and processor
        """
        try:
            logger.info(f"Loading MedGemma model: {self.model_name}")
            dtype = self._compute_dtype()
            token = settings.HF_TOKEN or None

            quantization_config = None
            if settings.MODEL_LOAD_IN_4BIT:
                quantization_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_compute_dtype=dtype,
                    llm_int8_skip_modules=["vision_tower", "multi_modal_projector", "lm_head"],
                )
                logger.info("Using 4-bit quantization")
            elif settings.MODEL_LOAD_IN_8BIT:
                quantization_config = BitsAndBytesConfig(
                    load_in_8bit=True,
                    llm_int8_skip_modules=["vision_tower", "multi_modal_projector", "lm_head"],
                )
                logger.info("Using 8-bit quantization")

            self.processor = AutoProcessor.from_pretrained(
                self.model_name,
                cache_dir=settings.MODEL_CACHE_DIR,
                token=token,
            )

            self.model = AutoModelForImageTextToText.from_pretrained(
                self.model_name,
                cache_dir=settings.MODEL_CACHE_DIR,
                token=token,
                quantization_config=quantization_config,
                device_map="auto" if self.device == "cuda" else None,
                max_memory=self._max_memory(),
                torch_dtype=dtype,
            )
            self.model.eval()

            if self.device == "cuda" and torch.cuda.is_available():
                placement = getattr(self.model, "hf_device_map", {}) or {}
                devices = sorted({str(d) for d in placement.values()})
                logger.info(f"Model layers placed on devices: {devices}")
                if "cpu" in devices or "disk" in devices:
                    logger.warning("Part of the model was offloaded to CPU; inference will be very slow. "
                                   "Enable MODEL_LOAD_IN_4BIT or use a smaller model.")
                for i in range(torch.cuda.device_count()):
                    used = torch.cuda.memory_allocated(i) / 1024**3
                    logger.info(f"GPU {i} memory allocated after load: {used:.1f} GiB")
            else:
                logger.info("Model loaded on CPU")

            logger.info("MedGemma model loaded successfully")

        except Exception as e:
            logger.error(f"Failed to load MedGemma model: {e}")
            raise

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def analyze_chest_xray(self, dicom_path: str, study_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze chest X-ray image using MedGemma model
        """
        try:
            logger.info(f"Analyzing chest X-ray: {dicom_path}")

            image = self._load_dicom_image(dicom_path)
            system_prompt, user_prompt, temperature, max_tokens = self._build_prompt(study_info)

            response = self._generate(image, system_prompt, user_prompt, temperature, max_tokens)
            findings, impression, classification, confidence = self._parse_response(response)

            result = {
                "findings": findings,
                "impression": impression,
                "classification": classification,
                "confidence_score": confidence,
                "raw_response": response,
            }

            logger.info(f"Analysis completed: Classification={classification}, Confidence={confidence}")
            return result

        except Exception as e:
            logger.error(f"Error analyzing chest X-ray: {e}")
            raise

    # ------------------------------------------------------------------ #
    # Image
    # ------------------------------------------------------------------ #
    def _load_dicom_image(self, dicom_path: str) -> Image.Image:
        """
        Load DICOM file and convert to an 8-bit RGB PIL Image
        """
        try:
            ds = pydicom.dcmread(dicom_path)
            pixels = ds.pixel_array

            # Apply the DICOM window / VOI LUT so the image looks like it does on a viewer
            try:
                pixels = apply_voi_lut(pixels, ds)
            except Exception:
                pass

            pixels = pixels.astype(np.float32)
            if pixels.ndim == 3 and pixels.shape[-1] not in (3, 4):
                pixels = pixels[0]  # multi-frame: use the first frame

            lo, hi = float(pixels.min()), float(pixels.max())
            if hi > lo:
                pixels = (pixels - lo) / (hi - lo) * 255.0
            else:
                pixels = np.zeros_like(pixels)

            # MONOCHROME1 means white = low values; invert so bones are white
            if getattr(ds, "PhotometricInterpretation", "") == "MONOCHROME1":
                pixels = 255.0 - pixels

            image = Image.fromarray(pixels.astype(np.uint8))
            if image.mode != "RGB":
                image = image.convert("RGB")
            return image

        except Exception as e:
            logger.error(f"Error loading DICOM image: {e}")
            raise

    # ------------------------------------------------------------------ #
    # Prompt
    # ------------------------------------------------------------------ #
    def _get_template(self) -> Optional[PromptTemplate]:
        db = SessionLocal()
        try:
            template = db.query(PromptTemplate).filter(
                PromptTemplate.is_active == True,  # noqa: E712
                PromptTemplate.is_default == True,  # noqa: E712
            ).first()
            if not template:
                template = db.query(PromptTemplate).filter(
                    PromptTemplate.is_active == True  # noqa: E712
                ).first()
            if template:
                db.expunge(template)
            return template
        finally:
            db.close()

    @staticmethod
    def _fill(text: str, study_info: Dict[str, Any]) -> str:
        """
        Replace {placeholders}. Unlike str.format, unknown braces are left alone
        and missing values do not raise.
        """
        for key, value in study_info.items():
            text = text.replace("{" + key + "}", "Unknown" if value in (None, "") else str(value))
        return text

    def _build_prompt(self, study_info: Dict[str, Any]) -> Tuple[str, str, float, int]:
        template = self._get_template()

        if template:
            system_prompt = template.system_prompt or DEFAULT_SYSTEM_PROMPT
            user_prompt = template.user_prompt_template or DEFAULT_USER_PROMPT
            temperature = template.temperature if template.temperature is not None else settings.MODEL_TEMPERATURE
            max_tokens = template.max_tokens or settings.MODEL_MAX_NEW_TOKENS
        else:
            system_prompt = DEFAULT_SYSTEM_PROMPT
            user_prompt = DEFAULT_USER_PROMPT
            temperature = settings.MODEL_TEMPERATURE
            max_tokens = settings.MODEL_MAX_NEW_TOKENS

        # A chest X-ray report never needs thousands of tokens; long budgets only give
        # the model room to loop.
        max_tokens = max(64, min(int(max_tokens), settings.MODEL_MAX_NEW_TOKENS))

        return (
            self._fill(system_prompt, study_info),
            self._fill(user_prompt, study_info),
            float(temperature),
            max_tokens,
        )

    # ------------------------------------------------------------------ #
    # Generation
    # ------------------------------------------------------------------ #
    def _generate(
        self,
        image: Image.Image,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
        max_new_tokens: int,
    ) -> str:
        messages = [
            {"role": "system", "content": [{"type": "text", "text": system_prompt}]},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": user_prompt},
                ],
            },
        ]

        inputs = self.processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        ).to(self.model.device, dtype=self._compute_dtype())

        input_len = inputs["input_ids"].shape[-1]

        tokenizer = self.processor.tokenizer
        stop_ids = [tokenizer.eos_token_id]
        end_of_turn = tokenizer.convert_tokens_to_ids("<end_of_turn>")
        if isinstance(end_of_turn, int) and end_of_turn != tokenizer.unk_token_id:
            stop_ids.append(end_of_turn)

        gen_kwargs = dict(
            max_new_tokens=max_new_tokens,
            repetition_penalty=settings.MODEL_REPETITION_PENALTY,
            eos_token_id=stop_ids,
            pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
        )
        if temperature > 0:
            gen_kwargs.update(do_sample=True, temperature=temperature, top_p=0.9)
        else:
            gen_kwargs.update(do_sample=False)

        with torch.inference_mode():
            output = self.model.generate(**inputs, **gen_kwargs)

        # Decode only the newly generated tokens (not the prompt)
        new_tokens = output[0][input_len:]
        if len(new_tokens) >= max_new_tokens:
            logger.warning("Generation hit max_new_tokens; output may be truncated")

        text = self.processor.decode(new_tokens, skip_special_tokens=True).strip()
        return self._remove_repetition(text)

    @staticmethod
    def _remove_repetition(text: str) -> str:
        """
        Safety net against degenerate loops: collapse a phrase repeated 3+ times
        in a row, then drop duplicate lines.
        """
        text = re.sub(r"(.{8,300}?)(?:\s*\1){2,}", r"\1", text, flags=re.DOTALL)

        seen = set()
        kept = []
        for line in text.splitlines():
            key = re.sub(r"\W+", " ", line).strip().lower()
            if key and key in seen:
                continue
            if key:
                seen.add(key)
            kept.append(line)
        return "\n".join(kept).strip()

    # ------------------------------------------------------------------ #
    # Parsing
    # ------------------------------------------------------------------ #
    def _parse_response(self, response: str) -> Tuple[str, str, str, float]:
        """
        Parse model response into findings / impression / classification
        """
        sections = {"findings": [], "impression": [], "classification": []}
        current = None

        for raw in response.splitlines():
            line = raw.strip()
            if not line:
                continue

            match = SECTION_HEADER.match(line)
            if match:
                current = match.group(1).lower()
                rest = match.group(2).strip(" *_")
                if rest:
                    sections[current].append(rest)
                continue

            if current:
                sections[current].append(line)

        findings = " ".join(sections["findings"]).strip()
        impression = " ".join(sections["impression"]).strip()

        # No headers at all: keep the whole text as findings rather than losing it
        if not findings and not impression:
            findings = response.strip()

        classification = "NORMAL"
        class_text = " ".join(sections["classification"]) or impression or response
        keyword = CLASS_KEYWORD.search(class_text)
        if keyword:
            classification = keyword.group(1).upper()

        return findings, impression, classification, CONFIDENCE_BY_CLASS[classification]

    def unload_model(self):
        """
        Unload model from memory
        """
        self.model = None
        self.processor = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("Model unloaded from memory")
