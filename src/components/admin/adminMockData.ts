export const ADMIN_KPIS = {
  totalProperties: 1284,
  totalLandlords: 312,
  totalTenants: 4876,
  totalFacilityManagers: 84,
  occupancyRate: 91.4,
  pendingKyc: 47,
  openServiceRequests: 132,
  monthlyRevenue: 284_500_000,
  activeLeases: 4321,
};

export const REVENUE_TREND = [
  { month: "Jun", revenue: 198 },
  { month: "Jul", revenue: 214 },
  { month: "Aug", revenue: 235 },
  { month: "Sep", revenue: 248 },
  { month: "Oct", revenue: 263 },
  { month: "Nov", revenue: 271 },
  { month: "Dec", revenue: 284 },
];

export const RECENT_PAYMENTS = [
  {
    id: "PAY-10421",
    tenant: "Adebayo Ogundimu",
    property: "Maple Court, Lekki",
    amount: 1_500_000,
    status: "Successful",
    date: "2026-05-04",
    method: "Bank Transfer",
  },
  {
    id: "PAY-10420",
    tenant: "Ifeoma Eze",
    property: "Sapphire Heights, VI",
    amount: 850_000,
    status: "Successful",
    date: "2026-05-04",
    method: "Card",
  },
  {
    id: "PAY-10419",
    tenant: "Bashir Yusuf",
    property: "Palm Grove Estate",
    amount: 2_400_000,
    status: "Pending",
    date: "2026-05-03",
    method: "Bank Transfer",
  },
  {
    id: "PAY-10418",
    tenant: "Ngozi Okafor",
    property: "Ocean View Apartments",
    amount: 1_200_000,
    status: "Successful",
    date: "2026-05-03",
    method: "Paystack",
  },
  {
    id: "PAY-10417",
    tenant: "Tunde Akinwale",
    property: "Royal Gardens, Ikoyi",
    amount: 3_750_000,
    status: "Failed",
    date: "2026-05-02",
    method: "Card",
  },
];

export const ACTIVITY_FEED = [
  {
    id: "ACT-1",
    actor: "Babajide Sanwo-Olu",
    role: "Landlord",
    action: "added a new property",
    target: "Maple Court, Block C",
    time: "2 minutes ago",
    type: "property",
  },
  {
    id: "ACT-2",
    actor: "Jide Akinola",
    role: "Facility Manager",
    action: "resolved a maintenance request",
    target: "Plumbing — Unit 4B",
    time: "12 minutes ago",
    type: "service",
  },
  {
    id: "ACT-3",
    actor: "Adunni Coker",
    role: "Landlord",
    action: "approved KYC for",
    target: "Ifeoma Eze",
    time: "34 minutes ago",
    type: "kyc",
  },
  {
    id: "ACT-4",
    actor: "Bashir Yusuf",
    role: "Tenant",
    action: "submitted rent payment",
    target: "₦2,400,000",
    time: "1 hour ago",
    type: "payment",
  },
  {
    id: "ACT-5",
    actor: "System",
    role: "Platform",
    action: "auto-renewed lease for",
    target: "Tunde Akinwale",
    time: "2 hours ago",
    type: "lease",
  },
  {
    id: "ACT-6",
    actor: "Ngozi Okafor",
    role: "Tenant",
    action: "reported an issue",
    target: "AC not cooling — Unit 2A",
    time: "3 hours ago",
    type: "service",
  },
];

export const PROPERTIES = [
  {
    id: "PROP-001",
    name: "Maple Court",
    location: "Lekki Phase 1, Lagos",
    landlord: "Babajide Sanwo-Olu",
    units: 12,
    occupancy: 100,
    status: "Active",
  },
  {
    id: "PROP-002",
    name: "Sapphire Heights",
    location: "Victoria Island, Lagos",
    landlord: "Adunni Coker",
    units: 24,
    occupancy: 92,
    status: "Active",
  },
  {
    id: "PROP-003",
    name: "Palm Grove Estate",
    location: "Ajah, Lagos",
    landlord: "Babajide Sanwo-Olu",
    units: 36,
    occupancy: 88,
    status: "Active",
  },
  {
    id: "PROP-004",
    name: "Ocean View Apartments",
    location: "Ikate, Lagos",
    landlord: "Olamide Bakare",
    units: 18,
    occupancy: 75,
    status: "Active",
  },
  {
    id: "PROP-005",
    name: "Royal Gardens",
    location: "Ikoyi, Lagos",
    landlord: "Chinwe Uzor",
    units: 8,
    occupancy: 100,
    status: "Active",
  },
  {
    id: "PROP-006",
    name: "Cedar Park",
    location: "Magodo, Lagos",
    landlord: "Adunni Coker",
    units: 14,
    occupancy: 64,
    status: "Maintenance",
  },
];

export const LANDLORDS = [
  {
    id: "LL-001",
    name: "Babajide Sanwo-Olu",
    email: "babajide@lizt.co",
    phone: "+234 803 555 1234",
    properties: 4,
    tenants: 62,
    joined: "2024-03-12",
    status: "Active",
  },
  {
    id: "LL-002",
    name: "Adunni Coker",
    email: "adunni@lizt.co",
    phone: "+234 802 888 4521",
    properties: 6,
    tenants: 84,
    joined: "2024-05-02",
    status: "Active",
  },
  {
    id: "LL-003",
    name: "Olamide Bakare",
    email: "olamide@lizt.co",
    phone: "+234 805 222 9981",
    properties: 2,
    tenants: 28,
    joined: "2024-09-18",
    status: "Active",
  },
  {
    id: "LL-004",
    name: "Chinwe Uzor",
    email: "chinwe@lizt.co",
    phone: "+234 809 314 7763",
    properties: 1,
    tenants: 8,
    joined: "2025-01-22",
    status: "Pending",
  },
];

export const TENANTS = [
  {
    id: "TEN-001",
    name: "Adebayo Ogundimu",
    email: "adebayo@example.com",
    property: "Maple Court — Unit 3A",
    leaseEnd: "2026-12-31",
    rent: 1_500_000,
    status: "Active",
  },
  {
    id: "TEN-002",
    name: "Ifeoma Eze",
    email: "ifeoma@example.com",
    property: "Sapphire Heights — Unit 1B",
    leaseEnd: "2026-08-15",
    rent: 850_000,
    status: "Active",
  },
  {
    id: "TEN-003",
    name: "Bashir Yusuf",
    email: "bashir@example.com",
    property: "Palm Grove — Unit 5C",
    leaseEnd: "2026-06-30",
    rent: 2_400_000,
    status: "Renewing",
  },
  {
    id: "TEN-004",
    name: "Ngozi Okafor",
    email: "ngozi@example.com",
    property: "Ocean View — Unit 2A",
    leaseEnd: "2027-02-10",
    rent: 1_200_000,
    status: "Active",
  },
  {
    id: "TEN-005",
    name: "Tunde Akinwale",
    email: "tunde@example.com",
    property: "Royal Gardens — Unit 1",
    leaseEnd: "2026-05-30",
    rent: 3_750_000,
    status: "Overdue",
  },
];

export const FACILITY_MANAGERS = [
  {
    id: "FM-001",
    name: "Jide Akinola",
    email: "jide@lizt.co",
    propertiesAssigned: 3,
    openIssues: 4,
    resolvedThisMonth: 18,
    status: "Active",
  },
  {
    id: "FM-002",
    name: "Sade Williams",
    email: "sade@lizt.co",
    propertiesAssigned: 5,
    openIssues: 7,
    resolvedThisMonth: 24,
    status: "Active",
  },
  {
    id: "FM-003",
    name: "Emeka Obi",
    email: "emeka@lizt.co",
    propertiesAssigned: 2,
    openIssues: 1,
    resolvedThisMonth: 9,
    status: "Active",
  },
];

export const KYC_APPLICATIONS = [
  {
    id: "KYC-2041",
    applicant: "Funmi Ade",
    property: "Maple Court — Unit 6B",
    submitted: "2026-05-04",
    status: "Pending Review",
  },
  {
    id: "KYC-2040",
    applicant: "Daniel Eze",
    property: "Sapphire Heights — Unit 3D",
    submitted: "2026-05-04",
    status: "Pending Review",
  },
  {
    id: "KYC-2039",
    applicant: "Kemi Bello",
    property: "Palm Grove — Unit 2A",
    submitted: "2026-05-03",
    status: "Approved",
  },
  {
    id: "KYC-2038",
    applicant: "Sani Mohammed",
    property: "Cedar Park — Unit 1",
    submitted: "2026-05-02",
    status: "Rejected",
  },
];

export const SERVICE_REQUESTS = [
  {
    id: "SR-7841",
    tenant: "Ngozi Okafor",
    property: "Ocean View — Unit 2A",
    issue: "AC not cooling",
    priority: "High",
    status: "Open",
    submitted: "2026-05-04",
  },
  {
    id: "SR-7840",
    tenant: "Bashir Yusuf",
    property: "Palm Grove — Unit 5C",
    issue: "Water leak under sink",
    priority: "Medium",
    status: "In Progress",
    submitted: "2026-05-03",
  },
  {
    id: "SR-7839",
    tenant: "Adebayo Ogundimu",
    property: "Maple Court — Unit 3A",
    issue: "Power outlet not working",
    priority: "Low",
    status: "Resolved",
    submitted: "2026-05-02",
  },
  {
    id: "SR-7838",
    tenant: "Ifeoma Eze",
    property: "Sapphire Heights — Unit 1B",
    issue: "Broken window latch",
    priority: "Low",
    status: "Open",
    submitted: "2026-05-02",
  },
];

export const NOTIFICATIONS = [
  {
    id: "N-1",
    title: "47 KYC applications awaiting review",
    body: "Pending applications across 12 properties.",
    time: "10 min ago",
    severity: "warning",
  },
  {
    id: "N-2",
    title: "Payment failure spike detected",
    body: "8 failed payments in the last hour — above normal.",
    time: "32 min ago",
    severity: "critical",
  },
  {
    id: "N-3",
    title: "New landlord onboarded",
    body: "Chinwe Uzor completed onboarding.",
    time: "2 hours ago",
    severity: "info",
  },
  {
    id: "N-4",
    title: "Monthly report ready",
    body: "April 2026 platform report has been generated.",
    time: "Yesterday",
    severity: "info",
  },
];

export const ACTIVITY_LOGS = [
  {
    id: "LOG-9901",
    actor: "admin@lizt.co",
    action: "Updated platform settings",
    target: "Payment gateway config",
    ip: "102.89.34.21",
    time: "2026-05-05 09:14",
  },
  {
    id: "LOG-9900",
    actor: "babajide@lizt.co",
    action: "Created property",
    target: "Maple Court, Block C",
    ip: "197.210.55.118",
    time: "2026-05-05 08:42",
  },
  {
    id: "LOG-9899",
    actor: "jide@lizt.co",
    action: "Resolved maintenance request",
    target: "SR-7839",
    ip: "105.112.7.44",
    time: "2026-05-05 08:21",
  },
  {
    id: "LOG-9898",
    actor: "system",
    action: "Auto-renewed lease",
    target: "TEN-005",
    ip: "internal",
    time: "2026-05-05 07:00",
  },
];

// ─── Platform Intelligence Mock Data ───────────────────────────────

export const APARTMENT_TYPE_MIX = [
  { type: "1-Bedroom", count: 1842, share: 37.8 },
  { type: "2-Bedroom", count: 1654, share: 33.9 },
  { type: "3-Bedroom", count: 982, share: 20.1 },
  { type: "Studio", count: 261, share: 5.4 },
  { type: "4+ Bedroom", count: 137, share: 2.8 },
];

export const TENANT_GENDER = [
  { label: "Male", value: 54.2, color: "#FF5000" },
  { label: "Female", value: 43.6, color: "#1E293B" },
  { label: "Undisclosed", value: 2.2, color: "#94A3B8" },
];

export const TENANT_AGE_BANDS = [
  { band: "18–24", count: 312 },
  { band: "25–34", count: 2104 },
  { band: "35–44", count: 1486 },
  { band: "45–54", count: 692 },
  { band: "55+", count: 282 },
];

export const OCCUPANCY_TREND = [
  { month: "Jun", occupancy: 84.2 },
  { month: "Jul", occupancy: 86.1 },
  { month: "Aug", occupancy: 87.4 },
  { month: "Sep", occupancy: 88.9 },
  { month: "Oct", occupancy: 90.1 },
  { month: "Nov", occupancy: 90.7 },
  { month: "Dec", occupancy: 91.4 },
];

export const TENANT_GROWTH = [
  { month: "Jun", new: 218, churned: 41 },
  { month: "Jul", new: 264, churned: 52 },
  { month: "Aug", new: 312, churned: 47 },
  { month: "Sep", new: 298, churned: 61 },
  { month: "Oct", new: 341, churned: 58 },
  { month: "Nov", new: 376, churned: 49 },
  { month: "Dec", new: 412, churned: 54 },
];

export const KYC_FUNNEL = [
  { stage: "Submitted", count: 1284 },
  { stage: "In Review", count: 947 },
  { stage: "Approved", count: 812 },
  { stage: "Rejected", count: 135 },
];

export const KYC_RATES = {
  approvalRate: 85.7,
  rejectionRate: 14.3,
  avgReviewHours: 6.4,
  pendingOver48h: 12,
};

export const LOCATION_BREAKDOWN = [
  {
    area: "Lekki",
    properties: 412,
    occupancy: 94.2,
    avgRent: 2_400_000,
    vacancy: 5.8,
  },
  {
    area: "Victoria Island",
    properties: 198,
    occupancy: 96.1,
    avgRent: 4_100_000,
    vacancy: 3.9,
  },
  {
    area: "Ikoyi",
    properties: 142,
    occupancy: 92.8,
    avgRent: 5_800_000,
    vacancy: 7.2,
  },
  {
    area: "Yaba",
    properties: 167,
    occupancy: 89.4,
    avgRent: 1_200_000,
    vacancy: 10.6,
  },
  {
    area: "Ajah",
    properties: 224,
    occupancy: 86.2,
    avgRent: 950_000,
    vacancy: 13.8,
  },
  {
    area: "Magodo",
    properties: 89,
    occupancy: 78.4,
    avgRent: 1_650_000,
    vacancy: 21.6,
  },
  {
    area: "Surulere",
    properties: 52,
    occupancy: 81.7,
    avgRent: 800_000,
    vacancy: 18.3,
  },
];

export const TOP_PERFORMING_PROPERTIES = [
  {
    name: "Sapphire Heights",
    location: "Victoria Island",
    occupancy: 100,
    revenue: 24_600_000,
    score: 98,
  },
  {
    name: "Royal Gardens",
    location: "Ikoyi",
    occupancy: 100,
    revenue: 30_000_000,
    score: 96,
  },
  {
    name: "Maple Court",
    location: "Lekki",
    occupancy: 100,
    revenue: 18_000_000,
    score: 94,
  },
  {
    name: "Palm Grove Estate",
    location: "Ajah",
    occupancy: 88,
    revenue: 14_400_000,
    score: 87,
  },
];

export const PROBLEMATIC_PROPERTIES = [
  {
    name: "Cedar Park",
    location: "Magodo",
    openIssues: 14,
    avgResolutionDays: 6.2,
    risk: "High",
  },
  {
    name: "Ocean View",
    location: "Ikate",
    openIssues: 9,
    avgResolutionDays: 4.8,
    risk: "Medium",
  },
  {
    name: "Sunset Villas",
    location: "Surulere",
    openIssues: 7,
    avgResolutionDays: 5.1,
    risk: "Medium",
  },
];

export const FINANCIAL_HEALTH = {
  totalOverdue: 38_400_000,
  tenantsOwing: 142,
  avgArrearsDays: 17.2,
  collectionRate: 94.6,
  netRevenueMonth: 268_900_000,
  forecastNextMonth: 291_000_000,
};

export const AGING_BUCKETS = [
  { label: "1–7 days", amount: 8_200_000, count: 64 },
  { label: "8–30 days", amount: 14_500_000, count: 51 },
  { label: "31–60 days", amount: 9_700_000, count: 19 },
  { label: "60+ days", amount: 6_000_000, count: 8 },
];

export const LEASE_RENEWALS = {
  upForRenewal30d: 84,
  upForRenewal90d: 247,
  renewalRate: 78.4,
  declineRate: 9.2,
};

export const TOP_FACILITY_MANAGERS = [
  { name: "Sade Williams", resolved: 24, avgHours: 4.2, rating: 4.9 },
  { name: "Jide Akinola", resolved: 18, avgHours: 5.1, rating: 4.8 },
  { name: "Emeka Obi", resolved: 9, avgHours: 6.3, rating: 4.6 },
];

export const RISK_SIGNALS = [
  {
    label: "Failed payment spike",
    detail: "8 failures in last hour — 3.2× normal",
    severity: "critical" as const,
  },
  {
    label: "KYC backlog growing",
    detail: "12 applications pending > 48h",
    severity: "warning" as const,
  },
  {
    label: "Cedar Park service load",
    detail: "14 open issues — flag for FM review",
    severity: "warning" as const,
  },
  {
    label: "Magodo vacancy climbing",
    detail: "Vacancy at 21.6% — up 4pp this month",
    severity: "warning" as const,
  },
];

export const REPORTS = [
  {
    id: "RPT-2026-04",
    name: "April 2026 — Platform Overview",
    type: "Monthly",
    generated: "2026-05-01",
    size: "2.4 MB",
  },
  {
    id: "RPT-2026-Q1",
    name: "Q1 2026 — Revenue & Occupancy",
    type: "Quarterly",
    generated: "2026-04-02",
    size: "5.1 MB",
  },
  {
    id: "RPT-2026-03",
    name: "March 2026 — Service Operations",
    type: "Monthly",
    generated: "2026-04-01",
    size: "1.8 MB",
  },
  {
    id: "RPT-2026-02",
    name: "February 2026 — KYC Compliance",
    type: "Monthly",
    generated: "2026-03-01",
    size: "1.2 MB",
  },
];
