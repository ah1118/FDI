/* =====================================================
   flightdata.js
   Owns EVERYTHING in rows 51-54 (A:G):
   - Clears first
   - Writes Date/ETD/Flight
   - Applies flight rules
   ===================================================== */

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
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh > 23 || mm > 59) return null;

  return hh * 60 + mm;
}

function minutesToHHMM(min) {
  const t = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function durationToMinutes(add) {
  return (add?.hours || 0) * 60 + (add?.minutes || 0);
}

function addDuration(base, add) {
  const baseMin = parseTimeToMinutes(base);
  if (baseMin == null) return null;
  return minutesToHHMM(baseMin + durationToMinutes(add));
}

// =====================================================
// DATE HELPERS  (format: "02Feb2026")
// =====================================================
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseDDMonYYYY(s) {
  const str = String(s || "").trim();
  const m = str.match(/^(\d{2})([A-Za-z]{3})(\d{4})$/);
  if (!m) return null;

  const dd = Number(m[1]);
  const monStr = m[2];
  const yyyy = Number(m[3]);

  const monIndex = MONTHS.findIndex(x => x.toLowerCase() === monStr.toLowerCase());
  if (monIndex < 0) return null;

  const d = new Date(Date.UTC(yyyy, monIndex, dd));
  if (d.getUTCFullYear() !== yyyy || d.getUTCMonth() !== monIndex || d.getUTCDate() !== dd) return null;

  return d;
}

function formatDDMonYYYY(dateUtc) {
  const dd = String(dateUtc.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[dateUtc.getUTCMonth()];
  const yyyy = dateUtc.getUTCFullYear();
  return `${dd}${mon}${yyyy}`;
}

function addDaysUTC(dateUtc, days) {
  const d = new Date(dateUtc.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// =====================================================
// SHEETS IO (needs getAccessToken + fetchJSON from app.js)
// =====================================================
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

async function readCell(cell) {
  const token = await getAccessToken();

  const res = await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_TITLE}!${cell}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.values?.[0]?.[0] ?? "";
}

// =====================================================
// CLEAR ROWS 51–54 (A:G)  ✅ ALWAYS FIRST
// =====================================================
async function clearFlightArea() {
  const token = await getAccessToken();

  const ranges = [
    `${SHEET_TITLE}!A51:G51`,
    `${SHEET_TITLE}!A52:G52`,
    `${SHEET_TITLE}!A53:G53`,
    `${SHEET_TITLE}!A54:G54`,
  ];

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchClear`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ranges }),
    }
  );
}

// =====================================================
// MAIN: One function that owns rows 51-54
// Call it from app.js AFTER you extracted pdfDate + etd
// =====================================================
async function applyFlightDataRules(payload = null) {
  const flightStr =
    (payload?.flight ?? document.getElementById("flightNumber")?.value ?? "").toString().trim();

  const pdfDateStr = (payload?.pdfDate ?? "").toString().trim(); // "02Feb2026"
  const etdStr = (payload?.etd ?? "").toString().trim();         // "HH:MM"

  if (!flightStr) return;
  const flightNum = Number(flightStr);
  if (Number.isNaN(flightNum)) return;

  // ✅ STEP 1: CLEAR ALWAYS
  await clearFlightArea();

  // ✅ STEP 2: WRITE BASE VALUES (date + etd + flight)
  // A51:B51 is merged, but writing both is safe
  const baseUpdates = {
    A51: pdfDateStr || "",
    B51: pdfDateStr || "",
    E51: etdStr || "",
    G51: flightStr,
  };
  await writeCells(baseUpdates);

  // ✅ STEP 3: APPLY RULES USING OUR NEW BASE VALUES
  const RULES = window.FLIGHT_RULES || {};
  const rule = RULES[flightStr];

  const updates = {}; // only additional updates from rules

  if (rule) {
    if (rule.cells) Object.assign(updates, rule.cells);

    // 1) F51 = E51 + flightTime
    let staOutboundHHMM = null;
    let staOutboundMin = null;

    if (rule.flightTime) {
      const etdOutbound = etdStr || (await readCell("E51"));
      staOutboundHHMM = addDuration(etdOutbound, rule.flightTime);

      if (staOutboundHHMM) {
        updates.F51 = staOutboundHHMM;
        staOutboundMin = parseTimeToMinutes(staOutboundHHMM);
      }
    }

    // 2) G52 = G51 + 1
    if (rule.addReturn === true) {
      updates.G52 = String(flightNum + 1);
    }

    // 3) E52 = F51 + layoverTime + return date (A52/B52)
    let etdReturnHHMM = null;

    if (rule.layoverTime) {
      if (staOutboundMin == null) {
        const staFromSheet = staOutboundHHMM ?? (await readCell("F51"));
        staOutboundMin = parseTimeToMinutes(staFromSheet);
      }

      const staStr = staOutboundHHMM ?? (await readCell("F51"));
      etdReturnHHMM = addDuration(staStr, rule.layoverTime);
      if (etdReturnHHMM) updates.E52 = etdReturnHHMM;

      if (staOutboundMin != null) {
        const crossesMidnight =
          (staOutboundMin + durationToMinutes(rule.layoverTime)) >= 1440;

        const outboundDate = parseDDMonYYYY(pdfDateStr || (await readCell("A51")));
        if (outboundDate) {
          const returnDate = crossesMidnight ? addDaysUTC(outboundDate, 1) : outboundDate;
          const returnDateStr = formatDDMonYYYY(returnDate);

          updates.A52 = returnDateStr;
          updates.B52 = returnDateStr;
        }
      }
    }

    // 4) F52 = E52 + returnFlightTime
    if (rule.returnFlightTime) {
      const etd = etdReturnHHMM ?? (await readCell("E52"));
      const staReturn = addDuration(etd, rule.returnFlightTime);
      if (staReturn) updates.F52 = staReturn;
    }
  }

  await writeCells(updates);
  console.log("✅ Flight area updated (A51:G54 owned by flightdata.js):", {
    ...baseUpdates,
    ...updates,
  });
}

window.applyFlightDataRules = applyFlightDataRules;
