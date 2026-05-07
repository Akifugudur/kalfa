import uuid
from datetime import datetime

from pydantic import BaseModel, Field, computed_field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, examples=["Yağ Filtresi"])
    description: str | None = None
    stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    unit: str = Field(default="adet", max_length=20)
    purchase_price: float = Field(default=0, ge=0)
    sale_price: float = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    low_stock_threshold: int | None = Field(None, ge=0)
    unit: str | None = None
    purchase_price: float | None = Field(None, ge=0)
    sale_price: float | None = Field(None, ge=0)
    is_active: bool | None = None


class ProductAddStock(BaseModel):
    quantity: int = Field(..., gt=0, description="Eklenecek stok miktarı")
    purchase_price: float | None = Field(None, ge=0, description="Yeni alış fiyatı (opsiyonel)")
    note: str | None = None


class ProductSell(BaseModel):
    quantity: int = Field(..., gt=0, description="Satılacak miktar")
    sale_price: float = Field(..., gt=0, description="Satış fiyatı")
    note: str | None = None


class ProductResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    description: str | None
    stock_quantity: int
    low_stock_threshold: int
    unit: str
    purchase_price: float
    sale_price: float
    is_active: bool
    is_low_stock: bool
    profit_margin: float
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    stock_quantity: int
    sale_price: float
    is_low_stock: bool
    unit: str
