from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "MedGemma Chest X-Ray Automation"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database Settings
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # DICOM Settings
    DICOM_AE_TITLE: str = "MEDGEMMA_SCP"
    DICOM_PORT: int = 11112
    DICOM_HOST: str = "0.0.0.0"
    DICOM_STORAGE_PATH: str = "/app/data/dicom_storage"

    # MedGemma Model Settings
    MODEL_NAME: str = "google/medgemma-27b-it"
    MODEL_CACHE_DIR: str = "/app/models"
    MODEL_DEVICE: str = "cuda"
    MODEL_LOAD_IN_8BIT: bool = True
    MODEL_MAX_LENGTH: int = 2048
    HF_TOKEN: str = ""  # HuggingFace token for accessing gated models

    # RabbitMQ Settings
    RABBITMQ_HOST: str = "rabbitmq"
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: str = "guest"
    RABBITMQ_PASSWORD: str = "guest"
    RABBITMQ_VHOST: str = "/"
    RABBITMQ_QUEUE_DICOM: str = "dicom_processing"
    RABBITMQ_QUEUE_REPORT: str = "report_generation"

    # Redis Settings
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""

    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    # File Transfer Settings
    FTP_ENABLED: bool = False
    FTP_HOST: str = ""
    FTP_PORT: int = 22
    FTP_USER: str = ""
    FTP_PASSWORD: str = ""
    FTP_REMOTE_PATH: str = "/reports"

    SSH_ENABLED: bool = False
    SSH_HOST: str = ""
    SSH_PORT: int = 22
    SSH_USER: str = ""
    SSH_KEY_PATH: str = ""

    # Result Classification Thresholds
    THRESHOLD_NORMAL: float = 0.8
    THRESHOLD_ABNORMAL: float = 0.6
    THRESHOLD_CRITICAL: float = 0.4
    THRESHOLD_EMERGENCY: float = 0.2

    # Age Filter
    MIN_AGE: int = 20

    # Allowed Study Descriptions
    ALLOWED_STUDY_DESCRIPTIONS: str = "chest pa,chest ap,chest lateral,cxr"

    # Worker Settings
    CELERY_WORKERS: int = 4
    CELERY_MAX_TASKS_PER_CHILD: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    """
    return Settings()


settings = get_settings()
