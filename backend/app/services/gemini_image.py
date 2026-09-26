import base64
import json
import os

import httpx

from app.schemas.image_intake import ImageIntakeResult


PROMPT = """Analyze the single inventory item in this image.
Return concise English values for a personal inventory form.
Choose category from exactly: Clothing, Shoes, Household, Food, Other.
Do not guess a brand. If a visual attribute cannot be determined, use an empty string.
The name should be specific but short. Notes should be one useful sentence.
Return JSON only."""


async def analyze_inventory_image(image_bytes: bytes, mime_type: str) -> ImageIntakeResult:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{
            "parts": [
                {"text": PROMPT},
                {"inlineData": {
                    "mimeType": mime_type,
                    "data": base64.b64encode(image_bytes).decode("ascii"),
                }},
            ]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseJsonSchema": ImageIntakeResult.model_json_schema(),
            "temperature": 0.2,
        },
    }

    async with httpx.AsyncClient(timeout=45, trust_env=False) as client:
        response = await client.post(
            url,
            headers={"x-goog-api-key": api_key},
            json=payload,
        )
        response.raise_for_status()

    data = response.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return ImageIntakeResult.model_validate(json.loads(text))
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Gemini returned an invalid image analysis response") from exc
