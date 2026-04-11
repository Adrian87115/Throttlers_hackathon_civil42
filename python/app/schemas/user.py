from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    username: str
    password: str
    email: EmailStr

class UserOut(UserBase):
    id: int
    username: str

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
    isAuthenticated: bool = True
    isAdmin: bool = False
    isModerator: bool = False
    isOwner: bool = False

    class Config:
        from_attributes = True