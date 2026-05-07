import uuid
from datetime import date, datetime, timezone
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Recurrence(str, Enum):
    NONE = "none"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class PaymentReminder(Base):
    __tablename__ = "payment_reminders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)

    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    recurrence: Mapped[Recurrence] = mapped_column(
        String(20), default=Recurrence.NONE, nullable=False
    )

    is_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
