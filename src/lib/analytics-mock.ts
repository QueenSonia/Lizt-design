// Central analytics mock data for the Poesitor analytics dashboard
// Replace function bodies with real API calls to wire up live data.

import type { Period, AccountType } from "@/lib/analyticsDateStore";

// ── FORMATTERS ────────────────────────────────────────────────────────────────

export function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString("en-NG")}`;
}

export function fmtNum(n: number): string {
  return n.toLocaleString("en-NG");
}

export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ── MULTIPLIERS ───────────────────────────────────────────────────────────────

const RENT_MULT:   Record<AccountType, number> = { all: 1, landlord: 0.85, pm: 0.15 };
const MAINT_MULT:  Record<AccountType, number> = { all: 1, landlord: 0.80, pm: 0.20 };
const REMIND_MULT: Record<AccountType, number> = { all: 1, landlord: 0.82, pm: 0.18 };
const PROPS_BASE:  Record<AccountType, number> = { all: 1284, landlord: 1091, pm: 193 };

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type TenancyPoint  = { label: string; total: number; active: number; vacant: number };
export type RentPoint     = { label: string; collected: number; expected: number };
export type CountPoint    = { label: string; count: number };
export type MaintNVRPoint = { label: string; newRequests: number; resolved: number };
export type RatePoint     = { label: string; rate: number };

// ── TENANCY SERIES ─────────────────────────────────────────────────────────────

const BASE_TENANCY: Record<Period, TenancyPoint[]> = {
  weekly: [
    { label: "Aug 4",  total: 1278, active: 1181, vacant: 97 },
    { label: "Aug 11", total: 1279, active: 1182, vacant: 97 },
    { label: "Aug 18", total: 1280, active: 1183, vacant: 97 },
    { label: "Aug 25", total: 1280, active: 1184, vacant: 96 },
    { label: "Sep 1",  total: 1281, active: 1185, vacant: 96 },
    { label: "Sep 8",  total: 1281, active: 1186, vacant: 95 },
    { label: "Sep 15", total: 1282, active: 1187, vacant: 95 },
    { label: "Sep 22", total: 1282, active: 1188, vacant: 94 },
    { label: "Sep 29", total: 1283, active: 1188, vacant: 95 },
    { label: "Oct 6",  total: 1283, active: 1189, vacant: 94 },
    { label: "Oct 13", total: 1283, active: 1190, vacant: 93 },
    { label: "Oct 20", total: 1284, active: 1192, vacant: 92 },
  ],
  monthly: [
    { label: "Nov", total: 1253, active: 1092, vacant: 161 },
    { label: "Dec", total: 1258, active: 1101, vacant: 157 },
    { label: "Jan", total: 1260, active: 1108, vacant: 152 },
    { label: "Feb", total: 1264, active: 1119, vacant: 145 },
    { label: "Mar", total: 1266, active: 1125, vacant: 141 },
    { label: "Apr", total: 1270, active: 1131, vacant: 139 },
    { label: "May", total: 1272, active: 1137, vacant: 135 },
    { label: "Jun", total: 1276, active: 1145, vacant: 131 },
    { label: "Jul", total: 1279, active: 1150, vacant: 129 },
    { label: "Aug", total: 1281, active: 1165, vacant: 116 },
    { label: "Sep", total: 1283, active: 1178, vacant: 105 },
    { label: "Oct", total: 1284, active: 1192, vacant: 92  },
  ],
  yearly: [
    { label: "2022", total: 1140, active: 995,  vacant: 145 },
    { label: "2023", total: 1190, active: 1042, vacant: 148 },
    { label: "2024", total: 1230, active: 1085, vacant: 145 },
    { label: "2025", total: 1260, active: 1132, vacant: 128 },
    { label: "2026", total: 1284, active: 1192, vacant: 92  },
  ],
};

export function getTenancySeries(period: Period, filter: AccountType): TenancyPoint[] {
  const base = BASE_TENANCY[period];
  if (filter === "all") return base;
  const targetTotal = PROPS_BASE[filter];
  return base.map((d) => {
    const t = Math.round((d.total  / 1284) * targetTotal);
    const a = Math.round((d.active / d.total) * t);
    return { label: d.label, total: t, active: a, vacant: t - a };
  });
}

// ── RENT SERIES ───────────────────────────────────────────────────────────────

const BASE_RENT: Record<Period, RentPoint[]> = {
  weekly: [
    { label: "Aug 4",  collected: 66_200_000,     expected: 69_800_000     },
    { label: "Aug 11", collected: 68_400_000,     expected: 72_100_000     },
    { label: "Aug 18", collected: 70_100_000,     expected: 73_800_000     },
    { label: "Aug 25", collected: 72_300_000,     expected: 76_100_000     },
    { label: "Sep 1",  collected: 69_800_000,     expected: 73_500_000     },
    { label: "Sep 8",  collected: 71_200_000,     expected: 74_900_000     },
    { label: "Sep 15", collected: 73_400_000,     expected: 77_200_000     },
    { label: "Sep 22", collected: 68_100_000,     expected: 71_900_000     },
    { label: "Sep 29", collected: 70_700_000,     expected: 74_400_000     },
    { label: "Oct 6",  collected: 67_900_000,     expected: 71_500_000     },
    { label: "Oct 13", collected: 70_700_000,     expected: 74_500_000     },
    { label: "Oct 20", collected: 73_200_000,     expected: 77_400_000     },
  ],
  monthly: [
    { label: "Nov", collected: 218_000_000, expected: 235_000_000 },
    { label: "Dec", collected: 225_000_000, expected: 241_000_000 },
    { label: "Jan", collected: 198_000_000, expected: 224_000_000 },
    { label: "Feb", collected: 204_000_000, expected: 228_000_000 },
    { label: "Mar", collected: 241_000_000, expected: 259_000_000 },
    { label: "Apr", collected: 258_000_000, expected: 274_000_000 },
    { label: "May", collected: 263_000_000, expected: 278_000_000 },
    { label: "Jun", collected: 271_000_000, expected: 285_000_000 },
    { label: "Jul", collected: 276_000_000, expected: 290_000_000 },
    { label: "Aug", collected: 281_000_000, expected: 295_000_000 },
    { label: "Sep", collected: 271_000_000, expected: 289_000_000 },
    { label: "Oct", collected: 284_500_000, expected: 300_700_000 },
  ],
  yearly: [
    { label: "2022", collected: 1_800_000_000, expected: 2_100_000_000 },
    { label: "2023", collected: 2_100_000_000, expected: 2_400_000_000 },
    { label: "2024", collected: 2_450_000_000, expected: 2_720_000_000 },
    { label: "2025", collected: 2_670_000_000, expected: 2_940_000_000 },
    { label: "2026", collected: 3_002_500_000, expected: 3_207_700_000 },
  ],
};

export function getRentSeries(period: Period, filter: AccountType): RentPoint[] {
  const m = RENT_MULT[filter];
  return BASE_RENT[period].map((d) => ({
    label:     d.label,
    collected: Math.round(d.collected * m),
    expected:  Math.round(d.expected  * m),
  }));
}

// ── MAINTENANCE NEW-VS-RESOLVED SERIES ────────────────────────────────────────

const BASE_MAINT_NVR: Record<Period, MaintNVRPoint[]> = {
  weekly: [
    { label: "Aug 4",  newRequests: 17, resolved: 13 },
    { label: "Aug 11", newRequests: 19, resolved: 16 },
    { label: "Aug 18", newRequests: 21, resolved: 17 },
    { label: "Aug 25", newRequests: 18, resolved: 14 },
    { label: "Sep 1",  newRequests: 22, resolved: 19 },
    { label: "Sep 8",  newRequests: 19, resolved: 17 },
    { label: "Sep 15", newRequests: 23, resolved: 18 },
    { label: "Sep 22", newRequests: 20, resolved: 16 },
    { label: "Sep 29", newRequests: 18, resolved: 15 },
    { label: "Oct 6",  newRequests: 24, resolved: 19 },
    { label: "Oct 13", newRequests: 18, resolved: 16 },
    { label: "Oct 20", newRequests: 22, resolved: 17 },
  ],
  monthly: [
    { label: "Nov", newRequests: 72,  resolved: 62  },
    { label: "Dec", newRequests: 84,  resolved: 71  },
    { label: "Jan", newRequests: 79,  resolved: 68  },
    { label: "Feb", newRequests: 68,  resolved: 74  },
    { label: "Mar", newRequests: 75,  resolved: 78  },
    { label: "Apr", newRequests: 71,  resolved: 76  },
    { label: "May", newRequests: 73,  resolved: 71  },
    { label: "Jun", newRequests: 68,  resolved: 72  },
    { label: "Jul", newRequests: 76,  resolved: 74  },
    { label: "Aug", newRequests: 80,  resolved: 71  },
    { label: "Sep", newRequests: 98,  resolved: 79  },
    { label: "Oct", newRequests: 87,  resolved: 72  },
  ],
  yearly: [
    { label: "2022", newRequests: 612,  resolved: 580  },
    { label: "2023", newRequests: 724,  resolved: 698  },
    { label: "2024", newRequests: 810,  resolved: 779  },
    { label: "2025", newRequests: 923,  resolved: 891  },
    { label: "2026", newRequests: 876,  resolved: 742  },
  ],
};

export function getMaintenanceSeries(period: Period, filter: AccountType): MaintNVRPoint[] {
  const m = MAINT_MULT[filter];
  return BASE_MAINT_NVR[period].map((d) => ({
    label:       d.label,
    newRequests: Math.round(d.newRequests * m),
    resolved:    Math.round(d.resolved    * m),
  }));
}

// ── REMINDERS SERIES ──────────────────────────────────────────────────────────

const BASE_REMINDERS: Record<Period, CountPoint[]> = {
  weekly: [
    { label: "Aug 4",  count: 920  },
    { label: "Aug 11", count: 950  },
    { label: "Aug 18", count: 980  },
    { label: "Aug 25", count: 940  },
    { label: "Sep 1",  count: 1010 },
    { label: "Sep 8",  count: 970  },
    { label: "Sep 15", count: 1030 },
    { label: "Sep 22", count: 980  },
    { label: "Sep 29", count: 940  },
    { label: "Oct 6",  count: 1020 },
    { label: "Oct 13", count: 940  },
    { label: "Oct 20", count: 980  },
  ],
  monthly: [
    { label: "Nov", count: 3124 },
    { label: "Dec", count: 3287 },
    { label: "Jan", count: 2984 },
    { label: "Feb", count: 3214 },
    { label: "Mar", count: 3541 },
    { label: "Apr", count: 3712 },
    { label: "May", count: 3814 },
    { label: "Jun", count: 3879 },
    { label: "Jul", count: 3947 },
    { label: "Aug", count: 3712 },
    { label: "Sep", count: 3553 },
    { label: "Oct", count: 3847 },
  ],
  yearly: [
    { label: "2022", count: 28_400 },
    { label: "2023", count: 33_200 },
    { label: "2024", count: 38_100 },
    { label: "2025", count: 36_065 },
    { label: "2026", count: 43_284 },
  ],
};

export function getRemindersSeries(period: Period, filter: AccountType): CountPoint[] {
  const m = REMIND_MULT[filter];
  return BASE_REMINDERS[period].map((d) => ({
    label: d.label,
    count: Math.round(d.count * m),
  }));
}

// ── OVERVIEW STATS ─────────────────────────────────────────────────────────────

export type OverviewStats = {
  totalProperties:        number;
  activeTenancies:        number;
  vacantProperties:       number;
  rentCollected:          number;
  rentExpected:           number;
  maintenanceTotal:       number;
  remindersSent:          number;
};

export function getOverviewStats(period: Period, filter: AccountType): OverviewStats {
  const tenancy   = getTenancySeries(period, filter);
  const rent      = getRentSeries(period, filter);
  const maint     = getMaintenanceSeries(period, filter);
  const reminders = getRemindersSeries(period, filter);

  const curT = tenancy[tenancy.length - 1];
  const curR = rent[rent.length - 1];
  const curM = maint[maint.length - 1];
  const curRm = reminders[reminders.length - 1];

  return {
    totalProperties:  curT.total,
    activeTenancies:  curT.active,
    vacantProperties: curT.vacant,
    rentCollected:    curR.collected,
    rentExpected:     curR.expected,
    maintenanceTotal: curM.newRequests,
    remindersSent:    curRm.count,
  };
}

// ── RENT PAGE ─────────────────────────────────────────────────────────────────

export type RentPageStats = {
  collected:       number;
  expected:        number;
  collectionRate:  number;
  totalOverdue:    number;
  collectedDelta:  number;
  expectedDelta:   number;
  rateDelta:       number;
  overdueDelta:    number;
};

export function getRentPageStats(period: Period, filter: AccountType): RentPageStats {
  const series = getRentSeries(period, filter);
  const cur  = series[series.length - 1];
  const prev = series[series.length - 2];
  const collectedDelta  = parseFloat((((cur.collected - prev.collected) / prev.collected) * 100).toFixed(1));
  const expectedDelta   = parseFloat((((cur.expected  - prev.expected)  / prev.expected)  * 100).toFixed(1));
  const curRate  = (cur.collected  / cur.expected)  * 100;
  const prevRate = (prev.collected / prev.expected) * 100;
  const rateDelta = parseFloat((curRate - prevRate).toFixed(1));
  const overdueBase: Record<Period, number> = {
    weekly:  10_600_000,
    monthly: 42_300_000,
    yearly:  384_100_000,
  };
  const overduePrev: Record<Period, number> = {
    weekly:  11_200_000,
    monthly: 44_800_000,
    yearly:  412_000_000,
  };
  const ov = Math.round(overdueBase[period] * RENT_MULT[filter]);
  const ovPrev = Math.round(overduePrev[period] * RENT_MULT[filter]);
  return {
    collected:      cur.collected,
    expected:       cur.expected,
    collectionRate: parseFloat(curRate.toFixed(1)),
    totalOverdue:   ov,
    collectedDelta,
    expectedDelta,
    rateDelta,
    overdueDelta:   parseFloat((((ov - ovPrev) / ovPrev) * 100).toFixed(1)),
  };
}

const BASE_OVERDUE_BY_AGE: Record<Period, Array<{ label: string; amount: number; count: number }>> = {
  weekly: [
    { label: "Up to 30 days",  amount: 3_600_000,  count: 10 },
    { label: "31 to 60 days",  amount: 4_500_000,  count: 8  },
    { label: "61 to 90 days",  amount: 2_100_000,  count: 3  },
    { label: "Over 90 days",   amount: 400_000,    count: 1  },
  ],
  monthly: [
    { label: "Up to 30 days",  amount: 14_200_000, count: 38 },
    { label: "31 to 60 days",  amount: 18_100_000, count: 31 },
    { label: "61 to 90 days",  amount: 7_400_000,  count: 12 },
    { label: "Over 90 days",   amount: 2_600_000,  count: 6  },
  ],
  yearly: [
    { label: "Up to 30 days",  amount: 84_200_000,  count: 141 },
    { label: "31 to 60 days",  amount: 127_400_000, count: 83  },
    { label: "61 to 90 days",  amount: 98_600_000,  count: 44  },
    { label: "Over 90 days",   amount: 73_900_000,  count: 24  },
  ],
};

export function getOverdueByAge(period: Period, filter: AccountType) {
  const m = RENT_MULT[filter];
  return BASE_OVERDUE_BY_AGE[period].map((d) => ({
    label: d.label,
    amount: Math.round(d.amount * m),
    count:  Math.round(d.count  * m),
  }));
}


// ── OCCUPANCY PAGE ─────────────────────────────────────────────────────────────

export type OccupancyStats = {
  occupancyRate:   number;
  activeTenancies: number;
  vacantProperties:number;
  avgDaysVacant:   number;
  rateDelta:       number;
  activeDelta:     number;
  vacantDelta:     number;
  avgDaysDelta:    number;
};

export function getOccupancyStats(period: Period, filter: AccountType): OccupancyStats {
  const series = getTenancySeries(period, filter);
  const cur  = series[series.length - 1];
  const prev = series[series.length - 2];
  const curRate  = (cur.active  / cur.total)  * 100;
  const prevRate = (prev.active / prev.total) * 100;
  const avgDaysBase: Record<Period, number> = { weekly: 32, monthly: 34, yearly: 42 };
  const avgDaysPrev: Record<Period, number> = { weekly: 34, monthly: 37, yearly: 46 };
  return {
    occupancyRate:    parseFloat(curRate.toFixed(1)),
    activeTenancies:  cur.active,
    vacantProperties: cur.vacant,
    avgDaysVacant:    avgDaysBase[period],
    rateDelta:        parseFloat((curRate - prevRate).toFixed(1)),
    activeDelta:      cur.active  - prev.active,
    vacantDelta:      cur.vacant  - prev.vacant,
    avgDaysDelta:     avgDaysBase[period] - avgDaysPrev[period],
  };
}

export function getOccupancyRateSeries(period: Period, filter: AccountType): RatePoint[] {
  return getTenancySeries(period, filter).map((d) => ({
    label: d.label,
    rate:  parseFloat(((d.active / d.total) * 100).toFixed(1)),
  }));
}

const BASE_VACANCY_BY_LOCATION: Record<Period, Array<{ location: string; vacant: number; total: number }>> = {
  weekly: [
    { location: "Magodo", vacant: 18, total: 198 },
    { location: "Lekki",  vacant: 24, total: 312 },
    { location: "Ikeja",  vacant: 14, total: 184 },
    { location: "Yaba",   vacant: 11, total: 148 },
    { location: "Ajah",   vacant: 25, total: 224 },
  ],
  monthly: [
    { location: "Magodo", vacant: 18, total: 198 },
    { location: "Lekki",  vacant: 24, total: 312 },
    { location: "Ikeja",  vacant: 14, total: 184 },
    { location: "Yaba",   vacant: 11, total: 148 },
    { location: "Ajah",   vacant: 25, total: 224 },
  ],
  yearly: [
    { location: "Magodo", vacant: 20, total: 198 },
    { location: "Lekki",  vacant: 28, total: 312 },
    { location: "Ikeja",  vacant: 17, total: 184 },
    { location: "Yaba",   vacant: 14, total: 148 },
    { location: "Ajah",   vacant: 31, total: 224 },
  ],
};

export function getVacancyByLocation(period: Period, filter: AccountType) {
  const m = RENT_MULT[filter];
  return BASE_VACANCY_BY_LOCATION[period].map((d) => ({
    location: d.location,
    vacant:   Math.round(d.vacant * m),
    total:    Math.round(d.total  * m),
  }));
}

const BASE_TENANCY_RENEWALS: Record<Period, { renewed: number; notRenewed: number }> = {
  weekly:  { renewed: 6,   notRenewed: 2  },
  monthly: { renewed: 28,  notRenewed: 6  },
  yearly:  { renewed: 312, notRenewed: 57 },
};

export function getTenancyRenewals(period: Period, filter: AccountType) {
  const m = RENT_MULT[filter];
  const base = BASE_TENANCY_RENEWALS[period];
  const renewed    = Math.max(1, Math.round(base.renewed    * m));
  const notRenewed = Math.max(0, Math.round(base.notRenewed * m));
  const total = renewed + notRenewed;
  return {
    renewed,
    notRenewed,
    rate: parseFloat(((renewed / total) * 100).toFixed(1)),
  };
}

export type VacantPropertyRow = {
  property: string;
  unit:     string;
  location: string;
  days:     number;
  landlord: string;
};

export const LONGEST_VACANT_PROPERTIES: VacantPropertyRow[] = [
  { property: "Cedar Park",      unit: "Unit 7",  location: "Magodo",           days: 89, landlord: "Biodun Adeleke"        },
  { property: "Sunset Villas",   unit: "Unit 3B", location: "Surulere",         days: 74, landlord: "Emeka Okafor"           },
  { property: "Palm Grove",      unit: "Unit 2A", location: "Ajah",             days: 61, landlord: "Taiwo Adeyemi"          },
  { property: "Ocean View",      unit: "Unit 4C", location: "Lekki",            days: 53, landlord: "Funmilayo Okonjo"       },
  { property: "Maple Court",     unit: "Unit 5D", location: "Lekki",            days: 47, landlord: "Yetunde Fashola"        },
  { property: "Royal Gardens",   unit: "Unit 2",  location: "Ikeja",            days: 41, landlord: "Biodun Adeleke"         },
  { property: "Crystal Heights", unit: "Unit 1A", location: "Yaba",             days: 36, landlord: "Ngozi Amaechi"          },
  { property: "Sunrise Estate",  unit: "Unit 8B", location: "Victoria Island",  days: 29, landlord: "Chukwuemeka Nwachukwu" },
];

// ── MAINTENANCE PAGE ──────────────────────────────────────────────────────────

export type MaintenancePageStats = {
  totalRequests:  number;
  openRequests:   number;
  avgResolutionH: number;
  reopenRate:     number;
  totalDelta:     number;
  openDelta:      number;
  resolutionDelta:number;
  reopenDelta:    number;
};

const BASE_MAINT_STATS: Record<Period, {
  total: number; open: number; avgH: number; reopenRate: number;
  totalPrev: number; openPrev: number; avgHPrev: number; reopenRatePrev: number;
}> = {
  weekly:  { total: 22,  open: 8,  avgH: 4.6, reopenRate: 4.2, totalPrev: 19,  openPrev: 7,  avgHPrev: 4.8, reopenRatePrev: 3.9 },
  monthly: { total: 87,  open: 34, avgH: 4.3, reopenRate: 4.2, totalPrev: 79,  openPrev: 29, avgHPrev: 4.5, reopenRatePrev: 4.0 },
  yearly:  { total: 876, open: 34, avgH: 4.3, reopenRate: 5.2, totalPrev: 923, openPrev: 42, avgHPrev: 4.6, reopenRatePrev: 5.8 },
};

export function getMaintenancePageStats(period: Period, filter: AccountType): MaintenancePageStats {
  const m    = MAINT_MULT[filter];
  const base = BASE_MAINT_STATS[period];
  const total     = Math.round(base.total     * m);
  const totalPrev = Math.round(base.totalPrev * m);
  const open      = Math.round(base.open      * m);
  const openPrev  = Math.round(base.openPrev  * m);
  return {
    totalRequests:   total,
    openRequests:    open,
    avgResolutionH:  base.avgH,
    reopenRate:      base.reopenRate,
    totalDelta:      parseFloat((((total - totalPrev) / Math.max(1, totalPrev)) * 100).toFixed(1)),
    openDelta:       parseFloat((((open  - openPrev)  / Math.max(1, openPrev))  * 100).toFixed(1)),
    resolutionDelta: parseFloat((base.avgH - base.avgHPrev).toFixed(1)),
    reopenDelta:     parseFloat((base.reopenRate - base.reopenRatePrev).toFixed(1)),
  };
}

const BASE_MAINT_BY_CATEGORY: Record<Period, Array<{ category: string; count: number }>> = {
  weekly: [
    { category: "Plumbing",    count: 6  },
    { category: "Electrical",  count: 5  },
    { category: "Appliances",  count: 4  },
    { category: "Structural",  count: 4  },
    { category: "Other",       count: 3  },
  ],
  monthly: [
    { category: "Plumbing",    count: 23 },
    { category: "Electrical",  count: 20 },
    { category: "Appliances",  count: 17 },
    { category: "Structural",  count: 15 },
    { category: "Other",       count: 12 },
  ],
  yearly: [
    { category: "Plumbing",    count: 234 },
    { category: "Electrical",  count: 198 },
    { category: "Appliances",  count: 164 },
    { category: "Structural",  count: 142 },
    { category: "Other",       count: 138 },
  ],
};

export function getMaintenanceByCategory(period: Period, filter: AccountType) {
  const m    = MAINT_MULT[filter];
  const rows = BASE_MAINT_BY_CATEGORY[period].map((d) => ({
    category: d.category,
    count:    Math.round(d.count * m),
  }));
  const total = rows.reduce((s, d) => s + d.count, 0);
  return rows.map((d) => ({
    ...d,
    pct: total > 0 ? parseFloat(((d.count / total) * 100).toFixed(1)) : 0,
  }));
}

const BASE_MAINT_STATUS: Record<Period, Array<{ label: string; count: number }>> = {
  weekly: [
    { label: "Pending",     count: 3  },
    { label: "In progress", count: 5  },
    { label: "Resolved",    count: 13 },
    { label: "Reopened",    count: 1  },
  ],
  monthly: [
    { label: "Pending",     count: 14 },
    { label: "In progress", count: 20 },
    { label: "Resolved",    count: 50 },
    { label: "Reopened",    count: 3  },
  ],
  yearly: [
    { label: "Pending",     count: 18  },
    { label: "In progress", count: 16  },
    { label: "Resolved",    count: 822 },
    { label: "Reopened",    count: 20  },
  ],
};

export function getMaintenanceStatusBreakdown(period: Period, filter: AccountType) {
  const m    = MAINT_MULT[filter];
  const rows = BASE_MAINT_STATUS[period].map((d) => ({
    label: d.label,
    count: Math.round(d.count * m),
  }));
  const total = rows.reduce((s, d) => s + d.count, 0);
  return { rows, total };
}

export type FmRow = {
  name:          string;
  assigned:      number;
  resolved:      number;
  reopened:      number;
  avgResolutionH:number;
};

const BASE_FM_TABLE: Record<Period, FmRow[]> = {
  weekly: [
    { name: "Sade Williams",    assigned: 10, resolved: 7,   reopened: 1, avgResolutionH: 3.8 },
    { name: "Jide Akinola",     assigned: 8,  resolved: 6,   reopened: 0, avgResolutionH: 4.2 },
    { name: "Kola Adeyemi",     assigned: 6,  resolved: 5,   reopened: 0, avgResolutionH: 4.7 },
    { name: "Amaka Okonkwo",    assigned: 5,  resolved: 4,   reopened: 1, avgResolutionH: 5.4 },
    { name: "Emeka Obi",        assigned: 5,  resolved: 4,   reopened: 0, avgResolutionH: 5.1 },
    { name: "Tunde Nweze",      assigned: 4,  resolved: 3,   reopened: 0, avgResolutionH: 4.9 },
    { name: "Bimpe Coker",      assigned: 3,  resolved: 3,   reopened: 0, avgResolutionH: 4.4 },
    { name: "Chidi Nkemdirim",  assigned: 3,  resolved: 2,   reopened: 0, avgResolutionH: 5.1 },
  ],
  monthly: [
    { name: "Sade Williams",    assigned: 38, resolved: 29,  reopened: 2,  avgResolutionH: 3.8 },
    { name: "Jide Akinola",     assigned: 31, resolved: 24,  reopened: 1,  avgResolutionH: 4.2 },
    { name: "Kola Adeyemi",     assigned: 24, resolved: 19,  reopened: 0,  avgResolutionH: 4.7 },
    { name: "Amaka Okonkwo",    assigned: 21, resolved: 17,  reopened: 2,  avgResolutionH: 5.4 },
    { name: "Emeka Obi",        assigned: 18, resolved: 14,  reopened: 1,  avgResolutionH: 5.1 },
    { name: "Tunde Nweze",      assigned: 14, resolved: 11,  reopened: 0,  avgResolutionH: 4.9 },
    { name: "Bimpe Coker",      assigned: 12, resolved: 10,  reopened: 1,  avgResolutionH: 4.4 },
    { name: "Chidi Nkemdirim",  assigned: 10, resolved: 8,   reopened: 0,  avgResolutionH: 5.1 },
  ],
  yearly: [
    { name: "Sade Williams",    assigned: 412, resolved: 364, reopened: 18, avgResolutionH: 4.2 },
    { name: "Jide Akinola",     assigned: 348, resolved: 294, reopened: 15, avgResolutionH: 4.6 },
    { name: "Kola Adeyemi",     assigned: 274, resolved: 241, reopened: 9,  avgResolutionH: 5.2 },
    { name: "Amaka Okonkwo",    assigned: 241, resolved: 198, reopened: 22, avgResolutionH: 5.9 },
    { name: "Emeka Obi",        assigned: 201, resolved: 164, reopened: 12, avgResolutionH: 5.5 },
    { name: "Tunde Nweze",      assigned: 178, resolved: 149, reopened: 8,  avgResolutionH: 4.9 },
    { name: "Bimpe Coker",      assigned: 152, resolved: 128, reopened: 5,  avgResolutionH: 4.4 },
    { name: "Chidi Nkemdirim",  assigned: 134, resolved: 111, reopened: 7,  avgResolutionH: 5.1 },
  ],
};

export function getFmTable(period: Period, filter: AccountType): FmRow[] {
  const m = MAINT_MULT[filter];
  return BASE_FM_TABLE[period].map((d) => ({
    name:           d.name,
    assigned:       Math.round(d.assigned * m),
    resolved:       Math.round(d.resolved * m),
    reopened:       Math.round(d.reopened * m),
    avgResolutionH: d.avgResolutionH,
  }));
}

// ── COMMUNICATIONS PAGE ───────────────────────────────────────────────────────

export type CommsPageStats = {
  remindersSent:       number;
  deliveryRate:        number;
  tenantsReached:      number;
  remindersPerTenancy: number;
  sentDelta:           number;
  deliveryDelta:       number;
  reachedDelta:        number;
  perTenancyDelta:     number;
};

const BASE_COMMS_STATS: Record<Period, {
  sent: number; deliveryRate: number; reached: number;
  sentPrev: number; deliveryRatePrev: number; reachedPrev: number;
}> = {
  weekly:  { sent: 980,    deliveryRate: 95.6, reached: 831,  sentPrev: 940,    deliveryRatePrev: 94.9, reachedPrev: 801  },
  monthly: { sent: 3847,   deliveryRate: 95.8, reached: 1024, sentPrev: 3553,   deliveryRatePrev: 95.2, reachedPrev: 967  },
  yearly:  { sent: 43_284, deliveryRate: 94.8, reached: 1089, sentPrev: 36_065, deliveryRatePrev: 94.1, reachedPrev: 1012 },
};

export function getCommsPageStats(period: Period, filter: AccountType): CommsPageStats {
  const m    = REMIND_MULT[filter];
  const base = BASE_COMMS_STATS[period];
  const sent      = Math.round(base.sent      * m);
  const sentPrev  = Math.round(base.sentPrev  * m);
  const reached   = Math.round(base.reached   * m);
  const reachedPrev = Math.round(base.reachedPrev * m);
  const tenancies = getTenancySeries(period, filter).at(-1)!.active;
  const perTenancy = parseFloat((sent / Math.max(1, tenancies)).toFixed(1));
  const perTenancyPrev = parseFloat((sentPrev / Math.max(1, tenancies)).toFixed(1));
  return {
    remindersSent:       sent,
    deliveryRate:        base.deliveryRate,
    tenantsReached:      reached,
    remindersPerTenancy: perTenancy,
    sentDelta:           parseFloat((((sent - sentPrev) / Math.max(1, sentPrev)) * 100).toFixed(1)),
    deliveryDelta:       parseFloat((base.deliveryRate - base.deliveryRatePrev).toFixed(1)),
    reachedDelta:        parseFloat((((reached - reachedPrev) / Math.max(1, reachedPrev)) * 100).toFixed(1)),
    perTenancyDelta:     parseFloat((perTenancy - perTenancyPrev).toFixed(1)),
  };
}

const BASE_REMINDER_CHANNELS: Record<Period, Array<{ channel: string; count: number; pct: number }>> = {
  weekly: [
    { channel: "WhatsApp", count: 619,  pct: 63.2 },
    { channel: "SMS",      count: 212,  pct: 21.6 },
    { channel: "Email",    count: 149,  pct: 15.2 },
  ],
  monthly: [
    { channel: "WhatsApp", count: 2429, pct: 63.1 },
    { channel: "SMS",      count: 831,  pct: 21.6 },
    { channel: "Email",    count: 587,  pct: 15.3 },
  ],
  yearly: [
    { channel: "WhatsApp", count: 27_312, pct: 63.1 },
    { channel: "SMS",      count: 9_349,  pct: 21.6 },
    { channel: "Email",    count: 6_623,  pct: 15.3 },
  ],
};

export function getRemindersByChannel(period: Period, filter: AccountType) {
  const m = REMIND_MULT[filter];
  return BASE_REMINDER_CHANNELS[period].map((d) => ({
    channel: d.channel,
    count:   Math.round(d.count * m),
    pct:     d.pct,
  }));
}

const BASE_REMINDER_OUTCOMES: Record<Period, { paidPct: number; unpaidPct: number }> = {
  weekly:  { paidPct: 63.4, unpaidPct: 36.6 },
  monthly: { paidPct: 64.8, unpaidPct: 35.2 },
  yearly:  { paidPct: 65.2, unpaidPct: 34.8 },
};

export function getReminderOutcomes(period: Period, filter: AccountType) {
  const base = BASE_REMINDER_OUTCOMES[period];
  const sent = getCommsPageStats(period, filter).remindersSent;
  const paid   = Math.round((base.paidPct   / 100) * sent);
  const unpaid = Math.round((base.unpaidPct / 100) * sent);
  return {
    paid,
    unpaid,
    paidPct:   base.paidPct,
    unpaidPct: base.unpaidPct,
  };
}

// ── HIGHLIGHTS (STATIC) ───────────────────────────────────────────────────────

export const HIGHLIGHT_OVERDUE = {
  top: { name: "Tunde Akinwale", amount: 3_800_000, days: 62, property: "Royal Gardens Unit 1" },
  rows: [
    { name: "Fatima Bello",  amount: 2_100_000, days: 35 },
    { name: "Emeka Chukwu",  amount: 1_200_000, days: 48 },
  ],
};

export const HIGHLIGHT_VACANT = {
  top: { name: "Cedar Park Unit 7", days: 89, location: "Magodo" },
  rows: [
    { name: "Sunset Villas Unit 3B", days: 74 },
    { name: "Palm Grove Unit 2A",    days: 61 },
  ],
};

export const HIGHLIGHT_REOPENED = {
  top: { name: "Amaka Okonkwo", reopened: 22, avgH: 5.9 },
  rows: [
    { name: "Sade Williams", reopened: 18 },
    { name: "Jide Akinola",  reopened: 15 },
  ],
};

// ── TENANT PAYMENT DATA ───────────────────────────────────────────────────────

const MONTHS_12 = [
  { label: "Nov 2025", due: "2025-11-01" },
  { label: "Dec 2025", due: "2025-12-01" },
  { label: "Jan 2026", due: "2026-01-01" },
  { label: "Feb 2026", due: "2026-02-01" },
  { label: "Mar 2026", due: "2026-03-01" },
  { label: "Apr 2026", due: "2026-04-01" },
  { label: "May 2026", due: "2026-05-01" },
  { label: "Jun 2026", due: "2026-06-01" },
  { label: "Jul 2026", due: "2026-07-01" },
  { label: "Aug 2026", due: "2026-08-01" },
  { label: "Sep 2026", due: "2026-09-01" },
  { label: "Oct 2026", due: "2026-10-01" },
];

export type TenantPaymentRecord = {
  month:    string;
  dueDate:  string;
  paidDate: string | null;
};

export type TenantPaymentStats = {
  id:            string;
  name:          string;
  property:      string;
  landlord:      string;
  balanceOwed:   number;
  onTimeRate:    number;
  avgDaysLate:   number;
  paymentsCount: number;
  group:         "always" | "mostly" | "often" | "chronic";
  payments:      TenantPaymentRecord[];
};

export type PaymentReliabilityData = {
  overallOnTimeRate: number;
  always:  { count: number; pct: number };
  mostly:  { count: number; pct: number };
  often:   { count: number; pct: number };
  chronic: { count: number; pct: number };
};

function seededFrac(a: number, b: number): number {
  const x = Math.abs(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);
  return x - Math.floor(x);
}

function isoAddDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type TenantDef = {
  id:          string;
  name:        string;
  property:    string;
  landlord:    string;
  acct:        "landlord" | "pm";
  balanceOwed: number;
  probOnTime:  number;
  unpaidLast:  number;
};

const TENANT_DEFS: TenantDef[] = [
  // Chronically late (<40%)
  { id:"t01", name:"Tunde Akinwale",      property:"Royal Gardens, Unit 1",     landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:3_800_000, probOnTime:0.17, unpaidLast:2 },
  { id:"t02", name:"Emeka Chukwu",         property:"Cedar Park, Unit 3B",       landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:1_200_000, probOnTime:0.25, unpaidLast:1 },
  { id:"t03", name:"Fatima Bello",         property:"Ocean View, Unit 5A",       landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:2_100_000, probOnTime:0.20, unpaidLast:1 },
  { id:"t04", name:"Olawale Adeyemi",      property:"Palm Grove, Unit 2C",       landlord:"Taiwo Adeyemi",         acct:"landlord", balanceOwed:  650_000, probOnTime:0.33, unpaidLast:1 },
  { id:"t05", name:"Grace Nwankwo",        property:"Surulere Court, Unit 1",    landlord:"Yetunde Fashola",       acct:"pm",       balanceOwed:  480_000, probOnTime:0.30, unpaidLast:1 },
  // Often late (40-69%)
  { id:"t06", name:"Kemi Ibrahim",         property:"Maple Court, Unit 8D",      landlord:"Obinna Eze",            acct:"landlord", balanceOwed:  320_000, probOnTime:0.50, unpaidLast:1 },
  { id:"t07", name:"Chidi Obi",            property:"Sapphire Heights, Unit 2A", landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:  180_000, probOnTime:0.55, unpaidLast:1 },
  { id:"t08", name:"Nkechi Obasi",         property:"Crystal Heights, Unit 3",   landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:  400_000, probOnTime:0.47, unpaidLast:1 },
  { id:"t09", name:"Rotimi Fola",          property:"Sunrise Estate, Unit 2B",   landlord:"Taiwo Adeyemi",         acct:"landlord", balanceOwed:  220_000, probOnTime:0.60, unpaidLast:1 },
  { id:"t10", name:"Adaeze Nnaji",         property:"Parkview Estate, Unit 4",   landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.42, unpaidLast:0 },
  { id:"t11", name:"Muyiwa Dada",          property:"Lagos Heights, Unit 7",     landlord:"Chukwuemeka Nwachukwu", acct:"pm",       balanceOwed:  150_000, probOnTime:0.58, unpaidLast:1 },
  { id:"t12", name:"Chisom Okonkwo",       property:"Royal Gardens, Unit 4",     landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.45, unpaidLast:0 },
  { id:"t13", name:"Bola Tijani",          property:"Cedar Park, Unit 1A",       landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:   90_000, probOnTime:0.63, unpaidLast:1 },
  { id:"t14", name:"Ikenna Mba",           property:"Palm Grove, Unit 5",        landlord:"Taiwo Adeyemi",         acct:"landlord", balanceOwed:  270_000, probOnTime:0.48, unpaidLast:1 },
  { id:"t15", name:"Funke Ayoola",         property:"Sunrise Estate, Unit 6B",   landlord:"Taiwo Adeyemi",         acct:"landlord", balanceOwed:        0, probOnTime:0.65, unpaidLast:0 },
  // Mostly on time (70-89%)
  { id:"t16", name:"Yemi Bankole",         property:"Lekki Gardens, Unit 3",     landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:        0, probOnTime:0.75, unpaidLast:0 },
  { id:"t17", name:"Toyin Adewale",        property:"Victoria Homes, Unit 2",    landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.80, unpaidLast:0 },
  { id:"t18", name:"Seun Fashola",         property:"Cedar Park, Unit 5B",       landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.78, unpaidLast:0 },
  { id:"t19", name:"Sola Alabi",           property:"Royal Gardens, Unit 2",     landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.83, unpaidLast:0 },
  { id:"t20", name:"Chukwu Okafor",        property:"Ikeja Villas, Unit 1",      landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.72, unpaidLast:0 },
  { id:"t21", name:"Amara Nwosu",          property:"Sunset Villas, Unit 2A",    landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.85, unpaidLast:0 },
  { id:"t22", name:"Dipo Adeola",          property:"Lagos Heights, Unit 3",     landlord:"Chukwuemeka Nwachukwu", acct:"pm",       balanceOwed:        0, probOnTime:0.77, unpaidLast:0 },
  { id:"t23", name:"Lola Ogun",            property:"Palm Grove, Unit 3A",       landlord:"Taiwo Adeyemi",         acct:"landlord", balanceOwed:        0, probOnTime:0.73, unpaidLast:0 },
  { id:"t24", name:"Remi Coker",           property:"Cedar Park, Unit 2",        landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.82, unpaidLast:0 },
  { id:"t25", name:"Ifeanyi Nze",          property:"Crystal Heights, Unit 1",   landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:        0, probOnTime:0.87, unpaidLast:0 },
  { id:"t26", name:"Ngozi Mba",            property:"Royal Gardens, Unit 6",     landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.74, unpaidLast:0 },
  { id:"t27", name:"Tola Fashola",         property:"Victoria Homes, Unit 4",    landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.79, unpaidLast:0 },
  { id:"t28", name:"Kayode Adeoba",        property:"Lekki Gardens, Unit 5",     landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:        0, probOnTime:0.84, unpaidLast:0 },
  { id:"t29", name:"Adunola Ojo",          property:"Parkview Estate, Unit 2",   landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.76, unpaidLast:0 },
  { id:"t30", name:"Chinedu Obi",          property:"Sunset Villas, Unit 4",     landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.81, unpaidLast:0 },
  { id:"t31", name:"Folake Bello",         property:"Maple Court, Unit 2A",      landlord:"Obinna Eze",            acct:"landlord", balanceOwed:        0, probOnTime:0.86, unpaidLast:0 },
  { id:"t32", name:"Tobi Adeyemi",         property:"Ikeja Villas, Unit 3",      landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.71, unpaidLast:0 },
  { id:"t33", name:"Chiamaka Eze",         property:"Sapphire Heights, Unit 1",  landlord:"Funmilayo Okonjo",      acct:"pm",       balanceOwed:        0, probOnTime:0.88, unpaidLast:0 },
  // Always on time (>=90%)
  { id:"t34", name:"Biodun Adeleke Jr",    property:"Royal Gardens, Unit 3",     landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.95, unpaidLast:0 },
  { id:"t35", name:"Funmi Okafor",         property:"Lekki Heights, Unit 1",     landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.92, unpaidLast:0 },
  { id:"t36", name:"Temi Williams",        property:"Cedar Park, Unit 4A",       landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.97, unpaidLast:0 },
  { id:"t37", name:"Taiwo Coker",          property:"Victoria Homes, Unit 1",    landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.93, unpaidLast:0 },
  { id:"t38", name:"Chukwudi Nweze",       property:"Parkview Estate, Unit 1",   landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.90, unpaidLast:0 },
  { id:"t39", name:"Ada Obi",             property:"Palm Grove, Unit 1B",       landlord:"Taiwo Adeyemi",         acct:"landlord", balanceOwed:        0, probOnTime:0.96, unpaidLast:0 },
  { id:"t40", name:"Emeka Johnson",        property:"Lekki Gardens, Unit 2",     landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:        0, probOnTime:0.91, unpaidLast:0 },
  { id:"t41", name:"Sade Coker",           property:"Crystal Heights, Unit 2",   landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:        0, probOnTime:0.98, unpaidLast:0 },
  { id:"t42", name:"Femi Adeola",          property:"Lagos Heights, Unit 1",     landlord:"Chukwuemeka Nwachukwu", acct:"pm",       balanceOwed:        0, probOnTime:0.94, unpaidLast:0 },
  { id:"t43", name:"Nkechi Williams",      property:"Ikeja Villas, Unit 2",      landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.90, unpaidLast:0 },
  { id:"t44", name:"Yetunde Okonkwo",      property:"Sapphire Heights, Unit 3",  landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:        0, probOnTime:0.95, unpaidLast:0 },
  { id:"t45", name:"Kayode Bankole",       property:"Royal Gardens, Unit 5",     landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.93, unpaidLast:0 },
  { id:"t46", name:"Damilola Nwosu",       property:"Victoria Homes, Unit 3",    landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.92, unpaidLast:0 },
  { id:"t47", name:"Chidi Fashola",        property:"Sunset Villas, Unit 1",     landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.97, unpaidLast:0 },
  { id:"t48", name:"Amaka Eze",           property:"Cedar Park, Unit 6",        landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.91, unpaidLast:0 },
  { id:"t49", name:"Tosin Adeyemi",        property:"Parkview Estate, Unit 3",   landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.96, unpaidLast:0 },
  { id:"t50", name:"Remi Bankole",         property:"Crystal Heights, Unit 4",   landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:        0, probOnTime:0.90, unpaidLast:0 },
  { id:"t51", name:"Lola Okafor",          property:"Lekki Gardens, Unit 4",     landlord:"Funmilayo Okonjo",      acct:"landlord", balanceOwed:        0, probOnTime:0.94, unpaidLast:0 },
  { id:"t52", name:"Yemi Fashola",         property:"Lagos Heights, Unit 2",     landlord:"Chukwuemeka Nwachukwu", acct:"pm",       balanceOwed:        0, probOnTime:0.98, unpaidLast:0 },
  { id:"t53", name:"Ifeyinwa Mba",         property:"Royal Gardens, Unit 7",     landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.93, unpaidLast:0 },
  { id:"t54", name:"Toyin Nze",           property:"Ikeja Villas, Unit 4",      landlord:"Emeka Okafor",          acct:"landlord", balanceOwed:        0, probOnTime:0.91, unpaidLast:0 },
  { id:"t55", name:"Biodun Coker",         property:"Maple Court, Unit 1",       landlord:"Yetunde Fashola",       acct:"landlord", balanceOwed:        0, probOnTime:0.95, unpaidLast:0 },
  { id:"t56", name:"Ngozi Obi",           property:"Palm Grove, Unit 4B",       landlord:"Taiwo Adeyemi",         acct:"pm",       balanceOwed:        0, probOnTime:0.92, unpaidLast:0 },
  { id:"t57", name:"Chiamaka Bankole",     property:"Crystal Heights, Unit 5",   landlord:"Funmilayo Okonjo",      acct:"pm",       balanceOwed:        0, probOnTime:0.96, unpaidLast:0 },
  { id:"t58", name:"Chukwu Adeola",        property:"Victoria Homes, Unit 5",    landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.90, unpaidLast:0 },
  { id:"t59", name:"Femi Nwosu",           property:"Cedar Park, Unit 7",        landlord:"Biodun Adeleke",        acct:"landlord", balanceOwed:        0, probOnTime:0.97, unpaidLast:0 },
  { id:"t60", name:"Ada Fashola",          property:"Sunset Villas, Unit 5",     landlord:"Emeka Okafor",          acct:"pm",       balanceOwed:        0, probOnTime:0.94, unpaidLast:0 },
];

function buildPayments(tenantIdx: number, def: TenantDef): TenantPaymentRecord[] {
  return MONTHS_12.map((m, mIdx) => {
    if (mIdx >= 12 - def.unpaidLast) {
      return { month: m.label, dueDate: m.due, paidDate: null };
    }
    const r = seededFrac(tenantIdx, mIdx);
    if (r < def.probOnTime) {
      return { month: m.label, dueDate: m.due, paidDate: m.due };
    }
    const daysLate = 1 + Math.floor(seededFrac(tenantIdx + 100, mIdx) * 44);
    return { month: m.label, dueDate: m.due, paidDate: isoAddDays(m.due, daysLate) };
  });
}

function daysLateForRecord(r: TenantPaymentRecord): number | null {
  if (!r.paidDate) return null;
  const due  = new Date(r.dueDate  + "T12:00:00Z");
  const paid = new Date(r.paidDate + "T12:00:00Z");
  return Math.max(0, Math.round((paid.getTime() - due.getTime()) / 86_400_000));
}

function getMonthIndices(period: Period): number[] {
  if (period === "weekly")  return [10, 11];
  if (period === "monthly") return [6, 7, 8, 9, 10, 11];
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
}

function deriveStats(def: TenantDef, tenantIdx: number, monthIndices: number[]): TenantPaymentStats {
  const allPayments = buildPayments(tenantIdx, def);
  const subset      = monthIndices.map((i) => allPayments[i]);

  let onTimeCount  = 0;
  let lateCount    = 0;
  let totalDaysLate = 0;

  for (const r of subset) {
    if (r.paidDate === null) continue;
    const dl = daysLateForRecord(r);
    if (dl === 0)      onTimeCount++;
    else if (dl! > 0) { lateCount++; totalDaysLate += dl!; }
  }

  const paidCount  = onTimeCount + lateCount;
  const onTimeRate = paidCount > 0
    ? parseFloat(((onTimeCount / paidCount) * 100).toFixed(1))
    : 0;
  const avgDaysLate = lateCount > 0
    ? parseFloat((totalDaysLate / lateCount).toFixed(1))
    : 0;

  const group: TenantPaymentStats["group"] =
    onTimeRate >= 90 ? "always" :
    onTimeRate >= 70 ? "mostly" :
    onTimeRate >= 40 ? "often"  : "chronic";

  return {
    id: def.id, name: def.name, property: def.property,
    landlord: def.landlord, balanceOwed: def.balanceOwed,
    onTimeRate, avgDaysLate, paymentsCount: paidCount, group,
    payments: allPayments,
  };
}

export function getTenantPaymentStats(period: Period, filter: AccountType): TenantPaymentStats[] {
  const monthIndices = getMonthIndices(period);
  return TENANT_DEFS
    .filter((def) => filter === "all" || def.acct === filter)
    .map((def) => deriveStats(def, TENANT_DEFS.indexOf(def), monthIndices))
    .filter((s) => s.paymentsCount > 0);
}

export function getPaymentReliabilityData(period: Period, filter: AccountType): PaymentReliabilityData {
  const stats = getTenantPaymentStats(period, filter);
  if (stats.length === 0) {
    return { overallOnTimeRate: 0,
      always: {count:0,pct:0}, mostly: {count:0,pct:0},
      often:  {count:0,pct:0}, chronic:{count:0,pct:0} };
  }
  const total   = stats.length;
  const always  = stats.filter((s) => s.group === "always").length;
  const mostly  = stats.filter((s) => s.group === "mostly").length;
  const often   = stats.filter((s) => s.group === "often").length;
  const chronic = stats.filter((s) => s.group === "chronic").length;
  const overallOnTimeRate = parseFloat(
    (stats.reduce((sum, s) => sum + s.onTimeRate, 0) / total).toFixed(1)
  );
  const p = (n: number) => parseFloat(((n / total) * 100).toFixed(1));
  return {
    overallOnTimeRate,
    always:  { count: always,  pct: p(always)  },
    mostly:  { count: mostly,  pct: p(mostly)  },
    often:   { count: often,   pct: p(often)   },
    chronic: { count: chronic, pct: p(chronic) },
  };
}

export function getTenantPeriodLabel(period: Period): string {
  if (period === "weekly")  return "over the last 2 months";
  if (period === "monthly") return "over the last 6 months";
  return "over the last 12 months";
}

// ── RENT PAGE EXTENSIONS ──────────────────────────────────────────────────────

// Location and monthly rent for the 60 sample tenants
const TENANT_LOCATION: Record<string, string> = {
  t01:"Ikeja", t02:"Magodo", t03:"Lekki",  t04:"Ajah",           t05:"Surulere",
  t06:"Yaba",  t07:"Lekki",  t08:"Yaba",   t09:"Victoria Island", t10:"Magodo",
  t11:"Ikeja", t12:"Ikeja",  t13:"Magodo", t14:"Ajah",            t15:"Victoria Island",
  t16:"Lekki", t17:"Victoria Island", t18:"Magodo", t19:"Ikeja",  t20:"Ikeja",
  t21:"Surulere", t22:"Ikeja", t23:"Ajah", t24:"Magodo",          t25:"Yaba",
  t26:"Ikeja", t27:"Victoria Island", t28:"Lekki", t29:"Magodo",  t30:"Surulere",
  t31:"Yaba",  t32:"Ikeja",  t33:"Lekki",  t34:"Ikeja",           t35:"Lekki",
  t36:"Magodo",t37:"Victoria Island", t38:"Magodo", t39:"Ajah",   t40:"Lekki",
  t41:"Yaba",  t42:"Ikeja",  t43:"Ikeja",  t44:"Lekki",           t45:"Ikeja",
  t46:"Victoria Island", t47:"Surulere", t48:"Magodo", t49:"Magodo", t50:"Yaba",
  t51:"Lekki", t52:"Ikeja",  t53:"Ikeja",  t54:"Ikeja",            t55:"Yaba",
  t56:"Ajah",  t57:"Yaba",   t58:"Victoria Island", t59:"Magodo", t60:"Surulere",
};

const TENANT_MONTHLY_RENT: Record<string, number> = {
  t01:1_900_000, t02:1_200_000, t03:2_100_000, t04:650_000,  t05:480_000,
  t06:320_000,   t07:180_000,   t08:400_000,   t09:220_000,  t10:280_000,
  t11:150_000,   t12:290_000,   t13:90_000,    t14:270_000,  t15:360_000,
  t16:350_000,   t17:420_000,   t18:310_000,   t19:300_000,  t20:250_000,
  t21:380_000,   t22:200_000,   t23:240_000,   t24:320_000,  t25:340_000,
  t26:280_000,   t27:400_000,   t28:360_000,   t29:290_000,  t30:350_000,
  t31:220_000,   t32:260_000,   t33:300_000,   t34:270_000,  t35:320_000,
  t36:310_000,   t37:410_000,   t38:280_000,   t39:230_000,  t40:370_000,
  t41:340_000,   t42:220_000,   t43:240_000,   t44:300_000,  t45:270_000,
  t46:390_000,   t47:350_000,   t48:310_000,   t49:290_000,  t50:330_000,
  t51:355_000,   t52:210_000,   t53:230_000,   t54:240_000,  t55:220_000,
  t56:230_000,   t57:320_000,   t58:430_000,   t59:300_000,  t60:370_000,
};

const TENANT_DAYS_OVERDUE: Record<string, number> = {
  t01:62, t02:48, t03:35, t04:48, t05:48,
  t06:48, t07:48, t08:48, t09:48, t11:48,
  t13:48, t14:48,
};

// ── UPCOMING RENT DUE ─────────────────────────────────────────────────────────

export type UpcomingWeekRow = { label: string; dateRange: string; amount: number; count: number };
export type UpcomingDueTenant = { id: string; name: string; property: string; amount: number; dueDate: string };

const UPCOMING_BASE = {
  all:      { total: 268_400_000, count: 1_192 },
  landlord: { total: 228_200_000, count: 1_013 },
  pm:       { total:  40_200_000, count:   179 },
};

const UPCOMING_WEEKS: Record<AccountType, UpcomingWeekRow[]> = {
  all: [
    { label: "Week 1", dateRange: "Nov 18 to 24", amount:  54_200_000, count: 238 },
    { label: "Week 2", dateRange: "Nov 25 to Dec 1", amount: 72_600_000, count: 318 },
    { label: "Week 3", dateRange: "Dec 2 to 8",   amount:  81_400_000, count: 357 },
    { label: "Week 4", dateRange: "Dec 9 to 15",  amount:  60_200_000, count: 279 },
  ],
  landlord: [
    { label: "Week 1", dateRange: "Nov 18 to 24", amount:  46_100_000, count: 202 },
    { label: "Week 2", dateRange: "Nov 25 to Dec 1", amount: 61_700_000, count: 270 },
    { label: "Week 3", dateRange: "Dec 2 to 8",   amount:  69_200_000, count: 304 },
    { label: "Week 4", dateRange: "Dec 9 to 15",  amount:  51_200_000, count: 237 },
  ],
  pm: [
    { label: "Week 1", dateRange: "Nov 18 to 24", amount:   8_100_000, count: 36 },
    { label: "Week 2", dateRange: "Nov 25 to Dec 1", amount: 10_900_000, count: 48 },
    { label: "Week 3", dateRange: "Dec 2 to 8",   amount:  12_200_000, count: 53 },
    { label: "Week 4", dateRange: "Dec 9 to 15",  amount:   9_000_000, count: 42 },
  ],
};

const UPCOMING_TENANT_IDS = [
  { id: "t35", dueDate: "2026-11-20" },
  { id: "t16", dueDate: "2026-11-22" },
  { id: "t44", dueDate: "2026-11-25" },
  { id: "t37", dueDate: "2026-11-28" },
  { id: "t51", dueDate: "2026-12-01" },
  { id: "t17", dueDate: "2026-12-01" },
  { id: "t47", dueDate: "2026-12-04" },
  { id: "t22", dueDate: "2026-12-08" },
  { id: "t34", dueDate: "2026-12-12" },
  { id: "t50", dueDate: "2026-12-15" },
];

export function getUpcomingRentDue(filter: AccountType): {
  total: number; tenancyCount: number;
  weeks: UpcomingWeekRow[];
  soonest: UpcomingDueTenant[];
} {
  const base = UPCOMING_BASE[filter];
  const soonest: UpcomingDueTenant[] = UPCOMING_TENANT_IDS
    .map(({ id, dueDate }) => {
      const def = TENANT_DEFS.find((d) => d.id === id);
      if (!def) return null;
      if (filter !== "all" && def.acct !== filter) return null;
      return {
        id, name: def.name, property: def.property,
        amount: TENANT_MONTHLY_RENT[id] ?? 200_000,
        dueDate,
      };
    })
    .filter((x): x is UpcomingDueTenant => x !== null)
    .slice(0, 10);
  return {
    total: base.total,
    tenancyCount: base.count,
    weeks: UPCOMING_WEEKS[filter],
    soonest,
  };
}

// ── PAYMENT TIMING ────────────────────────────────────────────────────────────

export type PaymentTimingData = {
  early:   { count: number; pct: number };
  onTime:  { count: number; pct: number };
  late:    { count: number; pct: number };
  avgDaysAfterDue: number;
  avgDaysLateOnly: number;
};

const BASE_TIMING: Record<Period, { earlyPct: number; onTimePct: number; latePct: number; avgAfterDue: number; avgLateOnly: number }> = {
  weekly:  { earlyPct: 5.1, onTimePct: 42.0, latePct: 52.9, avgAfterDue: 4.2, avgLateOnly: 8.1 },
  monthly: { earlyPct: 5.4, onTimePct: 44.1, latePct: 50.5, avgAfterDue: 3.8, avgLateOnly: 7.6 },
  yearly:  { earlyPct: 5.8, onTimePct: 45.2, latePct: 49.0, avgAfterDue: 3.5, avgLateOnly: 7.2 },
};

export function getPaymentTiming(period: Period, filter: AccountType): PaymentTimingData {
  const base = BASE_TIMING[period];
  const tenants = getTenantPaymentStats(period, filter);
  const monthsInPeriod = period === "weekly" ? 2 : period === "monthly" ? 6 : 12;
  const totalPayments = Math.round(tenants.length * monthsInPeriod * 0.92);
  return {
    early:  { count: Math.round(totalPayments * base.earlyPct  / 100), pct: base.earlyPct  },
    onTime: { count: Math.round(totalPayments * base.onTimePct / 100), pct: base.onTimePct },
    late:   { count: Math.round(totalPayments * base.latePct   / 100), pct: base.latePct   },
    avgDaysAfterDue: base.avgAfterDue,
    avgDaysLateOnly: base.avgLateOnly,
  };
}

// ── OLDEST UNPAID ACCOUNTS ────────────────────────────────────────────────────

export type UnpaidAccountRow = {
  id: string; name: string; property: string; landlord: string; location: string;
  amountOverdue: number; daysOverdue: number;
};

export function getOldestUnpaid(filter: AccountType): UnpaidAccountRow[] {
  return TENANT_DEFS
    .filter((d) => d.balanceOwed > 0 && (filter === "all" || d.acct === filter))
    .map((d) => ({
      id: d.id, name: d.name, property: d.property, landlord: d.landlord,
      location: TENANT_LOCATION[d.id] ?? "Lagos",
      amountOverdue: d.balanceOwed,
      daysOverdue: TENANT_DAYS_OVERDUE[d.id] ?? (d.unpaidLast > 1 ? 78 : 48),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.amountOverdue - a.amountOverdue)
    .slice(0, 10);
}

// ── RENT BY LOCATION ──────────────────────────────────────────────────────────

export type RentByLocationRow = { location: string; collected: number; expected: number; rate: number };

const BASE_LOCATION_RENT: Record<Period, RentByLocationRow[]> = {
  yearly: [
    { location: "Ajah",           collected: 268_000_000, expected: 320_000_000, rate: 83.8 },
    { location: "Yaba",           collected: 162_000_000, expected: 192_000_000, rate: 84.4 },
    { location: "Surulere",       collected: 148_000_000, expected: 164_000_000, rate: 90.2 },
    { location: "Ikeja",          collected: 540_000_000, expected: 586_000_000, rate: 92.1 },
    { location: "Magodo",         collected: 460_000_000, expected: 479_000_000, rate: 96.0 },
    { location: "Lekki",          collected: 760_000_000, expected: 793_000_000, rate: 95.8 },
    { location: "Victoria Island",collected: 620_000_000, expected: 638_000_000, rate: 97.2 },
  ],
  monthly: [
    { location: "Ajah",           collected:  25_200_000, expected:  30_100_000, rate: 83.7 },
    { location: "Yaba",           collected:  15_200_000, expected:  18_000_000, rate: 84.4 },
    { location: "Surulere",       collected:  13_800_000, expected:  15_300_000, rate: 90.2 },
    { location: "Ikeja",          collected:  50_600_000, expected:  54_900_000, rate: 92.2 },
    { location: "Magodo",         collected:  43_000_000, expected:  44_800_000, rate: 96.0 },
    { location: "Lekki",          collected:  71_000_000, expected:  74_200_000, rate: 95.7 },
    { location: "Victoria Island",collected:  58_000_000, expected:  59_700_000, rate: 97.2 },
  ],
  weekly: [
    { location: "Ajah",           collected:   6_200_000, expected:   7_400_000, rate: 83.8 },
    { location: "Yaba",           collected:   3_700_000, expected:   4_400_000, rate: 84.1 },
    { location: "Surulere",       collected:   3_400_000, expected:   3_700_000, rate: 91.9 },
    { location: "Ikeja",          collected:  12_400_000, expected:  13_500_000, rate: 91.9 },
    { location: "Magodo",         collected:  10_600_000, expected:  11_000_000, rate: 96.4 },
    { location: "Lekki",          collected:  17_500_000, expected:  18_300_000, rate: 95.6 },
    { location: "Victoria Island",collected:  14_300_000, expected:  14_700_000, rate: 97.3 },
  ],
};

export function getRentByLocation(period: Period, filter: AccountType): RentByLocationRow[] {
  const m = RENT_MULT[filter];
  return BASE_LOCATION_RENT[period].map((d) => {
    const col = Math.round(d.collected * m);
    const exp = Math.round(d.expected  * m);
    return { location: d.location, collected: col, expected: exp, rate: parseFloat(((col / exp) * 100).toFixed(1)) };
  });
}

// ── RECOVERED AFTER REMINDERS ─────────────────────────────────────────────────

export type RecoveryTrendPoint = { label: string; recovered: number };

const BASE_RECOVERY: Record<Period, {
  recovered: number; reminders: number; recoveryRate: number; avgDays: number;
  trend: RecoveryTrendPoint[];
}> = {
  weekly: {
    recovered: 8_200_000, reminders: 324, recoveryRate: 61.4, avgDays: 3.2,
    trend: [
      { label: "Sep 29", recovered: 7_100_000 },
      { label: "Oct 6",  recovered: 7_800_000 },
      { label: "Oct 13", recovered: 8_400_000 },
      { label: "Oct 20", recovered: 7_600_000 },
      { label: "Oct 27", recovered: 8_900_000 },
      { label: "Nov 3",  recovered: 8_200_000 },
    ],
  },
  monthly: {
    recovered: 32_600_000, reminders: 1_438, recoveryRate: 63.8, avgDays: 3.1,
    trend: [
      { label: "May", recovered: 28_400_000 },
      { label: "Jun", recovered: 30_100_000 },
      { label: "Jul", recovered: 31_800_000 },
      { label: "Aug", recovered: 29_600_000 },
      { label: "Sep", recovered: 33_200_000 },
      { label: "Oct", recovered: 32_600_000 },
    ],
  },
  yearly: {
    recovered: 96_200_000, reminders: 43_284, recoveryRate: 65.2, avgDays: 2.9,
    trend: [
      { label: "2021", recovered:  71_000_000 },
      { label: "2022", recovered:  78_500_000 },
      { label: "2023", recovered:  84_200_000 },
      { label: "2024", recovered:  88_900_000 },
      { label: "2025", recovered:  92_400_000 },
      { label: "2026", recovered:  96_200_000 },
    ],
  },
};

export function getRecoveredAfterReminders(period: Period, filter: AccountType): {
  totalRecovered: number; remindersCount: number;
  recoveryRate: number; avgDaysAfterReminder: number;
  trend: RecoveryTrendPoint[];
} {
  const m    = RENT_MULT[filter];
  const base = BASE_RECOVERY[period];
  return {
    totalRecovered:    Math.round(base.recovered  * m),
    remindersCount:    Math.round(base.reminders  * m),
    recoveryRate:      base.recoveryRate,
    avgDaysAfterReminder: base.avgDays,
    trend: base.trend.map((t) => ({ label: t.label, recovered: Math.round(t.recovered * m) })),
  };
}

// ── TENANT CREDIT SCORES ──────────────────────────────────────────────────────

export type CreditScoreBand = "Excellent" | "Good" | "Fair" | "Poor" | "Very poor";

export type TenantCreditScore = {
  id: string; name: string; property: string; landlord: string; location: string;
  score: number; band: CreditScoreBand; change3m: number;
  paymentHistoryPts: number; latenessPts: number; arrearsPts: number; consistencyPts: number;
  onTimeRate: number; avgDaysLate: number; balanceOwed: number; paymentsCount: number;
  payments: TenantPaymentRecord[];
};

function bandFor(score: number): CreditScoreBand {
  if (score >= 750) return "Excellent";
  if (score >= 650) return "Good";
  if (score >= 550) return "Fair";
  if (score >= 450) return "Poor";
  return "Very poor";
}

function computeScore(stats: TenantPaymentStats, monthlyRent: number, monthIndices: number[]): {
  score: number; band: CreditScoreBand;
  paymentHistoryPts: number; latenessPts: number; arrearsPts: number; consistencyPts: number;
} {
  const histFrac = stats.onTimeRate / 100;

  const lateFrac = Math.max(0, 1 - stats.avgDaysLate / 30);

  const maxArrears = Math.max(1, monthlyRent * 2);
  const arrearsFrac = Math.max(0, 1 - stats.balanceOwed / maxArrears);

  const subset = monthIndices.map((i) => stats.payments[i]);
  let missed = 0;
  let streak = 0;
  let streakCount = 0;
  for (const p of subset) {
    if (!p.paidDate) { missed++; streak = 0; continue; }
    const dl = daysLateForRecord(p) ?? 0;
    if (dl > 0) { streak++; if (streak >= 2) streakCount++; }
    else streak = 0;
  }
  const consFrac = Math.max(0, 1 - missed / 12 - streakCount / 6);

  const weighted = 0.50 * histFrac + 0.20 * lateFrac + 0.20 * arrearsFrac + 0.10 * consFrac;
  const score = Math.round(300 + 550 * Math.min(1, Math.max(0, weighted)));

  return {
    score,
    band: bandFor(score),
    paymentHistoryPts: Math.round(histFrac    * 275),
    latenessPts:       Math.round(lateFrac    * 110),
    arrearsPts:        Math.round(arrearsFrac * 110),
    consistencyPts:    Math.round(consFrac    *  55),
  };
}

export function getTenantCreditScores(filter: AccountType): TenantCreditScore[] {
  const allIndices12 = [0,1,2,3,4,5,6,7,8,9,10,11];
  const allIndices9  = [0,1,2,3,4,5,6,7,8];
  return TENANT_DEFS
    .filter((d) => filter === "all" || d.acct === filter)
    .map((def) => {
      const idx    = TENANT_DEFS.indexOf(def);
      const stats  = deriveStats(def, idx, allIndices12);
      const stats9 = deriveStats(def, idx, allIndices9);
      const rent   = TENANT_MONTHLY_RENT[def.id] ?? 200_000;
      const cur    = computeScore(stats,  rent, allIndices12);
      const prev   = computeScore(stats9, rent, allIndices9);
      return {
        id: def.id, name: def.name, property: def.property,
        landlord: def.landlord, location: TENANT_LOCATION[def.id] ?? "Lagos",
        score: cur.score, band: cur.band, change3m: cur.score - prev.score,
        paymentHistoryPts: cur.paymentHistoryPts,
        latenessPts:       cur.latenessPts,
        arrearsPts:        cur.arrearsPts,
        consistencyPts:    cur.consistencyPts,
        onTimeRate:   stats.onTimeRate,
        avgDaysLate:  stats.avgDaysLate,
        balanceOwed:  def.balanceOwed,
        paymentsCount:stats.paymentsCount,
        payments:     stats.payments,
      };
    });
}

export function getCreditScoreDistribution(filter: AccountType): {
  average: number;
  bands: Array<{ band: CreditScoreBand; count: number; pct: number; color: string }>;
} {
  const scores = getTenantCreditScores(filter);
  if (scores.length === 0) {
    const bandDefs: Array<{ band: CreditScoreBand; color: string }> = [
      { band: "Excellent", color: "#3D8A5E" },
      { band: "Good",      color: "#6DAE87" },
      { band: "Fair",      color: "#C9856A" },
      { band: "Poor",      color: "#A05040" },
      { band: "Very poor", color: "#7A2828" },
    ];
    return { average: 0, bands: bandDefs.map((b) => ({ ...b, count: 0, pct: 0 })) };
  }
  const avg = Math.round(scores.reduce((s, t) => s + t.score, 0) / scores.length);
  const total = scores.length;
  const bandOrder: Array<{ band: CreditScoreBand; color: string }> = [
    { band: "Excellent", color: "#3D8A5E" },
    { band: "Good",      color: "#6DAE87" },
    { band: "Fair",      color: "#C9856A" },
    { band: "Poor",      color: "#A05040" },
    { band: "Very poor", color: "#7A2828" },
  ];
  return {
    average: avg,
    bands: bandOrder.map((b) => {
      const count = scores.filter((s) => s.band === b.band).length;
      return { band: b.band, count, pct: parseFloat(((count / total) * 100).toFixed(1)), color: b.color };
    }),
  };
}
