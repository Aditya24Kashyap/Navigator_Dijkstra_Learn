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

// METRO GRAPH DATA (REAL STRUCTURE)
const metroGraph = {
  // RED LINE
  "Rithala": [
    { station: "Netaji Subhash Place", line: "Red", time: 4 }
  ],
  "Netaji Subhash Place": [
    { station: "Rithala", line: "Red", time: 4 },
    { station: "Kashmere Gate", line: "Red", time: 10 }
  ],
  "Kashmere Gate": [
    { station: "Netaji Subhash Place", line: "Red", time: 10 },
    { station: "Chandni Chowk", line: "Yellow", time: 2 },
    { station: "Mandi House", line: "Violet", time: 6 }
  ],

  // YELLOW LINE
  "Samaypur Badli": [
    { station: "Chandni Chowk", line: "Yellow", time: 15 }
  ],
  "Chandni Chowk": [
    { station: "Samaypur Badli", line: "Yellow", time: 15 },
    { station: "Kashmere Gate", line: "Yellow", time: 2 },
    { station: "Rajiv Chowk", line: "Yellow", time: 3 }
  ],
  "Rajiv Chowk": [
    { station: "Chandni Chowk", line: "Yellow", time: 3 },
    { station: "Janakpuri West", line: "Blue", time: 14 }
  ],

  // BLUE LINE
  "Janakpuri West": [
    { station: "Rajiv Chowk", line: "Blue", time: 14 }
  ],

  // VIOLET LINE
  "Mandi House": [
    { station: "Kashmere Gate", line: "Violet", time: 6 }
  ]
};

// POPULATE DROPDOWNS
const fromSelect = document.getElementById("fromStation");
const toSelect = document.getElementById("toStation");

Object.keys(metroGraph).forEach(station => {
  fromSelect.innerHTML += `<option value="${station}">${station}</option>`;
  toSelect.innerHTML += `<option value="${station}">${station}</option>`;
});

// DIJKSTRA ALGORITHM (CORE ENGINE)
function dijkstra(start, end) {
  const distances = {};
  const previous = {};
  const visited = new Set();

  for (let station in metroGraph) {
    distances[station] = Infinity;
  }
  distances[start] = 0;

  while (true) {
    let closest = null;

    for (let station in distances) {
      if (!visited.has(station) &&
          (closest === null || distances[station] < distances[closest])) {
        closest = station;
      }
    }

    if (closest === null) break;
    if (closest === end) break;

    visited.add(closest);

    for (let neighbor of metroGraph[closest]) {
      const newDist = distances[closest] + neighbor.time;

      if (newDist < distances[neighbor.station]) {
        distances[neighbor.station] = newDist;
        previous[neighbor.station] = {
          station: closest,
          line: neighbor.line
        };
      }
    }
  }

  // build path
  const path = [];
  let current = end;

  while (current) {
    path.unshift(current);
    current = previous[current]?.station;
  }

  return {
    path,
    previous,
    time: distances[end]
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
    // 💰 Fare: ₹${calculateFare(data.time)}
    💰 Fare: ₹${calculateFareByStations(data.path.length)}

  `;
}

// FARE CALCULATION (SIMPLE)
// Time based fare calculation
// function calculateFare(time) {
//   if (time <= 10) return 20;
//   if (time <= 20) return 30;
//   if (time <= 30) return 40;
//   return 50;
// }

// Station based fare calculation
function calculateFareByStations(stationCount) {
  if (stationCount <= 5) return 20;
  if (stationCount <= 10) return 30;
  if (stationCount <= 20) return 40;
  return 50;
}


// SEARCH BUTTON (NO BUGS)
// document.getElementById("searchBtn").addEventListener("click", () => {
//   const from = fromSelect.value;
//   const to = toSelect.value;

//   if (!from || !to || from === to) return;

//   const resultData = dijkstra(from, to);
//   displayRoute(resultData);

//   if (!resultData.path || resultData.path.length === 1) {
//   result.innerHTML = "❌ No route found";
//   return;
//   }
// });

document.getElementById("searchBtn").addEventListener("click", () => {
  const from = fromSelect.value;
  const to = toSelect.value;
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



result.innerHTML += `<div class="station interchange">🔁 ${station}</div>`;

// document.getElementById("blueLine").style.opacity = "1";
