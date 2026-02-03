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

// Opens spreadsheet (default gid=0). Adjust gid if you want a specific tab.
function getSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`;
}

// Target blocks (A8:G20) and (H8:T20) in GridRange indexing (0-based)
const LEFT_BLOCK = {
  startRowIndex: 7,    // row 8
  endRowIndex: 20,     // row 20 exclusive
  startColumnIndex: 0, // A
  endColumnIndex: 7,   // G exclusive
};

const RIGHT_BLOCK = {
  startRowIndex: 7,     // row 8
  endRowIndex: 20,      // row 20 exclusive
  startColumnIndex: 7,  // H
  endColumnIndex: 20,   // T exclusive
};

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
// SHEET HELPERS
//--------------------------------------------
let cachedSheetId = null;

async function getSheetIdByTitle(title) {
  const token = await getAccessToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `?fields=sheets(properties(sheetId,title))`;

  const data = await fetchJSON(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const sheet = (data.sheets || []).find(
    (s) => s.properties && s.properties.title === title
  );

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

function rangesIntersect(a, b) {
  const ar1 = a.startRowIndex ?? 0;
  const ar2 = a.endRowIndex ?? Infinity;
  const ac1 = a.startColumnIndex ?? 0;
  const ac2 = a.endColumnIndex ?? Infinity;

  const br1 = b.startRowIndex ?? 0;
  const br2 = b.endRowIndex ?? Infinity;
  const bc1 = b.startColumnIndex ?? 0;
  const bc2 = b.endColumnIndex ?? Infinity;

  const rowsOverlap = ar1 < br2 && br1 < ar2;
  const colsOverlap = ac1 < bc2 && bc1 < ac2;
  return rowsOverlap && colsOverlap;
}

async function getSheetMerges(sheetId) {
  const token = await getAccessToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `?fields=sheets(properties(sheetId,title),merges)`;

  const data = await fetchJSON(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const sheet = (data.sheets || []).find((s) => s.properties?.sheetId === sheetId);
  return sheet?.merges || [];
}

//--------------------------------------------
// SMART UNMERGE (FIXES 400)
//--------------------------------------------
async function unmergeCrewAreasSmart() {
  const token = await getAccessToken();
  const sheetId = await getSheetId();

  const left = { sheetId, ...LEFT_BLOCK };
  const right = { sheetId, ...RIGHT_BLOCK };

  const merges = await getSheetMerges(sheetId);

  const mergesToUnmerge = merges.filter(
    (m) => m.sheetId === sheetId && (rangesIntersect(m, left) || rangesIntersect(m, right))
  );

  if (mergesToUnmerge.length === 0) {
    console.log("✅ No merges found in crew blocks (skip unmerge)");
    return;
  }

  const body = {
    requests: mergesToUnmerge.map((m) => ({ unmergeCells: { range: m } })),
  };

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  console.log(`✅ UNMERGE DONE: ${mergesToUnmerge.length} merged ranges cleared`);
}

//--------------------------------------------
// PDF READER
//--------------------------------------------
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

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

//--------------------------------------------
// CREW EXTRACTOR
//--------------------------------------------
function extractCrew(lines, flightNumber) {
  console.log("==== RAW LINES FOR DEBUG ====");
  console.log(lines.slice(0, 60));

  let flightIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(`\\b${flightNumber}\\b`).test(lines[i])) {
      flightIndex = i;
      break;
    }
  }

  if (flightIndex === -1) {
    console.log("❌ Flight not found");
    return { found: false, crew: [] };
  }

  console.log("✈ Found flight at line:", flightIndex);

  const crewSet = new Set();
  const roleStart = /^(CP|FO|CC|PC|FA)\b/i;

  for (let i = flightIndex + 1; i < lines.length; i++) {
    let line = (lines[i] || "").trim();

    // Stop if we hit a new flight line
    if (
      i !== flightIndex &&
      /\b\d{3,5}\b/.test(line) &&
      /[A-Z]{3}\s*-\s*[A-Z]{3}/.test(line)
    ) {
      break;
    }

    // If line begins with role + ONLY one token, try merging next line
    if (roleStart.test(line)) {
      const parts = line.split(" ").filter(Boolean);
      if (parts.length === 2) {
        const next = lines[i + 1] ? lines[i + 1].trim() : "";
        if (/^[A-Za-zÀ-ÖØ-öø-ÿ'.-]+$/.test(next)) {
          line = line + " " + next;
          i++;
        }
      }
    }

    const fullRegex = /\b(CP|FO|CC|PC|FA)\s+([A-Za-zÀ-ÖØ-öø-ÿ'.-]+\s*)+/g;
    const matches = line.match(fullRegex);
    if (matches) matches.forEach((m) => crewSet.add(m.trim()));
  }

  const crew = [...crewSet];
  console.log("==== EXTRACTED CREW CLEAN ====");
  console.log(crew);

  return { found: true, crew };
}

//--------------------------------------------
// WRITE TO SHEET
//--------------------------------------------
async function writePNTtoSheet(crew) {
  const token = await getAccessToken();
  const pnt = crew.filter((c) => c.startsWith("CP ") || c.startsWith("FO "));
  const textBlock = pnt.join("\n");

  const body = {
    valueInputOption: "RAW",
    data: [{ range: `${SHEET_TITLE}!A8`, values: [[textBlock]] }],
  };

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  console.log("✅ DONE — PNT written as ONE BLOCK in A8");
}

async function writePNCtoSheet(crew) {
  const token = await getAccessToken();
  const pnc = crew.filter(
    (c) => c.startsWith("CC ") || c.startsWith("PC ") || c.startsWith("FA ")
  );
  const textBlock = pnc.join("\n");

  const body = {
    valueInputOption: "RAW",
    data: [{ range: `${SHEET_TITLE}!H8`, values: [[textBlock]] }],
  };

  await fetchJSON(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  console.log("✅ DONE — PNC written as ONE BLOCK in H8");
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

    // Read PDF text
    const raw = await readPDF(file);

    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("==="));

    // Extract crew
    const result = extractCrew(lines, flight);

    if (!result.found) return alert("Flight not found!");
    if (result.crew.length === 0) return alert("Flight found but NO CREW!");

    // Find route line (first line containing flight number)
    let routeLine = "";
    for (let i = 0; i < lines.length; i++) {
      if (new RegExp(`\\b${flight}\\b`).test(lines[i])) {
        routeLine = lines[i];
        break;
      }
    }

    // Extract CP from route line (multi-name)
    const cpMatch = routeLine.match(
      /CP\s+([A-Za-zÀ-ÖØ-öø-ÿ'.-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'.-]+)*)(?=\s+[A-Z]|$|\d|P\s)/
    );

    if (cpMatch) {
      const cpFullName = "CP " + cpMatch[1].trim();
      console.log("✔ CP detected:", cpFullName);
      if (!result.crew.includes(cpFullName)) result.crew.unshift(cpFullName);
    } else {
      console.log("❌ No CP detected in route line");
    }

    // Debug JSON
    console.log("===== FLIGHT JSON DEBUG =====");
    console.log(JSON.stringify({ flight, route: routeLine, crew: result.crew }, null, 4));

    // Smart unmerge (fixes your 400 issue)
    await unmergeCrewAreasSmart();

    // Write blocks
    await writePNTtoSheet(result.crew);
    await writePNCtoSheet(result.crew);

    // ✅ Open the sheet AFTER writing (you accept popup blocker risk)
    window.open(getSheetUrl(), "_blank");

    alert("DONE! Crew imported.");
  } catch (err) {
    console.error("❌ PROCESS FAILED:", err);
    alert("FAILED! Check console for details.");
  }
}

// If you use a button in HTML like:
// <button onclick="processCrew()">Process</button>
// then this function is ready.
