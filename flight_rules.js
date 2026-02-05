// =====================================================
// FLIGHT RULES (ONLY) — routes CZL <-> DEST for all EXCEPT JED/MED
// =====================================================
window.FLIGHT_RULES = {

  // 🇫🇷 FRANCE — (CDG / ORY / MRS / LIL / MLH / ETZ)

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

  "1426": { // MRS - Marseille
    cells: { C51: "CZL", D51: "MRS", C52: "MRS", D52: "CZL" },
    flightTime: { hours: 1, minutes: 30 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 1, minutes: 30 },
    addReturn: true,
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


  // 🇹🇷 TURKEY — (IST)

  "3022": { // IST - Istanbul
    cells: { C51: "CZL", D51: "IST", C52: "IST", D52: "CZL" },
    flightTime: { hours: 3, minutes: 30 },
    layoverTime: { hours: 1, minutes: 10 },
    returnFlightTime: { hours: 3, minutes: 0 },
    addReturn: true,
  },


  // 🇸🇦 SAUDI ARABIA — (JED / MED)  ❌ NO RETURN FLIGHTS
  // Keep them one-way. (Outbound only: CZL -> JED/MED)

  "468": { // JED - Jeddah
    cells: { C51: "CZL", D51: "JED" }, // no row 52 writes
    flightTime: { hours: 5, minutes: 20 },
    addReturn: false,
  },

  "326": { // MED - Madinah
    cells: { C51: "CZL", D51: "MED" }, // no row 52 writes
    flightTime: { hours: 4, minutes: 30 },
    addReturn: false,
  },

};
