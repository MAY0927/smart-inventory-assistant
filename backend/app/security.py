import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import Response
from pwdlib import PasswordHash

ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60
ACCESS_TOKEN_COOKIE = "stow_access_token"
password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, encoded: str) -> bool:
    try:
        return password_hash.verify(password, encoded)
    except Exception:
        return False

def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "")
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET must be set to at least 32 characters")
    return secret


def _cookie_secure() -> bool:
    default = "true" if os.getenv("APP_ENV", "development").lower() == "production" else "false"
    return os.getenv("COOKIE_SECURE", default).strip().lower() in {"1", "true", "yes", "on"}


def _cookie_samesite() -> str:
    value = os.getenv("COOKIE_SAMESITE", "lax").strip().lower()
    if value not in {"lax", "strict", "none"}:
        raise RuntimeError("COOKIE_SAMESITE must be lax, strict, or none")
    return value

def create_access_token(user_id: UUID) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES)}, _jwt_secret(), algorithm=ALGORITHM)


def set_access_token_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=token,
        max_age=ACCESS_TOKEN_MINUTES * 60,
        httponly=True,
        secure=_cookie_secure(),
        samesite=_cookie_samesite(),
        path="/",
    )

def decode_access_token(token: str) -> UUID | None:
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[ALGORITHM])
        return UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError, RuntimeError):
        return None
