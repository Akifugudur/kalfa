"""
Satış servisi: stok düşürme + gelir kaydı tek bir DB transaction içinde.
Bu atomiklik kritik — biri başarısız olursa ikisi de geri alınır.
"""
import uuid
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import SaleCreate, CollectionCreate, ExpenseCreate
from app.services.product_service import get_product


async def process_sale(db: AsyncSession, data: SaleCreate) -> Transaction:
    """
    Satış işlemi:
    1. Ürünü bul ve stok kontrolü yap
    2. Stoku düşür
    3. Transaction kaydı oluştur (kar hesaplanır)
    Tek DB transaction içinde — ya hepsi ya hiçbiri.
    """
    product = await get_product(db, data.product_id)
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
        transaction_date=data.transaction_date or datetime.now(timezone.utc).date(),
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx


async def process_collection(db: AsyncSession, data: CollectionCreate) -> Transaction:
    """Alacak tahsilat kaydı."""
    tx = Transaction(
        type=TransactionType.COLLECTION,
        amount=data.amount,
        note=data.note,
        related_person=data.related_person,
        related_debt_id=data.related_debt_id,
        transaction_date=data.transaction_date or datetime.now(timezone.utc).date(),
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
        transaction_date=data.transaction_date or datetime.now(timezone.utc).date(),
    )
    db.add(tx)
    await db.flush()
    await db.refresh(tx)
    return tx
