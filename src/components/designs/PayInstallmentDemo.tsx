"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const MOCK = {
  installment: {
    sequence: 2,
    dueDate: "2026-08-15",
    amount: 450000,
    amountPaid: 0,
    paymentMethod: "card",
    paymentReference: "PSK-8823914-DEMO",
    receiptNumber: "RCT-00219",
  },
  plan: {
    totalInstallments: 4,
    scope: "tenancy" as const,
    planType: "equal" as const,
    chargeName: "Tenancy",
    amountRemaining: 900000,
    totalValue: 1800000,
    amountPaidToDate: 450000,
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
    businessAddress: "22 Ozumba Mbadiwe Ave, Victoria Island, Lagos",
    contactPhone: "08036322847",
    contactEmail: "hello@propertykraft.africa",
  },
};

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function scopeLabel(scope: "tenancy" | "charge"): string {
  return scope === "tenancy" ? "Tenancy Plan" : "Single-Charge Plan";
}

function planTypeLabel(type: "equal" | "custom"): string {
  return type === "equal" ? "Equal Installments" : "Custom Installments";
}

export default function PayInstallmentDemo() {
  const { installment, plan, property, tenant, landlordBranding } = MOCK;

  const [email, setEmail] = useState(tenant.email);
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const remainingDue = isPaid ? 0 : installment.amount;
  const showPayoff = !isPaid && plan.amountRemaining > remainingDue + 1;

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Platform layer */}
      <div className="px-6 py-4">
        <Image
          alt="Lizt"
          className="h-[40px] w-auto"
          src="/lizt.svg"
          width={120}
          height={40}
        />
      </div>

      {/* Document layer */}
      <div className="flex justify-center px-4 pb-12">
        <div className="bg-white shadow-sm max-w-[850px] w-full px-8 sm:px-12 py-12 relative">
          {/* Paid Stamp */}
          {isPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div
                style={{
                  transform:
                    "rotate(-15deg) translateX(-100px) translateY(-50px)",
                }}
              >
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <filter id="distressed-installment-paid-demo">
                      <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.04"
                        numOctaves="5"
                        result="noise"
                      />
                      <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="3"
                        xChannelSelector="R"
                        yChannelSelector="G"
                      />
                    </filter>
                  </defs>
                </svg>
                <div
                  className="px-8 py-4 border-4 rounded-md"
                  style={{
                    borderColor: "rgba(34, 139, 34, 0.6)",
                    backgroundColor: "transparent",
                    filter: "url(#distressed-installment-paid-demo)",
                    opacity: 0.85,
                  }}
                >
                  <div
                    className="absolute inset-1 border-2 rounded-sm pointer-events-none"
                    style={{ borderColor: "rgba(34, 139, 34, 0.4)" }}
                  />
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="text-4xl font-extrabold tracking-widest uppercase"
                      style={{
                        color: "rgba(34, 139, 34, 0.6)",
                        fontFamily:
                          'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif',
                        textShadow: "2px 2px 0px rgba(34, 139, 34, 0.25)",
                        WebkitTextStroke: "1px rgba(34, 139, 34, 0.3)",
                      }}
                    >
                      PAID
                    </div>
                    <div
                      className="text-sm font-bold tracking-wide uppercase"
                      style={{
                        color: "rgba(34, 139, 34, 0.6)",
                        fontFamily:
                          'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif',
                        textShadow: "1px 1px 0px rgba(34, 139, 34, 0.25)",
                      }}
                    >
                      {formatDate(new Date().toISOString().slice(0, 10))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice branding row */}
          <div className="flex items-center justify-end mb-10">
            <Image
              alt="Property Kraft"
              src="/designs/receipt/property-kraft.png"
              width={120}
              height={40}
              className="h-[32px] w-auto"
            />
          </div>

          {/* Title */}
          <h1 className="text-[16px] leading-[22px] font-bold text-[#1a1b23] mb-2 uppercase text-center">
            Payment Plan Installment
          </h1>
          <p className="text-[11px] leading-[15px] text-gray-500 text-center mb-8">
            Installment {installment.sequence} of {plan.totalInstallments}
          </p>

          {/* Property / Tenant / Plan overview */}
          <div className="mb-8 space-y-4">
            <div>
              <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                Property
              </p>
              <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                {property.name}
              </p>
              <p className="text-[11px] leading-[15px] text-[#1a1b23]">
                {property.address}
              </p>
            </div>

            <div>
              <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                Tenant
              </p>
              <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                {tenant.name}
              </p>
              <p className="text-[11px] leading-[15px] text-[#1a1b23]">
                {tenant.phone}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                  Payment Plan
                </p>
                <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                  {plan.chargeName}
                </p>
                <p className="text-[10px] leading-[14px] text-gray-500">
                  {scopeLabel(plan.scope)} · {planTypeLabel(plan.planType)}
                </p>
              </div>
              <div>
                <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                  Installment
                </p>
                <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                  {installment.sequence} of {plan.totalInstallments}
                </p>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

          {/* Payment Plan Summary */}
          <div className="mb-8 pt-4 border-t border-gray-100">
            <h3 className="text-[10px] leading-[13px] text-gray-400 mb-2 uppercase tracking-wide">
              Payment Plan Summary
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-1">
                <span className="text-[11px] text-gray-500">
                  Total Payment Plan Value
                </span>
                <span className="text-[11px] text-gray-600 font-medium">
                  {formatCurrency(plan.totalValue)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[11px] text-gray-500">
                  Amount Paid Till Date
                </span>
                <span className="text-[11px] text-gray-600 font-medium">
                  {formatCurrency(plan.amountPaidToDate)}
                </span>
              </div>
            </div>
          </div>

          {/* This installment detail */}
          <div className="mb-8">
            <h2 className="text-[12px] leading-[16px] font-bold text-[#1a1b23] mb-4 uppercase">
              Invoice Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-[11px] text-[#1a1b23]">Installment</span>
                <span className="text-[11px] text-[#1a1b23] font-bold">
                  {installment.sequence} of {plan.totalInstallments}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-[11px] text-[#1a1b23]">Due Date</span>
                <span className="text-[11px] text-[#1a1b23] font-bold">
                  {formatDate(installment.dueDate)}
                </span>
              </div>
              {isPaid && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-[11px] text-[#1a1b23]">Paid On</span>
                    <span className="text-[11px] text-[#1a1b23] font-bold">
                      {formatDate(new Date().toISOString().slice(0, 10))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-[11px] text-[#1a1b23]">
                      Payment Method
                    </span>
                    <span className="text-[11px] text-[#1a1b23] font-bold">
                      Card
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-[11px] text-[#1a1b23]">
                      Payment Reference
                    </span>
                    <span className="text-[11px] text-[#1a1b23] font-mono">
                      {installment.paymentReference}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-[11px] text-[#1a1b23]">
                      Receipt Number
                    </span>
                    <span className="text-[11px] text-[#1a1b23] font-mono">
                      {installment.receiptNumber}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-900">
                <span className="text-[14px] leading-[18px] text-[#1a1b23] font-bold uppercase">
                  Amount Due
                </span>
                <span className="text-[18px] leading-[24px] text-[#1a1b23] font-bold">
                  {formatCurrency(isPaid ? installment.amount : remainingDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Paid info block */}
          {isPaid && (
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-[12px] leading-[18px] text-emerald-800 font-semibold mb-1">
                Payment Received
              </p>
              <p className="text-[11px] leading-[16px] text-emerald-700">
                This installment has been marked as paid. Thank you.
              </p>
            </div>
          )}

          {/* Action area */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

          {!isPaid ? (
            <>
              <div>
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing || !email}
                  className="w-full sm:w-auto h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting to checkout...
                    </>
                  ) : (
                    `Pay ${formatCurrency(remainingDue)}`
                  )}
                </Button>
                <p className="text-[11px] leading-[15px] text-gray-500 mt-3">
                  This is a demo — no real payment will be made.
                </p>
              </div>
              {showPayoff && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-[11px] leading-[15px] text-gray-600 mb-2">
                    Want to clear this plan in one payment instead?
                  </p>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-10 px-8 border-[#FF5722] text-[#FF5722] hover:bg-orange-50"
                  >
                    Pay full balance · {formatCurrency(plan.amountRemaining)}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="w-full sm:w-auto h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19]">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 px-8"
                onClick={() => setIsPaid(false)}
              >
                Reset Demo
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="h-[1px] bg-gray-200 mt-14 mb-4" />
          <div className="text-center text-[10px] leading-[14px] text-gray-400">
            <p>{landlordBranding.businessName}</p>
            <p>
              {landlordBranding.contactPhone} &bull; {landlordBranding.contactEmail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
