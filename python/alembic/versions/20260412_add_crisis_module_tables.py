"""add crisis module tables

Revision ID: 20260412_add_crisis_module_tables
Revises: 20260411_add_user_location_contact_fields
Create Date: 2026-04-12
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260412_add_crisis_module_tables"
down_revision = "20260411_add_user_location_contact_fields"
branch_labels = None
depends_on = None


crisis_severity = sa.Enum("high", "critical", name = "crisis_severity")
crisis_status = sa.Enum("active", "ended", name = "crisis_status")
crisis_request_priority = sa.Enum("low", "medium", "high", "critical", name = "crisis_request_priority")


def upgrade() -> None:
    crisis_severity.create(op.get_bind(), checkfirst = True)
    crisis_status.create(op.get_bind(), checkfirst = True)
    crisis_request_priority.create(op.get_bind(), checkfirst = True)

    op.create_table(
        "crises",
        sa.Column("id", sa.Integer(), primary_key = True),
        sa.Column("title", sa.String(length = 200), nullable = False),
        sa.Column("description", sa.Text(), nullable = False),
        sa.Column("severity", crisis_severity, nullable = False),
        sa.Column("status", crisis_status, nullable = False),
        sa.Column("affected_districts", sa.JSON(), nullable = False),
        sa.Column("started_at", sa.DateTime(timezone = True), nullable = False, server_default = sa.func.now()),
        sa.Column("ended_at", sa.DateTime(timezone = True), nullable = True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete = "SET NULL"), nullable = True),
    )
    op.create_index("ix_crises_created_by", "crises", ["created_by"])

    op.create_table(
        "crisis_requests",
        sa.Column("id", sa.Integer(), primary_key = True),
        sa.Column("crisis_id", sa.Integer(), sa.ForeignKey("crises.id", ondelete = "CASCADE"), nullable = False),
        sa.Column("district_id", sa.String(length = 120), nullable = False),
        sa.Column("title", sa.String(length = 200), nullable = False),
        sa.Column("description", sa.Text(), nullable = False),
        sa.Column("needed_categories", sa.JSON(), nullable = False),
        sa.Column("priority", crisis_request_priority, nullable = False),
        sa.Column("created_at", sa.DateTime(timezone = True), nullable = False, server_default = sa.func.now()),
    )
    op.create_index("ix_crisis_requests_crisis_id", "crisis_requests", ["crisis_id"])

    op.create_table(
        "crisis_responses",
        sa.Column("id", sa.Integer(), primary_key = True),
        sa.Column("crisis_id", sa.Integer(), sa.ForeignKey("crises.id", ondelete = "CASCADE"), nullable = False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete = "CASCADE"), nullable = False),
        sa.Column("responded_positively", sa.Boolean(), nullable = False, server_default = sa.false()),
        sa.Column("responded_at", sa.DateTime(timezone = True), nullable = True),
        sa.UniqueConstraint("crisis_id", "user_id", name = "uq_crisis_response_crisis_user"),
    )
    op.create_index("ix_crisis_responses_crisis_id", "crisis_responses", ["crisis_id"])
    op.create_index("ix_crisis_responses_user_id", "crisis_responses", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_crisis_responses_user_id", table_name = "crisis_responses")
    op.drop_index("ix_crisis_responses_crisis_id", table_name = "crisis_responses")
    op.drop_table("crisis_responses")

    op.drop_index("ix_crisis_requests_crisis_id", table_name = "crisis_requests")
    op.drop_table("crisis_requests")

    op.drop_index("ix_crises_created_by", table_name = "crises")
    op.drop_table("crises")

    crisis_request_priority.drop(op.get_bind(), checkfirst = True)
    crisis_status.drop(op.get_bind(), checkfirst = True)
    crisis_severity.drop(op.get_bind(), checkfirst = True)
