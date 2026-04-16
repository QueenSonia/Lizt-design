/* eslint-disable */
"use client";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  Wrench,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface ServiceRequest {
  id: string;
  issue_category: string;
  description: string;
  status: "pending_approval" | "pending" | "open" | "in_progress" | "resolved" | "closed" | "urgent";
  reported_by: string;
  date_reported: string;
}

interface CommonArea {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  serviceRequests: ServiceRequest[];
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_COMMON_AREAS: CommonArea[] = [
  {
    id: "ca-001",
    name: "Main Lobby",
    address: "Ground Floor, Block A, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-11-01",
    serviceRequests: [
      {
        id: "sr-ca-001-1",
        issue_category: "Lighting",
        description: "Two ceiling lights in the lobby are flickering and need replacing.",
        status: "pending_approval",
        reported_by: "Facility Manager",
        date_reported: "2026-04-10T09:30:00Z",
      },
      {
        id: "sr-ca-001-2",
        issue_category: "Cleaning",
        description: "Lobby floor has not been cleaned since the weekend. Requires attention.",
        status: "in_progress",
        reported_by: "Facility Manager",
        date_reported: "2026-04-12T08:00:00Z",
      },
      {
        id: "sr-ca-001-3",
        issue_category: "Security",
        description: "Main entrance door intercom is unresponsive.",
        status: "resolved",
        reported_by: "Facility Manager",
        date_reported: "2026-03-28T14:00:00Z",
      },
    ],
  },
  {
    id: "ca-002",
    name: "Rooftop Garden",
    address: "Rooftop Level, Block A, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-11-15",
    serviceRequests: [],
  },
  {
    id: "ca-003",
    name: "Parking Lot B",
    address: "East Wing, Basement 1, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2025-12-03",
    serviceRequests: [
      {
        id: "sr-ca-003-1",
        issue_category: "Drainage",
        description: "Water pooling near parking bays 12–15 after rain. Drainage appears blocked.",
        status: "pending_approval",
        reported_by: "Facility Manager",
        date_reported: "2026-04-13T07:45:00Z",
      },
    ],
  },
  {
    id: "ca-004",
    name: "Generator Room",
    address: "Utility Block, Ground Floor, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2026-01-10",
    serviceRequests: [
      {
        id: "sr-ca-004-1",
        issue_category: "Maintenance",
        description: "Generator failed to auto-start during last power outage. Requires inspection.",
        status: "urgent",
        reported_by: "Facility Manager",
        date_reported: "2026-04-08T22:15:00Z",
      },
    ],
  },
  {
    id: "ca-005",
    name: "Laundry Room",
    address: "Floor 2, Block B, 14 Admiralty Way, Lekki Phase 1",
    createdAt: "2026-02-20",
    serviceRequests: [],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-orange-50 text-orange-700 border-orange-200",
  pending:          "bg-yellow-100 text-yellow-700 border-yellow-200",
  open:             "bg-yellow-100 text-yellow-700 border-yellow-200",
  in_progress:      "bg-blue-100 text-blue-700 border-blue-200",
  resolved:         "bg-green-100 text-green-700 border-green-200",
  closed:           "bg-gray-100 text-gray-700 border-gray-200",
  urgent:           "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Pending Approval",
};

const STATUS_OPTIONS = ["all", "pending_approval", "pending", "open", "in_progress", "resolved", "urgent", "closed"];

function formatStatusLabel(s: string) {
  return STATUS_LABELS[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCreatedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordCommonAreaDetail({ }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userRole = user?.role || pathname.split("/")[1] || "landlord";

  const id = searchParams.get("id") || "";

  const [allAreas, setAllAreas] = useState<CommonArea[]>(MOCK_COMMON_AREAS);
  const area = allAreas.find((a) => a.id === id) ?? null;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleApprove = (requestId: string) => {
    setAllAreas((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              serviceRequests: a.serviceRequests.map((r) =>
                r.id === requestId ? { ...r, status: "in_progress" as const } : r,
              ),
            }
          : a,
      ),
    );
  };

  const filteredRequests = useMemo(() => {
    if (!area) return [];
    return area.serviceRequests.filter((r) => {
      const matchesSearch =
        r.issue_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [area, searchQuery, statusFilter]);

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!area) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="text-center">
          <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-base font-medium text-gray-900 mb-1">Common area not found</h2>
          <p className="text-sm text-gray-500 mb-4">The area you&apos;re looking for doesn&apos;t exist.</p>
          <Button variant="outline" onClick={() => router.push(`/${userRole}/common-areas`)}>
            Back to Common Areas
          </Button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Sticky header */}
      <div className="fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 lg:px-8 py-4 lg:py-5 flex items-center gap-4">
          <button
            onClick={() => router.push(`/${userRole}/common-areas`)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
              {area.name}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{area.address}</p>
            <p className="text-xs text-gray-400 mt-0.5">Added {formatCreatedDate(area.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pt-[73px] lg:pt-[81px]">
        <div className="max-w-[1400px] mx-auto px-6 py-8">

          {/* Service requests section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Service Requests
            </h2>
            <span className="text-xs text-gray-400">
              {area.serviceRequests.length} total
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search requests…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All Statuses" : formatStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Empty state */}
          {filteredRequests.length === 0 && (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">
                {searchQuery || statusFilter !== "all"
                  ? "No matching requests"
                  : "No service requests yet"}
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery || statusFilter !== "all"
                  ? "Try clearing your filters."
                  : "Use \u201cReport Issue\u201d to log the first request for this area."}
              </p>
            </div>
          )}

          {/* Request cards */}
          {filteredRequests.length > 0 && (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl p-5 shadow-sm border ${req.status === "pending_approval" ? "border-orange-100" : "border-gray-100"}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {req.issue_category}
                      </p>
                      {req.description && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {req.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`${STATUS_COLORS[req.status] ?? STATUS_COLORS.closed} border px-2.5 py-0.5 text-xs shrink-0`}
                    >
                      {formatStatusLabel(req.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 gap-3">
                    <p className="text-xs text-gray-400">
                      Reported {formatDate(req.date_reported)} · {req.reported_by}
                    </p>
                    {req.status === "pending_approval" && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(req.id)}
                        className="bg-[#FF5000] hover:bg-[#E64800] text-white text-xs h-7 px-3 shrink-0"
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
