let metroLines = {};
let metroGraph = {};

// LOAD JSON DATA
fetch("metroLines.json")
  .then(response => response.json())
  .then(data => {
    metroLines = data;

    // build graph from line-based JSON
    buildMetroGraph();

    // connect interchange stations
    addInterchanges();

    // fill searchable dropdowns
    // populateDropdowns();

    // enable searchable dropdowns
    setupSearch("fromStation", "fromDropdown");
    setupSearch("toStation", "toDropdown");
  })
  .catch(err => {
    console.error("Failed to load metro data", err);
  });


// GRAPH BUILDER FUNCTION
function buildMetroGraph() {
  metroGraph = {};

  for (let line in metroLines) {
    const stations = metroLines[line];

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];

      if (!metroGraph[station]) {
        metroGraph[station] = [];
      }

      if (i > 0) {
        metroGraph[station].push({
          station: stations[i - 1],
          line,
          time: 3
        });
      }

      if (i < stations.length - 1) {
        metroGraph[station].push({
          station: stations[i + 1],
          line,
          time: 3
        });
      }
    }
  }
}

function setupSearch(inputId, dropdownId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  let currentIndex = -1;

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    dropdown.innerHTML = "";
    currentIndex = -1;

    if (!query) {
      dropdown.style.display = "none";
      return;
    }

    dropdown.style.display = "block";

    Object.keys(metroGraph)
      .filter(st => st.toLowerCase().includes(query))
      .slice(0, 25)
      .forEach(station => {
        const div = document.createElement("div");
        div.textContent = station;

        div.onclick = () => {
          input.value = station;
          dropdown.style.display = "none";
        };

        dropdown.appendChild(div);
      });
  });

  input.addEventListener("keydown", (e) => {
    const items = dropdown.querySelectorAll("div");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
    }

    if (e.key === "Enter" && currentIndex >= 0) {
      e.preventDefault();
      items[currentIndex].click();
      return;
    }

    items.forEach(item => item.classList.remove("active"));
    if (currentIndex >= 0) {
      items[currentIndex].classList.add("active");
      items[currentIndex].scrollIntoView({ block: "nearest" });
    }
  });

  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.style.display = "none";
    }
  });
}

function addInterchanges() {
  const stationLines = {};

  for (let line in metroLines) {
    for (let station of metroLines[line]) {
      if (!stationLines[station]) {
        stationLines[station] = [];
      }
      stationLines[station].push(line);
    }
  }

  for (let station in stationLines) {
    const lines = stationLines[station];
    if (lines.length > 1) {
      lines.forEach(lineA => {
        lines.forEach(lineB => {
          if (lineA !== lineB) {
            metroGraph[station].push({
              station: station,
              line: lineB,
              time: 2
            });
          }
        });
      });
    }
  }
}

// DROPDOWN POPULATOR (NEW)
function populateDropdowns() {
  const datalist = document.getElementById("stationsList");
  datalist.innerHTML = "";

  Object.keys(metroGraph)
    .sort()
    .forEach(station => {
      const option = document.createElement("option");
      option.value = station;
      datalist.appendChild(option);
    });
}

// LINE COLORS
const LINE_COLORS = {
  Red: "#E53935",
  Yellow: "#FBC02D",
  Blue: "#1E88E5",
  Green: "#43A047",
  Violet: "#8E24AA",
  Pink: "#EC407A",
  Magenta: "#D81B60",
  Grey: "#757575",
  Orange: "#FB8C00"
};

// POPULATE DROPDOWNS
// const from = document.getElementById("fromStation").value.trim();
// const to = document.getElementById("toStation").value.trim();

// DIJKSTRA ALGORITHM (CORE ENGINE WITH INTERCHANGE PENALTY)
function dijkstra(start, end) {
  const distances = {};
  const previous = {};
  const visited = new Set();

  const interchangePenalty = 2; // extra time when changing lines

  // STEP 1: initialize distances
  for (let station in metroGraph) {
    distances[station] = Infinity;
  }
  distances[start] = 0;

  // STEP 2: main loop
  while (true) {
    let closest = null;

    // find nearest unvisited station
    for (let station in distances) {
      if (!visited.has(station) &&
        (closest === null || distances[station] < distances[closest])) {
        closest = station;
      }
    }

    // stop conditions
    if (closest === null) break;
    if (closest === end) break;

    visited.add(closest);

    // STEP 3: relax neighbors (THIS IS WHERE YOUR CODE GOES)
    for (let neighbor of metroGraph[closest]) {

      let extraPenalty = 0;

      // apply interchange penalty if line changes
      if (
        previous[closest] &&
        previous[closest].line !== neighbor.line
      ) {
        extraPenalty = interchangePenalty;
      }

      const newDist =
        distances[closest] + neighbor.time + extraPenalty;

      // update distance if shorter path found
      if (newDist < distances[neighbor.station]) {
        distances[neighbor.station] = newDist;
        previous[neighbor.station] = {
          station: closest,
          line: neighbor.line
        };
      }
    }
  }

  if (distances[end] === Infinity) {
  return {
    path: [],
    time: Infinity,
    previous
  };
}

  // STEP 4: build final path
  const path = [];
  let curr = end;

  while (curr) {
    path.unshift(curr);
    curr = previous[curr]?.station;
  }

  return {
    path,
    time: distances[end],
    previous
  };
}

// DISPLAY ROUTE (FIXES YOUR BUG)
function displayRoute(data) {
  const result = document.getElementById("result");
  result.innerHTML = "";

  let lastLine = null;
  let interchanges = 0;

  data.path.forEach((station, index) => {
    if (index === 0) {
      result.innerHTML += `<div class="station">● ${station}</div>`;
      return;
    }

    const info = data.previous[station];

    if (lastLine && info.line !== lastLine) {
      interchanges++;
      result.innerHTML += `<div>🔁 Change to ${info.line} Line</div>`;
    }

    lastLine = info.line;

    result.innerHTML += `
      <div class="station" style="color:${LINE_COLORS[info.line]}">
        ● ${station}
      </div>
    `;
  });

  result.innerHTML += `
    <hr>
    ⏱ Time: ${data.time} min<br>
    🔁 Interchanges: ${interchanges}<br>
    💰 Fare: ₹${calculateFareByStations(data.path.length)}

  `;
}


// Station based fare calculation
function calculateFareByStations(stationCount) {
  if (stationCount <= 5) return 20;
  if (stationCount <= 10) return 30;
  if (stationCount <= 20) return 40;
  return 50;
}


document.getElementById("searchBtn").addEventListener("click", () => {
  // const from = fromSelect.value;
  // const to = toSelect.value;

  const from = document.getElementById("fromStation").value.trim();
  const to = document.getElementById("toStation").value.trim();

  const result = document.getElementById("result");

  // Validation
  if (!from || !to) {
    result.innerHTML = "⚠️ Please select both stations";
    return;
  }

  if (from === to) {
    result.innerHTML = "⚠️ Source and destination cannot be same";
    return;
  }

  // 🔄 Show loading message
  result.innerHTML = `
    <div class="loading">
      🔍 Searching best route...
    </div>
  `;

  // Fake delay (to show animation)
  setTimeout(() => {
    const resultData = dijkstra(from, to);

    if (!resultData.path || resultData.path.length === 0 || resultData.time === Infinity) {
      result.innerHTML = "❌ No route found";
      return;
    }

    displayRoute(resultData);
  }, 800); // 0.8 second delay
});

