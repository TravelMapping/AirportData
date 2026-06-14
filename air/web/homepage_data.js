/**
 * Load and display homepage statistics from homepage_data.json
 */

async function loadHomepageData() {
    try {
        const response = await fetch('../data/homepage_data.json');
        if (!response.ok) {
            throw new Error(`Failed to load homepage data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update statistics cards
        updateStats(data.stats);
        
        // Update tables
        updateTopTravelers(data.top_travelers);
        updateMostVisitedAirports(data.most_visited_airports);
        
        // Update recent updates section
        updateRecentUpdates(data.recent_updates);
        
        console.log('Homepage data loaded successfully');
    } catch (error) {
        console.error('Error loading homepage data:', error);
        // Show default placeholder data on error
        showErrorMessage();
    }
}

function updateStats(stats) {
    // Update Active Users
    const activeUsersElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
    if (activeUsersElement) {
        activeUsersElement.textContent = stats.active_users;
    }
    
    // Update Airports Mapped
    const airportsMappedElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
    if (airportsMappedElement) {
        airportsMappedElement.textContent = stats.airports_mapped;
    }
    
    // Update Total Visits
    const totalVisitsElement = document.querySelector('.stat-card:nth-child(3) .stat-number');
    if (totalVisitsElement) {
        totalVisitsElement.textContent = stats.total_visits.toLocaleString();
    }
}

function updateTopTravelers(topTravelers) {
    const tbody = document.querySelector('[data-table="top-travelers"] tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add rows for each top traveler
    topTravelers.forEach(traveler => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${traveler.rank}</td>
            <td><a href="user.html?user=${encodeURIComponent(traveler.user)}">${escapeHtml(traveler.user)}</a></td>
            <td>${traveler.airports_visited}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateMostVisitedAirports(mostVisitedAirports) {
    const tbody = document.querySelector('[data-table="most-visited-airports"] tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Add rows for each most visited airport
    mostVisitedAirports.forEach(airport => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${airport.rank}</td>
            <td>
                <a href="/AirportData/air/web/airports.html?airport=${airport.code}" 
                   style="color: #3182ce; font-weight: bold; text-decoration: none;"
                   onmouseover="this.style.textDecoration='underline'" 
                   onmouseout="this.style.textDecoration='none'">
                    ${airport.code}
                </a>
            </td>
            <td>${escapeHtml(airport.name)}</td>
            <td>${airport.visitor_count}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateRecentUpdates(recentUpdates) {
    const listElement = document.getElementById('recent-updates-list');
    if (!listElement) return;
    
    // Clear loading placeholder
    listElement.innerHTML = '';
    
    if (!recentUpdates || recentUpdates.length === 0) {
        listElement.innerHTML = '<li style="color: #666; list-style-type: none; margin-left: -1.2rem;">No recent updates found.</li>';
        return;
    }
    
    // Populate dynamic rows
    recentUpdates.forEach(updateText => {
        const li = document.createElement('li');
        li.style.marginBottom = '0.5rem';
        // Note: The Python script controls formatting using safe <strong> tags around usernames
        li.innerHTML = updateText;
        listElement.appendChild(li);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage() {
    console.warn('Could not load live data. Check that homepage_data.json exists in air/data/');
    const listElement = document.getElementById('recent-updates-list');
    if (listElement) {
        listElement.innerHTML = '<li style="color: #c0392b; list-style-type: none; margin-left: -1.2rem;">Error loading live updates.</li>';
    }
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadHomepageData);
