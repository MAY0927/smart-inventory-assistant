from decimal import Decimal

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.item import Item
from app.models.purchase_evaluation import PurchaseEvaluation
from app.schemas.purchase_evaluation import (
    PurchaseEvaluationCreate,
    PurchaseEvaluationResult,
)
from app.services.similarity import build_recommendation, find_most_similar


router = APIRouter(prefix="/purchase-evaluations", tags=["purchase evaluations"])


@router.post(
    "", response_model=PurchaseEvaluationResult, status_code=status.HTTP_201_CREATED
)
def evaluate_purchase(
    payload: PurchaseEvaluationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PurchaseEvaluationResult:
    inventory = db.scalars(select(Item).where(Item.user_id == user.id)).all()
    similarity = find_most_similar(
        payload.candidate_category,
        payload.candidate_attributes,
        inventory,
    )
    recommendation, explanation = build_recommendation(similarity)

    evaluation = PurchaseEvaluation(
        user_id=user.id,
        candidate_name=payload.candidate_name,
        candidate_category=payload.candidate_category,
        candidate_attributes=payload.candidate_attributes,
        similarity_score=Decimal(similarity.score),
        recommendation=recommendation,
        explanation=explanation,
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    return PurchaseEvaluationResult(
        id=evaluation.id,
        candidate_name=evaluation.candidate_name,
        similarity_score=float(evaluation.similarity_score),
        recommendation=evaluation.recommendation,
        explanation=evaluation.explanation,
        similar_item_id=similarity.item_id,
        similar_item_name=similarity.item_name,
        matched_features=similarity.matched_features,
        breakdown=similarity.breakdown,
    )
