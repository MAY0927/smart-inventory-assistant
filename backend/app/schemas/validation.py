from __future__ import annotations

import math
from typing import Any


MAX_ATTRIBUTE_KEYS = 32
MAX_ATTRIBUTE_KEY_LENGTH = 64
MAX_ATTRIBUTE_STRING_LENGTH = 500


def validate_flat_attributes(value: dict[str, Any]) -> dict[str, Any]:
    if len(value) > MAX_ATTRIBUTE_KEYS:
        raise ValueError(f"attributes cannot contain more than {MAX_ATTRIBUTE_KEYS} keys")

    for key, attribute in value.items():
        if not isinstance(key, str) or not key.strip():
            raise ValueError("attribute keys must be non-empty strings")
        if len(key) > MAX_ATTRIBUTE_KEY_LENGTH:
            raise ValueError("attribute keys are too long")
        if isinstance(attribute, str) and len(attribute) > MAX_ATTRIBUTE_STRING_LENGTH:
            raise ValueError("attribute values are too long")
        if isinstance(attribute, float) and not math.isfinite(attribute):
            raise ValueError("attribute numbers must be finite")
        if attribute is not None and not isinstance(attribute, (str, int, float, bool)):
            raise ValueError("attribute values must be scalar JSON values")

    return value
