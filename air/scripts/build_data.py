import csv
import json
import os

AIRPORT_CSV = 'air/data/airports.csv'
USER_ALIST = 'air/data/mapcat.alist'
OUTPUT_JSON = 'air/data/mapcat_airport_data.json'

def load_airport_metadata(filename):
    airports = {}
    with open(filename, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=';')
        for row in reader:
            primary = row['iata_code'].strip().upper()
            alt_codes = [code.strip().upper() for code in row.get('alt_codes', '').split(',') if code]
            all_codes = [primary] + alt_codes
            for code in all_codes:
                airports[code] = {
                    'primary_code': primary,
                    'name': row['name'],
                    'lat': float(row['latitude']),
                    'lon': float(row['longitude']),
                    'country': row['country']
                }
    return airports

def load_user_visits(filename):
    visits = {}
    with open(filename, encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 2:
                code = parts[0].upper()
                types = set(parts[1:])
                visits[code] = types
    return visits

def match_user_visits(airport_data, user_visits):
    matched = {}
    for code, types in user_visits.items():
        if code in airport_data:
            primary = airport_data[code]['primary_code']
            matched[primary] = matched.get(primary, set()).union(types)
        else:
            print(f"⚠️ Unknown code in user file: {code}")
    return matched

def build_json(airport_data, matched_visits):
    output = []
    added = set()
    for airport in airport_data.values():
        code = airport['primary_code']
        if code not in added:
            added.add(code)
            output.append({
                'code': code,
                'name': airport['name'],
                'lat': airport['lat'],
                'lon': airport['lon'],
                'country': airport['country'],
                'visits': sorted(list(matched_visits.get(code, set())))
            })
    return output

if __name__ == '__main__':
    airport_data = load_airport_metadata(AIRPORT_CSV)

    os.makedirs('air/data', exist_ok=True)
    manifest = []

    for fname in os.listdir('air/data'):
        if fname.endswith('.alist'):
            user = fname.replace('.alist', '')
            manifest.append(user)

            filepath = os.path.join('air/data', fname)
            user_visits = load_user_visits(filepath)
            matched_visits = match_user_visits(airport_data, user_visits)
            output_data = build_json(airport_data, matched_visits)

            output_path = f'air/data/{user}_airport_data.json'
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2)
            print(f'✅ Data file written to {output_path}')

    # Write manifest.json
    manifest_path = 'air/data/manifest.json'
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(sorted(manifest), f)
    print(f'📄 Manifest file written to {manifest_path}')

    # Write users.txt
    users_txt_path = 'air/data/users.txt'
    with open(users_txt_path, 'w', encoding='utf-8') as f:
        for user in sorted(manifest):
            f.write(user + '\n')
    print(f'🧾 Users file written to {users_txt_path}')
