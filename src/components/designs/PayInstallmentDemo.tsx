"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Download, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Mock data ─────────────────────────────────────────────────────────────────

const TODAY = new Date("2026-09-28");

function isOverdue(dueDate: string) {
  return new Date(`${dueDate}T00:00:00`) < TODAY;
}

type InstallmentStatus = "paid" | "pending";

interface MockInstallment {
  id: string;
  sequence: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidOn?: string;
}

const ALL_INSTALLMENTS: MockInstallment[] = [
  { id: "i1",  sequence: 1,  dueDate: "2026-02-15", amount: 450000, status: "paid", paidOn: "2026-02-12" },
  { id: "i2",  sequence: 2,  dueDate: "2026-03-15", amount: 450000, status: "paid", paidOn: "2026-03-14" },
  { id: "i3",  sequence: 3,  dueDate: "2026-04-15", amount: 450000, status: "paid", paidOn: "2026-04-10" },
  { id: "i4",  sequence: 4,  dueDate: "2026-05-15", amount: 450000, status: "pending" },
  { id: "i5",  sequence: 5,  dueDate: "2026-06-15", amount: 450000, status: "pending" },
  { id: "i6",  sequence: 6,  dueDate: "2026-07-15", amount: 450000, status: "pending" },
  { id: "i7",  sequence: 7,  dueDate: "2026-08-15", amount: 450000, status: "pending" },
  { id: "i8",  sequence: 8,  dueDate: "2026-09-15", amount: 450000, status: "pending" },
  { id: "i9",  sequence: 9,  dueDate: "2026-10-15", amount: 450000, status: "pending" },
  { id: "i10", sequence: 10, dueDate: "2026-11-15", amount: 450000, status: "pending" },
];

// The installment this invoice was opened for — this month's (Sept)
const CURRENT_INSTALLMENT_ID = "i8";
const currentInstallment = ALL_INSTALLMENTS.find(i => i.id === CURRENT_INSTALLMENT_ID)!;

const MOCK = {
  plan: {
    totalInstallments: ALL_INSTALLMENTS.length,
    chargeName: "Tenancy",
    scope: "tenancy" as const,
    planType: "equal" as const,
    totalValue:       ALL_INSTALLMENTS.reduce((s, i) => s + i.amount, 0),
    amountPaidToDate: ALL_INSTALLMENTS.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0),
  },
  property: {
    name: "Whitegate Apartments, Block C",
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
  },
  tenant: {
    name: "Ifeoma Adeyemi",
    phone: "+234 803 123 4567",
  },
  landlordBranding: {
    businessName: "Property Kraft Services",
    contactPhone: "08036322847",
    contactEmail: "hello@propertykraft.africa",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function fmtShort(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── InstallmentRow (used inside modal) ────────────────────────────────────────

function InstallmentRow({
  inst, checked, isCurrent, onToggle,
}: {
  inst: MockInstallment; checked: boolean; isCurrent: boolean; onToggle: () => void;
}) {
  const overdue = isOverdue(inst.dueDate);
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left transition-colors ${
        overdue ? "hover:bg-red-50" : "hover:bg-orange-50"
      }`}
    >
      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
        checked ? "bg-[#FF5000] border-[#FF5000]" : "border-gray-300 bg-white"
      }`}>
        {checked && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] text-[#1a1b23] font-medium">Installment {inst.sequence}</span>
          {isCurrent && (
            <span className="text-[9px] bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              this invoice
            </span>
          )}
        </div>
        <span className={`text-[11px] ${overdue ? "text-red-400" : "text-gray-400"}`}>
          {overdue ? `Overdue · ${fmtShort(inst.dueDate)}` : `Due ${fmtShort(inst.dueDate)}`}
        </span>
      </div>
      <span className="text-[13px] text-[#1a1b23] font-semibold tabular-nums shrink-0">{fmt(inst.amount)}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PayInstallmentDemo() {
  const { plan, property, tenant, landlordBranding } = MOCK;

  const pendingInstallments = ALL_INSTALLMENTS.filter(i => i.status === "pending");
  const overdueInstallments = pendingInstallments.filter(i => isOverdue(i.dueDate));
  const upcomingInstallments = pendingInstallments.filter(i => !isOverdue(i.dueDate));
  const paidCount = ALL_INSTALLMENTS.filter(i => i.status === "paid").length;

  // Invoice state
  const [isPaid, setIsPaid] = useState(false);
  const [paidInstallments, setPaidInstallments] = useState<MockInstallment[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([CURRENT_INSTALLMENT_ID]));
  const [isProcessing, setIsProcessing] = useState(false);

  const openModal = () => {
    setSelectedIds(new Set([CURRENT_INSTALLMENT_ID])); // reset to just current each time
    setShowModal(true);
  };

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedList = ALL_INSTALLMENTS.filter(i => selectedIds.has(i.id));
  const modalTotal = selectedList.reduce((s, i) => s + i.amount, 0);

  const handleProceed = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowModal(false);
      setPaidInstallments(selectedList);
      setIsPaid(true);
    }, 1200);
  };

  const handleReset = () => {
    setIsPaid(false);
    setPaidInstallments([]);
    setSelectedIds(new Set([CURRENT_INSTALLMENT_ID]));
  };

  const receiptTotal = paidInstallments.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Platform header */}
        <div className="px-6 py-4">
          <Image alt="Lizt" className="h-[40px] w-auto" src="/lizt.svg" width={120} height={40} />
        </div>

        {/* Document */}
        <div className="flex justify-center px-4 pb-12">
          <div className="bg-white shadow-sm max-w-[850px] w-full px-8 sm:px-12 py-12 relative">

            {/* Paid stamp */}
            {isPaid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div style={{ transform: "rotate(-15deg) translateX(-100px) translateY(-50px)" }}>
                  <svg width="0" height="0" className="absolute">
                    <defs>
                      <filter id="distressed-multi">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                      </filter>
                    </defs>
                  </svg>
                  <div className="px-8 py-4 border-4 rounded-md" style={{ borderColor: "rgba(34,139,34,0.6)", filter: "url(#distressed-multi)", opacity: 0.85 }}>
                    <div className="absolute inset-1 border-2 rounded-sm pointer-events-none" style={{ borderColor: "rgba(34,139,34,0.4)" }} />
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-4xl font-extrabold tracking-widest uppercase" style={{ color: "rgba(34,139,34,0.6)", fontFamily: 'Impact,"Arial Black",sans-serif', textShadow: "2px 2px 0 rgba(34,139,34,0.25)" }}>
                        PAID
                      </div>
                      <div className="text-sm font-bold tracking-wide uppercase" style={{ color: "rgba(34,139,34,0.6)", fontFamily: 'Impact,"Arial Black",sans-serif' }}>
                        {fmtDate(new Date().toISOString().slice(0, 10))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Branding */}
            <div className="flex items-center justify-end mb-10">
              <Image alt="Property Kraft" src="/designs/receipt/property-kraft.png" width={120} height={40} className="h-[32px] w-auto" />
            </div>

            {/* Title */}
            <h1 className="text-[16px] font-bold text-[#1a1b23] mb-2 uppercase text-center">
              Payment Plan Invoice
            </h1>
            <p className="text-[11px] text-gray-500 text-center mb-8">
              {plan.chargeName} · {plan.totalInstallments} installments
            </p>

            {/* Property / Tenant / Plan overview */}
            <div className="mb-8 space-y-4">
              <div>
                <p className="text-[11px] text-gray-500 mb-1">Property</p>
                <p className="text-[11px] text-[#1a1b23] font-bold">{property.name}</p>
                <p className="text-[11px] text-[#1a1b23]">{property.address}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1">Tenant</p>
                <p className="text-[11px] text-[#1a1b23] font-bold">{tenant.name}</p>
                <p className="text-[11px] text-[#1a1b23]">{tenant.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">Payment Plan</p>
                  <p className="text-[11px] text-[#1a1b23] font-bold">{plan.chargeName}</p>
                  <p className="text-[10px] text-gray-500">
                    {plan.scope === "tenancy" ? "Tenancy Plan" : "Single-Charge Plan"} · Equal Installments
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">Paid to date</p>
                  <p className="text-[11px] text-[#1a1b23] font-bold">{fmt(plan.amountPaidToDate)}</p>
                  <p className="text-[10px] text-gray-500">{paidCount} of {plan.totalInstallments} installments</p>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

            {/* ── Invoice Details ── */}
            <div className="mb-8">
              <h2 className="text-[12px] font-bold text-[#1a1b23] mb-4 uppercase">Invoice Details</h2>

              <div className="border-t border-gray-200">
                {isPaid ? (
                  // Post-payment: list every installment that was paid
                  paidInstallments.map((inst, idx) => (
                    <div key={inst.id} className={`flex justify-between items-center py-2.5 ${idx < paidInstallments.length - 1 ? "border-b border-gray-100" : ""}`}>
                      <div>
                        <span className="text-[11px] text-[#1a1b23]">
                          Installment {inst.sequence} of {plan.totalInstallments}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-2">due {fmtShort(inst.dueDate)}</span>
                      </div>
                      <span className="text-[13px] text-[#1a1b23] font-bold tabular-nums">{fmt(inst.amount)}</span>
                    </div>
                  ))
                ) : (
                  // Pre-payment: show only the current installment (clean)
                  <div className="flex justify-between items-center py-2.5">
                    <div>
                      <span className="text-[11px] text-[#1a1b23]">
                        Installment {currentInstallment.sequence} of {plan.totalInstallments}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">due {fmtShort(currentInstallment.dueDate)}</span>
                    </div>
                    <span className="text-[13px] text-[#1a1b23] font-bold tabular-nums">{fmt(currentInstallment.amount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-3 border-t-2 border-gray-900 mt-1">
                <span className="text-[12px] text-[#1a1b23] font-bold uppercase tracking-wide">
                  Total{isPaid && paidInstallments.length > 1 ? ` (${paidInstallments.length} installments)` : ""}
                </span>
                <span className="text-[20px] text-[#1a1b23] font-bold tabular-nums">
                  {fmt(isPaid ? receiptTotal : currentInstallment.amount)}
                </span>
              </div>

              {/* Post-payment details */}
              {isPaid && (
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-[#1a1b23]">Paid On</span>
                    <span className="text-[11px] text-[#1a1b23] font-bold">{fmtDate(new Date().toISOString().slice(0, 10))}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-[#1a1b23]">Payment Method</span>
                    <span className="text-[11px] text-[#1a1b23] font-bold">Card</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-[#1a1b23]">Payment Reference</span>
                    <span className="text-[11px] text-[#1a1b23] font-mono">PSK-8823914-DEMO</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[11px] text-[#1a1b23]">Receipt Number</span>
                    <span className="text-[11px] text-[#1a1b23] font-mono">RCT-00219</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Plan Summary */}
            <div className="mb-8 pt-4 border-t border-gray-100">
              <h3 className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">Payment Plan Summary</h3>
              <div className="space-y-1">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[11px] text-gray-500">Total Plan Value</span>
                  <span className="text-[11px] text-gray-600 font-medium">{fmt(plan.totalValue)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[11px] text-gray-500">Amount Paid to Date</span>
                  <span className="text-[11px] text-gray-600 font-medium">{fmt(plan.amountPaidToDate)}</span>
                </div>
              </div>
            </div>

            {/* Paid banner */}
            {isPaid && (
              <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-[12px] text-emerald-800 font-semibold mb-1">Payment Received</p>
                <p className="text-[11px] text-emerald-700">
                  {paidInstallments.length === 1
                    ? `Installment ${paidInstallments[0].sequence} has been marked as paid. Thank you.`
                    : `${paidInstallments.length} installments have been marked as paid. Thank you.`}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

            {!isPaid ? (
              <div>
                <Button
                  onClick={openModal}
                  className="w-full sm:w-auto h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19]"
                >
                  Pay {fmt(currentInstallment.amount)}
                </Button>
                <p className="text-[11px] text-gray-500 mt-3">This is a demo — no real payment will be made.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="w-full sm:w-auto h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19]">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button variant="outline" className="w-full sm:w-auto h-10 px-8" onClick={handleReset}>
                  Reset Demo
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="h-[1px] bg-gray-200 mt-14 mb-4" />
            <div className="text-center text-[10px] text-gray-400">
              <p>{landlordBranding.businessName}</p>
              <p>{landlordBranding.contactPhone} &bull; {landlordBranding.contactEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Installment selection modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isProcessing && setShowModal(false)}
          />

          {/* Panel — full-width bottom sheet on mobile, centered card on desktop */}
          <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col max-h-[90vh] sm:max-h-[80vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-[15px] font-semibold text-[#1a1b23]">Pay installments</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Select which installments to include</p>
              </div>
              <button
                onClick={() => !isProcessing && setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Installment list */}
            <div className="overflow-y-auto flex-1">
              {/* Overdue */}
              {overdueInstallments.length > 0 && (
                <>
                  <div className="px-5 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
                    <span className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">Overdue</span>
                    <button
                      onClick={() => setSelectedIds(prev => new Set([...prev, ...overdueInstallments.map(i => i.id)]))}
                      className="text-[10px] text-red-500 font-medium hover:underline"
                    >
                      Select all overdue
                    </button>
                  </div>
                  {overdueInstallments.map(inst => (
                    <InstallmentRow
                      key={inst.id}
                      inst={inst}
                      checked={selectedIds.has(inst.id)}
                      isCurrent={inst.id === CURRENT_INSTALLMENT_ID}
                      onToggle={() => toggle(inst.id)}
                    />
                  ))}
                </>
              )}

              {/* Upcoming */}
              {upcomingInstallments.length > 0 && (
                <>
                  <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Upcoming</span>
                  </div>
                  {upcomingInstallments.map(inst => (
                    <InstallmentRow
                      key={inst.id}
                      inst={inst}
                      checked={selectedIds.has(inst.id)}
                      isCurrent={inst.id === CURRENT_INSTALLMENT_ID}
                      onToggle={() => toggle(inst.id)}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Footer — total + CTA */}
            <div className="px-5 pt-4 pb-6 border-t border-gray-100 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-500">
                  {selectedIds.size} installment{selectedIds.size !== 1 ? "s" : ""} selected
                </span>
                <span className="text-[16px] font-bold text-[#1a1b23] tabular-nums">{fmt(modalTotal)}</span>
              </div>
              <Button
                onClick={handleProceed}
                disabled={isProcessing}
                className="w-full h-11 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-60 text-[13px] font-semibold"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting to checkout...</>
                ) : (
                  `Proceed to checkout · ${fmt(modalTotal)}`
                )}
              </Button>
              <button
                onClick={() => !isProcessing && setShowModal(false)}
                className="w-full text-center text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
