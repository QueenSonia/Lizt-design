/* eslint-disable */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronRight, MessagesSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  getPaymentPlanThreads,
  subscribeToPaymentPlanThreads,
  createPaymentPlanThread,
  THREAD_STATUS_LABELS,
  THREAD_STATUS_STYLES,
  type PaymentPlanThread,
} from "@/lib/paymentPlanThreadStore";
import { PlanScopePickerModal, type PlanScope } from "./PlanScopePickerModal";
import { CreatePaymentPlanModal, type ChargeOption } from "./CreatePaymentPlanModal";

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

export default function PaymentPlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyName = searchParams.get("property") || "";
  const tenantId = searchParams.get("tenant") || "";
  const charges: ChargeOption[] = useMemo(() => {
    try { return JSON.parse(searchParams.get("charges") || "[]"); }
    catch { return []; }
  }, [searchParams.get("charges")]);

  const [threads, setThreads] = useState<PaymentPlanThread[]>([]);
  const [showScopePicker, setShowScopePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [planScope, setPlanScope] = useState<PlanScope>("tenancy");

  useEffect(() => {
    function sync() { setThreads(getPaymentPlanThreads(propertyName, tenantId)); }
    sync();
    return subscribeToPaymentPlanThreads(sync);
  }, [propertyName, tenantId]);

  function openThread(threadId: string) {
    const params = new URLSearchParams({ id: threadId, property: propertyName, tenant: tenantId });
    router.push(`/landlord/payment-plan-thread?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Payment Plans</h1>
            {propertyName && (
              <p className="text-xs text-gray-400 leading-none mt-0.5">{propertyName}</p>
            )}
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

      <div className="max-w-3xl px-4 sm:px-6 py-6">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-white rounded-xl border border-gray-200">
            <MessagesSquare className="w-9 h-9 text-gray-300" />
            <p className="text-sm text-gray-400">No payment plan discussions have been started.</p>
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
          <div className="space-y-4">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => openThread(thread.id)}
                className="w-full text-left bg-white border border-gray-100 rounded-lg hover:border-gray-200 hover:bg-gray-50/60 transition-colors px-4 py-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{thread.title}</p>
                    <p className="text-base font-semibold text-gray-900 mt-1">{formatCurrency(thread.amountDue)}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge className={`text-xs border-0 rounded-full px-2.5 py-0.5 ${THREAD_STATUS_STYLES[thread.status]}`}>
                      {THREAD_STATUS_LABELS[thread.status]}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
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

      {/* Step 2 — Create Payment Plan (starts a new thread) */}
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
        onCreate={(input) => {
          const thread = createPaymentPlanThread({
            propertyName,
            tenantId,
            tenantName: "",
            title: input.chargeName,
            amountDue: input.totalAmount,
            proposedBy: "landlord",
            planType: input.planType,
            installments: input.installments,
          });
          openThread(thread.id);
        }}
      />
    </div>
  );
}
