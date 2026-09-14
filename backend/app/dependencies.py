from collections.abc import Generator

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User


DEMO_USER_EMAIL = "demo@smartinventory.local"


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_demo_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
    if user is None:
        user = User(email=DEMO_USER_EMAIL, password_hash="demo-account-no-login")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

