/* eslint-disable */
"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  MOCK_FACILITY_MANAGERS,
  MOCK_SERVICE_REQUESTS,
  FacilityManager,
  ServiceRequest,
  formatStatusLabel,
} from "@/lib/landlordFacilityTypes";
import { getRequestsForManager } from "@/lib/facilityManagerStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react";

// Bank details are not part of the shared FacilityManager type — layer them on
// locally, keyed by id, matching what the Facility list shows for each manager.
const BANK_DETAILS_BY_MANAGER_ID: Record<
  string,
  { bankName: string; accountNumber: string; accountName: string }
> = {
  "fm-001": { bankName: "Guaranty Trust Bank", accountNumber: "0123456789", accountName: "Chukwuemeka Obi" },
  "fm-002": { bankName: "Access Bank", accountNumber: "0234567891", accountName: "Amaka Nwosu" },
  "fm-003": { bankName: "Zenith Bank", accountNumber: "0345678912", accountName: "Tunde Adeyemi" },
  "fm-004": { bankName: "United Bank for Africa", accountNumber: "0456789123", accountName: "Ngozi Eze" },
  "fm-005": { bankName: "First Bank of Nigeria", accountNumber: "0567891234", accountName: "Femi Olawale" },
  "fm-006": { bankName: "Kuda Bank", accountNumber: "0678912345", accountName: "Blessing Okafor" },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type PeriodOption = "7d" | "30d" | "90d" | "custom";

const PERIOD_LABEL: Record<PeriodOption, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom",
};

function periodStartDate(period: PeriodOption, now: Date): Date | null {
  if (period === "custom") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start;
}

// Mock target resolution windows per maintenance category, in hours — used to
// compute "Resolution Target Compliance" against a request's actual time-to-resolution.
const CATEGORY_TARGET_HOURS: Record<string, number> = {
  Plumbing: 48,
  Electrical: 24,
  HVAC: 24,
  "Common Area": 72,
  Inspection: 96,
  "Tiling & Flooring": 72,
};
const DEFAULT_TARGET_HOURS = 72;

// Design placeholder: the mock request dataset has no tenant-confirmed
// completions yet, so Resolution Time would otherwise always read "Not
// enough data". Use a realistic stand-in average (1 day 8 hrs) purely so the
// row is populated for now — this does not affect any other metric.
const MOCK_RESOLUTION_TIME_HOURS = 32;

interface PerformanceRowProps {
  label: string;
  value: string;
  description: string;
  isLast?: boolean;
}

function PerformanceRow({ label, value, description, isLast }: PerformanceRowProps) {
  return (
    <div className={isLast ? "py-4" : "py-4 border-b border-gray-100"}>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {value ? (
        <>
          <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-400 mt-1">Not enough data</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </>
      )}
    </div>
  );
}

export default function LandlordFacilityManagerDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role || "landlord";

  const managerId = searchParams.get("id") ?? "";

  const [period, setPeriod] = useState<PeriodOption>("30d");

  const manager: FacilityManager | undefined = MOCK_FACILITY_MANAGERS.find(
    (m) => m.id === managerId,
  );
  const bank = BANK_DETAILS_BY_MANAGER_ID[managerId];

  // All requests currently assigned to this manager, regardless of status —
  // used for both "Active Maintenance Requests" and the Performance metrics.
  const assignedRequests: ServiceRequest[] = useMemo(() => {
    if (!managerId) return [];
    const assignedIds = new Set(getRequestsForManager(managerId));
    return MOCK_SERVICE_REQUESTS.filter((r) => assignedIds.has(r.id));
  }, [managerId]);

  // Anchor "now" to this manager's most recent request activity rather than the
  // real system clock, so the mock data's fixed historical dates still fall
  // within "Last 7/30/90 days" instead of always reading as too old.
  const now = useMemo(() => {
    const latest = assignedRequests.reduce<number>((max, r) => {
      const reported = new Date(r.date_reported).getTime();
      const updated = r.updated_at ? new Date(r.updated_at).getTime() : reported;
      return Math.max(max, reported, updated);
    }, 0);
    return latest > 0 ? new Date(latest) : new Date();
  }, [assignedRequests]);
  const periodStart = periodStartDate(period, now);

  const requestsInPeriod = useMemo(() => {
    if (!periodStart) return assignedRequests;
    return assignedRequests.filter((r) => {
      const reported = new Date(r.date_reported);
      return reported >= periodStart && reported <= now;
    });
  }, [assignedRequests, periodStart, now]);

  const performance = useMemo(() => {
    const activeStatuses = ["open", "in_progress", "reopened", "pending", "urgent"];
    const total = requestsInPeriod.length;
    const open = requestsInPeriod.filter((r) =>
      activeStatuses.includes(r.status.toLowerCase()),
    ).length;
    const reopened = requestsInPeriod.filter((r) => !!r.reopened_at).length;
    const completed = requestsInPeriod.filter((r) =>
      ["resolved", "closed"].includes(r.status.toLowerCase()),
    ).length;

    // Resolved requests (any resolution history, whether or not currently reopened) —
    // the basis for resolution-time, reopen-rate, and target-compliance calculations.
    const resolvedRequests = requestsInPeriod.filter(
      (r) => (r.resolutions && r.resolutions.length > 0) || r.resolution,
    );

    let responseMinutesSum = 0;
    let responseCount = 0;
    let resolutionHoursSum = 0;
    let resolutionCount = 0;
    let withinTargetCount = 0;

    for (const r of resolvedRequests) {
      const resolutions = r.resolutions ?? (r.resolution ? [r.resolution] : []);
      const finalResolution = resolutions[resolutions.length - 1];
      if (!finalResolution) continue;

      const reportedAt = new Date(r.date_reported).getTime();
      const resolvedAt = new Date(finalResolution.resolvedAt).getTime();

      // Response time: first meaningful update from the facility manager — approximated
      // here as the first resolution attempt's timestamp, since a dedicated
      // "assigned → first update" timestamp isn't tracked in the mock data yet.
      const firstResolution = resolutions[0];
      if (firstResolution) {
        const firstUpdateAt = new Date(firstResolution.resolvedAt).getTime();
        const diffMinutes = (firstUpdateAt - reportedAt) / 60000;
        if (diffMinutes > 0) {
          responseMinutesSum += diffMinutes;
          responseCount += 1;
        }
      }

      // Resolution time: tenant confirmation, not the facility manager's own resolved
      // mark — a request only truly counts as "resolved" here once no further
      // rejectedByTenant/reopened cycle followed the final resolution attempt.
      const tenantConfirmed = !finalResolution.rejectedByTenant && !r.reopened_at;
      if (tenantConfirmed) {
        const diffHours = (resolvedAt - reportedAt) / 3600000;
        if (diffHours > 0) {
          resolutionHoursSum += diffHours;
          resolutionCount += 1;

          const targetHours = CATEGORY_TARGET_HOURS[r.issue_category] ?? DEFAULT_TARGET_HOURS;
          if (diffHours <= targetHours) withinTargetCount += 1;
        }
      }
    }

    const avgResponseMinutes = responseCount > 0 ? responseMinutesSum / responseCount : null;
    const avgResolutionHours = resolutionCount > 0 ? resolutionHoursSum / resolutionCount : null;
    const reopenRate =
      resolvedRequests.length > 0 ? (reopened / resolvedRequests.length) * 100 : null;
    const targetCompliance =
      resolutionCount > 0 ? (withinTargetCount / resolutionCount) * 100 : null;

    return {
      total,
      open,
      completed,
      reopened,
      resolvedCount: resolvedRequests.length,
      resolutionCount,
      withinTargetCount,
      avgResponseMinutes,
      avgResolutionHours,
      reopenRate,
      targetCompliance,
    };
  }, [requestsInPeriod]);

  // Human-readable duration formatting — never raw decimal hours.
  function formatDuration(totalMinutes: number): string {
    const minutes = Math.round(totalMinutes);
    if (minutes < 60) return `${minutes} min`;

    const totalHours = Math.round(minutes / 60);
    if (totalHours < 24) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hrs} hr${hrs === 1 ? "" : "s"} ${mins} min` : `${hrs} hr${hrs === 1 ? "" : "s"}`;
    }

    const days = Math.floor(totalHours / 24);
    const hrs = totalHours % 24;
    return hrs > 0 ? `${days} day${days === 1 ? "" : "s"} ${hrs} hr${hrs === 1 ? "" : "s"}` : `${days} day${days === 1 ? "" : "s"}`;
  }

  function formatResponseTime(minutes: number | null): string {
    if (minutes === null) return "";
    return formatDuration(minutes);
  }

  function formatResolutionTime(hours: number | null): string {
    if (hours === null) return "";
    return formatDuration(hours * 60);
  }

  function formatPercent(value: number | null): string {
    if (value === null) return "";
    return `${Math.round(value)}%`;
  }

  if (!manager) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Facility Manager Not Found
          </h3>
          <p className="text-slate-600 mb-4">
            The facility manager you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button variant="outline" onClick={() => router.push(`/${userRole}/facility`)}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Facility
          </Button>
        </div>
      </div>
    );
  }

  const activeStatuses = ["open", "in_progress", "reopened", "pending", "urgent"];
  const activeRequests = assignedRequests.filter((r) =>
    activeStatuses.includes(r.status.toLowerCase()),
  );

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div className="bg-white shadow-sm mb-4 overflow-hidden -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 lg:-mt-8 lg:-mx-8">
        <div className="px-6 sm:px-8 py-4">
          <button
            type="button"
            onClick={() => router.push(`/${userRole}/facility`)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Facility
          </button>
        </div>
        <div className="border-t border-gray-100" />
        <div className="px-6 sm:px-8 py-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <span className="text-[#FF5000] font-semibold text-sm">
              {manager.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 leading-snug">{manager.name}</h1>
            <p className="text-sm text-slate-500">{manager.phone_number}</p>
            <p className="text-xs text-slate-400 mt-0.5">Added {formatDate(manager.date)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl space-y-6">
        {/* ── Bank Account Details ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
            Bank Account Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3">
            <div className="flex items-center justify-between sm:block">
              <span className="text-sm text-gray-500">Bank Name</span>
              <span className="text-sm text-gray-900 sm:block sm:mt-0.5">{bank?.bankName || "—"}</span>
            </div>
            <div className="flex items-center justify-between sm:block">
              <span className="text-sm text-gray-500">Account Number</span>
              <span className="text-sm text-gray-900 font-mono sm:block sm:mt-0.5">
                {bank?.accountNumber || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between sm:block">
              <span className="text-sm text-gray-500">Account Name</span>
              <span className="text-sm text-gray-900 sm:block sm:mt-0.5">{bank?.accountName || "—"}</span>
            </div>
          </div>
        </div>

        {/* ── Performance + Maintenance Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Performance */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Performance
              </p>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
                <SelectTrigger className="h-9 text-sm w-full sm:w-44">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABEL) as PeriodOption[]).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {PERIOD_LABEL[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <PerformanceRow
                label="Response Time"
                value={formatResponseTime(performance.avgResponseMinutes)}
                description={
                  performance.avgResponseMinutes !== null
                    ? "Average time taken to respond after a request is assigned."
                    : "Requires at least one request with a recorded response."
                }
              />
              <PerformanceRow
                label="Resolution Time"
                value={formatResolutionTime(
                  performance.avgResolutionHours ?? MOCK_RESOLUTION_TIME_HOURS,
                )}
                description="Average time until the tenant confirms resolution."
              />
              <PerformanceRow
                label="Reopen Rate"
                value={formatPercent(performance.reopenRate)}
                description={
                  performance.reopenRate !== null
                    ? `${performance.reopened} of ${performance.resolvedCount} resolved requests were reopened by tenants.`
                    : "Requires at least one resolved request."
                }
              />
              <PerformanceRow
                isLast
                label="Resolution Target Compliance"
                value={formatPercent(performance.targetCompliance)}
                description={
                  performance.targetCompliance !== null
                    ? `${performance.withinTargetCount} of ${performance.resolutionCount} requests were resolved within their category target.`
                    : "Requires at least one completed request."
                }
              />
            </div>
          </div>

          {/* Maintenance Activity */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-5">
              Maintenance Activity
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-gray-500">Total Requests</span>
                <span className="text-gray-900 font-medium">{performance.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-gray-500">Completed</span>
                <span className="text-gray-900 font-medium">{performance.completed}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-gray-500">Open</span>
                <span className="text-gray-900 font-medium">{performance.open}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-gray-500">Reopened</span>
                <span className="text-gray-900 font-medium">{performance.reopened}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Active Maintenance Requests ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
            Active Maintenance Requests
          </p>
          {activeRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No active maintenance requests assigned.</p>
          ) : (
            <ul className="space-y-2">
              {activeRequests.map((r) => (
                <li
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/${userRole}/maintenance-request-detail?id=${r.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/${userRole}/maintenance-request-detail?id=${r.id}`);
                    }
                  }}
                  className="flex items-start gap-2 px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:ring-offset-1"
                >
                  <Wrench className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 leading-snug mb-0.5">{r.description}</p>
                    <p className="text-xs text-gray-500">
                      {r.property_name} · {formatStatusLabel(r.status)}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
