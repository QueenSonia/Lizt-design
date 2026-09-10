/* eslint-disable */
"use client";
import { useMemo } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentType = "Rent" | "Diesel Fee" | "Service Charge" | "Payment Plan";

export interface LatePayment {
  id: string;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  unit: string;
  paymentType: PaymentType;
  /** Full amount originally due */
  originalAmount: number;
  /** Amount already paid (0 for full non-payers, > 0 for partial payers) */
  amountPaid: number;
  /** originalAmount − amountPaid */
  amountOverdue: number;
  dueDate: string;
  /** Pre-computed days since dueDate; list sorted descending on this */
  daysLate: number;
  /** Date of last installment paid — only meaningful for Payment Plan rows; null otherwise */
  lastInstallmentDate: string | null;
  tenantId: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// 9 records sorted most-overdue first.
// lp-003 and lp-006 are Payment Plan partial payers.
// lp-004 Service Charge, lp-007 Diesel Fee, rest Rent.

export const LATE_PAYMENTS_MOCK: LatePayment[] = [
  {
    id: "lp-001",
    tenantName: "Biodun Adewale",
    tenantPhone: "+234 803 991 2244",
    propertyName: "Lekki Phase 2 Mansion",
    unit: "Main House",
    paymentType: "Rent",
    originalAmount: 4_800_000,
    amountPaid: 0,
    amountOverdue: 4_800_000,
    dueDate: "2026-06-07",
    daysLate: 95,
    lastInstallmentDate: null,
    tenantId: "t-lp-001",
  },
  {
    id: "lp-002",
    tenantName: "Chinyere Okonkwo",
    tenantPhone: "+234 807 334 5561",
    propertyName: "Victoria Island Terrace",
    unit: "Block B, Flat 3",
    paymentType: "Rent",
    originalAmount: 2_400_000,
    amountPaid: 0,
    amountOverdue: 2_400_000,
    dueDate: "2026-07-23",
    daysLate: 49,
    lastInstallmentDate: null,
    tenantId: "t-lp-002",
  },
  {
    // Payment Plan: paid ₦600k of ₦2.4m plan; last installment on 10 Aug
    id: "lp-003",
    tenantName: "Emeka Nwosu",
    tenantPhone: "+234 802 118 7743",
    propertyName: "Ikoyi Gardens",
    unit: "Flat 5A",
    paymentType: "Payment Plan",
    originalAmount: 2_400_000,
    amountPaid: 600_000,
    amountOverdue: 1_800_000,
    dueDate: "2026-07-31",
    daysLate: 41,
    lastInstallmentDate: "2026-08-10",
    tenantId: "t-lp-003",
  },
  {
    id: "lp-004",
    tenantName: "Funmilayo Adesanya",
    tenantPhone: "+234 909 776 3320",
    propertyName: "Chevy View Estate",
    unit: "Plot 22, Block C",
    paymentType: "Service Charge",
    originalAmount: 1_500_000,
    amountPaid: 0,
    amountOverdue: 1_500_000,
    dueDate: "2026-08-05",
    daysLate: 36,
    lastInstallmentDate: null,
    tenantId: "t-lp-004",
  },
  {
    id: "lp-005",
    tenantName: "Tunde Balogun",
    tenantPhone: "+234 806 554 0091",
    propertyName: "Ajah Garden Estate",
    unit: "Block 14, Flat 2",
    paymentType: "Rent",
    originalAmount: 1_200_000,
    amountPaid: 0,
    amountOverdue: 1_200_000,
    dueDate: "2026-08-17",
    daysLate: 24,
    lastInstallmentDate: null,
    tenantId: "t-lp-005",
  },
  {
    // Payment Plan: paid ₦400k of ₦1.2m plan; last installment on 28 Aug
    id: "lp-006",
    tenantName: "Ngozi Obi",
    tenantPhone: "+234 812 233 8854",
    propertyName: "Magodo Phase 1",
    unit: "House 9",
    paymentType: "Payment Plan",
    originalAmount: 1_200_000,
    amountPaid: 400_000,
    amountOverdue: 800_000,
    dueDate: "2026-08-22",
    daysLate: 19,
    lastInstallmentDate: "2026-08-28",
    tenantId: "t-lp-006",
  },
  {
    id: "lp-007",
    tenantName: "Rotimi Fashola",
    tenantPhone: "+234 805 672 1138",
    propertyName: "Surulere Duplex",
    unit: "Ground Floor",
    paymentType: "Diesel Fee",
    originalAmount: 950_000,
    amountPaid: 0,
    amountOverdue: 950_000,
    dueDate: "2026-09-03",
    daysLate: 7,
    lastInstallmentDate: null,
    tenantId: "t-lp-007",
  },
  {
    id: "lp-008",
    tenantName: "Amaka Eze",
    tenantPhone: "+234 813 445 0076",
    propertyName: "Festac Town Estate",
    unit: "24D Close",
    paymentType: "Rent",
    originalAmount: 650_000,
    amountPaid: 0,
    amountOverdue: 650_000,
    dueDate: "2026-09-05",
    daysLate: 5,
    lastInstallmentDate: null,
    tenantId: "t-lp-008",
  },
  {
    id: "lp-009",
    tenantName: "Babatunde Lawal",
    tenantPhone: "+234 801 990 3357",
    propertyName: "Yaba Modern Flat",
    unit: "Flat 2B",
    paymentType: "Rent",
    originalAmount: 450_000,
    amountPaid: 0,
    amountOverdue: 450_000,
    dueDate: "2026-09-08",
    daysLate: 2,
    lastInstallmentDate: null,
    tenantId: "t-lp-009",
  },
];

// ── Summary consumed by the Tenancies toolbar chip ────────────────────────────

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

  const totalOverdue = LATE_PAYMENTS_SUMMARY.totalOverdue;

  // Sorted most-late first; data is static so deps array is empty
  const sorted = useMemo(
    () => [...LATE_PAYMENTS_MOCK].sort((a, b) => b.daysLate - a.daysLate),
    []
  );

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
          <span className="ml-auto text-xs text-gray-500 font-medium">
            {LATE_PAYMENTS_MOCK.length} overdue · {fmtCurrency(totalOverdue)}
          </span>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto lg:pt-[72px]">
        <div className="px-4 sm:px-6 pt-6 pb-8">

          {/* ── Desktop table ─────────────────────────────────────────────── */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property / Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount Overdue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Installment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((p) => {
                  const isPartial = p.amountPaid > 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
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
                      {/* Payment Type */}
                      <td className="px-4 py-4 text-gray-600 text-sm">{p.paymentType}</td>
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
                      {/* Last Installment — Payment Plan only */}
                      <td className="px-4 py-4 text-sm">
                        {p.lastInstallmentDate
                          ? <span className="text-gray-600">{fmtDate(p.lastInstallmentDate)}</span>
                          : <span className="text-gray-300 select-none">—</span>
                        }
                      </td>
                      {/* Days Late — plain text */}
                      <td className="px-4 py-4 text-gray-700 text-sm font-medium">{p.daysLate}d</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ──────────────────────────────────────────────── */}
          <div className="sm:hidden space-y-3">
            {sorted.map((p) => {
              const isPartial = p.amountPaid > 0;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4">
                  {/* Row 1: avatar + name + days late */}
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
                    <span className="shrink-0 text-sm font-semibold text-gray-700">{p.daysLate}d late</span>
                  </div>

                  {/* Row 2: detail grid */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
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
                      <p className="text-gray-400">Payment type</p>
                      <p className="text-gray-700 mt-0.5">{p.paymentType}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Due date</p>
                      <p className="text-gray-700 mt-0.5">{fmtDate(p.dueDate)}</p>
                    </div>
                    {p.lastInstallmentDate && (
                      <div>
                        <p className="text-gray-400">Last installment</p>
                        <p className="text-gray-700 mt-0.5">{fmtDate(p.lastInstallmentDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
