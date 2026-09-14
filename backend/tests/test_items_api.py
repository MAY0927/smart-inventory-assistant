from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_items_crud_flow() -> None:
    unique_name = f"Test item {uuid4()}"
    create_response = client.post(
        "/items",
        json={
            "name": unique_name,
            "category": "test",
            "quantity": 2,
            "notes": "Created by the automated API test",
            "attributes": {"color": "blue"},
        },
    )
    assert create_response.status_code == 201
    created_item = create_response.json()
    item_id = created_item["id"]
    assert created_item["name"] == unique_name
    assert created_item["quantity"] == 2

    try:
        get_response = client.get(f"/items/{item_id}")
        assert get_response.status_code == 200
        assert get_response.json()["id"] == item_id

        list_response = client.get("/items", params={"search": unique_name})
        assert list_response.status_code == 200
        assert any(item["id"] == item_id for item in list_response.json())

        update_response = client.patch(
            f"/items/{item_id}", json={"quantity": 3, "notes": None}
        )
        assert update_response.status_code == 200
        assert update_response.json()["quantity"] == 3
        assert update_response.json()["notes"] is None
    finally:
        delete_response = client.delete(f"/items/{item_id}")
        assert delete_response.status_code == 204

    missing_response = client.get(f"/items/{item_id}")
    assert missing_response.status_code == 404


def test_create_item_rejects_invalid_quantity() -> None:
    response = client.post(
        "/items",
        json={"name": "Invalid item", "category": "test", "quantity": -1},
    )
    assert response.status_code == 422


def test_update_item_rejects_null_required_field() -> None:
    response = client.patch(f"/items/{uuid4()}", json={"name": None})
    assert response.status_code == 422
