import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.transaction import ExpenseCategory, TransactionType


class TransactionCreate(BaseModel):
    type: TransactionType
    amount: float = Field(..., gt=0)
    note: str | None = None
    category: ExpenseCategory | None = None
    related_person: str | None = None
    transaction_date: date | None = None


class SaleCreate(BaseModel):
    """Ürün satış endpoint'i için özel şema — stoku otomatik düşer."""
    product_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    sale_price: float = Field(..., gt=0)
    note: str | None = None
    transaction_date: date | None = None


class CollectionCreate(BaseModel):
    """Alacak tahsilat şeması."""
    amount: float = Field(..., gt=0)
    related_person: str = Field(..., min_length=1)
    related_debt_id: uuid.UUID | None = None
    note: str | None = None
    transaction_date: date | None = None


class ExpenseCreate(BaseModel):
    """Gider şeması."""
    amount: float = Field(..., gt=0)
    category: ExpenseCategory = ExpenseCategory.OTHER
    note: str | None = None
    transaction_date: date | None = None


class TransactionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    type: TransactionType
    amount: float
    note: str | None
    category: str | None
    product_id: uuid.UUID | None
    quantity: int | None
    purchase_price_snapshot: float | None
    sale_price_snapshot: float | None
    profit: float | None
    related_person: str | None
    transaction_date: date
    created_at: datetime
    is_income: bool
