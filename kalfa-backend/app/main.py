from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import create_tables
from app.routes import analytics, debts, products, reminders, shop, transactions


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="Kalfa API",
    description="Esnaf için basit iş yönetimi uygulaması",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shop.router, prefix="/api/shop", tags=["Mağaza"])
app.include_router(products.router, prefix="/api/products", tags=["Ürünler"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["İşlemler"])
app.include_router(debts.router, prefix="/api/debts", tags=["Borç & Alacak"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["Hatırlatıcılar"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analiz"])


@app.get("/", tags=["Genel"])
async def root():
    return {"message": "Kalfa API çalışıyor", "version": "1.0.0"}


@app.get("/health", tags=["Genel"])
async def health():
    return {"status": "ok"}
