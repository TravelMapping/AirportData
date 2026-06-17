console.log("✅ Loaded airports.js module");

const countryMap = {
  AFG: "Afghanistan", ALB: "Albania", DZA: "Algeria", AND: "Andorra",
  AGO: "Angola", AIA: "Anguilla", ATA: "Antarctica", ARG: "Argentina",
  ARM: "Armenia", ABW: "Aruba", AUS: "Australia", AUT: "Austria",
  AZE: "Azerbaijan", BHS: "Bahamas", BHR: "Bahrain", BGD: "Bangladesh",
  BRB: "Barbados", BLR: "Belarus", BEL: "Belgium", BLZ: "Belize",
  BEN: "Benin", BMU: "Bermuda", BTN: "Bhutan", BOL: "Bolivia",
  BIH: "Bosnia & Herzegovina", BWA: "Botswana", BRA: "Brazil",
  BRN: "Brunei", BGR: "Bulgaria", BFA: "Burkina Faso", BDI: "Burundi",
  KHM: "Cambodia", CMR: "Cameroon", CAN: "Canada", CPV: "Cape Verde",
  CAF: "Central African Republic", TCD: "Chad", CHL: "Chile", CHN: "China",
  COL: "Colombia", COM: "Comoros", COD: "DR Congo", COG: "Congo",
  CRI: "Costa Rica", CIV: "Ivory Coast", HRV: "Croatia", CUB: "Cuba",
  CYP: "Cyprus", CZE: "Czech Republic", DNK: "Denmark", DJI: "Djibouti",
  DMA: "Dominica", DOM: "Dominican Republic", ECU: "Ecuador", EGY: "Egypt",
  SLV: "El Salvador", GNQ: "Equatorial Guinea", ERI: "Eritrea",
  EST: "Estonia", SWZ: "eSwatini", ETH: "Ethiopia", FIN: "Finland",
  FRA: "France", GAB: "Gabon", GMB: "Gambia", GEO: "Georgia",
  DEU: "Germany", GHA: "Ghana", GRC: "Greece", GRD: "Grenada",
  GTM: "Guatemala", GIN: "Guinea", GNB: "Guinea-Bissau", GUY: "Guyana",
  HTI: "Haiti", HND: "Honduras", HUN: "Hungary", ISL: "Iceland",
  IND: "India", IDN: "Indonesia", IRN: "Iran", IRQ: "Iraq", IRL: "Ireland",
  ISR: "Israel", ITA: "Italy", JAM: "Jamaica", JPN: "Japan", JOR: "Jordan",
  KAZ: "Kazakhstan", KEN: "Kenya", KIR: "Kiribati", KWT: "Kuwait",
  KGZ: "Kyrgyzstan", LAO: "Laos", LVA: "Latvia", LBN: "Lebanon",
  LSO: "Lesotho", LBR: "Liberia", LBY: "Libya", LIE: "Liechtenstein",
  LTU: "Lithuania", LUX: "Luxembourg", MDG: "Madagascar", MWI: "Malawi",
  MYS: "Malaysia", MDV: "Maldives", MLI: "Mali", MLT: "Malta",
  MRT: "Mauritania", MUS: "Mauritius", MEX: "Mexico", MDA: "Moldova",
  MCO: "Monaco", MNG: "Mongolia", MNE: "Montenegro", MAR: "Morocco",
  MOZ: "Boom", MMR: "Myanmar", NAM: "Namibia", NPL: "Nepal",
  NLD: "Netherlands", NZL: "New Zealand", NIC: "Nicaragua", NER: "Niger",
  NGA: "Nigeria", PRK: "North Korea", MKD: "North Macedonia", NOR: "Norway",
  OMN: "Oman", PAK: "Pakistan", PAN: "Panama", PNG: "Papua New Guinea",
  PRY: "Paraguay", PER: "Peru", PHL: "Philippines", POL: "Poland",
  PRT: "Portugal", QAT: "Qatar", ROU: "Romania", RUS: "Russia",
  RWA: "Rwanda", KNA: "Saint Kitts & Nevis", LCA: "Saint Lucia",
  VCT: "Saint Vincent & Grenadines", WSM: "Samoa", SMR: "San Marino",
  STP: "São Tomé & Príncipe", SAU: "Saudi Arabia", SEN: "Senegal",
  SRB: "Serbia", SYC: "Seychelles", SLE: "Sierra Leone", SGP: "Singapore",
  SVK: "Slovakia", SVN: "Slovenia", SLB: "Solomon Islands",
  SOM: "Somalia", ZAF: "South Africa", KOR: "South Korea",
  SSD: "South Sudan", ESP: "Spain", LKA: "Sri Lanka", SDN: "Sudan",
  SUR: "Suriname", SWE: "Sweden", CHE: "Switzerland", SYR: "Syria",
  TJK: "Tajikistan", TZA: "Tanzania", THA: "Thailand", TLS: "Timor-Leste",
  TGO: "Togo", TON: "Tonga", TTO: "Trinidad & Tobago", TUN: "Tunisia",
  TUR: "Turkey", TKM: "Turkmenistan", TUV: "Tuvalu", UGA: "Uganda",
  UKR: "Ukraine", ARE: "United Arab Emirates", GBR: "United Kingdom",
  USA: "United States", URY: "Uruguay", UZB: "Uzbekistan", VUT: "Vanuatu",
  VAT: "Vatican City", VEN: "Venezuela", VNM: "Vietnam", ZMB: "Zambia",
  ZWE: "Zimbabwe", BLM: "Saint Barthélemy", CUW: "Curaçao", FJI: "Fiji",
  FSM: "Micronesia", MAF: "Saint-Martin", PRI: "Puerto Rico",
  SXM: "Sint Maarten", VIR: "U.S. Virgin Islands", PYF: "French Polynesia",
  MAC: "Macau", TWN: "Taiwan", GLP: "Guadeloupe", TCA: "Turks and Caicos Islands",
  SPM: "Saint Pierre & Miquelon"
};

const csvUrl = '../data/airports.csv';
const manifestUrl = '../data/manifest.json';
const dataPath = '../data/';

let airports = {};
let airportList = [];
let airportVisitCounts = {};       
let airportsWithXOnlyCount = {};   
let airportsWithXOnlySet = new Set();
let map;
let selectedMarker;

function initMap() {
  const southWest = L.latLng(-90, -180);
  const northEast = L.latLng(90, 180);
  const worldBounds = L.latLngBounds(southWest, northEast);

  // Define basemap layers matching user.html tokens
  const openStreetMap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  });

  const cartoDbPositron = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  });

  const esriGrayCanvas = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: '&copy; Esri, HERE, Garmin, NGA, USGS',
    maxZoom: 16
  });

  // Read saved basemap string preference, fall back to CartoDB Positron
  const savedBasemap = localStorage.getItem("preferred_basemap") || "Light Gray (CartoDB)";
  let initialLayer = cartoDbPositron;
  if (savedBasemap === "Standard Map (OSM)") initialLayer = openStreetMap;
  if (savedBasemap === "Minimal Canvas (Esri)") initialLayer = esriGrayCanvas;

  map = L.map('map', {
    maxBounds: worldBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 2,
    layers: [initialLayer]
  }).setView([20, 0], 2);

  const baseMaps = {
    "Light Gray (CartoDB)": cartoDbPositron,
    "Minimal Canvas (Esri)": esriGrayCanvas,
    "Standard Map (OSM)": openStreetMap
  };

  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

  // Hook choice updates directly to local retention key
  map.on('baselayerchange', (e) => {
    localStorage.setItem("preferred_basemap", e.name);
  });

  selectedMarker = L.circleMarker([0, 0], {
    radius: 11,
    color: '#1a202c',
    fillColor: '#3182ce',
    fillOpacity: 1,
    weight: 3
  });
}

function pulseMarker(marker) {
  const originalRadius = marker.options.radius;
  const pulseRadius = originalRadius + 4; 
  const pulseDuration = 300; 

  function singlePulse() {
    marker.setStyle({ radius: pulseRadius });
    setTimeout(() => {
      marker.setStyle({ radius: originalRadius });
    }, pulseDuration);
  }

  singlePulse();
  setTimeout(singlePulse, pulseDuration * 2);
}

function highlightSelectedMarker(code) {
  const airport = airports[code];
  if (!airport) return;

  const flyingCount = airportVisitCounts[code] || 0;
  const maxVisits = Math.max(...Object.values(airportVisitCounts), 1);
  const color = getMarkerColor(code, flyingCount, maxVisits);

  selectedMarker.setStyle({
    color: '#1a202c', 
    fillColor: color,
    radius: 12,
    weight: 3
  });

  selectedMarker.setLatLng([airport.lat, airport.lon])
    .bindPopup(`<b>${airport.code} - ${airport.name}</b>`)
    .openPopup();

  if (!map.hasLayer(selectedMarker)) {
    selectedMarker.addTo(map);
  }

  pulseMarker(selectedMarker);
}
  
function updateHomeLinkVisibility() {
  const params = new URLSearchParams(window.location.search);
  const airportParam = params.get('airport');
  const homeLink = document.getElementById('homeLink');
  if (airportParam && airports[airportParam.toUpperCase()]) {
    homeLink.style.display = 'block';
  } else {
    homeLink.style.display = 'none';
  }
}

async function fetchAirports() {
  const res = await fetch(csvUrl);
  const text = await res.text();
  const lines = text.trim().split('\n');
  lines.shift(); 
  for (const line of lines) {
    const [country, code, name, lat, lon] = line.split(';');
    if (!code) continue;
    airports[code.toUpperCase()] = {
      country: (country || '').trim(), 
      code: code.toUpperCase(),
      name: name ? name.trim() : "",
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };
    airportList.push({ code: code.toUpperCase(), name });
  }
  populateDropdown();

  await computeAirportVisitCounts();
  placeAllMarkers();
  createAirportSummaryTable();

  updateHomeLinkVisibility();
  const params = new URLSearchParams(window.location.search);
  const airportParam = params.get('airport');
  if (airportParam && airports[airportParam.toUpperCase()]) {
    document.getElementById('airportSelect').value = airportParam.toUpperCase();
    handleAirportSelect(airportParam.toUpperCase());
  } else {
    document.getElementById('airportSummaryTable').style.display = 'table';
  }
}

function populateDropdown() {
  const sel = document.getElementById('airportSelect');
  for (const airport of airportList.sort((a, b) => a.code.localeCompare(b.code))) {
    const opt = document.createElement('option');
    opt.value = airport.code;
    opt.textContent = `${airport.code} - ${airport.name}`;
    sel.appendChild(opt);
  }
}

async function fetchManifest() {
  const res = await fetch(manifestUrl);
  return await res.json();
}

async function fetchAlist(username) {
  const res = await fetch(`${dataPath}${username}.alist`);
  const text = await res.text();
  return text.split('\n').filter(line => !line.startsWith('#'));
}

async function computeAirportVisitCounts() {
  const manifest = await fetchManifest();
  const counts = {};
  const xOnlyCounts = {};

  for (const user of manifest) {
    try {
      const lines = await fetchAlist(user);
      const flyingSet = new Set();
      const xOnlySetForUser = new Set();

      for (const line of lines) {
        const [code, ...flags] = line.trim().split(/\s+/);
        if (!code) continue;
        const iata = code.toUpperCase();
        if (!(iata in airports)) continue;

        const flagStr = flags.join('').toUpperCase();
        const hasVisit = /[ADL]/.test(flagStr);
        const hasX = /X/.test(flagStr);

        if (hasVisit) {
          flyingSet.add(iata);
          xOnlySetForUser.delete(iata);
        } else if (hasX) {
          if (!flyingSet.has(iata)) xOnlySetForUser.add(iata);
        }
      }

      for (const iata of flyingSet) counts[iata] = (counts[iata] || 0) + 1;
      for (const iata of xOnlySetForUser) xOnlyCounts[iata] = (xOnlyCounts[iata] || 0) + 1;
    } catch (e) {
      console.warn(`Error loading ALIST for ${user}`);
    }
  }

  airportVisitCounts = counts;
  airportsWithXOnlyCount = xOnlyCounts;
  airportsWithXOnlySet = new Set(Object.keys(airportsWithXOnlyCount).filter(code => !(code in airportVisitCounts)));
}

function lerp(a, b, t) { return a + (b - a) * t; }

function colorForFlyingCount(count, maxCount) {
  if (count === 0) return '#cbd5e0'; 
  const ratio = Math.min(Math.max((count - 1) / (Math.max(1, maxCount - 1)), 0), 1);
  let hue;
  if (ratio <= 0.5) hue = lerp(240, 60, ratio / 0.5);
  else hue = lerp(60, 0, (ratio - 0.5) / 0.5);
  
  let saturation, lightness;
  if (ratio <= 0.5) {
    const t = ratio / 0.5;
    saturation = Math.round(lerp(60, 100, Math.pow(t, 0.9)));
    lightness  = Math.round(lerp(40, 50, Math.pow(t, 0.8)));
  } else {
    const t = (ratio - 0.5) / 0.5;
    saturation = Math.round(lerp(100, 90, t));
    lightness  = Math.round(lerp(50, 60, t));
  }
  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
}

function getMarkerColor(code, flyingCount, maxCount) {
  if (airportsWithXOnlySet.has(code)) return '#a0aec0';
  return colorForFlyingCount(flyingCount, maxCount);
}

function createLegend(maxVisits) {
  if (map.legendControl) {
    map.removeControl(map.legendControl);
  }
  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = '<strong>Users per airport</strong>';

    const mid = Math.max(1, Math.floor(maxVisits / 2));
    const stops = [
      { label: '0 Flying Visits', count: 0 },
      { label: '1 User', count: 1 },
      { label: `${mid} Users`, count: mid },
      { label: `${maxVisits} Users (Max)`, count: maxVisits }
    ];

    for (const stop of stops) {
      const color = colorForFlyingCount(stop.count, maxVisits);
      div.innerHTML += `<div><i style="background:${color}"></i>${stop.label}</div>`;
    }
    div.innerHTML += `<div><i style="background:#a0aec0"></i>Non-flying only (X)</div>`;
    return div;
  };
  legend.addTo(map);
  map.legendControl = legend;
}

function placeAllMarkers() {
  const maxVisits = Math.max(...Object.values(airportVisitCounts), 1);
  createLegend(maxVisits);

  const airportArr = Object.values(airports).map(a => ({
    code: a.code,
    lat: a.lat,
    lon: a.lon,
    count: airportVisitCounts[a.code] || 0,
    xOnly: airportsWithXOnlyCount[a.code] || 0,
    name: a.name
  }));

  airportArr.sort((a, b) => a.count - b.count);

  for (const a of airportArr) {
    const color = getMarkerColor(a.code, a.count, maxVisits);
    const flyingCount = a.count;
    const xOnlyCount = a.xOnly;

    const popupText = `<b>${a.code}</b><br>${a.name}<br>` +
      `${flyingCount}${xOnlyCount ? ` + ${xOnlyCount} (non-flying)` : ''} user(s)` +
      `<br><a href="?airport=${a.code}" class="popup-loc-link" data-code="${a.code}">View details</a>`;

    const marker = L.circleMarker([a.lat, a.lon], {
      radius: 6,
      color: color,
      fillColor: color,
      fillOpacity: 0.85,
      weight: 1
    })
    .addTo(map)
    .bindPopup(popupText);

    marker.on('click', () => {
      document.getElementById('airportSelect').value = a.code;
      handleAirportSelect(a.code);
    });
  }

  // Intercept popup link clicks to cycle local states without breaking routes
  map.on('popupopen', () => {
    const link = document.querySelector('.popup-loc-link');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const code = link.getAttribute('data-code');
        document.getElementById('airportSelect').value = code;
        handleAirportSelect(code);
        map.closePopup();
      });
    }
  });
}

function parseAlist(lines, selectedCode) {
  const result = {};
  for (const line of lines) {
    const [code, ...flags] = line.trim().split(/\s+/);
    if (!code || !flags) continue;
    if (code.toUpperCase() !== selectedCode) continue;
    for (const flag of flags) {
      for (const ch of flag.toUpperCase()) {
        if ('ADL'.includes(ch)) result[ch] = true; 
      }
    }
  }
  return result;
}

function userHasXOnly(lines, selectedCode) {
  let hasVisit = false; 
  let hasX = false;

  for (const line of lines) {
    const [code, ...flags] = line.trim().split(/\s+/);
    if (!code) continue;
    if (code.toUpperCase() !== selectedCode) continue;

    const flagStr = flags.join('').toUpperCase();
    if (/[ADL]/.test(flagStr)) hasVisit = true;
    if (/X/.test(flagStr))     hasX = true;
  }
  return hasX && !hasVisit; 
}

function updateTable(data) {
  const tbody = document.querySelector('#visitTable tbody');
  tbody.innerHTML = '';
  const users = Object.keys(data).sort();
  document.getElementById('visitTable').style.display = users.length ? 'table' : 'none';
  document.getElementById('visitCount').textContent = `${users.length} user(s) have flying visits to this airport.`;

  for (const user of users) {
    const row = document.createElement('tr');
    const tdUser = document.createElement('td');
    const link = document.createElement('a');
    link.href = `user.html?user=${encodeURIComponent(user)}`;
    link.textContent = user;
    tdUser.appendChild(link);
    row.appendChild(tdUser);
    for (const type of ['A', 'D', 'L']) {
      const td = document.createElement('td');
      td.textContent = data[user][type] ? '✔' : '';
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }
}
  
function updateXOnlyList(usernames) {
  const header = document.getElementById('xOnlyHeader');
  const table  = document.getElementById('xOnlyTable');
  const tbody  = table.querySelector('tbody');

  tbody.innerHTML = '';
  if (usernames.length > 0) {
    header.style.display = '';
    table.style.display  = 'table';

    usernames.sort().forEach(user => {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      const link = document.createElement('a');
      link.href = `user.html?user=${encodeURIComponent(user)}`;
      link.textContent = user;
      td.appendChild(link);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  } else {
    header.style.display = 'none';
    table.style.display  = 'none';
  }
}

async function handleAirportSelect(code) {
  const airport = airports[code];
  if (!airport) return;

  document.getElementById('airportSummaryTable').style.display = 'none';

  history.replaceState(null, '', `?airport=${code}`);
  updateHomeLinkVisibility();

  map.setView([airport.lat, airport.lon], 11);
  highlightSelectedMarker(code);

  const manifest = await fetchManifest();
  const visitData = {};
  const xOnlyUsers = [];

  for (const user of manifest) {
    try {
      const lines = await fetchAlist(user);
      const visits = parseAlist(lines, code);
      if (Object.keys(visits).length > 0) {
        visitData[user] = visits;
      } else if (userHasXOnly(lines, code)) {
        xOnlyUsers.push(user);
      }
    } catch (e) {
      console.warn(`Error loading ALIST for ${user}`);
    }
  }

  updateTable(visitData);
  updateXOnlyList(xOnlyUsers);
}
  
function createAirportSummaryTable() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('airport')) {
    document.getElementById('airportSummaryTable').style.display = 'none';
    return;
  }

  const tbody = document.querySelector('#airportSummaryTable tbody');
  tbody.innerHTML = '';

  const rows = Object.values(airports).map(a => ({
    country: a.country || '',  
    code: a.code,
    name: a.name,
    visitors: airportVisitCounts[a.code] || 0,
    xOnly: airportsWithXOnlyCount[a.code] || 0
  }));

  rows.sort((a, b) => b.visitors - a.visitors);

  for (const row of rows) {
    const countryName =
      countryMap[row.country] ||
      countryMap[(row.country || '').toUpperCase()] ||
      row.country || '';
    const visitorText = row.visitors + (row.xOnly ? ` + ${row.xOnly} (non-flying)` : '');
    
    const tr = document.createElement('tr');
    
    const tdCountry = document.createElement('td');
    tdCountry.textContent = countryName;
    tr.appendChild(tdCountry);

    const tdIata = document.createElement('td');
    const link = document.createElement('a');
    link.href = `?airport=${row.code}`;
    link.textContent = row.code;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('airportSelect').value = row.code;
      handleAirportSelect(row.code);
    });
    tdIata.appendChild(link);
    tr.appendChild(tdIata);

    const tdName = document.createElement('td');
    tdName.textContent = row.name;
    tr.appendChild(tdName);

    const tdVisitors = document.createElement('td');
    tdVisitors.textContent = visitorText;
    tr.appendChild(tdVisitors);

    tbody.appendChild(tr);
  }

  document.getElementById('airportSummaryTable').style.display = 'table';
}

function enableTableSorting() {
  document.querySelectorAll("th.sortable").forEach(header => {
    header.addEventListener("click", () => {
      const table = header.closest("table");
      const tbody = table.querySelector("tbody");
      const rows = Array.from(tbody.rows);
      const index = Array.from(header.parentNode.children).indexOf(header);
      const ascending = !header.classList.contains("asc");
      const sortType = header.dataset.sort || 'string';

      rows.sort((a, b) => {
        const valA = a.cells[index].textContent.trim();
        const valB = b.cells[index].textContent.trim();

        if (sortType === 'number') {
          // Splitting on space isolates the true flying integer count, cleanly throwing out "+ X"
          const numA = parseInt(valA.split(" ")[0]) || 0;
          const numB = parseInt(valB.split(" ")[0]) || 0;
          return ascending ? numA - numB : numB - numA;
        } else {
          return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
      });

      header.parentNode.querySelectorAll("th").forEach(th => {
        th.classList.remove("asc", "desc");
      });
      header.classList.add(ascending ? "asc" : "desc");

      rows.forEach(row => tbody.appendChild(row));
    });
  });
}

document.getElementById('airportSelect').addEventListener('change', (e) => {
  const code = e.target.value.toUpperCase();
  if (code) {
    handleAirportSelect(code);
  } else {
    window.location.href = 'airports.html';
  }
});

// Setup execution
initMap();
fetchAirports();
enableTableSorting();
