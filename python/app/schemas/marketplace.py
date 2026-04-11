from pydantic import BaseModel, Field
from typing import Literal

from app.models.marketplace import ContactVisibility, CompensationType, OpportunityStatus


class SkillCreate(BaseModel):
    name: str = Field(min_length = 1, max_length = 120)
    category: str | None = Field(default = None, max_length = 120)


class SkillOut(BaseModel):
    id: int
    name: str
    category: str | None = None

    class Config:
        from_attributes = True


class WorkerProfileUpdate(BaseModel):
    bio: str | None = None
    experience_summary: str | None = None
    wants_paid: bool | None = None
    wants_volunteer: bool | None = None
    exact_latitude: float | None = None
    exact_longitude: float | None = None
    public_latitude: float | None = None
    public_longitude: float | None = None
    city: str | None = None
    region: str | None = None
    contact_visibility: ContactVisibility | None = None
    is_available: bool | None = None


class WorkerProfileOut(BaseModel):
    user_id: int
    username: str
    bio: str | None = None
    experience_summary: str | None = None
    wants_paid: bool
    wants_volunteer: bool
    city: str | None = None
    region: str | None = None
    public_latitude: float | None = None
    public_longitude: float | None = None
    exact_latitude: float | None = None
    exact_longitude: float | None = None
    contact_visibility: ContactVisibility
    is_available: bool
    skills: list[SkillOut] = []


class WorkerSkillsUpdate(BaseModel):
    skill_ids: list[int]


class ContactChannelCreate(BaseModel):
    channel_type: str = Field(min_length = 1, max_length = 50)
    channel_value: str = Field(min_length = 1, max_length = 255)
    visibility: ContactVisibility = ContactVisibility.gov_only
    is_primary: bool = False


class ContactChannelOut(BaseModel):
    id: int
    channel_type: str
    channel_value: str
    visibility: ContactVisibility
    is_primary: bool

    class Config:
        from_attributes = True


class EmployerProfileUpdate(BaseModel):
    organization_name: str | None = Field(default = None, max_length = 160)
    organization_description: str | None = None


class EmployerProfileOut(BaseModel):
    user_id: int
    username: str
    organization_name: str
    organization_description: str | None = None
    is_government_service: bool
    is_verified: bool


class OpportunityCreate(BaseModel):
    title: str = Field(min_length = 1, max_length = 200)
    description: str = Field(min_length = 1)
    compensation_type: CompensationType
    budget_note: str | None = Field(default = None, max_length = 120)
    latitude: float
    longitude: float
    city: str | None = Field(default = None, max_length = 120)
    region: str | None = Field(default = None, max_length = 120)
    skill_ids: list[int] = []


class OpportunityOut(BaseModel):
    id: int
    employer_profile_id: int
    employer_id: int
    title: str
    description: str
    compensation_type: CompensationType
    budget_note: str | None = None
    latitude: float
    longitude: float
    city: str | None = None
    region: str | None = None
    status: OpportunityStatus
    skills: list[SkillOut] = []


class ApplicationCreate(BaseModel):
    message: str | None = None


class ApplicationOut(BaseModel):
    id: int
    opportunity_id: int
    worker_profile_id: int
    worker_id: int
    status: str
    message: str | None = None

    class Config:
        from_attributes = True
