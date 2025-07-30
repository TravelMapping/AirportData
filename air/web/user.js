console.log("At user.js start, global L:", window.L);
const mapInstance = window.L.map('map').setView([20, 0], 5);

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

// --- MOVE generateUserSummary ABOVE loadData ---
async function generateUserSummary() {
  const visitsByAirport = {};

  await Promise.all(manifest.map(async user => {
    const res = await fetch(`../data/${user}.alist`);
    const text = await res.text();
    const visits = parseALIST(text);

    for (const [iata, types] of Object.entries(visits)) {
      if (!visitsByAirport[iata]) {
        visitsByAirport[iata] = { A: 0, D: 0, L: 0, total: 0 };
      }
      if (types.A) visitsByAirport[iata].A++;
      if (types.D) visitsByAirport[iata].D++;
      if (types.L) visitsByAirport[iata].L++;
      visitsByAirport[iata].total++;
    }
  }));

  const tbody = document.querySelector('#airportTable tbody');
  tbody.innerHTML = '';

  const sortedIATAs = Object.keys(visitsByAirport).sort();

  sortedIATAs.forEach(iata => {
    const counts = visitsByAirport[iata];
    const airport = airportsData.find(a => a.iata === iata);
    if (!airport) return;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${countryMap[airport.country] || airport.country}</td>
      <td><a href="airports.html?airport=${iata}">${iata}</a></td>
      <td>${airport.name}</td>
      <td>${counts.total}</td>
      <td>${counts.A}</td>
      <td>${counts.D}</td>
      <td>${counts.L}</td>
    `;
    tbody.appendChild(row);
  });

  if (window.markersLayer) mapInstance.removeLayer(window.markersLayer);
  mapInstance.setView([20, 0], 2);
}

async function loadData() {
  console.log("loadData() started, URL search:", window.location.search);
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

  const manifestRes = await fetch('../data/manifest.json');
  manifest = await manifestRes.json();

  populateUserDropdown();

  const params = new URLSearchParams(window.location.search);
  const selectedUser = params.get('user');

  const userSummaryDiv = document.getElementById('userSummary');
  const userSummaryTable = document.getElementById('userSummaryTable');
  const airportTable = document.getElementById('airportTable');
  const mapDiv = document.getElementById('map');
  const titleEl = document.getElementById('title');

  if (selectedUser) {
    userSummaryDiv.style.display = 'none';
    userSummaryTable.style.display = 'none';
    airportTable.style.display = 'table';
    mapDiv.style.display = 'block';
    titleEl.textContent = `${selectedUser}'s Visited Airports`;
    loadUser(selectedUser);
  } else {
    userSummaryDiv.style.display = 'block';
    userSummaryTable.style.display = 'table';
    airportTable.style.display = 'none';
    mapDiv.style.display = 'none';
    titleEl.textContent = 'Traveler Summary';
    await generateUserSummary();
  }
}

function populateUserDropdown() {
  const select = document.getElementById('userSelect');
  manifest.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user;
    opt.textContent = user;
    select.appendChild(opt);
  });

  const params = new URLSearchParams(window.location.search);
  const selectedUser = params.get('user') || '';

  if (selectedUser) {
    select.value = selectedUser;
  } else {
    select.value = '';
  }

  select.addEventListener('change', () => {
    const newUser = select.value;
    if (newUser) {
      window.location.search = `?user=${newUser}`;
    } else {
      window.location.search = '';
    }
  });
}

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
    const avgLon = visitedAirports.reduce((sum, a) => a.lon + sum, 0) / visitedAirports.length;
    mapInstance.setView([avgLat, avgLon], 5);
  }
}

// --- Check if generateUserSummary is defined ---
console.log("Is generateUserSummary defined?", typeof generateUserSummary);

loadData();
