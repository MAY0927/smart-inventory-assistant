from dataclasses import dataclass
from typing import Any, Iterable, Protocol


ATTRIBUTE_WEIGHTS = {
    "color": 30,
    "style": 15,
    "material": 15,
    "purpose": 10,
}
CATEGORY_WEIGHT = 30


class ComparableItem(Protocol):
    id: Any
    name: str
    category: str
    attributes: dict[str, Any]


@dataclass(frozen=True)
class SimilarityResult:
    item_id: Any | None
    item_name: str | None
    score: int
    matched_features: list[str]
    breakdown: dict[str, int]


def normalize(value: Any) -> str:
    return str(value).strip().casefold() if value is not None else ""


def calculate_similarity(
    candidate_category: str,
    candidate_attributes: dict[str, Any],
    item: ComparableItem,
) -> SimilarityResult:
    breakdown = {"category": 0, **{key: 0 for key in ATTRIBUTE_WEIGHTS}}
    matched_features: list[str] = []

    if normalize(candidate_category) == normalize(item.category):
        breakdown["category"] = CATEGORY_WEIGHT
        matched_features.append("category")

    item_attributes = item.attributes or {}
    for feature, weight in ATTRIBUTE_WEIGHTS.items():
        candidate_value = normalize(candidate_attributes.get(feature))
        item_value = normalize(item_attributes.get(feature))
        if candidate_value and item_value and candidate_value == item_value:
            breakdown[feature] = weight
            matched_features.append(feature)

    return SimilarityResult(
        item_id=item.id,
        item_name=item.name,
        score=sum(breakdown.values()),
        matched_features=matched_features,
        breakdown=breakdown,
    )


def find_most_similar(
    candidate_category: str,
    candidate_attributes: dict[str, Any],
    inventory: Iterable[ComparableItem],
) -> SimilarityResult:
    results = [
        calculate_similarity(candidate_category, candidate_attributes, item)
        for item in inventory
    ]
    if not results:
        return SimilarityResult(None, None, 0, [], {"category": 0, **{key: 0 for key in ATTRIBUTE_WEIGHTS}})
    return max(results, key=lambda result: result.score)


def build_recommendation(result: SimilarityResult) -> tuple[str, str]:
    if result.score >= 70:
        decision = "skip"
        explanation = (
            f'"{result.item_name}" is a {result.score}% match. '
            "Use what you already own before buying another."
        )
    elif result.score >= 40:
        decision = "consider"
        explanation = (
            f'"{result.item_name}" is a {result.score}% match. '
            "Compare purpose, quality, and price before deciding."
        )
    else:
        decision = "buy"
        explanation = (
            "Nothing in your inventory is a close match. "
            "This purchase may fill a genuine gap."
        )
    return decision, explanation
