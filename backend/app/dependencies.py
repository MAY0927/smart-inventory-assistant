from collections.abc import Generator

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User


from app.security import ACCESS_TOKEN_COOKIE, decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    error = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired credentials", headers={"WWW-Authenticate": "Bearer"})
    if credentials is not None and credentials.scheme.lower() != "bearer":
        raise error
    token = credentials.credentials if credentials is not None else request.cookies.get(ACCESS_TOKEN_COOKIE)
    if not token:
        raise error
    user_id = decode_access_token(token)
    if user_id is None:
        raise error
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise error
    return user
