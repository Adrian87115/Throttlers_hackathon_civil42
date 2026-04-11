import json
import time
from urllib import parse, request
from urllib.error import HTTPError, URLError


BASE_URL = "http://127.0.0.1:8000"
OWNER_USERNAME = "owner"
OWNER_PASSWORD = "owner"
DEFAULT_PASSWORD = "DemoPass@123"


class ApiError(Exception):
    def __init__(self, method: str, path: str, status: int, detail):
        self.method = method
        self.path = path
        self.status = status
        self.detail = detail
        super().__init__(f"{method} {path} failed ({status}): {detail}")


def wait_for_server(timeout_seconds: int = 45):
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
        try:
            detail = json.loads(raw)
        except Exception:
            detail = raw
        raise ApiError(method, path, exc.code, detail)
    except URLError as exc:
        raise RuntimeError(f"{method} {path} failed (network): {exc}")


def register_or_reuse(username: str, email: str, account_type: str):
    payload = {
        "username": username,
        "email": email,
        "password": DEFAULT_PASSWORD,
        "account_type": account_type,
    }
    try:
        api_request("POST", "/auth/register", json_body = payload)
        print(f"[register] created account: {username} ({account_type})")
    except ApiError as exc:
        detail = str(exc.detail).lower()
        if exc.status == 400 and ("username is taken" in detail or "email is registered" in detail):
            print(f"[register] account already exists, reusing: {username}")
            return
        raise


def login(username: str, password: str):
    _, payload = api_request(
        "POST",
        "/auth/login",
        form_body = {"username": username, "password": password},
    )
    return payload["access_token"]


def find_or_create_skill(owner_token: str, name: str, category: str):
    try:
        _, payload = api_request(
            "POST",
            "/marketplace/skills",
            token = owner_token,
            json_body = {"name": name, "category": category},
        )
        return payload["id"]
    except ApiError as exc:
        if "Skill already exists" not in str(exc.detail):
            raise
        _, skills = api_request("GET", "/marketplace/skills", token = owner_token)
        for skill in skills:
            if skill["name"] == name:
                return skill["id"]
        raise RuntimeError(f"Skill {name} expected but missing")


def add_contact(token: str, channel_type: str, value: str, visibility: str, is_primary: bool):
    try:
        api_request(
            "POST",
            "/marketplace/contacts/me",
            token = token,
            json_body = {
                "channel_type": channel_type,
                "channel_value": value,
                "visibility": visibility,
                "is_primary": is_primary,
            },
        )
    except ApiError as exc:
        if exc.status == 400 and "uq_contact_unique_channel" in str(exc.detail):
            return
        raise


def approve_verification(owner_token: str, user_id: int, target: str):
    api_request(
        "PATCH",
        f"/users/owner/verifications/{user_id}/approve",
        token = owner_token,
        json_body = {"target": target},
    )


def get_user_id(owner_token: str, username: str) -> int:
    _, users = api_request("GET", "/users/advanced", token = owner_token)
    for row in users:
        if row["username"] == username:
            return row["id"]
    raise RuntimeError(f"User {username} not found")


def print_worker_cards(title: str, rows: list[dict]):
    print(f"\n{title}")
    if not rows:
        print("  (brak wynikow)")
        return
    for row in rows:
        skills = ", ".join(skill["name"] for skill in row.get("skills", []))
        print(
            f"  - {row['username']} | miasto={row.get('city')} | paid={row.get('wants_paid')} | "
            f"volunteer={row.get('wants_volunteer')} | skills=[{skills}]"
        )


def main():
    wait_for_server()

    ts = int(time.time())
    worker_1 = f"demo_worker_a_{ts}"
    worker_2 = f"demo_worker_b_{ts}"
    worker_3 = f"demo_worker_c_{ts}"
    employer_non_gov = f"demo_employer_{ts}"
    employer_gov = f"demo_service_{ts}"

    print("\n=== REJESTRACJA AKTOROW ===")
    register_or_reuse(worker_1, f"{worker_1}@example.com", "worker")
    register_or_reuse(worker_2, f"{worker_2}@example.com", "worker")
    register_or_reuse(worker_3, f"{worker_3}@example.com", "worker")
    register_or_reuse(employer_non_gov, f"{employer_non_gov}@example.com", "employer")
    register_or_reuse(employer_gov, f"{employer_gov}@example.com", "employer")

    owner_token = login(OWNER_USERNAME, OWNER_PASSWORD)
    token_w1 = login(worker_1, DEFAULT_PASSWORD)
    token_w2 = login(worker_2, DEFAULT_PASSWORD)
    token_w3 = login(worker_3, DEFAULT_PASSWORD)
    token_emp = login(employer_non_gov, DEFAULT_PASSWORD)
    token_gov = login(employer_gov, DEFAULT_PASSWORD)

    print("\n=== SKILLE I PROFILE WORKEROW ===")
    skill_water = find_or_create_skill(owner_token, "Water pumping", "Field")
    skill_logistics = find_or_create_skill(owner_token, "Logistics", "Operations")
    skill_medical = find_or_create_skill(owner_token, "First aid", "Medical")

    api_request(
        "PATCH",
        "/marketplace/workers/me",
        token = token_w1,
        json_body = {
            "bio": "Operator pompy i wsparcie terenowe",
            "wants_paid": True,
            "wants_volunteer": True,
            "public_latitude": 52.23,
            "public_longitude": 21.01,
            "exact_latitude": 52.2307,
            "exact_longitude": 21.012,
            "city": "Warsaw",
            "region": "Mazowieckie",
            "contact_visibility": "public",
        },
    )
    api_request("PATCH", "/marketplace/workers/me/skills", token = token_w1, json_body = {"skill_ids": [skill_water]})
    add_contact(token_w1, "email", f"{worker_1}@mail.local", "public", True)
    add_contact(token_w1, "phone", "+48100000001", "private", False)

    api_request(
        "PATCH",
        "/marketplace/workers/me",
        token = token_w2,
        json_body = {
            "bio": "Logistyka i transport",
            "wants_paid": True,
            "wants_volunteer": False,
            "public_latitude": 52.21,
            "public_longitude": 21.0,
            "city": "Warsaw",
            "region": "Mazowieckie",
            "contact_visibility": "private",
        },
    )
    api_request("PATCH", "/marketplace/workers/me/skills", token = token_w2, json_body = {"skill_ids": [skill_logistics]})
    add_contact(token_w2, "email", f"{worker_2}@mail.local", "private", True)

    api_request(
        "PATCH",
        "/marketplace/workers/me",
        token = token_w3,
        json_body = {
            "bio": "Pomoc medyczna i wsparcie akcji",
            "wants_paid": False,
            "wants_volunteer": True,
            "public_latitude": 52.25,
            "public_longitude": 21.03,
            "city": "Warsaw",
            "region": "Mazowieckie",
            "contact_visibility": "public",
        },
    )
    api_request("PATCH", "/marketplace/workers/me/skills", token = token_w3, json_body = {"skill_ids": [skill_medical]})
    add_contact(token_w3, "email", f"{worker_3}@mail.local", "public", True)

    print("\n=== WYSZUKIWANIE Z PERSPEKTYWY ANONA ===")
    _, worker_search = api_request(
        "GET",
        "/marketplace/workers/search",
        query = {"city": "Warsaw", "wants_volunteer": True},
    )
    print_worker_cards("Anon widzi profile:", worker_search)

    print("\n=== WYSZUKIWANIE Z PERSPEKTYWY WORKERA ===")
    _, worker_search = api_request(
        "GET",
        "/marketplace/workers/search",
        token = token_w1,
        query = {"city": "Warsaw", "wants_volunteer": True},
    )
    print_worker_cards("Worker widzi profile:", worker_search)

    worker_2_id = get_user_id(owner_token, worker_2)
    _, worker_seen_contacts = api_request("GET", f"/marketplace/workers/{worker_2_id}/contacts", token = token_w1)
    print(f"Worker widzi kontakty {worker_2}: {worker_seen_contacts} (oczekiwane: tylko public, wiec tu zwykle pusto)")

    print("\n=== WERYFIKACJA EMPLOYER NIE-GOV PRZEZ OWNERA ===")
    api_request("POST", "/users/me/verification-request", token = token_emp, json_body = {"target": "employer"})
    emp_user_id = get_user_id(owner_token, employer_non_gov)
    approve_verification(owner_token, emp_user_id, "employer")
    token_emp = login(employer_non_gov, DEFAULT_PASSWORD)

    api_request(
        "PATCH",
        "/marketplace/employers/me",
        token = token_emp,
        json_body = {
            "organization_name": "Acme Civil Support",
            "organization_description": "Prywatna firma wsparcia technicznego",
        },
    )
    _, employer_worker_search = api_request(
        "GET",
        "/marketplace/workers/search",
        token = token_emp,
        query = {"city": "Warsaw", "skill_ids": [skill_water]},
    )
    print_worker_cards("Employer (nie-gov) wyszukuje workerow:", employer_worker_search)

    _, employer_contacts = api_request("GET", f"/marketplace/workers/{worker_2_id}/contacts", token = token_emp)
    print(f"Employer (nie-gov) widzi kontakty {worker_2}: {employer_contacts}")

    try:
        api_request(
            "POST",
            "/marketplace/opportunities",
            token = token_emp,
            json_body = {
                "title": "Nie powinno sie udac",
                "description": "Tylko konto gov_service moze tworzyc opportunities",
                "compensation_type": "paid",
                "latitude": 52.2,
                "longitude": 21.0,
                "city": "Warsaw",
                "region": "Mazowieckie",
                "skill_ids": [skill_water],
            },
        )
        print("UWAGA: employer nie-gov utworzyl opportunity (to byloby bledne)")
    except ApiError as exc:
        print(f"Employer nie-gov nie moze tworzyc opportunity: status={exc.status}")

    print("\n=== WERYFIKACJA EMPLOYER GOV PRZEZ OWNERA ===")
    api_request("POST", "/users/me/verification-request", token = token_gov, json_body = {"target": "gov_service"})
    gov_user_id = get_user_id(owner_token, employer_gov)
    approve_verification(owner_token, gov_user_id, "gov_service")
    token_gov = login(employer_gov, DEFAULT_PASSWORD)

    _, gov_worker_search = api_request(
        "GET",
        "/marketplace/workers/search",
        token = token_gov,
        query = {"city": "Warsaw", "skill_ids": [skill_water]},
    )
    print_worker_cards("Employer gov wyszukuje workerow:", gov_worker_search)

    print("\n=== GOV TWORZY PUNKT ZAPOTRZEBOWANIA ===")
    _, opportunity = api_request(
        "POST",
        "/marketplace/opportunities",
        token = token_gov,
        json_body = {
            "title": "Punkt: usuwanie skutkow podtopien",
            "description": "Potrzebne osoby do pompowania i logistyki",
            "compensation_type": "both",
            "budget_note": "wg ustalen",
            "latitude": 52.229,
            "longitude": 21.011,
            "city": "Warsaw",
            "region": "Mazowieckie",
            "skill_ids": [skill_water, skill_logistics],
        },
    )
    print(f"Utworzono opportunity id={opportunity['id']} title={opportunity['title']}")

    print("\n=== WORKERZY DOLACZAJA DO OPPORTUNITY ===")
    api_request(
        "POST",
        f"/marketplace/opportunities/{opportunity['id']}/apply",
        token = token_w1,
        json_body = {"message": "Dojade za 20 minut"},
    )
    api_request(
        "POST",
        f"/marketplace/opportunities/{opportunity['id']}/apply",
        token = token_w2,
        json_body = {"message": "Moge wesprzec logistyke"},
    )

    print("\n=== GOV WIDZI LISTE ZGLOSZONYCH WORKEROW (ROZBUDOWANA) ===")
    _, applications = api_request(
        "GET",
        f"/marketplace/opportunities/{opportunity['id']}/applications",
        token = token_gov,
    )
    for app in applications:
        worker = app["worker"]
        contacts = ", ".join(f"{c['channel_type']}:{c['channel_value']}({c['visibility']})" for c in worker.get("contacts", []))
        skills = ", ".join(s["name"] for s in worker.get("skills", []))
        print(
            f"  - application_id={app['id']} worker={worker['username']} status={app['status']} "
            f"skills=[{skills}] contacts=[{contacts}]"
        )

    print("\nPrezentacja zakonczona.")


if __name__ == "__main__":
    main()
