# Kalfa Backend

FastAPI + PostgreSQL + Docker ile yazılmış Kalfa iş yönetimi API'si.

## Hızlı Başlangıç

```bash
# 1. Env dosyasını oluştur
cp .env.example .env

# 2. Docker ile başlat (PostgreSQL + API)
docker-compose up --build

# 3. API çalışıyor mu kontrol et
curl http://localhost:8000/health

# 4. Swagger UI
open http://localhost:8000/docs
```

## Lokal Geliştirme (Docker olmadan)

```bash
pip install -r requirements.txt

# PostgreSQL bağlantısını .env'e yaz, sonra:
uvicorn app.main:app --reload
```

## API Endpoint'leri

### Mağaza & Onboarding
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/shop/onboarding` | İlk kurulum (profil + hatırlatıcılar) |
| GET | `/api/shop/` | Mağaza profilini getir |
| PATCH | `/api/shop/` | Mağaza profilini güncelle |
| GET | `/api/shop/employees` | Çalışanları listele |
| POST | `/api/shop/employees` | Çalışan ekle |

### Ürünler & Stok
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/products/` | Ürünleri listele (arama + filtre) |
| POST | `/api/products/` | Yeni ürün ekle |
| GET | `/api/products/{id}` | Ürün detayı |
| PATCH | `/api/products/{id}` | Ürün güncelle |
| DELETE | `/api/products/{id}` | Ürünü devre dışı bırak |
| POST | `/api/products/{id}/add-stock` | Stok ekle |
| POST | `/api/products/{id}/sell` | **Sat** → stok düşer + gelir kaydı oluşur |

### İşlemler (Gelir / Gider)
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/transactions/` | İşlem listesi (tarih + tip filtresi) |
| POST | `/api/transactions/sale` | Satış kaydı |
| POST | `/api/transactions/collection` | Tahsilat kaydı |
| POST | `/api/transactions/expense` | Gider kaydı |

### Borç & Alacak
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/debts/` | Borç/alacak listesi |
| POST | `/api/debts/` | Yeni borç/alacak ekle |
| PATCH | `/api/debts/{id}` | Güncelle |
| POST | `/api/debts/{id}/pay` | Kısmi veya tam ödeme yap |
| DELETE | `/api/debts/{id}` | Sil |

### Hatırlatıcılar
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/reminders/` | Hatırlatıcıları listele |
| POST | `/api/reminders/` | Yeni hatırlatıcı ekle |
| PATCH | `/api/reminders/{id}` | Güncelle / ödenmiş olarak işaretle |
| DELETE | `/api/reminders/{id}` | Sil |

### Analiz
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/analytics/home` | Ana sayfa özeti (bu ay kar/zarar, alacak, borç) |
| GET | `/api/analytics/dashboard` | Aylık dashboard (en çok satanlar, gider dağılımı) |

## Kritik Tasarım Kararları

### Atomik Satış İşlemi
`POST /api/products/{id}/sell` tek bir DB transaction içinde:
1. Stok yeterliliğini kontrol eder
2. `products.stock_quantity` değerini düşürür
3. Kar hesaplayıp `transactions` tablosuna yazar

Birisi başarısız olursa ikisi de geri alınır — tutarsız veri olmaz.

### Birleşik Transaction Modeli
`Sale` + `Income` ayrı tablolar yerine tek `transactions` tablosu, `type` alanıyla ayrılır:
- `sale` → Satış (stok düşer)
- `collection` → Tahsilat
- `expense` → Gider
- `other_income` → Serbest gelir

### Borç Modeli
`CreditCardDebt` ayrı tablo değil — `Debt` modeli `debt_type` alanıyla hem kişi borcunu hem kredi kartını karşılar.

## Proje Yapısı

```
app/
├── main.py          # FastAPI app, middleware, router
├── db.py            # Async SQLAlchemy engine & session
├── config.py        # Pydantic Settings (.env okur)
├── models/          # SQLAlchemy ORM modelleri
│   ├── product.py
│   ├── transaction.py
│   ├── debt.py
│   ├── payment_reminder.py
│   ├── shop_profile.py
│   └── employee.py
├── schemas/         # Pydantic v2 request/response şemaları
│   ├── product.py
│   ├── transaction.py
│   ├── debt.py
│   ├── shop.py
│   └── analytics.py
├── routes/          # FastAPI router'ları
│   ├── products.py
│   ├── transactions.py
│   ├── debts.py
│   ├── reminders.py
│   ├── analytics.py
│   └── shop.py
└── services/        # İş mantığı katmanı
    ├── product_service.py
    ├── sale_service.py      ← atomik satış burada
    └── analytics_service.py
```

## Sonraki Adımlar

- [ ] React Native frontend bağlantısı
- [ ] Alembic migration kurulumu
- [ ] JWT authentication
- [ ] Push notification servisi (yaklaşan ödemeler için)
- [ ] Unit testler (pytest-asyncio)
