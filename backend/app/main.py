from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.items import router as items_router

app = FastAPI(
    title="Smart Inventory Assistant API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items_router)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
