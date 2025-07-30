import json

with open('air/data/manifest.json') as f:
    users = json.load(f)

with open('air/data/users.txt', 'w') as f:
    f.write('\n'.join(users))

print("✅ users.txt has been generated.")
