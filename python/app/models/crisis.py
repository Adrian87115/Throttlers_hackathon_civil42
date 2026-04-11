import enum

from sqlalchemy import (JSON, Boolean, Column, DateTime, Enum, ForeignKey,
                        Integer, String, Text, UniqueConstraint, func)
from sqlalchemy.orm import relationship

from app.db.base import Base


class CrisisSeverity(str, enum.Enum):
    high = "high"
    critical = "critical"


class CrisisStatus(str, enum.Enum):
    active = "active"
    ended = "ended"


class CrisisRequestPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Crisis(Base):
    __tablename__ = "crises"

    id = Column(Integer, primary_key = True)
    title = Column(String(200), nullable = False)
    description = Column(Text, nullable = False)
    severity = Column(Enum(CrisisSeverity, name = "crisis_severity"), nullable = False)
    status = Column(Enum(CrisisStatus, name = "crisis_status"), nullable = False, default = CrisisStatus.active)
    affected_districts = Column(JSON, nullable = False)
    started_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())
    ended_at = Column(DateTime(timezone = True), nullable = True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete = "SET NULL"), nullable = True, index = True)


class CrisisRequest(Base):
    __tablename__ = "crisis_requests"

    id = Column(Integer, primary_key = True)
    crisis_id = Column(Integer, ForeignKey("crises.id", ondelete = "CASCADE"), nullable = False, index = True)
    district_id = Column(String(120), nullable = False)
    title = Column(String(200), nullable = False)
    description = Column(Text, nullable = False)
    needed_categories = Column(JSON, nullable = False)
    priority = Column(Enum(CrisisRequestPriority, name = "crisis_request_priority"), nullable = False)
    created_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())


class CrisisResponse(Base):
    __tablename__ = "crisis_responses"

    id = Column(Integer, primary_key = True)
    crisis_id = Column(Integer, ForeignKey("crises.id", ondelete = "CASCADE"), nullable = False, index = True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), nullable = False, index = True)
    responded_positively = Column(Boolean, nullable = False, default = False)
    responded_at = Column(DateTime(timezone = True), nullable = True)

    __table_args__ = (
        UniqueConstraint("crisis_id", "user_id", name = "uq_crisis_response_crisis_user"),
    )
