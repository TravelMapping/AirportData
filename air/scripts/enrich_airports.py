import csv
import json
import os
import pycountry

UNKNOWN_CODES_FILE = "air/data/unknown_codes.txt"
CURRENT_DB_FILE = "air/data/airports.csv"
LOOKUP_FILE = "ourairports.csv"  # downloaded during workflow
OUTPUT_FILE = CURRENT_DB_FILE
RECENTLY_INDEXED_FILE = "air/data/recently_indexed.json"

# Load a set of IATA codes from the current DB
def load_iata_set(csv_path):
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        return set(row["iata_code"] for row in reader if row["iata_code"])

# Load full OurAirports lookup as dict keyed by IATA
def load_lookup_dict(csv_path):
    with open(csv_path, newline='', encoding='utf-8') as f:
        return {row["iata_code"]: row for row in csv.DictReader(f) if row["iata_code"]}

# Convert 2-letter to 3-letter ISO country code
def convert_to_alpha3(alpha2):
    try:
        return pycountry.countries.get(alpha_2=alpha2).alpha_3
    except:
        return alpha2  # fallback if conversion fails

# Format row to match your CSV structure
def map_to_custom_format(row):
    return {
        "country": convert_to_alpha3(row["iso_country"]),
        "iata_code": row["iata_code"],
        "name": row["name"],
        "latitude": row["latitude_deg"],
        "longitude": row["longitude_deg"],
        "alt_codes": ""  # add blank alt_codes field
    }

def main():
    # Load unknown codes from file
    unknown_codes = set()
    with open(UNKNOWN_CODES_FILE, encoding='utf-8') as f:
        for line in f:
            code = line.strip()
            if code:
                unknown_codes.add(code)

    # Load current IATA codes and lookup table
    current_iata = load_iata_set(CURRENT_DB_FILE)
    lookup = load_lookup_dict(LOOKUP_FILE)

    # Find missing codes
    missing = sorted(unknown_codes - current_iata)
    print(f"Found {len(missing)} missing IATA codes.")

    # Map missing codes to your CSV format
    new_rows = [map_to_custom_format(lookup[code]) for code in missing if code in lookup]

    if new_rows:
        fieldnames = ["country", "iata_code", "name", "latitude", "longitude", "alt_codes"]

        # Step 1: Append new rows
        with open(OUTPUT_FILE, "a", newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
            for row in new_rows:
                writer.writerow(row)
        print(f"Appended {len(new_rows)} new airports to {OUTPUT_FILE}")

        # === NEW: Update Recently Indexed History Log ===
        try:
            existing_recent = []
            if os.path.exists(RECENTLY_INDEXED_FILE):
                with open(RECENTLY_INDEXED_FILE, 'r', encoding='utf-8') as f:
                    existing_recent = json.load(f)
            
            # Package the fresh additions
            fresh_additions = []
            for row in new_rows:
                fresh_additions.append({
                    "code": row["iata_code"],
                    "name": row["name"]
                })
            
            # Put the brand new ones at the very front, followed by the older history
            combined_recent = fresh_additions + existing_recent
            
            # De-duplicate entries if the same code is indexed multiple times
            seen = set()
            deduped_recent = []
            for item in combined_recent:
                if item["code"] not in seen:
                    seen.add(item["code"])
                    deduped_recent.append(item)
            
            # Keep only the top 5 most recent discoveries
            final_recent = deduped_recent[:5]
            
            with open(RECENTLY_INDEXED_FILE, 'w', encoding='utf-8') as f:
                json.dump(final_recent, f, indent=2, ensure_ascii=False)
            print(f"Updated rolling discovery history log in {RECENTLY_INDEXED_FILE}")
        except Exception as e:
            print(f"Warning: Failed to update recently indexed history log: {e}")
        # ===============================================

        # Step 2: Read full file and sort (excluding header)
        with open(OUTPUT_FILE, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=';')
            all_rows = list(reader)  # all rows without header

        # Sort rows by country first, then IATA code
        all_rows.sort(key=lambda r: (r["country"], r["iata_code"]))

        # Step 3: Write back sorted CSV with header
        with open(OUTPUT_FILE, "w", newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
            writer.writeheader()
            writer.writerows(all_rows)

        print(f"Sorted {OUTPUT_FILE} alphabetically by country, then IATA code.")

    else:
        print("No matching airports found in lookup file.")

if __name__ == "__main__":
    main()
