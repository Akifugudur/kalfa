import pytest

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_paging_returns_every_product_exactly_once(client, make_product):
    """Regression: the list stopped at 100 products with no way to see more.
    Duplicate names must not make paging skip or repeat items."""
    for i in range(23):
        await make_product(name="Akü" if i % 2 else f"Parça {i:02d}")

    seen = []
    skip = 0
    while True:
        page = (await client.get("/products/", params={"skip": skip, "limit": 5})).json()
        if not page:
            break
        seen += [p["id"] for p in page]
        skip += len(page)

    assert len(seen) == 23
    assert len(set(seen)) == 23


async def test_page_size_is_capped(client):
    res = await client.get("/products/", params={"limit": 5000})

    assert res.status_code == 422


async def test_search_is_case_insensitive(client, make_product):
    await make_product(name="Yağ Filtresi")
    await make_product(name="Hava Filtresi")
    await make_product(name="Fren Balatası")

    names = [p["name"] for p in (await client.get("/products/", params={"search": "filtre"})).json()]

    assert sorted(names) == ["Hava Filtresi", "Yağ Filtresi"]


async def test_deleted_product_is_hidden_from_list(client, make_product):
    product = await make_product()

    await client.delete(f"/products/{product['id']}")

    assert (await client.get("/products/")).json() == []
