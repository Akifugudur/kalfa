# Kalfa

Inventory, sales and cash-book app for small workshops and spare-parts shops. The shop owner records sales (cash or on credit), expenses and debts from the phone and sees the month's profit at a glance.

A React Native (Expo) app talks to a FastAPI + PostgreSQL backend that runs on a computer in the shop; phones on the shop Wi-Fi connect to it.

<p align="center">
  <img src="docs/screenshots/home.png" width="200" alt="Home: this month's net profit, receivables, debts and recent transactions">
  <img src="docs/screenshots/inventory.png" width="200" alt="Inventory list with stock levels">
  <img src="docs/screenshots/analytics.png" width="200" alt="Monthly analytics: top-selling products and expenses by category">
  <img src="docs/screenshots/expense.png" width="200" alt="Expense categories sheet">
</p>

## Features

- **Inventory** – products with purchase/sale price, stock and a low-stock threshold. Search, infinite scroll, restocking with an optional new purchase price.
- **Sales** – selling a product lowers its stock and books the profit from the purchase price at the time of sale. A sale can be paid in cash or put on the customer's tab (*veresiye*), which opens a receivable automatically.
- **Cash book** – collections, other income and expenses by category (rent, bills, salaries, material, …).
- **Debts and receivables** – who owes the shop and whom the shop owes, with partial payments. Money collected on a receivable is booked as income.
- **Analytics** – net profit per month, top-selling products, expense breakdown and low-stock list; earlier months can be browsed.
- **Invoices** – a sale can be turned into a PDF invoice and shared from the phone.
- **Onboarding** – first start asks for the shop details and monthly fixed costs and creates payment reminders for them.

## Architecture

```
┌──────────────────────┐   HTTP/JSON    ┌─────────────────────┐        ┌──────────────┐
│ kalfa-mobile         │ ─────────────▶ │ kalfa-backend       │ ─────▶ │ PostgreSQL 16│
│ React Native + Expo  │   shop Wi-Fi   │ FastAPI (async)     │ asyncpg│              │
└──────────────────────┘                └─────────────────────┘        └──────────────┘
```

**Backend** (`kalfa-backend/`): routes → services → SQLAlchemy models, Pydantic v2 schemas for every request and response.

- One `transactions` table for sales, collections, other income and expenses (a `type` column), so monthly totals are a single query.
- A sale, its stock change and its receivable are written in one database transaction. The product row is locked (`SELECT … FOR UPDATE`) for the duration, so parallel sales can never oversell; debt payments lock the debt row the same way.
- A debt's remaining amount and paid flag only change through payments, so the numbers always add up.
- Business dates use the shop's time zone (`Europe/Istanbul`), not UTC, so a late-night sale lands on the right day.
- Money is stored as `NUMERIC(12,2)`.

**Mobile** (`kalfa-mobile/`): TypeScript, React Navigation (tabs + modal sheets), Axios. Long lists are paged from the API while scrolling. Colors and spacing live in one theme file.

## Tech stack

| | |
|---|---|
| Mobile | React Native 0.74, Expo SDK 51, TypeScript, React Navigation, Axios, expo-print |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), asyncpg, Pydantic v2 |
| Database | PostgreSQL 16 |
| Tooling | Docker Compose, pytest + httpx, Ruff |

## Getting started

### Backend

Requires Docker.

```bash
cd kalfa-backend
cp .env.example .env          # set a real password and SECRET_KEY
docker compose up --build
```

The API runs on `http://localhost:8000`; interactive docs are at `http://localhost:8000/docs`.
If port 5432 is already taken on your machine, set `DB_PORT` in `.env`.

Optional demo data:

```bash
pip install requests
python seed_products.py path/to/products.csv
```

### Mobile app

Requires Node.js 18+.

```bash
cd kalfa-mobile
npm install
npx expo start
```

The app finds the API automatically in the browser and in the Android emulator. On a real phone, point it at the computer running the backend:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.42:8000/api npx expo start
```

## Tests

The backend tests run against a real PostgreSQL database, because row locking and numeric types behave differently on SQLite.

```bash
cd kalfa-backend
pip install -r requirements-dev.txt
docker run -d --rm -p 55432:5432 -e POSTGRES_PASSWORD=test postgres:16-alpine
TEST_DATABASE_URL=postgresql+asyncpg://postgres:test@localhost:55432/postgres pytest
```

They cover sales and stock (including 20 parallel sales on 5 items in stock), credit sales, debt payments and edits, product paging and local business dates.

## Project structure

```
kalfa/
├── kalfa-backend/
│   ├── app/
│   │   ├── main.py            FastAPI app and routers
│   │   ├── models/            SQLAlchemy models
│   │   ├── schemas/           Pydantic request/response models
│   │   ├── routes/            products, transactions, debts, reminders, analytics, shop
│   │   └── services/          sale, product and analytics logic
│   ├── tests/                 pytest suite
│   └── docker-compose.yml
├── kalfa-mobile/
│   ├── App.tsx
│   └── src/
│       ├── api/               typed API client
│       ├── screens/           Home, Inventory, Payments, Analytics, Settings, …
│       ├── modals/            sale, income, expense and collection sheets
│       ├── components/        shared UI pieces
│       ├── hooks/             data fetching and paging
│       └── theme/colors.ts    design tokens
└── seed_products.py           demo data loader
```

## Roadmap

- User accounts and API authentication (the API currently trusts the local network)
- Alembic migrations instead of creating tables at startup
- Barcode scanning for products
- Upgrade to the current Expo SDK

## Author

Mehmet Akif Üğüdür

Computer Engineering Graduate & Computer Science MSc Student
Focused on full-stack development, data science, and mobile applications.
