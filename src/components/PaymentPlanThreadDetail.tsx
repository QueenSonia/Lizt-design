/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bell, Check, X, Plus, MoreVertical, Pencil, Trash2, Ban } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  getPaymentPlanThread,
  subscribeToPaymentPlanThreads,
  getCurrentRevision,
  canDeleteCurrentProposal,
  addProposalRevision,
  approveProposal,
  declineProposal,
  deleteCurrentProposal,
  cancelThread,
  markInstallmentPaid,
  recordInstallmentPayment,
  sendReminder,
  formatFullTimestamp,
  installmentAmountPaid,
  installmentBalance,
  THREAD_STATUS_LABELS,
  THREAD_STATUS_STYLES,
  type PaymentPlanThread,
  type ThreadEvent,
  type ProposalSnapshot,
  type ProposalInstallment,
} from "@/lib/paymentPlanThreadStore";
import { CreatePaymentPlanModal, type CreatePaymentPlanResult } from "./CreatePaymentPlanModal";
import {
  RecordInstallmentPaymentModal,
  type RecordInstallmentPaymentResult,
} from "./RecordInstallmentPaymentModal";
import type { PlanScope } from "./PlanScopePickerModal";

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function proposalSummary(thread: PaymentPlanThread): string {
  const revision = getCurrentRevision(thread);
  const n = revision?.installments.length ?? 0;
  return n === 1 ? "One-time Payment" : `${n} Installments`;
}

function proposalLine(p: ProposalSnapshot): string {
  return p.installmentCount === 1 ? "One-time Payment" : `${p.installmentCount} Installments`;
}

/** Compact receipt-style entries — payment activity, distinct from negotiation snapshots. */
const PAYMENT_EVENT_TYPES = new Set<ThreadEvent["type"]>([
  "installment_paid",
  "installment_payment_recorded",
  "payment_failed",
  "payment_refunded",
  "plan_completed",
]);

function isPaymentEvent(event: ThreadEvent): boolean {
  return PAYMENT_EVENT_TYPES.has(event.type);
}

/** Only version events carry a full payment-plan snapshot worth its own history card. */
const VERSION_EVENT_TYPES = new Set<ThreadEvent["type"]>([
  "proposal_requested",
  "proposal_created",
  "proposal_revised",
  "proposal_accepted",
  "proposal_declined",
  "proposal_deleted",
  "plan_approved",
  "plan_cancelled",
]);

function isVersionEvent(event: ThreadEvent): boolean {
  return VERSION_EVENT_TYPES.has(event.type);
}

/**
 * Newest-first display order, with one deliberate exception: a plan_approved card is shown
 * directly *above* the revision/response event that immediately precedes it in time (instead of
 * above it, which strict chronological order would do), so the thread leads with "what the plan
 * looks like now" before the approval stamp on it. Every other pair stays in chronological order.
 */
function orderThreadHistory(events: ThreadEvent[]): ThreadEvent[] {
  const chronological = [...events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const newestFirst = [...chronological].reverse();
  for (let i = 0; i < newestFirst.length - 1; i++) {
    if (newestFirst[i].type === "plan_approved") {
      [newestFirst[i], newestFirst[i + 1]] = [newestFirst[i + 1], newestFirst[i]];
      i++; // don't re-evaluate the approval now sitting one slot later
    }
  }
  return newestFirst;
}

/** Actor-aware label — several event types (accept/decline/revise) can be triggered by either party. */
function versionLabel(event: ThreadEvent): string {
  const who = event.actor === "landlord" ? "Property Manager" : "Tenant";
  switch (event.type) {
    case "proposal_requested":
      return "Tenant Requested Payment Plan";
    case "proposal_created":
      return "Payment Plan Was Edited";
    case "proposal_revised":
      return "Payment Plan Edited";
    case "proposal_accepted":
      return `${who} Accepted Revised Plan`;
    case "proposal_declined":
      return `${who} Declined Revised Plan`;
    case "proposal_deleted":
      return "Payment Plan Deleted";
    case "plan_approved":
      return "Payment Plan Approved";
    case "plan_cancelled":
      return "Payment Plan Cancelled";
    default:
      return event.headline;
  }
}

function installmentStatusBadge(inst: ProposalInstallment) {
  if (inst.status === "paid") {
    return <Badge className="text-xs border-0 rounded-full px-2 py-0.5 bg-green-100 text-green-700">Paid</Badge>;
  }
  if (inst.status === "partial") {
    return <Badge className="text-xs border-0 rounded-full px-2 py-0.5 bg-blue-50 text-blue-600">Partially Paid</Badge>;
  }
  return <Badge className="text-xs border-0 rounded-full px-2 py-0.5 bg-amber-50 text-amber-600">Pending</Badge>;
}

/**
 * The Due Date / Amount / Status table used on the Active Payment Plan card. Pass isProposal for
 * a not-yet-reviewed submission (e.g. the tenant's original request) so every row reads
 * "Proposed" instead of implying it's already an active Pending/Paid schedule. Pass
 * onRecordPayment (only relevant for the live, current schedule) to show Paid/Balance columns
 * and a Record Payment action on every not-yet-fully-paid row.
 */
function InstallmentScheduleTable({
  installments,
  isProposal = false,
  onRecordPayment,
}: {
  installments: ProposalSnapshot["installments"];
  isProposal?: boolean;
  onRecordPayment?: (installment: ProposalInstallment, index: number) => void;
}) {
  const interactive = !isProposal && !!onRecordPayment;

  if (interactive) {
    return (
      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-3 py-2 bg-gray-50 text-xs text-gray-400">
          <span>Due Date</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Paid</span>
          <span className="text-right">Balance</span>
          <span className="text-right">Status</span>
        </div>
        <div className="divide-y divide-gray-50">
          {installments.map((inst, i) => {
            const paid = installmentAmountPaid(inst);
            const balance = installmentBalance(inst);
            const canRecordPayment = inst.status !== "paid";
            return (
              <div key={inst.id} className="px-3 py-2.5">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center">
                  <span className="text-sm text-gray-700">{formatDate(inst.dueDate)}</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{formatCurrency(inst.amount)}</span>
                  <span className="text-sm text-gray-700 text-right">{formatCurrency(paid)}</span>
                  <span className="text-sm text-gray-700 text-right">{formatCurrency(balance)}</span>
                  <div className="flex justify-end">{installmentStatusBadge(inst)}</div>
                </div>
                {canRecordPayment && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => onRecordPayment!(inst, i + 1)}
                      className="text-xs font-medium text-[#FF5000] hover:underline"
                    >
                      Record Payment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 bg-gray-50 text-xs text-gray-400">
        <span>Due Date</span>
        <span className="text-right">Amount</span>
        <span className="text-right w-24">Status</span>
      </div>
      <div className="divide-y divide-gray-50">
        {installments.map((inst) => (
          <div key={inst.id} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2.5 items-center">
            <span className="text-sm text-gray-700">{formatDate(inst.dueDate)}</span>
            <span className="text-sm font-medium text-gray-900 text-right">{formatCurrency(inst.amount)}</span>
            <div className="w-24 flex justify-end">
              {isProposal ? (
                <Badge className="text-xs border-0 rounded-full px-2 py-0.5 bg-gray-100 text-gray-500">
                  Proposed
                </Badge>
              ) : (
                installmentStatusBadge(inst)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * One entry in the Payment Plan Thread — a complete historical snapshot reusing the exact same
 * layout as the Active Payment Plan card (total amount, installment count, full schedule table).
 * Only the header and metadata describing what happened change; everything below is the payment
 * plan exactly as it existed at that moment. No status pill here — the only status badge on this
 * page lives on the Active Payment Plan card.
 */
function VersionCard({
  event,
  isCurrentSchedule = false,
  onRecordPayment,
}: {
  event: ThreadEvent;
  isCurrentSchedule?: boolean;
  onRecordPayment?: (installment: ProposalInstallment, index: number) => void;
}) {
  const label = versionLabel(event);
  // The tenant's original ask is a request, not yet a structured plan — no installment
  // schedule or "preferred schedule" line exists until the Property Manager turns it into one.
  const isTenantRequest = event.type === "proposal_requested";

  const dateLabel =
    event.type === "proposal_requested"
      ? "Requested on"
      : event.type === "proposal_revised"
      ? "Edited on"
      : event.type === "proposal_accepted"
      ? "Accepted on"
      : event.type === "proposal_declined"
      ? "Declined on"
      : event.type === "plan_approved"
      ? "Approved on"
      : event.type === "plan_cancelled"
      ? "Cancelled on"
      : "Recorded on";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {!isTenantRequest && (
          <p className="text-xs text-gray-400 mt-0.5">
            {dateLabel} {formatFullTimestamp(event.createdAt)}
          </p>
        )}
      </div>

      {/* Total Amount — always shown; the schedule table only once a structured plan exists */}
      {event.proposal && (
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Total Amount</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(event.proposal.totalAmount)}</p>
            {!isTenantRequest && <p className="text-sm text-gray-700 mt-0.5">{proposalLine(event.proposal)}</p>}
          </div>
          {!isTenantRequest && (
            <InstallmentScheduleTable
              installments={event.proposal.installments}
              onRecordPayment={isCurrentSchedule ? onRecordPayment : undefined}
            />
          )}
        </div>
      )}

      {/* Charges breakdown — tenant's original request only */}
      {event.chargesBreakdown && event.chargesBreakdown.length > 0 && (
        <div className={isTenantRequest ? "" : "pt-1 border-t border-gray-100"}>
          <p className={`text-xs text-gray-400 mb-1 ${isTenantRequest ? "" : "mt-2"}`}>Charges</p>
          <div className="space-y-0.5">
            {event.chargesBreakdown.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{c.label}</span>
                <span className="text-gray-500 line-through decoration-gray-300">{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferred schedule (free text from the tenant) — not shown on the initial request itself */}
      {event.preferredScheduleText && !isTenantRequest && (
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Preferred Schedule</p>
          <p className="text-sm text-gray-900">"{event.preferredScheduleText}"</p>
        </div>
      )}

      {/* Tenant note — the primary content on the tenant's original request card */}
      {event.tenantNote && (
        <div className={isTenantRequest ? "pt-1 border-t border-gray-100" : ""}>
          <p className={`text-gray-400 mb-1 ${isTenantRequest ? "text-xs mt-2 font-medium" : "text-xs mb-0.5"}`}>
            Tenant Note
          </p>
          <p className={isTenantRequest ? "text-sm text-gray-900 leading-relaxed" : "text-sm text-gray-900"}>
            "{event.tenantNote}"
          </p>
        </div>
      )}

      {/* Requested On — repeated at the bottom of the tenant-request card per its own field order */}
      {isTenantRequest && (
        <p className="text-xs text-gray-400 pt-1 border-t border-gray-100 mt-2">
          {dateLabel} {formatFullTimestamp(event.createdAt)}
        </p>
      )}

      {/* Reason (decline / cancel context) — omitted on "Payment Plan Edited"; the snapshot speaks for itself */}
      {event.reason && event.type !== "proposal_revised" && (
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Reason</p>
          <p className="text-sm text-gray-900">{event.reason}</p>
        </div>
      )}
    </div>
  );
}

function paymentEventLabel(event: ThreadEvent): string {
  switch (event.type) {
    case "installment_paid":
      return event.headline || `Installment ${event.installmentIndex} Fully Paid`;
    case "installment_payment_recorded":
      return event.headline || `Installment ${event.installmentIndex} Payment Recorded`;
    case "payment_failed":
      return `Installment ${event.installmentIndex} of ${event.installmentTotal} Payment Failed`;
    case "payment_refunded":
      return `Installment ${event.installmentIndex} of ${event.installmentTotal} Refunded`;
    case "plan_completed":
      return "Payment Plan Completed";
    default:
      return event.headline;
  }
}

/**
 * A lightweight timeline entry for payment activity — no card frame, no payment details, just the
 * headline and when it happened. Kept visually minimal so it reads as a passing history entry,
 * distinct from the full payment-plan version cards (Active Payment Plan, Payment Plan Edited, etc.).
 * `installment_payment_recorded` and the "fully paid" `installment_paid` events additionally show
 * a one-line description and remaining balance, per the manual-payment-recording flow.
 */
function PaymentEventCard({ event }: { event: ThreadEvent }) {
  const label = paymentEventLabel(event);

  const description =
    event.type === "installment_payment_recorded"
      ? `${formatCurrency(event.paymentAmountRecorded ?? 0)} was recorded against Installment ${event.installmentIndex}.`
      : event.type === "installment_paid" && event.remainingBalance !== undefined
      ? `The remaining balance of ${formatCurrency(event.remainingBalance)} was received. Installment ${event.installmentIndex} has now been marked as Paid.`
      : undefined;

  return (
    <div className="py-1">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      {description && <p className="text-sm text-gray-600 mt-0.5">{description}</p>}
      {event.type === "installment_payment_recorded" && event.remainingBalance !== undefined && event.remainingBalance > 0 && (
        <p className="text-xs text-gray-500 mt-0.5">
          Remaining Balance: {formatCurrency(event.remainingBalance)}
        </p>
      )}
      <p className="text-xs text-gray-400 mt-0.5">
        {formatFullTimestamp(event.createdAt)}
        {event.recordedBy && ` by ${event.recordedBy}`}
      </p>
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [recordPaymentTarget, setRecordPaymentTarget] = useState<{
    installment: ProposalInstallment;
    index: number;
  } | null>(null);

  useEffect(() => {
    function sync() { setThread(getPaymentPlanThread(threadId) ?? null); }
    sync();
    return subscribeToPaymentPlanThreads(sync);
  }, [threadId]);

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Payment plan not found.</p>
      </div>
    );
  }

  const currentRevision = getCurrentRevision(thread);
  const isAwaitingLandlord = thread.status === "awaiting_landlord_approval";
  const isAwaitingTenant = thread.status === "awaiting_tenant_response";
  const isActive = thread.status !== "cancelled" && thread.status !== "declined" && thread.status !== "completed";
  const latestRevision = thread.revisions[thread.revisions.length - 1];
  const latestIsPending = latestRevision?.status === "pending";
  const canDelete = canDeleteCurrentProposal(thread);
  const canCancel = isActive && currentRevision && !canDelete;
  // Newest first — the thread reads top (current) to bottom (oldest / tenant's original request).
  // Version events render as full payment-plan snapshots; payment events (installment payments,
  // completion) render as compact receipt cards. Ambient status events (reminders, overdue
  // flags) are never shown as their own thread entry.
  const history = orderThreadHistory(
    thread.events.filter((e) => isVersionEvent(e) || isPaymentEvent(e))
  );

  /** Whether this version-card event's snapshot IS the live current-revision schedule
   *  (same installment objects — not a historical snapshot), so its table can be interactive. */
  function isCurrentScheduleEvent(event: ThreadEvent): boolean {
    return (
      !!currentRevision &&
      !!event.proposal &&
      event.proposal.installments === currentRevision.installments
    );
  }

  function handleRecordPayment(result: RecordInstallmentPaymentResult) {
    if (!recordPaymentTarget || !currentRevision) return;
    recordInstallmentPayment(thread!.id, currentRevision.id, recordPaymentTarget.installment.id, {
      amount: result.amount,
      date: result.date,
      method: result.method,
      reference: result.reference,
      notes: result.notes,
      recordedBy: "Tunji Oginni",
    });
    setRecordPaymentTarget(null);
  }

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

  function handleDeleteConfirm() {
    deleteCurrentProposal(thread!.id, "landlord");
    setShowDeleteDialog(false);
  }

  function handleCancelConfirm() {
    cancelThread(thread!.id, "landlord", cancelReason.trim() || undefined);
    setShowCancelDialog(false);
    setCancelReason("");
  }

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
              <h1 className="text-base font-semibold text-gray-900">{thread.title}</h1>
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
        {/* Payment Plan Thread — one continuous version history. The first entry IS the current
            active payment plan; every card beneath it is an earlier version of the same plan. */}
        <div>
          <div className="relative pl-6">
            <div className="absolute left-[5px] top-5 bottom-2 w-0.5 bg-gray-200" aria-hidden="true" />
            <div className="space-y-5">
              {/* The thread itself is the complete record — newest event first, oldest (the
                  tenant's original request) last. No separate "current state" card. */}
              {history.map((event) => (
                <div key={event.id} className="relative">
                  <span className="absolute -left-6 top-5 w-2.5 h-2.5 rounded-full bg-gray-400 ring-4 ring-gray-50" aria-hidden="true" />
                  {isPaymentEvent(event) ? (
                    <PaymentEventCard event={event} />
                  ) : (
                    <VersionCard
                      event={event}
                      isCurrentSchedule={isCurrentScheduleEvent(event)}
                      onRecordPayment={(installment, index) => setRecordPaymentTarget({ installment, index })}
                    />
                  )}
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
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeclineConfirm}>
              Decline Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete payment plan confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Payment Plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            This will remove the current proposal from the thread. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteConfirm}>
              Delete Payment Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel payment plan dialog (for already-active plans / payment history) */}
      <Dialog open={showCancelDialog} onOpenChange={(v) => { if (!v) { setShowCancelDialog(false); setCancelReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Payment Plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            This plan has already been approved or has recorded payments, so it will be cancelled rather than deleted. Its full history stays in the record.
          </p>
          <div className="space-y-1.5 pb-2">
            <label className="text-xs font-medium text-gray-500">Reason (optional)</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Explain why this payment plan is being cancelled…"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCancelDialog(false); setCancelReason(""); }}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCancelConfirm}>
              Cancel Payment Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Installment Payment modal */}
      <RecordInstallmentPaymentModal
        open={!!recordPaymentTarget}
        installment={recordPaymentTarget?.installment ?? null}
        installmentIndex={recordPaymentTarget?.index ?? 0}
        installmentTotal={currentRevision?.installments.length ?? 0}
        onClose={() => setRecordPaymentTarget(null)}
        onSave={handleRecordPayment}
      />
    </div>
  );
}
