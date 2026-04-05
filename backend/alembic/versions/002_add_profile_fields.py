"""Add profile fields to users

Revision ID: 002
Revises: 001
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("patronymic", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "patronymic")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
