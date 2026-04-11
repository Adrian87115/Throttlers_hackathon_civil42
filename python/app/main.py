from fastapi import FastAPI, Request
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from app.routers import users, auth
from app.db.session import engine
from app.db.base import Base
from app.models.user import User
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.core.logging_middleware import LoggingMiddleware

# 400 - bad request
# 401 - unauthorized error
# 403 - forbidden error
# 404 - not found
# 500 - internal server error

# Base.metadata.drop_all(bind = engine) # if ever needed to reset the database and reconstruct from the model
Base.metadata.create_all(bind = engine)
app = FastAPI()
app.add_middleware(LoggingMiddleware)
app.add_middleware(CORSMiddleware,
                   allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
                   allow_credentials = True,
                   allow_methods = ["*"],
                   allow_headers = ["*"])
app.include_router(users.router, prefix = "/users", tags = ["Users"])
app.include_router(auth.router, prefix = "/auth", tags = ["Auth"])

@app.on_event("startup")
def create_default_owner():
    db: Session = SessionLocal()
    owner = db.query(User).filter(User.role == "owner").first()
    if not owner:
        owner = User(username = "owner",
                     email = "owner@example.com",
                     hashed_password = hash_password("owner"),
                     role = "owner",
                     is_active = True,
                     is_verified = True)
        db.add(owner)
        print("Default owner user created.")
    else:
        owner.hashed_password = hash_password("owner")
        print("Default owner password reset.")
    db.commit()
    db.close()