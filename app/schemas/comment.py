from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    parent_id: Optional[int] = None

class CommentUpdate(BaseModel):
    content: Optional[str] = None

class CommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    owner_id: int
    post_id: int
    username: str
    parent_id: Optional[int] = None
    has_replies: bool = False
    role: str

    class Config:
        from_attributes = True