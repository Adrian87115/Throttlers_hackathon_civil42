from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key = True, index = True)
    is_deleted = Column(Boolean, default = False, nullable = False)
    username = Column(String, unique = True, index = True, nullable = False)
    email = Column(String, unique = True, index = True, nullable = False)
    hashed_password = Column(String, nullable = False)
    role = Column(String, default = "user", nullable = False)
    is_verified = Column(Boolean, default = False, nullable = False)
    is_active = Column(Boolean, default = False, nullable = False)
    posts = relationship("Post", back_populates = "owner", cascade = "all, delete-orphan")
    comments = relationship("Comment", back_populates = "owner", cascade = "all, delete-orphan")

from app.models.comment import Comment