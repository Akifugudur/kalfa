import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator

from app.models.transaction import ExpenseCategory, PaymentMethod, TransactionType


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
    payment_method: PaymentMethod = PaymentMethod.CASH
    customer_name: str | None = Field(None, max_length=200)
    note: str | None = None
    transaction_date: date | None = None

    @model_validator(mode="after")
    def _veresiye_needs_customer(self):
        if self.customer_name is not None:
            self.customer_name = self.customer_name.strip() or None
        if self.payment_method == PaymentMethod.CREDIT and not self.customer_name:
            raise ValueError("Veresiye satışta müşteri adı zorunlu")
        return self


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
    payment_method: PaymentMethod
    related_person: str | None
    related_debt_id: uuid.UUID | None
    transaction_date: date
    created_at: datetime
    is_income: bool
