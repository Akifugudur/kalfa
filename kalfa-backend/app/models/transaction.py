import uuid
from datetime import date, datetime, timezone
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class TransactionType(str, Enum):
    SALE = "sale"                  # Satış (stoktan düşer, gelir yazar)
    COLLECTION = "collection"      # Tahsilat (alacak tahsil)
    EXPENSE = "expense"            # Gider (kira, maas, fatura vs.)
    OTHER_INCOME = "other_income"  # Serbest gelir


class ExpenseCategory(str, Enum):
    CREDIT_CARD = "credit_card"
    FOOD = "food"
    RENT = "rent"
    BILLS = "bills"
    SALARY = "salary"
    MATERIAL = "material"
    OTHER = "other"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    type: Mapped[TransactionType] = mapped_column(
        String(20), nullable=False, index=True
    )

    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Gider kategorisi (type == EXPENSE ise dolu)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Satış bilgileri (type == SALE ise dolu)
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    purchase_price_snapshot: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )  # Satış anındaki alış fiyatı (kar hesabı için)
    sale_price_snapshot: Mapped[float | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    profit: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Tahsilat bilgileri (type == COLLECTION ise dolu)
    related_person: Mapped[str | None] = mapped_column(String(200), nullable=True)
    related_debt_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Tarih
    transaction_date: Mapped[date] = mapped_column(
        Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    product: Mapped["Product"] = relationship(  # noqa: F821
        "Product", back_populates="transactions"
    )

    @property
    def is_income(self) -> bool:
        return self.type in (
            TransactionType.SALE,
            TransactionType.COLLECTION,
            TransactionType.OTHER_INCOME,
        )
