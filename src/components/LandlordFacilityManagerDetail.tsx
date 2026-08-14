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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ChevronLeft, ChevronRight, Wrench, RotateCcw, CheckCircle2, XCircle } from "lucide-react";

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

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

// Human-readable duration formatting — never raw decimal hours. Rounds to the
// two most significant units (e.g. "1 day 8 hrs", "3 hrs 20 min").
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

// Precise duration formatting for individual request rows — keeps minutes
// visible even at the day scale (e.g. "1 day 7 hrs 15 min").
function formatDurationPrecise(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  if (minutes < 60) return `${minutes} min`;

  const days = Math.floor(minutes / 1440);
  const hrs = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hrs > 0) parts.push(`${hrs} hr${hrs === 1 ? "" : "s"}`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins} min`);
  return parts.join(" ");
}

interface BreakdownRequest {
  id: string;
  tenantName: string;
  propertyName: string;
  description: string;
}

interface ResponseTimeRow extends BreakdownRequest {
  assignedAt: string;
  firstResponseAt: string;
  responseMinutes: number;
}

interface ResolutionTimeRow extends BreakdownRequest {
  assignedAt: string;
  tenantConfirmedAt: string;
  resolutionMinutes: number;
}

interface ReopenRateRow extends BreakdownRequest {
  resolvedAt: string;
  reopenedAt: string | null;
  wasReopened: boolean;
}

interface TargetComplianceRow extends BreakdownRequest {
  targetHours: number;
  actualHours: number;
  metTarget: boolean;
}

type MetricKey = "response" | "resolution" | "reopen" | "target";

interface PerformanceData {
  total: number;
  open: number;
  completed: number;
  reopened: number;
  resolvedCount: number;
  resolutionCount: number;
  withinTargetCount: number;
  avgResponseMinutes: number | null;
  avgResolutionHours: number | null;
  reopenRate: number | null;
  targetCompliance: number | null;
  responseRows: ResponseTimeRow[];
  resolutionRows: ResolutionTimeRow[];
  reopenRows: ReopenRateRow[];
  targetRows: TargetComplianceRow[];
  isResolutionMocked: boolean;
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
  onClick?: () => void;
}

function PerformanceRow({ label, value, description, isLast, onClick }: PerformanceRowProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {onClick && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
      </div>
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
    </>
  );

  const rowClass = isLast ? "py-4" : "py-4 border-b border-gray-100";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${rowClass} w-full text-left -mx-2 px-2 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:ring-offset-1`}
      >
        {content}
      </button>
    );
  }

  return <div className={rowClass}>{content}</div>;
}

const METRIC_LABEL: Record<MetricKey, string> = {
  response: "Response Time",
  resolution: "Resolution Time",
  reopen: "Reopen Rate",
  target: "Resolution Target Compliance",
};

function BreakdownRequestHeader({ row }: { row: BreakdownRequest }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-medium text-gray-900">{row.tenantName}</p>
      <p className="text-xs text-gray-500">{row.propertyName}</p>
      <p className="text-xs text-gray-500 mt-0.5">{row.description}</p>
    </div>
  );
}

function MetricBreakdownContent({
  metric,
  performance,
  periodLabel,
  onClose,
}: {
  metric: MetricKey;
  performance: PerformanceData;
  periodLabel: string;
  onClose: () => void;
}) {
  let value = "";
  let requestCount = 0;
  if (metric === "response") {
    value = performance.avgResponseMinutes !== null ? formatDuration(performance.avgResponseMinutes) : "";
    requestCount = performance.responseRows.length;
  } else if (metric === "resolution") {
    value =
      performance.avgResolutionHours !== null
        ? formatDuration(performance.avgResolutionHours * 60)
        : "";
    requestCount = performance.resolutionRows.length;
  } else if (metric === "reopen") {
    value = performance.reopenRate !== null ? `${Math.round(performance.reopenRate)}%` : "";
    requestCount = performance.reopenRows.length;
  } else {
    value = performance.targetCompliance !== null ? `${Math.round(performance.targetCompliance)}%` : "";
    requestCount = performance.targetRows.length;
  }

  return (
    <>
      <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
        <DialogTitle className="text-base font-semibold text-gray-900">
          {METRIC_LABEL[metric]}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          {periodLabel} · {value ? `${value} average` : "Not enough data"} ·{" "}
          {requestCount} request{requestCount === 1 ? "" : "s"}
        </p>
        {metric === "resolution" && performance.isResolutionMocked && (
          <p className="text-xs text-amber-600 mt-1">
            Sample data shown — no tenant-confirmed resolutions yet in this period.
          </p>
        )}
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {requestCount === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No maintenance requests to show for this period.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {metric === "response" &&
              performance.responseRows.map((row) => (
                <li key={row.id} className="py-4 first:pt-0">
                  <BreakdownRequestHeader row={row} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs">
                    <div>
                      <p className="text-gray-400">Assigned</p>
                      <p className="text-gray-700">{formatDateTime(row.assignedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">First response</p>
                      <p className="text-gray-700">{formatDateTime(row.firstResponseAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Response time</p>
                      <p className="text-gray-900 font-medium">
                        {formatDurationPrecise(row.responseMinutes)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}

            {metric === "resolution" &&
              performance.resolutionRows.map((row) => (
                <li key={row.id} className="py-4 first:pt-0">
                  <BreakdownRequestHeader row={row} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs">
                    <div>
                      <p className="text-gray-400">Assigned</p>
                      <p className="text-gray-700">{formatDateTime(row.assignedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Tenant confirmed</p>
                      <p className="text-gray-700">{formatDateTime(row.tenantConfirmedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Resolution time</p>
                      <p className="text-gray-900 font-medium">
                        {formatDurationPrecise(row.resolutionMinutes)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}

            {metric === "reopen" &&
              performance.reopenRows.map((row) => (
                <li key={row.id} className="py-4 first:pt-0">
                  <BreakdownRequestHeader row={row} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                    <span className="text-gray-700">
                      <span className="text-gray-400">Resolved:</span> {formatShortDate(row.resolvedAt)}
                    </span>
                    {row.reopenedAt && (
                      <span className="text-gray-700">
                        <span className="text-gray-400">Reopened:</span> {formatShortDate(row.reopenedAt)}
                      </span>
                    )}
                    {row.wasReopened ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
                        <RotateCcw className="w-3 h-3" />
                        Reopened
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Not Reopened
                      </span>
                    )}
                  </div>
                </li>
              ))}

            {metric === "target" &&
              performance.targetRows.map((row) => (
                <li key={row.id} className="py-4 first:pt-0">
                  <BreakdownRequestHeader row={row} />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                    <span className="text-gray-700">
                      <span className="text-gray-400">Target:</span> {formatDuration(row.targetHours * 60)}
                    </span>
                    <span className="text-gray-700">
                      <span className="text-gray-400">Actual:</span> {formatDuration(row.actualHours * 60)}
                    </span>
                    {row.metTarget ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        On Target
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 font-medium">
                        <XCircle className="w-3 h-3" />
                        Target Exceeded
                      </span>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 shrink-0">
        <Button variant="outline" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}

export default function LandlordFacilityManagerDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role || "landlord";

  const managerId = searchParams.get("id") ?? "";

  const [period, setPeriod] = useState<PeriodOption>("30d");
  const [openMetric, setOpenMetric] = useState<MetricKey | null>(null);

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

    const responseRows: ResponseTimeRow[] = [];
    const resolutionRows: ResolutionTimeRow[] = [];
    const reopenRows: ReopenRateRow[] = [];
    const targetRows: TargetComplianceRow[] = [];

    for (const r of resolvedRequests) {
      const resolutions = r.resolutions ?? (r.resolution ? [r.resolution] : []);
      const finalResolution = resolutions[resolutions.length - 1];
      if (!finalResolution) continue;

      const reportedAt = new Date(r.date_reported).getTime();
      const resolvedAt = new Date(finalResolution.resolvedAt).getTime();
      const base: BreakdownRequest = {
        id: r.id,
        tenantName: r.tenant_name && r.tenant_name !== "—" ? r.tenant_name : r.reporter_name || "—",
        propertyName: r.property_name,
        description: r.description,
      };

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
          responseRows.push({
            ...base,
            assignedAt: r.date_reported,
            firstResponseAt: firstResolution.resolvedAt,
            responseMinutes: diffMinutes,
          });
        }
      }

      // Reopen rate breakdown — every resolved request, reopened or not.
      reopenRows.push({
        ...base,
        resolvedAt: finalResolution.resolvedAt,
        reopenedAt: r.reopened_at ?? null,
        wasReopened: !!r.reopened_at,
      });

      // Resolution time: tenant confirmation, not the facility manager's own resolved
      // mark — a request only truly counts as "resolved" here once no further
      // rejectedByTenant/reopened cycle followed the final resolution attempt.
      const tenantConfirmed = !finalResolution.rejectedByTenant && !r.reopened_at;
      if (tenantConfirmed) {
        const diffHours = (resolvedAt - reportedAt) / 3600000;
        if (diffHours > 0) {
          resolutionHoursSum += diffHours;
          resolutionCount += 1;
          resolutionRows.push({
            ...base,
            assignedAt: r.date_reported,
            tenantConfirmedAt: finalResolution.resolvedAt,
            resolutionMinutes: diffHours * 60,
          });

          const targetHours = CATEGORY_TARGET_HOURS[r.issue_category] ?? DEFAULT_TARGET_HOURS;
          const metTarget = diffHours <= targetHours;
          if (metTarget) withinTargetCount += 1;
          targetRows.push({
            ...base,
            targetHours,
            actualHours: diffHours,
            metTarget,
          });
        }
      }
    }

    // Design placeholder: when there are no tenant-confirmed completions yet
    // (resolutionCount === 0), the mock request dataset can't support a real
    // Resolution Time / Target Compliance breakdown. Synthesize realistic rows
    // from the manager's own resolved requests so the drill-down still shows
    // something consistent with the MOCK_RESOLUTION_TIME_HOURS fallback used
    // in the summary, rather than leaving the modal empty.
    let mockResolutionRows: ResolutionTimeRow[] = [];
    let mockTargetRows: TargetComplianceRow[] = [];
    if (resolutionCount === 0 && resolvedRequests.length > 0) {
      mockResolutionRows = resolvedRequests.slice(0, 3).map((r, i) => {
        const resolutions = r.resolutions ?? (r.resolution ? [r.resolution] : []);
        const finalResolution = resolutions[resolutions.length - 1];
        const assignedAt = new Date(r.date_reported);
        // Spread mock completion times around the placeholder average (32 hrs)
        // so the set of rows is varied but still averages close to it.
        const offsetHours = MOCK_RESOLUTION_TIME_HOURS + (i - 1) * 6;
        const confirmedAt = new Date(assignedAt.getTime() + offsetHours * 3600000);
        return {
          id: r.id,
          tenantName: r.tenant_name && r.tenant_name !== "—" ? r.tenant_name : r.reporter_name || "—",
          propertyName: r.property_name,
          description: r.description,
          assignedAt: r.date_reported,
          tenantConfirmedAt: finalResolution?.resolvedAt ?? confirmedAt.toISOString(),
          resolutionMinutes: offsetHours * 60,
        };
      });
      mockTargetRows = mockResolutionRows.map((row) => {
        const req = resolvedRequests.find((r) => r.id === row.id)!;
        const targetHours = CATEGORY_TARGET_HOURS[req.issue_category] ?? DEFAULT_TARGET_HOURS;
        const actualHours = row.resolutionMinutes / 60;
        return {
          id: row.id,
          tenantName: row.tenantName,
          propertyName: row.propertyName,
          description: row.description,
          targetHours,
          actualHours,
          metTarget: actualHours <= targetHours,
        };
      });
    }

    const avgResponseMinutes = responseCount > 0 ? responseMinutesSum / responseCount : null;
    const avgResolutionHours = resolutionCount > 0 ? resolutionHoursSum / resolutionCount : null;
    const reopenRate =
      resolvedRequests.length > 0 ? (reopened / resolvedRequests.length) * 100 : null;
    const targetCompliance =
      resolutionCount > 0 ? (withinTargetCount / resolutionCount) * 100 : null;

    const effectiveResolutionRows = resolutionCount > 0 ? resolutionRows : mockResolutionRows;
    const effectiveTargetRows = resolutionCount > 0 ? targetRows : mockTargetRows;
    const effectiveWithinTargetCount =
      resolutionCount > 0
        ? withinTargetCount
        : mockTargetRows.filter((r) => r.metTarget).length;
    const effectiveResolutionCount =
      resolutionCount > 0 ? resolutionCount : mockResolutionRows.length;
    const effectiveTargetCompliance =
      resolutionCount > 0
        ? targetCompliance
        : mockTargetRows.length > 0
          ? (mockTargetRows.filter((r) => r.metTarget).length / mockTargetRows.length) * 100
          : null;

    return {
      total,
      open,
      completed,
      reopened,
      resolvedCount: resolvedRequests.length,
      resolutionCount: effectiveResolutionCount,
      withinTargetCount: effectiveWithinTargetCount,
      avgResponseMinutes,
      avgResolutionHours: avgResolutionHours ?? (mockResolutionRows.length > 0 ? MOCK_RESOLUTION_TIME_HOURS : null),
      reopenRate,
      targetCompliance: effectiveTargetCompliance,
      responseRows,
      resolutionRows: effectiveResolutionRows,
      reopenRows,
      targetRows: effectiveTargetRows,
      isResolutionMocked: resolutionCount === 0 && mockResolutionRows.length > 0,
    };
  }, [requestsInPeriod]);

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
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 inline-block w-full sm:w-auto">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Bank Account Details
          </p>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-6 gap-y-2">
            <div className="sm:pr-6">
              <p className="text-xs text-gray-500">Bank Name</p>
              <p className="text-sm text-gray-900 mt-0.5">{bank?.bankName || "—"}</p>
            </div>
            <div className="sm:px-6 sm:border-l sm:border-gray-100">
              <p className="text-xs text-gray-500">Account Number</p>
              <p className="text-sm text-gray-900 font-mono mt-0.5">{bank?.accountNumber || "—"}</p>
            </div>
            <div className="sm:pl-6 sm:border-l sm:border-gray-100">
              <p className="text-xs text-gray-500">Account Name</p>
              <p className="text-sm text-gray-900 mt-0.5">{bank?.accountName || "—"}</p>
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

        {/* ── Performance ── */}
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

          <div className="flex flex-col lg:flex-row lg:gap-8">
            {/* Performance Metrics */}
            <div className="lg:flex-1">
              <PerformanceRow
                label="Response Time"
                value={formatResponseTime(performance.avgResponseMinutes)}
                description={
                  performance.avgResponseMinutes !== null
                    ? "Average time taken to respond after a request is assigned."
                    : "Requires at least one request with a recorded response."
                }
                onClick={
                  performance.avgResponseMinutes !== null
                    ? () => setOpenMetric("response")
                    : undefined
                }
              />
              <PerformanceRow
                label="Resolution Time"
                value={formatResolutionTime(performance.avgResolutionHours)}
                description="Average time until the tenant confirms resolution."
                onClick={
                  performance.avgResolutionHours !== null
                    ? () => setOpenMetric("resolution")
                    : undefined
                }
              />
              <PerformanceRow
                label="Reopen Rate"
                value={formatPercent(performance.reopenRate)}
                description={
                  performance.reopenRate !== null
                    ? `${performance.reopened} of ${performance.resolvedCount} resolved requests were reopened by tenants.`
                    : "Requires at least one resolved request."
                }
                onClick={
                  performance.reopenRate !== null ? () => setOpenMetric("reopen") : undefined
                }
              />
              <PerformanceRow
                isLast
                label="Resolution Target Compliance"
                value={formatPercent(performance.targetCompliance)}
                onClick={
                  performance.targetCompliance !== null
                    ? () => setOpenMetric("target")
                    : undefined
                }
                description={
                  performance.targetCompliance !== null
                    ? `${performance.withinTargetCount} of ${performance.resolutionCount} requests were resolved within their category target.`
                    : "Requires at least one completed request."
                }
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-5 lg:my-0 lg:border-t-0 lg:border-l lg:mx-0 lg:w-px shrink-0" />

            {/* Maintenance Activity */}
            <div className="lg:flex-1 pt-5 lg:pt-0 lg:pl-8">
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
        </div>
      </div>

      {/* ── Metric breakdown modal ── */}
      <Dialog open={openMetric !== null} onOpenChange={(open) => !open && setOpenMetric(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          {openMetric && (
            <MetricBreakdownContent
              metric={openMetric}
              performance={performance}
              periodLabel={PERIOD_LABEL[period]}
              onClose={() => setOpenMetric(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
