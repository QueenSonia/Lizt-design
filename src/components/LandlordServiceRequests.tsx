"use client";

import { useQueryState } from "@/hooks/useQueryState";
import { LandlordTopNav } from "./LandlordTopNav";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Wrench, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { useGetAllServiceRequests } from "@/services/service-requests/query";

interface LandlordServiceRequestsProps {
  onBack?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

interface ServiceRequest {
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
  notes?: string;
  tenant_id: string;
  property_id: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  /** Optional. When omitted, derived for UI display. */
  source?: "tenant" | "facility_manager";
  reporter_name?: string;
}

type RequestSource = "tenant" | "facility_manager";

/**
 * For mock/design data the API may not include `source`. Derive a stable
 * value from the request id so the UI demonstrates both groups correctly.
 */
function resolveSource(req: ServiceRequest): RequestSource {
  if (req.source) return req.source;
  const seed = (req.id || req.request_id || "").charCodeAt(0) || 0;
  return seed % 2 === 0 ? "tenant" : "facility_manager";
}

function reporterName(req: ServiceRequest): string {
  return req.reporter_name?.trim() || req.tenant_name;
}

const SOURCE_LABEL: Record<RequestSource, string> = {
  tenant: "Tenant",
  facility_manager: "Facility Manager",
};

const MOCK_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: "sr-001",
    request_id: "SR-001",
    tenant_name: "James Okafor",
    reporter_name: "James Okafor",
    source: "tenant",
    property_name: "Lekki Phase 1 Duplex",
    issue_category: "Plumbing",
    description: "Kitchen sink is leaking and water pools under the cabinet.",
    status: "open",
    date_reported: "2026-04-25T09:30:00.000Z",
    updated_at: "2026-04-26T11:00:00.000Z",
    tenant_id: "t-001",
    property_id: "p-001",
  },
  {
    id: "sr-002",
    request_id: "SR-002",
    tenant_name: "Adaeze Nwosu",
    reporter_name: "Adaeze Nwosu",
    source: "tenant",
    property_name: "Ikoyi 2-Bed Apartment",
    issue_category: "Electrical",
    description: "Living room sockets stopped working after last power outage.",
    status: "in_progress",
    date_reported: "2026-04-22T14:10:00.000Z",
    updated_at: "2026-04-27T08:20:00.000Z",
    tenant_id: "t-002",
    property_id: "p-002",
  },
  {
    id: "sr-003",
    request_id: "SR-003",
    tenant_name: "—",
    reporter_name: "Tobi Adekunle",
    source: "facility_manager",
    property_name: "Lekki Phase 1 Duplex",
    issue_category: "Common Area",
    description: "Driveway gate motor is jammed; needs replacement bracket.",
    status: "open",
    date_reported: "2026-04-26T07:45:00.000Z",
    updated_at: "2026-04-27T13:00:00.000Z",
    tenant_id: "",
    property_id: "p-001",
  },
  {
    id: "sr-004",
    request_id: "SR-004",
    tenant_name: "—",
    reporter_name: "Chinwe Obi",
    source: "facility_manager",
    property_name: "Ikoyi 2-Bed Apartment",
    issue_category: "Inspection",
    description: "Quarterly inspection found a cracked tile in the bathroom.",
    status: "resolved",
    date_reported: "2026-04-18T10:00:00.000Z",
    updated_at: "2026-04-24T16:30:00.000Z",
    tenant_id: "",
    property_id: "p-002",
  },
  {
    id: "sr-005",
    request_id: "SR-005",
    tenant_name: "Emmanuel Etim",
    reporter_name: "Emmanuel Etim",
    source: "tenant",
    property_name: "Victoria Island Studio",
    issue_category: "HVAC",
    description: "Air conditioner not cooling, just blowing warm air.",
    status: "urgent",
    date_reported: "2026-04-27T19:05:00.000Z",
    updated_at: "2026-04-27T19:05:00.000Z",
    tenant_id: "t-003",
    property_id: "p-003",
  },
];

export default function LandlordServiceRequests({
  onBack,
  onMenuClick,
  isMobile = false,
}: LandlordServiceRequestsProps) {
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
    debounce: 300,
  });
  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "all",
  });
  const [propertyFilter, setPropertyFilter] = useQueryState("property", {
    defaultValue: "all",
  });
  const [sourceFilter, setSourceFilter] = useQueryState("source", {
    defaultValue: "all",
  });
  const page = 1;
  const size = 50; // Load more items to avoid pagination UI

  // Fetch service requests from API
  const { data, isLoading, error } = useGetAllServiceRequests({
    page,
    size,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  console.log("Service requests query state:", { data, isLoading, error });

  const apiRequests: ServiceRequest[] = data?.service_requests || [];
  const requests: ServiceRequest[] = apiRequests.length > 0 ? apiRequests : MOCK_SERVICE_REQUESTS;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const getRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return "N/A";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 60)
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7)
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "pending":
      case "open":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "reopened":
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get unique properties for filter
  const properties = ["all", ...new Set(requests.map((r) => r.property_name))];

  // Filter requests by search query, property, and source
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.issue_category
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reporterName(request).toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProperty =
      propertyFilter === "all" || request.property_name === propertyFilter;

    const matchesSource =
      sourceFilter === "all" || resolveSource(request) === sourceFilter;

    return matchesSearch && matchesProperty && matchesSource;
  });

  const tenantRequests = filteredRequests.filter((r) => resolveSource(r) === "tenant");
  const facilityManagerRequests = filteredRequests.filter((r) => resolveSource(r) === "facility_manager");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <LandlordTopNav
        title="Service Requests"
        onBack={onBack}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
        showAddButton={false}
      />

      {/* Main Content */}
      <div className="pt-[73px] lg:pt-[81px] px-6 py-6">
        {/* Source filter chips */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          {([
            { value: "all", label: "All" },
            { value: "tenant", label: "Tenants" },
            { value: "facility_manager", label: "Facility Managers" },
          ] as const).map((opt) => {
            const active = sourceFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSourceFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? "bg-[#FF5000] text-white border-[#FF5000]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search requests"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="lg:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="reopened">Reopened</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Property Filter */}
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="lg:w-[200px]">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties
                  .filter((p) => p !== "all")
                  .map((property) => (
                    <SelectItem key={property} value={property}>
                      {property}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading service requests...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg text-gray-900 mb-2">
              Error loading requests
            </h3>
            <p className="text-gray-500">
              {error instanceof Error
                ? error.message
                : "Please try again later."}
            </p>
          </div>
        )}

        {/* Service Requests List */}
        {!isLoading && !error && filteredRequests.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg text-gray-900 mb-2">
              No service requests yet.
            </h3>
            <p className="text-gray-500">
              Requests from your tenants will appear here.
            </p>
          </div>
        )}

        {!isLoading && !error && filteredRequests.length > 0 && (() => {
          const renderCard = (request: ServiceRequest) => (
            <div
              key={request.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Title and Status */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-lg text-gray-900 flex-1">
                  {request.description && <>{request.description}</>}
                </h2>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(request.status)} border px-3 py-1 text-xs`}
                >
                  {formatStatusLabel(request.status)}
                </Badge>
              </div>

              {/* Property and Reporter */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Property:</span>
                  <span className="text-sm text-gray-900">{request.property_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Reported by:</span>
                  <span className="text-sm text-gray-900">
                    {SOURCE_LABEL[resolveSource(request)]} – {reporterName(request)}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500">
                <div>
                  <span className="text-gray-600">Date Reported: </span>
                  <span>{formatDate(request.date_reported)}</span>
                </div>
                <div className="text-xs">
                  Last Updated: {getRelativeTime(request.updated_at || request.updatedAt)}
                </div>
              </div>
            </div>
          );

          if (sourceFilter === "all") {
            return (
              <div className="space-y-8">
                {tenantRequests.length > 0 && (
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      From Tenants
                    </h3>
                    <div className="space-y-4">{tenantRequests.map(renderCard)}</div>
                  </section>
                )}
                {facilityManagerRequests.length > 0 && (
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      From Facility Managers
                    </h3>
                    <div className="space-y-4">{facilityManagerRequests.map(renderCard)}</div>
                  </section>
                )}
              </div>
            );
          }

          return <div className="space-y-4">{filteredRequests.map(renderCard)}</div>;
        })()}
      </div>
    </div>
  );
}
