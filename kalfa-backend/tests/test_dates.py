from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest

from app import clock

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_sale_is_booked_on_the_local_day(client, make_product, monkeypatch):
    """01:30 in Istanbul is still the previous day in UTC. The sale has to
    land on the Istanbul date."""
    night = datetime(2026, 5, 7, 1, 30, tzinfo=ZoneInfo("Europe/Istanbul"))
    assert night.astimezone(timezone.utc).date().isoformat() == "2026-05-06"
    monkeypatch.setattr(clock, "now_local", lambda: night)
    product = await make_product()

    res = await client.post(
        f"/products/{product['id']}/sell", json={"quantity": 1, "sale_price": 150}
    )

    assert res.json()["transaction_date"] == "2026-05-07"
