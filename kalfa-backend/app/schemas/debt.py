import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.debt import DebtDirection, DebtType


class DebtCreate(BaseModel):
    direction: DebtDirection
    debt_type: DebtType = DebtType.PERSON
    person_name: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    due_date: date | None = None
    note: str | None = None


class DebtUpdate(BaseModel):
    person_name: str | None = None
    amount: float | None = Field(None, gt=0)
    remaining_amount: float | None = Field(None, ge=0)
    due_date: date | None = None
    is_paid: bool | None = None
    note: str | None = None


class DebtPartialPayment(BaseModel):
    paid_amount: float = Field(..., gt=0, description="Ödenen miktar")
    note: str | None = None


class DebtResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    direction: DebtDirection
    debt_type: DebtType
    person_name: str
    amount: float
    remaining_amount: float
    due_date: date | None
    is_paid: bool
    note: str | None
    created_at: datetime
    updated_at: datetime


class ReminderCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=50)
    due_date: date
    recurrence: str = "none"
    note: str | None = None


class ReminderUpdate(BaseModel):
    title: str | None = None
    amount: float | None = None
    due_date: date | None = None
    is_paid: bool | None = None
    note: str | None = None


class ReminderResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    title: str
    amount: float
    category: str
    due_date: date
    recurrence: str
    is_paid: bool
    note: str | None
    created_at: datetime
