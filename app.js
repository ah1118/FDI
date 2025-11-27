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


//--------------------------------------------
// JWT + TOKEN SYSTEM
//--------------------------------------------
function base64url(source) {
    const encoded = btoa(String.fromCharCode.apply(null, new Uint8Array(source)));
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pemKey) {
    const pem = pemKey.replace(/-----[^-]+-----/g, "").replace(/\n/g, "");
    const binaryDer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
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
        iat: now
    };

    const encHeader = base64url(new TextEncoder().encode(JSON.stringify(header)));
    const encClaim = base64url(new TextEncoder().encode(JSON.stringify(claim)));
    const toSign = encHeader + "." + encClaim;

    const privateKey = await importPrivateKey(PRIVATE_KEY);
    const signature = await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        privateKey,
        new TextEncoder().encode(toSign)
    );

    return toSign + "." + base64url(new Uint8Array(signature));
}

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
    const now = Date.now();
    if (cachedToken && now < tokenExpiry) return cachedToken;

    const jwt = await generateJWT();
    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = now + 50 * 60 * 1000;

    return cachedToken;
}


//--------------------------------------------
// PARSE PDF INTO JSON FLIGHTS
//--------------------------------------------
async function parsePdfToJson(pdfText) {
    const lines = pdfText
        .split("\n")
        .map(l => l.replace(/\s+/g, " ").trim())
        .filter(l => l.length > 0);

    const flights = [];
    let current = null;

    for (let line of lines) {

        // Flight line format:
        // Mon24Nov2025 DJG - CZL 6355 B738 7T-VKE J
        if (line.match(/^\w+\d+\w+\s+\w+\s*-\s*\w+\s+\d{3,5}\s+/)) {

            if (current) flights.push(current);

            const parts = line.split(" ");

            current = {
                date: parts[0],
                dep_arr: parts[1] + " " + parts[2] + " " + parts[3],
                flight: parts[4],
                ac_type: parts[5],
                reg: parts[6],
                tp: parts[7] || "",
                crew: []
            };

            continue;
        }

        // Crew lines
        if (line.match(/^(CP|FO|CC|PC|FA)\b/i)) {
            if (current) current.crew.push(line);
            continue;
        }
    }

    if (current) flights.push(current);

    return flights;
}


//--------------------------------------------
// WRITE CREW TO GOOGLE SHEET
//--------------------------------------------
async function writeCrewToSheet(crew) {
    const token = await getAccessToken();

    const cpfo = crew.filter(c => c.startsWith("CP ") || c.startsWith("FO "));
    const others = crew.filter(c =>
        c.startsWith("CC ") || c.startsWith("PC ") || c.startsWith("FA ")
    );

    const body = {
        valueInputOption: "RAW",
        data: [
            {
                range: "Sheet1!A8",
                values: cpfo.map(c => [c])
            },
            {
                range: "Sheet1!H9",
                values: others.map(c => [c])
            }
        ]
    };

    await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }
    );
}


//--------------------------------------------
// MAIN PROCESSOR (UPLOAD PDF + FIND FLIGHT + WRITE CREW)
//--------------------------------------------
async function processCrew() {
    const flightNum = document.getElementById("flightNumber").value.trim();
    if (!flightNum) return alert("Enter flight number");

    const file = document.getElementById("pdfFile").files[0];
    if (!file) return alert("Upload a PDF");

    alert("Reading PDF…");

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async () => {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(reader.result) }).promise;

        let text = "";
        for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            text += content.items.map(i => i.str).join(" ") + "\n";
        }

        const flights = await parsePdfToJson(text);

        const chosen = flights.find(f => f.flight === flightNum);
        if (!chosen) return alert("Flight not found inside PDF");

        if (chosen.crew.length === 0) return alert("Crew not found for this flight!");

        await writeCrewToSheet(chosen.crew);

        alert("DONE! Crew imported.");
    };
}
