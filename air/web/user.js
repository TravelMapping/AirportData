console.log("user.js loaded, generateUserSummary typeof:", typeof generateUserSummary);
console.log("At user.js start, global L:", window.L);

const mapInstance = window.L.map('map').setView([20, 0], 2);

window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(mapInstance);

let airportsData = [];
let manifest = [];

const countryMap = {
  AFG: "Afghanistan", ALB: "Albania", DZA: "Algeria", AND: "Andorra",
  // ... (rest of your countryMap here)
  ZWE: "Zimbabwe"
};

// Parses .alist file text into an object keyed by IATA codes with arrival/departure/layover booleans
function parseALIST(text) {
  const visits = {};
  text.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('#') || line === '') return;
    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const code = parts[0].toUpperCase();
      const types = parts.slice(1).join('');
      visits[code] = {
        A: types.includes('A'),
        D: types.includes('D'),
        L: types.includes('L'),
      };
    }
  });
  return visits;
}

// Creates a custom SVG icon for the map markers based on visit types
function createSVGIcon(hasA, hasD, hasL) {
  const svgParts = [];
  svgParts.push(`<circle cx="12" cy="12" r="10" stroke="black" fill="${hasL ? 'blue' : 'white'}" />`);
  svgParts.push(`<polygon points="12,5 5,12 19,12" fill="${hasD ? 'green' : 'white'}" stroke="black" />`);
  svgParts.push(`<polygon points="12,19 5,12 19,12" fill="${hasA ? 'red' : 'white'}" stroke="black" />`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">${svgParts.join('')}</svg>`;
  return window.L.divIcon({
    html: svg,
    className: 'svg-icon',
    iconSize: [24, 24],
  });
}

// Populates the user dropdown with all users from manifest.json
function populateUserDropdown() {
  const select = document.getElementById('userSelect');
  select.innerHTML = '<option value="">-- Select a user --</option>';
  manifest.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user;
    opt.textContent = user;
    select.appendChild(opt);
  });

  const params = new URLSearchParams(window.location.search);
  const selectedUser = params.get('user') || '';
  select.value = selectedUser;

  select.addEventListener('change', () => {
    const newUser = select.value;
    if (newUser) {
      window.location.search = `?user=${encodeURIComponent(newUser)}`;
    } else {
      window.location.search = '';
    }
  });
}

// Generates the summary table when no user is selected:
// lists all users with their total airports visited and arrival/departure/layover counts
async function generateUserSummary() {
  const tbody = document.querySelector('#userSummaryTable tbody');
  tbody.innerHTML = '';

  for (const user of manifest) {
    const res = await fetch(`../data/${user}.alist`);
    const text = await res.text();
    const visits = parseALIST(text);

    let totalA = 0, totalD = 0, totalL = 0;
    Object.values(visits).forEach(v => {
      if (v.A) totalA++;
      if (v.D) totalD++;
      if (v.L) totalL++;
    });

    const totalAirports = Object.keys(visits).length;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><a href="user.html?user=${encodeURIComponent(user)}">${user}</a></td>
      <td>${totalAirports}</td>
      <td>${totalA}</td>
      <td>${totalD}</td>
      <td>${totalL}</td>
    `;
    tbody.appendChild(row);
  }
}

// Loads and displays the selected user's details:
// name, totals, map markers, and table of visited airports
async function loadUser(username) {
  document.getElementById('title').textContent = `${username}'s Visited Airports`;

  const res = await fetch(`../data/${username}.alist`);
  const text = await res.text();
  const visits = parseALIST(text);

  let totalA = 0, totalD = 0, totalL = 0;
  Object.values(visits).forEach(v => {
    if (v.A) totalA++;
    if (v.D) totalD++;
    if (v.L) totalL++;
  });
  const totalAirports = Object.keys(visits).length;

  document.getElementById('totals').textContent =
    `Visited: ${totalAirports} | Arrivals: ${totalA} | Departures: ${totalD} | Layovers: ${totalL}`;

  const tableBody = document.querySelector('#airportTable tbody');
  tableBody.innerHTML = '';

  if (window.markersLayer) mapInstance.removeLayer(window.markersLayer);
  window.markersLayer = window.L.layerGroup();

  // Filter airports visited by user
  const visitedAirports = airportsData.filter(apt => visits[apt.iata]);
  visitedAirports.forEach(apt => {
    const { A, D, L } = visits[apt.iata];
    const icon = createSVGIcon(A, D, L);

    const marker = window.L.marker([apt.lat, apt.lon], { icon })
      .bindPopup(`<b>${apt.iata} - ${apt.name}</b><br><a href="airports.html?airport=${apt.iata}">View details</a>`)
      .on('click', function () { this.openPopup(); });

    marker.addTo(window.markersLayer);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${countryMap[apt.country] || apt.country}</td>
      <td><a href="airports.html?airport=${apt.iata}">${apt.iata}</a></td>
      <td>${apt.name}</td>
      <td>${A ? '✔️' : ''}</td>
      <td>${D ? '✔️' : ''}</td>
      <td>${L ? '✔️' : ''}</td>
    `;
    tableBody.appendChild(row);
  });

  window.markersLayer.addTo(mapInstance);

  if (visitedAirports.length > 0) {
    const avgLat = visitedAirports.reduce((sum, a) => sum + a.lat, 0) / visitedAirports.length;
    const avgLon = visitedAirports.reduce((sum, a) => sum + a.lon, 0) / visitedAirports.length;
    mapInstance.setView([avgLat, avgLon], 5);
  } else {
    mapInstance.setView([20, 0], 2);
  }
}

// Main function that loads airports, manifest, sets up UI, and determines view mode
async function loadData() {
  console.log("loadData() started, URL search:", window.location.search);

  // Load airports data
  const airportsRes = await fetch('../data/airports.csv');
  const airportsText = await airportsRes.text();
  airportsData = airportsText.trim().split('\n').slice(1).map(line => {
    const [country, iata, name, lat, lon] = line.split(';');
    return {
      country,
      iata,
      name,
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };
  });

  // Load manifest (list of users)
  const manifestRes = await fetch('../data/manifest.json');
  manifest = await manifestRes.json();

  populateUserDropdown();

  // Elements for toggling visibility
  const userSummaryDiv = document.getElementById('userSummary');
  const userSummaryTable = document.getElementById('userSummaryTable');
  const airportTable = document.getElementById('airportTable');
  const mapDiv = document.getElementById('map');
  const totalsDiv = document.getElementById('totals');
  const titleEl = document.getElementById('title');

  const params = new URLSearchParams(window.location.search);
  const selectedUser = params.get('user');

  if (selectedUser) {
    // USER selected: show user header, map, airport table, totals
    userSummaryDiv.style.display = 'none';
    userSummaryTable.style.display = 'none';
    airportTable.style.display = 'table';
    mapDiv.style.display = 'block';
    totalsDiv.style.display = 'block';
    titleEl.textContent = `${selectedUser}'s Visited Airports`;

    await loadUser(selectedUser);
  } else {
    // NO user selected: show user summary table only, hide map and user airport table
    userSummaryDiv.style.display = 'block';
    userSummaryTable.style.display = 'table';
    airportTable.style.display = 'none';
    mapDiv.style.display = 'none';
    totalsDiv.style.display = 'none';
    titleEl.textContent = 'Traveler Summary';

    await generateUserSummary();
  }
}

console.log("Is generateUserSummary defined?", typeof generateUserSummary);
loadData();
