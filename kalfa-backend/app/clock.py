"""Local business time.

Sales and expenses are booked on the shop's calendar day, not the UTC day, so
a sale at 01:30 in Istanbul belongs to that day and not the previous one.
"""
from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.config import settings


def now_local() -> datetime:
    return datetime.now(ZoneInfo(settings.TIMEZONE))


def today_local() -> date:
    return now_local().date()
