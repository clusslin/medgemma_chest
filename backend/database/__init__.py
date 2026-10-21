from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

def get_db():
    """
    Database dependency for FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database tables
    """
    # Import models to register them with Base
    import backend.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _upgrade_existing_schema()


# create_all() only creates missing tables; it never changes tables that already
# exist. These idempotent statements bring an older database up to date.
_STUDY_COLUMNS = {
    "series_instance_uid": "VARCHAR(128)",
    "sop_instance_uid": "VARCHAR(128)",
    "patient_birth_date": "VARCHAR(8)",
    "modality": "VARCHAR(16)",
    "report_json": "JSON",
    "processed_at": "TIMESTAMP WITH TIME ZONE",
    "sent_at": "TIMESTAMP WITH TIME ZONE",
}
_STUDY_WIDEN = {"patient_sex": "VARCHAR(16)", "study_time": "VARCHAR(16)"}


def _upgrade_existing_schema():
    if engine.dialect.name != "postgresql":
        return

    from sqlalchemy import text
    from loguru import logger

    # ALTER TYPE ... ADD VALUE must run outside a transaction
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        has_enum = conn.execute(
            text("SELECT 1 FROM pg_type WHERE typname = 'studystatus'")
        ).first()
        if has_enum:
            conn.execute(text("ALTER TYPE studystatus ADD VALUE IF NOT EXISTS 'QUEUED'"))

        for column, sql_type in _STUDY_COLUMNS.items():
            conn.execute(text(f"ALTER TABLE studies ADD COLUMN IF NOT EXISTS {column} {sql_type}"))
        for column, sql_type in _STUDY_WIDEN.items():
            conn.execute(text(f"ALTER TABLE studies ALTER COLUMN {column} TYPE {sql_type}"))

    logger.info("Database schema is up to date")
