/* =====================================================
   flightdata.js
   Owns EVERYTHING in rows 51-54 (A:G):
   - Clears first
   - Writes Date/ETD/STA/Flight
   - Writes LEGS:
       Outbound: C51(from) D51(to)
       Return:   C52(from) D52(to)  (only if addReturn=true)
   - Rule lookup:
       1) by flight number
       2) fallback by legs (from/to) because flight number can change
   - If addReturn=false: NEVER writes anything in row 52
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

  const monIndex = MONTHS.findIndex((x) => x.toLowerCase() === monStr.toLowerCase());
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
// RULE PICKER (fallback by legs)
// =====================================================
function norm3(x) {
  return String(x || "").trim().toUpperCase();
}

// Find a rule whose outbound legs match payload.from/payload.to
function findRuleByLegs(rules, from, to) {
  const FROM = norm3(from);
  const TO = norm3(to);
  if (!FROM || !TO) return null;

  for (const r of Object.values(rules || {})) {
    const c51 = norm3(r?.cells?.C51);
    const d51 = norm3(r?.cells?.D51);
    if (c51 === FROM && d51 === TO) return r;
  }
  return null;
}

// =====================================================
// MAIN: One function that owns rows 51-54
// Call it from app.js like:
// applyFlightDataRules({ flight, pdfDate, etd, sta, from, to })
// =====================================================
async function applyFlightDataRules(payload = null) {
  const flightStr = (payload?.flight ?? document.getElementById("flightNumber")?.value ?? "")
    .toString()
    .trim();

  const pdfDateStr = (payload?.pdfDate ?? "").toString().trim(); // "02Feb2026"
  const etdStr = (payload?.etd ?? "").toString().trim();         // "HH:MM"
  const staStr = (payload?.sta ?? "").toString().trim();         // "HH:MM"

  // legs from PDF (preferred)
  const fromLeg = norm3(payload?.from);
  const toLeg = norm3(payload?.to);

  if (!flightStr && (!fromLeg || !toLeg)) return;

  const flightNum = Number(flightStr);
  const hasValidFlightNum = !Number.isNaN(flightNum);

  // ✅ STEP 1: CLEAR ALWAYS
  await clearFlightArea();

  // ✅ STEP 2: WRITE BASE VALUES (date + legs + etd + sta + flight)
  const baseUpdates = {
    A51: pdfDateStr || "",
    B51: pdfDateStr || "",
    C51: fromLeg || "",
    D51: toLeg || "",
    E51: etdStr || "",
    F51: staStr || "",   // ✅ STA from PDF goes here
    G51: flightStr || "",
  };
  await writeCells(baseUpdates);

  // ✅ STEP 3: CHOOSE RULE
  const RULES = window.FLIGHT_RULES || {};
  let rule = flightStr ? RULES[flightStr] : null;

  // fallback by legs if flight number changed
  if (!rule) rule = findRuleByLegs(RULES, fromLeg, toLeg);

  const updates = {}; // only additional updates from rules

  if (rule) {
    const hasReturn = rule.addReturn === true;

    // =========================
    // LEGS (write outbound/return)
    // =========================
    const ruleC51 = norm3(rule?.cells?.C51);
    const ruleD51 = norm3(rule?.cells?.D51);

    const OUT_FROM = fromLeg || ruleC51 || "";
    const OUT_TO   = toLeg   || ruleD51 || "";

    if (OUT_FROM) updates.C51 = OUT_FROM;
    if (OUT_TO)   updates.D51 = OUT_TO;

    if (hasReturn) {
      if (OUT_TO)   updates.C52 = OUT_TO;
      if (OUT_FROM) updates.D52 = OUT_FROM;
    }

    // copy remaining cells except C51/D51/C52/D52 (we control those)
    if (rule.cells) {
      for (const [k, v] of Object.entries(rule.cells)) {
        if (k === "C51" || k === "D51" || k === "C52" || k === "D52") continue;
        updates[k] = v;
      }
    }

    // ✅ If no return: NEVER write anything in row 52
    if (!hasReturn) {
      for (const k of Object.keys(updates)) {
        if (k.endsWith("52")) delete updates[k];
      }
    }

    // =========================
    // TIMES
    // =========================

    // 1) F51 = STA (from PDF) OR computed from E51 + flightTime
    let staOutboundHHMM = staStr || null;
    let staOutboundMin = null;

    if (!staOutboundHHMM && rule.flightTime) {
      const etdOutbound = etdStr || (await readCell("E51"));
      staOutboundHHMM = addDuration(etdOutbound, rule.flightTime);
    }

    if (staOutboundHHMM) {
      updates.F51 = staOutboundHHMM; // ✅ always set F51 (PDF or computed)
      staOutboundMin = parseTimeToMinutes(staOutboundHHMM);
    }

    // ✅ Return calculations ONLY if hasReturn
    if (hasReturn) {
      // 2) G52 = G51 + 1 (only if flight number valid)
      if (hasValidFlightNum) {
        updates.G52 = String(flightNum + 1);
      }

      // 3) E52 = F51 + layoverTime + return date (A52/B52)
      let etdReturnHHMM = null;

      if (rule.layoverTime) {
        if (staOutboundMin == null) {
          const staFromSheet = staOutboundHHMM ?? (await readCell("F51"));
          staOutboundMin = parseTimeToMinutes(staFromSheet);
        }

        const staForCalc = staOutboundHHMM ?? (await readCell("F51"));
        etdReturnHHMM = addDuration(staForCalc, rule.layoverTime);
        if (etdReturnHHMM) updates.E52 = etdReturnHHMM;

        if (staOutboundMin != null) {
          const crossesMidnight = staOutboundMin + durationToMinutes(rule.layoverTime) >= 1440;

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
  }

  await writeCells(updates);
  console.log("✅ Flight area updated (A51:G54 owned by flightdata.js):", {
    ...baseUpdates,
    ...updates,
  });
}

window.applyFlightDataRules = applyFlightDataRules;
