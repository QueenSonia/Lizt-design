/* eslint-disable */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, ArrowDown, Bell, Check, X, User, Building2, MoreVertical, Pencil, Trash2, Ban, MessagesSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
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
  getPaymentPlanThreads,
  subscribeToPaymentPlanThreads,
  getCurrentRevision,
  canDeleteCurrentProposal,
  createPaymentPlanThread,
  addProposalRevision,
  approveProposal,
  declineProposal,
  deleteCurrentProposal,
  cancelThread,
  markInstallmentPaid,
  sendReminder,
  formatFullTimestamp,
  THREAD_STATUS_LABELS,
  THREAD_STATUS_STYLES,
  type PaymentPlanThread,
  type ThreadEvent,
  type ProposalSnapshot,
} from "@/lib/paymentPlanThreadStore";
import { PlanScopePickerModal, type PlanScope } from "./PlanScopePickerModal";
import { CreatePaymentPlanModal, type ChargeOption, type CreatePaymentPlanResult } from "./CreatePaymentPlanModal";

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

const PAYMENT_EVENT_TYPES = new Set<ThreadEvent["type"]>([
  "installment_paid",
  "installment_overdue",
  "reminder_sent",
  "plan_completed",
]);

function isPaymentEvent(event: ThreadEvent): boolean {
  return PAYMENT_EVENT_TYPES.has(event.type);
}

const EVENT_CARD_ACCENT: Record<string, string> = {
  proposal_requested: "border-l-gray-300",
  proposal_created: "border-l-gray-300",
  proposal_revised: "border-l-gray-300",
  proposal_accepted: "border-l-green-400",
  proposal_declined: "border-l-red-400",
  proposal_deleted: "border-l-gray-300",
  plan_approved: "border-l-green-400",
  plan_declined: "border-l-red-400",
  plan_cancelled: "border-l-gray-400",
  installment_paid: "border-l-green-400",
  installment_overdue: "border-l-red-400",
  reminder_sent: "border-l-amber-400",
};

/** One Payment Plan History card — always shows actor, timestamp, proposal detail, and outcome. */
function HistoryCard({ event }: { event: ThreadEvent }) {
  const isTenant = event.actor === "tenant";
  const isSystem = event.actor === "system";
  const ActorIcon = isTenant ? User : Building2;
  const isPayment = isPaymentEvent(event);

  return (
    <div
      className={`rounded-lg border border-gray-200 border-l-4 ${
        EVENT_CARD_ACCENT[event.type] ?? "border-l-gray-300"
      } bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}
    >
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          {!isSystem && (
            <span className="shrink-0 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <ActorIcon className="w-3 h-3 text-gray-500" />
            </span>
          )}
          <span className="text-xs font-semibold text-gray-800 truncate">{event.headline}</span>
        </div>
        <span className="text-[11px] text-gray-400 shrink-0">{formatFullTimestamp(event.createdAt)}</span>
      </div>

      <div className="px-3.5 py-3 space-y-2.5">
        {/* Charges breakdown — tenant's original request only */}
        {event.chargesBreakdown && event.chargesBreakdown.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Charges</p>
            <div className="space-y-0.5">
              {event.chargesBreakdown.map((c) => (
                <p key={c.label} className="text-sm text-gray-700">
                  {c.label} — {formatCurrency(c.amount)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Preferred schedule / tenant note — free text supplied by the tenant */}
        {event.preferredScheduleText && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Preferred Schedule</p>
            <p className="text-sm text-gray-700 italic">"{event.preferredScheduleText}"</p>
          </div>
        )}
        {event.tenantNote && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tenant Note</p>
            <p className="text-sm text-gray-700 italic">"{event.tenantNote}"</p>
          </div>
        )}

        {/* Previous → new proposal (revisions) */}
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
              <p className="text-sm font-medium text-gray-900">{proposalLine(event.proposal)}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatCurrency(event.proposal.installmentAmount)} each
                {event.proposal.frequencyLabel ? ` · ${event.proposal.frequencyLabel}` : ""}
              </p>
            </div>
          </>
        )}

        {/* Additional field-level changes, Before → After */}
        {event.fieldChanges && event.fieldChanges.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Changes Made</p>
            {event.fieldChanges.map((change) => (
              <div key={change.label} className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                <p className="text-[11px] font-medium text-gray-600 mb-1">{change.label}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">From</p>
                <p className="text-sm text-gray-500 line-through decoration-gray-300">{change.before}</p>
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="w-3 h-3 text-gray-300" />
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">To</p>
                <p className="text-sm font-medium text-gray-900">{change.after}</p>
              </div>
            ))}
          </div>
        )}

        {/* Single proposal snapshot — requested / accepted / declined / approved */}
        {!event.previousProposal && event.proposal && !isPayment && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              {event.type === "proposal_requested" || event.type === "proposal_created"
                ? "Requested Proposal"
                : event.type === "proposal_accepted"
                ? "Accepted Proposal"
                : event.type === "proposal_declined"
                ? "Rejected Proposal"
                : event.type === "proposal_deleted"
                ? "Deleted Proposal"
                : event.type === "plan_approved"
                ? "Final Agreed Schedule"
                : event.type === "plan_cancelled"
                ? "Cancelled Proposal"
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

        {/* Payment-phase context */}
        {(event.type === "installment_paid" || event.type === "installment_overdue") && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Amount</p>
              <p className="text-sm font-medium text-gray-900">{formatCurrency(event.installmentAmount ?? 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                {event.type === "installment_paid" ? "Paid On" : "Due Date"}
              </p>
              <p className="text-sm text-gray-900">{formatDate(event.installmentDueDate ?? "")}</p>
            </div>
          </div>
        )}
        {event.type === "plan_completed" && (
          <>
            <p className="text-sm text-gray-600">All installments have been successfully paid.</p>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Completed On</p>
              <p className="text-sm text-gray-900">{formatDate(event.createdAt.slice(0, 10))}</p>
            </div>
          </>
        )}
        {event.type === "reminder_sent" && (
          <p className="text-sm text-gray-600">A payment reminder was sent to the tenant.</p>
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
        {event.type === "installment_paid" && (
          <Badge className="text-xs border-0 rounded-full px-2.5 py-0.5 bg-green-100 text-green-700">Paid</Badge>
        )}
        {event.type === "installment_overdue" && (
          <Badge className="text-xs border-0 rounded-full px-2.5 py-0.5 bg-red-50 text-red-500">Overdue</Badge>
        )}
      </div>
    </div>
  );
}

interface PaymentPlanPanelProps {
  thread: PaymentPlanThread;
}

/** The expanded content of one accordion item: current proposal + full chronological history. */
function PaymentPlanPanel({ thread }: PaymentPlanPanelProps) {
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const currentRevision = getCurrentRevision(thread);
  const isAwaitingLandlord = thread.status === "awaiting_landlord_approval";
  const isAwaitingTenant = thread.status === "awaiting_tenant_response";
  const isActive = thread.status !== "cancelled" && thread.status !== "declined" && thread.status !== "completed";
  const latestRevision = thread.revisions[thread.revisions.length - 1];
  const latestIsPending = latestRevision?.status === "pending";
  const canDelete = canDeleteCurrentProposal(thread);
  const canCancel = isActive && currentRevision && !canDelete;
  const hasBeenApproved = thread.events.some((e) => e.type === "plan_approved");
  const proposalSectionTitle =
    thread.status === "completed" ? "Final Payment Plan" : hasBeenApproved ? "Approved Payment Plan" : "Current Proposal";

  // Chronological order — the complete story from request to completion.
  const history = [...thread.events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function handleApprove() {
    if (!latestRevision) return;
    approveProposal(thread.id, latestRevision.id, "landlord");
  }

  function handleDeclineConfirm() {
    if (!latestRevision) return;
    declineProposal(thread.id, latestRevision.id, "landlord", declineReason.trim() || undefined);
    setShowDeclineDialog(false);
    setDeclineReason("");
  }

  function handleReviseSubmit(result: CreatePaymentPlanResult) {
    addProposalRevision(thread.id, {
      proposedBy: "landlord",
      planType: result.planType,
      installments: result.installments,
    });
    setShowReviseModal(false);
  }

  function handleDeleteConfirm() {
    deleteCurrentProposal(thread.id, "landlord");
    setShowDeleteDialog(false);
  }

  function handleCancelConfirm() {
    cancelThread(thread.id, "landlord", cancelReason.trim() || undefined);
    setShowCancelDialog(false);
    setCancelReason("");
  }

  return (
    <div className="space-y-5">
      {/* Quick actions */}
      {isActive && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendReminder(thread.id)}
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

      {/* Current / Approved / Final Payment Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{proposalSectionTitle}</p>
            <p className="text-sm font-semibold text-gray-900">
              {currentRevision ? proposalSummary(thread) : "—"}
            </p>
          </div>
          {currentRevision && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 -mr-1.5 -mt-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Payment plan actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowReviseModal(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Edit Payment Plan
                </DropdownMenuItem>
                {canDelete ? (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete Payment Plan
                  </DropdownMenuItem>
                ) : canCancel ? (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <Ban className="w-3.5 h-3.5 mr-2" />
                    Cancel Payment Plan
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {currentRevision && (
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
                  onClick={() => markInstallmentPaid(thread.id, currentRevision.id, inst.id)}
                  className={`w-full grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2.5 items-center text-left ${
                    inst.status !== "paid" ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span className="text-sm text-gray-700">{formatDate(inst.dueDate)}</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{formatCurrency(inst.amount)}</span>
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
        )}

        {latestIsPending && (isAwaitingLandlord || isAwaitingTenant) && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleApprove} className="bg-[#FF5000] hover:bg-[#e04600] text-white h-9 px-5">
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

      {/* Payment Plan History — the complete, chronological, permanent negotiation record */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Payment Plan History
        </h3>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">No activity yet.</p>
          ) : (
            history.map((event) => <HistoryCard key={event.id} event={event} />)
          )}
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
    </div>
  );
}

export default function PaymentPlansPage() {
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
  const [openItems, setOpenItems] = useState<string[]>([]);

  useEffect(() => {
    function sync() { setThreads(getPaymentPlanThreads(propertyName, tenantId)); }
    sync();
    return subscribeToPaymentPlanThreads(sync);
  }, [propertyName, tenantId]);

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
          <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} className="space-y-3">
            {threads.map((thread) => (
              <AccordionItem
                key={thread.id}
                value={thread.id}
                className="bg-white border border-gray-200 rounded-xl px-4 border-b-0 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">{thread.title}</span>
                    <Badge className={`text-xs border-0 rounded-full px-2.5 py-0.5 shrink-0 ${THREAD_STATUS_STYLES[thread.status]}`}>
                      {THREAD_STATUS_LABELS[thread.status]}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <PaymentPlanPanel thread={thread} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
          setShowCreateModal(false);
          setOpenItems((prev) => [...prev, thread.id]);
        }}
      />
    </div>
  );
}
