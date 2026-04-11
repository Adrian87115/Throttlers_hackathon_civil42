from __future__ import annotations

import random
from dataclasses import dataclass

from sqlalchemy import or_

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.marketplace import (
    CompensationType,
    EmployerProfile,
    Opportunity,
    OpportunityStatus,
    Skill,
    VerificationStatus,
    WorkerProfile,
)
from app.models.user import AccountType, User


SEED = 20260411
DEFAULT_PASSWORD = "SeedPass@123"
WORKERS_COUNT = 50
NGO_EMPLOYERS_COUNT = 10
GOV_EMPLOYERS_COUNT = 5
OPPORTUNITIES_COUNT = 10


@dataclass(frozen = True)
class CityRecord:
    city: str
    region: str
    latitude: float
    longitude: float


POLISH_CITIES: list[CityRecord] = [
    CityRecord("Warszawa", "Mazowieckie", 52.2297, 21.0122),
    CityRecord("Krakow", "Malopolskie", 50.0647, 19.9450),
    CityRecord("Lodz", "Lodzkie", 51.7592, 19.4550),
    CityRecord("Wroclaw", "Dolnoslaskie", 51.1079, 17.0385),
    CityRecord("Poznan", "Wielkopolskie", 52.4064, 16.9252),
    CityRecord("Gdansk", "Pomorskie", 54.3520, 18.6466),
    CityRecord("Szczecin", "Zachodniopomorskie", 53.4285, 14.5528),
    CityRecord("Bydgoszcz", "Kujawsko-Pomorskie", 53.1235, 18.0084),
    CityRecord("Lublin", "Lubelskie", 51.2465, 22.5684),
    CityRecord("Katowice", "Slaskie", 50.2649, 19.0238),
    CityRecord("Bialystok", "Podlaskie", 53.1325, 23.1688),
    CityRecord("Gdynia", "Pomorskie", 54.5189, 18.5305),
    CityRecord("Czestochowa", "Slaskie", 50.8118, 19.1203),
    CityRecord("Radom", "Mazowieckie", 51.4027, 21.1471),
    CityRecord("Torun", "Kujawsko-Pomorskie", 53.0138, 18.5984),
]

WORKER_FIRST_NAMES = [
    "Anna",
    "Piotr",
    "Katarzyna",
    "Michal",
    "Joanna",
    "Pawel",
    "Agnieszka",
    "Tomasz",
    "Marta",
    "Kamil",
    "Monika",
    "Lukasz",
    "Natalia",
    "Jakub",
    "Ewa",
    "Mateusz",
    "Karolina",
    "Rafal",
    "Magdalena",
    "Marcin",
]

WORKER_LAST_NAMES = [
    "Kowalska",
    "Nowak",
    "Wisniewska",
    "Wojcik",
    "Kaczmarek",
    "Mazur",
    "Krawczyk",
    "Piotrowska",
    "Grabowski",
    "Zielinska",
    "Szymanska",
    "Dabrowski",
    "Kubiak",
    "Pawlak",
    "Michalska",
    "Wrobel",
]

NGO_ORGANIZATIONS = [
    (
        "Fundacja Most Pokolen",
        "Laczymy seniorow i mlodziez we wspolnych projektach sasiedzkich.",
    ),
    (
        "Stowarzyszenie Czysta Rzeka",
        "Koordynujemy akcje sprzatania terenow nadrzecznych i edukacje ekologiczna.",
    ),
    (
        "Fundacja Otwarta Szkola",
        "Wspieramy dzieci uchodzcze i ich rodziny w adaptacji do szkoly.",
    ),
    (
        "Stowarzyszenie Aktywni Lokalnie",
        "Pomagamy mieszkancom organizowac mikroinicjatywy osiedlowe.",
    ),
    (
        "Fundacja Rower dla Miasta",
        "Promujemy bezpieczny transport rowerowy i edukacje mobilnosci.",
    ),
    (
        "Stowarzyszenie Sasiad Pomaga",
        "Tworzymy sieci wsparcia dla osob starszych i samotnych.",
    ),
    (
        "Fundacja Zielony Dach",
        "Prowadzimy warsztaty retencji i miejskich ogrodow deszczowych.",
    ),
    (
        "Stowarzyszenie Kultura Blisko",
        "Docieramy z kultura i edukacja artystyczna do mniejszych miejscowosci.",
    ),
    (
        "Fundacja Praca i Godnosc",
        "Wspieramy osoby dlugotrwale bezrobotne w powrocie na rynek pracy.",
    ),
    (
        "Stowarzyszenie SafeNet",
        "Prowadzimy szkolenia z cyberbezpieczenstwa dla NGO i samorzadow.",
    ),
]

GOV_ORGANIZATIONS = [
    (
        "Miejski Osrodek Pomocy Spolecznej Warszawa",
        "Koordynujemy wsparcie kryzysowe i uslugi opiekuncze dla mieszkancow stolicy.",
    ),
    (
        "Powiatowe Centrum Zarzadzania Kryzysowego Krakow",
        "Organizujemy zasoby i procedury reagowania na zdarzenia nadzwyczajne.",
    ),
    (
        "Wojewodzkie Centrum Wolontariatu Lodz",
        "Laczymy wolontariuszy z instytucjami publicznymi i akcjami pomocowymi.",
    ),
    (
        "Miejski Zarzad Zieleni Wroclaw",
        "Prowadzimy projekty adaptacji miasta do zmian klimatu.",
    ),
    (
        "Regionalny Osrodek Integracji Spolecznej Poznan",
        "Wspieramy integracje zawodowa i mieszkaniowa osob zagrozonych wykluczeniem.",
    ),
]

OPPORTUNITIES = [
    (
        "Koordynator lokalnego punktu pomocy podczas upalow",
        "Szukamy osoby do prowadzenia punktu wsparcia dla seniorow w czasie fal upalow.",
        CompensationType.paid,
        "Umowa zlecenie 7 200 PLN miesiecznie",
    ),
    (
        "Specjalista ds. logistyki paczek dla rodzin",
        "Potrzebujemy wsparcia przy planowaniu tras i harmonogramow wydawania paczek.",
        CompensationType.paid,
        "Budzet projektu 9 500 PLN brutto",
    ),
    (
        "Wolontariusz do szkolen cyfrowych dla seniorow",
        "Prowadzenie praktycznych warsztatow z e-uslug i cyberbezpieczenstwa.",
        CompensationType.volunteer,
        "Zwrot kosztow dojazdu",
    ),
    (
        "Animator spoleczny na osiedlowe konsultacje",
        "Moderowanie spotkan i zbieranie opinii mieszkancow o przestrzeni publicznej.",
        CompensationType.both,
        "Stypendium lub wolontariat",
    ),
    (
        "Koordynator magazynu pomocy rzeczowej",
        "Nadzor nad przyjmowaniem darow, inwentaryzacja i wspolpraca z kurierami.",
        CompensationType.paid,
        "8 100 PLN brutto miesiecznie",
    ),
    (
        "Mlodszy analityk danych miejskich",
        "Przygotowanie raportow o potrzebach mieszkancow i monitoringu wskaznikow spolecznych.",
        CompensationType.paid,
        "Umowa o prace 8 900 PLN brutto",
    ),
    (
        "Wolontariusz terenowy ds. zieleni i retencji",
        "Wsparcie inwentaryzacji zieleni i dokumentowania lokalnych podtopien.",
        CompensationType.volunteer,
        "Pakiet szkoleniowy i certyfikat",
    ),
    (
        "Koordynator wsparcia psychologicznego po kryzysie",
        "Organizacja grafikow specjalistow i punktow konsultacyjnych.",
        CompensationType.both,
        "Umowa B2B lub wolontariat ekspercki",
    ),
    (
        "Specjalista ds. komunikacji kryzysowej",
        "Tworzenie komunikatow dla mieszkancow i koordynacja informacji wielokanalowej.",
        CompensationType.paid,
        "10 200 PLN brutto miesiecznie",
    ),
    (
        "Koordynator wolontariatu wydarzen miejskich",
        "Rekrutacja i onboardowanie wolontariuszy podczas duzych wydarzen plenerowych.",
        CompensationType.both,
        "5 000 PLN lub sciezka wolontariatu",
    ),
]

SKILL_CATALOG: list[tuple[str, str]] = [
    ("Koordynacja wolontariatu", "Spoleczne"),
    ("Logistyka kryzysowa", "Operacyjne"),
    ("Pierwsza pomoc", "Bezpieczenstwo"),
    ("Wsparcie psychologiczne", "Spoleczne"),
    ("Mediacje spoleczne", "Spoleczne"),
    ("Komunikacja kryzysowa", "Komunikacja"),
    ("Analiza danych", "Analityczne"),
    ("GIS i mapowanie", "Techniczne"),
    ("Obsluga CRM", "Techniczne"),
    ("Cyberbezpieczenstwo", "Techniczne"),
    ("Planowanie wydarzen", "Organizacja"),
    ("Prowadzenie szkolen", "Edukacja"),
    ("Pisanie projektow grantowych", "Administracja"),
    ("Obsluga magazynu", "Operacyjne"),
    ("Transport i dystrybucja", "Operacyjne"),
    ("Praca z seniorami", "Spoleczne"),
    ("Praca z mlodzieza", "Spoleczne"),
    ("Retencja i zielona infrastruktura", "Srodowisko"),
    ("E-uslugi publiczne", "Administracja"),
    ("Facylitacja spotkan", "Komunikacja"),
]


def _slug(text: str) -> str:
    return (
        text.lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("/", "_")
        .replace(".", "")
    )


def _cleanup_previous_seed(db) -> None:
    seed_filters = [
        User.username.like("wrk_seed_%"),
        User.username.like("emp_ngo_seed_%"),
        User.username.like("emp_gov_seed_%"),
    ]
    stale_users = db.query(User).filter(or_(*seed_filters)).all()
    for user in stale_users:
        db.delete(user)
    db.flush()


def _ensure_skills(db) -> list[Skill]:
    existing_names = {name for (name,) in db.query(Skill.name).all()}
    for skill_name, category in SKILL_CATALOG:
        if skill_name in existing_names:
            continue
        created = Skill(name = skill_name, category = category)
        db.add(created)

    db.flush()
    return db.query(Skill).order_by(Skill.id.asc()).all()


def _create_workers(db, rng: random.Random, skills: list[Skill]) -> list[WorkerProfile]:
    worker_profiles: list[WorkerProfile] = []
    motivation_pool = [
        "Po godzinach wspieram akcje pomocy sasiedzkiej i lokalne inicjatywy.",
        "Lacze prace projektowa z dzialaniami spolecznymi w swojej dzielnicy.",
        "Specjalizuje sie we wspolpracy z roznymi grupami wiekowymi.",
        "Najlepiej czuje sie w zadaniach terenowych i koordynacji zespolow.",
        "Stawiam na praktyczne rozwiazania i dobra komunikacje z mieszkancami.",
    ]

    for idx in range(WORKERS_COUNT):
        first_name = WORKER_FIRST_NAMES[idx % len(WORKER_FIRST_NAMES)]
        last_name = WORKER_LAST_NAMES[(idx * 3) % len(WORKER_LAST_NAMES)]
        city_data = POLISH_CITIES[idx % len(POLISH_CITIES)]

        username = f"wrk_seed_{idx + 1:02d}"
        user = User(
            username = username,
            email = f"{username}@seed.local",
            hashed_password = hash_password(DEFAULT_PASSWORD),
            role = "user",
            account_type = AccountType.worker,
            is_deleted = False,
        )
        db.add(user)
        db.flush()

        public_lat = city_data.latitude + rng.uniform(-0.06, 0.06)
        public_lng = city_data.longitude + rng.uniform(-0.08, 0.08)
        exact_lat = public_lat + rng.uniform(-0.02, 0.02)
        exact_lng = public_lng + rng.uniform(-0.02, 0.02)

        wants_paid = idx % 4 != 0
        wants_volunteer = idx % 3 != 0
        if not wants_paid and not wants_volunteer:
            wants_volunteer = True

        years = 2 + (idx % 9)
        profile = WorkerProfile(
            user_id = user.id,
            bio = (
                f"{first_name} {last_name} z miasta {city_data.city}. "
                f"Pracuje przy projektach pomocowych od {years} lat."
            ),
            experience_summary = (
                f"Doswiadczenie w obszarze wsparcia lokalnego i organizacji wydarzen. "
                f"{motivation_pool[idx % len(motivation_pool)]}"
            ),
            wants_paid = wants_paid,
            wants_volunteer = wants_volunteer,
            exact_latitude = exact_lat,
            exact_longitude = exact_lng,
            public_latitude = public_lat,
            public_longitude = public_lng,
            city = city_data.city,
            region = city_data.region,
            is_available = idx % 11 != 0,
        )

        sample_size = 2 + (idx % 3)
        profile.skills = rng.sample(skills, k = min(sample_size, len(skills)))
        db.add(profile)
        worker_profiles.append(profile)

    return worker_profiles


def _create_employers(db, organizations: list[tuple[str, str]], is_gov: bool) -> list[EmployerProfile]:
    profiles: list[EmployerProfile] = []
    role = "gov_service" if is_gov else "employer"
    username_prefix = "emp_gov_seed" if is_gov else "emp_ngo_seed"

    for idx, (org_name, org_description) in enumerate(organizations, start = 1):
        username = f"{username_prefix}_{idx:02d}"
        user = User(
            username = username,
            email = f"{username}@seed.local",
            hashed_password = hash_password(DEFAULT_PASSWORD),
            role = role,
            account_type = AccountType.employer,
            is_deleted = False,
        )
        db.add(user)
        db.flush()

        profile = EmployerProfile(
            user_id = user.id,
            organization_name = org_name,
            organization_description = org_description,
            is_government_service = is_gov,
            is_verified = True,
            verification_status = VerificationStatus.approved,
        )
        db.add(profile)
        profiles.append(profile)

    return profiles


def _create_opportunities(db, rng: random.Random, employers: list[EmployerProfile], skills: list[Skill]) -> list[Opportunity]:
    opportunities: list[Opportunity] = []
    for idx in range(OPPORTUNITIES_COUNT):
        profile = rng.choice(employers)
        city_data = POLISH_CITIES[(idx * 2) % len(POLISH_CITIES)]
        title, description, compensation_type, budget_note = OPPORTUNITIES[idx]

        opportunity = Opportunity(
            employer_profile_id = profile.id,
            employer_id = profile.user_id,
            title = f"{title} - edycja 2026/{idx + 1}",
            description = (
                f"{description} "
                "Projekt realizowany z partnerami lokalnymi i samorzadem. "
                "Wymagamy dobrej organizacji pracy i empatycznej komunikacji."
            ),
            compensation_type = compensation_type,
            budget_note = budget_note,
            latitude = city_data.latitude + rng.uniform(-0.04, 0.04),
            longitude = city_data.longitude + rng.uniform(-0.04, 0.04),
            city = city_data.city,
            region = city_data.region,
            status = OpportunityStatus.open,
            is_deleted = False,
        )

        required_count = 2 + (idx % 2)
        opportunity.required_skills = rng.sample(skills, k = min(required_count, len(skills)))
        db.add(opportunity)
        opportunities.append(opportunity)

    return opportunities


def main() -> None:
    rng = random.Random(SEED)
    db = SessionLocal()

    try:
        skills = _ensure_skills(db)

        _cleanup_previous_seed(db)

        workers = _create_workers(db, rng, skills)
        ngo_employers = _create_employers(db, NGO_ORGANIZATIONS, is_gov = False)
        gov_employers = _create_employers(db, GOV_ORGANIZATIONS, is_gov = True)
        employers = ngo_employers + gov_employers
        opportunities = _create_opportunities(db, rng, employers, skills)

        db.commit()

        print("Seed danych marketplace zakonczony pomyslnie")
        print(f"Pracownicy: {len(workers)}")
        print(f"Pracodawcy NGO: {len(ngo_employers)}")
        print(f"Pracodawcy GOV: {len(gov_employers)}")
        print(f"Oferty: {len(opportunities)}")
        print(f"Skille (lacznie w bazie): {len(skills)}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()