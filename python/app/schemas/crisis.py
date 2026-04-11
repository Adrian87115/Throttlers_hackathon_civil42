import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.crisis import (CrisisRequestPriority, CrisisSeverity,
                               CrisisStatus)

_DISTRICT_ID_PATTERN = re.compile(r"^[a-z0-9-]{2,120}$")


class CrisisStartIn(BaseModel):
    title: str = Field(min_length = 1, max_length = 200)
    description: str = Field(min_length = 1)
    severity: CrisisSeverity
    affected_districts: list[str] = Field(min_length = 1)

    @field_validator("affected_districts")
    @classmethod
    def validate_affected_districts(cls, value: list[str]):
        if len(set(value)) != len(value):
            raise ValueError("affected_districts must not contain duplicates")
        for district_id in value:
            if not _DISTRICT_ID_PATTERN.match(district_id):
                raise ValueError("district_id must be lowercase slug format")
        return value


class CrisisDataOut(BaseModel):
    id: int
    title: str
    description: str
    severity: CrisisSeverity
    status: CrisisStatus
    affected_districts: list[str]
    started_at: datetime
    ended_at: datetime | None = None
    created_by: int | None = None

    class Config:
        from_attributes = True


class CrisisRequestCreateIn(BaseModel):
    district_id: str = Field(min_length = 2, max_length = 120)
    title: str = Field(min_length = 1, max_length = 200)
    description: str = Field(min_length = 1)
    needed_categories: list[str] = Field(min_length = 1)
    priority: CrisisRequestPriority

    @field_validator("district_id")
    @classmethod
    def validate_district_id(cls, value: str):
        if not _DISTRICT_ID_PATTERN.match(value):
            raise ValueError("district_id must be lowercase slug format")
        return value


class CrisisRequestOut(BaseModel):
    id: int
    crisis_id: int
    district_id: str
    title: str
    description: str
    needed_categories: list[str]
    priority: CrisisRequestPriority
    created_at: datetime

    class Config:
        from_attributes = True


class CrisisResponderOut(BaseModel):
    user_id: int
    name: str
    role: str | None = None
    category: str | None = None
    district: str | None = None
    available: bool | None = None
    responded_positively: bool


class CrisisNotifyOut(BaseModel):
    notified: int
