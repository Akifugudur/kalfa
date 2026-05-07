import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ShopProfileCreate(BaseModel):
    shop_name: str = Field(..., min_length=1, max_length=200)
    owner_name: str = Field(..., min_length=1, max_length=200)
    phone: str | None = None
    city: str | None = None
    employee_count: int = Field(default=1, ge=1)
    currency: str = Field(default="TRY", max_length=5)


class ShopProfileUpdate(BaseModel):
    shop_name: str | None = None
    owner_name: str | None = None
    phone: str | None = None
    city: str | None = None
    employee_count: int | None = Field(None, ge=1)
    onboarding_complete: bool | None = None


class ShopProfileResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    shop_name: str
    owner_name: str
    phone: str | None
    city: str | None
    employee_count: int
    currency: str
    onboarding_complete: bool
    created_at: datetime
    updated_at: datetime


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    role: str = Field(default="Çırak", max_length=100)
    salary: float = Field(default=0, ge=0)
    phone: str | None = None


class EmployeeResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    role: str
    salary: float
    phone: str | None
    is_active: bool
    created_at: datetime


class OnboardingData(BaseModel):
    """İlk kurulum verisi."""
    shop_name: str = Field(..., min_length=1)
    owner_name: str = Field(..., min_length=1)
    city: str | None = None
    employee_count: int = Field(default=1, ge=1)
    estimated_total_debt: float = Field(default=0, ge=0)
    monthly_rent: float = Field(default=0, ge=0)
    monthly_salaries: float = Field(default=0, ge=0)
    monthly_bills: float = Field(default=0, ge=0)
