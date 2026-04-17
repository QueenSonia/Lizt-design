/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  getPaymentPlans,
  subscribeToPaymentPlans,
  type PaymentPlan,
} from "@/lib/paymentPlanStore";

interface Props {
  open: boolean;
  onClose: () => void;
  propertyName: string;
  tenantId: string;
  onCreatePlan: () => void;
}

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function PaymentPlansModal({
  open,
  onClose,
  propertyName,
  tenantId,
  onCreatePlan,
}: Props) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      setPlans(getPaymentPlans(propertyName, tenantId));
    }
    sync();
    const unsub = subscribeToPaymentPlans(sync);
    return unsub;
  }, [propertyName, tenantId]);

  function toggleExpand(id: string) {
    setExpandedPlanId((prev) => (prev === id ? null : id));
  }

  function handleCreatePlan() {
    onClose();
    onCreatePlan();
  }

  const paidCount = (plan: PaymentPlan) =>
    plan.installments.filter((i) => i.status === "paid").length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>Payment Plans</DialogTitle>
            <Button
              size="sm"
              onClick={handleCreatePlan}
              className="bg-[#FF5000] hover:bg-[#e04600] text-white h-8 px-3 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create Plan
            </Button>
          </div>
        </DialogHeader>

        <div className="py-2">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <CreditCard className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-400">No payment plans created</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreatePlan}
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
                  <div
                    key={plan.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Plan header — clickable to expand */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(plan.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {plan.chargeName}
                        </p>
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

                    {/* Installments list */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-gray-50 text-xs text-gray-400">
                          <span>Due Date</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right w-16">Status</span>
                        </div>
                        {plan.installments.map((inst, i) => (
                          <div
                            key={inst.id}
                            className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 items-center"
                          >
                            <span className="text-sm text-gray-700">
                              {formatDate(inst.dueDate)}
                            </span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
