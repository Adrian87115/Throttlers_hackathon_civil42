from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta

from app.db.session import get_db
from app.models.user import User
from app.models.user import AccountType
from app.models.marketplace import WorkerProfile, EmployerProfile, VerificationStatus
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    validate_password,
    get_current_user,
    decode_token_payload,
)
from app.schemas.user import UserCreate, UserOut
from app.core.logging_config import logger

router = APIRouter(tags = ["Auth"])

class PasswordResetRequest(BaseModel):
    email: EmailStr

class ResetPasswordForm(BaseModel):
    new_password: str


class RefreshTokenPayload(BaseModel):
    refreshToken: str


class TokenPairResponse(BaseModel):
    accessToken: str
    refreshToken: str


def _build_access_token_payload(user: User) -> dict:
    return {
        "sub": str(user.id),
        "email": user.email,
        "nickname": user.username,
    }


def _issue_token_pair(user: User) -> dict:
    payload = _build_access_token_payload(user)
    access_token = create_access_token(data = payload)
    refresh_token = create_refresh_token(data = payload)
    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "token_type": "bearer",
    }

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
async def login(request: Request,
                db: Session = Depends(get_db)):
    try:
        form_data = await request.form()
        body = {}

        if request.headers.get("content-type", "").startswith("application/json"):
            body = await request.json()

        login_identifier = (
            body.get("username")
            or body.get("email")
            or form_data.get("username")
            or form_data.get("email")
        )
        password = body.get("password") or form_data.get("password")

        if not login_identifier or not password:
            raise HTTPException(status_code = 400, detail = "Missing credentials")

        user = (
            db.query(User)
            .filter((User.username == login_identifier) | (User.email == login_identifier))
            .first()
        )
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"Failed login attempt for login identifier = '{login_identifier}'")
            raise HTTPException(status_code = 400, detail = "Invalid login or password")
        if user.is_deleted:
            logger.warning(f"Deleted account login attempt for user id = {user.id}")
            raise HTTPException(status_code = 403, detail = "Account is deleted")

        tokens = _issue_token_pair(user)
        logger.info(f"User id = {user.id} logged in successfully")
        return tokens
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")
    

@router.post("/extend-session")
def extend_session(current_user: User = Depends(get_current_user)):
    try:
        new_token = create_access_token(data = _build_access_token_payload(current_user), expires_delta = timedelta(minutes = 10))
        logger.info(f"Session extended")
        return {
            "accessToken": new_token,
            "access_token": new_token,
            "token_type": "bearer"
        }
    except Exception as e:
        logger.error(f"Error while extending session", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")


@router.post("/refresh-token", response_model = TokenPairResponse)
def refresh_token(payload: RefreshTokenPayload,
                  db: Session = Depends(get_db)):
    try:
        decoded = decode_token_payload(payload.refreshToken)
        if decoded.get("token_type") != "refresh":
            raise HTTPException(status_code = 401, detail = "Invalid refresh token")

        user_id = decoded.get("sub")
        if user_id is None:
            raise HTTPException(status_code = 401, detail = "Invalid refresh token")

        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code = 401, detail = "Invalid refresh token")
        if user.is_deleted:
            raise HTTPException(status_code = 403, detail = "Account is deleted")

        tokens = _issue_token_pair(user)
        return {
            "accessToken": tokens["accessToken"],
            "refreshToken": tokens["refreshToken"],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error while refreshing token", exc_info = True)
        raise HTTPException(status_code = 401, detail = "Invalid refresh token")


@router.delete("/me")
def delete_me(current_user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    try:
        if current_user.role == "owner":
            raise HTTPException(status_code = 403, detail = "Owner can not delete their own account")
        if current_user.is_deleted:
            raise HTTPException(status_code = 403, detail = "Account is already deleted")

        current_user.is_deleted = True
        db.add(current_user)
        db.commit()

        logger.info(f"User id = {current_user.id} deleted their account")
        return {"success": True}
    except Exception as e:
        logger.error("Error while deleting account", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")