/* eslint-disable */
// Shared types, mock data, and helpers for Landlord Facility screens

import { StatusHistoryEvent } from "@/services/service-requests/query";

export interface FacilityManager {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  role: string;
  date: string;
}

export interface ResolutionDetails {
  summary: string;
  category: string;
  hadCost: boolean;
  costAmount?: string;
  resolvedAt: string;
  resolvedBy: string;
  artisanName?: string;
  artisanPhone?: string;
  rejectedByTenant?: boolean;
  tenantFeedback?: string;
}

export interface ServiceRequest {
  id: string;
  request_id: string;
  tenant_name: string;
  property_name: string;
  issue_category: string;
  description: string;
  status: string;
  date_reported: string;
  resolution_date?: string | null;
  reopened_at?: string | null;
  issue_images?: string[] | null;
  attachments?: Array<{ url: string; type: "image" | "video"; group: "original" | "reopened" }>;
  notes?: string;
  tenant_id: string;
  property_id: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  statusHistory?: StatusHistoryEvent[];
  source?: "tenant" | "facility_manager";
  reporter_name?: string;
  resolution?: ResolutionDetails;
  resolutions?: ResolutionDetails[];
}

export type RequestSource = "tenant" | "facility_manager";

export function resolveSource(req: ServiceRequest): RequestSource {
  if (req.source) return req.source;
  const seed = (req.id || req.request_id || "").charCodeAt(0) || 0;
  return seed % 2 === 0 ? "tenant" : "facility_manager";
}

export function reporterName(req: ServiceRequest): string {
  return req.reporter_name?.trim() || req.tenant_name;
}

export const SOURCE_LABEL: Record<RequestSource, string> = {
  tenant: "Tenant",
  facility_manager: "Facility Manager",
};

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700 border-yellow-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
  reopened: "bg-red-100 text-red-700 border-red-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
};

export const MOCK_FACILITY_MANAGERS: FacilityManager[] = [
  {
    id: "fm-001",
    name: "Chukwuemeka Obi",
    phone_number: "+234 803 214 5678",
    email: "c.obi@facilitypro.ng",
    role: "facility_manager",
    date: "2025-09-10T00:00:00Z",
  },
  {
    id: "fm-002",
    name: "Amaka Nwosu",
    phone_number: "+234 806 332 9910",
    email: "a.nwosu@facilitypro.ng",
    role: "facility_manager",
    date: "2025-10-03T00:00:00Z",
  },
  {
    id: "fm-003",
    name: "Tunde Adeyemi",
    phone_number: "+234 812 554 7723",
    email: "t.adeyemi@facilitypro.ng",
    role: "facility_manager",
    date: "2025-11-18T00:00:00Z",
  },
  {
    id: "fm-004",
    name: "Ngozi Eze",
    phone_number: "+234 708 991 2244",
    email: "n.eze@facilitypro.ng",
    role: "facility_manager",
    date: "2026-01-07T00:00:00Z",
  },
  {
    id: "fm-005",
    name: "Femi Olawale",
    phone_number: "+234 815 663 8801",
    email: "f.olawale@facilitypro.ng",
    role: "facility_manager",
    date: "2026-02-14T00:00:00Z",
  },
  {
    id: "fm-006",
    name: "Blessing Okafor",
    phone_number: "+234 901 774 5532",
    email: "b.okafor@facilitypro.ng",
    role: "facility_manager",
    date: "2026-03-22T00:00:00Z",
  },
];

export const MOCK_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: "sr-001", request_id: "SR-001", tenant_name: "James Okafor", reporter_name: "James Okafor", source: "tenant",
    property_name: "Lekki Phase 1 Duplex", issue_category: "Plumbing",
    description: "Kitchen sink is leaking and water pools under the cabinet.",
    status: "open", date_reported: "2026-04-25T09:30:00.000Z", updated_at: "2026-04-26T11:00:00.000Z",
    tenant_id: "t-001", property_id: "p-001",
    attachments: [
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image", group: "original" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image", group: "original" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", type: "image", group: "original" },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video", group: "original" },
    ],
  },
  {
    id: "sr-002", request_id: "SR-002", tenant_name: "Adaeze Nwosu", reporter_name: "Adaeze Nwosu", source: "tenant",
    property_name: "Ikoyi 2-Bed Apartment", issue_category: "Electrical",
    description: "Living room sockets stopped working after last power outage.",
    status: "in_progress", date_reported: "2026-04-22T14:10:00.000Z", updated_at: "2026-04-27T08:20:00.000Z",
    tenant_id: "t-002", property_id: "p-002",
    attachments: [
      { url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400", type: "image", group: "reopened" },
    ],
  },
  {
    id: "sr-003", request_id: "SR-003", tenant_name: "—", reporter_name: "Tobi Adekunle", source: "facility_manager",
    property_name: "Lekki Phase 1 Duplex", issue_category: "Common Area",
    description: "Driveway gate motor is jammed; needs replacement bracket.",
    status: "open", date_reported: "2026-04-26T07:45:00.000Z", updated_at: "2026-04-27T13:00:00.000Z",
    tenant_id: "", property_id: "p-001",
  },
  {
    id: "sr-004", request_id: "SR-004", tenant_name: "—", reporter_name: "Chinwe Obi", source: "facility_manager",
    property_name: "Ikoyi 2-Bed Apartment", issue_category: "Inspection",
    description: "Quarterly inspection found a cracked tile in the bathroom.",
    status: "resolved", date_reported: "2026-04-18T10:00:00.000Z", updated_at: "2026-04-24T16:30:00.000Z",
    tenant_id: "", property_id: "p-002",
    resolutions: [
      {
        summary: "Attempted to patch the cracked tile with adhesive filler. Appeared stable after initial inspection.",
        category: "Tiling & Flooring",
        hadCost: true,
        costAmount: "₦5,000",
        artisanName: "Kunle Fixes",
        artisanPhone: "0802 111 2233",
        resolvedAt: "2026-04-22T10:00:00.000Z",
        resolvedBy: "Tunde Adeyemi",
        rejectedByTenant: true,
        tenantFeedback: "The tile is still cracked and water seeps through.",
      },
      {
        summary: "Replaced the cracked floor tile near the shower drain. Re-grouted surrounding tiles and tested for water tightness. No further damage observed.",
        category: "Tiling & Flooring",
        hadCost: true,
        costAmount: "₦18,500",
        artisanName: "ProTile Services",
        artisanPhone: "0809 887 6654",
        resolvedAt: "2026-04-24T16:30:00.000Z",
        resolvedBy: "Tunde Adeyemi",
      },
    ],
  },
  {
    id: "sr-005", request_id: "SR-005", tenant_name: "Emmanuel Etim", reporter_name: "Emmanuel Etim", source: "tenant" as const,
    property_name: "Victoria Island Studio", issue_category: "HVAC",
    description: "Air conditioner not cooling, just blowing warm air.",
    status: "urgent", date_reported: "2026-04-27T19:05:00.000Z", updated_at: "2026-04-27T21:05:00.000Z",
    tenant_id: "t-003", property_id: "p-003",
    attachments: [
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image" as const, group: "original" as const },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const, group: "original" as const },
    ],
  },
  {
    id: "sr-006", request_id: "SR-006", tenant_name: "—", reporter_name: "Tobi Adekunle", source: "facility_manager" as const,
    property_name: "Lekki Phase 1 Duplex", issue_category: "Electrical",
    description: "Generator failed during power outage and building currently has no backup power.",
    status: "open", date_reported: "2026-04-28T09:15:00.000Z", updated_at: "2026-04-28T09:30:00.000Z",
    tenant_id: "", property_id: "p-001",
    attachments: [
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400", type: "image" as const, group: "original" as const },
    ],
  },
  {
    id: "sr-007", request_id: "SR-007", tenant_name: "Chidi Okafor", reporter_name: "Chidi Okafor", source: "tenant" as const,
    property_name: "Greenfield Towers", issue_category: "Plumbing",
    description: "Major water leakage affecting multiple apartments on floors 3 and 4.",
    status: "open", date_reported: "2026-04-28T07:30:00.000Z", updated_at: "2026-04-28T07:50:00.000Z",
    tenant_id: "t-007", property_id: "p-004",
    attachments: [
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400", type: "image" as const, group: "original" as const },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const, group: "original" as const },
    ],
  },
  // Reopened requests
  {
    id: "sr-008", request_id: "SR-008", tenant_name: "James Okafor", reporter_name: "James Okafor", source: "tenant" as const,
    property_name: "Lekki Phase 1 Duplex", issue_category: "Plumbing",
    description: "Kitchen sink still leaking after repair.",
    status: "reopened", date_reported: "2026-05-10T09:00:00.000Z", updated_at: "2026-05-27T10:15:00.000Z",
    reopened_at: "2026-05-27T10:15:00.000Z",
    tenant_id: "t-001", property_id: "p-001",
    notes: "Tenant marked issue as not resolved.",
    attachments: [
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image" as const, group: "reopened" as const },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const, group: "reopened" as const },
    ],
    resolutions: [
      {
        summary: "Replaced damaged pipe under sink. Joints sealed and checked for drips.",
        category: "Plumbing",
        hadCost: true,
        costAmount: "₦25,000",
        artisanName: "Musa Plumbing Services",
        artisanPhone: "0803 500 1122",
        resolvedAt: "2026-05-24T14:00:00.000Z",
        resolvedBy: "Chukwuemeka Obi",
        rejectedByTenant: true,
        tenantFeedback: "Water is still leaking under the sink.",
      },
    ],
  },
  {
    id: "sr-009", request_id: "SR-009", tenant_name: "Chidi Okafor", reporter_name: "Chidi Okafor", source: "tenant" as const,
    property_name: "Greenfield Towers", issue_category: "Electrical",
    description: "Generator still not powering common areas consistently.",
    status: "reopened", date_reported: "2026-05-08T11:30:00.000Z", updated_at: "2026-05-26T16:32:00.000Z",
    reopened_at: "2026-05-26T16:32:00.000Z",
    tenant_id: "t-004", property_id: "p-004",
    notes: "Issue partially resolved. Problem still occurring.",
    attachments: [
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400", type: "image" as const, group: "reopened" as const },
    ],
    resolutions: [
      {
        summary: "Replaced faulty transfer switch on generator. Common areas power tested and appeared stable.",
        category: "Electrical",
        hadCost: true,
        costAmount: "₦68,000",
        artisanName: "Teknik Electrical Services",
        artisanPhone: "0802 345 6789",
        resolvedAt: "2026-05-23T16:00:00.000Z",
        resolvedBy: "Chukwuemeka Obi",
        rejectedByTenant: true,
        tenantFeedback: "Issue partially resolved. Problem still occurring in the evenings.",
      },
    ],
  },
  {
    id: "sr-010", request_id: "SR-010", tenant_name: "Emmanuel Etim", reporter_name: "Emmanuel Etim", source: "tenant" as const,
    property_name: "Victoria Island Studio", issue_category: "Tiling & Flooring",
    description: "Bathroom tiles replaced but water still seeps through the wall.",
    status: "reopened", date_reported: "2026-05-05T08:00:00.000Z", updated_at: "2026-05-25T09:20:00.000Z",
    reopened_at: "2026-05-25T09:20:00.000Z",
    tenant_id: "t-003", property_id: "p-003",
    notes: "Tenant reported the original issue still exists.",
    attachments: [
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400", type: "image" as const, group: "original" as const },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "image" as const, group: "reopened" as const },
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", type: "image" as const, group: "reopened" as const },
      { url: "https://www.w3schools.com/html/mov_bbb.mp4", type: "video" as const, group: "reopened" as const },
    ],
    resolutions: [
      {
        summary: "Re-grouted wall tiles in bathroom and applied waterproof sealant behind tiles.",
        category: "Tiling & Flooring",
        hadCost: true,
        costAmount: "₦32,000",
        artisanName: "ProTile Services",
        artisanPhone: "0809 887 6654",
        resolvedAt: "2026-05-22T11:30:00.000Z",
        resolvedBy: "Tunde Adeyemi",
        rejectedByTenant: true,
        tenantFeedback: "Water is still seeping through the wall after rain.",
      },
    ],
  },
];
