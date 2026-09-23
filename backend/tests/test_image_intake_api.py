from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_image_intake_rejects_unsupported_file_type(auth_headers) -> None:
    response = client.post(
        "/image-intake/analyze",
        files={"image": ("item.txt", b"not an image", "text/plain")}, headers=auth_headers,
    )
    assert response.status_code == 415


def test_image_intake_rejects_empty_image(auth_headers) -> None:
    response = client.post(
        "/image-intake/analyze",
        files={"image": ("item.png", b"", "image/png")}, headers=auth_headers,
    )
    assert response.status_code == 400
