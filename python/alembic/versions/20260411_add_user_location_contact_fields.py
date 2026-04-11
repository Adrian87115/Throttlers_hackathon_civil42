"""add city district phone to users

Revision ID: 20260411_add_user_location_contact_fields
Revises: 
Create Date: 2026-04-11
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260411_add_user_location_contact_fields"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("city", sa.String(), nullable = True))
    op.add_column("users", sa.Column("district", sa.String(), nullable = True))
    op.add_column("users", sa.Column("phone", sa.String(), nullable = True))
    op.add_column("worker_profiles", sa.Column("first_name", sa.String(length = 120), nullable = True))
    op.add_column("worker_profiles", sa.Column("last_name", sa.String(length = 120), nullable = True))
    op.add_column("worker_profiles", sa.Column("role", sa.String(length = 160), nullable = True))
    op.add_column("worker_profiles", sa.Column("category", sa.String(length = 160), nullable = True))
    op.add_column("worker_profiles", sa.Column("experience_years", sa.Integer(), nullable = True))
    op.alter_column("worker_profiles", "is_available", existing_type = sa.Boolean(), nullable = True)

    op.add_column("employer_profiles", sa.Column("nip", sa.String(length = 10), nullable = True))
    op.add_column("employer_profiles", sa.Column("regon", sa.String(length = 14), nullable = True))
    op.add_column("employer_profiles", sa.Column("org_address", sa.String(length = 255), nullable = True))
    op.add_column("employer_profiles", sa.Column("org_phone", sa.String(length = 50), nullable = True))
    op.add_column("employer_profiles", sa.Column("contact_person", sa.String(length = 160), nullable = True))
    op.add_column("employer_profiles", sa.Column("institution_type", sa.String(length = 160), nullable = True))


def downgrade() -> None:
    op.drop_column("employer_profiles", "institution_type")
    op.drop_column("employer_profiles", "contact_person")
    op.drop_column("employer_profiles", "org_phone")
    op.drop_column("employer_profiles", "org_address")
    op.drop_column("employer_profiles", "regon")
    op.drop_column("employer_profiles", "nip")

    op.alter_column("worker_profiles", "is_available", existing_type = sa.Boolean(), nullable = False)
    op.drop_column("worker_profiles", "experience_years")
    op.drop_column("worker_profiles", "category")
    op.drop_column("worker_profiles", "role")
    op.drop_column("worker_profiles", "last_name")
    op.drop_column("worker_profiles", "first_name")

    op.drop_column("users", "phone")
    op.drop_column("users", "district")
    op.drop_column("users", "city")
