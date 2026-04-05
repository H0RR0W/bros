"""Add admin_logs table

Revision ID: 003
Revises: 002
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admin_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("admin_id", UUID(as_uuid=True), nullable=False),
        sa.Column("admin_username", sa.String(50), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_id", sa.String(255), nullable=True),
        sa.Column("details", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_admin_logs_admin_id", "admin_logs", ["admin_id"])
    op.create_index("ix_admin_logs_created_at", "admin_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_admin_logs_created_at", "admin_logs")
    op.drop_index("ix_admin_logs_admin_id", "admin_logs")
    op.drop_table("admin_logs")
