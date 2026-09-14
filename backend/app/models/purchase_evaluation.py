from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PurchaseEvaluation(Base):
    __tablename__ = "purchase_evaluations"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    candidate_name: Mapped[str] = mapped_column(String(200))
    candidate_category: Mapped[str] = mapped_column(String(50), index=True)
    candidate_attributes: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    similarity_score: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    recommendation: Mapped[str] = mapped_column(String(30))
    explanation: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="purchase_evaluations")

