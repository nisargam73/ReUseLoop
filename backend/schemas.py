from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal


# ==========================================
# CREATE ITEM SCHEMA
# ==========================================

class ItemCreate(BaseModel):
    owner_id: int = Field(gt=0)
    category_id: int = Field(gt=0)

    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=10)

    item_condition: Literal[
        "New", "Like New", "Good", "Fair"
    ] = "Good"

    listing_type: Literal[
        "Sale", "Exchange", "Donation"
    ]

    price: Optional[float] = Field(default=None, ge=0)

    city: str = Field(min_length=2, max_length=100)

    # Required seller contact email
    contact_email: EmailStr


# ==========================================
# ITEM RESPONSE SCHEMA
# ==========================================

class ItemResponse(BaseModel):
    item_id: int
    owner_id: int
    category_id: int

    title: str
    description: Optional[str] = None

    item_condition: str
    listing_type: str

    price: Optional[float] = None
    city: str

    status: str
    image_url: Optional[str] = None

    contact_email: Optional[str] = None

    owner_name: Optional[str] = None
    owner_email: Optional[str] = None