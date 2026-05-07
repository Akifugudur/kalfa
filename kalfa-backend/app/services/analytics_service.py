from datetime import date, datetime, timezone
from calendar import monthrange

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.debt import Debt, DebtDirection
from app.models.payment_reminder import PaymentReminder
from app.models.product import Product
from app.models.transaction import Transaction, TransactionType
from app.schemas.analytics import (
    AnalyticsDashboard,
    CategoryStat,
    HomeStats,
    MonthlySummary,
    ProductStat,
)


async def get_monthly_summary(
    db: AsyncSession, year: int, month: int
) -> MonthlySummary:
    start = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end = date(year, month, last_day)

    result = await db.execute(
        select(
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
            func.sum(Transaction.profit).label("profit"),
            func.count(Transaction.id).label("count"),
        )
        .where(
            and_(
                Transaction.transaction_date >= start,
                Transaction.transaction_date <= end,
            )
        )
        .group_by(Transaction.type)
    )
    rows = result.all()

    total_sales = 0.0
    total_expenses = 0.0
    total_profit = 0.0
    sale_count = 0
    expense_count = 0
    total_income = 0.0

    for row in rows:
        t, total, profit, count = row.type, float(row.total or 0), float(row.profit or 0), row.count
        if t == TransactionType.SALE:
            total_sales += total
            total_profit += profit
            sale_count += count
            total_income += total
        elif t == TransactionType.EXPENSE:
            total_expenses += total
            expense_count += count
        elif t in (TransactionType.COLLECTION, TransactionType.OTHER_INCOME):
            total_income += total

    return MonthlySummary(
        year=year,
        month=month,
        total_sales=round(total_sales, 2),
        total_expenses=round(total_expenses, 2),
        total_income=round(total_income, 2),
        net_profit=round(total_profit - total_expenses, 2),
        sale_count=sale_count,
        expense_count=expense_count,
    )


async def get_top_products(
    db: AsyncSession, year: int, month: int, limit: int = 5
) -> list[ProductStat]:
    start = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end = date(year, month, last_day)

    result = await db.execute(
        select(
            Transaction.product_id,
            Product.name,
            func.sum(Transaction.quantity).label("total_qty"),
            func.sum(Transaction.amount).label("total_rev"),
            func.sum(Transaction.profit).label("total_profit"),
        )
        .join(Product, Transaction.product_id == Product.id)
        .where(
            and_(
                Transaction.type == TransactionType.SALE,
                Transaction.transaction_date >= start,
                Transaction.transaction_date <= end,
            )
        )
        .group_by(Transaction.product_id, Product.name)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(limit)
    )
    return [
        ProductStat(
            product_id=str(row.product_id),
            product_name=row.name,
            total_quantity=row.total_qty or 0,
            total_revenue=round(float(row.total_rev or 0), 2),
            total_profit=round(float(row.total_profit or 0), 2),
        )
        for row in result.all()
    ]


async def get_expense_by_category(
    db: AsyncSession, year: int, month: int
) -> list[CategoryStat]:
    start = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end = date(year, month, last_day)

    result = await db.execute(
        select(
            Transaction.category,
            func.sum(Transaction.amount).label("total"),
        )
        .where(
            and_(
                Transaction.type == TransactionType.EXPENSE,
                Transaction.transaction_date >= start,
                Transaction.transaction_date <= end,
            )
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
    )
    return [
        CategoryStat(
            category=row.category or "other",
            total_amount=round(float(row.total or 0), 2),
        )
        for row in result.all()
    ]


async def get_home_stats(db: AsyncSession) -> HomeStats:
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month
    today = now.date()

    summary = await get_monthly_summary(db, year, month)

    # Toplam alacak
    recv_result = await db.execute(
        select(func.sum(Debt.remaining_amount)).where(
            and_(Debt.direction == DebtDirection.THEY_OWE, Debt.is_paid == False)  # noqa: E712
        )
    )
    total_receivable = float(recv_result.scalar() or 0)

    # Toplam borç
    debt_result = await db.execute(
        select(func.sum(Debt.remaining_amount)).where(
            and_(Debt.direction == DebtDirection.I_OWE, Debt.is_paid == False)  # noqa: E712
        )
    )
    total_debt = float(debt_result.scalar() or 0)

    # Düşük stok sayısı
    low_stock_result = await db.execute(
        select(func.count(Product.id)).where(
            and_(
                Product.stock_quantity <= Product.low_stock_threshold,
                Product.is_active == True,  # noqa: E712
            )
        )
    )
    low_stock_count = low_stock_result.scalar() or 0

    # Yaklaşan ödemeler (30 gün)
    from datetime import timedelta
    upcoming_result = await db.execute(
        select(PaymentReminder)
        .where(
            and_(
                PaymentReminder.is_paid == False,  # noqa: E712
                PaymentReminder.due_date >= today,
                PaymentReminder.due_date <= today + timedelta(days=30),
            )
        )
        .order_by(PaymentReminder.due_date)
        .limit(5)
    )
    upcoming = [
        {
            "id": str(r.id),
            "title": r.title,
            "amount": float(r.amount),
            "due_date": r.due_date.isoformat(),
            "category": r.category,
        }
        for r in upcoming_result.scalars().all()
    ]

    # Son 5 işlem
    recent_result = await db.execute(
        select(Transaction).order_by(Transaction.created_at.desc()).limit(5)
    )
    recent = [
        {
            "id": str(t.id),
            "type": t.type,
            "amount": float(t.amount),
            "note": t.note,
            "date": t.transaction_date.isoformat(),
            "is_income": t.is_income,
        }
        for t in recent_result.scalars().all()
    ]

    return HomeStats(
        this_month_income=summary.total_income,
        this_month_expense=summary.total_expenses,
        this_month_profit=summary.net_profit,
        total_receivable=round(total_receivable, 2),
        total_debt=round(total_debt, 2),
        low_stock_count=low_stock_count,
        upcoming_payments=upcoming,
        recent_transactions=recent,
    )
