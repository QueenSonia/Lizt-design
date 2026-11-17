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
    { label: "0 to 30 days",  amount: 3_600_000,  count: 10 },
    { label: "31 to 60 days", amount: 4_500_000,  count: 8  },
    { label: "61 to 90 days", amount: 2_100_000,  count: 3  },
    { label: "90+ days",      amount: 400_000,    count: 1  },
  ],
  monthly: [
    { label: "0 to 30 days",  amount: 14_200_000, count: 38 },
    { label: "31 to 60 days", amount: 18_100_000, count: 31 },
    { label: "61 to 90 days", amount: 7_400_000,  count: 12 },
    { label: "90+ days",      amount: 2_600_000,  count: 6  },
  ],
  yearly: [
    { label: "0 to 30 days",  amount: 84_200_000,  count: 141 },
    { label: "31 to 60 days", amount: 127_400_000, count: 83  },
    { label: "61 to 90 days", amount: 98_600_000,  count: 44  },
    { label: "90+ days",      amount: 73_900_000,  count: 24  },
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

const BASE_PAYMENT_METHODS: Record<Period, Array<{ method: string; count: number; pct: number }>> = {
  weekly: [
    { method: "Bank transfer", count: 1312, pct: 68.2 },
    { method: "Card",          count: 464,  pct: 24.1 },
    { method: "Cash",          count: 148,  pct: 7.7  },
  ],
  monthly: [
    { method: "Bank transfer", count: 5241, pct: 67.8 },
    { method: "Card",          count: 1864, pct: 24.1 },
    { method: "Cash",          count: 627,  pct: 8.1  },
  ],
  yearly: [
    { method: "Bank transfer", count: 62841, pct: 68.4 },
    { method: "Card",          count: 22140, pct: 24.1 },
    { method: "Cash",          count: 6904,  pct: 7.5  },
  ],
};

export function getPaymentMethods(period: Period, filter: AccountType) {
  const m = RENT_MULT[filter];
  return BASE_PAYMENT_METHODS[period].map((d) => ({
    method: d.method,
    count:  Math.round(d.count * m),
    pct:    d.pct,
  }));
}

export type LandlordRow = {
  name:       string;
  properties: number;
  expected:   number;
  collected:  number;
  rate:       number;
};

const BASE_LANDLORD_TABLE: Record<Period, LandlordRow[]> = {
  weekly: [
    { name: "Biodun Adeleke",          properties: 48, expected: 4_820_000,  collected: 4_561_000, rate: 94.6 },
    { name: "Emeka Okafor",            properties: 35, expected: 3_500_000,  collected: 3_241_000, rate: 92.6 },
    { name: "Funmilayo Okonjo",        properties: 29, expected: 2_900_000,  collected: 2_820_000, rate: 97.2 },
    { name: "Taiwo Adeyemi",           properties: 24, expected: 2_400_000,  collected: 2_160_000, rate: 90.0 },
    { name: "Chukwuemeka Nwachukwu",   properties: 21, expected: 2_100_000,  collected: 1_940_000, rate: 92.4 },
    { name: "Yetunde Fashola",         properties: 18, expected: 1_800_000,  collected: 1_760_000, rate: 97.8 },
    { name: "Obinna Eze",              properties: 15, expected: 1_500_000,  collected: 1_320_000, rate: 88.0 },
    { name: "Ngozi Amaechi",           properties: 12, expected: 1_200_000,  collected: 1_140_000, rate: 95.0 },
  ],
  monthly: [
    { name: "Biodun Adeleke",          properties: 48, expected: 19_280_000, collected: 18_250_000, rate: 94.6 },
    { name: "Emeka Okafor",            properties: 35, expected: 14_000_000, collected: 12_964_000, rate: 92.6 },
    { name: "Funmilayo Okonjo",        properties: 29, expected: 11_600_000, collected: 11_283_000, rate: 97.2 },
    { name: "Taiwo Adeyemi",           properties: 24, expected: 9_600_000,  collected: 8_640_000,  rate: 90.0 },
    { name: "Chukwuemeka Nwachukwu",   properties: 21, expected: 8_400_000,  collected: 7_762_000,  rate: 92.4 },
    { name: "Yetunde Fashola",         properties: 18, expected: 7_200_000,  collected: 7_042_000,  rate: 97.8 },
    { name: "Obinna Eze",              properties: 15, expected: 6_000_000,  collected: 5_280_000,  rate: 88.0 },
    { name: "Ngozi Amaechi",           properties: 12, expected: 4_800_000,  collected: 4_560_000,  rate: 95.0 },
  ],
  yearly: [
    { name: "Biodun Adeleke",          properties: 48, expected: 241_000_000, collected: 228_000_000, rate: 94.6 },
    { name: "Emeka Okafor",            properties: 35, expected: 175_000_000, collected: 162_000_000, rate: 92.6 },
    { name: "Funmilayo Okonjo",        properties: 29, expected: 145_000_000, collected: 141_000_000, rate: 97.2 },
    { name: "Taiwo Adeyemi",           properties: 24, expected: 120_000_000, collected: 108_000_000, rate: 90.0 },
    { name: "Chukwuemeka Nwachukwu",   properties: 21, expected: 105_000_000, collected: 97_000_000,  rate: 92.4 },
    { name: "Yetunde Fashola",         properties: 18, expected: 90_000_000,  collected: 88_000_000,  rate: 97.8 },
    { name: "Obinna Eze",              properties: 15, expected: 75_000_000,  collected: 66_000_000,  rate: 88.0 },
    { name: "Ngozi Amaechi",           properties: 12, expected: 60_000_000,  collected: 57_000_000,  rate: 95.0 },
  ],
};

export function getLandlordTable(period: Period, filter: AccountType): LandlordRow[] {
  const m = RENT_MULT[filter];
  return BASE_LANDLORD_TABLE[period].map((d) => ({
    name:       d.name,
    properties: d.properties,
    expected:   Math.round(d.expected  * m),
    collected:  Math.round(d.collected * m),
    rate:       d.rate,
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
