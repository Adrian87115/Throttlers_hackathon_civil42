from sqlalchemy import text

from app.db.session import SessionLocal


def run_query(db, sql):
    return db.execute(text(sql)).fetchall()


def main():
    db = SessionLocal()
    try:
        users = run_query(
            db,
            """
            SELECT username, role, account_type
            FROM users
            WHERE username IN ('owner_seed', 'worker_alice', 'worker_bob', 'employer_acme', 'gov_ops')
            ORDER BY username
            """,
        )
        workers = run_query(
            db,
            """
            SELECT u.username, w.city, w.region, w.wants_paid, w.wants_volunteer
            FROM worker_profiles w
            JOIN users u ON u.id = w.user_id
            ORDER BY u.username
            """,
        )
        opportunities = run_query(
            db,
            """
            SELECT id, title, city, compensation_type, status
            FROM opportunities
            ORDER BY id DESC
            LIMIT 3
            """,
        )

        print("Users")
        for row in users:
            print(row)

        print("\nWorkers")
        for row in workers:
            print(row)

        print("\nRecent opportunities")
        for row in opportunities:
            print(row)
    finally:
        db.close()


if __name__ == "__main__":
    main()
