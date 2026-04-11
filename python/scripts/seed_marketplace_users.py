from app.db.session import SessionLocal
from app.models.user import User, AccountType
from app.models.marketplace import WorkerProfile, EmployerProfile
from app.core.security import hash_password


USERS = [
    {
        "username": "admin_seed",
        "email": "admin_seed@example.com",
        "password": "SeedPass@123",
        "role": "admin",
        "account_type": AccountType.employer,
    },
    {
        "username": "worker_alice",
        "email": "worker_alice@example.com",
        "password": "SeedPass@123",
        "role": "user",
        "account_type": AccountType.worker,
    },
    {
        "username": "worker_bob",
        "email": "worker_bob@example.com",
        "password": "SeedPass@123",
        "role": "user",
        "account_type": AccountType.worker,
    },
    {
        "username": "employer_acme",
        "email": "employer_acme@example.com",
        "password": "SeedPass@123",
        "role": "user",
        "account_type": AccountType.employer,
    },
    {
        "username": "gov_ops",
        "email": "gov_ops@example.com",
        "password": "SeedPass@123",
        "role": "gov_service",
        "account_type": AccountType.employer,
    },
]


def ensure_user(db, spec):
    user = db.query(User).filter(User.username == spec["username"]).first()
    if not user:
        user = User(
            username = spec["username"],
            email = spec["email"],
            hashed_password = hash_password(spec["password"]),
            role = spec["role"],
            account_type = spec["account_type"],
            is_deleted = False,
        )
        db.add(user)
        db.flush()
        print(f"Created user: {user.username}")
    else:
        user.email = spec["email"]
        user.role = spec["role"]
        user.account_type = spec["account_type"]
        user.is_deleted = False
        user.hashed_password = hash_password(spec["password"])
        db.add(user)
        db.flush()
        print(f"Updated user: {user.username}")

    if user.account_type == AccountType.worker:
        profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == user.id).first()
        if not profile:
            db.add(WorkerProfile(user_id = user.id))
            print(f"Created worker profile: {user.username}")
    elif user.account_type == AccountType.employer:
        profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == user.id).first()
        if not profile:
            db.add(EmployerProfile(user_id = user.id, organization_name = user.username))
            print(f"Created employer profile: {user.username}")


def main():
    db = SessionLocal()
    try:
        for spec in USERS:
            ensure_user(db, spec)
        db.commit()
        print("Seed completed")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
