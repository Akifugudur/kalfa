import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.payment_reminder import PaymentReminder
from app.schemas.debt import ReminderCreate, ReminderResponse, ReminderUpdate

router = APIRouter()


@router.get("/", response_model=list[ReminderResponse])
async def list_reminders(
    is_paid: bool | None = None, db: AsyncSession = Depends(get_db)
):
    q = select(PaymentReminder).order_by(PaymentReminder.due_date)
    if is_paid is not None:
        q = q.where(PaymentReminder.is_paid == is_paid)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(data: ReminderCreate, db: AsyncSession = Depends(get_db)):
    reminder = PaymentReminder(**data.model_dump())
    db.add(reminder)
    await db.flush()
    await db.refresh(reminder)
    return reminder


@router.patch("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: uuid.UUID, data: ReminderUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PaymentReminder).where(PaymentReminder.id == reminder_id)
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(reminder, field, value)
    await db.flush()
    await db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PaymentReminder).where(PaymentReminder.id == reminder_id)
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")
    await db.delete(reminder)
    await db.flush()
