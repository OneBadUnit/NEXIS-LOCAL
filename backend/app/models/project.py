from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from app.core.db import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    settings = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
