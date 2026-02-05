// =====================================================
// FLIGHT RULES (ONLY)
// =====================================================
window.FLIGHT_RULES = {

  // 🇫🇷 FRANCE — (CDG / ORY / MRS / LIL / MLH / ETZ)

  "1118": { // CDG - Paris Charles de Gaulle
    cells: { D51: "CDG", C52: "CDG" },
    flightTime: { hours: 2, minutes: 20 },
    layoverTime: { hours: 1, minutes: 5 },
    returnFlightTime: { hours: 2, minutes: 15 },
    addReturn: true,
  },

  "1122": { // ORY - Paris Orly
    cells: { D51: "ORY", C52: "ORY" },
    flightTime: { hours: 2, minutes: 20 },
    layoverTime: { hours: 1, minutes: 10 },
    returnFlightTime: { hours: 2, minutes: 15 },
    addReturn: true,
  },

  "1426": { // MRS - Marseille
    cells: { D51: "MRS", C52: "MRS" },
    flightTime: { hours: 1, minutes: 30 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 1, minutes: 30 },
    addReturn: true,
  },

  "1170": { // MLH - Mulhouse
    cells: { D51: "MLH", C52: "MLH" },
    flightTime: { hours: 2, minutes: 5 },
    layoverTime: { hours: 1, minutes: 5 },
    returnFlightTime: { hours: 2, minutes: 20 },
    addReturn: true,
  },

  "1174": { // ETZ - Metz/Nancy
    cells: { D51: "ETZ", C52: "ETZ" },
    flightTime: { hours: 2, minutes: 20 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 2, minutes: 15 },
    addReturn: true,
  },

  "1180": { // LIL - Lille
    cells: { D51: "LIL", C52: "LIL" },
    flightTime: { hours: 2, minutes: 40 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 2, minutes: 35 },
    addReturn: true,
  },


  // 🇹🇷 TURKEY — (IST)

  "3022": { // IST - Istanbul
    cells: { D51: "IST", C52: "IST" },
    flightTime: { hours: 3, minutes: 30 },
    layoverTime: { hours: 1, minutes: 10 },
    returnFlightTime: { hours: 3, minutes: 0 },
    addReturn: true,
  },


  // 🇸🇦 SAUDI ARABIA — (JED / MED)  ❌ NO RETURN FLIGHTS

  "468": { // JED - Jeddah
    cells: { D51: "JED", C52: "JED" },
    flightTime: { hours: 5, minutes: 20 },
    addReturn: false,
  },

  "326": { // MED - Madinah
    cells: { D51: "MED", C52: "MED" },
    flightTime: { hours: 4, minutes: 30 }, // 12:10 → 16:40
    addReturn: false,
  },

};
