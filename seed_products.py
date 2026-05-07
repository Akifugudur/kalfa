import csv
import requests
import json

BASE_URL = "http://localhost:8000/api"
CSV_PATH = r"C:\Users\mehme\Documents\Claude\Projects\dukkan\truck_spare_parts_dataset.csv"

# USD -> TL kur yaklaşımı
USD_TO_TL = 53

def seed():
    added = 0
    skipped = 0
    
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                price_usd = float(row['Price'])
                purchase_tl = round(price_usd * USD_TO_TL, 2)
                sale_tl = round(purchase_tl * 1.30, 2)  # %30 kar marjı
                stock = min(int(row['Stock_Quantity']), 999)  # max 999
                
                payload = {
                    "name": row['Part_Name'],
                    "purchase_price": purchase_tl,
                    "sale_price": sale_tl,
                    "stock_quantity": stock,
                    "unit": "adet",
                    "low_stock_threshold": 5
                }
                
                resp = requests.post(f"{BASE_URL}/products/", json=payload, timeout=10)
                if resp.status_code in (200, 201):
                    added += 1
                    print(f"✓ {row['Part_Name']} — alış: {purchase_tl}₺ / satış: {sale_tl}₺ / stok: {stock}")
                else:
                    skipped += 1
                    print(f"✗ {row['Part_Name']}: {resp.status_code} {resp.text[:100]}")
            except Exception as e:
                skipped += 1
                print(f"✗ {row.get('Part_Name','?')}: {e}")
    
    print(f"\n✅ Tamamlandı: {added} eklendi, {skipped} atlandı")

if __name__ == "__main__":
    seed()
