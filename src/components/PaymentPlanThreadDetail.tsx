/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowDown, Bell, Check, X, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  getPaymentPlanThread,
  subscribeToPaymentPlanThreads,
  getCurrentRevision,
  addProposalRevision,
  approveProposal,
  declineProposal,
  markInstallmentPaid,
  sendReminder,
  THREAD_STATUS_LABELS,
  THREAD_STATUS_STYLES,
  type PaymentPlanThread,
  type ThreadEvent,
} from "@/lib/paymentPlanThreadStore";
import { CreatePaymentPlanModal, type CreatePaymentPlanResult } from "./CreatePaymentPlanModal";
import type { PlanScope } from "./PlanScopePickerModal";

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtThreadTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtThreadDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return "Today";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const EVENT_STYLES: Record<string, string> = {
  proposal_created: "border-gray-200 text-gray-600",
  proposal_updated: "border-gray-200 text-gray-600",
  proposal_accepted: "border-green-200 text-green-700",
  proposal_declined: "border-red-200 text-red-600",
  plan_approved: "border-green-200 text-green-700",
  plan_declined: "border-red-200 text-red-600",
  plan_completed: "border-green-200 text-green-700",
  plan_cancelled: "border-gray-200 text-gray-500",
  installment_paid: "border-green-200 text-green-700",
  installment_overdue: "border-red-200 text-red-600",
  reminder_sent: "border-amber-200 text-amber-700",
};

export default function PaymentPlanThreadDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("id") || "";

  const [thread, setThread] = useState<PaymentPlanThread | null>(null);
  const [showReviseModal, setShowReviseModal] = useState(false);

  useEffect(() => {
    function sync() { setThread(getPaymentPlanThread(threadId) ?? null); }
    sync();
    return subscribeToPaymentPlanThreads(sync);
  }, [threadId]);

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Payment plan thread not found.</p>
      </div>
    );
  }

  const currentRevision = getCurrentRevision(thread);
  const isAwaitingLandlord = thread.status === "awaiting_landlord_approval";
  const isAwaitingTenant = thread.status === "awaiting_tenant_response";
  const isActive = thread.status !== "cancelled" && thread.status !== "declined" && thread.status !== "completed";
  const latestRevision = thread.revisions[thread.revisions.length - 1];
  const latestIsPending = latestRevision?.status === "pending";

  function handleApprove() {
    if (!latestRevision) return;
    approveProposal(thread!.id, latestRevision.id, "landlord");
  }

  function handleDecline() {
    if (!latestRevision) return;
    declineProposal(thread!.id, latestRevision.id, "landlord");
  }

  function handleReviseSubmit(result: CreatePaymentPlanResult) {
    addProposalRevision(thread!.id, {
      proposedBy: "landlord",
      planType: result.planType,
      installments: result.installments,
    });
    setShowReviseModal(false);
  }

  // Negotiation timeline — the complete chronological history of the thread
  const timeline: ThreadEvent[] = [...thread.events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const groups: { label: string; events: ThreadEvent[] }[] = [];
  timeline.forEach((event) => {
    const label = fmtThreadDate(event.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  });

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
              <h1 className="text-base font-semibold text-gray-900">Payment Plan Thread</h1>
              <p className="text-xs text-gray-400 leading-none mt-0.5">{thread.propertyName}</p>
            </div>
          </div>
          {isActive && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendReminder(thread!.id)}
                className="h-8 px-3 text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <Bell className="w-3.5 h-3.5 mr-1" />
                Send Reminder
              </Button>
              <Button
                size="sm"
                onClick={() => setShowReviseModal(true)}
                className="bg-[#FF5000] hover:bg-[#e04600] text-white h-8 px-3 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                New Proposal
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl px-4 sm:px-6 py-6 space-y-6">
        {/* ── Header summary ─────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-gray-900">{thread.title}</p>
              {(thread.tenancyStartDate || thread.tenancyEndDate) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {thread.tenancyStartDate ? formatDate(thread.tenancyStartDate) : "—"}
                  {" – "}
                  {thread.tenancyEndDate ? formatDate(thread.tenancyEndDate) : "—"}
                </p>
              )}
            </div>
            <Badge className={`text-xs border-0 rounded-full px-2.5 py-0.5 shrink-0 ${THREAD_STATUS_STYLES[thread.status]}`}>
              {THREAD_STATUS_LABELS[thread.status]}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Amount Due</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(thread.amountDue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Current Proposal</p>
              <p className="text-sm font-semibold text-gray-900">
                {currentRevision
                  ? currentRevision.installments.length === 1
                    ? "One-time Payment"
                    : `${currentRevision.installments.length} Installments`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Current proposal's installment schedule */}
          {currentRevision && (
            <div className="border-t border-gray-100 pt-3">
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 bg-gray-50 text-xs text-gray-400">
                  <span>Due Date</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right w-16">Status</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {currentRevision.installments.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      disabled={inst.status === "paid"}
                      onClick={() => markInstallmentPaid(thread!.id, currentRevision.id, inst.id)}
                      className={`w-full grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2.5 items-center text-left ${
                        inst.status !== "paid" ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <span className="text-sm text-gray-700">{formatDate(inst.dueDate)}</span>
                      <span className="text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(inst.amount)}
                      </span>
                      <div className="w-16 flex justify-end">
                        <Badge
                          className={`text-xs border-0 rounded-full px-2 py-0.5 ${
                            inst.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {inst.status === "paid" ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Approve/Decline actions for the latest pending proposal */}
          {latestIsPending && (isAwaitingLandlord || isAwaitingTenant) && (
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Button
                size="sm"
                onClick={handleApprove}
                className="bg-[#FF5000] hover:bg-[#e04600] text-white h-9 px-5"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 h-9 px-5"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Decline
              </Button>
            </div>
          )}
        </div>

        {/* ── Negotiation Timeline ───────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Negotiation Timeline
          </h2>
          <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
            <div className="px-4 py-5 space-y-1 min-h-[120px]">
              {groups.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center pt-4">No activity yet.</p>
              )}
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-gray-400 font-medium">{group.label}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-3">
                    {group.events.map((event) => {
                      // Proposal edits — richer card with previous → current proposal
                      if (event.type === "proposal_updated") {
                        return (
                          <div key={event.id} className="flex justify-center">
                            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                              <div className="flex items-center justify-between px-3.5 py-2 bg-gray-50 border-b border-gray-100">
                                <span className="text-xs font-semibold text-gray-600">Proposal Updated</span>
                                <span className="text-[10px] text-gray-400">{fmtThreadTime(event.createdAt)}</span>
                              </div>
                              <div className="px-3.5 py-3 space-y-1.5">
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Previous Proposal</p>
                                  <p className="text-sm text-gray-500 line-through decoration-gray-300">
                                    {event.previousProposalSummary}
                                  </p>
                                </div>
                                <div className="flex justify-center">
                                  <ArrowDown className="w-3.5 h-3.5 text-gray-300" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Current Proposal</p>
                                  <p className="text-sm font-medium text-gray-900">{event.currentProposalSummary}</p>
                                </div>
                                {event.resultingStatus && (
                                  <div className="pt-1.5 mt-1.5 border-t border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                    <Badge className={`text-xs border-0 rounded-full px-2.5 py-0.5 ${THREAD_STATUS_STYLES[event.resultingStatus]}`}>
                                      {THREAD_STATUS_LABELS[event.resultingStatus]}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      // System / proposal events — centred neutral pill
                      return (
                        <div key={event.id} className="flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border text-[11px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
                              EVENT_STYLES[event.type] ?? "border-gray-200 text-gray-500"
                            }`}
                          >
                            {event.message}
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-400">{fmtThreadTime(event.createdAt)}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New proposal revision modal — reuses the same create/edit form */}
      <CreatePaymentPlanModal
        open={showReviseModal}
        onClose={() => setShowReviseModal(false)}
        onBack={() => setShowReviseModal(false)}
        propertyName={thread.propertyName}
        tenantId={thread.tenantId}
        scope={(thread.title === "Entire Tenancy" ? "tenancy" : "charge") as PlanScope}
        charges={[{ name: thread.title, amount: thread.amountDue }]}
        existingPlan={
          currentRevision
            ? {
                chargeName: thread.title,
                planType: currentRevision.planType,
                installments: currentRevision.installments,
              }
            : undefined
        }
        onCreate={handleReviseSubmit}
      />
    </div>
  );
}
