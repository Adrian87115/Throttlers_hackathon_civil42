import re
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, model_validator
from sqlalchemy.orm import Session

from app.core.logging_config import logger
from app.core.security import (create_access_token, create_refresh_token,
                               decode_token_payload, get_current_user,
                               hash_password, validate_password,
                               verify_password)
from app.db.session import get_db
from app.models.marketplace import (EmployerProfile, VerificationStatus,
                                    WorkerProfile)
from app.models.user import AccountType, User
from app.schemas.user import UserCreate, UserOut

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


class RegisterUserRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterCompanyRequest(BaseModel):
    email: EmailStr
    password: str
    confirmPassword: str
    orgName: str
    nip: str
    regon: str
    orgAddress: str
    orgPhone: str
    contactPerson: str
    institutionType: str | None = None

    @model_validator(mode = "after")
    def validate_password_confirmation(self):
        if self.password != self.confirmPassword:
            raise ValueError("Passwords do not match")
        return self


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


def _build_username_from_email(email: str, db: Session) -> str:
    base_username = re.sub(r"[^a-zA-Z0-9._-]", "", email.split("@")[0]).strip("._-")
    if not base_username:
        base_username = "user"

    candidate = base_username
    suffix = 1
    while db.query(User).filter(User.username == candidate).first() is not None:
        suffix += 1
        candidate = f"{base_username}{suffix}"
    return candidate


@router.post("/register-user", response_model = UserOut)
async def register_basic_user(user_in: RegisterUserRequest,
                              db: Session = Depends(get_db)):
    try:
        existing_email = db.query(User).filter(User.email == user_in.email).first()
        if existing_email:
            logger.warning(f"Registration attempt with already registered email = '{user_in.email}'")
            raise HTTPException(status_code = 400, detail = "Email is registered")
        if not validate_password(user_in.password):
            logger.warning(f"Weak password attempt during registration for email = '{user_in.email}'")
            raise HTTPException(status_code = 400, detail = "Password must consist of: at least 8 characters, at least 1 small letter, at least 1 capital letter, at least 1 number, at least 1 special character")

        generated_username = _build_username_from_email(user_in.email, db)
        user = User(email = user_in.email,
                    username = generated_username,
                    hashed_password = hash_password(user_in.password),
                    account_type = AccountType.worker)
        db.add(user)
        db.flush()
        db.add(WorkerProfile(user_id = user.id))
        db.commit()
        db.refresh(user)

        logger.info(f"New basic user registered with id = {user.id}, email = '{user.email}'")
        return user
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error while registering basic user '{user_in.email}': {e}", exc_info = True)
        raise HTTPException(status_code = 500, detail = "Internal server error")


@router.post("/register-company", response_model = UserOut)
async def register_company(company_in: RegisterCompanyRequest,
                           db: Session = Depends(get_db)):
    try:
        existing_email = db.query(User).filter(User.email == company_in.email).first()
        if existing_email:
            logger.warning(f"Company registration attempt with already registered email = '{company_in.email}'")
            raise HTTPException(status_code = 400, detail = "Email is registered")
        if not validate_password(company_in.password):
            logger.warning(f"Weak password attempt during company registration for email = '{company_in.email}'")
            raise HTTPException(status_code = 400, detail = "Password must consist of: at least 8 characters, at least 1 small letter, at least 1 capital letter, at least 1 number, at least 1 special character")

        normalized_org_name = company_in.orgName.strip()
        if not normalized_org_name:
            raise HTTPException(status_code = 400, detail = "orgName is required")

        existing_org_user = db.query(User).filter(User.username == normalized_org_name).first()
        if existing_org_user:
            logger.warning(f"Company registration attempt with taken orgName = '{normalized_org_name}'")
            raise HTTPException(status_code = 400, detail = "Organization name is taken")

        user = User(email = company_in.email,
                    username = normalized_org_name,
                    hashed_password = hash_password(company_in.password),
                    account_type = AccountType.employer)
        db.add(user)
        db.flush()

        is_government_service = bool(company_in.institutionType and company_in.institutionType.strip())
        details = (
            f"NIP: {company_in.nip}; REGON: {company_in.regon}; Address: {company_in.orgAddress}; "
            f"Phone: {company_in.orgPhone}; Contact: {company_in.contactPerson}; "
            f"InstitutionType: {company_in.institutionType or 'private'}"
        )
        db.add(EmployerProfile(user_id = user.id,
                               organization_name = normalized_org_name,
                               organization_description = details,
                               is_government_service = is_government_service,
                               is_verified = False,
                               verification_status = VerificationStatus.pending))
        db.commit()
        db.refresh(user)

        logger.info(f"New company registered with id = {user.id}, username = '{user.username}', email = '{user.email}'")
        return user
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error while registering company '{company_in.email}': {e}", exc_info = True)
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