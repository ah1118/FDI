// =====================================================
// FLIGHT RULES (UPDATED)
// 1118 => CDG + 2:00
// 1426 => MRS + 1:10
// =====================================================
const FLIGHT_RULES = {
  "1118": {
    cells: { D51: "CDG", C52: "CDG" },
    flightTime: { hours: 2, minutes: 0 }, // 2h
  },
  "1426": {
    cells: { D51: "MRS", C52: "MRS" },
    flightTime: { hours: 1, minutes: 10 }, // 1h10
  },
};

// =====================================================
// TIME HELPERS
// =====================================================
function parseTimeToMinutes(v) {
  // Google Sheets sometimes returns a number for time if you read with certain formats
  if (typeof v === "number" && !Number.isNaN(v)) {
    return Math.round(v * 24 * 60) % (24 * 60);
  }

  const s = String(v || "").trim();
  if (!s) return null;

  // accept "8:05", "08:05", "08:05:00", tolerate "08 : 05"
  const m = s.match(/^(\d{1,2})\s*:\s*(\d{1,2})(?::\d{2})?$/);
  if (!m) return null;

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh > 23 || mm > 59) return null;

  return hh * 60 + mm;
}

function minutesToHHMM(min) {
  const t = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function addDuration(base, add) {
  const baseMin = parseTimeToMinutes(base);
  if (baseMin == null) return null;

  const addMin = (add?.hours || 0) * 60 + (add?.minutes || 0);
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
  const flight = (document.getElementById("flightNumber")?.value || "").trim();
  if (!flight) return;

  const rule = FLIGHT_RULES[flight];

  // Always write flight number to G51
  const updates = { G51: flight };

  // Apply route + time only if flight is configured
  if (rule) {
    // Route cells (D51 / C52)
    if (rule.cells) Object.assign(updates, rule.cells);

    // ✅ F51 = E51 + flight duration
    if (rule.flightTime) {
      const depTime = await readCell("E51"); // departure time in E51
      const arrTime = addDuration(depTime, rule.flightTime);

      if (arrTime) updates.F51 = arrTime; // arrival time in F51
      else console.warn("⚠️ Could not parse E51 time. Current:", depTime);
    }
  }

  await writeCells(updates);
  console.log("✅ Flight rules applied:", updates);
}

// expose to app.js
window.applyFlightDataRules = applyFlightDataRules;
