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

let map;
let markers = [];

function setTitleAndVisibility(user) {
  if (user) {
    title.textContent = `${user}'s Visited Airports`;
    document.title = `${user}'s Visited Airports`;
    totalsSpan.style.display = "inline";
    mapDiv.style.display = "block";
    airportTable.style.display = "table";
    userSummaryDiv.style.display = "none";
    showAllLabel.style.display = "inline";
  } else {
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

function createMapIfNeeded() {
  if (!map) {
    map = L.map("map").setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
  }
}

function clearMarkers() {
  markers.forEach(m => m.remove());
  markers = [];
}

function loadData() {
  fetch("manifest.json")
    .then(res => res.json())
    .then(async manifest => {
      const users = Object.keys(manifest);
      users.sort();
      users.forEach(user => {
        const option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        if (user === selectedUser) option.selected = true;
        userSelect.appendChild(option);
      });

      setTitleAndVisibility(selectedUser);

      if (selectedUser) {
        const airports = await fetchUserData(selectedUser);
        displayUserAirports(airports);
      } else {
        displayUserSummary(manifest);
      }
    });
}

function fetchUserData(user) {
  return fetch(`../users/${user}.json`).then(res => res.json());
}

function displayUserAirports(airportList) {
  clearMarkers();
  airportTableBody.innerHTML = "";

  const stats = { arrivals: 0, departures: 0, layovers: 0 };

  airportList.forEach(ap => {
    const row = [
      ap.country || "",
      ap.iata,
      ap.name,
      ap.arrival ? "✔" : "",
      ap.departure ? "✔" : "",
      ap.layover ? "✔" : ""
    ];
    addRow(airportTableBody, row);

    if (ap.arrival) stats.arrivals++;
    if (ap.departure) stats.departures++;
    if (ap.layover) stats.layovers++;

    if (!showAllCheckbox.checked && !ap.arrival && !ap.departure && !ap.layover) return;

    if (ap.lat && ap.lon) {
      const marker = L.marker([ap.lat, ap.lon]).addTo(map)
        .bindPopup(`${ap.name} (${ap.iata})`);
      markers.push(marker);
    }
  });

  const total = stats.arrivals + stats.departures + stats.layovers;
  totalsSpan.textContent = `Total: ${total} | Arrivals: ${stats.arrivals} | Departures: ${stats.departures} | Layovers: ${stats.layovers}`;
  createMapIfNeeded();
}

function displayUserSummary(manifest) {
  userSummaryTableBody.innerHTML = "";

  Object.entries(manifest).forEach(([user, counts]) => {
    const userLink = document.createElement("a");
    userLink.href = `user.html?user=${encodeURIComponent(user)}`;
    userLink.textContent = user;
    userLink.className = "user-link";

    const total = counts.arrivals + counts.departures + counts.layovers;
    const row = [
      userLink,
      total,
      counts.arrivals,
      counts.departures,
      counts.layovers
    ];
    addRow(userSummaryTableBody, row);
  });
}

// Simple table sorter
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

      // Update direction classes
      header.parentNode.querySelectorAll("th").forEach(th => {
        th.classList.remove("asc", "desc");
      });
      header.classList.add(ascending ? "asc" : "desc");

      rows.forEach(row => tbody.appendChild(row));
    });
  });
}

// Event listeners
userSelect.addEventListener("change", () => {
  const selected = userSelect.value;
  window.location.href = `user.html?user=${encodeURIComponent(selected)}`;
});

showAllCheckbox.addEventListener("change", () => {
  if (selectedUser) {
    fetchUserData(selectedUser).then(displayUserAirports);
  }
});

// Initialize
loadData();
enableTableSorting();
