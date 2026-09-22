import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.image_intake import ImageIntakeResult
from app.services.gemini_image import analyze_inventory_image


router = APIRouter(prefix="/image-intake", tags=["image intake"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024


@router.post("/analyze", response_model=ImageIntakeResult)
async def analyze_image(image: UploadFile = File(...)) -> ImageIntakeResult:
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

    try:
        return await analyze_inventory_image(image_bytes, image.content_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        detail = "Gemini could not analyze this image"
        if exc.response.status_code == 429:
            detail = "Gemini rate limit reached. Try again shortly."
        raise HTTPException(status_code=502, detail=detail) from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Gemini returned an invalid response") from exc
