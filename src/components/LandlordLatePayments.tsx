/* eslint-disable */
"use client";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LatePayment {
  id: string;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  unit: string;
  /** Full amount originally due for the period */
  originalAmount: number;
  /** Amount already paid (0 for full non-payers, > 0 for partial payers) */
  amountPaid: number;
  /** originalAmount − amountPaid */
  amountOverdue: number;
  dueDate: string;
  /** Pre-computed days since dueDate, used for sorting and badge tier */
  daysLate: number;
  lastPaymentDate: string;
  tenantId: string;
}

// ── Severity ──────────────────────────────────────────────────────────────────

export type Tier = "critical" | "moderate" | "recent";

export function getTier(daysLate: number): Tier {
  if (daysLate > 30) return "critical";
  if (daysLate >= 8) return "moderate";
  return "recent";
}

const TIER_BADGE: Record<Tier, string> = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  moderate: "bg-orange-100 text-orange-700 border border-orange-200",
  recent:   "bg-amber-100 text-amber-700 border border-amber-200",
};

// ── Mock data ─────────────────────────────────────────────────────────────────
// 9 records: 1 extreme (95d), 2 critical (31–60d), 3 moderate (8–30d),
// 2 amber (3–7d), 1 barely-late (2d).
// lp-003 and lp-006 are partial payers.

export const LATE_PAYMENTS_MOCK: LatePayment[] = [
  {
    id: "lp-001",
    tenantName: "Biodun Adewale",
    tenantPhone: "+234 803 991 2244",
    propertyName: "Lekki Phase 2 Mansion",
    unit: "Main House",
    originalAmount: 4_800_000,
    amountPaid: 0,
    amountOverdue: 4_800_000,
    dueDate: "2026-06-07",
    daysLate: 95,
    lastPaymentDate: "2025-08-01",
    tenantId: "t-lp-001",
  },
  {
    id: "lp-002",
    tenantName: "Chinyere Okonkwo",
    tenantPhone: "+234 807 334 5561",
    propertyName: "Victoria Island Terrace",
    unit: "Block B, Flat 3",
    originalAmount: 2_400_000,
    amountPaid: 0,
    amountOverdue: 2_400_000,
    dueDate: "2026-07-23",
    daysLate: 49,
    lastPaymentDate: "2025-07-23",
    tenantId: "t-lp-002",
  },
  {
    // Partial payer: paid ₦600k of ₦2.4m
    id: "lp-003",
    tenantName: "Emeka Nwosu",
    tenantPhone: "+234 802 118 7743",
    propertyName: "Ikoyi Gardens",
    unit: "Flat 5A",
    originalAmount: 2_400_000,
    amountPaid: 600_000,
    amountOverdue: 1_800_000,
    dueDate: "2026-07-31",
    daysLate: 41,
    lastPaymentDate: "2026-08-10",
    tenantId: "t-lp-003",
  },
  {
    id: "lp-004",
    tenantName: "Funmilayo Adesanya",
    tenantPhone: "+234 909 776 3320",
    propertyName: "Chevy View Estate",
    unit: "Plot 22, Block C",
    originalAmount: 1_500_000,
    amountPaid: 0,
    amountOverdue: 1_500_000,
    dueDate: "2026-08-05",
    daysLate: 36,
    lastPaymentDate: "2025-08-05",
    tenantId: "t-lp-004",
  },
  {
    id: "lp-005",
    tenantName: "Tunde Balogun",
    tenantPhone: "+234 806 554 0091",
    propertyName: "Ajah Garden Estate",
    unit: "Block 14, Flat 2",
    originalAmount: 1_200_000,
    amountPaid: 0,
    amountOverdue: 1_200_000,
    dueDate: "2026-08-17",
    daysLate: 24,
    lastPaymentDate: "2025-08-17",
    tenantId: "t-lp-005",
  },
  {
    // Partial payer: paid ₦400k of ₦1.2m
    id: "lp-006",
    tenantName: "Ngozi Obi",
    tenantPhone: "+234 812 233 8854",
    propertyName: "Magodo Phase 1",
    unit: "House 9",
    originalAmount: 1_200_000,
    amountPaid: 400_000,
    amountOverdue: 800_000,
    dueDate: "2026-08-22",
    daysLate: 19,
    lastPaymentDate: "2026-08-28",
    tenantId: "t-lp-006",
  },
  {
    id: "lp-007",
    tenantName: "Rotimi Fashola",
    tenantPhone: "+234 805 672 1138",
    propertyName: "Surulere Duplex",
    unit: "Ground Floor",
    originalAmount: 950_000,
    amountPaid: 0,
    amountOverdue: 950_000,
    dueDate: "2026-09-03",
    daysLate: 7,
    lastPaymentDate: "2025-09-03",
    tenantId: "t-lp-007",
  },
  {
    id: "lp-008",
    tenantName: "Amaka Eze",
    tenantPhone: "+234 813 445 0076",
    propertyName: "Festac Town Estate",
    unit: "24D Close",
    originalAmount: 650_000,
    amountPaid: 0,
    amountOverdue: 650_000,
    dueDate: "2026-09-05",
    daysLate: 5,
    lastPaymentDate: "2025-09-05",
    tenantId: "t-lp-008",
  },
  {
    id: "lp-009",
    tenantName: "Babatunde Lawal",
    tenantPhone: "+234 801 990 3357",
    propertyName: "Yaba Modern Flat",
    unit: "Flat 2B",
    originalAmount: 450_000,
    amountPaid: 0,
    amountOverdue: 450_000,
    dueDate: "2026-09-08",
    daysLate: 2,
    lastPaymentDate: "2025-09-08",
    tenantId: "t-lp-009",
  },
];

// ── Summary consumed by the Tenancies chip ─────────────────────────────────────

export const LATE_PAYMENTS_SUMMARY = {
  count: LATE_PAYMENTS_MOCK.length,
  totalOverdue: LATE_PAYMENTS_MOCK.reduce((s, p) => s + p.amountOverdue, 0),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface LandlordLatePaymentsProps {
  isMobile?: boolean;
  onMenuClick?: () => void;
}

export default function LandlordLatePayments({
  isMobile = false,
  onMenuClick,
}: LandlordLatePaymentsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  const [activeFilter, setActiveFilter] = useState<Tier | "all">("all");
  const [remindersSent, setRemindersSent] = useState<Set<string>>(new Set());

  const tierCounts = useMemo(() => {
    const counts = { critical: 0, moderate: 0, recent: 0 };
    LATE_PAYMENTS_MOCK.forEach((p) => counts[getTier(p.daysLate)]++);
    return counts;
  }, []);

  const totalOverdue = LATE_PAYMENTS_MOCK.reduce((s, p) => s + p.amountOverdue, 0);

  // Sort most-overdue first, then filter by active tier
  const visible = useMemo(() => {
    return [...LATE_PAYMENTS_MOCK]
      .sort((a, b) => b.daysLate - a.daysLate)
      .filter((p) => activeFilter === "all" || getTier(p.daysLate) === activeFilter);
  }, [activeFilter]);

  function sendReminder(id: string, name: string) {
    setRemindersSent((prev) => new Set(prev).add(id));
    toast.success(`Reminder sent to ${name}`);
  }

  // ── Hamburger ────────────────────────────────────────────────────────────────

  const MenuButton = () =>
    isMobile && onMenuClick ? (
      <button
        onClick={onMenuClick}
        className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-slate-100"
      >
        <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    ) : null;

  // ── Zero state ───────────────────────────────────────────────────────────────

  if (LATE_PAYMENTS_MOCK.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
        <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white shadow-sm">
          <div className="px-4 lg:px-8 py-4 flex items-center gap-3">
            <MenuButton />
            <button
              onClick={() => router.push(`/${userRole}/tenancies`)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-slate-900">Late Payments</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center lg:pt-[72px] px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">All payments on time</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your tenants are on top of their payments. No overdue rent found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white shadow-sm">

        {/* Title row */}
        <div className="px-4 lg:px-8 py-4 flex items-center gap-3">
          <MenuButton />
          <button
            onClick={() => router.push(`/${userRole}/tenancies`)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-semibold text-slate-900">Late Payments</h1>
          <span className="ml-auto text-xs text-gray-400 font-medium hidden sm:block">
            {LATE_PAYMENTS_MOCK.length} overdue · {fmtCurrency(totalOverdue)}
          </span>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        {/* Stats + filter row */}
        <div className="px-4 lg:px-8 py-3 flex flex-wrap items-center gap-3">

          {/* Summary pills */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="text-sm font-semibold text-gray-900 shrink-0">{fmtCurrency(totalOverdue)}</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                {tierCounts.critical} critical
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                {tierCounts.moderate} moderate
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {tierCounts.recent} recent
              </span>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(["all", "critical", "moderate", "recent"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  activeFilter === t
                    ? "border-[#FF5000] bg-[#FFF3EB] text-[#FF5000]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                }`}
              >
                {t === "all" ? `All (${LATE_PAYMENTS_MOCK.length})` : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto lg:pt-[152px]">
        <div className="px-4 sm:px-6 pt-6 pb-8">

          {visible.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <p className="text-gray-700 text-sm font-medium mb-1">No payments in this tier</p>
              <p className="text-gray-400 text-xs">Try a different filter.</p>
            </div>
          ) : (
            <>
              {/* ── Desktop table ────────────────────────────────────────────── */}
              <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property / Unit</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount Overdue</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Paid</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Late</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {visible.map((p) => {
                      const tier = getTier(p.daysLate);
                      const sent = remindersSent.has(p.id);
                      const isPartial = p.amountPaid > 0;
                      return (
                        <tr
                          key={p.id}
                          className={`transition-colors ${sent ? "bg-green-50/40" : "hover:bg-gray-50"}`}
                        >
                          {/* Tenant */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0">
                                <span className="text-xs font-semibold text-[#FF5000]">{getInitials(p.tenantName)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 leading-tight">{p.tenantName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{p.tenantPhone}</p>
                              </div>
                            </div>
                          </td>
                          {/* Property */}
                          <td className="px-4 py-4">
                            <p className="text-gray-900 leading-tight">{p.propertyName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.unit}</p>
                          </td>
                          {/* Amount */}
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-900">{fmtCurrency(p.amountOverdue)}</p>
                            {isPartial && (
                              <p className="text-xs text-amber-600 mt-0.5">
                                paid {fmtCurrency(p.amountPaid)} of {fmtCurrency(p.originalAmount)}
                              </p>
                            )}
                          </td>
                          {/* Due date */}
                          <td className="px-4 py-4 text-gray-600 text-sm">{fmtDate(p.dueDate)}</td>
                          {/* Last paid */}
                          <td className="px-4 py-4 text-gray-400 text-xs">{fmtDate(p.lastPaymentDate)}</td>
                          {/* Days late badge */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${TIER_BADGE[tier]}`}>
                              <Clock className="w-3 h-3 shrink-0" />
                              {p.daysLate}d late
                            </span>
                          </td>
                          {/* Action */}
                          <td className="px-6 py-4 text-right">
                            {sent ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => sendReminder(p.id, p.tenantName)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-[#FF5000] hover:text-[#FF5000] hover:bg-[#FFF3EB] transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                Send reminder
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ─────────────────────────────────────────────── */}
              <div className="sm:hidden space-y-3">
                {visible.map((p) => {
                  const tier = getTier(p.daysLate);
                  const sent = remindersSent.has(p.id);
                  const isPartial = p.amountPaid > 0;
                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 ${sent ? "bg-green-50/60" : ""}`}
                    >
                      {/* Row 1: avatar + name + days-late badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-[#FF5000]">{getInitials(p.tenantName)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm leading-tight truncate">{p.tenantName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{p.tenantPhone}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${TIER_BADGE[tier]}`}>
                          <Clock className="w-3 h-3" />
                          {p.daysLate}d late
                        </span>
                      </div>

                      {/* Row 2: detail grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs mb-3">
                        <div>
                          <p className="text-gray-400">Property</p>
                          <p className="text-gray-900 font-medium mt-0.5 leading-snug">{p.propertyName}</p>
                          <p className="text-gray-400">{p.unit}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Amount overdue</p>
                          <p className="text-gray-900 font-semibold mt-0.5">{fmtCurrency(p.amountOverdue)}</p>
                          {isPartial && (
                            <p className="text-amber-600 mt-0.5">
                              paid {fmtCurrency(p.amountPaid)} of {fmtCurrency(p.originalAmount)}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-400">Due date</p>
                          <p className="text-gray-700 mt-0.5">{fmtDate(p.dueDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Last paid</p>
                          <p className="text-gray-700 mt-0.5">{fmtDate(p.lastPaymentDate)}</p>
                        </div>
                      </div>

                      {/* Row 3: action */}
                      <div className="border-t border-gray-50 pt-3">
                        {sent ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Reminder sent
                          </span>
                        ) : (
                          <button
                            onClick={() => sendReminder(p.id, p.tenantName)}
                            className="inline-flex items-center gap-1.5 w-full justify-center px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-[#FF5000] hover:text-[#FF5000] hover:bg-[#FFF3EB] transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            Send reminder
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
