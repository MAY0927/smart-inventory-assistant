from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=50)
    quantity: int = Field(default=1, ge=0)
    purchase_date: date | None = None
    expected_usage_days: int | None = Field(default=None, gt=0)
    image_url: str | None = Field(default=None, max_length=2048)
    notes: str | None = Field(default=None, max_length=2000)
    attributes: dict[str, Any] = Field(default_factory=dict)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=50)
    quantity: int | None = Field(default=None, ge=0)
    purchase_date: date | None = None
    expected_usage_days: int | None = Field(default=None, gt=0)
    image_url: str | None = Field(default=None, max_length=2048)
    notes: str | None = Field(default=None, max_length=2000)
    attributes: dict[str, Any] | None = None

    @model_validator(mode="after")
    def reject_null_required_fields(self) -> "ItemUpdate":
        for field in ("name", "category", "quantity", "attributes"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class ItemRead(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
