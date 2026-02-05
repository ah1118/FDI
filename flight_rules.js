// =====================================================
// FLIGHT RULES (ONLY) — routes CZL <-> DEST for all EXCEPT one-way routes
// =====================================================
window.FLIGHT_RULES = {

  // 🇩🇿 ALGERIA — Domestic (ALG one-way, others round-trip)

  "6027": { // ALG - Algiers (one-way)
    cells: { C51: "CZL", D51: "ALG" },
    flightTime: { hours: 1, minutes: 0 },
    addReturn: false,
  },

  "6346": { // CBH - Béchar
    cells: { C51: "CZL", D51: "CBH", C52: "CBH", D52: "CZL" },
    flightTime: { hours: 1, minutes: 35 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 1, minutes: 30 },
    addReturn: true,
  },

  "6348": { // TIN - Tindouf
    cells: { C51: "CZL", D51: "TIN", C52: "TIN", D52: "CZL" },
    flightTime: { hours: 2, minutes: 55 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 2, minutes: 25 },
    addReturn: true,
  },

  "6350": { // GHA - Ghardaïa
    cells: { C51: "CZL", D51: "GHA", C52: "GHA", D52: "CZL" },
    flightTime: { hours: 1, minutes: 5 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 1, minutes: 15 },
    addReturn: true,
  },

  "6352": { // TMR - Tamanrasset
    cells: { C51: "CZL", D51: "TMR", C52: "TMR", D52: "CZL" },
    flightTime: { hours: 2, minutes: 0 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 2, minutes: 0 },
    addReturn: true,
  },

  "6354": { // DJG - Djanet
    cells: { C51: "CZL", D51: "DJG", C52: "DJG", D52: "CZL" },
    flightTime: { hours: 1, minutes: 55 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 2, minutes: 30 },
    addReturn: true,
  },

  "6386": { // AZR - Adrar
    cells: { C51: "CZL", D51: "AZR", C52: "AZR", D52: "CZL" },
    flightTime: { hours: 1, minutes: 45 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 1, minutes: 40 },
    addReturn: true,
  },

    // 🇩🇿 ALGERIA — 3 legs (GHA + INZ) — Flight 6286
  "6286": {
    type: "multi_leg",
    days: {
      SUN: {
        cells: {
          C51: "CZL", D51: "GHA",
          C52: "GHA", D52: "INZ",
          C53: "INZ", D53: "CZL",
        },
        legs: [
          { flight: "6286", from: "CZL", to: "GHA", dep: "20:10", arr: "21:15" },
          { flight: "6286", from: "GHA", to: "INZ", dep: "22:15", arr: "23:25" },
          { flight: "6286", from: "INZ", to: "CZL", dep: "00:25", arr: "02:10+1" },
        ],
      },
    },
  },

    // 🇩🇿 ALGERIA — 4 legs (OGX + TMR) — Flight 6342

  "6342": {
    type: "multi_leg",
    days: {
      SAT: {   // from screenshot: Saturday
        cells: {
          C51: "CZL", D51: "OGX",
          C52: "OGX", D52: "TMR",
          C53: "TMR", D53: "OGX",
          C54: "OGX", D54: "CZL",
        },
        legs: [
          { flight: "6342", from: "CZL", to: "OGX", dep: "14:00", arr: "15:00" },
          { flight: "6342", from: "OGX", to: "TMR", dep: "16:00", arr: "17:50" },
          { flight: "6343", from: "TMR", to: "OGX", dep: "18:50", arr: "20:30" },
          { flight: "6343", from: "OGX", to: "CZL", dep: "21:30", arr: "22:30" },
        ],
      },
    },
  },

  // 🇫🇷 FRANCE — (CDG / ORY / MRS / MLH / ETZ / LIL / LYS multi-leg)

  "1118": { // CDG - Paris Charles de Gaulle
    cells: { C51: "CZL", D51: "CDG", C52: "CDG", D52: "CZL" },
    flightTime: { hours: 2, minutes: 20 },
    layoverTime: { hours: 1, minutes: 5 },
    returnFlightTime: { hours: 2, minutes: 15 },
    addReturn: true,
  },

  "1122": { // ORY - Paris Orly
    cells: { C51: "CZL", D51: "ORY", C52: "ORY", D52: "CZL" },
    flightTime: { hours: 2, minutes: 20 },
    layoverTime: { hours: 1, minutes: 10 },
    returnFlightTime: { hours: 2, minutes: 15 },
    addReturn: true,
  },

// 🇫🇷 FRANCE — MRS - Marseille (NORMAL)
  "1426": {
    cells: { C51: "CZL", D51: "MRS", C52: "MRS", D52: "CZL" },
    flightTime: { hours: 1, minutes: 30 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 1, minutes: 30 },
    addReturn: true,
  },

  // 🇫🇷 FRANCE — MRS special MONDAY = 4 legs (override)
  "1426_MON": {
    baseFlight: "1426",
    type: "multi_leg",
    days: {
      MON: {
        cells: {
          C51: "CZL", D51: "MRS",
          C52: "MRS", D52: "BLJ",
          C53: "BLJ", D53: "MRS",
          C54: "MRS", D54: "CZL",
        },
        legs: [
          { flight: "1426", from: "CZL", to: "MRS", dep: "07:00", arr: "08:30" },
          { flight: "1107", from: "MRS", to: "BLJ", dep: "09:30", arr: "10:55" },
          { flight: "1106", from: "BLJ", to: "MRS", dep: "11:55", arr: "13:25" },
          { flight: "1427", from: "MRS", to: "CZL", dep: "14:25", arr: "15:55" },
        ],
      },
    },
  },

  "1170": { // MLH - Mulhouse
    cells: { C51: "CZL", D51: "MLH", C52: "MLH", D52: "CZL" },
    flightTime: { hours: 2, minutes: 5 },
    layoverTime: { hours: 1, minutes: 5 },
    returnFlightTime: { hours: 2, minutes: 20 },
    addReturn: true,
  },

  "1174": { // ETZ - Metz/Nancy
    cells: { C51: "CZL", D51: "ETZ", C52: "ETZ", D52: "CZL" },
    flightTime: { hours: 2, minutes: 20 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 2, minutes: 15 },
    addReturn: true,
  },

  "1180": { // LIL - Lille
    cells: { C51: "CZL", D51: "LIL", C52: "LIL", D52: "CZL" },
    flightTime: { hours: 2, minutes: 40 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 2, minutes: 35 },
    addReturn: true,
  },

  // LYS - Lyon (4 legs, changes by day)
    // LYS - Lyon (4 legs, changes by day)
  "1460": {
    type: "multi_leg",
    days: {

      // ✅ Sunday + Friday (same pattern)
      SUN: {
        cells: {
          C51: "CZL", D51: "LYS",
          C52: "LYS", D52: "BJA",
          C53: "BJA", D53: "LYS",
          C54: "LYS", D54: "CZL",
        },
        legs: [
          { flight: "1460", from: "CZL", to: "LYS", dep: "08:00", arr: "09:50" },
          { flight: "1139", from: "LYS", to: "BJA", dep: "10:50", arr: "12:35" },
          { flight: "1138", from: "BJA", to: "LYS", dep: "13:25", arr: "15:10" },
          { flight: "1461", from: "LYS", to: "CZL", dep: "16:10", arr: "18:00" },
        ],
      },

      FRI: "SUN", // 👉 Friday same as Sunday


      // ✅ Tuesday + Saturday (same pattern)
      TUE: {
        cells: {
          C51: "CZL", D51: "LYS",
          C52: "LYS", D52: "QSF",
          C53: "QSF", D53: "LYS",
          C54: "LYS", D54: "CZL",
        },
        legs: [
          { flight: "1460", from: "CZL", to: "LYS", dep: "08:00", arr: "09:50" },
          { flight: "1155", from: "LYS", to: "QSF", dep: "10:50", arr: "12:35" },
          { flight: "1154", from: "QSF", to: "LYS", dep: "13:25", arr: "15:10" },
          { flight: "1461", from: "LYS", to: "CZL", dep: "16:10", arr: "18:00" },
        ],
      },

      SAT: "TUE", // 👉 Saturday same as Tuesday
    },
  },



  // 🇸🇦 SAUDI ARABIA — one-way

  "468": { // JED - Jeddah
    cells: { C51: "CZL", D51: "JED" },
    flightTime: { hours: 5, minutes: 20 },
    addReturn: false,
  },

  "326": { // MED - Madinah
    cells: { C51: "CZL", D51: "MED" },
    flightTime: { hours: 4, minutes: 30 },
    addReturn: false,
  },


  // 🇹🇷 TURKEY

  "3022": { // IST - Istanbul
    cells: { C51: "CZL", D51: "IST", C52: "IST", D52: "CZL" },
    flightTime: { hours: 3, minutes: 30 },
    layoverTime: { hours: 1, minutes: 10 },
    returnFlightTime: { hours: 3, minutes: 0 },
    addReturn: true,
  },

};
