from uuid import uuid4
from fastapi.testclient import TestClient
from app.database import SessionLocal
from app.main import app
from app.models.user import User
from app.security import hash_password

client = TestClient(app)

def test_protected_route_requires_login() -> None:
    assert client.get("/items").status_code == 401

def test_login_and_read_current_user() -> None:
    email = f"login-{uuid4()}@example.com"
    password = "A-secure-test-password-123"
    with SessionLocal() as db:
        user = User(email=email, password_hash=hash_password(password), role="judge")
        db.add(user)
        db.commit()
        user_id = user.id
    try:
        response = client.post("/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" not in data
        me = client.get("/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == email
        assert me.json()["role"] == "judge"
        assert client.post("/auth/login", json={"email": email, "password": "wrong-password"}).status_code == 401
        assert client.post("/auth/logout").status_code == 204
        assert client.get("/auth/me").status_code == 401
    finally:
        with SessionLocal() as db:
            user = db.get(User, user_id)
            if user:
                db.delete(user)
                db.commit()
