/* eslint-disable */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronDown, ChevronUp, CreditCard, ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  getPaymentPlans,
  subscribeToPaymentPlans,
  type PaymentPlan,
} from "@/lib/paymentPlanStore";
import {
  getPaymentRequests,
  subscribeToPaymentRequests,
  updateRequestStatus,
  type TenantPaymentRequest,
  type RequestStatus,
} from "@/lib/tenantPaymentRequestStore";
import { PlanScopePickerModal, type PlanScope } from "./PlanScopePickerModal";
import { CreatePaymentPlanModal, type ChargeOption } from "./CreatePaymentPlanModal";

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-green-100 text-green-700",
  declined: "bg-red-50 text-red-500",
};

export default function PaymentPlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyName = searchParams.get("property") || "";
  const tenantId = searchParams.get("tenant") || "";
  const charges: ChargeOption[] = useMemo(() => {
    try { return JSON.parse(searchParams.get("charges") || "[]"); }
    catch { return []; }
  }, [searchParams.get("charges")]);

  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [requests, setRequests] = useState<TenantPaymentRequest[]>([]);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [showScopePicker, setShowScopePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [planScope, setPlanScope] = useState<PlanScope>("tenancy");

  useEffect(() => {
    function syncPlans() { setPlans(getPaymentPlans(propertyName, tenantId)); }
    function syncRequests() { setRequests(getPaymentRequests(propertyName, tenantId)); }
    syncPlans();
    syncRequests();
    const u1 = subscribeToPaymentPlans(syncPlans);
    const u2 = subscribeToPaymentRequests(syncRequests);
    return () => { u1(); u2(); };
  }, [propertyName, tenantId]);

  function togglePlan(id: string) {
    setExpandedPlanId((prev) => (prev === id ? null : id));
  }

  function toggleRequest(id: string) {
    setExpandedRequestId((prev) => (prev === id ? null : id));
  }

  const paidCount = (plan: PaymentPlan) =>
    plan.installments.filter((i) => i.status === "paid").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Payment Plans</h1>
              {propertyName && (
                <p className="text-xs text-gray-400 leading-none mt-0.5">{propertyName}</p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowScopePicker(true)}
            className="bg-[#FF5000] hover:bg-[#e04600] text-white h-8 px-3 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create Plan
          </Button>
        </div>
      </div>

      <div className="max-w-3xl px-4 sm:px-6 py-6 space-y-8">

        {/* ── Active Plans ─────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Active Plans
          </h2>

          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-white rounded-xl border border-gray-200">
              <CreditCard className="w-9 h-9 text-gray-300" />
              <p className="text-sm text-gray-400">No payment plans created yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScopePicker(true)}
                className="mt-1 text-[#FF5000] border-[#FF5000] hover:bg-[#FFF3EB]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create Payment Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const isExpanded = expandedPlanId === plan.id;
                const paid = paidCount(plan);
                const total = plan.installments.length;

                return (
                  <div key={plan.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => togglePlan(plan.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{plan.chargeName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatCurrency(plan.totalAmount)} · {total} installment{total !== 1 ? "s" : ""} · {paid}/{total} paid
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs border-0 rounded-full px-2.5 py-0.5 ${
                            paid === total
                              ? "bg-green-100 text-green-700"
                              : paid > 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {paid === total ? "Complete" : paid > 0 ? "In Progress" : "Pending"}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-gray-50 text-xs text-gray-400">
                          <span>Due Date</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right w-16">Status</span>
                        </div>
                        {plan.installments.map((inst) => (
                          <div
                            key={inst.id}
                            className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 items-center"
                          >
                            <span className="text-sm text-gray-700">{formatDate(inst.dueDate)}</span>
                            <span className="text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(inst.amount)}
                            </span>
                            <div className="w-16 flex justify-end">
                              <Badge
                                className={`text-xs border-0 rounded-full px-2 py-0.5 ${
                                  inst.status === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-50 text-amber-600"
                                }`}
                              >
                                {inst.status === "paid" ? "Paid" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Requested Payment Plans ───────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Requested Payment Plans
          </h2>

          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-white rounded-xl border border-gray-200">
              <ClipboardList className="w-9 h-9 text-gray-300" />
              <p className="text-sm text-gray-400">No payment plan requests from tenant</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => {
                const isExpanded = expandedRequestId === req.id;

                return (
                  <div key={req.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleRequest(req.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.scope === "tenancy" ? "Entire Tenancy" : req.chargeName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatCurrency(req.totalAmount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs border-0 rounded-full px-2.5 py-0.5 capitalize ${STATUS_STYLES[req.status]}`}
                        >
                          {req.status}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 px-4 pb-4 space-y-4 pt-3">

                        {req.scope === "tenancy" && req.tenancyStartDate && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Tenancy Start Date</p>
                            <p className="text-sm text-gray-900">{formatDate(req.tenancyStartDate)}</p>
                          </div>
                        )}
                        {req.scope === "tenancy" && req.tenancyEndDate && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Tenancy End Date</p>
                            <p className="text-sm text-gray-900">{formatDate(req.tenancyEndDate)}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Amount to Pay in Installments</p>
                          <p className="text-sm text-gray-900">{formatCurrency(req.installmentAmount)}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Preferred Schedule</p>
                          <p className="text-sm text-gray-900">"{req.preferredSchedule}"</p>
                        </div>

                        {req.tenantNote && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Anything Else You'd Like to Add</p>
                            <p className="text-sm text-gray-900">"{req.tenantNote}"</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-400">
                          Requested on {formatDate(req.requestedAt)}
                        </p>

                        {req.status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={() => updateRequestStatus(req.id, "approved")}
                              className="bg-[#FF5000] hover:bg-[#e04600] text-white h-9 px-5"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRequestStatus(req.id, "declined")}
                              className="border-gray-200 text-gray-600 hover:bg-gray-50 h-9 px-5"
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Step 1 — Scope Picker */}
      <PlanScopePickerModal
        open={showScopePicker}
        onClose={() => setShowScopePicker(false)}
        onSelect={(scope) => {
          setPlanScope(scope);
          setShowScopePicker(false);
          setShowCreateModal(true);
        }}
      />

      {/* Step 2 — Create Payment Plan */}
      <CreatePaymentPlanModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBack={() => {
          setShowCreateModal(false);
          setShowScopePicker(true);
        }}
        propertyName={propertyName}
        tenantId={tenantId}
        scope={planScope}
        charges={charges}
      />
    </div>
  );
}
