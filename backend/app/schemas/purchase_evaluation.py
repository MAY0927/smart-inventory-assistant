from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class PurchaseEvaluationCreate(BaseModel):
    candidate_name: str = Field(min_length=1, max_length=200)
    candidate_category: str = Field(min_length=1, max_length=50)
    candidate_attributes: dict[str, Any] = Field(default_factory=dict)


class PurchaseEvaluationResult(BaseModel):
    id: UUID
    candidate_name: str
    similarity_score: float
    recommendation: str
    explanation: str
    similar_item_id: UUID | None
    similar_item_name: str | None
    matched_features: list[str]
    breakdown: dict[str, int]
