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
from app.models.marketplace import (EmployerProfile, Skill, VerificationStatus,
                                    WorkerProfile)
from app.models.user import AccountType, User
from app.schemas.user import (ProfileUpdateRequest, SkillSummaryOut,
                              UnifiedProfileMeOut, UserOut)

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
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    confirmPassword: str
    city: str | None = None
    district: str | None = None
    phone: str | None = None

    @model_validator(mode = "after")
    def validate_password_confirmation(self):
        if self.password != self.confirmPassword:
            raise ValueError("Passwords do not match")
        return self


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


def _parse_key_value_description(description: str | None) -> dict[str, str | None]:
    parsed = {
        "nip": None,
        "regon": None,
        "org_address": None,
        "org_phone": None,
        "contact_person": None,
        "institution_type": None,
    }
    if not description:
        return parsed

    patterns = {
        "nip": r"NIP:\s*([^;]+)",
        "regon": r"REGON:\s*([^;]+)",
        "org_address": r"Address:\s*([^;]+)",
        "org_phone": r"Phone:\s*([^;]+)",
        "contact_person": r"Contact:\s*([^;]+)",
        "institution_type": r"InstitutionType:\s*([^;]+)",
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, description)
        if match:
            parsed[key] = match.group(1).strip()
    return parsed


def _resolve_skills(db: Session, skills_value: str | list[str] | None) -> list[Skill]:
    if skills_value is None:
        return []

    if isinstance(skills_value, str):
        skill_names = [part.strip() for part in skills_value.split(",") if part.strip()]
    else:
        skill_names = [part.strip() for part in skills_value if part and part.strip()]

    resolved_skills: list[Skill] = []
    for skill_name in skill_names:
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        if skill is None:
            skill = Skill(name = skill_name)
            db.add(skill)
            db.flush()
        resolved_skills.append(skill)
    return resolved_skills


def _serialize_worker_profile(current_user: User, worker_profile: WorkerProfile) -> UnifiedProfileMeOut:
    return UnifiedProfileMeOut(
        id = current_user.id,
        email = current_user.email,
        username = current_user.username,
        account_type = "user",
        first_name = worker_profile.first_name,
        last_name = worker_profile.last_name,
        phone = current_user.phone,
        city = current_user.city,
        district = current_user.district,
        skills = [SkillSummaryOut.model_validate(skill) for skill in worker_profile.skills],
        experience_years = worker_profile.experience_years,
        category = worker_profile.category,
        role = worker_profile.role,
        available = worker_profile.is_available,
        organization_name = None,
        nip = None,
        regon = None,
        org_address = None,
        org_phone = None,
        contact_person = None,
        institution_type = None,
        is_government_service = None,
        is_verified = None,
        verification_status = None,
    )


def _serialize_employer_profile(current_user: User, employer_profile: EmployerProfile) -> UnifiedProfileMeOut:
    parsed_details = _parse_key_value_description(employer_profile.organization_description)
    return UnifiedProfileMeOut(
        id = current_user.id,
        email = current_user.email,
        username = current_user.username,
        account_type = "employer",
        first_name = None,
        last_name = None,
        phone = current_user.phone,
        city = current_user.city,
        district = current_user.district,
        skills = [],
        experience_years = None,
        category = None,
        role = None,
        available = None,
        organization_name = employer_profile.organization_name,
        nip = employer_profile.nip or parsed_details["nip"],
        regon = employer_profile.regon or parsed_details["regon"],
        org_address = employer_profile.org_address or parsed_details["org_address"],
        org_phone = employer_profile.org_phone or parsed_details["org_phone"],
        contact_person = employer_profile.contact_person or parsed_details["contact_person"],
        institution_type = employer_profile.institution_type or parsed_details["institution_type"],
        is_government_service = employer_profile.is_government_service,
        is_verified = employer_profile.is_verified,
        verification_status = employer_profile.verification_status.value,
    )


def _serialize_current_profile(current_user: User, db: Session) -> UnifiedProfileMeOut:
    if current_user.account_type == AccountType.worker:
        worker_profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
        if not worker_profile:
            raise HTTPException(status_code = 404, detail = "Worker profile not found")
        return _serialize_worker_profile(current_user, worker_profile)

    if current_user.account_type == AccountType.employer:
        employer_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
        if not employer_profile:
            raise HTTPException(status_code = 404, detail = "Employer profile not found")
        return _serialize_employer_profile(current_user, employer_profile)

    raise HTTPException(status_code = 400, detail = "Unsupported account type")


@router.get("/me/profile", response_model = UnifiedProfileMeOut)
def read_my_profile(db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if current_user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account is deleted")
    return _serialize_current_profile(current_user, db)


@router.patch("/me/profile", response_model = UnifiedProfileMeOut)
def update_my_profile(payload: ProfileUpdateRequest,
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    if current_user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account is deleted")

    updates = payload.model_dump(exclude_unset = True)

    if "username" in updates:
        new_username = updates["username"]
        if new_username is not None:
            existing_user = db.query(User).filter(User.username == new_username, User.id != current_user.id).first()
            if existing_user:
                raise HTTPException(status_code = 400, detail = "Username is taken")
        current_user.username = new_username

    for field_name in ("phone", "city", "district"):
        if field_name in updates:
            setattr(current_user, field_name, updates[field_name])

    if current_user.account_type == AccountType.worker:
        worker_profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
        if not worker_profile:
            raise HTTPException(status_code = 404, detail = "Worker profile not found")

        worker_field_map = {
            "first_name": "first_name",
            "last_name": "last_name",
            "role": "role",
            "experience_years": "experience_years",
            "category": "category",
            "available": "is_available",
        }
        for request_field, model_field in worker_field_map.items():
            if request_field in updates:
                setattr(worker_profile, model_field, updates[request_field])

        if "skills" in updates:
            worker_profile.skills = _resolve_skills(db, updates["skills"])

        db.add(worker_profile)
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        db.refresh(worker_profile)
        return _serialize_worker_profile(current_user, worker_profile)

    if current_user.account_type == AccountType.employer:
        employer_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
        if not employer_profile:
            raise HTTPException(status_code = 404, detail = "Employer profile not found")

        employer_field_map = {
            "organization_name": "organization_name",
            "nip": "nip",
            "regon": "regon",
            "org_address": "org_address",
            "org_phone": "org_phone",
            "contact_person": "contact_person",
            "institution_type": "institution_type",
        }
        for request_field, model_field in employer_field_map.items():
            if request_field in updates:
                setattr(employer_profile, model_field, updates[request_field])

        db.add(employer_profile)
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        db.refresh(employer_profile)
        return _serialize_employer_profile(current_user, employer_profile)

    raise HTTPException(status_code = 400, detail = "Unsupported account type")


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
                    account_type = AccountType.worker,
                    city = user_in.city,
                    district = user_in.district,
                    phone = user_in.phone)
        db.add(user)
        db.flush()
        db.add(WorkerProfile(user_id = user.id,
                     first_name = user_in.first_name,
                     last_name = user_in.last_name))
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
                    account_type = AccountType.employer,
                    phone = company_in.orgPhone)
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
                               nip = company_in.nip,
                               regon = company_in.regon,
                               org_address = company_in.orgAddress,
                               org_phone = company_in.orgPhone,
                               contact_person = company_in.contactPerson,
                               institution_type = company_in.institutionType,
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