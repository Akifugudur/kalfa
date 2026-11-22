# Kalfa API

FastAPI + PostgreSQL backend for the Kalfa shop app. See the [main README](../README.md) for the overall project.

## Run

```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8000/health
```

Swagger UI: `http://localhost:8000/docs`

Without Docker (PostgreSQL connection in `.env`):

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Configuration (`.env`)

| Variable | Default | |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://kalfa:kalfa_secret@localhost:5432/kalfa_db` | |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `kalfa` / `kalfa_secret` / `kalfa_db` | used by Docker Compose |
| `DB_PORT` | `5432` | host port for PostgreSQL (bound to localhost only) |
| `TIMEZONE` | `Europe/Istanbul` | time zone for business dates |
| `ENVIRONMENT` | `development` | `development` logs SQL |

## Endpoints

### Shop and onboarding
| Method | Path | |
|---|---|---|
| POST | `/api/shop/onboarding` | First setup: shop profile and monthly payment reminders |
| GET / PATCH | `/api/shop/` | Shop profile |
| GET / POST | `/api/shop/employees` | Employees |

### Products and stock
| Method | Path | |
|---|---|---|
| GET | `/api/products/` | List, with `search`, `low_stock_only`, `skip`, `limit` (max 200) |
| POST | `/api/products/` | Create |
| GET / PATCH / DELETE | `/api/products/{id}` | Read, update, deactivate |
| POST | `/api/products/{id}/add-stock` | Restock, optionally with a new purchase price |
| POST | `/api/products/{id}/sell` | Sell: lowers stock and books the sale |

### Transactions
| Method | Path | |
|---|---|---|
| GET | `/api/transactions/` | List, filter by `type` and date range |
| POST | `/api/transactions/sale` | Sale, cash or on credit (`payment_method: credit` opens a receivable) |
| POST | `/api/transactions/collection` | Money collected, optionally against a receivable |
| POST | `/api/transactions/expense` | Expense with category |

### Debts and receivables
| Method | Path | |
|---|---|---|
| GET / POST | `/api/debts/` | List / create |
| GET / PATCH / DELETE | `/api/debts/{id}` | Read, edit (amount keeps the paid part), delete |
| POST | `/api/debts/{id}/pay` | Partial or full payment |

### Reminders and analytics
| Method | Path | |
|---|---|---|
| GET / POST / PATCH / DELETE | `/api/reminders/…` | Upcoming fixed payments |
| GET | `/api/analytics/home` | This month's totals, receivables, debts, recent activity |
| GET | `/api/analytics/dashboard?year=&month=` | Monthly summary, top products, expenses by category |

## Design notes

- **Atomic sales.** Stock check, stock change, sale record and (for credit sales) the receivable are one database transaction. The product row is locked with `SELECT … FOR UPDATE`, so concurrent sales queue up instead of overselling.
- **One transactions table.** Sales, collections, other income and expenses share a table with a `type` column.
- **Debts stay consistent.** Remaining amount and paid flag change only through payments; editing the amount keeps what was already paid; deleting a debt keeps the sales that referenced it.
- **Local business dates.** Dates are taken in the shop's time zone.

## Tests

```bash
pip install -r requirements-dev.txt
docker run -d --rm -p 55432:5432 -e POSTGRES_PASSWORD=test postgres:16-alpine
TEST_DATABASE_URL=postgresql+asyncpg://postgres:test@localhost:55432/postgres pytest
ruff check app tests
```
