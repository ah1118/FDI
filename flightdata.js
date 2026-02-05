/* =====================================================
   flightdata.js  (FULL UPDATED)
   Owns EVERYTHING in rows 51-54 (A:G):
   - Clears first
   - Writes Date/ETD/STA/Flight
   - Supports:
       ✅ normal round-trip rules
       ✅ one-way rules (addReturn=false)
       ✅ multi-leg rules (type:"multi_leg") with days + aliases
       ✅ flightRuleKey override + dayKey from app.js
   - ✅ FIXED: Return date correct even when outbound STA is next day
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

  // accepts "HH:MM" and also ignores any "+N" suffix safely
  const m = s.match(/^(\d{1,2})\s*:\s*(\d{1,2})(?::\d{2})?(?:\+\d+)?$/);
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

// "02:10+1" -> { hhmm:"02:10", plusDays:1 }
function splitTimePlusDays(t) {
  const s = String(t || "").trim();
  if (!s) return { hhmm: "", plusDays: 0 };
  const m = s.match(/^(\d{1,2}:\d{2})(?:\+(\d+))?$/);
  if (!m) return { hhmm: s, plusDays: 0 };
  return { hhmm: m[1], plusDays: Number(m[2] || 0) };
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
// RULE PICKER (fallback by legs) + MULTI-LEG SUPPORT
// =====================================================
function norm3(x) {
  return String(x || "").trim().toUpperCase();
}

function resolveDayPattern(rule, dayKey) {
  if (!rule || rule.type !== "multi_leg") return null;

  const days = rule.days || {};
  if (!Object.keys(days).length) return null;

  let pat = days[dayKey] ?? null;

  const seen = new Set();
  while (typeof pat === "string" && pat) {
    if (seen.has(pat)) break;
    seen.add(pat);
    pat = days[pat] ?? null;
  }

  if (!pat) {
    pat = days.DEFAULT ?? null;
    while (typeof pat === "string" && pat) pat = days[pat] ?? null;
  }

  if (!pat) {
    const firstKey = Object.keys(days).find((k) => typeof days[k] === "object");
    pat = firstKey ? days[firstKey] : null;
  }

  return pat && typeof pat === "object" ? pat : null;
}

function findRuleByLegs(rules, from, to, dayKey) {
  const FROM = norm3(from);
  const TO = norm3(to);
  if (!FROM || !TO) return null;

  for (const r of Object.values(rules || {})) {
    if (!r) continue;

    if (r.type !== "multi_leg") {
      const c51 = norm3(r?.cells?.C51);
      const d51 = norm3(r?.cells?.D51);
      if (c51 === FROM && d51 === TO) return r;
      continue;
    }

    const pat = resolveDayPattern(r, dayKey);
    const c51 = norm3(pat?.cells?.C51);
    const d51 = norm3(pat?.cells?.D51);
    if (c51 === FROM && d51 === TO) return r;
  }

  return null;
}

// =====================================================
// MULTI-LEG WRITER (rows 51-54)
// =====================================================
async function applyMultiLeg(rule, payload, dayKey) {
  const pdfDateStr = (payload?.pdfDate ?? "").toString().trim();
  const baseDateUtc = parseDDMonYYYY(pdfDateStr) || null;

  const pat = resolveDayPattern(rule, dayKey);
  if (!pat) return;

  const updates = {};

  updates.A51 = pdfDateStr || "";
  updates.B51 = pdfDateStr || "";
  updates.G51 = String(payload?.flight ?? "").trim();

  if (pat.cells) {
    for (const [k, v] of Object.entries(pat.cells)) updates[k] = v;
  }

  const legs = Array.isArray(pat.legs) ? pat.legs : [];

  let dayOffset = 0;
  let prevDepMin = null;

  for (let i = 0; i < legs.length && i < 4; i++) {
    const row = 51 + i;
    const leg = legs[i] || {};

    const depSplit = splitTimePlusDays(leg.dep);
    const arrSplit = splitTimePlusDays(leg.arr);

    const depMin = parseTimeToMinutes(depSplit.hhmm);
    const arrMin = parseTimeToMinutes(arrSplit.hhmm);

    if (prevDepMin != null && depMin != null && depMin < prevDepMin) dayOffset += 1;

    if (depSplit.plusDays > dayOffset) dayOffset = depSplit.plusDays;
    if (arrSplit.plusDays > dayOffset) dayOffset = arrSplit.plusDays;

    if (depMin != null && arrMin != null && arrMin < depMin && arrSplit.plusDays === 0) {
      dayOffset += 1;
    }

    if (baseDateUtc) {
      const d = addDaysUTC(baseDateUtc, dayOffset);
      const ds = formatDDMonYYYY(d);
      updates[`A${row}`] = ds;
      updates[`B${row}`] = ds;
    }

    if (depSplit.hhmm) updates[`E${row}`] = depSplit.hhmm;
    if (arrSplit.hhmm) updates[`F${row}`] = arrSplit.hhmm;
    if (leg.flight) updates[`G${row}`] = String(leg.flight);

    prevDepMin = depMin;
  }

  await writeCells(updates);
}

// =====================================================
// MAIN
// =====================================================
async function applyFlightDataRules(payload = null) {
  const flightStr = (payload?.flight ?? document.getElementById("flightNumber")?.value ?? "")
    .toString()
    .trim();

  const flightRuleKey = (payload?.flightRuleKey ?? "").toString().trim();
  const dayKey = (payload?.dayKey ?? "").toString().trim().toUpperCase();

  const pdfDateStr = (payload?.pdfDate ?? "").toString().trim();
  const etdStr = (payload?.etd ?? "").toString().trim();
  const staStr = (payload?.sta ?? "").toString().trim();

  const fromLeg = norm3(payload?.from);
  const toLeg = norm3(payload?.to);

  if (!flightStr && (!fromLeg || !toLeg)) return;

  const flightNum = Number(flightStr);
  const hasValidFlightNum = !Number.isNaN(flightNum);

  const RULES = window.FLIGHT_RULES || {};

  await clearFlightArea();

  let rule = null;
  if (flightRuleKey && RULES[flightRuleKey]) rule = RULES[flightRuleKey];
  else if (flightStr && RULES[flightStr]) rule = RULES[flightStr];
  if (!rule) rule = findRuleByLegs(RULES, fromLeg, toLeg, dayKey);

  if (rule && rule.type === "multi_leg") {
    await applyMultiLeg(rule, { ...payload, flight: flightStr }, dayKey);
    console.log("✅ Multi-leg applied:", { flight: flightStr, flightRuleKey, dayKey });
    return;
  }

  const baseUpdates = {
    A51: pdfDateStr || "",
    B51: pdfDateStr || "",
    C51: fromLeg || "",
    D51: toLeg || "",
    E51: etdStr || "",
    F51: staStr || "",
    G51: flightStr || "",
  };
  await writeCells(baseUpdates);

  const updates = {};

  if (rule) {
    const hasReturn = rule.addReturn === true;

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

    if (rule.cells) {
      for (const [k, v] of Object.entries(rule.cells)) {
        if (k === "C51" || k === "D51" || k === "C52" || k === "D52") continue;
        updates[k] = v;
      }
    }

    if (!hasReturn) {
      for (const k of Object.keys(updates)) {
        if (k.endsWith("52")) delete updates[k];
      }
    }

    // ---- TIMES ----
    let staOutboundHHMM = staStr || null;

    if (!staOutboundHHMM && rule.flightTime) {
      const etdOutbound = etdStr || (await readCell("E51"));
      staOutboundHHMM = addDuration(etdOutbound, rule.flightTime);
    }

    if (staOutboundHHMM) updates.F51 = staOutboundHHMM;

    if (hasReturn) {
      if (hasValidFlightNum) updates.G52 = String(flightNum + 1);

      let etdReturnHHMM = null;

      if (rule.layoverTime) {
        const outboundDate = parseDDMonYYYY(pdfDateStr || (await readCell("A51")));
        const etdOutboundForCalc = etdStr || (await readCell("E51"));
        const staForCalc = staOutboundHHMM ?? (await readCell("F51"));

        etdReturnHHMM = addDuration(staForCalc, rule.layoverTime);
        if (etdReturnHHMM) updates.E52 = etdReturnHHMM;

        // ✅ CORRECT DATE FIX (handles STA next-day properly)
        const etdMin = parseTimeToMinutes(etdOutboundForCalc);
        const staMin = parseTimeToMinutes(staForCalc);

        if (outboundDate && etdMin != null && staMin != null) {
          const layoverMin = durationToMinutes(rule.layoverTime);

          // arrival is next day if STA clock-time < ETD clock-time
          const arrivalDayOffset = (staMin < etdMin) ? 1 : 0;

          // absolute minutes since outbound date start
          const absStaMin = arrivalDayOffset * 1440 + staMin;
          const absReturnEtdMin = absStaMin + layoverMin;

          const returnDayOffset = Math.floor(absReturnEtdMin / 1440);
          const returnDate = addDaysUTC(outboundDate, returnDayOffset);
          const returnDateStr = formatDDMonYYYY(returnDate);

          updates.A52 = returnDateStr;
          updates.B52 = returnDateStr;
        }
      }

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
    flightRuleKey,
    dayKey,
  });
}

window.applyFlightDataRules = applyFlightDataRules;
