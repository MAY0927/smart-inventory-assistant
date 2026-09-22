from typing import Literal

from pydantic import BaseModel, Field


class ImageIntakeResult(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: Literal["Clothing", "Shoes", "Household", "Food", "Other"]
    color: str = Field(default="", max_length=80)
    style: str = Field(default="", max_length=80)
    material: str = Field(default="", max_length=80)
    purpose: str = Field(default="", max_length=120)
    notes: str = Field(default="", max_length=500)
