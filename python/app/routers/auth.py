from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.user import AccountType
from app.models.marketplace import WorkerProfile, EmployerProfile, VerificationStatus
from app.core.security import verify_password, hash_password, create_access_token, validate_password, get_current_user
from app.schemas.user import UserCreate, UserOut
from app.core.logging_config import logger

router = APIRouter(tags = ["Auth"])

class PasswordResetRequest(BaseModel):
    email: EmailStr

class ResetPasswordForm(BaseModel):
    new_password: str

@router.post("/register", response_model = UserOut)
async def register_user(user_in: UserCreate, 
                        db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(User.username == user_in.username).first()
        existing_email = db.query(User).filter(User.email == user_in.email).first()
        if existing_user:
            logger.warning(f"Registration attempt with taken username = '{user_in.username}'")
            raise HTTPException(status_code = 400, detail = "Username is taken")
        if existing_email:
            logger.warning(f"Registration attempt with already registered email = '{user_in.email}'")
            raise HTTPException(status_code = 400, detail = "Email is registered")
        if not validate_password(user_in.password):
            logger.warning(f"Weak password attempt during registration for username = '{user_in.username}'")
            raise HTTPException(status_code = 400, detail = "Password must consist of: at least 8 characters, at least 1 small letter, at least 1 capital letter, at least 1 number, at least 1 special character")
        user = User(email = user_in.email,
                    username = user_in.username,
                    hashed_password = hash_password(user_in.password),
                    account_type = AccountType(user_in.account_type))
        db.add(user)
        db.flush()
        if user.account_type == AccountType.worker:
            db.add(WorkerProfile(user_id = user.id))
        elif user.account_type == AccountType.employer:
            db.add(EmployerProfile(user_id = user.id,
                                   organization_name = user.username,
                                   is_verified = False,
                                   verification_status = VerificationStatus.pending))
        db.commit()
        db.refresh(user)
        logger.info(f"New user registered with id = {user.id}, username = '{user.username}', email = '{user.email}'")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while registering user '{user_in.username}': {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), 
          db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.username == form_data.username).first()
        if not user or not verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Failed login attempt for username = '{form_data.username}'")
            raise HTTPException(status_code = 400, detail = "Invalid login or password")
        if user.is_deleted:
            logger.warning(f"Deleted account login attempt for user id = {user.id}")
            raise HTTPException(status_code = 403, detail = "Account is deleted")
        access_token = create_access_token(data = {"sub": str(user.id)})
        logger.info(f"User id = {user.id} logged in successfully")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login for username = '{form_data.username}': {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")
    

@router.post("/extend-session")
def extend_session(current_user: User = Depends(get_current_user)):
    try:
        new_token = create_access_token(data={"sub": str(current_user.id)},expires_delta = timedelta(minutes = 10))
        logger.info(f"Session extended")
        return {"access_token": new_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Error while extending session", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")