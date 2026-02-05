//--------------------------------------------
// SERVICE ACCOUNT
//--------------------------------------------
const SERVICE_ACCOUNT_EMAIL = "feuille@fpl2024-438115.iam.gserviceaccount.com";
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCHqRt0fHgS9lGZ
63Bra2gPZc+XFweJplQcKr/vppG0hNmWisKaBZy4Nz7gSH4LJqStLiQ8fDXSNHCr
WzVgj1LX7GUdJbEvIYDVNg4jsPWh6B0DB3w91WE9Qocl3380HOP5eE4A6G9M3Bjj
lyVjNuXfZjxG5EY+P7Mp5/DJf+TofxRCNeuMxBml5Qkr7QRNHBNs1HSKaEQ2lmtU
HTL1HbEDS/sILHWrFbLRty8T2gMikp101G1qcqN8xIzZOc5Mnb9ug1n4SqSVfV1w
EXUmcK4U+4I5iMfm/eDB03gvZkQld5dmzbzaCgzSbg8uNbfVdTIuBpIp9Iov18bP
cv9rieCXAgMBAAECggEAEvgP7o6q9t0kwDTTdYnBYAnN6E61j0dH0opzEnkEPa19
LqzSFNmntiXaGmAN6SmVnuDpUIspDBlTZHqD8QUJbJzRmgJCZMM2sa7LH618+I8t
Y1Y2xqn2sgCtR3FEEaQ1MmsNM9j3Gymu0eq5X8ag3PHS3Yd01PvGOxwDUhbv30cV
jxoGEiiF2G0gL2+YVGwP5PCKamvSxlIHhvKb8VSpce4PVS4LFjh9fFW/dAXsNW7Z
MMMHAw0VB9sQ8o5QQR3oRGGvXDt0R/IQdDe8s2X5Y502DHlh2rYC+i7XB/eGa0Ma
PvMSdJB8c2J0ap6mbBAGpXBYoFnEXXFnKi/g5CzNkQKBgQC61B250uL8zkDNB5SJ
aMlCQBo+GBIZuZXidj5dyPYfCu7bHB/XcP7BX/o+5eXz1w9NrOl1/Kqi1nhJnsmO
dA1ipek/qNlezZ3rpJ+frHqoujGhrq6E9VFLg7E7il+Tz8xnsO5S7hDDXOuRS4tR
hFV1MLI1/xqCnJqSuYkqDpd/BwKBgQC54zanTaE2vYgWHWVN9N1VRjYfLVU3IBHH
rmO6FLtnaqPepKOmmHzQokBkUfPGHvLr5Jx6Q7PW/7fREveRIc/fkRlsWK9kcXZK
uk9ZayeeJJl0efoAYSWWNdsYxpIoSI1cIuqSeLnPvcEvezBs+UH3xbkraepRy4SN
rG0chNyd8QKBgCEg3ciGmZNka18v2ennt9BUl5KtKACBxQ8sEnEE4oeso6Acw5Sr
R7E4eKJQl87+Mot+fsNaM1O+ngPH8UueToVQkCSmpyzFXxxay6c/qVxj78sQs4eG
DI1MY9AAAGSwczlryUbRSg2qW2cfMywYQCMQqHkkrCm+5TXhSm43uitfAoGAARJ4
bDqcZW5ubII65Vo2NJm1EjT2utyqfZZZ6ObZtdz9mPkmIH3cqm9lI679UvU2vXmS
FXpyfRj4fHI5j1K8mjOCDAfu6wtkfUXZ01A06EqZv/w8HuhwiQ9CdkAe87CHcDKb
W8DqgXI8vQNe4iIF6WHwkXmI6nPcDd0iu/lgNGECgYAifomiswjAl7EhlfrYDHQc
ipTMhgBjqcU7xDRAl+jKTxFLyp4/UM7awKk9GyHSlTSRKTkNbIDqECM/+/uOr4Zl
Uv1sGpXdScsAbT/0owit0dXnDElmTakKIDyJgYiFj4hFwjJ7s7DlpDR2YMgWuHvK
TRXiUFADYhLF0ornhpwUmQ==
-----END PRIVATE KEY-----`;

const SPREADSHEET_ID = "1P_u5cuyN1AQuSuspYX80IMUWAvyTt77oVA3jpy7fFLI";
const SHEET_TITLE = "Sheet1";

// Crew blocks (A8:G20) and (H8:T20) in GridRange indexing (0-based)
const LEFT_BLOCK  = { startRowIndex: 7, endRowIndex: 20, startColumnIndex: 0,  endColumnIndex: 7  };
const RIGHT_BLOCK = { startRowIndex: 7, endRowIndex: 20, startColumnIndex: 7,  endColumnIndex: 20 };

// ACFT merged cell block (top-left is D4)
const ACFT_MERGED_RANGE = `${SHEET_TITLE}!D4:N6`;
const ACFT_TOP_LEFT     = `${SHEET_TITLE}!D4`;

// DATE merged cell is A51:B51 (top-left is A51)
const DATE_MERGED_RANGE = `${SHEET_TITLE}!A51:B51`;
const DATE_TOP_LEFT     = `${SHEET_TITLE}!A51`;

// ETD target cell
const ETD_CELL = `${SHEET_TITLE}!E51`;

//--------------------------------------------
// PDF.JS SETUP
//--------------------------------------------
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

//--------------------------------------------
// Opens spreadsheet
//--------------------------------------------
function getSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`;
}

//--------------------------------------------
// TOKEN SYSTEM
//--------------------------------------------
function base64url(source) {
  const enc = btoa(String.fromCharCode.apply(null, new Uint8Array(source)));
  return enc.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pemKey) {
  const pem = pemKey.replace(/-----[^-]+-----/g, "").replace(/\n/g, "");
  const bin = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    bin,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );
}

async function generateJWT() {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const claim = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encHead = base64url(new TextEncoder().encode(JSON.stringify(header)));
  const encClaim = base64url(new TextEncoder().encode(JSON.stringify(claim)));
  const toSign = encHead + "." + encClaim;

  const key = await importPrivateKey(PRIVATE_KEY);
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(toSign)
  );

  return toSign + "." + base64url(new Uint8Array(sig));
}

let cachedToken = null;
let tokenExpiryMs = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiryMs) return cachedToken;

  const jwt = await generateJWT();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("❌ TOKEN ERROR:", data);
    throw new Error("Failed to get access token");
  }

  cachedToken = data.access_token;
  tokenExpiryMs = now + 50 * 60 * 1000;
  return cachedToken;
}

//--------------------------------------------
// HTTP UTILS
//--------------------------------------------
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error("❌ HTTP ERROR", res.status, url, data);
    throw new Error(typeof data === "string" ? data : JSON.stringify(data, null, 2));
  }

  return data;
}

//--------------------------------------------
// SHEET HELPERS (for unmerge only)
//--------------------------------------------
let cachedSheetId = null;

async function getSheetIdByTitle(title) {
  const token = await getAccessToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `?fields=sheets(properties(sheetId,title))`;

  const data = await fetchJSON(url, { headers: { Authorization: `Bearer ${token}` } });

  const sheet = (data.sheets || []).find((s) => s.properties && s.properties.title === title);
  if (!sheet) {
    throw new Error(
      `Sheet tab "${title}" not found. Existing: ` +
      (data.sheets || []).map((s) => s.properties?.title).join(", ")
    );
  }
  return sheet.properties.sheetId;
}

async function getSheetId() {
  if (cachedSheetId) return cachedSheetId;
  cachedSheetId = await getSheetIdByTitle(SHEET_TITLE);
  return cachedSheetId;
}

async function getSheetMerges(sheetId) {
  const token = await getAccessToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `?fields=sheets(properties(sheetId,title),merges)`;

  const data = await fetchJSON(url, { headers: { Authorization: `Bearer ${token}` } });
  const sheet = (data.sheets || []).find((s) => s.properties?.sheetId === sheetId);
  return sheet?.merges || [];
}

function isFullyInside(inner, outer) {
  const ir1 = inner.startRowIndex ?? 0;
  const ir2 = inner.endRowIndex ?? Infinity;
  const ic1 = inner.startColumnIndex ?? 0;
  const ic2 = inner.endColumnIndex ?? Infinity;

  const or1 = outer.startRowIndex ?? 0;
  const or2 = outer.endRowIndex ?? Infinity;
  const oc1 = outer.startColumnIndex ?? 0;
  const oc2 = outer.endColumnIndex ?? Infinity;

  return ir1 >= or1 && ir2 <= or2 && ic1 >= oc1 && ic2 <= oc2;
}

async function unmergeCrewAreasSmart() {
  const token = await getAccessToken();
  const sheetId = await getSheetId();

  const left = { sheetId, ...LEFT_BLOCK };
  const right = { sheetId, ...RIGHT_BLOCK };

  const merges = await getSheetMerges(sheetId);

  const mergesToUnmerge = merges.filter(
    (m) => m.sheetId === sheetId && (isFullyInside(m, left) || isFullyInside(m, right))
  );

  if (mergesToUnmerge.length === 0) {
    console.log("✅ No safe merges found in crew blocks (skip unmerge)");
    return;
  }

  const body = { requests: mergesToUnmerge.map((m) => ({ unmergeCells: { range: m } })) };

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  console.log(`✅ UNMERGE DONE (SAFE): ${mergesToUnmerge.length} merged ranges cleared`);
}

//--------------------------------------------
// PDF READERS
//--------------------------------------------
async function readPDF(file) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  let finalText = "";

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const lines = {};
    content.items.forEach((item) => {
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item.str);
    });

    const sortedY = Object.keys(lines).sort((a, b) => b - a);
    sortedY.forEach((y) => {
      const line = lines[y].join(" ").replace(/\s+/g, " ").trim();
      finalText += line + "\n";
    });

    finalText += "\n=== PAGE BREAK ===\n";
  }

  return finalText;
}

async function readPDFRows(file) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  const allRows = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const rowsMap = new Map();

    for (const it of content.items) {
      const str = (it.str || "").trim();
      if (!str) continue;

      const x = it.transform[4];
      const y = Math.round(it.transform[5]);

      if (!rowsMap.has(y)) rowsMap.set(y, []);
      rowsMap.get(y).push({ x, str });
    }

    const ys = Array.from(rowsMap.keys()).sort((a, b) => b - a);
    for (const y of ys) {
      const tokens = rowsMap.get(y).sort((a, b) => a.x - b.x);
      allRows.push({ page: p, y, tokens });
    }

    allRows.push({ page: p, y: null, tokens: [{ x: 0, str: "=== PAGE BREAK ===" }] });
  }

  return allRows;
}

//--------------------------------------------
// DATE PARSING
//--------------------------------------------
function formatSheetDate(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day}${months[d.getMonth()]}${d.getFullYear()}`;
}

function parseDMY(dd, mm, yyyy) {
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(d.getTime()) ? null : d;
}

function parseMonTextDate(dayStr, monStr, yearStr) {
  const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  const key = monStr.slice(0,3);
  const m = months[key[0].toUpperCase() + key.slice(1).toLowerCase()];
  if (m === undefined) return null;
  const d = new Date(Number(yearStr), m, Number(dayStr));
  return isNaN(d.getTime()) ? null : d;
}

function extractReportDate(lines) {
  const headerZone = lines.slice(0, 200).join(" ");

  let m = headerZone.match(/\b(\d{2})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(\d{4})\b/i);
  if (m) {
    const dd = m[1];
    const mon = m[2];
    const yyyy = m[3];
    const monNorm = mon[0].toUpperCase() + mon.slice(1).toLowerCase();
    return `${dd}${monNorm}${yyyy}`;
  }

  m = headerZone.match(/\bFROM\s+(\d{2})\/(\d{2})\/(\d{4})\s+to\s+(\d{2})\/(\d{2})\/(\d{4})\b/i);
  if (m) {
    const d1 = parseDMY(m[1], m[2], m[3]);
    if (d1) return formatSheetDate(d1);
  }

  m = headerZone.match(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*,?\s*(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\b/i);
  if (m) {
    const d2 = parseMonTextDate(m[1], m[2], m[3]);
    if (d2) return formatSheetDate(d2);
  }

  m = headerZone.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (m) {
    const d3 = parseDMY(m[1], m[2], m[3]);
    if (d3) return formatSheetDate(d3);
  }

  return null;
}

function parseSheetDateTextToDate(dateText) {
  const m = String(dateText || "").match(/^(\d{2})([A-Za-z]{3})(\d{4})$/);
  if (!m) return null;

  const dd = Number(m[1]);
  const mon = m[2].toLowerCase();
  const yyyy = Number(m[3]);

  const months = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  const mm = months[mon];
  if (mm === undefined) return null;

  const d = new Date(yyyy, mm, dd);
  return isNaN(d.getTime()) ? null : d;
}

function getDayKeyFromDate(d) {
  const keys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return keys[d.getDay()];
}

//--------------------------------------------
// ROUTE / TIMES / REG
//--------------------------------------------
function extractLegsFromRoute(routeLine) {
  if (!routeLine) return null;
  const m = routeLine.toUpperCase().match(/\b([A-Z]{3})\s*-\s*([A-Z]{3})\b/);
  if (!m) return null;
  return { from: m[1], to: m[2] };
}

function extractTimesFromRoute(routeLine) {
  if (!routeLine) return { etd: null, sta: null };
  const times = routeLine.match(/\b([01]\d|2[0-3]):[0-5]\d\b/g) || [];
  return { etd: times[0] ?? null, sta: times[1] ?? null };
}

function extractAcftRegFromRoute(routeLine) {
  const m = routeLine.toUpperCase().match(/\b([A-Z0-9]{2})[-\s]?([A-Z0-9]{3})\b/);
  if (!m) return null;
  return `${m[1]}-${m[2]}`;
}

function normalizeAcftReg(raw) {
  if (!raw) return "";
  const s = String(raw).toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
  if (s.length >= 5) return `${s.slice(0,2)}-${s.slice(2,5)}`;
  return raw.toUpperCase();
}

//--------------------------------------------
// WRITE CREW / ACFT
//--------------------------------------------
async function writePNTtoSheet(crew) {
  const token = await getAccessToken();
  const pnt = crew.filter((c) => c.startsWith("CP ") || c.startsWith("FO "));
  const textBlock = pnt.join("\n");

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: [{ range: `${SHEET_TITLE}!A8`, values: [[textBlock]] }],
      }),
    }
  );
}

async function writePNCtoSheet(crew) {
  const token = await getAccessToken();
  const pnc = crew.filter((c) => c.startsWith("CC ") || c.startsWith("PC ") || c.startsWith("FA "));
  const textBlock = pnc.join("\n");

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: [{ range: `${SHEET_TITLE}!H8`, values: [[textBlock]] }],
      }),
    }
  );
}

async function writeAircraftReg(acftRegRaw) {
  const token = await getAccessToken();
  const acftReg = normalizeAcftReg(acftRegRaw);

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(ACFT_MERGED_RANGE)}:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }
  );

  const template = "PREVU:123456---------------------REEL:123456";
  const dashRun = (template.match(/-+/) || [""])[0];
  const gapSpaces = " ".repeat(dashRun.length);

  const newText = template.split("123456").join(acftReg).replace(dashRun, gapSpaces);

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: [{ range: ACFT_TOP_LEFT, values: [[newText]] }],
      }),
    }
  );
}

//--------------------------------------------
// CREW EXTRACTOR (FIXED ♯/#) + STOP AT NEXT FLIGHT
//--------------------------------------------
function extractCrewFromRows(rows, flightNumber) {
  const flightRe = new RegExp(`\\b${flightNumber}\\b`);
  const ROLE_RE = /\b(CP|FO|CC|PC|FA)\b/i;
  const NOT_WORKING_MARK = /[♯#]/;

  // Flatten tokens (page,y,x,str)
  const toks = [];
  for (const r of rows) {
    if (!r || !Array.isArray(r.tokens)) continue;
    for (const t of r.tokens) {
      toks.push({ page: r.page, y: r.y, x: t.x, str: String(t.str || "").trim() });
    }
  }

  // Locate the flight occurrence
  const startTokenIdx = toks.findIndex((t) => flightRe.test(t.str));
  if (startTokenIdx === -1) return { found: false, crew: [] };
  const startPage = toks[startTokenIdx].page;

  const pageToks = toks.filter((t) => t.page === startPage && t.y != null && t.str);

  // Estimate PIC/DH symbol column X by median ♯/# positions
  const sharpXs = pageToks.filter((t) => NOT_WORKING_MARK.test(t.str)).map((t) => t.x);
  const picColX = sharpXs.length
    ? sharpXs.sort((a, b) => a - b)[Math.floor(sharpXs.length / 2)]
    : null;

  // Helper: build row text
  const rowText = (r) => r.tokens.map((t) => t.str).join(" ").replace(/\s+/g, " ").trim();

  // Find first row containing flight number on that page
  const startIdx = rows.findIndex((r) => r.page === startPage && r.tokens.some((t) => flightRe.test(t.str)));
  if (startIdx === -1) return { found: false, crew: [] };

  // If no ♯ exists on the page, just extract crew normally (no filtering possible)
  if (picColX == null) {
    const crewSet = new Set();

    for (let i = startIdx; i < rows.length; i++) {
      const r = rows[i];
      if (r.page !== startPage) break;

      const text = rowText(r);

      // stop on next flight block
      if (i !== startIdx && /\b\d{3,5}\b/.test(text) && /[A-Z]{3}\s*-\s*[A-Z]{3}/.test(text)) break;

      if (!ROLE_RE.test(text)) continue;

      const fullRegex =
        /\b(CP|FO|CC|PC|FA)\s+([A-Za-zÀ-ÖØ-öø-ÿ'.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'.-]+)*)/g;

      let m;
      while ((m = fullRegex.exec(text)) !== null) {
        crewSet.add(`${m[1].toUpperCase()} ${m[2].trim()}`);
      }
    }

    return { found: true, crew: [...crewSet] };
  }

  // Tolerances (robust PDFs)
  const Y_TOL = 4;
  const X_TOL = 50;

  function hasSharpNearY(y) {
    return pageToks.some((t) =>
      NOT_WORKING_MARK.test(t.str) &&
      Math.abs(t.y - y) <= Y_TOL &&
      Math.abs(t.x - picColX) <= X_TOL
    );
  }

  const crewSet = new Set();

  for (let i = startIdx; i < rows.length; i++) {
    const r = rows[i];
    if (r.page !== startPage) break;
    if (r.y == null) continue;

    const text = rowText(r);

    // ✅ stop on next flight block (super important)
    if (i !== startIdx && /\b\d{3,5}\b/.test(text) && /[A-Z]{3}\s*-\s*[A-Z]{3}/.test(text)) break;

    if (!ROLE_RE.test(text)) continue;

    // ✅ Skip row if ♯/# is aligned in PIC/DH column
    if (hasSharpNearY(r.y)) continue;

    const fullRegex =
      /\b(CP|FO|CC|PC|FA)\s+([A-Za-zÀ-ÖØ-öø-ÿ'.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'.-]+)*)/g;

    let m;
    while ((m = fullRegex.exec(text)) !== null) {
      crewSet.add(`${m[1].toUpperCase()} ${m[2].trim()}`);
    }
  }

  return { found: true, crew: [...crewSet] };
}

//--------------------------------------------
// MAIN
//--------------------------------------------
async function processCrew() {
  try {
    const flight = document.getElementById("flightNumber").value.trim();
    if (!flight) return alert("Enter flight number");

    const file = document.getElementById("pdfFile").files[0];
    if (!file) return alert("Upload a PDF");

    // Text read (header/date + route line)
    const raw = await readPDF(file);
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("==="));

    const pdfDate = extractReportDate(lines);
    if (!pdfDate) return alert("PDF report date not found in header!");
    console.log("📅 PDF date detected:", pdfDate);

    const pdfDateObj = parseSheetDateTextToDate(pdfDate);
    if (!pdfDateObj) return alert("Cannot parse pdfDate (expected like 02Feb2026)");
    const dayKey = getDayKeyFromDate(pdfDateObj);
    console.log("🗓 Day key:", dayKey);

    // Row read (crew extraction + ♯/# filtering)
    const rows = await readPDFRows(file);
    const result = extractCrewFromRows(rows, flight);
    if (!result.found) return alert("Flight not found!");
    if (result.crew.length === 0) return alert("Flight found but NO WORKING CREW (♯ removed)!");

    // Route line (first line with flight)
    let routeLine = "";
    for (let i = 0; i < lines.length; i++) {
      if (new RegExp(`\\b${flight}\\b`).test(lines[i])) {
        routeLine = lines[i];
        break;
      }
    }
    if (!routeLine) return alert("Route line not found in PDF!");

    const legs = extractLegsFromRoute(routeLine);
    if (!legs) return alert("Route legs not found (ex: CZL - ALG)!");
    console.log("🧭 LEGS detected:", legs.from, "->", legs.to);

    const { etd, sta } = extractTimesFromRoute(routeLine);
    if (!etd) return alert("ETD not found in route line!");
    if (!sta) console.warn("⚠ STA not found (F51 may stay empty)");
    console.log("🕒 ETD:", etd, "| 🛬 STA:", sta);

    const reg = extractAcftRegFromRoute(routeLine);
    if (!reg) return alert("Aircraft registration not found in route line!");
    console.log("✈ ACFT REG detected:", reg);

    // Ensure CP from route line is included (only if it is NOT filtered out by ♯ row)
    const cpMatch = routeLine.match(
      /CP\s+([A-Za-zÀ-ÖØ-öø-ÿ'.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'.-]+)*)(?=\s+[A-Z]|$|\d|P\s)/
    );
    if (cpMatch) {
      const cpFullName = "CP " + cpMatch[1].trim();
      if (!result.crew.includes(cpFullName)) result.crew.unshift(cpFullName);
    }

    const flightRuleKey = (flight === "1426" && dayKey === "MON") ? "1426_MON" : flight;

    console.log("===== FLIGHT JSON DEBUG =====");
    console.log(JSON.stringify({
      flight,
      flightRuleKey,
      dayKey,
      route: routeLine,
      legs,
      acftReg: reg,
      etd,
      sta,
      pdfDate,
      crew: result.crew,
    }, null, 2));

    await unmergeCrewAreasSmart();
    await writePNTtoSheet(result.crew);
    await writePNCtoSheet(result.crew);
    await writeAircraftReg(reg);

    // flightdata.js owns rows 51–54
    await window.applyFlightDataRules({
      flight,
      flightRuleKey,
      dayKey,
      pdfDate,
      etd,
      sta,
      from: legs.from,
      to: legs.to,
    });

    window.open(getSheetUrl(), "_blank");
    alert(`DONE! DATE: ${pdfDate} | DAY: ${dayKey} | ACFT: ${normalizeAcftReg(reg)} | ETD: ${etd} | STA: ${sta || "??"} | ROUTE: ${legs.from}-${legs.to}`);
  } catch (err) {
    console.error("❌ PROCESS FAILED:", err);
    alert("FAILED! Check console for details.");
  }
}

// expose
window.processCrew = processCrew;


