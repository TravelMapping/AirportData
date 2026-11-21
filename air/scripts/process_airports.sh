#!/usr/bin/env bash
set -euo pipefail

lookup_file=$1
worktree_root=$(mktemp -d)

for attempt in 1 2 3; do
  git fetch origin master
  base=$(git rev-parse origin/master)
  worktree="$worktree_root/attempt-$attempt"
  git worktree add --detach "$worktree" "$base"

  (
    cd "$worktree"
    cp "$lookup_file" ourairports.csv

    python air/scripts/extract_codes.py
    python air/scripts/check_unknown_codes.py
    python air/scripts/enrich_airports.py
    python air/scripts/extract_codes.py
    python air/scripts/check_unknown_codes.py
    python air/scripts/build_data.py
    (cd air/scripts && python generate_homepage_data.py)

    git add air/data/airports.csv air/data/airports-master.csv \
      air/data/unknown_codes.txt air/data/recently_indexed.json \
      air/data/manifest.json air/data/users.txt air/data/homepage_data.json \
      air/data/*_airport_data.json

    if ! git diff --cached --quiet; then
      git commit -m "Update airport data and maps"
    fi
  )

  if git -C "$worktree" push origin HEAD:refs/heads/master; then
    exit 0
  fi

  git fetch origin master
  if [ "$(git rev-parse origin/master)" = "$base" ]; then
    echo "Push failed without a new master commit; stopping." >&2
    exit 1
  fi
  echo "Master changed during processing; retrying with the latest data." >&2
done

echo "Could not publish airport data after three attempts." >&2
exit 1
