import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductAddStock


async def get_product(db: AsyncSession, product_id: uuid.UUID) -> Product | None:
    result = await db.execute(select(Product).where(Product.id == product_id))
    return result.scalar_one_or_none()


async def get_products(
    db: AsyncSession,
    search: str | None = None,
    only_active: bool = True,
    only_low_stock: bool = False,
    skip: int = 0,
    limit: int = 100,
) -> list[Product]:
    q = select(Product)
    if only_active:
        q = q.where(Product.is_active == True)  # noqa: E712
    if search:
        q = q.where(Product.name.ilike(f"%{search}%"))
    if only_low_stock:
        q = q.where(Product.stock_quantity <= Product.low_stock_threshold)
    q = q.order_by(Product.name).offset(skip).limit(limit)
    result = await db.execute(q)
    return list(result.scalars().all())


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


async def update_product(
    db: AsyncSession, product: Product, data: ProductUpdate
) -> Product:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    product.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(product)
    return product


async def add_stock(
    db: AsyncSession, product: Product, data: ProductAddStock
) -> Product:
    product.stock_quantity += data.quantity
    if data.purchase_price is not None:
        product.purchase_price = data.purchase_price
    product.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product: Product) -> None:
    product.is_active = False
    product.updated_at = datetime.now(timezone.utc)
    await db.flush()
