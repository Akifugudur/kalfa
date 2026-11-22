import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.debt import Debt, DebtDirection
from app.models.transaction import Transaction
from app.services.sale_service import apply_payment_to_debt, build_collection
from app.schemas.debt import DebtCreate, DebtPartialPayment, DebtResponse, DebtUpdate

router = APIRouter()


@router.get("/", response_model=list[DebtResponse])
async def list_debts(
    direction: DebtDirection | None = Query(None),
    is_paid: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Debt)
    filters = []
    if direction:
        filters.append(Debt.direction == direction)
    if is_paid is not None:
        filters.append(Debt.is_paid == is_paid)
    if filters:
        q = q.where(and_(*filters))
    q = q.order_by(Debt.created_at.desc())
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/", response_model=DebtResponse, status_code=status.HTTP_201_CREATED)
async def create_debt(data: DebtCreate, db: AsyncSession = Depends(get_db)):
    debt = Debt(**data.model_dump(), remaining_amount=data.amount)
    db.add(debt)
    await db.flush()
    await db.refresh(debt)
    return debt


@router.get("/{debt_id}", response_model=DebtResponse)
async def get_debt(debt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Debt).where(Debt.id == debt_id))
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Borç/alacak bulunamadı")
    return debt


@router.patch("/{debt_id}", response_model=DebtResponse)
async def update_debt(
    debt_id: uuid.UUID, data: DebtUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Debt).where(Debt.id == debt_id))
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Borç/alacak bulunamadı")
    changes = data.model_dump(exclude_none=True)
    new_amount = changes.pop("amount", None)
    if new_amount is not None:
        # Keep what has already been paid; only the open part moves.
        already_paid = float(debt.amount) - float(debt.remaining_amount)
        if new_amount < already_paid:
            raise HTTPException(
                status_code=400,
                detail=f"Tutar, ödenmiş kısımdan ({already_paid:.2f} TL) az olamaz",
            )
        debt.amount = new_amount
        debt.remaining_amount = round(new_amount - already_paid, 2)
        debt.is_paid = debt.remaining_amount <= 0
    for field, value in changes.items():
        setattr(debt, field, value)
    debt.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(debt)
    return debt


@router.post("/{debt_id}/pay", response_model=DebtResponse)
async def partial_payment(
    debt_id: uuid.UUID, data: DebtPartialPayment, db: AsyncSession = Depends(get_db)
):
    """Kısmi ödeme yap — remaining_amount düşer, tamamlandıysa is_paid=True."""
    result = await db.execute(
        select(Debt).where(Debt.id == debt_id).with_for_update()
    )
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Borç/alacak bulunamadı")
    apply_payment_to_debt(debt, data.paid_amount)

    # Müşteriden alınan para kasaya girdi: tahsilat olarak da kaydet
    if debt.direction == DebtDirection.THEY_OWE:
        db.add(build_collection(data.paid_amount, debt.person_name, debt.id, data.note))

    if data.note and not debt.note:
        debt.note = data.note

    await db.flush()
    await db.refresh(debt)
    return debt


@router.delete("/{debt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_debt(debt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Debt).where(Debt.id == debt_id))
    debt = result.scalar_one_or_none()
    if not debt:
        raise HTTPException(status_code=404, detail="Borç/alacak bulunamadı")
    # Sales and collections keep their history; they just stop pointing at
    # the deleted record.
    await db.execute(
        update(Transaction)
        .where(Transaction.related_debt_id == debt.id)
        .values(related_debt_id=None)
    )
    await db.delete(debt)
    await db.flush()
