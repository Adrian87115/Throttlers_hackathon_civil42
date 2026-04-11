from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class ContactVisibility(str, enum.Enum):
    public = "public"
    private = "private"


class OpportunityStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"


class CompensationType(str, enum.Enum):
    paid = "paid"
    volunteer = "volunteer"
    both = "both"


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


worker_skills = Table(
    "worker_skills",
    Base.metadata,
    Column("worker_profile_id", ForeignKey("worker_profiles.id", ondelete = "CASCADE"), primary_key = True),
    Column("skill_id", ForeignKey("skills.id", ondelete = "CASCADE"), primary_key = True),
    Column("proficiency_level", String, nullable = True),
    Column("years_experience", Integer, nullable = True),
)


opportunity_skills = Table(
    "opportunity_skills",
    Base.metadata,
    Column("opportunity_id", ForeignKey("opportunities.id", ondelete = "CASCADE"), primary_key = True),
    Column("skill_id", ForeignKey("skills.id", ondelete = "CASCADE"), primary_key = True),
)


class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id = Column(Integer, primary_key = True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), unique = True, nullable = False, index = True)

    bio = Column(Text, nullable = True)
    experience_summary = Column(Text, nullable = True)
    wants_paid = Column(Boolean, nullable = False, default = True)
    wants_volunteer = Column(Boolean, nullable = False, default = False)

    exact_latitude = Column(Float, nullable = True)
    exact_longitude = Column(Float, nullable = True)
    public_latitude = Column(Float, nullable = True)
    public_longitude = Column(Float, nullable = True)
    city = Column(String(120), nullable = True)
    region = Column(String(120), nullable = True)

    contact_visibility = Column(
        Enum(ContactVisibility, name = "contact_visibility"),
        nullable = False,
        default = ContactVisibility.private,
    )

    is_available = Column(Boolean, nullable = False, default = True)
    created_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())
    updated_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now(), onupdate = func.now())

    user = relationship("User", back_populates = "worker_profile")
    skills = relationship("Skill", secondary = worker_skills, back_populates = "workers")
    applications = relationship("Application", back_populates = "worker_profile", cascade = "all, delete-orphan")

    __table_args__ = (
        CheckConstraint("exact_latitude BETWEEN -90 AND 90", name = "ck_worker_exact_latitude"),
        CheckConstraint("exact_longitude BETWEEN -180 AND 180", name = "ck_worker_exact_longitude"),
        CheckConstraint("public_latitude BETWEEN -90 AND 90", name = "ck_worker_public_latitude"),
        CheckConstraint("public_longitude BETWEEN -180 AND 180", name = "ck_worker_public_longitude"),
        CheckConstraint("wants_paid OR wants_volunteer", name = "ck_worker_compensation_choice"),
        Index("ix_worker_public_coords", "public_latitude", "public_longitude"),
    )


class EmployerProfile(Base):
    __tablename__ = "employer_profiles"

    id = Column(Integer, primary_key = True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), unique = True, nullable = False, index = True)
    organization_name = Column(String(160), nullable = False)
    organization_description = Column(Text, nullable = True)
    is_government_service = Column(Boolean, nullable = False, default = False)
    is_verified = Column(Boolean, nullable = False, default = False)
    verification_status = Column(
        Enum(VerificationStatus, name = "verification_status"),
        nullable = False,
        default = VerificationStatus.pending,
    )
    created_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())
    updated_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now(), onupdate = func.now())

    user = relationship("User", back_populates = "employer_profile")
    opportunities = relationship("Opportunity", back_populates = "employer_profile", cascade = "all, delete-orphan")


class ContactChannel(Base):
    __tablename__ = "contact_channels"

    id = Column(Integer, primary_key = True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), nullable = False, index = True)
    channel_type = Column(String(50), nullable = False)
    channel_value = Column(String(255), nullable = False)
    visibility = Column(
        Enum(ContactVisibility, name = "contact_channel_visibility"),
        nullable = False,
        default = ContactVisibility.private,
    )
    is_primary = Column(Boolean, nullable = False, default = False)
    created_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())

    user = relationship("User", back_populates = "contact_channels")

    __table_args__ = (
        UniqueConstraint("user_id", "channel_type", "channel_value", name = "uq_contact_unique_channel"),
    )


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key = True)
    name = Column(String(120), unique = True, nullable = False, index = True)
    category = Column(String(120), nullable = True)
    created_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())

    workers = relationship("WorkerProfile", secondary = worker_skills, back_populates = "skills")
    opportunities = relationship("Opportunity", secondary = opportunity_skills, back_populates = "required_skills")


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key = True)
    employer_profile_id = Column(Integer, ForeignKey("employer_profiles.id", ondelete = "CASCADE"), nullable = False, index = True)
    employer_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), nullable = False, index = True)

    title = Column(String(200), nullable = False)
    description = Column(Text, nullable = False)
    compensation_type = Column(Enum(CompensationType, name = "compensation_type"), nullable = False)
    budget_note = Column(String(120), nullable = True)

    latitude = Column(Float, nullable = False)
    longitude = Column(Float, nullable = False)
    city = Column(String(120), nullable = True)
    region = Column(String(120), nullable = True)

    status = Column(Enum(OpportunityStatus, name = "opportunity_status"), nullable = False, default = OpportunityStatus.open)
    is_deleted = Column(Boolean, nullable = False, default = False)
    created_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())
    updated_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now(), onupdate = func.now())

    employer_profile = relationship("EmployerProfile", back_populates = "opportunities")
    employer = relationship("User", back_populates = "created_opportunities")
    required_skills = relationship("Skill", secondary = opportunity_skills, back_populates = "opportunities")
    applications = relationship("Application", back_populates = "opportunity", cascade = "all, delete-orphan")

    __table_args__ = (
        CheckConstraint("latitude BETWEEN -90 AND 90", name = "ck_opportunity_latitude"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name = "ck_opportunity_longitude"),
        Index("ix_opportunity_coords", "latitude", "longitude"),
        Index("ix_opportunity_status", "status"),
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key = True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete = "CASCADE"), nullable = False, index = True)
    worker_profile_id = Column(Integer, ForeignKey("worker_profiles.id", ondelete = "CASCADE"), nullable = False, index = True)
    worker_id = Column(Integer, ForeignKey("users.id", ondelete = "CASCADE"), nullable = False, index = True)

    status = Column(String(40), nullable = False, default = "applied")
    message = Column(Text, nullable = True)
    created_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now())
    updated_at = Column(DateTime(timezone = True), nullable = False, server_default = func.now(), onupdate = func.now())

    opportunity = relationship("Opportunity", back_populates = "applications")
    worker_profile = relationship("WorkerProfile", back_populates = "applications")
    worker = relationship("User", back_populates = "submitted_applications")

    __table_args__ = (
        UniqueConstraint("opportunity_id", "worker_profile_id", name = "uq_unique_application_per_opportunity"),
    )
