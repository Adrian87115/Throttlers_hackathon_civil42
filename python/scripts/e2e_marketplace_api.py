import json
import time
from urllib import parse, request
from urllib.error import HTTPError, URLError

from sqlalchemy import text

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.marketplace import EmployerProfile, WorkerProfile
from app.models.user import AccountType, User


BASE_URL = "http://127.0.0.1:8000"
SEED_PASSWORD = "SeedPass@123"


class ApiError(Exception):
    def __init__(self, method: str, path: str, status: int, detail):
        self.method = method
        self.path = path
        self.status = status
        self.detail = detail
        super().__init__(f"{method} {path} failed ({status}): {detail}")


def assert_true(condition: bool, message: str):
    if not condition:
        raise AssertionError(message)



def wait_for_server(timeout_seconds = 45):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with request.urlopen(f"{BASE_URL}/openapi.json", timeout = 3) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(1)
    raise RuntimeError("Server did not become ready in time")


def api_request(method, path, token = None, json_body = None, form_body = None, query = None):
    url = f"{BASE_URL}{path}"
    if query:
        url += "?" + parse.urlencode(query, doseq = True)

    headers = {}
    body = None

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if json_body is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(json_body).encode("utf-8")

    if form_body is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        body = parse.urlencode(form_body).encode("utf-8")

    req = request.Request(url, data = body, method = method, headers = headers)

    try:
        with request.urlopen(req, timeout = 20) as response:
            raw = response.read().decode("utf-8")
            return response.status, json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode("utf-8")
        detail = raw
        try:
            detail = json.loads(raw)
        except Exception:
            pass
        raise ApiError(method, path, exc.code, detail)
    except URLError as exc:
        raise RuntimeError(f"{method} {path} failed (network): {exc}")


def login(username, password):
    _, payload = api_request(
        "POST",
        "/auth/login",
        form_body = {"username": username, "password": password},
    )
    return payload["access_token"]


def login_expect_denied(username, password):
    try:
        login(username, password)
    except ApiError as exc:
        assert_true(exc.status == 403, f"Expected 403 login denial for {username}, got {exc.status}")
        return
    raise AssertionError(f"Expected login denial for {username}, but login succeeded")


def get_user_id(username: str) -> int:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        assert_true(user is not None, f"User {username} not found in DB")
        return user.id
    finally:
        db.close()


def ensure_seed_actor(username: str, email: str, account_type: AccountType, role: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = User(
                username = username,
                email = email,
                hashed_password = hash_password(SEED_PASSWORD),
                account_type = account_type,
                role = role,
                is_deleted = False,
            )
            db.add(user)
            db.flush()
        else:
            user.email = email
            user.account_type = account_type
            user.role = role
            user.is_deleted = False
            user.hashed_password = hash_password(SEED_PASSWORD)
            db.add(user)
            db.flush()

        if account_type == AccountType.worker:
            profile = db.query(WorkerProfile).filter(WorkerProfile.user_id == user.id).first()
            if not profile:
                db.add(WorkerProfile(user_id = user.id))
        else:
            profile = db.query(EmployerProfile).filter(EmployerProfile.user_id == user.id).first()
            if not profile:
                db.add(EmployerProfile(user_id = user.id, organization_name = username))

        db.commit()
    finally:
        db.close()


def ensure_account_registered(username: str, email: str, account_type: str):
    payload = {
        "username": username,
        "email": email,
        "password": SEED_PASSWORD,
        "account_type": account_type,
    }
    try:
        status, _ = api_request("POST", "/auth/register", json_body = payload)
        assert_true(status in (200, 201), f"Unexpected register status for {username}: {status}")
    except ApiError as exc:
        # Registration may still have persisted the user if external SMTP failed.
        if exc.status != 500:
            raise

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        assert_true(user is not None, f"Registration did not create user {username}")
        assert_true(user.account_type.value == account_type, f"Unexpected account type for {username}")
        if account_type == "worker":
            assert_true(user.worker_profile is not None, f"Worker profile missing for {username}")
        else:
            assert_true(user.employer_profile is not None, f"Employer profile missing for {username}")

        # Simulate post-email verification for E2E continuation.
        user.is_deleted = False
        user.hashed_password = hash_password(SEED_PASSWORD)
        db.add(user)
        db.commit()
    finally:
        db.close()


def upsert_skill(token, name, category):
    try:
        _, payload = api_request(
            "POST",
            "/marketplace/skills",
            token = token,
            json_body = {"name": name, "category": category},
        )
        return payload["id"]
    except ApiError as exc:
        if "Skill already exists" not in str(exc.detail):
            raise
        _, skills = api_request("GET", "/marketplace/skills", token = token)
        for skill in skills:
            if skill["name"] == name:
                return skill["id"]
        raise AssertionError(f"Skill {name} was expected to exist")


def upsert_contact(token, channel_type: str, channel_value: str, visibility: str, is_primary: bool):
    try:
        api_request(
            "POST",
            "/marketplace/contacts/me",
            token = token,
            json_body = {
                "channel_type": channel_type,
                "channel_value": channel_value,
                "visibility": visibility,
                "is_primary": is_primary,
            },
        )
    except ApiError as exc:
        duplicate_message = "uq_contact_unique_channel"
        if exc.status == 400 and (duplicate_message in str(exc.detail) or "already" in str(exc.detail).lower()):
            return
        raise


def setup_baseline_accounts():
    ensure_seed_actor("admin_seed", "admin_seed@example.com", AccountType.employer, "admin")
    ensure_seed_actor("worker_alice", "worker_alice@example.com", AccountType.worker, "user")
    ensure_seed_actor("worker_bob", "worker_bob@example.com", AccountType.worker, "user")


def main():
    wait_for_server()
    setup_baseline_accounts()

    worker_signup = f"story_worker_{int(time.time())}"
    employer_signup = f"story_employer_{int(time.time())}"
    service_signup = f"story_service_{int(time.time())}"

    ensure_account_registered(worker_signup, f"{worker_signup}@example.com", "worker")
    ensure_account_registered(employer_signup, f"{employer_signup}@example.com", "employer")
    ensure_account_registered(service_signup, f"{service_signup}@example.com", "employer")

    admin_token = login("admin_seed", SEED_PASSWORD)
    alice_token = login("worker_alice", SEED_PASSWORD)
    bob_token = login("worker_bob", SEED_PASSWORD)
    worker_signup_token = login(worker_signup, SEED_PASSWORD)
    employer_token = login(employer_signup, SEED_PASSWORD)
    service_candidate_token = login(service_signup, SEED_PASSWORD)

    plumbing_id = upsert_skill(admin_token, "Plumbing", "Trade")
    driving_id = upsert_skill(admin_token, "Driving", "Service")
    chainsaw_id = upsert_skill(admin_token, "Chainsaw Operation", "Equipment")

    api_request(
        "PATCH",
        "/marketplace/workers/me",
        token = worker_signup_token,
        json_body = {
            "bio": "Posiadam pilarke i pompe spalinowa",
            "experience_summary": "Prace terenowe i usuwanie przeszkod",
            "wants_paid": True,
            "wants_volunteer": True,
            "public_latitude": 52.23,
            "public_longitude": 21.01,
            "exact_latitude": 52.2308,
            "exact_longitude": 21.0122,
            "city": "Warsaw",
            "region": "Mazowieckie",
            "is_available": True,
            "contact_visibility": "public",
        },
    )
    api_request(
        "PATCH",
        "/marketplace/workers/me/skills",
        token = worker_signup_token,
        json_body = {"skill_ids": [plumbing_id, chainsaw_id]},
    )

    api_request(
        "PATCH",
        "/marketplace/workers/me",
        token = alice_token,
        json_body = {
            "bio": "Certified plumber with emergency support kit",
            "experience_summary": "8 years in emergency maintenance",
            "wants_paid": True,
            "wants_volunteer": True,
            "public_latitude": 52.24,
            "public_longitude": 21.02,
            "exact_latitude": 52.2407,
            "exact_longitude": 21.0211,
            "city": "Warsaw",
            "region": "Mazowieckie",
            "is_available": True,
            "contact_visibility": "gov_only",
        },
    )
    api_request(
        "PATCH",
        "/marketplace/workers/me/skills",
        token = alice_token,
        json_body = {"skill_ids": [plumbing_id]},
    )
    api_request(
        "PATCH",
        "/marketplace/workers/me",
        token = bob_token,
        json_body = {
            "bio": "Volunteer driver and logistics helper",
            "experience_summary": "Local logistics support",
            "wants_paid": False,
            "wants_volunteer": True,
            "public_latitude": 52.22,
            "public_longitude": 21.0,
            "city": "Warsaw",
            "region": "Mazowieckie",
            "is_available": True,
            "contact_visibility": "private",
        },
    )
    api_request(
        "PATCH",
        "/marketplace/workers/me/skills",
        token = bob_token,
        json_body = {"skill_ids": [driving_id]},
    )

    upsert_contact(alice_token, "email", "alice-public@example.com", "public", True)
    upsert_contact(alice_token, "phone", "+48111222333", "gov_only", False)

    _, anonymous_workers = api_request(
        "GET",
        "/marketplace/workers/search",
        query = {"skill_ids": [plumbing_id], "city": "Warsaw"},
    )
    assert_true(len(anonymous_workers) >= 1, "Anonymous search should return at least one worker")
    sample = anonymous_workers[0]
    assert_true("exact_latitude" in sample and sample["exact_latitude"] is None, "Anonymous should not see exact latitude")
    assert_true("exact_longitude" in sample and sample["exact_longitude"] is None, "Anonymous should not see exact longitude")
    assert_true("email" not in sample and "phone" not in sample, "Anonymous should not see contact details")

    _, anonymous_contacts = api_request("GET", f"/marketplace/workers/{get_user_id('worker_alice')}/contacts")
    assert_true(len(anonymous_contacts) >= 1, "Anonymous should see at least one public contact channel")
    assert_true(all(row["visibility"] == "public" for row in anonymous_contacts), "Anonymous should only see public contacts")

    _, worker_visible_contacts = api_request("GET", f"/marketplace/workers/{get_user_id('worker_alice')}/contacts", token = bob_token)
    assert_true(len(worker_visible_contacts) >= 1, "Worker should see consented public contact data")
    assert_true(all(row["visibility"] == "public" for row in worker_visible_contacts), "Worker should see only public contacts")

    api_request(
        "POST",
        "/users/me/verification-request",
        token = employer_token,
        json_body = {"target": "employer"},
    )
    login_expect_denied(employer_signup, SEED_PASSWORD)

    api_request(
        "POST",
        "/users/me/verification-request",
        token = service_candidate_token,
        json_body = {"target": "gov_service"},
    )
    login_expect_denied(service_signup, SEED_PASSWORD)

    _, pending = api_request("GET", "/users/admin/verifications/pending", token = admin_token, query = {"target": "all"})
    pending_by_username = {row["username"]: row["target"] for row in pending}
    assert_true(pending_by_username.get(employer_signup) == "employer", "Employer should be pending verification")
    assert_true(pending_by_username.get(service_signup) == "gov_service", "Service should be pending verification")

    service_user_id = get_user_id(service_signup)
    employer_user_id = get_user_id(employer_signup)

    api_request(
        "PATCH",
        f"/users/admin/verifications/{employer_user_id}/approve",
        token = admin_token,
        json_body = {"target": "employer"},
    )
    api_request(
        "PATCH",
        f"/users/admin/verifications/{service_user_id}/approve",
        token = admin_token,
        json_body = {"target": "gov_service"},
    )

    service_token = login(service_signup, SEED_PASSWORD)
    _, service_worker_view = api_request(
        "GET",
        "/marketplace/workers/search",
        token = service_token,
        query = {"skill_ids": [plumbing_id], "city": "Warsaw"},
    )
    assert_true(any(row["exact_latitude"] is not None for row in service_worker_view), "Service should see exact worker locations")

    _, service_contacts = api_request("GET", f"/marketplace/workers/{get_user_id('worker_alice')}/contacts", token = service_token)
    visibility_set = {row["visibility"] for row in service_contacts}
    assert_true("public" in visibility_set and "gov_only" in visibility_set, "Service should see public and gov-only contacts")

    _, opportunity = api_request(
        "POST",
        "/marketplace/opportunities",
        token = service_token,
        json_body = {
            "title": "Punkt zapotrzebowania: usuwanie skutkow burzy",
            "description": "Potrzebni pracownicy z umiejetnosciami hydraulicznymi i obsluga sprzetu",
            "compensation_type": "both",
            "budget_note": "zalezne od zakresu",
            "latitude": 52.229,
            "longitude": 21.011,
            "city": "Warsaw",
            "region": "Mazowieckie",
            "skill_ids": [plumbing_id, chainsaw_id],
        },
    )

    _, worker_opportunities = api_request(
        "GET",
        "/marketplace/opportunities",
        token = worker_signup_token,
        query = {"skill_ids": [plumbing_id], "city": "Warsaw"},
    )
    assert_true(any(row["id"] == opportunity["id"] for row in worker_opportunities), "Worker should discover service demand point")

    api_request(
        "POST",
        f"/marketplace/opportunities/{opportunity['id']}/apply",
        token = worker_signup_token,
        json_body = {"message": "Moge dojechac w 30 minut"},
    )

    _, applications = api_request(
        "GET",
        f"/marketplace/opportunities/{opportunity['id']}/applications",
        token = service_token,
    )
    assert_true(any(row["worker_id"] == get_user_id(worker_signup) for row in applications), "Service should see workers who applied")

    print("User stories covered successfully")
    print(f"Anonymous worker matches: {len(anonymous_workers)}")
    print(f"Pending verification entries before approval: {len(pending)}")
    print(f"Applications for demand point #{opportunity['id']}: {len(applications)}")


if __name__ == "__main__":
    main()
