console.log("✅ Loaded user.js from ranking branch");
console.log("user.js loaded");

const mapInstance = window.L.map('map').setView([20, 0], 5);

window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(mapInstance);

let airportsData = [];
let manifest = [];

const countryMap = {
  AFG: "Afghanistan", ALB: "Albania", DZA: "Algeria", AND: "Andorra",
  AGO: "Angola", ATG: "Antigua and Barbuda", ARG: "Argentina", ARM: "Armenia",
  AUS: "Australia", AUT: "Austria", AZE: "Azerbaijan", BHS: "Bahamas",
  BHR: "Bahrain", BGD: "Bangladesh", BRB: "Barbados", BLR: "Belarus",
  BEL: "Belgium", BLZ: "Belize", BEN: "Benin", BTN: "Bhutan",
  BOL: "Bolivia", BIH: "Bosnia and Herzegovina", BWA: "Botswana",
  BRA: "Brazil", BRN: "Brunei", BGR: "Bulgaria", BFA: "Burkina Faso",
  BDI: "Burundi", KHM: "Cambodia", CMR: "Cameroon", CAN: "Canada",
  CPV: "Cape Verde", CAF: "Central African Republic", TCD: "Chad",
  CHL: "Chile", CHN: "China", COL: "Colombia", COM: "Comoros",
  COG: "Congo", CRI: "Costa Rica", HRV: "Croatia", CUB: "Cuba",
  CYP: "Cyprus", CZE: "Czech Republic", COD: "Democratic Republic of the Congo",
  DNK: "Denmark", DJI: "Djibouti", DMA: "Dominica", DOM: "Dominican Republic",
  ECU: "Ecuador", EGY: "Egypt", SLV: "El Salvador", GNQ: "Equatorial Guinea",
  ERI: "Eritrea", EST: "Estonia", SWZ: "Eswatini", ETH: "Ethiopia",
  FJI: "Fiji", FIN: "Finland", FRA: "France", GAB: "Gabon",
  GMB: "Gambia", GEO: "Georgia", DEU: "Germany", GHA: "Ghana",
  GRC: "Greece", GRD: "Grenada", GTM: "Guatemala", GIN: "Guinea",
  GNB: "Guinea-Bissau", GUY: "Guyana", HTI: "Haiti", HND: "Honduras",
  HUN: "Hungary", ISL: "Iceland", IND: "India", IDN: "Indonesia",
  IRN: "Iran", IRQ: "Iraq", IRL: "Ireland", ISR: "Israel",
  ITA: "Italy", JAM: "Jamaica", JPN: "Japan", JOR: "Jordan",
  KAZ: "Kazakhstan", KEN: "Kenya", KIR: "Kiribati", PRK: "North Korea",
  KOR: "South Korea", KWT: "Kuwait", KGZ: "Kyrgyzstan", LAO: "Laos",
  LVA: "Latvia", LBN: "Lebanon", LSO: "Lesotho", LBR: "Liberia",
  LBY: "Libya", LIE: "Liechtenstein", LTU: "Lithuania", LUX: "Luxembourg",
  MDG: "Madagascar", MWI: "Malawi", MYS: "Malaysia", MDV: "Maldives",
  MLI: "Mali", MLT: "Malta", MHL: "Marshall Islands", MRT: "Mauritania",
  MUS: "Mauritius", MEX: "Mexico", FSM: "Micronesia", MDA: "Moldova",
  MCO: "Monaco", MNG: "Mongolia", MNE: "Montenegro", MAR: "Morocco",
  MOZ: "Mozambique", MMR: "Myanmar", NAM: "Namibia", NRU: "Nauru",
  NPL: "Nepal", NLD: "Netherlands", NZL: "New Zealand", NIC: "Nicaragua",
  NER: "Niger", NGA: "Nigeria", MKD: "North Macedonia", NOR: "Norway",
  OMN: "Oman", PAK: "Pakistan", PLW: "Palau", PAN: "Panama",
  PNG: "Papua New Guinea", PRY: "Paraguay", PER: "Peru", PHL: "Philippines",
  POL: "Poland", PRT: "Portugal", QAT: "Qatar", ROU: "Romania",
  RUS: "Russia", RWA: "Rwanda", KNA: "Saint Kitts and Nevis", LCA: "Saint Lucia",
  VCT: "Saint Vincent and the Grenadines", WSM: "Samoa", SMR: "San Marino",
  STP: "Sao Tome and Principe", SAU: "Saudi Arabia", SEN: "Senegal",
  SRB: "Serbia", SYC: "Seychelles", SLE: "Sierra Leone", SGP: "Singapore",
  SVK: "Slovakia", SVN: "Slovenia", SLB: "Solomon Islands", SOM: "Somalia",
  ZAF: "South Africa", SSD: "South Sudan", ESP: "Spain", LKA: "Sri Lanka",
  SDN: "Sudan", SUR: "Suriname", SWE: "Sweden", CHE: "Switzerland",
  SYR: "Syria", TWN: "Taiwan", TJK: "Tajikistan", TZA: "Tanzania",
  THA: "Thailand", TLS: "Timor-Leste", TGO: "Togo", TON: "Tonga",
  TTO: "Trinidad and Tobago", TUN: "Tunisia", TUR: "Turkey", TKM: "Turkmenistan",
  TUV: "Tuvalu", UGA: "Uganda", UKR: "Ukraine", ARE: "United Arab Emirates",
  GBR: "United Kingdom", USA: "United States", URY: "Uruguay", UZB: "Uzbekistan",
  VUT: "Vanuatu", VAT: "Vatican City", VEN: "Venezuela", VNM: "Vietnam",
  YEM: "Yemen", ZMB: "Zambia", ZWE: "Zimbabwe"
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

  // First option: blank/default
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '-- Select a user --';
  select.appendChild(defaultOpt);

  manifest.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user;
    opt.textContent = user;
    select.appendChild(opt);
  });

  const params = new URLSearchParams(window.location.search);
  const selectedUser = params.get('user');

  // Only set dropdown if URL has a user selected
  if (selectedUser) {
    select.value = selectedUser;
  } else {
    select.value = ''; // Explicitly select the blank option
  }

  select.addEventListener('change', () => {
    const newUser = select.value;
    if (newUser) {
      window.location.search = `?user=${newUser}`;
    } else {
      // Clear query string to show summary view
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

loadData();
