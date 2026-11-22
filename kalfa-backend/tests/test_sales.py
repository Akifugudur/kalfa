import asyncio

import pytest

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def sell(client, product_id, quantity=1, price=150):
    return await client.post(
        f"/products/{product_id}/sell", json={"quantity": quantity, "sale_price": price}
    )


async def stock_of(client, product_id):
    return (await client.get(f"/products/{product_id}")).json()["stock_quantity"]


async def test_sale_reduces_stock_and_records_profit(client, make_product):
    product = await make_product(stock_quantity=10, purchase_price=100)

    res = await sell(client, product["id"], quantity=3, price=150)

    assert res.status_code == 201
    assert res.json()["amount"] == 450
    assert res.json()["profit"] == 150
    assert await stock_of(client, product["id"]) == 7


async def test_cannot_sell_more_than_in_stock(client, make_product):
    product = await make_product(stock_quantity=2)

    res = await sell(client, product["id"], quantity=3)

    assert res.status_code == 400
    assert await stock_of(client, product["id"]) == 2


async def test_concurrent_sales_never_oversell(client, make_product):
    """Regression: without a row lock, 40 parallel sales of a product with
    5 in stock were all accepted and the stock ended at 3."""
    product = await make_product(stock_quantity=5)

    results = await asyncio.gather(*[sell(client, product["id"]) for _ in range(20)])

    assert sum(r.status_code == 201 for r in results) == 5
    assert all(r.status_code in (201, 400) for r in results)
    assert await stock_of(client, product["id"]) == 0
    sales = (await client.get("/transactions/", params={"type": "sale"})).json()
    assert len(sales) == 5


async def test_concurrent_restocks_are_all_counted(client, make_product):
    product = await make_product(stock_quantity=0)
    url = f"/products/{product['id']}/add-stock"

    await asyncio.gather(*[client.post(url, json={"quantity": 2}) for _ in range(10)])

    assert await stock_of(client, product["id"]) == 20


async def test_credit_sale_opens_receivable(client, make_product):
    product = await make_product()

    res = await client.post(
        "/transactions/sale",
        json={
            "product_id": product["id"],
            "quantity": 2,
            "sale_price": 150,
            "payment_method": "credit",
            "customer_name": "Ali Usta",
        },
    )

    assert res.status_code == 201
    debt = (await client.get(f"/debts/{res.json()['related_debt_id']}")).json()
    assert debt["direction"] == "they_owe"
    assert debt["person_name"] == "Ali Usta"
    assert debt["remaining_amount"] == 300


async def test_credit_sale_requires_customer(client, make_product):
    product = await make_product()

    res = await client.post(
        "/transactions/sale",
        json={
            "product_id": product["id"],
            "quantity": 1,
            "sale_price": 150,
            "payment_method": "credit",
        },
    )

    assert res.status_code == 422
