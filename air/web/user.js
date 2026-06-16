console.log("✅ Loaded user.js from test directory");
console.log("user.js loaded");

const urlParams = new URLSearchParams(window.location.search);
const selectedUser = urlParams.get("user");

const userSelect = document.getElementById("userSelect");
const totalsSpan = document.getElementById("totals");
const showAllCheckbox = document.getElementById("showAllCheckbox");
const showAllLabel = document.getElementById("showAllLabel");
const mapDiv = document.getElementById("map");
const userSummaryDiv = document.getElementById("userSummary");
const userSummaryTableBody = document.querySelector("#userSummaryTable tbody");
const airportTable = document.getElementById("airportTable");
const airportTableBody = airportTable.querySelector("tbody");
const title = document.getElementById("title");
const backToSummaryLink = document.getElementById("backToSummary");

let map;
let markers = [];

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
  GTM: "Guatemala", GIN: "Guinea", GNB: "Guinea‑Bissau", GUY: "Guyana",
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
  MOZ: "Mozambique", MMR: "Myanmar", NAM: "Namibia", NPL: "Nepal",
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
  SXM: "Sint Maarten", VIR: "U.S. Virgin Islands", PYF:"French Polynesia",
  MAC: "Macau", TWN: "Taiwan", GLP: "Guadeloupe", TCA: "Turks and Caicos Islands",
  SPM: "Saint Pierre & Miquelon"
};

function setTitleAndVisibility(user) {
  if (user) {
    // Personal Mode: Title remains "TM Airports" (handled by HTML), subtitle changes to centered user context
    title.textContent = `${user} - Visited Airports`;
    document.title = `${user}'s Visited Airports`;
    totalsSpan.style.display = "inline";
    mapDiv.style.display = "block";
    airportTable.style.display = "table";
    userSummaryDiv.style.display = "none";
    showAllLabel.style.display = "inline";
  } else {
    // Global Mode: Title remains "TM Airports", subtitle resets to standard centered text
    title.textContent = "Visited Airports";
    document.title = "Traveler Summary";
    totalsSpan.style.display = "none";
    mapDiv.style.display = "none";
    airportTable.style.display = "none";
    userSummaryDiv.style.display = "block";
    showAllLabel.style.display = "none";
  }
}

function addRow(tableBody, values) {
  const tr = document.createElement("tr");
  values.forEach(val => {
    const td = document.createElement("td");
    if (val instanceof HTMLElement) {
      td.appendChild(val);
    } else {
      td.textContent = val;
    }
    tr.appendChild(td);
  });
  tableBody.appendChild(tr);
}

function createSVGIcon(hasA, hasD, hasL, hasX) {
  // Case 1: Just 'Other' activity (X) -> Simple sharp center dot
  if (hasX && !hasA && !hasD && !hasL) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <circle cx="16" cy="16" r="5" fill="#2d3748" />
    </svg>`;
    return window.L.divIcon({
      html: svg,
      className: 'svg-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  const svgParts = [];
  
  // 1. Layover Blue Ring (Rendered underneath triangles to ensure zero overlapping glitches)
  if (hasL) {
    // Sharp integer attributes: Center 16,16 with clear 4px thick stroke on an integer radius
    svgParts.push(`<circle cx="16" cy="16" r="10" fill="none" stroke="#3182ce" stroke-width="4" />`);
  }

  // 2. Departure (Green Triangle pointing up)
  if (hasD) {
    // If the marker also has an arrival, we pull the baseline up 1px to create an explicit separation gap
    const bottomY = hasA ? 15 : 16; 
    svgParts.push(`<polygon points="16,4 6,16 26,16" fill="#38a169" stroke="#276749" stroke-width="1" />`);
  }
  
  // 3. Arrival (Red Triangle pointing down)
  if (hasA) {
    // If the marker also has a departure, we push the top down 1px to create an explicit separation gap
    const topY = hasD ? 17 : 16;
    svgParts.push(`<polygon points="16,28 6,16 26,16" fill="#e53e3e" stroke="#9b2c2c" stroke-width="1" />`);
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">${svgParts.join('')}</svg>`;
  return window.L.divIcon({
    html: svg,
    className: 'svg-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function createMapIfNeeded() {
  if (!map) {
    // 1. Define the hard bounds of the map (South-West corner, North-East corner)
    const southWest = L.latLng(-90, -180);
    const northEast = L.latLng(90, 180);
    const worldBounds = L.latLngBounds(southWest, northEast);

    // 2. Initialize the map with the bounding limits applied
    map = L.map("map", {
      maxBounds: worldBounds,        // Locks the camera pan area
      maxBoundsViscosity: 1.0,       // 1.0 = hard wall (0.0 = elastic bounce)
      minZoom: 2                     // Stops users from zooming out so far that the map tiles duplicate
    }).setView([20, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
  }
}

function clearMarkers() {
  markers.forEach(m => m.remove());
  markers = [];
}

function addMapLegend() {
  // Prevent duplicate legends if the function runs multiple times
  if (document.querySelector(".map-legend")) return;

  const legendControl = L.control({ position: "bottomleft" });

  legendControl.onAdd = function () {
    const div = L.DomUtil.create("div", "map-legend");
    div.innerHTML = `
      <div class="legend-row">
        <div class="legend-symbol">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <circle cx="16" cy="16" r="5" fill="#2d3748" />
          </svg>
        </div>
        <div class="legend-text">Other Visited / Pickup / Tour (X)</div>
      </div>

      <div class="legend-row">
        <div class="legend-symbol">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <circle cx="16" cy="16" r="9" fill="none" stroke="#3182ce" stroke-width="5" />
          </svg>
        </div>
        <div class="legend-text">Layover Only (L)</div>
      </div>

      <div class="legend-row">
        <div class="legend-symbol">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <defs>
              <mask id="leg-ring-cut">
                <circle cx="16" cy="16" r="11.5" fill="white" />
                <rect x="9.5" y="9.5" width="13" height="13" fill="black" transform="rotate(45 16 16)" />
                <rect x="10.5" y="10.5" width="11" height="11" fill="black" transform="rotate(45 16 16)" />
              </mask>
              <mask id="leg-gap-cut">
                <rect width="32" height="32" fill="white" />
                <line x1="2" y1="16" x2="30" y2="16" stroke="black" stroke-width="1.5" />
              </mask>
            </defs>
            <circle cx="16" cy="16" r="9" fill="none" stroke="#3182ce" stroke-width="5" mask="url(#leg-ring-cut)" />
            <g mask="url(#leg-gap-cut)">
              <polygon points="16,6.5 6.5,16 25.5,16" fill="#38a169" />
              <polygon points="16,25.5 6.5,16 25.5,16" fill="#e53e3e" />
            </g>
          </svg>
        </div>
        <div class="legend-text">Full Activity (Arrival & Departure combo)</div>
      </div>
    `;
    return div;
  };

  legendControl.addTo(map);
}

function fetchUserData(user) {
  return fetch(`../data/${user}_airport_data.json`).then(res => res.json());
}

function displayUserAirports(airportList) {
  clearMarkers();
  airportTableBody.innerHTML = "";

  const stats = { arrivals: 0, departures: 0, layovers: 0 };

  createMapIfNeeded();
  if (!document.querySelector(".map-legend")) addMapLegend();

  airportList.forEach(ap => {
    const visited =
      ap.visits.includes("A") ||
      ap.visits.includes("D") ||
      ap.visits.includes("L") ||
      ap.visits.includes("X");

    if (!showAllCheckbox.checked && !visited) return;

    const row = [
      countryMap[ap.country] || ap.country || "",
      (() => {
        const link = document.createElement("a");
        const code = ap.code || ap.iata || "";
        link.href = `airports.html?airport=${code}`;
        link.textContent = code;
        return link;
      })(),
      ap.name || "",
      ap.visits.includes("A") ? "✔" : "",
      ap.visits.includes("D") ? "✔" : "",
      ap.visits.includes("L") ? "✔" : "",
      ap.visits.includes("X") ? "✔" : "",
    ];
    addRow(airportTableBody, row);

    if (ap.visits.includes("A")) stats.arrivals++;
    if (ap.visits.includes("D")) stats.departures++;
    if (ap.visits.includes("L")) stats.layovers++;

    if (ap.lat && ap.lon) {
      const hasA = ap.visits.includes("A");
      const hasD = ap.visits.includes("D");
      const hasL = ap.visits.includes("L");
      const hasX = ap.visits.includes("X");
      const icon = createSVGIcon(hasA, hasD, hasL, hasX);

      const marker = L.marker([ap.lat, ap.lon], { icon })
        .bindPopup(`<b>${ap.code} - ${ap.name}</b><br><a href="airports.html?airport=${ap.code}">View details</a>`);
      marker.addTo(map);
      markers.push(marker);
    }
  });

  const totalVisited = airportList.filter(ap =>
    ap.visits.includes("A") ||
    ap.visits.includes("D") ||
    ap.visits.includes("L")
  ).length;

  totalsSpan.textContent = `Total: ${totalVisited} | Arrivals: ${stats.arrivals} | Departures: ${stats.departures} | Layovers: ${stats.layovers}`;
}

function displayUserSummary(userList) {
  userSummaryTableBody.innerHTML = "";

  userList.forEach(async user => {
    const userLink = document.createElement("a");
    userLink.href = `user.html?user=${encodeURIComponent(user)}`;
    userLink.textContent = user;
    userLink.className = "user-link";

    try {
      const airportList = await fetchUserData(user);
      let arrivals = 0, departures = 0, layovers = 0;
      let visitedCount = 0;
      let other = 0;

      airportList.forEach(ap => {
        const hasA = ap.visits.includes("A");
        const hasD = ap.visits.includes("D");
        const hasL = ap.visits.includes("L");
        const hasX = ap.visits.includes("X");

        if (hasA || hasD || hasL) visitedCount++;
        if (hasA) arrivals++;
        if (hasD) departures++;
        if (hasL) layovers++;

        if (!hasA && !hasD && !hasL && (ap.visits.length > 0)) {
          other++;
        }
      });

      const total = visitedCount;

      const row = [
        userLink,
        total.toString(),
        arrivals.toString(),
        departures.toString(),
        layovers.toString(),
        other.toString()
      ];

      addRow(userSummaryTableBody, row);
    } catch (err) {
      console.error(`Error loading data for user ${user}:`, err);
      const row = [userLink, "", "", "", ""];
      addRow(userSummaryTableBody, row);
    }
  });
}

function enableTableSorting() {
  document.querySelectorAll("th.sortable").forEach(header => {
    header.addEventListener("click", () => {
      const table = header.closest("table");
      const tbody = table.querySelector("tbody");
      const rows = Array.from(tbody.rows);
      const index = Array.from(header.parentNode.children).indexOf(header);
      const ascending = !header.classList.contains("asc");

      rows.sort((a, b) => {
        const valA = a.cells[index].textContent.trim();
        const valB = b.cells[index].textContent.trim();

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return ascending ? numA - numB : numB - numA;
        } else {
          return ascending
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
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

userSelect.addEventListener("change", () => {
  const selected = userSelect.value;
  window.location.href = `user.html?user=${encodeURIComponent(selected)}`;
});

showAllCheckbox.addEventListener("change", () => {
  if (selectedUser) {
    fetchUserData(selectedUser).then(displayUserAirports);
  }
});

function loadData() {
  fetch("../data/manifest.json")
    .then(res => res.json())
    .then(async users => {
      users.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
      users.forEach(user => {
        const option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        if (user === selectedUser) option.selected = true;
        userSelect.appendChild(option);
      });

      setTitleAndVisibility(selectedUser);

      const navSeparator = document.getElementById("nav-separator");
      if (selectedUser) {
        backToSummaryLink.style.display = "inline";
        navSeparator.style.display = "inline";

        const airports = await fetchUserData(selectedUser);
        displayUserAirports(airports);
      } else {
        backToSummaryLink.style.display = "none";
        navSeparator.style.display = "none";

        displayUserSummary(users);
      }
    });
}

loadData();
enableTableSorting();
