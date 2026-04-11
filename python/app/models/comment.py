from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func

from app.db.base import Base

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key = True, index = True)
    is_deleted = Column(Boolean, default = False, nullable = False)
    was_modified = Column(Boolean, default = False, nullable = False)
    content = Column(String, nullable = False)
    created_at = Column(DateTime(timezone = True), server_default = func.now(), nullable = False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable = False)
    owner = relationship("User", back_populates = "comments")
    post_id = Column(Integer, ForeignKey("posts.id"), nullable = False)
    post = relationship("Post", back_populates = "comments")
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable = True)
    replies = relationship("Comment", cascade = "all, delete-orphan", backref = backref("parent", remote_side = [id]))
    depth = Column(Integer, default = 0, nullable = False)