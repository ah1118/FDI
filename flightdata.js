/* =====================================================
   flightdata.js  (FULL UPDATED FILE)

   Outbound (row 51):
     Date:  A51:B51 (merged)
     STD:   E51
     STA:   F51
     N°VOL: G51

   Return (row 52):
     Date:  A52:B52 (merged)
     STD:   E52
     STA:   F52
     N°VOL: G52

   Logic:
     F51 = E51 + flightTime
     E52 = F51 + layoverTime
     if (F51 + layover crosses midnight) return date = outbound date + 1
     F52 = E52 + returnFlightTime
   ===================================================== */

// =====================================================
// FLIGHT RULES (UPDATED: added 3022 CZL <-> IST)
// =====================================================
const FLIGHT_RULES = {
  "1118": {
    cells: { D51: "CDG", C52: "CDG" },
    flightTime: { hours: 2, minutes: 0 },        // outbound
    layoverTime: { hours: 1, minutes: 0 },       // layover
    returnFlightTime: { hours: 2, minutes: 0 },  // return
    addReturn: true,
  },
  "1426": {
    cells: { D51: "MRS", C52: "MRS" },
    flightTime: { hours: 1, minutes: 10 },        // outbound
    layoverTime: { hours: 1, minutes: 0 },        // layover
    returnFlightTime: { hours: 1, minutes: 10 },  // return
    addReturn: true,
  },

  // ✅ NEW FLIGHT
  // 3022 CZL -> IST
  // ETD 21:30, ETA 00:30 (so flight time = 3:00)
  // Return ETD 01:30, Return ETA 04:30 (flight time return = 3:00)
  // Layover = 1:00
  "3022": {
    cells: { D51: "IST", C52: "IST" },            // destination shown like your other rules
    flightTime: { hours: 3, minutes: 0 },         // 21:30 -> 00:30
    layoverTime: { hours: 1, minutes: 0 },        // 1h
    returnFlightTime: { hours: 3, minutes: 0 },   // 01:30 -> 04:30
    addReturn: true,
  },
};

// =====================================================
// TIME HELPERS
// =====================================================
function parseTimeToMinutes(v) {
  // Google Sheets can return time as a number (fraction of day)
  if (typeof v === "number" && !Number.isNaN(v)) {
    return Math.round(v * 24 * 60) % (24 * 60);
  }

  const s = String(v || "").trim();
  if (!s) return null;

  // "8:05", "08:05", "08:05:00", "08 : 05"
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
// DATE HELPERS  (format in your sheet: "02Feb2026")
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
  // validate (avoid 31Feb etc.)
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
  const updates = { G51: flightStr };

  if (rule) {
    // Route cells
    if (rule.cells) Object.assign(updates, rule.cells);

    // -----------------------------
    // 1) OUTBOUND STA: F51 = E51 + flightTime
    // -----------------------------
    let staOutboundHHMM = null;
    let staOutboundMin = null;

    if (rule.flightTime) {
      const etdOutbound = await readCell("E51");
      staOutboundHHMM = addDuration(etdOutbound, rule.flightTime);

      if (staOutboundHHMM) {
        updates.F51 = staOutboundHHMM;
        staOutboundMin = parseTimeToMinutes(staOutboundHHMM);
      } else {
        console.warn("⚠️ Could not parse E51 time. Current:", etdOutbound);
      }
    }

    // -----------------------------
    // 2) RETURN FLIGHT NUMBER: G52 = G51 + 1
    // -----------------------------
    if (rule.addReturn === true) {
      updates.G52 = String(flightNum + 1);
    }

    // -----------------------------
    // 3) RETURN ETD: E52 = F51 + layoverTime
    //    + Return Date in merged A52:B52 (if midnight crossed => +1 day)
    // -----------------------------
    let etdReturnHHMM = null;

    if (rule.layoverTime) {
      // If STA outbound not computed above, read it
      if (staOutboundMin == null) {
        const staFromSheet = await readCell("F51");
        staOutboundMin = parseTimeToMinutes(staFromSheet);
      }

      // compute E52 from STA outbound
      const staStr = staOutboundHHMM ?? (await readCell("F51"));
      etdReturnHHMM = addDuration(staStr, rule.layoverTime);

      if (etdReturnHHMM) updates.E52 = etdReturnHHMM;
      else console.warn("⚠️ Could not parse STA outbound (F51). Current:", staStr);

      // ---- midnight check + return date update
      // if (STA minutes + layover minutes >= 1440) => crossed midnight
      if (staOutboundMin != null) {
        const crossesMidnight = (staOutboundMin + durationToMinutes(rule.layoverTime)) >= 1440;

        // Outbound date is in merged A51:B51 (top-left A51 usually holds value)
        const outboundDateStr = (await readCell("A51")) || (await readCell("B51"));
        const outboundDate = parseDDMonYYYY(outboundDateStr);

        if (outboundDate) {
          const returnDate = crossesMidnight ? addDaysUTC(outboundDate, 1) : outboundDate;
          const returnDateStr = formatDDMonYYYY(returnDate);

          // merged A52:B52 -> write same value to both to be safe
          updates.A52 = returnDateStr;
          updates.B52 = returnDateStr;
        } else {
          console.warn("⚠️ Could not parse outbound date (A51/B51). Current:", outboundDateStr);
        }
      }
    }

    // -----------------------------
    // 4) RETURN STA: F52 = E52 + returnFlightTime
    // -----------------------------
    if (rule.returnFlightTime) {
      const etd = etdReturnHHMM ?? (await readCell("E52"));
      const staReturn = addDuration(etd, rule.returnFlightTime);

      if (staReturn) updates.F52 = staReturn;
      else console.warn("⚠️ Could not parse ETD return (E52). Current:", etd);
    }
  }

  await writeCells(updates);
  console.log("✅ Flight rules applied:", updates);
}

// expose to app.js
window.applyFlightDataRules = applyFlightDataRules;
