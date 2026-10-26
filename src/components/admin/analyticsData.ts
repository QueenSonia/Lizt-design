import type { Period, AccountType } from "@/lib/analyticsDateStore";

// ── MULTIPLIERS ───────────────────────────────────────────────────────────────

const RENT_MULT: Record<AccountType, number>   = { all: 1, landlord: 0.85, pm: 0.15 };
const MAINT_MULT: Record<AccountType, number>  = { all: 1, landlord: 0.80, pm: 0.20 };
const REMIND_MULT: Record<AccountType, number> = { all: 1, landlord: 0.82, pm: 0.18 };
const TOTAL_PROPS: Record<AccountType, number> = { all: 1284, landlord: 1091, pm: 193 };

// ── FORMATTERS ────────────────────────────────────────────────────────────────

export function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString("en-NG")}`;
}

export function fmtM(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  return `₦${(n / 1_000_000).toFixed(0)}M`;
}

// ── TYPES ─────────────────────────────────────────────────────────────────────

export type TenancyPoint  = { label: string; total: number; active: number; vacant: number };
export type RentPoint     = { label: string; collected: number; expected: number };
export type CountPoint    = { label: string; count: number };
export type MaintNVRPoint = { label: string; newRequests: number; resolved: number };

export type OverviewStatsRow = {
  totalProperties: number;
  activeTenancies: number;
  vacantProperties: number;
  rentCollected: number;
  rentExpected: number;
  maintenanceTotal: number;
  remindersSent: number;
  totalPropertiesDelta: number;
  activeTenanciesDelta: number;
  vacantPropertiesDelta: number;
  rentCollectedDeltaPct: number;
  maintenanceDelta: number;
  remindersDelta: number;
};

// ── TENANCY SERIES (active + vacant = total always) ───────────────────────────
// Weekly: last 12 weeks (Mon dates), current = week of Oct 20 2026
// Monthly: last 12 months (Nov 2025 - Oct 2026)
// Yearly: last 5 years (2022-2026 YTD)

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

export function getTenancyChartSeries(period: Period, filter: AccountType): TenancyPoint[] {
  const base = BASE_TENANCY[period];
  if (filter === "all") return base;
  const targetTotal = TOTAL_PROPS[filter];
  return base.map((d) => {
    const filteredTotal = Math.round((d.total / 1284) * targetTotal);
    const scaledActive  = Math.round((d.active / d.total) * filteredTotal);
    return { label: d.label, total: filteredTotal, active: scaledActive, vacant: filteredTotal - scaledActive };
  });
}

// ── RENT SERIES ───────────────────────────────────────────────────────────────

const BASE_RENT: Record<Period, RentPoint[]> = {
  weekly: [
    { label: "Aug 4",  collected: 66_200_000, expected: 69_800_000 },
    { label: "Aug 11", collected: 68_400_000, expected: 72_100_000 },
    { label: "Aug 18", collected: 70_100_000, expected: 73_800_000 },
    { label: "Aug 25", collected: 72_300_000, expected: 76_100_000 },
    { label: "Sep 1",  collected: 69_800_000, expected: 73_500_000 },
    { label: "Sep 8",  collected: 71_200_000, expected: 74_900_000 },
    { label: "Sep 15", collected: 73_400_000, expected: 77_200_000 },
    { label: "Sep 22", collected: 68_100_000, expected: 71_900_000 },
    { label: "Sep 29", collected: 70_700_000, expected: 74_400_000 },
    { label: "Oct 6",  collected: 67_900_000, expected: 71_500_000 },
    { label: "Oct 13", collected: 70_700_000, expected: 74_500_000 },
    { label: "Oct 20", collected: 73_200_000, expected: 77_400_000 },
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

export function getRentChartSeries(period: Period, filter: AccountType): RentPoint[] {
  const m = RENT_MULT[filter];
  return BASE_RENT[period].map((d) => ({
    label: d.label,
    collected: Math.round(d.collected * m),
    expected:  Math.round(d.expected  * m),
  }));
}

export const getRentSeries = getRentChartSeries;

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

export function getMaintenanceNvsR(period: Period, filter: AccountType): MaintNVRPoint[] {
  const m = MAINT_MULT[filter];
  return BASE_MAINT_NVR[period].map((d) => ({
    label: d.label,
    newRequests: Math.round(d.newRequests * m),
    resolved:    Math.round(d.resolved    * m),
  }));
}

export function getMaintenanceChartSeries(period: Period, filter: AccountType): CountPoint[] {
  return getMaintenanceNvsR(period, filter).map((d) => ({ label: d.label, count: d.newRequests }));
}

export const getMaintenanceWeekly = getMaintenanceNvsR;

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

export function getRemindersChartSeries(period: Period, filter: AccountType): CountPoint[] {
  const m = REMIND_MULT[filter];
  return BASE_REMINDERS[period].map((d) => ({ label: d.label, count: Math.round(d.count * m) }));
}

export const getRemindersSeries = getRemindersChartSeries;

// ── OVERVIEW STATS (computed from series — guaranteed consistent) ──────────────

export function getOverviewStats(period: Period, filter: AccountType): OverviewStatsRow {
  const tenancy   = getTenancyChartSeries(period, filter);
  const rent      = getRentChartSeries(period, filter);
  const maint     = getMaintenanceChartSeries(period, filter);
  const reminders = getRemindersChartSeries(period, filter);

  const cur  = tenancy[tenancy.length - 1];
  const prev = tenancy[tenancy.length - 2];
  const curR  = rent[rent.length - 1];
  const prevR = rent[rent.length - 2];
  const curM  = maint[maint.length - 1];
  const prevM = maint[maint.length - 2];
  const curRem  = reminders[reminders.length - 1];
  const prevRem = reminders[reminders.length - 2];

  const rentDeltaPct = parseFloat(
    (((curR.collected - prevR.collected) / prevR.collected) * 100).toFixed(1)
  );

  return {
    totalProperties:       cur.total,
    activeTenancies:       cur.active,
    vacantProperties:      cur.vacant,
    rentCollected:         curR.collected,
    rentExpected:          curR.expected,
    maintenanceTotal:      curM.count,
    remindersSent:         curRem.count,
    totalPropertiesDelta:  cur.total  - prev.total,
    activeTenanciesDelta:  cur.active - prev.active,
    vacantPropertiesDelta: cur.vacant - prev.vacant,
    rentCollectedDeltaPct: rentDeltaPct,
    maintenanceDelta:      curM.count  - prevM.count,
    remindersDelta:        curRem.count - prevRem.count,
  };
}

// ── LATE PAYMENTS ─────────────────────────────────────────────────────────────

const BASE_LATE: Record<Period, {
  count: number; totalAmount: number;
  aging: Array<{ label: string; count: number; amount: number }>;
}> = {
  weekly: {
    count: 22, totalAmount: 10_600_000,
    aging: [
      { label: "1 to 7 days",  count: 10, amount: 3_600_000 },
      { label: "8 to 30 days", count: 8,  amount: 4_500_000 },
      { label: "30+ days",     count: 4,  amount: 2_500_000 },
    ],
  },
  monthly: {
    count: 87, totalAmount: 42_300_000,
    aging: [
      { label: "1 to 7 days",  count: 38, amount: 14_200_000 },
      { label: "8 to 30 days", count: 31, amount: 18_100_000 },
      { label: "30+ days",     count: 18, amount: 10_000_000 },
    ],
  },
  yearly: {
    count: 687, totalAmount: 384_100_000,
    aging: [
      { label: "1 to 7 days",  count: 271, amount: 98_700_000  },
      { label: "8 to 30 days", count: 253, amount: 162_300_000 },
      { label: "30+ days",     count: 163, amount: 123_100_000 },
    ],
  },
};

export function getLatePayments(period: Period, filter: AccountType) {
  const m    = RENT_MULT[filter];
  const base = BASE_LATE[period];
  return {
    count:       Math.round(base.count * m),
    totalAmount: Math.round(base.totalAmount * m),
    aging: base.aging.map((b) => ({
      label: b.label,
      count:  Math.round(b.count  * m),
      amount: Math.round(b.amount * m),
    })),
  };
}

// ── OVERDUE TENANCIES ─────────────────────────────────────────────────────────

export const OVERDUE_TENANCIES = [
  { tenant: "Tunde Akinwale",  property: "Royal Gardens — Unit 1",    amount: 3_750_000, daysOverdue: 62 },
  { tenant: "Emeka Chukwu",    property: "Cedar Park — Unit 3B",      amount: 1_200_000, daysOverdue: 48 },
  { tenant: "Fatima Bello",    property: "Ocean View — Unit 5A",      amount: 2_100_000, daysOverdue: 35 },
  { tenant: "Olawale Adeyemi", property: "Palm Grove — Unit 2C",      amount: 1_800_000, daysOverdue: 28 },
  { tenant: "Grace Nwankwo",   property: "Surulere Court — Unit 1",   amount: 950_000,   daysOverdue: 19 },
  { tenant: "Kemi Ibrahim",    property: "Maple Court — Unit 8D",     amount: 1_500_000, daysOverdue: 14 },
  { tenant: "Chidi Obi",       property: "Sapphire Heights — Unit 2A",amount: 850_000,   daysOverdue: 9  },
];

// ── LONGEST VACANT PROPERTIES ─────────────────────────────────────────────────

export const LONGEST_VACANT_PROPERTIES = [
  { name: "Cedar Park",    unit: "Unit 7",  area: "Magodo",   daysVacant: 89 },
  { name: "Sunset Villas", unit: "Unit 3B", area: "Surulere", daysVacant: 74 },
  { name: "Palm Grove",    unit: "Unit 2A", area: "Ajah",     daysVacant: 61 },
  { name: "Ocean View",    unit: "Unit 4C", area: "Ikate",    daysVacant: 53 },
  { name: "Maple Court",   unit: "Unit 5D", area: "Lekki",    daysVacant: 47 },
];

// ── OCCUPANCY ─────────────────────────────────────────────────────────────────

const BASE_AVG_VACANCY: Record<Period, { avgDaysVacant: number; readyForMarketing: number }> = {
  weekly:  { avgDaysVacant: 32, readyForMarketing: 26 },
  monthly: { avgDaysVacant: 34, readyForMarketing: 28 },
  yearly:  { avgDaysVacant: 42, readyForMarketing: 38 },
};

export function getOccupancyStats(period: Period, filter: AccountType) {
  const last = getTenancyChartSeries(period, filter).at(-1)!;
  const meta = BASE_AVG_VACANCY[period];
  const prev = getTenancyChartSeries(period, filter).at(-2)!;
  const rateDelta = parseFloat(
    ((last.active / last.total - prev.active / prev.total) * 100).toFixed(1)
  );
  return {
    total:              last.total,
    active:             last.active,
    vacant:             last.vacant,
    rate:               parseFloat(((last.active / last.total) * 100).toFixed(1)),
    rateDelta,
    avgDaysVacant:      meta.avgDaysVacant,
    readyForMarketing:  Math.round(meta.readyForMarketing * RENT_MULT[filter]),
  };
}

export function getOccupancyRateTrend(period: Period, filter: AccountType) {
  return getTenancyChartSeries(period, filter).map((d) => ({
    label: d.label,
    rate:  parseFloat(((d.active / d.total) * 100).toFixed(1)),
  }));
}

// ── VACANCY BY AREA ───────────────────────────────────────────────────────────

const BASE_VACANCY_BY_AREA: Record<Period, Array<{ area: string; vacant: number; total: number }>> = {
  weekly: [
    { area: "Lekki",           vacant: 24, total: 412 },
    { area: "Victoria Island", vacant: 8,  total: 198 },
    { area: "Ikoyi",           vacant: 11, total: 142 },
    { area: "Surulere",        vacant: 9,  total: 52  },
    { area: "Ajah",            vacant: 31, total: 224 },
  ],
  monthly: [
    { area: "Lekki",           vacant: 24, total: 412 },
    { area: "Victoria Island", vacant: 8,  total: 198 },
    { area: "Ikoyi",           vacant: 11, total: 142 },
    { area: "Surulere",        vacant: 9,  total: 52  },
    { area: "Ajah",            vacant: 31, total: 224 },
  ],
  yearly: [
    { area: "Lekki",           vacant: 34, total: 412 },
    { area: "Victoria Island", vacant: 9,  total: 198 },
    { area: "Ikoyi",           vacant: 14, total: 142 },
    { area: "Surulere",        vacant: 11, total: 52  },
    { area: "Ajah",            vacant: 41, total: 224 },
  ],
};

export function getVacancyByArea(period: Period, filter: AccountType) {
  const m = RENT_MULT[filter];
  return BASE_VACANCY_BY_AREA[period].map((d) => ({
    area:   d.area,
    vacant: Math.round(d.vacant * m),
    total:  Math.round(d.total  * m),
  }));
}

// ── MAINTENANCE STATS ─────────────────────────────────────────────────────────

const BASE_MAINT_STATS: Record<Period, {
  total: number; open: number; inProgress: number; resolved: number;
  avgResolutionDays: number; reopenRate: number;
}> = {
  weekly:  { total: 22,  open: 8,  inProgress: 5,  resolved: 9,   avgResolutionDays: 3.8, reopenRate: 4.2 },
  monthly: { total: 87,  open: 34, inProgress: 20, resolved: 33,  avgResolutionDays: 3.8, reopenRate: 4.2 },
  yearly:  { total: 876, open: 34, inProgress: 20, resolved: 822, avgResolutionDays: 4.3, reopenRate: 5.2 },
};

export function getMaintenanceStats(period: Period, filter: AccountType) {
  const m    = MAINT_MULT[filter];
  const base = BASE_MAINT_STATS[period];
  const total       = Math.round(base.total      * m);
  const open        = Math.round(base.open        * m);
  const inProgress  = Math.round(base.inProgress  * m);
  return {
    total, open, inProgress,
    resolved: Math.max(0, total - open - inProgress),
    avgResolutionDays: base.avgResolutionDays,
    reopenRate:        base.reopenRate,
  };
}

// ── FM PERFORMANCE ────────────────────────────────────────────────────────────

export const FM_PERFORMANCE: Record<Period, Array<{
  name: string; assigned: number; resolved: number;
  avgResolutionHours: number; reopened: number; confirmLagHours: number;
}>> = {
  weekly: [
    { name: "Sade Williams",  assigned: 10, resolved: 7,  avgResolutionHours: 3.8, reopened: 1, confirmLagHours: 1.8 },
    { name: "Jide Akinola",   assigned: 8,  resolved: 6,  avgResolutionHours: 4.2, reopened: 0, confirmLagHours: 2.1 },
    { name: "Kola Adeyemi",   assigned: 6,  resolved: 5,  avgResolutionHours: 4.7, reopened: 0, confirmLagHours: 3.2 },
    { name: "Amaka Okonkwo",  assigned: 5,  resolved: 4,  avgResolutionHours: 5.4, reopened: 1, confirmLagHours: 2.5 },
    { name: "Emeka Obi",      assigned: 5,  resolved: 4,  avgResolutionHours: 5.1, reopened: 0, confirmLagHours: 2.8 },
  ],
  monthly: [
    { name: "Sade Williams",  assigned: 38, resolved: 29, avgResolutionHours: 3.8, reopened: 2, confirmLagHours: 1.8 },
    { name: "Jide Akinola",   assigned: 31, resolved: 24, avgResolutionHours: 4.2, reopened: 1, confirmLagHours: 2.1 },
    { name: "Kola Adeyemi",   assigned: 24, resolved: 19, avgResolutionHours: 4.7, reopened: 0, confirmLagHours: 3.2 },
    { name: "Amaka Okonkwo",  assigned: 21, resolved: 17, avgResolutionHours: 5.4, reopened: 2, confirmLagHours: 2.5 },
    { name: "Emeka Obi",      assigned: 18, resolved: 14, avgResolutionHours: 5.1, reopened: 1, confirmLagHours: 2.8 },
  ],
  yearly: [
    { name: "Sade Williams",  assigned: 412, resolved: 364, avgResolutionHours: 4.2, reopened: 18, confirmLagHours: 2.0 },
    { name: "Jide Akinola",   assigned: 348, resolved: 294, avgResolutionHours: 4.6, reopened: 15, confirmLagHours: 2.4 },
    { name: "Kola Adeyemi",   assigned: 274, resolved: 241, avgResolutionHours: 5.2, reopened: 9,  confirmLagHours: 3.5 },
    { name: "Amaka Okonkwo",  assigned: 241, resolved: 198, avgResolutionHours: 5.9, reopened: 22, confirmLagHours: 2.8 },
    { name: "Emeka Obi",      assigned: 201, resolved: 164, avgResolutionHours: 5.5, reopened: 12, confirmLagHours: 3.1 },
  ],
};

// ── COMMUNICATIONS ────────────────────────────────────────────────────────────

const BASE_COMMS_TREND: Record<Period, Array<{ label: string; sent: number; delivered: number; read: number }>> = {
  weekly: [
    { label: "Aug 4",  sent: 840,  delivered: 804,  read: 712  },
    { label: "Aug 11", sent: 920,  delivered: 880,  read: 778  },
    { label: "Aug 18", sent: 1020, delivered: 975,  read: 861  },
    { label: "Aug 25", sent: 960,  delivered: 918,  read: 810  },
    { label: "Sep 1",  sent: 1080, delivered: 1032, read: 913  },
    { label: "Sep 8",  sent: 990,  delivered: 947,  read: 835  },
    { label: "Sep 15", sent: 1130, delivered: 1080, read: 952  },
    { label: "Sep 22", sent: 1010, delivered: 966,  read: 851  },
    { label: "Sep 29", sent: 940,  delivered: 899,  read: 793  },
    { label: "Oct 6",  sent: 1110, delivered: 1061, read: 934  },
    { label: "Oct 13", sent: 1020, delivered: 975,  read: 861  },
    { label: "Oct 20", sent: 1080, delivered: 1032, read: 913  },
  ],
  monthly: [
    { label: "Nov", sent: 2841,  delivered: 2698,  read: 2341 },
    { label: "Dec", sent: 3124,  delivered: 2967,  read: 2572 },
    { label: "Jan", sent: 3287,  delivered: 3118,  read: 2724 },
    { label: "Feb", sent: 3412,  delivered: 3241,  read: 2836 },
    { label: "Mar", sent: 3681,  delivered: 3497,  read: 3062 },
    { label: "Apr", sent: 3842,  delivered: 3650,  read: 3203 },
    { label: "May", sent: 4012,  delivered: 3811,  read: 3372 },
    { label: "Jun", sent: 4128,  delivered: 3922,  read: 3458 },
    { label: "Jul", sent: 4284,  delivered: 4070,  read: 3591 },
    { label: "Aug", sent: 4012,  delivered: 3811,  read: 3372 },
    { label: "Sep", sent: 4284,  delivered: 4102,  read: 3618 },
    { label: "Oct", sent: 4551,  delivered: 4330,  read: 3723 },
  ],
  yearly: [
    { label: "2022", sent: 28_100, delivered: 26_800, read: 23_200 },
    { label: "2023", sent: 32_400, delivered: 30_800, read: 26_700 },
    { label: "2024", sent: 38_900, delivered: 36_900, read: 32_000 },
    { label: "2025", sent: 43_700, delivered: 41_400, read: 35_800 },
    { label: "2026", sent: 47_312, delivered: 44_872, read: 38_587 },
  ],
};

export function getCommsTrend(period: Period, filter: AccountType) {
  const m = REMIND_MULT[filter];
  return BASE_COMMS_TREND[period].map((d) => ({
    label:     d.label,
    sent:      Math.round(d.sent      * m),
    delivered: Math.round(d.delivered * m),
    read:      Math.round(d.read      * m),
  }));
}

const BASE_COMMS_META: Record<Period, {
  deliveryRate: number; readRate: number; broadcasts: number;
  onboardingRate: number;
}> = {
  weekly:  { deliveryRate: 95.6, readRate: 84.5, broadcasts: 3,   onboardingRate: 79.0 },
  monthly: { deliveryRate: 95.8, readRate: 88.2, broadcasts: 12,  onboardingRate: 79.0 },
  yearly:  { deliveryRate: 94.8, readRate: 86.0, broadcasts: 108, onboardingRate: 81.5 },
};

export function getCommsStats(period: Period, filter: AccountType) {
  const m    = REMIND_MULT[filter];
  const meta = BASE_COMMS_META[period];
  const last = getCommsTrend(period, filter).at(-1)!;
  const ob   = getOnboardingTrend(period, filter).at(-1)!;
  return {
    sent:               last.sent,
    delivered:          last.delivered,
    read:               last.read,
    deliveryRate:       meta.deliveryRate,
    readRate:           meta.readRate,
    broadcasts:         Math.round(meta.broadcasts * m),
    invitedResidents:   ob.invited,
    onboardedResidents: ob.onboarded,
    onboardingRate:     meta.onboardingRate,
  };
}

const BASE_ONBOARDING: Record<Period, Array<{ label: string; invited: number; onboarded: number }>> = {
  weekly: [
    { label: "Aug 4",  invited: 8,  onboarded: 6  },
    { label: "Aug 11", invited: 7,  onboarded: 6  },
    { label: "Aug 18", invited: 9,  onboarded: 7  },
    { label: "Aug 25", invited: 8,  onboarded: 6  },
    { label: "Sep 1",  invited: 10, onboarded: 8  },
    { label: "Sep 8",  invited: 7,  onboarded: 6  },
    { label: "Sep 15", invited: 9,  onboarded: 7  },
    { label: "Sep 22", invited: 8,  onboarded: 6  },
    { label: "Sep 29", invited: 7,  onboarded: 5  },
    { label: "Oct 6",  invited: 9,  onboarded: 7  },
    { label: "Oct 13", invited: 8,  onboarded: 6  },
    { label: "Oct 20", invited: 9,  onboarded: 7  },
  ],
  monthly: [
    { label: "Nov", invited: 84,  onboarded: 68  },
    { label: "Dec", invited: 91,  onboarded: 72  },
    { label: "Jan", invited: 78,  onboarded: 61  },
    { label: "Feb", invited: 96,  onboarded: 79  },
    { label: "Mar", invited: 108, onboarded: 88  },
    { label: "Apr", invited: 112, onboarded: 93  },
    { label: "May", invited: 119, onboarded: 97  },
    { label: "Jun", invited: 124, onboarded: 102 },
    { label: "Jul", invited: 131, onboarded: 107 },
    { label: "Aug", invited: 112, onboarded: 91  },
    { label: "Sep", invited: 105, onboarded: 87  },
    { label: "Oct", invited: 124, onboarded: 98  },
  ],
  yearly: [
    { label: "2022", invited: 820,  onboarded: 641  },
    { label: "2023", invited: 974,  onboarded: 779  },
    { label: "2024", invited: 1082, onboarded: 874  },
    { label: "2025", invited: 1193, onboarded: 971  },
    { label: "2026", invited: 1284, onboarded: 1047 },
  ],
};

export function getOnboardingTrend(period: Period, filter: AccountType) {
  const m = REMIND_MULT[filter];
  return BASE_ONBOARDING[period].map((d) => ({
    label:     d.label,
    invited:   Math.round(d.invited   * m),
    onboarded: Math.round(d.onboarded * m),
  }));
}
