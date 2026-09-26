from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserRead
from app.rate_limit import login_limiter, request_client_key
from app.security import create_access_token, set_access_token_cookie, verify_password, ACCESS_TOKEN_COOKIE

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=LoginResponse)
def login(request: Request, response: Response, payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    login_limiter.check(request_client_key(request), "Too many login attempts. Try again later.")
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash) or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})
    set_access_token_cookie(response, create_access_token(user.id))
    return LoginResponse(user=UserRead(id=user.id, email=user.email, role=user.role))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    response.delete_cookie(ACCESS_TOKEN_COOKIE, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response

@router.get("/me", response_model=UserRead)
def read_current_user(user: User = Depends(get_current_user)) -> UserRead:
    return UserRead(id=user.id, email=user.email, role=user.role)
