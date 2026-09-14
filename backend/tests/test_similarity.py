from types import SimpleNamespace

from app.services.similarity import build_recommendation, calculate_similarity


def make_item(**attributes):
    return SimpleNamespace(
        id="item-1",
        name="Existing item",
        category="clothing",
        attributes=attributes,
    )


def test_high_similarity_recommends_skip() -> None:
    result = calculate_similarity(
        "clothing",
        {"color": "yellow", "style": "casual", "material": "cotton"},
        make_item(color="yellow", style="casual", material="cotton"),
    )
    decision, _ = build_recommendation(result)
    assert result.score == 90
    assert decision == "skip"


def test_medium_similarity_recommends_consider() -> None:
    result = calculate_similarity(
        "clothing",
        {"style": "casual"},
        make_item(style="casual"),
    )
    decision, _ = build_recommendation(result)
    assert result.score == 45
    assert decision == "consider"


def test_low_similarity_recommends_buy() -> None:
    result = calculate_similarity(
        "accessory",
        {"color": "black"},
        make_item(color="yellow"),
    )
    decision, _ = build_recommendation(result)
    assert result.score == 0
    assert decision == "buy"
