from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.logging_config import logger
from app.core.security import get_current_user, get_optional_current_user
from app.db.session import get_db
from app.models.marketplace import (
    Application,
    ContactChannel,
    ContactVisibility,
    EmployerProfile,
    Opportunity,
    OpportunityStatus,
    Skill,
    VerificationStatus,
    WorkerProfile,
)
from app.models.user import AccountType, User
from app.schemas.marketplace import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    ContactChannelCreate,
    ContactChannelOut,
    EmployerProfileOut,
    EmployerProfileUpdate,
    OpportunityCreate,
    OpportunityOut,
    OpportunityStatusUpdate,
    SkillCreate,
    SkillUpdate,
    SkillOut,
    WorkerProfileOut,
    WorkerProfileUpdate,
    WorkerSkillsUpdate,
)

router = APIRouter(tags = ["Marketplace"])


def _assert_active_account(user: User) -> None:
    if user.is_deleted:
        raise HTTPException(status_code = 403, detail = "Account is deleted")


def _has_gov_access(user: User) -> bool:
    return user.role in {"gov_service", "admin", "owner"}


def _is_service_account(user: User) -> bool:
    return user.role == "gov_service" and user.account_type == AccountType.employer


def _assert_service_owner(user: User, opportunity: Opportunity) -> None:
    if not _is_service_account(user):
        raise HTTPException(status_code = 403, detail = "Only service accounts can perform this action")
    if opportunity.employer_id != user.id:
        raise HTTPException(status_code = 403, detail = "Not allowed for this opportunity")


def _can_view_visibility(visibility: ContactVisibility, requester: User | None, owner_id: int) -> bool:
    if requester is None:
        return visibility == ContactVisibility.public
    if requester.id == owner_id:
        return True
    if visibility == ContactVisibility.public:
        return True
    if visibility == ContactVisibility.gov_only and _has_gov_access(requester):
        return True
    return False


def _as_worker_out(profile: WorkerProfile, include_exact: bool) -> WorkerProfileOut:
    return WorkerProfileOut(
        user_id = profile.user_id,
        username = profile.user.username,
        bio = profile.bio,
        experience_summary = profile.experience_summary,
        wants_paid = profile.wants_paid,
        wants_volunteer = profile.wants_volunteer,
        city = profile.city,
        region = profile.region,
        public_latitude = profile.public_latitude,
        public_longitude = profile.public_longitude,
        exact_latitude = profile.exact_latitude if include_exact else None,
        exact_longitude = profile.exact_longitude if include_exact else None,
        contact_visibility = profile.contact_visibility,
        is_available = profile.is_available,
        skills = [SkillOut.model_validate(skill) for skill in profile.skills],
    )


@router.get("/skills", response_model = list[SkillOut])
def list_skills(db: Session = Depends(get_db), _: User | None = Depends(get_optional_current_user)):
    skills = db.query(Skill).order_by(Skill.name.asc()).all()
    return skills


@router.post("/skills", response_model = SkillOut)
def create_skill(payload: SkillCreate,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if current_user.role not in {"admin", "owner"}:
        raise HTTPException(status_code = 403, detail = "Only admins can create skills")
    existing = db.query(Skill).filter(Skill.name == payload.name).first()
    if existing:
        raise HTTPException(status_code = 400, detail = "Skill already exists")
    skill = Skill(name = payload.name.strip(), category = payload.category)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.patch("/skills/{skill_id}", response_model = SkillOut)
def update_skill(skill_id: int,
                 payload: SkillUpdate,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if current_user.role not in {"admin", "owner"}:
        raise HTTPException(status_code = 403, detail = "Only admins can update skills")

    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code = 404, detail = "Skill not found")

    updates = payload.model_dump(exclude_unset = True)
    if "name" in updates:
        normalized_name = updates["name"].strip()
        duplicate = db.query(Skill).filter(Skill.name == normalized_name, Skill.id != skill_id).first()
        if duplicate:
            raise HTTPException(status_code = 400, detail = "Skill already exists")
        skill.name = normalized_name
    if "category" in updates:
        skill.category = updates["category"]

    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.delete("/skills/{skill_id}")
def delete_skill(skill_id: int,
                 db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if current_user.role not in {"admin", "owner"}:
        raise HTTPException(status_code = 403, detail = "Only admins can delete skills")

    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code = 404, detail = "Skill not found")

    db.delete(skill)
    db.commit()
    return {"detail": "Skill deleted"}


@router.patch("/workers/me", response_model = WorkerProfileOut)
def update_my_worker_profile(payload: WorkerProfileUpdate,
                             db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if current_user.account_type != AccountType.worker:
        raise HTTPException(status_code = 403, detail = "Only worker accounts can modify worker profile")

    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code = 404, detail = "Worker profile not found")

    updates = payload.model_dump(exclude_unset = True)
    for key, value in updates.items():
        setattr(profile, key, value)

    if profile.wants_paid is False and profile.wants_volunteer is False:
        raise HTTPException(status_code = 400, detail = "At least one compensation preference must be true")

    db.add(profile)
    db.commit()
    db.refresh(profile)
    db.refresh(profile.user)
    logger.info(f"Worker profile updated for user id = {current_user.id}")
    include_exact = _can_view_visibility(profile.contact_visibility, current_user, profile.user_id)
    return _as_worker_out(profile, include_exact = include_exact)


@router.patch("/workers/me/skills", response_model = WorkerProfileOut)
def update_my_worker_skills(payload: WorkerSkillsUpdate,
                            db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if current_user.account_type != AccountType.worker:
        raise HTTPException(status_code = 403, detail = "Only worker accounts can modify skills")

    profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code = 404, detail = "Worker profile not found")

    if payload.skill_ids:
        skills = db.query(Skill).filter(Skill.id.in_(payload.skill_ids)).all()
        if len(skills) != len(set(payload.skill_ids)):
            raise HTTPException(status_code = 400, detail = "One or more skills do not exist")
        profile.skills = skills
    else:
        profile.skills = []

    db.add(profile)
    db.commit()
    db.refresh(profile)
    db.refresh(profile.user)
    return _as_worker_out(profile, include_exact = True)


@router.get("/workers/search", response_model = list[WorkerProfileOut])
def search_workers(skill_ids: list[int] | None = Query(default = None),
                   wants_paid: bool | None = Query(default = None),
                   wants_volunteer: bool | None = Query(default = None),
                   city: str | None = Query(default = None),
                   region: str | None = Query(default = None),
                   min_lat: float | None = Query(default = None),
                   max_lat: float | None = Query(default = None),
                   min_lng: float | None = Query(default = None),
                   max_lng: float | None = Query(default = None),
                   db: Session = Depends(get_db),
                   current_user: User | None = Depends(get_optional_current_user)):
    if current_user is not None:
        _assert_active_account(current_user)

    query = db.query(WorkerProfile).join(User, User.id == WorkerProfile.user_id)
    query = query.filter(User.is_deleted.is_(False))

    if skill_ids:
        query = query.filter(WorkerProfile.skills.any(Skill.id.in_(skill_ids)))
    if wants_paid is not None:
        query = query.filter(WorkerProfile.wants_paid == wants_paid)
    if wants_volunteer is not None:
        query = query.filter(WorkerProfile.wants_volunteer == wants_volunteer)
    if city:
        query = query.filter(WorkerProfile.city.ilike(f"%{city}%"))
    if region:
        query = query.filter(WorkerProfile.region.ilike(f"%{region}%"))
    if min_lat is not None:
        query = query.filter(WorkerProfile.public_latitude >= min_lat)
    if max_lat is not None:
        query = query.filter(WorkerProfile.public_latitude <= max_lat)
    if min_lng is not None:
        query = query.filter(WorkerProfile.public_longitude >= min_lng)
    if max_lng is not None:
        query = query.filter(WorkerProfile.public_longitude <= max_lng)

    profiles = query.order_by(WorkerProfile.id.desc()).all()
    can_view_exact_any = _has_gov_access(current_user) if current_user is not None else False
    return [_as_worker_out(profile, include_exact = can_view_exact_any) for profile in profiles]


@router.post("/contacts/me", response_model = ContactChannelOut)
def add_my_contact_channel(payload: ContactChannelCreate,
                           db: Session = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    channel = ContactChannel(
        user_id = current_user.id,
        channel_type = payload.channel_type.strip(),
        channel_value = payload.channel_value.strip(),
        visibility = payload.visibility,
        is_primary = payload.is_primary,
    )
    if payload.is_primary:
        db.query(ContactChannel).filter(ContactChannel.user_id == current_user.id).update({"is_primary": False})
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


@router.get("/workers/{worker_user_id}/contacts", response_model = list[ContactChannelOut])
def get_worker_contacts(worker_user_id: int,
                        db: Session = Depends(get_db),
                        current_user: User | None = Depends(get_optional_current_user)):
    if current_user is not None:
        _assert_active_account(current_user)
    worker = db.query(WorkerProfile).filter(WorkerProfile.user_id == worker_user_id).first()
    if not worker:
        raise HTTPException(status_code = 404, detail = "Worker profile not found")

    channels = db.query(ContactChannel).filter(ContactChannel.user_id == worker_user_id).all()
    visible_channels = [
        channel
        for channel in channels
        if _can_view_visibility(channel.visibility, current_user, worker_user_id)
    ]
    return visible_channels


@router.get("/employers/me", response_model = EmployerProfileOut)
def get_my_employer_profile(db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if current_user.account_type != AccountType.employer:
        raise HTTPException(status_code = 403, detail = "Only employer accounts can view employer profile")

    profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code = 404, detail = "Employer profile not found")

    return EmployerProfileOut(
        user_id = current_user.id,
        username = current_user.username,
        organization_name = profile.organization_name,
        organization_description = profile.organization_description,
        is_government_service = profile.is_government_service,
        is_verified = profile.is_verified,
        verification_status = profile.verification_status.value,
    )


@router.patch("/employers/me", response_model = EmployerProfileOut)
def update_my_employer_profile(payload: EmployerProfileUpdate,
                               db: Session = Depends(get_db),
                               current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if current_user.account_type != AccountType.employer:
        raise HTTPException(status_code = 403, detail = "Only employer accounts can modify employer profile")

    profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code = 404, detail = "Employer profile not found")

    updates = payload.model_dump(exclude_unset = True)
    for key, value in updates.items():
        setattr(profile, key, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return EmployerProfileOut(
        user_id = current_user.id,
        username = current_user.username,
        organization_name = profile.organization_name,
        organization_description = profile.organization_description,
        is_government_service = profile.is_government_service,
        is_verified = profile.is_verified,
        verification_status = profile.verification_status.value,
    )


@router.post("/opportunities", response_model = OpportunityOut)
def create_opportunity(payload: OpportunityCreate,
                       db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if not _is_service_account(current_user):
        raise HTTPException(status_code = 403, detail = "Only service accounts can create opportunities")

    employer_profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == current_user.id).first()
    if not employer_profile:
        raise HTTPException(status_code = 404, detail = "Employer profile not found")
    if employer_profile.verification_status != VerificationStatus.approved or not employer_profile.is_verified:
        raise HTTPException(status_code = 403, detail = "Employer account is not approved by admin")

    skills = []
    if payload.skill_ids:
        skills = db.query(Skill).filter(Skill.id.in_(payload.skill_ids)).all()
        if len(skills) != len(set(payload.skill_ids)):
            raise HTTPException(status_code = 400, detail = "One or more skills do not exist")

    opportunity = Opportunity(
        employer_profile_id = employer_profile.id,
        employer_id = current_user.id,
        title = payload.title,
        description = payload.description,
        compensation_type = payload.compensation_type,
        budget_note = payload.budget_note,
        latitude = payload.latitude,
        longitude = payload.longitude,
        city = payload.city,
        region = payload.region,
    )
    opportunity.required_skills = skills

    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)

    return OpportunityOut(
        id = opportunity.id,
        employer_profile_id = opportunity.employer_profile_id,
        employer_id = opportunity.employer_id,
        title = opportunity.title,
        description = opportunity.description,
        compensation_type = opportunity.compensation_type,
        budget_note = opportunity.budget_note,
        latitude = opportunity.latitude,
        longitude = opportunity.longitude,
        city = opportunity.city,
        region = opportunity.region,
        status = opportunity.status,
        skills = [SkillOut.model_validate(skill) for skill in opportunity.required_skills],
    )


@router.patch("/opportunities/{opportunity_id}/status", response_model = OpportunityOut)
def update_opportunity_status(opportunity_id: int,
                              payload: OpportunityStatusUpdate,
                              db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)

    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id, Opportunity.is_deleted.is_(False)).first()
    if not opportunity:
        raise HTTPException(status_code = 404, detail = "Opportunity not found")

    _assert_service_owner(current_user, opportunity)

    if opportunity.status == OpportunityStatus.closed and payload.status != OpportunityStatus.closed:
        raise HTTPException(status_code = 400, detail = "Closed opportunity cannot be reopened")

    opportunity.status = payload.status
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)

    return OpportunityOut(
        id = opportunity.id,
        employer_profile_id = opportunity.employer_profile_id,
        employer_id = opportunity.employer_id,
        title = opportunity.title,
        description = opportunity.description,
        compensation_type = opportunity.compensation_type,
        budget_note = opportunity.budget_note,
        latitude = opportunity.latitude,
        longitude = opportunity.longitude,
        city = opportunity.city,
        region = opportunity.region,
        status = opportunity.status,
        skills = [SkillOut.model_validate(skill) for skill in opportunity.required_skills],
    )


@router.delete("/opportunities/{opportunity_id}")
def delete_opportunity(opportunity_id: int,
                       db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)

    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id, Opportunity.is_deleted.is_(False)).first()
    if not opportunity:
        raise HTTPException(status_code = 404, detail = "Opportunity not found")

    _assert_service_owner(current_user, opportunity)

    opportunity.is_deleted = True
    opportunity.status = OpportunityStatus.closed
    db.add(opportunity)
    db.commit()
    return {"detail": "Opportunity deleted"}


@router.get("/opportunities", response_model = list[OpportunityOut])
def list_opportunities(skill_ids: list[int] | None = Query(default = None),
                       city: str | None = Query(default = None),
                       region: str | None = Query(default = None),
                       min_lat: float | None = Query(default = None),
                       max_lat: float | None = Query(default = None),
                       min_lng: float | None = Query(default = None),
                       max_lng: float | None = Query(default = None),
                       db: Session = Depends(get_db),
                       current_user: User | None = Depends(get_optional_current_user)):
    if current_user is not None:
        _assert_active_account(current_user)

    query = db.query(Opportunity).filter(
        Opportunity.is_deleted.is_(False),
        Opportunity.status == OpportunityStatus.open,
    )

    if skill_ids:
        query = query.filter(Opportunity.required_skills.any(Skill.id.in_(skill_ids)))
    if city:
        query = query.filter(Opportunity.city.ilike(f"%{city}%"))
    if region:
        query = query.filter(Opportunity.region.ilike(f"%{region}%"))
    if min_lat is not None:
        query = query.filter(Opportunity.latitude >= min_lat)
    if max_lat is not None:
        query = query.filter(Opportunity.latitude <= max_lat)
    if min_lng is not None:
        query = query.filter(Opportunity.longitude >= min_lng)
    if max_lng is not None:
        query = query.filter(Opportunity.longitude <= max_lng)

    opportunities = query.order_by(Opportunity.id.desc()).all()
    return [
        OpportunityOut(
            id = opportunity.id,
            employer_profile_id = opportunity.employer_profile_id,
            employer_id = opportunity.employer_id,
            title = opportunity.title,
            description = opportunity.description,
            compensation_type = opportunity.compensation_type,
            budget_note = opportunity.budget_note,
            latitude = opportunity.latitude,
            longitude = opportunity.longitude,
            city = opportunity.city,
            region = opportunity.region,
            status = opportunity.status,
            skills = [SkillOut.model_validate(skill) for skill in opportunity.required_skills],
        )
        for opportunity in opportunities
    ]


@router.post("/opportunities/{opportunity_id}/apply", response_model = ApplicationOut)
def apply_to_opportunity(opportunity_id: int,
                         payload: ApplicationCreate,
                         db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)
    if current_user.account_type != AccountType.worker:
        raise HTTPException(status_code = 403, detail = "Only worker accounts can apply")

    worker_profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == current_user.id).first()
    if not worker_profile:
        raise HTTPException(status_code = 404, detail = "Worker profile not found")

    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id, Opportunity.is_deleted.is_(False)).first()
    if not opportunity:
        raise HTTPException(status_code = 404, detail = "Opportunity not found")
    if opportunity.status != OpportunityStatus.open:
        raise HTTPException(status_code = 400, detail = "Opportunity is not open")

    existing = db.query(Application).filter(
        Application.opportunity_id == opportunity_id,
        Application.worker_profile_id == worker_profile.id,
    ).first()
    if existing:
        raise HTTPException(status_code = 400, detail = "Already applied")

    application = Application(
        opportunity_id = opportunity_id,
        worker_profile_id = worker_profile.id,
        worker_id = current_user.id,
        message = payload.message,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/opportunities/{opportunity_id}/applications", response_model = list[ApplicationOut])
def list_opportunity_applications(opportunity_id: int,
                                  db: Session = Depends(get_db),
                                  current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)

    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code = 404, detail = "Opportunity not found")

    _assert_service_owner(current_user, opportunity)

    applications = db.query(Application).filter(Application.opportunity_id == opportunity_id).order_by(Application.id.desc()).all()
    return applications


@router.patch("/opportunities/{opportunity_id}/applications/{application_id}/status", response_model = ApplicationOut)
def update_application_status(opportunity_id: int,
                              application_id: int,
                              payload: ApplicationStatusUpdate,
                              db: Session = Depends(get_db),
                              current_user: User = Depends(get_current_user)):
    _assert_active_account(current_user)

    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id, Opportunity.is_deleted.is_(False)).first()
    if not opportunity:
        raise HTTPException(status_code = 404, detail = "Opportunity not found")

    _assert_service_owner(current_user, opportunity)

    application = db.query(Application).filter(
        Application.id == application_id,
        Application.opportunity_id == opportunity_id,
    ).first()
    if not application:
        raise HTTPException(status_code = 404, detail = "Application not found")

    if payload.status == "completed" and application.status != "accepted":
        raise HTTPException(status_code = 400, detail = "Only accepted applications can be completed")

    application.status = payload.status
    db.add(application)
    db.commit()
    db.refresh(application)
    return application
