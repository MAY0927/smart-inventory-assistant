import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from app.dependencies import get_current_user
from app.models.user import User
from app.rate_limit import image_ip_limiter, image_user_limiter, request_client_key

from app.schemas.image_intake import ImageIntakeResult
from app.services.gemini_image import analyze_inventory_image


router = APIRouter(prefix="/image-intake", tags=["image intake"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024


def _matches_image_signature(image_bytes: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return image_bytes.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return len(image_bytes) >= 12 and image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP"
    return False


@router.post("/analyze", response_model=ImageIntakeResult)
async def analyze_image(
    request: Request,
    image: UploadFile = File(...),
    _user: User = Depends(get_current_user),
) -> ImageIntakeResult:
    image_user_limiter.check(
        f"user:{_user.id}",
        "Image analysis rate limit reached. Try again later.",
    )
    image_ip_limiter.check(
        f"ip:{request_client_key(request)}",
        "Image analysis rate limit reached. Try again later.",
    )
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a JPEG, PNG, or WebP image",
        )

    image_bytes = await image.read(MAX_IMAGE_BYTES + 1)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 8 MB or smaller")
    if not _matches_image_signature(image_bytes, image.content_type):
        raise HTTPException(status_code=415, detail="The uploaded file is not a valid image")

    try:
        return await analyze_inventory_image(image_bytes, image.content_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Image analysis is not configured") from exc
    except httpx.HTTPStatusError as exc:
        detail = "Gemini could not analyze this image"
        if exc.response.status_code == 429:
            detail = "Gemini rate limit reached. Try again shortly."
        raise HTTPException(status_code=502, detail=detail) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Gemini returned an invalid response") from exc
