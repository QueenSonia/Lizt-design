import type { DateRange } from "@/lib/analyticsDateStore";

export const TODAY = "2026-10-23";

export const MOCK_LANDLORDS = [
  { id: "all", name: "All landlords" },
  { id: "ll-001", name: "Babajide Sanwo-Olu" },
  { id: "ll-002", name: "Adunni Coker" },
  { id: "ll-003", name: "Olamide Bakare" },
  { id: "ll-004", name: "Chinwe Uzor" },
];

// ── OVERVIEW ─────────────────────────────────────────────────────────────────

export const OVERVIEW_STATS: Record<DateRange, {
  totalProperties: number;
  propertiesDelta: number;
  occupancyRate: number;
  occupancyDelta: number;
  rentCollected: number;
  rentExpected: number;
  openMaintenance: number;
  maintenanceDelta: number;
  messagesSent: number;
  messagesDelta: number;
}> = {
  "30d": {
    totalProperties: 1284, propertiesDelta: +3,
    occupancyRate: 92.8, occupancyDelta: +0.6,
    rentCollected: 284_500_000, rentExpected: 300_700_000,
    openMaintenance: 132, maintenanceDelta: -8,
    messagesSent: 4284, messagesDelta: +312,
  },
  "90d": {
    totalProperties: 1284, propertiesDelta: +8,
    occupancyRate: 92.3, occupancyDelta: +1.8,
    rentCollected: 848_500_000, rentExpected: 894_200_000,
    openMaintenance: 132, maintenanceDelta: -21,
    messagesSent: 12847, messagesDelta: +2184,
  },
  "12m": {
    totalProperties: 1284, propertiesDelta: +31,
    occupancyRate: 90.1, occupancyDelta: +3.6,
    rentCollected: 3_002_500_000, rentExpected: 3_207_700_000,
    openMaintenance: 132, maintenanceDelta: -47,
    messagesSent: 47312, messagesDelta: +8943,
  },
};

export const OVERVIEW_REVENUE_TREND: Record<DateRange, Array<{ label: string; value: number }>> = {
  "30d": [
    { label: "Wk 1", value: 68_400_000 },
    { label: "Wk 2", value: 72_300_000 },
    { label: "Wk 3", value: 74_600_000 },
    { label: "Wk 4", value: 69_200_000 },
  ],
  "90d": [
    { label: "Aug", value: 281_000_000 },
    { label: "Sep", value: 283_000_000 },
    { label: "Oct", value: 284_500_000 },
  ],
  "12m": [
    { label: "Nov", value: 218_000_000 },
    { label: "Dec", value: 225_000_000 },
    { label: "Jan", value: 198_000_000 },
    { label: "Feb", value: 204_000_000 },
    { label: "Mar", value: 241_000_000 },
    { label: "Apr", value: 258_000_000 },
    { label: "May", value: 263_000_000 },
    { label: "Jun", value: 271_000_000 },
    { label: "Jul", value: 276_000_000 },
    { label: "Aug", value: 281_000_000 },
    { label: "Sep", value: 283_000_000 },
    { label: "Oct", value: 284_500_000 },
  ],
};

export const OVERVIEW_OCCUPANCY_TREND: Record<DateRange, Array<{ label: string; value: number }>> = {
  "30d": [
    { label: "Wk 1", value: 92.1 },
    { label: "Wk 2", value: 92.4 },
    { label: "Wk 3", value: 92.6 },
    { label: "Wk 4", value: 92.8 },
  ],
  "90d": [
    { label: "Aug", value: 91.8 },
    { label: "Sep", value: 92.2 },
    { label: "Oct", value: 92.8 },
  ],
  "12m": [
    { label: "Nov", value: 87.2 },
    { label: "Dec", value: 87.8 },
    { label: "Jan", value: 86.4 },
    { label: "Feb", value: 87.1 },
    { label: "Mar", value: 88.6 },
    { label: "Apr", value: 89.4 },
    { label: "May", value: 90.1 },
    { label: "Jun", value: 90.7 },
    { label: "Jul", value: 91.2 },
    { label: "Aug", value: 91.8 },
    { label: "Sep", value: 92.2 },
    { label: "Oct", value: 92.8 },
  ],
};

export const OVERVIEW_MAINTENANCE_TREND: Record<DateRange, Array<{ label: string; value: number }>> = {
  "30d": [
    { label: "Wk 1", value: 148 },
    { label: "Wk 2", value: 141 },
    { label: "Wk 3", value: 138 },
    { label: "Wk 4", value: 132 },
  ],
  "90d": [
    { label: "Aug", value: 162 },
    { label: "Sep", value: 148 },
    { label: "Oct", value: 132 },
  ],
  "12m": [
    { label: "Nov", value: 192 },
    { label: "Dec", value: 187 },
    { label: "Jan", value: 201 },
    { label: "Feb", value: 194 },
    { label: "Mar", value: 178 },
    { label: "Apr", value: 171 },
    { label: "May", value: 164 },
    { label: "Jun", value: 158 },
    { label: "Jul", value: 152 },
    { label: "Aug", value: 162 },
    { label: "Sep", value: 148 },
    { label: "Oct", value: 132 },
  ],
};

// ── RENT & PAYMENTS ───────────────────────────────────────────────────────────

export const RENT_COLLECTED_SERIES: Record<DateRange, Array<{ label: string; collected: number; expected: number }>> = {
  "30d": [
    { label: "Wk 1", collected: 68_400_000, expected: 73_200_000 },
    { label: "Wk 2", collected: 72_300_000, expected: 76_800_000 },
    { label: "Wk 3", collected: 74_600_000, expected: 78_400_000 },
    { label: "Wk 4", collected: 69_200_000, expected: 72_300_000 },
  ],
  "90d": [
    { label: "Aug", collected: 281_000_000, expected: 295_000_000 },
    { label: "Sep", collected: 283_000_000, expected: 298_000_000 },
    { label: "Oct", collected: 284_500_000, expected: 300_700_000 },
  ],
  "12m": [
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
    { label: "Sep", collected: 283_000_000, expected: 298_000_000 },
    { label: "Oct", collected: 284_500_000, expected: 300_700_000 },
  ],
};

export const COLLECTION_RATE: Record<DateRange, number> = {
  "30d": 94.6,
  "90d": 94.9,
  "12m": 93.6,
};

export const LATE_PAYMENT_STATS: Record<DateRange, {
  count: number;
  totalAmount: number;
  aging: Array<{ label: string; count: number; amount: number }>;
}> = {
  "30d": {
    count: 87,
    totalAmount: 42_300_000,
    aging: [
      { label: "1 to 7 days", count: 38, amount: 14_200_000 },
      { label: "8 to 30 days", count: 31, amount: 18_100_000 },
      { label: "30+ days", count: 18, amount: 10_000_000 },
    ],
  },
  "90d": {
    count: 224,
    totalAmount: 118_600_000,
    aging: [
      { label: "1 to 7 days", count: 89, amount: 32_400_000 },
      { label: "8 to 30 days", count: 82, amount: 51_200_000 },
      { label: "30+ days", count: 53, amount: 35_000_000 },
    ],
  },
  "12m": {
    count: 687,
    totalAmount: 384_100_000,
    aging: [
      { label: "1 to 7 days", count: 271, amount: 98_700_000 },
      { label: "8 to 30 days", count: 253, amount: 162_300_000 },
      { label: "30+ days", count: 163, amount: 123_100_000 },
    ],
  },
};

export const OVERDUE_TENANCIES = [
  { tenant: "Tunde Akinwale", property: "Royal Gardens — Unit 1", amount: 3_750_000, daysOverdue: 62 },
  { tenant: "Emeka Chukwu", property: "Cedar Park — Unit 3B", amount: 1_200_000, daysOverdue: 48 },
  { tenant: "Fatima Bello", property: "Ocean View — Unit 5A", amount: 2_100_000, daysOverdue: 35 },
  { tenant: "Olawale Adeyemi", property: "Palm Grove — Unit 2C", amount: 1_800_000, daysOverdue: 28 },
  { tenant: "Grace Nwankwo", property: "Surulere Court — Unit 1", amount: 950_000, daysOverdue: 19 },
  { tenant: "Kemi Ibrahim", property: "Maple Court — Unit 8D", amount: 1_500_000, daysOverdue: 14 },
  { tenant: "Chidi Obi", property: "Sapphire Heights — Unit 2A", amount: 850_000, daysOverdue: 9 },
];

// ── OCCUPANCY ─────────────────────────────────────────────────────────────────

export const OCCUPANCY_STATS: Record<DateRange, {
  total: number;
  active: number;
  vacant: number;
  rate: number;
  rateDelta: number;
  avgDaysVacant: number;
  readyForMarketing: number;
}> = {
  "30d": { total: 1284, active: 1191, vacant: 93, rate: 92.8, rateDelta: +0.6, avgDaysVacant: 34, readyForMarketing: 28 },
  "90d": { total: 1284, active: 1185, vacant: 99, rate: 92.3, rateDelta: +1.8, avgDaysVacant: 38, readyForMarketing: 31 },
  "12m": { total: 1284, active: 1158, vacant: 126, rate: 90.2, rateDelta: +3.6, avgDaysVacant: 42, readyForMarketing: 38 },
};

export const OCCUPANCY_RATE_TREND: Record<DateRange, Array<{ label: string; rate: number }>> = {
  "30d": [
    { label: "Wk 1", rate: 92.1 },
    { label: "Wk 2", rate: 92.4 },
    { label: "Wk 3", rate: 92.6 },
    { label: "Wk 4", rate: 92.8 },
  ],
  "90d": [
    { label: "Aug", rate: 91.8 },
    { label: "Sep", rate: 92.2 },
    { label: "Oct", rate: 92.8 },
  ],
  "12m": [
    { label: "Nov", rate: 87.2 },
    { label: "Dec", rate: 87.8 },
    { label: "Jan", rate: 86.4 },
    { label: "Feb", rate: 87.1 },
    { label: "Mar", rate: 88.6 },
    { label: "Apr", rate: 89.4 },
    { label: "May", rate: 90.1 },
    { label: "Jun", rate: 90.7 },
    { label: "Jul", rate: 91.2 },
    { label: "Aug", rate: 91.8 },
    { label: "Sep", rate: 92.2 },
    { label: "Oct", rate: 92.8 },
  ],
};

export const VACANCY_BY_AREA: Record<DateRange, Array<{ area: string; vacant: number; total: number }>> = {
  "30d": [
    { area: "Lekki", vacant: 24, total: 412 },
    { area: "Victoria Island", vacant: 8, total: 198 },
    { area: "Ikoyi", vacant: 11, total: 142 },
    { area: "Surulere", vacant: 9, total: 52 },
    { area: "Ajah", vacant: 31, total: 224 },
  ],
  "90d": [
    { area: "Lekki", vacant: 27, total: 412 },
    { area: "Victoria Island", vacant: 8, total: 198 },
    { area: "Ikoyi", vacant: 12, total: 142 },
    { area: "Surulere", vacant: 10, total: 52 },
    { area: "Ajah", vacant: 34, total: 224 },
  ],
  "12m": [
    { area: "Lekki", vacant: 34, total: 412 },
    { area: "Victoria Island", vacant: 9, total: 198 },
    { area: "Ikoyi", vacant: 14, total: 142 },
    { area: "Surulere", vacant: 11, total: 52 },
    { area: "Ajah", vacant: 41, total: 224 },
  ],
};

// ── MAINTENANCE ───────────────────────────────────────────────────────────────

export const MAINTENANCE_STATS: Record<DateRange, {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResolutionDays: number;
  reopenRate: number;
}> = {
  "30d": { total: 87, open: 34, inProgress: 20, resolved: 33, avgResolutionDays: 3.8, reopenRate: 4.2 },
  "90d": { total: 241, open: 34, inProgress: 20, resolved: 187, avgResolutionDays: 4.1, reopenRate: 4.8 },
  "12m": { total: 876, open: 34, inProgress: 20, resolved: 822, avgResolutionDays: 4.3, reopenRate: 5.2 },
};

export const MAINTENANCE_WEEKLY: Record<DateRange, Array<{ label: string; newRequests: number; resolved: number }>> = {
  "30d": [
    { label: "Wk 1", newRequests: 22, resolved: 18 },
    { label: "Wk 2", newRequests: 19, resolved: 21 },
    { label: "Wk 3", newRequests: 24, resolved: 16 },
    { label: "Wk 4", newRequests: 22, resolved: 17 },
  ],
  "90d": [
    { label: "Aug W1", newRequests: 18, resolved: 14 },
    { label: "Aug W2", newRequests: 22, resolved: 19 },
    { label: "Aug W3", newRequests: 19, resolved: 21 },
    { label: "Aug W4", newRequests: 21, resolved: 16 },
    { label: "Sep W1", newRequests: 16, resolved: 18 },
    { label: "Sep W2", newRequests: 20, resolved: 17 },
    { label: "Sep W3", newRequests: 24, resolved: 21 },
    { label: "Sep W4", newRequests: 18, resolved: 19 },
    { label: "Oct W1", newRequests: 22, resolved: 18 },
    { label: "Oct W2", newRequests: 19, resolved: 21 },
    { label: "Oct W3", newRequests: 24, resolved: 16 },
    { label: "Oct W4", newRequests: 22, resolved: 17 },
  ],
  "12m": [
    { label: "Nov", newRequests: 84, resolved: 62 },
    { label: "Dec", newRequests: 91, resolved: 71 },
    { label: "Jan", newRequests: 88, resolved: 69 },
    { label: "Feb", newRequests: 76, resolved: 74 },
    { label: "Mar", newRequests: 82, resolved: 78 },
    { label: "Apr", newRequests: 71, resolved: 76 },
    { label: "May", newRequests: 68, resolved: 71 },
    { label: "Jun", newRequests: 74, resolved: 72 },
    { label: "Jul", newRequests: 79, resolved: 74 },
    { label: "Aug", newRequests: 80, resolved: 71 },
    { label: "Sep", newRequests: 77, resolved: 79 },
    { label: "Oct", newRequests: 87, resolved: 72 },
  ],
};

export const FM_PERFORMANCE: Record<DateRange, Array<{
  name: string;
  assigned: number;
  resolved: number;
  avgResolutionHours: number;
  reopened: number;
  confirmLagHours: number;
}>> = {
  "30d": [
    { name: "Sade Williams", assigned: 38, resolved: 29, avgResolutionHours: 3.8, reopened: 2, confirmLagHours: 1.8 },
    { name: "Jide Akinola", assigned: 31, resolved: 24, avgResolutionHours: 4.2, reopened: 1, confirmLagHours: 2.1 },
    { name: "Kola Adeyemi", assigned: 24, resolved: 19, avgResolutionHours: 4.7, reopened: 0, confirmLagHours: 3.2 },
    { name: "Amaka Okonkwo", assigned: 21, resolved: 17, avgResolutionHours: 5.4, reopened: 2, confirmLagHours: 2.5 },
    { name: "Emeka Obi", assigned: 18, resolved: 14, avgResolutionHours: 5.1, reopened: 1, confirmLagHours: 2.8 },
  ],
  "90d": [
    { name: "Sade Williams", assigned: 112, resolved: 94, avgResolutionHours: 4.1, reopened: 5, confirmLagHours: 1.9 },
    { name: "Jide Akinola", assigned: 94, resolved: 76, avgResolutionHours: 4.5, reopened: 4, confirmLagHours: 2.3 },
    { name: "Kola Adeyemi", assigned: 72, resolved: 62, avgResolutionHours: 5.1, reopened: 2, confirmLagHours: 3.4 },
    { name: "Amaka Okonkwo", assigned: 63, resolved: 51, avgResolutionHours: 5.8, reopened: 6, confirmLagHours: 2.7 },
    { name: "Emeka Obi", assigned: 54, resolved: 42, avgResolutionHours: 5.4, reopened: 3, confirmLagHours: 2.9 },
  ],
  "12m": [
    { name: "Sade Williams", assigned: 412, resolved: 364, avgResolutionHours: 4.2, reopened: 18, confirmLagHours: 2.0 },
    { name: "Jide Akinola", assigned: 348, resolved: 294, avgResolutionHours: 4.6, reopened: 15, confirmLagHours: 2.4 },
    { name: "Kola Adeyemi", assigned: 274, resolved: 241, avgResolutionHours: 5.2, reopened: 9, confirmLagHours: 3.5 },
    { name: "Amaka Okonkwo", assigned: 241, resolved: 198, avgResolutionHours: 5.9, reopened: 22, confirmLagHours: 2.8 },
    { name: "Emeka Obi", assigned: 201, resolved: 164, avgResolutionHours: 5.5, reopened: 12, confirmLagHours: 3.1 },
  ],
};

// ── COMMUNICATIONS ────────────────────────────────────────────────────────────

export const COMMS_STATS: Record<DateRange, {
  sent: number;
  delivered: number;
  read: number;
  deliveryRate: number;
  readRate: number;
  broadcasts: number;
  invitedResidents: number;
  onboardedResidents: number;
  onboardingRate: number;
}> = {
  "30d": {
    sent: 4284, delivered: 4102, read: 3618,
    deliveryRate: 95.8, readRate: 88.2,
    broadcasts: 12,
    invitedResidents: 124, onboardedResidents: 98, onboardingRate: 79.0,
  },
  "90d": {
    sent: 12847, delivered: 12264, read: 10713,
    deliveryRate: 95.5, readRate: 87.4,
    broadcasts: 34,
    invitedResidents: 341, onboardedResidents: 278, onboardingRate: 81.5,
  },
  "12m": {
    sent: 47312, delivered: 44872, read: 38587,
    deliveryRate: 94.8, readRate: 86.0,
    broadcasts: 108,
    invitedResidents: 1284, onboardedResidents: 1047, onboardingRate: 81.5,
  },
};

export const COMMS_TREND: Record<DateRange, Array<{ label: string; sent: number; delivered: number; read: number }>> = {
  "30d": [
    { label: "Wk 1", sent: 1024, delivered: 981, read: 862 },
    { label: "Wk 2", sent: 1142, delivered: 1094, read: 966 },
    { label: "Wk 3", sent: 1087, delivered: 1041, read: 921 },
    { label: "Wk 4", sent: 1031, delivered: 986, read: 869 },
  ],
  "90d": [
    { label: "Aug", sent: 4012, delivered: 3832, read: 3372 },
    { label: "Sep", sent: 4284, delivered: 4102, read: 3618 },
    { label: "Oct", sent: 4551, delivered: 4330, read: 3723 },
  ],
  "12m": [
    { label: "Nov", sent: 2841, delivered: 2698, read: 2341 },
    { label: "Dec", sent: 3124, delivered: 2967, read: 2572 },
    { label: "Jan", sent: 3287, delivered: 3118, read: 2724 },
    { label: "Feb", sent: 3412, delivered: 3241, read: 2836 },
    { label: "Mar", sent: 3681, delivered: 3497, read: 3062 },
    { label: "Apr", sent: 3842, delivered: 3650, read: 3203 },
    { label: "May", sent: 4012, delivered: 3811, read: 3372 },
    { label: "Jun", sent: 4128, delivered: 3922, read: 3458 },
    { label: "Jul", sent: 4284, delivered: 4070, read: 3591 },
    { label: "Aug", sent: 4012, delivered: 3811, read: 3372 },
    { label: "Sep", sent: 4284, delivered: 4102, read: 3618 },
    { label: "Oct", sent: 4551, delivered: 4330, read: 3723 },
  ],
};

export const ONBOARDING_TREND: Record<DateRange, Array<{ label: string; invited: number; onboarded: number }>> = {
  "30d": [
    { label: "Wk 1", invited: 32, onboarded: 24 },
    { label: "Wk 2", invited: 28, onboarded: 23 },
    { label: "Wk 3", invited: 34, onboarded: 27 },
    { label: "Wk 4", invited: 30, onboarded: 24 },
  ],
  "90d": [
    { label: "Aug", invited: 112, onboarded: 91 },
    { label: "Sep", invited: 105, onboarded: 87 },
    { label: "Oct", invited: 124, onboarded: 98 },
  ],
  "12m": [
    { label: "Nov", invited: 84, onboarded: 68 },
    { label: "Dec", invited: 91, onboarded: 72 },
    { label: "Jan", invited: 78, onboarded: 61 },
    { label: "Feb", invited: 96, onboarded: 79 },
    { label: "Mar", invited: 108, onboarded: 88 },
    { label: "Apr", invited: 112, onboarded: 93 },
    { label: "May", invited: 119, onboarded: 97 },
    { label: "Jun", invited: 124, onboarded: 102 },
    { label: "Jul", invited: 131, onboarded: 107 },
    { label: "Aug", invited: 112, onboarded: 91 },
    { label: "Sep", invited: 105, onboarded: 87 },
    { label: "Oct", invited: 124, onboarded: 98 },
  ],
};

// ── SHARED FORMATTERS ─────────────────────────────────────────────────────────

export function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString("en-NG")}`;
}

export function fmtM(n: number): string {
  return `₦${(n / 1_000_000).toFixed(0)}M`;
}
