from typing import Literal

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    username: str
    password: str
    email: EmailStr
    account_type: Literal["worker", "employer"]

class UserOut(UserBase):
    id: int
    username: str
    account_type: str | None = None

    class Config:
        from_attributes = True


class UserPublicOut(BaseModel):
    id: int
    username: str
    account_type: str | None = None

    class Config:
        from_attributes = True

class UserOutAdvanced(UserOut):
    role: str
    is_deleted: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class SafeUserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    account_type: str | None = None
    isAuthenticated: bool = True
    isOwner: bool = False

    class Config:
        from_attributes = True


class SkillSummaryOut(BaseModel):
    id: int
    name: str
    category: str | None = None

    class Config:
        from_attributes = True


class BaseProfileMeOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    account_type: Literal["worker", "employer"]


class WorkerProfileMeOut(BaseProfileMeOut):
    account_type: Literal["worker"]
    position: str | None = None
    category: str | None = None
    experience_summary: str | None = None
    is_available: bool
    skills: list[SkillSummaryOut] = []
    phone: str | None = None
    city: str | None = None
    district: str | None = None


class EmployerProfileMeOut(BaseProfileMeOut):
    account_type: Literal["employer"]
    organization_name: str
    nip: str | None = None
    regon: str | None = None
    org_address: str | None = None
    org_phone: str | None = None
    contact_person: str | None = None
    institution_type: str | None = None
    is_government_service: bool
    is_verified: bool
    verification_status: str