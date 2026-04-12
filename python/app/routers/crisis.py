from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.logging_config import logger
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.crisis import (Crisis, CrisisRequest, CrisisResponse,
                               CrisisSeverity, CrisisStatus)
from app.models.marketplace import WorkerProfile
from app.models.user import AccountType, User
from app.schemas.crisis import (CrisisDataOut, CrisisNotifyOut,
                                CrisisRequestCreateIn, CrisisRequestOut,
                                CrisisResponderOut, CrisisStartIn)

router = APIRouter(tags = ["Crisis"])


def _can_manage_crisis(user: User) -> bool:
    if user.is_deleted:
        return False
    if user.role in {"owner", "gov_service"}:
        return True
    return user.account_type == AccountType.employer


def _get_active_crisis(db: Session) -> Crisis | None:
    return (
        db.query(Crisis)
        .filter(Crisis.status == CrisisStatus.active)
        .order_by(Crisis.started_at.desc())
        .first()
    )


@router.get("/active", response_model = CrisisDataOut | None)
def get_active_crisis(db: Session = Depends(get_db)):
    return _get_active_crisis(db)


@router.post("/start", response_model = CrisisDataOut)
def start_crisis(payload: CrisisStartIn,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    if not _can_manage_crisis(current_user):
        raise HTTPException(status_code = 403, detail = "Not allowed to start crisis")

    existing = _get_active_crisis(db)
    if existing is not None:
        raise HTTPException(status_code = 409, detail = "Another crisis is already active")

    crisis = Crisis(
        title = payload.title,
        description = payload.description,
        severity = payload.severity,
        status = CrisisStatus.active,
        affected_districts = payload.affected_districts,
        created_by = current_user.id,
    )
    db.add(crisis)
    db.commit()
    db.refresh(crisis)
    logger.info(f"Crisis started id = {crisis.id} by user id = {current_user.id}")
    return crisis


@router.post("/{crisis_id}/end", response_model = CrisisDataOut)
def end_crisis(crisis_id: int,
               db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    crisis = db.query(Crisis).filter(Crisis.id == crisis_id).first()
    if crisis is None or crisis.status != CrisisStatus.active:
        raise HTTPException(status_code = 404, detail = "Active crisis not found")

    if not _can_manage_crisis(current_user) and crisis.created_by != current_user.id:
        raise HTTPException(status_code = 403, detail = "Not allowed to end crisis")

    crisis.status = CrisisStatus.ended
    crisis.ended_at = datetime.now(timezone.utc)
    db.add(crisis)
    db.commit()
    db.refresh(crisis)
    logger.info(f"Crisis ended id = {crisis.id} by user id = {current_user.id}")
    return crisis


@router.post("/{crisis_id}/requests", response_model = CrisisRequestOut)
def create_crisis_request(crisis_id: int,
                          payload: CrisisRequestCreateIn,
                          db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    if current_user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account is deleted")

    crisis = db.query(Crisis).filter(Crisis.id == crisis_id).first()
    if crisis is None:
        raise HTTPException(status_code = 404, detail = "Crisis not found")
    if crisis.status != CrisisStatus.active:
        raise HTTPException(status_code = 409, detail = "Crisis is not active")

    request = CrisisRequest(
        crisis_id = crisis_id,
        district_id = payload.district_id,
        title = payload.title,
        description = payload.description,
        needed_categories = payload.needed_categories,
        priority = payload.priority,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("/{crisis_id}/responders", response_model = list[CrisisResponderOut])
def get_crisis_responders(crisis_id: int,
                          db: Session = Depends(get_db),
                          _: User = Depends(get_current_user)):
    crisis = db.query(Crisis).filter(Crisis.id == crisis_id).first()
    if crisis is None:
        raise HTTPException(status_code = 404, detail = "Crisis not found")

    rows = (
        db.query(CrisisResponse, User, WorkerProfile)
        .join(User, User.id == CrisisResponse.user_id)
        .outerjoin(WorkerProfile, WorkerProfile.user_id == User.id)
        .filter(CrisisResponse.crisis_id == crisis_id)
        .all()
    )

    response: list[CrisisResponderOut] = []
    for crisis_response, user, worker_profile in rows:
        full_name = user.username
        category = None
        district = user.district
        available = None
        role = user.role

        if worker_profile is not None:
            if worker_profile.first_name or worker_profile.last_name:
                first_name = worker_profile.first_name or ""
                last_name = worker_profile.last_name or ""
                full_name = f"{first_name} {last_name}".strip()
            category = worker_profile.category
            available = worker_profile.is_available
            if worker_profile.role:
                role = worker_profile.role

        response.append(
            CrisisResponderOut(
                user_id = user.id,
                name = full_name,
                role = role,
                category = category,
                district = district,
                available = available,
                responded_positively = crisis_response.responded_positively,
            )
        )
    return response


@router.post("/{crisis_id}/notify", response_model = CrisisNotifyOut)
def notify_crisis(crisis_id: int,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    if not _can_manage_crisis(current_user):
        raise HTTPException(status_code = 403, detail = "Not allowed to notify responders")

    crisis = db.query(Crisis).filter(Crisis.id == crisis_id).first()
    if crisis is None:
        raise HTTPException(status_code = 404, detail = "Crisis not found")
    if crisis.status != CrisisStatus.active:
        raise HTTPException(status_code = 409, detail = "Crisis is not active")

    worker_rows = (
        db.query(User.id)
        .join(WorkerProfile, WorkerProfile.user_id == User.id)
        .filter(
            User.is_deleted.is_(False),
            User.account_type == AccountType.worker,
            WorkerProfile.is_available.is_(True),
        )
        .all()
    )

    notified_count = 0
    for (user_id,) in worker_rows:
        existing = (
            db.query(CrisisResponse)
            .filter(CrisisResponse.crisis_id == crisis_id, CrisisResponse.user_id == user_id)
            .first()
        )
        if existing is None:
            db.add(
                CrisisResponse(
                    crisis_id = crisis_id,
                    user_id = user_id,
                    responded_positively = False,
                    responded_at = None,
                )
            )
            notified_count += 1

    db.commit()
    logger.info(f"Crisis notify id = {crisis_id}, notified users = {notified_count}")
    return CrisisNotifyOut(notified = notified_count)
