import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.routers.items import router as items_router
from app.routers.auth import router as auth_router
from app.routers.image_intake import router as image_intake_router
from app.routers.purchase_evaluations import router as purchase_evaluations_router

def _csv_env(name: str, default: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


cors_origins = _csv_env("CORS_ORIGINS", "http://localhost:5173")
if not cors_origins or "*" in cors_origins:
    raise RuntimeError("CORS_ORIGINS must contain explicit origins and cannot contain *")

allowed_hosts = _csv_env("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
enable_api_docs = os.getenv("ENABLE_API_DOCS", "false").strip().lower() in {"1", "true", "yes", "on"}

app = FastAPI(
    title="Smart Inventory Assistant API",
    version="0.1.0",
    docs_url="/docs" if enable_api_docs else None,
    redoc_url="/redoc" if enable_api_docs else None,
    openapi_url="/openapi.json" if enable_api_docs else None,
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def enforce_request_size(request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            request_length = int(content_length)
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})

        content_type = request.headers.get("content-type", "").lower()
        max_length = 9 * 1024 * 1024 if "multipart/form-data" in content_type else 256 * 1024
        if request_length > max_length:
            return JSONResponse(status_code=413, content={"detail": "Request body is too large"})

    return await call_next(request)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "same-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.setdefault("Cache-Control", "no-store")
    return response

app.include_router(items_router)
app.include_router(auth_router)
app.include_router(image_intake_router)
app.include_router(purchase_evaluations_router)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
