"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("user", "admin", name="user_role"), nullable=False, server_default="user"),
        sa.Column("hp", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("total_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("league", sa.String(50), nullable=False, server_default="Новичок"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    # scenarios
    op.create_table(
        "scenarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("location", sa.String(20), nullable=False),
        sa.Column("attack_type", sa.String(50), nullable=False),
        sa.Column("cwe_id", sa.String(20), nullable=False),
        sa.Column("owasp_category", sa.String(10), nullable=False),
        sa.Column("scenario_text", sa.Text(), nullable=False),
        sa.Column("answer_options", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("correct_answer_id", sa.String(2), nullable=False),
        sa.Column("explanation_wrong", sa.Text(), nullable=False),
        sa.Column("explanation_correct", sa.Text(), nullable=False),
        sa.Column("is_ai_generated", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scenarios_location_type", "scenarios", ["location", "attack_type", "is_published"])

    # game_sessions
    op.create_table(
        "game_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("location", sa.String(20), nullable=False),
        sa.Column("hp_start", sa.Integer(), server_default="100"),
        sa.Column("hp_end", sa.Integer(), nullable=True),
        sa.Column("score_earned", sa.Integer(), server_default="0"),
        sa.Column("scenarios_count", sa.Integer(), server_default="0"),
        sa.Column("correct_count", sa.Integer(), server_default="0"),
        sa.Column("completed", sa.Boolean(), server_default="false"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sessions_user_id", "game_sessions", ["user_id"])

    # user_choices
    op.create_table(
        "user_choices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scenario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("chosen_answer_id", sa.String(2), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("hp_delta", sa.Integer(), nullable=False),
        sa.Column("score_delta", sa.Integer(), server_default="0"),
        sa.Column("chosen_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["scenario_id"], ["scenarios.id"]),
        sa.ForeignKeyConstraint(["session_id"], ["game_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_choices_session", "user_choices", ["session_id", "chosen_at"])

    # certificates
    op.create_table(
        "certificates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("location", sa.String(20), nullable=False),
        sa.Column("final_score", sa.Integer(), nullable=False),
        sa.Column("accuracy_percent", sa.Integer(), nullable=False),
        sa.Column("verification_code", sa.String(64), nullable=False),
        sa.Column("is_valid", sa.Boolean(), server_default="true"),
        sa.Column("issued_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("verification_code"),
    )
    op.create_index("ix_cert_code", "certificates", ["verification_code"], unique=True)


def downgrade() -> None:
    op.drop_table("certificates")
    op.drop_table("user_choices")
    op.drop_table("game_sessions")
    op.drop_table("scenarios")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS user_role")
