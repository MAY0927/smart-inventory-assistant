import os
from uuid import uuid4
import pytest
from app.database import SessionLocal
from app.models.user import User
from app.security import create_access_token, hash_password

os.environ.setdefault("JWT_SECRET", "test-secret-that-is-longer-than-thirty-two-characters")
os.environ.setdefault("COOKIE_SECURE", "false")

@pytest.fixture
def auth_headers():
    with SessionLocal() as db:
        user = User(email=f"test-{uuid4()}@example.com", password_hash=hash_password("Test-password-123"), role="team")
        db.add(user)
        db.commit()
        db.refresh(user)
        headers = {"Authorization": f"Bearer {create_access_token(user.id)}"}
        user_id = user.id
    yield headers
    with SessionLocal() as db:
        saved = db.get(User, user_id)
        if saved:
            db.delete(saved)
            db.commit()
