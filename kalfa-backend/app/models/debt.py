import uuid
from datetime import date, datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class DebtDirection(str, Enum):
    I_OWE = "i_owe"        # Ben borçluyum
    THEY_OWE = "they_owe"  # Onlar borçlu (alacak)


class DebtType(str, Enum):
    PERSON = "person"           # Kişi borcu
    CREDIT_CARD = "credit_card" # Kredi kartı
    SUPPLIER = "supplier"       # Tedarikçi
    OTHER = "other"


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    direction: Mapped[DebtDirection] = mapped_column(String(20), nullable=False, index=True)
    debt_type: Mapped[DebtType] = mapped_column(String(20), default=DebtType.PERSON, nullable=False)

    person_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    remaining_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
