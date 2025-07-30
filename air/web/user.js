console.log("user.js loaded");

const mapInstance = window.L.map('map').setView([20, 0], 5);

window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(mapInstance);

let airportsData = [];
let manifest = [];

const countryMap = {
  AFG: "Afghanistan", ALB: "Albania", DZA: "Algeria", AND: "Andorra",
  // ... include all country codes here ...
  ZWE: "Zimbabwe"
};

// Helper: Parse the .alist file text into an object { IATA: {A: bool, D: bool, L: bool} }
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

// Create an SVG icon for markers on the map showing A/D/L presence
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

// Generates the summary table of *all users* with total airports visited, arrivals, departures, layovers
async function generateUserSummary() {
  const summaryByUser = {};

  await Promise.all(manifest.map(async user => {
    const res = await fetch(`../data/${user}.alist`);
    const text = await res.text();
    const visits = parseALIST(text);

    let total = 0, A = 0, D = 0, L = 0;
    Object.values(visits).forEach(types => {
      if (types.A) A++;
      if (types.D) D++;
      if (types.L) L++;
      total++;
    });

    summaryByUser[user] = { total, A, D, L };
  }));

  const tbody = document.querySelector('#userSummaryTable tbody');
  tbody.innerHTML = '';

  manifest.forEach(user => {
    const counts = summaryByUser[user] || { total: 0, A: 0, D: 0, L: 0 };
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user}</td>
      <td>${counts.total}</td>
      <td>${counts.A}</td>
      <td>${counts.D}</td>
      <td>${counts.L}</td>
    `;
    tbody.appendChild(row);
  });
}

// Loads data for a specific user and populates the map and table with that user's visited airports
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

  const visitedAirports = airportsData.filter(apt => visits[apt.iata]);

  visitedAirports.forEach(apt => {
    const { A, D, L } = visits[apt.iata];
    const icon = createSVGIcon(A, D, L);

    const marker = window.L.marker([apt.lat, apt.lon], { icon })
      .bindPopup(`<b>${apt.iata} - ${apt.name}</b><br><a href="airports.html?airport=${apt.iata}">View details</a>`)
      .on('click', function () {
        this.openPopup();
      });

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
  }
}

// Populate the user dropdown list with all users from manifest.json
function populateUserDropdown() {
  const select = document.getElementById('userSelect');
  select.innerHTML = ''; // Clear previous options if any

  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '-- Select a user --';
  select.appendChild(emptyOption);

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

// Main load function that fetches data, sets up UI, and calls appropriate views depending on presence of ?user=
async function loadData() {
  console.log("loadData() started with URL search:", window.location.search);

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

  // Load manifest.json (list of usernames)
  const manifestRes = await fetch('../data/manifest.json');
  manifest = await manifestRes.json();

  populateUserDropdown();

  const params = new URLSearchParams(window.location.search);
  const selectedUser = params.get('user');

  // Get references to DOM elements we'll show/hide
  const userSummaryDiv = document.getElementById('userSummary');
  const userSummaryTable = document.getElementById('userSummaryTable');
  const airportTable = document.getElementById('airportTable');
  const mapDiv = document.getElementById('map');
  const totalsSpan = document.getElementById('totals');
  const titleEl = document.getElementById('title');

  if (selectedUser) {
    // --- USER SELECTED MODE ---
    userSummaryDiv.style.display = 'none';
    userSummaryTable.style.display = 'none';
    airportTable.style.display = 'table';
    mapDiv.style.display = 'block';
    totalsSpan.style.display = 'inline';
    titleEl.textContent = `${selectedUser}'s Visited Airports`;

    await loadUser(selectedUser);

  } else {
    // --- NO USER SELECTED MODE ---
    userSummaryDiv.style.display = 'block';
    userSummaryTable.style.display = 'table';
    airportTable.style.display = 'none';
    mapDiv.style.display = 'none';
    totalsSpan.style.display = 'none';
    titleEl.textContent = 'Traveler Summary';

    await generateUserSummary();
  }
}

loadData();
