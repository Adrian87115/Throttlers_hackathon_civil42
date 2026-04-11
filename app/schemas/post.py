from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PostBase(BaseModel):
    title: str
    content: str

class PostCreate(BaseModel):
    title: str
    content: str

class PostOut(PostBase):
    id: int
    created_at: datetime
    owner_id: int
    username: str
    role: str

    class Config:
        from_attributes = True

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None