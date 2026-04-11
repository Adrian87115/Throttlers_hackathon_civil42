from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key = True, index = True)
    is_deleted = Column(Boolean, default = False, nullable = False)
    deletion_reason = Column(String, default = "", nullable = False)
    was_modified = Column(Boolean, default = False, nullable = False)
    title = Column(String, nullable = False)
    content = Column(String, nullable = False)
    created_at = Column(DateTime(timezone = True), server_default = func.now(), nullable = False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable = False)
    owner = relationship("User", back_populates = "posts")
    comments = relationship("Comment", back_populates = "post", cascade = "all, delete-orphan")

from app.models.comment import Comment