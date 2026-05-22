// Mock data for the Facility Manager design — values were authored
// alongside the original sandbox app at Facility Manager/lizt-dashboard.jsx.

export interface FmProperty {
  id: string;
  name: string;
  loc: string;
  assigned: boolean;
  active: number;
  tenant: string;
  tenancyStart: string;
  tenancyEnd: string;
  frequency: string;
}

export interface FmTenant {
  id: string;
  name: string;
  property: string;
  phone: string;
  start: string;
  end: string;
}

export type FmIssueStatus = "open" | "in_progress" | "resolved" | "not_approved";

export interface FmResolution {
  hadCost: boolean | null;
  costAmount: string;
  artisanName?: string;
  artisanPhone?: string;
  summary: string;
  category: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface FmIssue {
  id: string;
  title: string;
  property: string;
  propertyId: string;
  tenant: string;
  phone: string;
  status: FmIssueStatus;
  desc: string;
  time: number;
  media: string | null;
  ref?: string;
  resolution?: FmResolution;
}

export interface FmFeedItem {
  id: string;
  type: "issue_reported" | "issue_opened" | "issue_resolved" | "issue_reopened";
  entity: string;
  property: string;
  issueId?: string;
  time: number;
}

export interface FmCommonArea {
  id: string;
  name: string;
}

export type FmCaRequestStatus =
  | "pending"
  | "approved"
  | "not_resolved"
  | "resolved";

export interface FmCaRequest {
  id: string;
  caId: string;
  title: string;
  desc: string;
  time: number;
  status: FmCaRequestStatus;
  resolution?: FmResolution;
}

export const PROPS_DATA: FmProperty[] = [
  { id: "p1", name: "Greenfield Towers", loc: "Victoria Island, Lagos", assigned: true, active: 4, tenant: "Mr. Kolade Fashola", tenancyStart: "1 Mar 2024", tenancyEnd: "28 Feb 2026", frequency: "Annually" },
  { id: "p2", name: "Horizon Residences", loc: "Lekki Phase 1, Lagos", assigned: false, active: 2, tenant: "Mrs. Ifeoma Okafor", tenancyStart: "15 Jun 2023", tenancyEnd: "14 Jun 2025", frequency: "Monthly" },
  { id: "p3", name: "Parkview Estate", loc: "Ikoyi, Lagos", assigned: true, active: 1, tenant: "Dr. Amina Bello", tenancyStart: "1 Jan 2025", tenancyEnd: "31 Dec 2025", frequency: "Annually" },
  { id: "p4", name: "Marina Heights", loc: "CMS, Lagos Island", assigned: false, active: 3, tenant: "Mr. Tunde Adeyemi", tenancyStart: "1 Sep 2024", tenancyEnd: "31 Aug 2026", frequency: "Quarterly" },
];

export const TENANTS_DATA: FmTenant[] = [
  { id: "t1", name: "Mr. Kolade Fashola", property: "Greenfield Towers", phone: "+234 801 234 5678", start: "1 Mar 2024", end: "28 Feb 2026" },
  { id: "t2", name: "Mrs. Ifeoma Okafor", property: "Horizon Residences", phone: "+234 802 345 6789", start: "15 Jun 2023", end: "14 Jun 2025" },
  { id: "t3", name: "Dr. Amina Bello", property: "Parkview Estate", phone: "+234 803 456 7890", start: "1 Jan 2025", end: "31 Dec 2025" },
  { id: "t4", name: "Mr. Tunde Adeyemi", property: "Marina Heights", phone: "+234 804 567 8901", start: "1 Sep 2024", end: "31 Aug 2026" },
  { id: "t5", name: "Mrs. Ngozi Eze", property: "Greenfield Towers", phone: "+234 805 678 9012", start: "15 Apr 2024", end: "14 Apr 2026" },
  { id: "t6", name: "Mr. Emeka Obi", property: "Marina Heights", phone: "+234 806 789 0123", start: "1 Nov 2024", end: "31 Oct 2025" },
  { id: "t7", name: "Miss Sade Lawal", property: "Greenfield Towers", phone: "+234 807 890 1234", start: "1 Jun 2024", end: "31 May 2026" },
  { id: "t8", name: "Mr. Chukwudi Nnaji", property: "Horizon Residences", phone: "+234 808 901 2345", start: "1 Feb 2025", end: "31 Jan 2026" },
  { id: "t9", name: "Mrs. Funke Adebayo", property: "Marina Heights", phone: "+234 809 012 3456", start: "1 Jul 2024", end: "30 Jun 2026" },
  { id: "t10", name: "Mr. Babatunde Ogundimu", property: "Greenfield Towers", phone: "+234 810 123 4567", start: "15 Aug 2024", end: "14 Aug 2025" },
];

export const EVENT_DEF: Record<
  FmFeedItem["type"],
  { title: string; desc: (entity: string, property: string) => string }
> = {
  issue_reported: {
    title: "Issue reported",
    desc: (e, p) => `"${e}" was reported at ${p}.`,
  },
  issue_opened: {
    title: "Issue opened",
    desc: (e, p) => `"${e}" has been opened at ${p}.`,
  },
  issue_resolved: {
    title: "Issue resolved",
    desc: (e, p) => `"${e}" at ${p} has been marked as resolved.`,
  },
  issue_reopened: {
    title: "Issue reopened",
    desc: (e, p) => `"${e}" at ${p} was reopened for further review.`,
  },
};

const _now = Date.now();
const _D = (h: number, m = 0) => _now - h * 3600000 - m * 60000;

export const SEED: FmFeedItem[] = [
  { id: "a01", type: "issue_reported", entity: "Elevator malfunction on Floor 8", property: "Greenfield Towers", issueId: "is01", time: _D(0, 2) },
  { id: "a03", type: "issue_opened", entity: "Water leakage in B-block corridor", property: "Horizon Residences", issueId: "is02", time: _D(0, 17) },
  { id: "a04", type: "issue_resolved", entity: "Broken gate latch — East entrance", property: "Parkview Estate", issueId: "is06", time: _D(0, 44) },
  { id: "a05", type: "issue_reported", entity: "HVAC noise in Unit 501", property: "Marina Heights", issueId: "is04", time: _D(1, 5) },
  { id: "a06", type: "issue_reopened", entity: "Power outage in parking bay 3", property: "Greenfield Towers", issueId: "is03", time: _D(1, 22) },
  { id: "a08", type: "issue_resolved", entity: "Pool pump failure", property: "Horizon Residences", issueId: "is07", time: _D(2, 10) },
  { id: "a09", type: "issue_opened", entity: "Fire exit door jammed — Floor 3", property: "Marina Heights", issueId: "is05", time: _D(2, 33) },
  { id: "a11", type: "issue_reported", entity: "Intercom system offline — Tower A", property: "Greenfield Towers", issueId: "is08", time: _D(26, 15) },
  { id: "a12", type: "issue_resolved", entity: "Lobby CCTV offline", property: "Marina Heights", issueId: "is04", time: _D(27, 40) },
];

export const LIVE_POOL: Omit<FmFeedItem, "id" | "time">[] = [
  { type: "issue_reported", entity: "Burst pipe near Unit 107", property: "Parkview Estate", issueId: "is06" },
  { type: "issue_opened", entity: "Roof gutter overflow — Block D", property: "Horizon Residences", issueId: "is02" },
  { type: "issue_resolved", entity: "Broken gate latch — East entrance", property: "Parkview Estate", issueId: "is06" },
  { type: "issue_reopened", entity: "Generator fuel low alert", property: "Greenfield Towers", issueId: "is03" },
];

const _T = (h: number, m = 0) => Date.now() - h * 3600000 - m * 60000;

const _ISSUES_BASE: Omit<FmIssue, "ref">[] = [
  { id: "is01", title: "Elevator malfunction on Floor 8", property: "Greenfield Towers", propertyId: "p1", tenant: "Chidi O.", phone: "+234 801 234 5678", status: "open", desc: "Elevator B has been stuck since 6 AM. Residents on upper floors are unable to get down. Engineer has been called.", time: _T(0, 2), media: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60" },
  { id: "is02", title: "Water leakage in B-block corridor", property: "Horizon Residences", propertyId: "p2", tenant: "Adaeze M.", phone: "+234 802 345 6789", status: "in_progress", desc: "Ceiling dripping near unit 204. Plumber has been dispatched and is currently on site assessing the source.", time: _T(0, 17), media: null },
  { id: "is03", title: "Power outage in parking bay 3", property: "Greenfield Towers", propertyId: "p1", tenant: "Emeka P.", phone: "+234 803 456 7890", status: "in_progress", desc: "Lighting circuit tripped overnight. The entire parking bay is unlit. Electrician is reviewing the fuse board.", time: _T(1, 22), media: null },
  { id: "is04", title: "HVAC noise in Unit 501", property: "Marina Heights", propertyId: "p4", tenant: "Tunde B.", phone: "+234 804 567 8901", status: "open", desc: "Loud rattling from the central air unit in block C. Tenant has reported it twice this week.", time: _T(2, 0), media: null },
  { id: "is05", title: "Fire exit door jammed — Floor 3", property: "Marina Heights", propertyId: "p4", tenant: "Akin F.", phone: "+234 805 678 9012", status: "open", desc: "Emergency exit on floor 3 is stuck and cannot be opened from inside. Flagged as urgent safety concern.", time: _T(2, 33), media: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=60" },
  {
    id: "is06", title: "Broken gate latch — East entrance", property: "Parkview Estate", propertyId: "p3", tenant: "Funke A.", phone: "+234 806 789 0123", status: "resolved",
    desc: "The latch on the secondary gate was loose and could not lock. A replacement has been fitted and verified.",
    time: _T(0, 44), media: null,
    resolution: { hadCost: true, costAmount: "₦25,000", artisanName: "Mr. Tobi Gate Repairs", artisanPhone: "0803 123 4567", summary: "Replaced damaged gate latch and confirmed proper locking.", category: "Maintenance", resolvedAt: new Date(Date.now() - 44 * 60000).toISOString(), resolvedBy: "Jide Akinola" },
  },
  {
    id: "is07", title: "Pool pump failure", property: "Horizon Residences", propertyId: "p2", tenant: "Ngozi K.", phone: "+234 807 890 1234", status: "resolved",
    desc: "Pool circulation pump stopped working. Replacement unit was sourced and installed. Pool is operational again.",
    time: _T(26, 0), media: null,
    resolution: { hadCost: true, costAmount: "₦120,000", artisanName: "AquaTech Pool Services", artisanPhone: "0801 987 6543", summary: "Faulty circulation pump replaced with a new unit. Pool pressure tested and confirmed operational.", category: "Plumbing", resolvedAt: new Date(Date.now() - 25 * 3600000).toISOString(), resolvedBy: "Jide Akinola" },
  },
  { id: "is08", title: "Intercom system offline — Tower A", property: "Greenfield Towers", propertyId: "p1", tenant: "Sade L.", phone: "+234 808 901 2345", status: "in_progress", desc: "Visitors cannot buzz into units. Technician identified a wiring fault on the 4th floor junction box.", time: _T(27, 40), media: null },
  {
    id: "is09", title: "Kitchen sink leakage fixed", property: "Marina Heights", propertyId: "p4", tenant: "James O.", phone: "+234 809 012 3456", status: "resolved",
    desc: "Persistent dripping under the kitchen sink in unit 302. Pipe replaced and joints sealed.",
    time: _T(30, 0), media: null,
    resolution: { hadCost: true, costAmount: "₦35,000", artisanName: "Mr. Musa Plumbing Services", artisanPhone: "0803 123 4567", summary: "Replaced damaged pipe and fixed leakage under kitchen sink.", category: "Plumbing", resolvedAt: new Date(Date.now() - 29 * 3600000).toISOString(), resolvedBy: "Jide Akinola" },
  },
  {
    id: "is10", title: "Intercom system restored — Tower A", property: "Greenfield Towers", propertyId: "p1", tenant: "Sade L.", phone: "+234 808 901 2345", status: "resolved",
    desc: "Full intercom system outage on Tower A. All units affected. Wiring fault traced and repaired.",
    time: _T(54, 0), media: null,
    resolution: { hadCost: true, costAmount: "₦58,000", artisanName: "Teknik Electrical Services", artisanPhone: "0802 345 6789", summary: "Identified and repaired wiring fault on the 4th floor junction box. All intercom units now operational.", category: "Electrical", resolvedAt: new Date(Date.now() - 53 * 3600000).toISOString(), resolvedBy: "Jide Akinola" },
  },
];

export const ISSUES: FmIssue[] = _ISSUES_BASE.map((issue, i) => ({
  ...issue,
  ref: `SR-${String(i + 1).padStart(4, "0")}`,
}));

export const STATUS_CONFIG: Record<
  string,
  { label: string; c: string; bg: string; bd: string }
> = {
  open: { label: "Open", c: "#C94A00", bg: "#FFF1EC", bd: "#FFD4C2" },
  in_progress: { label: "In Progress", c: "#1A5FBF", bg: "#EEF3FF", bd: "#BCCFF9" },
  resolved: { label: "Resolved", c: "#176B3A", bg: "#EDFAF3", bd: "#A5E5C3" },
};

export const PROP_STATUS_CONFIG: Record<
  string,
  { label: string; c: string; bg: string; bd: string }
> = {
  open: { label: "Pending", c: "#7A6A00", bg: "#FEFBE8", bd: "#F0E68A" },
  in_progress: { label: "Approved", c: "#1A5FBF", bg: "#EEF3FF", bd: "#BCCFF9" },
  not_approved: { label: "Not approved", c: "#7A3A3A", bg: "#FEF2F2", bd: "#F5C6C6" },
  resolved: { label: "Resolved", c: "#176B3A", bg: "#EDFAF3", bd: "#A5E5C3" },
};

export const STATUS_LABEL: Record<string, string> = {
  open: "Pending",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const COMMON_AREAS = [
  "Ibiyinka Common Area",
  "Oniru Common Area",
  "Oyibo Common Area",
];

export const COMMON_AREAS_DATA: FmCommonArea[] = [
  { id: "ca1", name: "Ibiyinka Common Area" },
  { id: "ca2", name: "Oniru Common Area" },
  { id: "ca3", name: "Oyibo Common Area" },
];

const _T2 = (h: number, m = 0) => Date.now() - h * 3600000 - m * 60000;

export const CA_REQUESTS_SEED: FmCaRequest[] = [
  { id: "cr01", caId: "ca1", title: "Broken bench near entrance", desc: "The wooden bench at the main entrance is cracked and poses a safety risk to residents.", time: _T2(1, 10), status: "pending" },
  { id: "cr02", caId: "ca1", title: "Lighting outage — pathway", desc: "Four pathway lights along the east walkway have been out for two days.", time: _T2(3, 45), status: "approved" },
  { id: "cr03", caId: "ca1", title: "Overflow from drainage channel", desc: "Heavy rain caused the drainage near Block B to overflow onto the footpath.", time: _T2(10, 0), status: "resolved" },
  { id: "cr04", caId: "ca2", title: "Lobby door hinge loose", desc: "The main lobby door hinge is loose and the door does not close properly.", time: _T2(0, 30), status: "pending" },
  { id: "cr05", caId: "ca2", title: "CCTV camera offline", desc: "Camera 3 covering the car park entrance has been offline since yesterday morning.", time: _T2(5, 20), status: "approved" },
  { id: "cr06", caId: "ca2", title: "Broken floor tile — corridor", desc: "A cracked tile at the ground floor corridor near the lift is a trip hazard.", time: _T2(18, 0), status: "not_resolved" },
  { id: "cr07", caId: "ca3", title: "Generator exhaust blocked", desc: "Debris has partially blocked the generator exhaust vent on the north side.", time: _T2(2, 5), status: "pending" },
  { id: "cr08", caId: "ca3", title: "Rubbish bin overflowing", desc: "The shared waste bin at the communal area has not been emptied in three days.", time: _T2(7, 30), status: "resolved" },
];

export const CA_STATUS_TABS = [
  { id: "pending", label: "Yet to be approved" },
  { id: "approved", label: "Approved" },
  { id: "not_resolved", label: "Not resolved" },
  { id: "resolved", label: "Resolved" },
];

export const CA_STATUS_MAP: Record<FmCaRequestStatus, string> = {
  pending: "open",
  approved: "in_progress",
  not_resolved: "not_approved",
  resolved: "resolved",
};

export const JOB_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC / Air conditioning",
  "Structural / Building",
  "Security & Access",
  "Cleaning",
  "Equipment / Appliance",
  "Other",
];
