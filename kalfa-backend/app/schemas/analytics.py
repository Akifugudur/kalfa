from pydantic import BaseModel


class ProductStat(BaseModel):
    product_id: str
    product_name: str
    total_quantity: int
    total_revenue: float
    total_profit: float


class CategoryStat(BaseModel):
    category: str
    total_amount: float


class MonthlySummary(BaseModel):
    year: int
    month: int
    total_sales: float
    total_expenses: float
    total_income: float   # Satış + tahsilat + diğer gelirler
    net_profit: float     # Satış karı - giderler
    sale_count: int
    expense_count: int


class HomeStats(BaseModel):
    """Ana sayfa özet verileri."""
    this_month_income: float
    this_month_expense: float
    this_month_profit: float
    total_receivable: float      # Toplam alacak
    total_debt: float            # Toplam borç
    low_stock_count: int
    upcoming_payments: list[dict]
    recent_transactions: list[dict]


class AnalyticsDashboard(BaseModel):
    summary: MonthlySummary
    top_products: list[ProductStat]
    expense_by_category: list[CategoryStat]
    low_stock_products: list[dict]
