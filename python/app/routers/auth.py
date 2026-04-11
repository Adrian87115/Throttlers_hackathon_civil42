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
from app.auth.email import create_email_token, decode_email_token, send_verification_email, send_password_reset, is_email
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
                    account_type = AccountType(user_in.account_type),
                    is_verified = True) # FIXME: Forced verification for testing purposes
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
        token = create_email_token({"sub": user.email})
        await send_verification_email("Verify your account", user.email, token)
        logger.info(f"New user registered with id = {user.id}, username = '{user.username}', email = '{user.email}'")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while registering user '{user_in.username}': {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.get("/verify/{token}")
def verify_email(token: str, 
                 db: Session = Depends(get_db)):
    try:
        payload = decode_email_token(token)
        email: str = payload.get("sub")
        if email is None:
            logger.warning("Email verification failed: invalid token provided")
            raise HTTPException(status_code = 400, detail = "Invalid token")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"Email verification failed: no user found for email = '{email}'")
            raise HTTPException(status_code = 404, detail = "User not found")
        if user.is_deleted:
            logger.warning(f"Deleted user id = {user.id} attempted email verification")
            raise HTTPException(status_code = 403, detail = "Account is deleted")
        user.is_verified = True
        if user.account_type == AccountType.worker:
            user.is_active = True
        else:
            user.is_active = False
        db.commit()
        logger.info(f"User id = {user.id} successfully verified email = '{user.email}'")
        return RedirectResponse(url = f"http://localhost:3000/verify/{token}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during email verification with token = '{token}': {e}", exc_info = True)
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
        if not user.is_active:
            logger.warning(f"Inactive account login attempt for user id = {user.id}")
            raise HTTPException(status_code = 403, detail = "Account is inactive")
        access_token = create_access_token(data = {"sub": str(user.id)})
        logger.info(f"User id = {user.id} logged in successfully")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login for username = '{form_data.username}': {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")
    
@router.post("/reset-password/request")
async def request_password_reset(request: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    try:
        found_email = is_email(request.email, db)
        if found_email:
            token = create_email_token({"sub": request.email})
            reset_url = f"http://localhost:3000/auth/reset-password/{token}"
            await send_password_reset("Reset password", request.email, reset_url)
            logger.info(f"Password reset request initiated for email = '{request.email}'")
        else:
            logger.info(f"Password reset requested for non-existent email: '{request.email}'")
            raise HTTPException(status_code = 400, detail = "Email not found")
        return {"detail": "If this email exists in our system, a reset link has been sent."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while initiating password reset for email = '{request.email}': {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")

@router.post("/reset-password/{token}")
async def reset_password(token: str, 
                         form: ResetPasswordForm, 
                         db: Session = Depends(get_db)):
    try:
        if not validate_password(form.new_password):
            logger.warning(f"Weak password attempt during reset")
            raise HTTPException(status_code = 400, detail = "Weak password")
        payload = decode_email_token(token)
        if payload is None:
            logger.warning(f"Invalid or expired reset token")
            raise HTTPException(status_code = 400, detail = "Invalid or expired token")
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.warning(f"Password reset failed: no user found for email = '{email}'")
            raise HTTPException(status_code = 404, detail = "User not found")
        if user.is_deleted:
            logger.warning(f"Password reset failed: deleted user id = {user.id}")
            raise HTTPException(status_code = 403, detail = "Account is deleted")
        user.hashed_password = hash_password(form.new_password)
        db.add(user)
        db.commit()
        logger.info(f"Password reset successfully for user id = {user.id}, email = '{user.email}'")
        return {"detail": "Password has been reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error while resetting password with token: {e}", exc_info = True)
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