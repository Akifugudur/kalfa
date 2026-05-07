import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import (
    CollectionCreate,
    ExpenseCreate,
    SaleCreate,
    TransactionResponse,
)
from app.services import sale_service

router = APIRouter()


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    type: TransactionType | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    q = select(Transaction)
    filters = []
    if type:
        filters.append(Transaction.type == type)
    if start_date:
        filters.append(Transaction.transaction_date >= start_date)
    if end_date:
        filters.append(Transaction.transaction_date <= end_date)
    if filters:
        q = q.where(and_(*filters))
    q = q.order_by(Transaction.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/sale", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(data: SaleCreate, db: AsyncSession = Depends(get_db)):
    """Satış kaydı — stok otomatik düşer."""
    return await sale_service.process_sale(db, data)


@router.post("/collection", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(data: CollectionCreate, db: AsyncSession = Depends(get_db)):
    """Alacak tahsilat kaydı."""
    return await sale_service.process_collection(db, data)


@router.post("/expense", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(data: ExpenseCreate, db: AsyncSession = Depends(get_db)):
    """Gider kaydı."""
    return await sale_service.process_expense(db, data)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    tx = result.scalar_one_or_none()
    if not tx:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="İşlem bulunamadı")
    return tx
