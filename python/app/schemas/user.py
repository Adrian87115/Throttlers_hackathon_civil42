from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


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


class UnifiedProfileMeOut(BaseModel):
    id: int
    email: EmailStr
    username: str
    account_type: Literal["user", "employer"]

    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    district: str | None = None
    skills: list[SkillSummaryOut] = []
    experience_years: int | None = None
    category: str | None = None
    role: str | None = None
    available: bool | None = None

    organization_name: str | None = None
    nip: str | None = None
    regon: str | None = None
    org_address: str | None = None
    org_phone: str | None = None
    contact_person: str | None = None
    institution_type: str | None = None
    is_government_service: bool | None = None
    is_verified: bool | None = None
    verification_status: str | None = None


class ProfileUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    district: str | None = None
    role: str | None = None
    experience_years: int | None = Field(default = None, ge = 0)
    category: str | None = None
    skills: str | list[str] | None = None
    available: bool | None = None
    username: str | None = None
    organization_name: str | None = None
    nip: str | None = None
    regon: str | None = None
    org_address: str | None = None
    org_phone: str | None = None
    contact_person: str | None = None
    institution_type: str | None = None

    @field_validator("nip")
    @classmethod
    def validate_nip(cls, value: str | None):
        if value is not None and value != "" and not value.isdigit():
            raise ValueError("nip must contain only digits")
        if value is not None and value != "" and len(value) != 10:
            raise ValueError("nip must be 10 digits")
        return value

    @field_validator("regon")
    @classmethod
    def validate_regon(cls, value: str | None):
        if value is not None and value != "" and (not value.isdigit() or len(value) not in {9, 14}):
            raise ValueError("regon must be 9 or 14 digits")
        return value