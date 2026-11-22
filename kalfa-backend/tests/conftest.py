"""Test setup.

Tests run against a real PostgreSQL database (row locks and Numeric types
behave differently on SQLite). Point TEST_DATABASE_URL at an empty database:

    docker run -d --rm -p 55432:5432 -e POSTGRES_PASSWORD=test postgres:16-alpine
    TEST_DATABASE_URL=postgresql+asyncpg://postgres:test@localhost:55432/postgres pytest

Every table is emptied before each test.
"""
import os

import pytest

TEST_DB = os.environ.get("TEST_DATABASE_URL")
if not TEST_DB:
    pytest.exit("Set TEST_DATABASE_URL to an empty PostgreSQL database.", returncode=2)
os.environ["DATABASE_URL"] = TEST_DB
os.environ["ENVIRONMENT"] = "test"

from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app.db import Base, create_tables, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
async def _schema():
    await create_tables()
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
async def _clean_tables():
    names = ", ".join(t.name for t in Base.metadata.sorted_tables)
    async with engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {names} CASCADE"))
    yield


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api") as c:
        yield c


@pytest.fixture
def make_product(client):
    async def _make(**overrides):
        body = {
            "name": "Yağ Filtresi",
            "stock_quantity": 10,
            "purchase_price": 100,
            "sale_price": 150,
        } | overrides
        res = await client.post("/products/", json=body)
        assert res.status_code == 201, res.text
        return res.json()

    return _make
