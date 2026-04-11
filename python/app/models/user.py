from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class AccountType(str, enum.Enum):
    worker = "worker"
    employer = "employer"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key = True, index = True)
    is_deleted = Column(Boolean, default = False, nullable = False)
    username = Column(String, unique = True, index = True, nullable = False)
    email = Column(String, unique = True, index = True, nullable = False)
    hashed_password = Column(String, nullable = False)
    role = Column(String, default = "user", nullable = False)
    account_type = Column(Enum(AccountType, name = "account_type"), nullable = True)
    created_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())
    updated_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now(), onupdate = func.now())

    worker_profile = relationship("WorkerProfile", back_populates = "user", uselist = False, cascade = "all, delete-orphan")
    employer_profile = relationship("EmployerProfile", back_populates = "user", uselist = False, cascade = "all, delete-orphan")
    contact_channels = relationship("ContactChannel", back_populates = "user", cascade = "all, delete-orphan")
    created_opportunities = relationship("Opportunity", back_populates = "employer")
    submitted_applications = relationship("Application", back_populates = "worker")
