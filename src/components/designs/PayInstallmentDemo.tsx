"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown, Download, Loader2, Check } from "lucide-react";
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
  { id: "i1", sequence: 1, dueDate: "2026-02-15", amount: 450000, status: "paid", paidOn: "2026-02-12" },
  { id: "i2", sequence: 2, dueDate: "2026-03-15", amount: 450000, status: "paid", paidOn: "2026-03-14" },
  { id: "i3", sequence: 3, dueDate: "2026-04-15", amount: 450000, status: "paid", paidOn: "2026-04-10" },
  { id: "i4", sequence: 4, dueDate: "2026-05-15", amount: 450000, status: "pending" },
  { id: "i5", sequence: 5, dueDate: "2026-06-15", amount: 450000, status: "pending" },
  { id: "i6", sequence: 6, dueDate: "2026-07-15", amount: 450000, status: "pending" },
  { id: "i7", sequence: 7, dueDate: "2026-08-15", amount: 450000, status: "pending" },
  { id: "i8", sequence: 8, dueDate: "2026-09-15", amount: 450000, status: "pending" },
  { id: "i9", sequence: 9, dueDate: "2026-10-15", amount: 450000, status: "pending" },
  { id: "i10", sequence: 10, dueDate: "2026-11-15", amount: 450000, status: "pending" },
];

// The installment this invoice was originally opened for
const CURRENT_INSTALLMENT_ID = "i4";

const MOCK = {
  plan: {
    totalInstallments: ALL_INSTALLMENTS.length,
    chargeName: "Tenancy",
    scope: "tenancy" as const,
    planType: "equal" as const,
    totalValue: ALL_INSTALLMENTS.reduce((s, i) => s + i.amount, 0),
    amountPaidToDate: ALL_INSTALLMENTS.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0),
  },
  property: {
    name: "Whitegate Apartments, Block C",
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
  },
  tenant: {
    name: "Ifeoma Adeyemi",
    phone: "+234 803 123 4567",
    email: "ifeoma.adeyemi@example.com",
  },
  landlordBranding: {
    businessName: "Property Kraft Services",
    contactPhone: "08036322847",
    contactEmail: "hello@propertykraft.africa",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateShort(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PayInstallmentDemo() {
  const { plan, property, tenant, landlordBranding } = MOCK;

  const overdueInstallments = ALL_INSTALLMENTS.filter(i => i.status === "pending" && isOverdue(i.dueDate));
  const upcomingInstallments = ALL_INSTALLMENTS.filter(i => i.status === "pending" && !isOverdue(i.dueDate));
  const pendingInstallments = ALL_INSTALLMENTS.filter(i => i.status === "pending");
  const paidInstallments = ALL_INSTALLMENTS.filter(i => i.status === "paid");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([CURRENT_INSTALLMENT_ID]));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const toggleInstallment = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // always keep at least one
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedInstallments = ALL_INSTALLMENTS.filter(i => selectedIds.has(i.id));
  const total = selectedInstallments.reduce((s, i) => s + i.amount, 0);

  // Label for the dropdown trigger
  const selectionLabel = (() => {
    if (selectedIds.size === 1) {
      const inst = selectedInstallments[0];
      return `Installment ${inst.sequence}`;
    }
    const nums = [...selectedInstallments].map(i => i.sequence).join(", ");
    return `${selectedIds.size} installments · ${nums}`;
  })();

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      setPaidIds(new Set(selectedIds));
    }, 1200);
  };

  const handleReset = () => {
    setIsPaid(false);
    setSelectedIds(new Set([CURRENT_INSTALLMENT_ID]));
    setPaidIds(new Set());
  };

  const justPaidInstallments = ALL_INSTALLMENTS.filter(i => paidIds.has(i.id));

  return (
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
                    <div className="text-4xl font-extrabold tracking-widest uppercase" style={{ color: "rgba(34,139,34,0.6)", fontFamily: 'Impact, "Arial Black", sans-serif', textShadow: "2px 2px 0 rgba(34,139,34,0.25)" }}>
                      PAID
                    </div>
                    <div className="text-sm font-bold tracking-wide uppercase" style={{ color: "rgba(34,139,34,0.6)", fontFamily: 'Impact, "Arial Black", sans-serif' }}>
                      {formatDate(new Date().toISOString().slice(0, 10))}
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
          <h1 className="text-[16px] leading-[22px] font-bold text-[#1a1b23] mb-2 uppercase text-center">
            Payment Plan Invoice
          </h1>
          <p className="text-[11px] leading-[15px] text-gray-500 text-center mb-8">
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
                  {plan.scope === "tenancy" ? "Tenancy Plan" : "Single-Charge Plan"} · {plan.planType === "equal" ? "Equal Installments" : "Custom"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1">Paid to date</p>
                <p className="text-[11px] text-[#1a1b23] font-bold">{formatCurrency(plan.amountPaidToDate)}</p>
                <p className="text-[10px] text-gray-500">{paidInstallments.length} of {plan.totalInstallments} installments</p>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

          {/* ── Invoice Details ──────────────────────────────────────────── */}
          <div className="mb-8">
            <h2 className="text-[12px] font-bold text-[#1a1b23] mb-4 uppercase">Invoice Details</h2>

            {/* Multi-select dropdown */}
            {!isPaid && (
              <div className="mb-5" ref={dropdownRef}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Installments to pay</p>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-md bg-white hover:border-gray-400 transition-colors text-left"
                >
                  <span className="text-[12px] text-[#1a1b23] font-medium">{selectionLabel}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="border border-gray-200 rounded-md mt-1 bg-white shadow-md overflow-hidden">
                    {/* Paid installments — disabled */}
                    {paidInstallments.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Already paid</span>
                        </div>
                        {paidInstallments.map(inst => (
                          <div key={inst.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 opacity-50 cursor-not-allowed">
                            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-100 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] text-gray-500">
                                Installment {inst.sequence}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-2">· paid {formatDateShort(inst.paidOn!)}</span>
                            </div>
                            <span className="text-[11px] text-gray-400 tabular-nums shrink-0">{formatCurrency(inst.amount)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Overdue installments */}
                    {overdueInstallments.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 bg-red-50 border-b border-red-100 flex items-center gap-1.5">
                          <span className="text-[10px] text-red-500 uppercase tracking-wide font-semibold">Overdue</span>
                        </div>
                        {overdueInstallments.map(inst => {
                          const checked = selectedIds.has(inst.id);
                          const isCurrent = inst.id === CURRENT_INSTALLMENT_ID;
                          return (
                            <button
                              key={inst.id}
                              onClick={() => toggleInstallment(inst.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 hover:bg-red-50 transition-colors text-left"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                checked ? "bg-[#FF5000] border-[#FF5000]" : "border-gray-300 bg-white"
                              }`}>
                                {checked && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] text-[#1a1b23] font-medium">
                                  Installment {inst.sequence}
                                </span>
                                {isCurrent && (
                                  <span className="ml-2 text-[9px] bg-orange-100 text-orange-600 font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide">current</span>
                                )}
                                <span className="text-[10px] text-red-400 ml-2">· overdue {formatDateShort(inst.dueDate)}</span>
                              </div>
                              <span className="text-[11px] text-[#1a1b23] tabular-nums font-medium shrink-0">{formatCurrency(inst.amount)}</span>
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Upcoming installments */}
                    {upcomingInstallments.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Upcoming</span>
                        </div>
                        {upcomingInstallments.map(inst => {
                          const checked = selectedIds.has(inst.id);
                          return (
                            <button
                              key={inst.id}
                              onClick={() => toggleInstallment(inst.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-gray-50 hover:bg-orange-50 transition-colors text-left"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                checked ? "bg-[#FF5000] border-[#FF5000]" : "border-gray-300 bg-white"
                              }`}>
                                {checked && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] text-[#1a1b23] font-medium">
                                  Installment {inst.sequence}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-2">· due {formatDateShort(inst.dueDate)}</span>
                              </div>
                              <span className="text-[11px] text-[#1a1b23] tabular-nums font-medium shrink-0">{formatCurrency(inst.amount)}</span>
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Footer: quick actions */}
                    <div className="px-3 py-2 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                      <button
                        onClick={() => setSelectedIds(new Set(pendingInstallments.map(i => i.id)))}
                        className="text-[10px] text-[#FF5000] font-medium hover:underline"
                      >
                        Select all unpaid
                      </button>
                      <button
                        onClick={() => setSelectedIds(new Set([CURRENT_INSTALLMENT_ID]))}
                        className="text-[10px] text-gray-500 hover:underline"
                      >
                        Reset to current
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Line items — selected installments */}
            <div className="border-t border-gray-200">
              {isPaid ? (
                // Post-payment: show what was just paid
                justPaidInstallments.map((inst, idx) => (
                  <div key={inst.id} className={`flex justify-between items-center py-2.5 ${idx < justPaidInstallments.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <div>
                      <span className="text-[11px] text-[#1a1b23]">
                        Installment {inst.sequence} of {plan.totalInstallments}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">due {formatDateShort(inst.dueDate)}</span>
                    </div>
                    <span className="text-[13px] text-[#1a1b23] font-bold tabular-nums">{formatCurrency(inst.amount)}</span>
                  </div>
                ))
              ) : (
                selectedInstallments.map((inst, idx) => (
                  <div key={inst.id} className={`flex justify-between items-center py-2.5 ${idx < selectedInstallments.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <div>
                      <span className="text-[11px] text-[#1a1b23]">
                        Installment {inst.sequence} of {plan.totalInstallments}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">due {formatDateShort(inst.dueDate)}</span>
                    </div>
                    <span className="text-[13px] text-[#1a1b23] font-bold tabular-nums">{formatCurrency(inst.amount)}</span>
                  </div>
                ))
              )}
            </div>

            {/* Total row */}
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-900 mt-1">
              <span className="text-[12px] text-[#1a1b23] font-bold uppercase tracking-wide">
                Total{!isPaid && selectedIds.size > 1 ? ` (${selectedIds.size} installments)` : ""}
              </span>
              <span className="text-[20px] leading-[26px] text-[#1a1b23] font-bold tabular-nums">
                {formatCurrency(isPaid ? justPaidInstallments.reduce((s, i) => s + i.amount, 0) : total)}
              </span>
            </div>

            {/* Post-payment details */}
            {isPaid && (
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[11px] text-[#1a1b23]">Paid On</span>
                  <span className="text-[11px] text-[#1a1b23] font-bold">{formatDate(new Date().toISOString().slice(0, 10))}</span>
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
                <span className="text-[11px] text-gray-600 font-medium">{formatCurrency(plan.totalValue)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[11px] text-gray-500">Amount Paid to Date</span>
                <span className="text-[11px] text-gray-600 font-medium">{formatCurrency(plan.amountPaidToDate)}</span>
              </div>
            </div>
          </div>

          {/* Paid confirmation banner */}
          {isPaid && (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-[12px] text-emerald-800 font-semibold mb-1">Payment Received</p>
              <p className="text-[11px] text-emerald-700">
                {justPaidInstallments.length === 1
                  ? `Installment ${justPaidInstallments[0].sequence} has been marked as paid. Thank you.`
                  : `${justPaidInstallments.length} installments have been marked as paid. Thank you.`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

          {!isPaid ? (
            <div>
              <Button
                onClick={handlePayment}
                disabled={isProcessing || selectedIds.size === 0}
                className="w-full sm:w-auto h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting to checkout...</>
                ) : (
                  `Pay ${formatCurrency(total)}${selectedIds.size > 1 ? ` · ${selectedIds.size} installments` : ""}`
                )}
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
  );
}
