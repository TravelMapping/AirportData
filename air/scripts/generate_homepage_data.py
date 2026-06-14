#!/usr/bin/env python3
"""
Generate homepage statistics for TM Airports from user airport data.
Creates homepage_data.json with top travelers, most visited airports, and site stats.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

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

def load_user_data():
    """Load all user airport data and calculate statistics."""
    data_dir = get_data_dir()
    
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
    
    # Load manifest to get list of users
    manifest_path = data_dir / 'manifest.json'
    with open(manifest_path, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    user_airports = {}  # username -> count of visited airports
    airport_visitors = defaultdict(set)  # airport_code -> set of usernames
    total_visits = 0
    total_unique_airports = set()
    
    # Process each user's airport data
    for username in users:
        json_file = data_dir / f'{username}_airport_data.json'
        
        if not json_file.exists():
            print(f"Warning: {json_file} not found")
            continue
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                airport_data = json.load(f)
            
            # Count visited airports for this user
            visited_count = count_visited_airports(airport_data)
            user_airports[username] = visited_count
            
            # Track which users visited which airports
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
        'total_visits': total_visits,
        'total_unique_airports': len(total_unique_airports),
    }

def generate_homepage_data():
    """Generate homepage data with stats and tables."""
    print("Loading user data...")
    data = load_user_data()
    
    # Get all users (excluding empty ones)
    all_users = [u for u in data['users'] if data['user_airports'].get(u, 0) > 0]
    active_users_count = len(all_users)
    
    # Top Travelers - sort by airports visited, take top 3
    top_travelers = sorted(
        data['user_airports'].items(),
        key=lambda x: x[1],
        reverse=True
    )[:3]
    
    # Most Visited Airports - sort by visitor count, take top 3
    airport_visitors_list = [
        (code, visitors)
        for code, visitors in data['airport_visitors'].items()
    ]
    most_visited = sorted(
        airport_visitors_list,
        key=lambda x: len(x[1]),
        reverse=True
    )[:3]
    
    # Load airport data to get airport names for most visited airports
    data_dir = get_data_dir()
    airport_names = {}
    
    # Use any user's airport data to get airport details
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
    
    # Build homepage data
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
    }
    
    return homepage_data

def main():
    try:
        print("Generating homepage data...")
        homepage_data = generate_homepage_data()
        
        # Write to output file in same directory as script
        data_dir = get_data_dir()
        output_file = data_dir / 'homepage_data.json'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(homepage_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Homepage data generated successfully!")
        print(f"  Output: {output_file}")
        print(f"\nSummary:")
        print(f"  Active Users: {homepage_data['stats']['active_users']}")
        print(f"  Airports Mapped: {homepage_data['stats']['airports_mapped']}")
        print(f"  Total Visits: {homepage_data['stats']['total_visits']}")
        print(f"\nTop Traveler: {homepage_data['top_travelers'][0]['user']} ({homepage_data['top_travelers'][0]['airports_visited']} airports)")
        print(f"Most Visited: {homepage_data['most_visited_airports'][0]['code']} ({homepage_data['most_visited_airports'][0]['visitor_count']} visitors)")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
