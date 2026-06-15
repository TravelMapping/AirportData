#!/usr/bin/env python3
"""
Generate homepage statistics for TM Airports from user airport data.
Creates homepage_data.json with top travelers, most visited airports, recent updates, and site stats.
"""

import json
import os
import subprocess
from pathlib import Path
from collections import defaultdict
import urllib.parse

def get_data_dir():
    """Get the air/data directory path."""
    script_dir = Path(__file__).parent
    return script_dir.parent / 'data'

def count_visited_airports(airport_data):
    """Count unique airports with at least one visit for a user."""
    count = 0
    for airport in airport_data:
        if airport.get('visits') and len(airport['visits']) > 0:
            count += 1
    return count

def get_file_commit_count(file_path):
    """Counts how many times a file has been committed to the repository history."""
    try:
        # Check remote master tracking branch first, fall back to main if needed
        branch = "origin/master"
        check_branch = subprocess.run(['git', 'rev-parse', '--verify', 'origin/master'], 
                                      stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if check_branch.returncode != 0:
            branch = "origin/main"

        result = subprocess.run(
            ['git', 'rev-list', '--count', branch, '--', str(file_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        commit_count_str = result.stdout.strip()
        if commit_count_str:
            return int(commit_count_str)
    except Exception as e:
        print(f"Warning: Could not get git commit count for {file_path.name}: {e}")
    return 2 # Safe fallback: treat as a regular update if Git history is unreadable

def get_git_modification_time(file_path):
    """Get the true Unix timestamp of the last global git commit touching a file."""
    try:
        branch = "origin/master"
        check_branch = subprocess.run(['git', 'rev-parse', '--verify', 'origin/master'], 
                                      stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if check_branch.returncode != 0:
            branch = "origin/main"

        result = subprocess.run(
            ['git', 'log', '-1', '--format=%ct', branch, '--', str(file_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        timestamp_str = result.stdout.strip()
        if timestamp_str:
            return int(timestamp_str)
    except Exception as e:
        print(f"Warning: Could not get global git timestamp for {file_path.name}: {e}")
    return os.path.getmtime(file_path)

def get_top_ranks(sorted_items, score_key_fn, max_ranks=3):
    """
    Extracts items from a sorted list, including all ties, until 
    max_ranks distinct scores have been processed.
    """
    if not sorted_items:
        return []
        
    result = []
    distinct_scores_seen = 0
    last_score = None
    
    for item in sorted_items:
        score = score_key_fn(item)
        
        # If it's a new score, track that we are moving to a lower rank level
        if score != last_score:
            distinct_scores_seen += 1
            last_score = score
            
        # Once we've completely filled our target ranks, stop accepting new scores
        if distinct_scores_seen > max_ranks:
            break
            
        result.append(item)
        
    return result
    
    def load_user_data():
    """Load all user airport data and calculate statistics."""
    data_dir = get_data_dir()
    
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
    
    manifest_path = data_dir / 'manifest.json'
    with open(manifest_path, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    user_airports = {}
    airport_visitors = defaultdict(set)
    alist_timestamps = {}
    total_visits = 0
    total_unique_airports = set()
    
    for username in users:
        json_file = data_dir / f'{username}_airport_data.json'
        alist_file = data_dir / f'{username}.alist'
        
        if alist_file.exists():
            alist_timestamps[username] = get_git_modification_time(alist_file)
        
        if not json_file.exists():
            print(f"Warning: {json_file} not found")
            continue
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                airport_data = json.load(f)
            
            visited_count = count_visited_airports(airport_data)
            user_airports[username] = visited_count
            
            for airport in airport_data:
                if airport.get('visits') and len(airport['visits']) > 0:
                    airport_code = airport['code']
                    airport_visitors[airport_code].add(username)
                    total_unique_airports.add(airport_code)
                    total_visits += len(airport['visits'])
        
        except json.JSONDecodeError as e:
            print(f"Error reading {json_file}: {e}")
            continue
    
    return {
        'users': users,
        'user_airports': user_airports,
        'airport_visitors': {code: list(visitors) for code, visitors in airport_visitors.items()},
        'alist_timestamps': alist_timestamps,
        'total_visits': total_visits,
        'total_unique_airports': len(total_unique_airports),
    }

def generate_homepage_data():
    """Generate homepage data with stats, tables, and recent updates."""
    print("Loading user data...")
    data = load_user_data()
    
    all_users = [u for u in data['users'] if data['user_airports'].get(u, 0) > 0]
    active_users_count = len(all_users)
    
    top_travelers = sorted(
        data['user_airports'].items(),
        key=lambda x: x[1],
        reverse=True
    )[:3]
    
    airport_visitors_list = [
        (code, visitors)
        for code, visitors in data['airport_visitors'].items()
    ]
    most_visited = sorted(
        airport_visitors_list,
        key=lambda x: len(x[1]),
        reverse=True
    )[:3]
    
    active_timestamps = {
        user: ts for user, ts in data['alist_timestamps'].items() if user in all_users
    }
    recent_users = sorted(
        active_timestamps.items(),
        key=lambda x: x[1],
        reverse=True
    )[:6]
    
    data_dir = get_data_dir()
    
    recent_updates = []
    for username, _ in recent_users:
        encoded_user = urllib.parse.quote(username)
        link_style = "color: #3182ce; font-weight: bold; text-decoration: none;"
        hover_effects = 'onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'"'
        user_link = f'<a href="/AirportData/air/web/user.html?user={encoded_user}" style="{link_style}" {hover_effects}>{username}</a>'
        
        # Check how many times this specific user file has been pushed to history
        alist_file = data_dir / f'{username}.alist'
        commit_count = get_file_commit_count(alist_file)
        
        # If it has only 1 commit ever, they are a brand-new traveler!
        if commit_count == 1:
            recent_updates.append(f"{user_link} joined the site as a new traveler!")
        else:
            recent_updates.append(f"{user_link} updated their flight map.")
    
    airport_names = {}
    
    if all_users:
        first_user = all_users[0]
        json_file = data_dir / f'{first_user}_airport_data.json'
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                airport_data = json.load(f)
                for airport in airport_data:
                    airport_names[airport['code']] = airport['name']
        except:
            pass
            
    # === STRATEGY: Read the dedicated, non-scrambled discovery history log ===
    recently_added = []
    log_path = data_dir / 'recently_indexed.json'
    
    if log_path.exists():
        try:
            with open(log_path, 'r', encoding='utf-8') as f:
                recently_added = json.load(f)
        except Exception as e:
            print(f"Warning: Could not read rolling discovery log file: {e}")
    # =========================================================================
    
    homepage_data = {
        'generated_at': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'stats': {
            'active_users': active_users_count,
            'airports_mapped': data['total_unique_airports'],
            'total_visits': data['total_visits'],
        },
        'top_travelers': [
            {
                'rank': i + 1,
                'user': user,
                'airports_visited': count,
            }
            for i, (user, count) in enumerate(top_travelers)
        ],
        'most_visited_airports': [
            {
                'rank': i + 1,
                'code': code,
                'name': airport_names.get(code, 'Unknown Airport'),
                'visitor_count': len(visitors),
            }
            for i, (code, visitors) in enumerate(most_visited)
        ],
        'recent_updates': recent_updates,
        'recently_added_airports': recently_added
    }
    
    return homepage_data

def main():
    try:
        print("Generating homepage data...")
        homepage_data = generate_homepage_data()
        
        data_dir = get_data_dir()
        output_file = data_dir / 'homepage_data.json'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(homepage_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Homepage data generated successfully!")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    return 0

if __name__ == '__main__':
    exit(main())
