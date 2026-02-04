

// =====================================================
// FLIGHT RULES
// =====================================================
const FLIGHT_RULES = {
  "1118": {
    cells: { D51: "CDG", C52: "CDG" },
    addToF51: { hours: 2, minutes: 0 },     // +2h
  },
  "1426": {
    cells: { D51: "MRS", C52: "MRS" },
    addToF51: { hours: 1, minutes: 10 },    // +1h10
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

  // accept "8:05", "08:05", "08:05:00", and tolerate spaces "08 : 05"
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
  return minutesToHHMM(baseMin + (add.hours * 60) + (add.minutes || 0));
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

  return res.values?.[0]?.[0] || "";
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
    if (rule.cells) Object.assign(updates, rule.cells);

    if (rule.addToF51) {
      const baseTime = await readCell("F51");
      const newTime = addDuration(baseTime, rule.addToF51);
      if (newTime) updates.F51 = newTime;
      else console.warn("⚠️ Could not parse F51 time. Current:", baseTime);
    }
  }

  await writeCells(updates);
  console.log("✅ Flight rules applied:", updates);
}

// expose to app.js
window.applyFlightDataRules = applyFlightDataRules;
