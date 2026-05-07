from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.employee import Employee
from app.models.payment_reminder import PaymentReminder
from app.models.shop_profile import ShopProfile
from app.schemas.shop import (
    EmployeeCreate,
    EmployeeResponse,
    OnboardingData,
    ShopProfileCreate,
    ShopProfileResponse,
    ShopProfileUpdate,
)

router = APIRouter()


async def _get_profile(db: AsyncSession) -> ShopProfile | None:
    result = await db.execute(select(ShopProfile).limit(1))
    return result.scalar_one_or_none()


@router.get("/", response_model=ShopProfileResponse | None)
async def get_shop(db: AsyncSession = Depends(get_db)):
    return await _get_profile(db)


@router.post("/", response_model=ShopProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_shop(data: ShopProfileCreate, db: AsyncSession = Depends(get_db)):
    existing = await _get_profile(db)
    if existing:
        raise HTTPException(status_code=400, detail="Mağaza profili zaten var. PATCH ile güncelle.")
    profile = ShopProfile(**data.model_dump())
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.patch("/", response_model=ShopProfileResponse)
async def update_shop(data: ShopProfileUpdate, db: AsyncSession = Depends(get_db)):
    profile = await _get_profile(db)
    if not profile:
        raise HTTPException(status_code=404, detail="Önce mağaza profili oluştur")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    profile.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(profile)
    return profile


@router.post("/onboarding", response_model=ShopProfileResponse, status_code=status.HTTP_201_CREATED)
async def complete_onboarding(data: OnboardingData, db: AsyncSession = Depends(get_db)):
    """
    İlk kurulum akışı — tek istekte:
    - Mağaza profili oluştur
    - Sabit gider hatırlatıcıları oluştur (kira, maaş, fatura)
    """
    existing = await _get_profile(db)
    if existing and existing.onboarding_complete:
        raise HTTPException(status_code=400, detail="Kurulum zaten tamamlandı")

    if existing:
        profile = existing
        profile.shop_name = data.shop_name
        profile.owner_name = data.owner_name
        profile.city = data.city
        profile.employee_count = data.employee_count
    else:
        profile = ShopProfile(
            shop_name=data.shop_name,
            owner_name=data.owner_name,
            city=data.city,
            employee_count=data.employee_count,
        )
        db.add(profile)
        await db.flush()

    # Otomatik hatırlatıcı oluştur
    from datetime import date
    today = datetime.now(timezone.utc).date()
    import calendar
    _, last_day = calendar.monthrange(today.year, today.month)
    first_next = date(today.year, today.month % 12 + 1, 1) if today.month < 12 else date(today.year + 1, 1, 1)

    reminders_to_create = []
    if data.monthly_rent > 0:
        reminders_to_create.append(
            PaymentReminder(title="Kira", amount=data.monthly_rent, category="rent",
                            due_date=first_next, recurrence="monthly")
        )
    if data.monthly_salaries > 0:
        reminders_to_create.append(
            PaymentReminder(title="Maaşlar", amount=data.monthly_salaries, category="salary",
                            due_date=first_next, recurrence="monthly")
        )
    if data.monthly_bills > 0:
        reminders_to_create.append(
            PaymentReminder(title="Faturalar", amount=data.monthly_bills, category="bills",
                            due_date=first_next, recurrence="monthly")
        )

    for r in reminders_to_create:
        db.add(r)

    profile.onboarding_complete = True
    profile.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(profile)
    return profile


# --- Çalışanlar ---

@router.get("/employees", response_model=list[EmployeeResponse])
async def list_employees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Employee).where(Employee.is_active == True).order_by(Employee.name)  # noqa: E712
    )
    return list(result.scalars().all())


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(data: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    emp = Employee(**data.model_dump())
    db.add(emp)
    await db.flush()
    await db.refresh(emp)
    return emp
