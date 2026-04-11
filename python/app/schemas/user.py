from pydantic import BaseModel, EmailStr
from typing import Literal

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
    is_active: bool
    is_verified: bool
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
    isAdmin: bool = False
    isModerator: bool = False
    isOwner: bool = False

    class Config:
        from_attributes = True