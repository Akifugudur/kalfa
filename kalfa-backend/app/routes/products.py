import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.product import (
    ProductAddStock,
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductSell,
    ProductUpdate,
)
from app.schemas.transaction import TransactionResponse
from app.services import product_service, sale_service
from app.schemas.transaction import SaleCreate

router = APIRouter()


@router.get("/", response_model=list[ProductListResponse])
async def list_products(
    search: str | None = Query(None, description="Ürün adına göre ara"),
    low_stock_only: bool = Query(False, description="Sadece düşük stokluları göster"),
    db: AsyncSession = Depends(get_db),
):
    return await product_service.get_products(
        db, search=search, only_low_stock=low_stock_only
    )


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    return await product_service.create_product(db, data)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await product_service.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID, data: ProductUpdate, db: AsyncSession = Depends(get_db)
):
    product = await product_service.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return await product_service.update_product(db, product, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await product_service.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    await product_service.delete_product(db, product)


@router.post("/{product_id}/add-stock", response_model=ProductResponse)
async def add_stock(
    product_id: uuid.UUID, data: ProductAddStock, db: AsyncSession = Depends(get_db)
):
    """Stok ekle — isteğe bağlı olarak alış fiyatını günceller."""
    product = await product_service.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return await product_service.add_stock(db, product, data)


@router.post("/{product_id}/sell", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def sell_product(
    product_id: uuid.UUID, data: ProductSell, db: AsyncSession = Depends(get_db)
):
    """
    Ürün sat — stoku düşür ve gelir kaydı oluştur.
    Tek atomik işlem: ya ikisi birden gerçekleşir ya da ikisi birden geri alınır.
    """
    sale_data = SaleCreate(
        product_id=product_id,
        quantity=data.quantity,
        sale_price=data.sale_price,
        note=data.note,
    )
    return await sale_service.process_sale(db, sale_data)
