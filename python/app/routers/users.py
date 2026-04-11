from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.logging_config import logger
from app.core.security import get_current_user, get_current_user_allow_inactive, hash_password, validate_password, verify_password
from app.db.session import get_db
from app.models.marketplace import EmployerProfile, VerificationStatus
from app.models.user import AccountType, User
from app.schemas.user import SafeUserOut, UserOutAdvanced, UserPublicOut

router = APIRouter(tags = ["Users"])


def require_role(required_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(status_code = 403, detail = f"Operation requires one of the roles: {', '.join(required_roles)}")
        return current_user

    return role_checker


def _assert_owner_access(current_user: User) -> None:
    if current_user.role != "owner":
        raise HTTPException(status_code = 403, detail = "Only owner can perform this action")
    if current_user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account is deleted")


def _assert_owner_target_constraints(actor: User, target: User) -> None:
    if target.role == "owner":
        raise HTTPException(status_code = 403, detail = "Owner account can not be modified")
    if target.id == actor.id:
        raise HTTPException(status_code = 400, detail = "Can not modify your own account with this endpoint")


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class RoleUpdate(BaseModel):
    role: Literal["user"]


class VerificationApproveRequest(BaseModel):
    target: Literal["employer", "gov_service"] = "employer"


class VerificationRejectRequest(BaseModel):
    target: Literal["employer", "gov_service"] = "employer"


class VerificationRequest(BaseModel):
    target: Literal["employer", "gov_service"] = "employer"


class PendingVerificationOut(BaseModel):
    user_id: int
    username: str
    email: str
    target: str
    verification_status: str


@router.get("/me", response_model = SafeUserOut)
def read_user_me(current_user: User = Depends(get_current_user)):
    user_data = SafeUserOut(
        id = current_user.id,
        username = current_user.username,
        email = current_user.email,
        role = current_user.role,
        account_type = current_user.account_type.value if current_user.account_type else None,
        isOwner = current_user.role == "owner",
    )
    logger.info(f"User id = {current_user.id} requested their profile")
    return user_data


@router.patch("/me/change-password")
def change_password(payload: ChangePasswordRequest,
                    db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if not validate_password(payload.new_password):
        raise HTTPException(status_code = 400, detail = "Password must consist of: at least 8 characters, at least 1 small letter, at least 1 capital letter, at least 1 number, at least 1 special character")
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code = 400, detail = "Invalid old password")

    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    logger.info(f"User id = {current_user.id} changed their password successfully")
    return {"detail": "Password updated successfully"}


@router.post("/me/verification-request")
def request_verification(payload: VerificationRequest,
                         db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user_allow_inactive)):
    if current_user.account_type != AccountType.employer:
        raise HTTPException(status_code = 403, detail = "Only employer accounts can request verification")
    if current_user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account is deleted")

    employer_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not employer_profile:
        raise HTTPException(status_code = 404, detail = "Employer profile not found")

    employer_profile.verification_status = VerificationStatus.pending
    employer_profile.is_verified = False
    employer_profile.is_government_service = payload.target == "gov_service"
    if payload.target == "employer" and current_user.role == "gov_service":
        current_user.role = "user"

    db.add(employer_profile)
    db.add(current_user)
    db.commit()
    logger.info(f"User id = {current_user.id} requested verification target = {payload.target}")
    return {"detail": f"Verification request submitted for {payload.target}"}


@router.get("/", response_model = list[UserPublicOut])
def list_users(db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(status_code = 403, detail = "Only owner can list users")
    users = db.query(User).all()
    logger.info(f"Retrieved list of all users, count = {len(users)}")
    return users


@router.put("/{user_id}/role")
def update_user_role(user_id: int,
                     role_update: RoleUpdate,
                     db: Session = Depends(get_db),
                     current_user: User = Depends(require_role(["owner"]))):
    _assert_owner_access(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")
    if user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account was deleted")

    _assert_owner_target_constraints(current_user, user)

    if user.role == "gov_service" and role_update.role != "user":
        raise HTTPException(status_code = 400, detail = "Gov service account can only be demoted to user by role endpoint")

    if user.role == "gov_service" and role_update.role == "user":
        employer_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == user.id).first()
        if employer_profile:
            employer_profile.is_government_service = False
            db.add(employer_profile)

    user.role = role_update.role
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"User id = {current_user.id} updated role for user id = {user.id} to {user.role}")
    return {"id": user.id, "username": user.username, "role": user.role}


@router.get("/advanced", response_model = list[UserOutAdvanced])
def list_users_advanced(db: Session = Depends(get_db),
                        _: User = Depends(require_role(["owner"]))):
    users = db.query(User).all()
    logger.info(f"Retrieved advanced list of all users, count = {len(users)}")
    return users


@router.get("/owner/verifications/pending", response_model = list[PendingVerificationOut])
def list_pending_verifications(target: str = Query(default = "all"),
                               db: Session = Depends(get_db),
                               current_user: User = Depends(require_role(["owner"]))):
    _assert_owner_access(current_user)

    if target not in {"all", "employer", "gov_service"}:
        raise HTTPException(status_code = 400, detail = "target must be one of: all, employer, gov_service")

    query = db.query(User, EmployerProfile).join(EmployerProfile, EmployerProfile.user_id == User.id)
    query = query.filter(
        User.is_deleted.is_(False),
        User.account_type == AccountType.employer,
        EmployerProfile.verification_status == VerificationStatus.pending,
    )

    if target == "employer":
        query = query.filter(EmployerProfile.is_government_service.is_(False))
    elif target == "gov_service":
        query = query.filter(EmployerProfile.is_government_service.is_(True))

    rows = query.order_by(User.id.desc()).all()
    return [
        PendingVerificationOut(
            user_id = user.id,
            username = user.username,
            email = user.email,
            target = "gov_service" if profile.is_government_service else "employer",
            verification_status = profile.verification_status.value,
        )
        for user, profile in rows
    ]


@router.patch("/owner/verifications/{user_id}/approve")
def approve_verification(user_id: int,
                         payload: VerificationApproveRequest,
                         db: Session = Depends(get_db),
                         current_user: User = Depends(require_role(["owner"]))):
    _assert_owner_access(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")
    if user.account_type != AccountType.employer:
        raise HTTPException(status_code = 400, detail = "Only employer accounts can be approved by this endpoint")
    if user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account was deleted")
    _assert_owner_target_constraints(current_user, user)

    employer_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == user.id).first()
    if not employer_profile:
        raise HTTPException(status_code = 404, detail = "Employer profile not found")

    if payload.target == "gov_service":
        employer_profile.is_government_service = True
        user.role = "gov_service"
    else:
        employer_profile.is_government_service = False
        if user.role == "gov_service":
            user.role = "user"

    employer_profile.verification_status = VerificationStatus.approved
    employer_profile.is_verified = True

    db.add(employer_profile)
    db.add(user)
    db.commit()
    logger.info(f"User id = {current_user.id} approved verification for user id = {user.id}, target = {payload.target}")
    return {"detail": f"Verification approved for {payload.target}", "user_id": user.id}


@router.patch("/owner/verifications/{user_id}/reject")
def reject_verification(user_id: int,
                        payload: VerificationRejectRequest,
                        db: Session = Depends(get_db),
                        current_user: User = Depends(require_role(["owner"]))):
    _assert_owner_access(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")
    if user.account_type != AccountType.employer:
        raise HTTPException(status_code = 400, detail = "Only employer accounts can be rejected by this endpoint")
    if user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account was deleted")
    _assert_owner_target_constraints(current_user, user)

    employer_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == user.id).first()
    if not employer_profile:
        raise HTTPException(status_code = 404, detail = "Employer profile not found")

    if payload.target == "gov_service":
        employer_profile.is_government_service = False
        if user.role == "gov_service":
            user.role = "user"

    employer_profile.verification_status = VerificationStatus.rejected
    employer_profile.is_verified = False

    db.add(employer_profile)
    db.add(user)
    db.commit()
    logger.info(f"User id = {current_user.id} rejected verification for user id = {user.id}, target = {payload.target}")
    return {"detail": f"Verification rejected for {payload.target}", "user_id": user.id}


def soft_delete_user(db: Session, user: User):
    user.is_deleted = True
    db.add(user)
    db.commit()


@router.delete("/me")
def delete_account(db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    if current_user.role == "owner":
        raise HTTPException(status_code = 403, detail = "Owner can not delete their own account")
    if current_user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account is already deleted")
    soft_delete_user(db, current_user)
    logger.info(f"User id = {current_user.id} deleted their account")
    return {"detail": "Your account has been deleted"}


@router.delete("/{user_id}")
def delete_user(user_id: int,
                db: Session = Depends(get_db),
                current_user: User = Depends(require_role(["owner"]))):
    _assert_owner_access(current_user)

    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code = 404, detail = "User not found")
    if user_to_delete.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account is already deleted")

    _assert_owner_target_constraints(current_user, user_to_delete)

    soft_delete_user(db, user_to_delete)
    logger.info(f"User id = {current_user.id} deleted user id = {user_to_delete.id}")
    return {"detail": "User deleted successfully"}



@router.get("/user-management", response_model = list[UserOutAdvanced])
def user_management(show_role: str = "all",
                    db: Session = Depends(get_db),
                    current_user: User = Depends(require_role(["owner"]))):
    _assert_owner_access(current_user)

    if show_role not in ["all", "user", "owner", "gov_service"]:
        raise HTTPException(status_code = 400, detail = "Incorrect role to show")

    query = db.query(User)
    if show_role != "all":
        query = query.filter(User.role == show_role)

    users = query.all()
    logger.info(f"User id = {current_user.id}, role = {current_user.role}, requested {len(users)} users (show_role = {show_role})")
    return users


def get_username_from_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code = 404, detail = f"User with id {user_id} not found")
    return user.username


@router.get("/{id}", response_model = UserPublicOut)
def get_user(id: int,
             db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(status_code = 403, detail = "Only owner can view user details")
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")
    return user
