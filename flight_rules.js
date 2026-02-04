// =====================================================
// FLIGHT RULES (ONLY)
// =====================================================
window.FLIGHT_RULES = {
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

  // 3022 CZL -> IST
  // ETD 21:30, ETA 00:30 => flight time 3:00
  // Layover 1:00 => Return ETD 01:30
  // Return ETA 04:30 => return flight time 3:00
  "3022": {
    cells: { D51: "IST", C52: "IST" },
    flightTime: { hours: 3, minutes: 0 },
    layoverTime: { hours: 1, minutes: 0 },
    returnFlightTime: { hours: 3, minutes: 0 },
    addReturn: true,
  },
};
