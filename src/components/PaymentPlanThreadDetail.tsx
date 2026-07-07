/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowDown, Bell, Check, X, Plus, User, Building2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
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
  type ProposalSnapshot,
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

function proposalLine(p: ProposalSnapshot): string {
  const count = p.installmentCount === 1 ? "One-time Payment" : `${p.installmentCount} Installments`;
  return count;
}

const EVENT_CARD_ACCENT: Record<string, string> = {
  proposal_requested: "border-l-gray-300",
  proposal_created: "border-l-gray-300",
  proposal_revised: "border-l-gray-300",
  proposal_accepted: "border-l-green-400",
  proposal_declined: "border-l-red-400",
  plan_approved: "border-l-green-400",
  plan_declined: "border-l-red-400",
  plan_completed: "border-l-green-400",
  plan_cancelled: "border-l-gray-300",
  installment_paid: "border-l-green-400",
  installment_overdue: "border-l-red-400",
  reminder_sent: "border-l-amber-400",
};

function EventCard({ event }: { event: ThreadEvent }) {
  const isTenant = event.actor === "tenant";
  const isSystem = event.actor === "system";
  const ActorIcon = isTenant ? User : Building2;

  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 ${EVENT_CARD_ACCENT[event.type] ?? "border-l-gray-300"} bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}>
      {/* Card header — actor + headline + timestamp */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          {!isSystem && (
            <span className="shrink-0 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <ActorIcon className="w-3 h-3 text-gray-500" />
            </span>
          )}
          <span className="text-xs font-semibold text-gray-800 truncate">{event.headline}</span>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">{fmtThreadTime(event.createdAt)}</span>
      </div>

      <div className="px-3.5 py-3 space-y-2.5">
        {/* Previous → current proposal (revisions only) */}
        {event.previousProposal && event.proposal && (
          <>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Previous Proposal</p>
              <p className="text-sm text-gray-500 line-through decoration-gray-300">{proposalLine(event.previousProposal)}</p>
            </div>
            <div className="flex justify-center">
              <ArrowDown className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Revised Proposal</p>
              <p className="text-sm font-medium text-gray-900">
                {proposalLine(event.proposal)}
              </p>
            </div>
          </>
        )}

        {/* Single proposal snapshot — requested / accepted / declined / approved / completed */}
        {!event.previousProposal && event.proposal && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              {event.type === "proposal_requested" || event.type === "proposal_created"
                ? "Requested Proposal"
                : event.type === "proposal_accepted"
                ? "Accepted Proposal"
                : event.type === "proposal_declined"
                ? "Rejected Proposal"
                : event.type === "plan_approved"
                ? "Approved Proposal"
                : event.type === "plan_completed"
                ? "Final Proposal"
                : "Proposal"}
            </p>
            <p className="text-sm font-medium text-gray-900">{proposalLine(event.proposal)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatCurrency(event.proposal.installmentAmount)} each
              {event.proposal.frequencyLabel ? ` · ${event.proposal.frequencyLabel}` : ""}
            </p>
          </div>
        )}

        {/* Reason (optional context from the actor) */}
        {event.reason && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Reason</p>
            <p className="text-sm text-gray-700">{event.reason}</p>
          </div>
        )}

        {/* Effective date (plan approval) */}
        {event.effectiveDate && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Effective Date</p>
            <p className="text-sm text-gray-900">{formatDate(event.effectiveDate)}</p>
          </div>
        )}

        {/* Installment payment / overdue context */}
        {(event.type === "installment_paid" || event.type === "installment_overdue") && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Amount</p>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(event.installmentAmount ?? 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Installment</p>
              <p className="text-sm text-gray-900">{event.installmentIndex} of {event.installmentTotal}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                {event.type === "installment_paid" ? "Paid On" : "Due Date"}
              </p>
              <p className="text-sm text-gray-900">{formatDate(event.installmentDueDate ?? "")}</p>
            </div>
          </div>
        )}

        {/* Completion note */}
        {event.type === "plan_completed" && (
          <p className="text-sm text-gray-600">All installments have been successfully paid.</p>
        )}

        {/* Status footer */}
        {(event.resultingStatus || event.resultingStatusLabel) && (
          <div className="pt-2 mt-1 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Status</p>
            {event.resultingStatus ? (
              <Badge className={`text-xs border-0 rounded-full px-2.5 py-0.5 ${THREAD_STATUS_STYLES[event.resultingStatus]}`}>
                {THREAD_STATUS_LABELS[event.resultingStatus]}
              </Badge>
            ) : (
              <Badge className="text-xs border-0 rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-600">
                {event.resultingStatusLabel}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentPlanThreadDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("id") || "";

  const [thread, setThread] = useState<PaymentPlanThread | null>(null);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

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

  function handleDeclineConfirm() {
    if (!latestRevision) return;
    declineProposal(thread!.id, latestRevision.id, "landlord", declineReason.trim() || undefined);
    setShowDeclineDialog(false);
    setDeclineReason("");
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
                onClick={() => setShowDeclineDialog(true)}
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
            <div className="px-4 py-5 space-y-4 min-h-[120px]">
              {groups.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center pt-4">No activity yet.</p>
              )}
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-gray-400 font-medium">{group.label}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-3">
                    {group.events.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
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

      {/* Decline reason dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={(v) => { if (!v) { setShowDeclineDialog(false); setDeclineReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Decline Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <label className="text-xs font-medium text-gray-500">Reason (optional)</label>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Explain why this proposal is being declined…"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowDeclineDialog(false); setDeclineReason(""); }}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeclineConfirm}
            >
              Decline Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
