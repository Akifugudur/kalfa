from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.analytics import AnalyticsDashboard, HomeStats, MonthlySummary
from app.services import analytics_service

router = APIRouter()


@router.get("/home", response_model=HomeStats)
async def home_stats(db: AsyncSession = Depends(get_db)):
    """Ana sayfa için özet istatistikler — yaklaşan ödemeler, bu ay gelir/gider."""
    return await analytics_service.get_home_stats(db)


@router.get("/dashboard", response_model=AnalyticsDashboard)
async def dashboard(
    year: int | None = Query(None),
    month: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Analiz ekranı — aylık özet, en çok satanlar, gider dağılımı."""
    now = datetime.now(timezone.utc)
    y = year or now.year
    m = month or now.month

    summary = await analytics_service.get_monthly_summary(db, y, m)
    top_products = await analytics_service.get_top_products(db, y, m)
    expense_by_category = await analytics_service.get_expense_by_category(db, y, m)

    from sqlalchemy import select, and_
    from app.models.product import Product

    low_stock_result = await db.execute(
        select(Product)
        .where(
            and_(
                Product.stock_quantity <= Product.low_stock_threshold,
                Product.is_active == True,  # noqa: E712
            )
        )
        .order_by(Product.stock_quantity)
        .limit(10)
    )
    low_stock = [
        {
            "id": str(p.id),
            "name": p.name,
            "stock_quantity": p.stock_quantity,
            "low_stock_threshold": p.low_stock_threshold,
            "unit": p.unit,
        }
        for p in low_stock_result.scalars().all()
    ]

    return AnalyticsDashboard(
        summary=summary,
        top_products=top_products,
        expense_by_category=expense_by_category,
        low_stock_products=low_stock,
    )
