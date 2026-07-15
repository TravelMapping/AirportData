import csv

codes = set()

with open("air/data/airports.csv", newline='', encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        iata = row.get("iata_code", "").strip().upper()
        if iata:
            codes.add(iata)

        alt = row.get("alt_codes", "").strip()
        if alt:
            for alt_code in alt.split(","):
                alt_code = alt_code.strip().upper()
                if alt_code:
                    codes.add(alt_code)

# Write to airports-master.csv
with open("air/data/airports-master.csv", "w", encoding="utf-8") as out:
    for code in sorted(codes):
        out.write(code + "\n")
