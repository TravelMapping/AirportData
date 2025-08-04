import csv

with open("air/data/airports.csv", newline='', encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        iata = row.get("iata_code", "").strip().upper()
        alt = row.get("alt_codes", "").strip()
        print(f"IATA: {iata}, ALT: {alt}")
