import asyncio

import pytest

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def make_debt(client, amount=100, direction="they_owe"):
    res = await client.post(
        "/debts/", json={"direction": direction, "person_name": "Veli", "amount": amount}
    )
    assert res.status_code == 201
    return res.json()


async def pay(client, debt_id, amount):
    return await client.post(f"/debts/{debt_id}/pay", json={"paid_amount": amount})


async def debt_of(client, debt_id):
    return (await client.get(f"/debts/{debt_id}")).json()


async def test_partial_then_full_payment(client):
    debt = await make_debt(client, 100)

    first = (await pay(client, debt["id"], 40)).json()
    assert first["remaining_amount"] == 60
    assert not first["is_paid"]

    second = (await pay(client, debt["id"], 60)).json()
    assert second["remaining_amount"] == 0
    assert second["is_paid"]


async def test_overpayment_is_rejected(client):
    debt = await make_debt(client, 100)

    assert (await pay(client, debt["id"], 150)).status_code == 400


async def test_payment_on_receivable_is_booked_as_collection(client):
    debt = await make_debt(client, 100)

    await pay(client, debt["id"], 30)

    collections = (await client.get("/transactions/", params={"type": "collection"})).json()
    assert [c["amount"] for c in collections] == [30]


async def test_concurrent_payments_cannot_overpay(client):
    debt = await make_debt(client, 100)

    results = await asyncio.gather(*[pay(client, debt["id"], 60) for _ in range(5)])

    assert sum(r.status_code == 200 for r in results) == 1
    assert (await debt_of(client, debt["id"]))["remaining_amount"] == 40


async def test_changing_amount_keeps_paid_part(client):
    debt = await make_debt(client, 100)
    await pay(client, debt["id"], 80)

    res = await client.patch(f"/debts/{debt['id']}", json={"amount": 120})

    assert res.status_code == 200
    assert res.json()["remaining_amount"] == 40


async def test_amount_below_paid_part_is_rejected(client):
    """Regression: the amount could be lowered to 50 after 80 was paid."""
    debt = await make_debt(client, 100)
    await pay(client, debt["id"], 80)

    res = await client.patch(f"/debts/{debt['id']}", json={"amount": 50})

    assert res.status_code == 400


async def test_remaining_amount_cannot_be_patched_directly(client):
    debt = await make_debt(client, 100)

    await client.patch(f"/debts/{debt['id']}", json={"remaining_amount": 0, "is_paid": True})

    fresh = await debt_of(client, debt["id"])
    assert fresh["remaining_amount"] == 100
    assert not fresh["is_paid"]


async def test_deleting_credit_sale_debt_keeps_sale_history(client, make_product):
    product = await make_product()
    sale = (
        await client.post(
            "/transactions/sale",
            json={
                "product_id": product["id"],
                "quantity": 1,
                "sale_price": 150,
                "payment_method": "credit",
                "customer_name": "Ali",
            },
        )
    ).json()

    assert (await client.delete(f"/debts/{sale['related_debt_id']}")).status_code == 204

    kept = (await client.get(f"/transactions/{sale['id']}")).json()
    assert kept["related_debt_id"] is None
    assert kept["amount"] == 150
