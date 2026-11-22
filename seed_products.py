"""Load demo products into a running Kalfa API from a CSV file.

Usage:
    python seed_products.py path/to/products.csv [--api http://localhost:8000/api]

The CSV needs the columns Part_Name, Price (USD) and Stock_Quantity.
Prices are converted to TRY; the sale price gets a 30% margin.
"""
import argparse
import csv
import os
import sys

import requests

USD_TO_TRY = float(os.environ.get("USD_TO_TRY", "53"))
MARGIN = 1.30
MAX_STOCK = 999


def seed(csv_path: str, api: str) -> int:
    added = skipped = 0
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = row.get("Part_Name", "?")
            try:
                purchase = round(float(row["Price"]) * USD_TO_TRY, 2)
                payload = {
                    "name": name,
                    "purchase_price": purchase,
                    "sale_price": round(purchase * MARGIN, 2),
                    "stock_quantity": min(int(row["Stock_Quantity"]), MAX_STOCK),
                    "unit": "adet",
                    "low_stock_threshold": 5,
                }
                resp = requests.post(f"{api}/products/", json=payload, timeout=10)
                resp.raise_for_status()
                added += 1
            except Exception as exc:  # keep going, report at the end
                skipped += 1
                print(f"skipped {name}: {exc}", file=sys.stderr)

    print(f"{added} products added, {skipped} skipped")
    return 0 if skipped == 0 else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("csv_path", help="CSV file with Part_Name, Price, Stock_Quantity")
    parser.add_argument("--api", default="http://localhost:8000/api", help="Kalfa API base URL")
    args = parser.parse_args()
    sys.exit(seed(args.csv_path, args.api))
