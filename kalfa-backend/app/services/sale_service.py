"""
Satış servisi: stok düşürme + gelir kaydı tek bir DB transaction içinde.
Bu atomiklik kritik — biri başarısız olursa ikisi de geri alınır.
"""
import uuid
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.clock import today_local
from app.models.debt import Debt, DebtDirection, DebtType
from app.models.transaction import PaymentMethod, Transaction, TransactionType
from app.schemas.transaction import SaleCreate, CollectionCreate, ExpenseCreate
from app.services.product_service import get_product


async def process_sale(db: AsyncSession, data: SaleCreate) -> Transaction:
    """
    Satış işlemi:
    1. Ürünü bul ve stok kontrolü yap
    2. Stoku düşür
    3. Transaction kaydı oluştur (kar hesaplanır)
    4. Veresiyeyse müşteriye alacak (THEY_OWE) kaydı aç
    Tek DB transaction içinde — ya hepsi ya hiçbiri.
    """
    product = await get_product(db, data.product_id, for_update=True)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ürün bulunamadı",
        )
    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu ürün aktif değil",
        )
    if product.stock_quantity < data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Yetersiz stok. Mevcut: {product.stock_quantity} {product.unit}",
        )

    # Stoku düşür
    product.stock_quantity -= data.quantity
    product.updated_at = datetime.now(timezone.utc)

    # Kar hesapla
    purchase_total = float(product.purchase_price) * data.quantity
    sale_total = data.sale_price * data.quantity
    profit = sale_total - purchase_total

    sale_date = data.transaction_date or today_local()

    # Veresiye: müşteriye alacak aç (defterdeki "borç" sayfası)
    debt = None
    if data.payment_method == PaymentMethod.CREDIT:
        debt = Debt(
            direction=DebtDirection.THEY_OWE,
            debt_type=DebtType.PERSON,
            person_name=data.customer_name,
            amount=sale_total,
            remaining_amount=sale_total,
            note=_debt_note(product.name, data.quantity, data.note),
        )
        db.add(debt)
        await db.flush()

    # Transaction kaydı
    tx = Transaction(
        type=TransactionType.SALE,
        amount=sale_total,
        note=data.note,
        product_id=data.product_id,
        quantity=data.quantity,
        purchase_price_snapshot=float(product.purchase_price),
        sale_price_snapshot=data.sale_price,
        profit=profit,
        payment_method=data.payment_method,
        related_person=data.customer_name,
        related_debt_id=debt.id if debt else None,
        transaction_date=sale_date,
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx


def _debt_note(product_name: str, quantity: int, note: str | None) -> str:
    base = f"Veresiye satış: {product_name}" + (f" x{quantity}" if quantity > 1 else "")
    return f"{base} — {note}" if note else base


def apply_payment_to_debt(debt: Debt, amount: float) -> None:
    """Borç/alacaktan ödeme düş. Fazla ödeme ve kapanmış borç reddedilir."""
    if debt.is_paid:
        raise HTTPException(status_code=400, detail="Bu borç zaten ödenmiş")
    if amount > float(debt.remaining_amount):
        raise HTTPException(
            status_code=400,
            detail=f"Ödeme tutarı kalan miktardan büyük ({debt.remaining_amount} TL)",
        )
    debt.remaining_amount = round(float(debt.remaining_amount) - amount, 2)
    if debt.remaining_amount <= 0:
        debt.remaining_amount = 0
        debt.is_paid = True
    debt.updated_at = datetime.now(timezone.utc)


def build_collection(
    amount: float,
    person: str,
    debt_id: uuid.UUID | None,
    note: str | None,
    tx_date: date | None = None,
) -> Transaction:
    return Transaction(
        type=TransactionType.COLLECTION,
        amount=amount,
        note=note,
        related_person=person,
        related_debt_id=debt_id,
        transaction_date=tx_date or today_local(),
    )


async def process_collection(db: AsyncSession, data: CollectionCreate) -> Transaction:
    """
    Alacak tahsilat kaydı. Bir alacağa bağlıysa o alacağın kalan tutarı da
    aynı DB transaction içinde düşer — tahsilat ve borç hep tutarlı kalır.
    """
    if data.related_debt_id:
        debt = await db.get(Debt, data.related_debt_id, with_for_update=True)
        if not debt or debt.direction != DebtDirection.THEY_OWE:
            raise HTTPException(status_code=404, detail="Alacak bulunamadı")
        apply_payment_to_debt(debt, data.amount)

    tx = build_collection(
        data.amount, data.related_person, data.related_debt_id,
        data.note, data.transaction_date,
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx


async def process_expense(db: AsyncSession, data: ExpenseCreate) -> Transaction:
    """Gider kaydı."""
    tx = Transaction(
        type=TransactionType.EXPENSE,
        amount=data.amount,
        category=data.category.value if data.category else None,
        note=data.note,
        transaction_date=data.transaction_date or today_local(),
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx
