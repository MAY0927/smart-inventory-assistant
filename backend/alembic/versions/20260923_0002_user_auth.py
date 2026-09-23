"""Add account role and active status.

Revision ID: 20260923_0002
Revises: 20260914_0001
"""
from collections.abc import Sequence
from alembic import op
import sqlalchemy as sa

revision: str = "20260923_0002"
down_revision: str | None = "20260914_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    op.add_column("users", sa.Column("role", sa.String(length=20), server_default="member", nullable=False))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False))

def downgrade() -> None:
    op.drop_column("users", "is_active")
    op.drop_column("users", "role")
