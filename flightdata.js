/* =====================================================
   flightdata.js  (FULL UPDATED FILE)
   ===================================================== */

// =====================================================
// FLIGHT RULES
// =====================================================
const FLIGHT_RULES = {
  "1118": {
    cells: { D51: "CDG", C52: "CDG" },
    flightTime: { hours: 2, minutes: 0 },   // 2h
    addReturn: true,                        // <-- enable return flight
  },
  "1426": {
    cells: { D51: "MRS", C52: "MRS" },
    flightTime: { hours: 1, minutes: 10 },  // 1h10
    addReturn: true,                        // <-- enable return flight
  },
};

// =====================================================
// TIME HELPERS
// =====================================================
function parseTimeToMinutes(v) {
  if (typeof v === "number" && !Number.isNaN(v)) {
    return Math.round(v * 24 * 60) % (24 * 60);
  }

  const s = String(v || "").trim();
  if (!s) return null;

  const m = s.match(/^(\d{1,2})\s*:\s*(\d{1,2})(?::\d{2})?$/);
  if (!m) return null;

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) return null;

  return hh * 60 + mm;
}

function minutesToHHMM(min) {
  const t = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function addDuration(base, add) {
  const baseMin = parseTimeToMinutes(base);
  if (baseMin == null) return null;

  const addMin = (add.hours || 0) * 60 + (add.minutes || 0);
  return minutesToHHMM(baseMin + addMin);
}

// =====================================================
// SHEETS IO
// =====================================================
async function readCell(cell) {
  const token = await getAccessToken();

  const res = await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_TITLE}!${cell}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.values?.[0]?.[0] ?? "";
}

async function writeCells(cells) {
  const token = await getAccessToken();

  const data = Object.entries(cells).map(([cell, value]) => ({
    range: `${SHEET_TITLE}!${cell}`,
    values: [[value]],
  }));

  if (!data.length) return;

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        valueInputOption: "RAW",
        data,
      }),
    }
  );
}

// =====================================================
// MAIN LOGIC
// =====================================================
async function applyFlightDataRules() {
  const flightStr = (document.getElementById("flightNumber")?.value || "").trim();
  if (!flightStr) return;

  const flightNum = Number(flightStr);
  if (Number.isNaN(flightNum)) return;

  const rule = FLIGHT_RULES[flightStr];

  // Always write main flight to G51
  const updates = {
    G51: flightStr,
  };

  // ==============================
  // APPLY RULES (1118 & 1426)
  // ==============================
  if (rule) {

    // Route cells
    if (rule.cells) {
      Object.assign(updates, rule.cells);
    }

    // ✈️ Arrival time: F51 = E51 + flight time
    if (rule.flightTime) {
      const depTime = await readCell("E51");
      const arrTime = addDuration(depTime, rule.flightTime);

      if (arrTime) updates.F51 = arrTime;
      else console.warn("⚠️ Bad E51 time:", depTime);
    }

    // 🔁 Return flight: G52 = G51 + 1
    if (rule.addReturn === true) {
      updates.G52 = String(flightNum + 1);
    }
  }

  await writeCells(updates);

  console.log("✅ Flight rules applied:", updates);
}

// expose to app.js
window.applyFlightDataRules = applyFlightDataRules;
