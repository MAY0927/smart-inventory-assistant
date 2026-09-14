from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models.purchase_evaluation import PurchaseEvaluation


client = TestClient(app)


def test_purchase_evaluation_finds_similar_inventory_item() -> None:
    unique_name = f"Test yellow dress {uuid4()}"
    item_response = client.post(
        "/items",
        json={
            "name": unique_name,
            "category": "clothing",
            "quantity": 1,
            "attributes": {
                "color": "yellow",
                "style": "casual",
                "material": "cotton",
                "purpose": "daily",
            },
        },
    )
    assert item_response.status_code == 201
    item_id = item_response.json()["id"]
    evaluation_id = None

    try:
        response = client.post(
            "/purchase-evaluations",
            json={
                "candidate_name": "Candidate yellow dress",
                "candidate_category": "clothing",
                "candidate_attributes": {
                    "color": "yellow",
                    "style": "casual",
                    "material": "cotton",
                    "purpose": "daily",
                },
            },
        )
        assert response.status_code == 201
        result = response.json()
        evaluation_id = result["id"]
        assert result["similarity_score"] == 100
        assert result["recommendation"] == "skip"
        assert result["similar_item_id"] == item_id
        assert result["breakdown"] == {
            "category": 30,
            "color": 30,
            "style": 15,
            "material": 15,
            "purpose": 10,
        }
    finally:
        client.delete(f"/items/{item_id}")
        if evaluation_id:
            with SessionLocal() as db:
                evaluation = db.get(PurchaseEvaluation, UUID(evaluation_id))
                if evaluation:
                    db.delete(evaluation)
                    db.commit()
