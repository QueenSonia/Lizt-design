/**
 * In-memory store for Payment Plan Threads.
 *
 * Product model: every tenancy/rent obligation has exactly ONE Payment Plan
 * Thread. Every proposal, response, approval, decline, and system event is
 * recorded inside that thread's negotiation timeline instead of creating
 * separate payment plan records. This replaces the old "Active Plans" /
 * "Requested Payment Plans" split with a single history per obligation.
 * The thread is a negotiation history, not a messaging/chat surface.
 */

export type ThreadStatus =
  | "awaiting_tenant_response"
  | "awaiting_landlord_approval"
  | "approved"
  | "declined"
  | "completed"
  | "cancelled";

export type ProposalStatus = "pending" | "accepted" | "declined" | "current" | "deleted";

export interface ProposalInstallment {
  id: string;
  amount: number;
  dueDate: string; // ISO YYYY-MM-DD
  status: "pending" | "paid";
}

export interface ProposalRevision {
  id: string;
  revisionNumber: number;
  proposedBy: "landlord" | "tenant";
  totalAmount: number;
  planType: "equal" | "custom";
  installments: ProposalInstallment[];
  status: ProposalStatus;
  createdAt: string; // ISO
  note?: string;
}

export type ThreadEventType =
  | "proposal_requested"   // tenant's initial ask
  | "proposal_created"     // landlord's initial proposal (thread opened by landlord)
  | "proposal_revised"     // either party edits/counters the proposal
  | "proposal_accepted"
  | "proposal_declined"
  | "proposal_deleted"     // Property Manager deletes a not-yet-accepted proposal
  | "plan_approved"
  | "plan_declined"
  | "plan_completed"
  | "plan_cancelled"       // Property Manager cancels an already-active plan
  | "installment_paid"
  | "installment_overdue"
  | "reminder_sent"
  | "payment_failed"
  | "payment_refunded";

/** A read-only snapshot of a proposal's shape, captured at the moment of a timeline event. */
export interface ProposalSnapshot {
  installmentCount: number;
  installmentAmount: number; // amount of a single installment (first one, for unequal splits)
  totalAmount: number;
  frequencyLabel?: string; // e.g. "Monthly" — omitted when installments aren't evenly spaced
  /** The full installment schedule as it stood at this moment — lets history cards render the
   *  exact same due-date/amount/status table as the Active Payment Plan card. */
  installments: ProposalInstallment[];
}

/** A single named charge line, e.g. "Rent (Annually) — ₦3,000". Used on the tenant's original request card. */
export interface ChargeLine {
  label: string;
  amount: number;
}

export interface ThreadEvent {
  id: string;
  type: ThreadEventType;
  actor: "landlord" | "tenant" | "system";
  headline: string;
  createdAt: string; // ISO

  // Proposal snapshot(s) — what existed and/or what it changed to.
  proposal?: ProposalSnapshot;
  previousProposal?: ProposalSnapshot;

  // Optional context supplied by the actor.
  reason?: string;

  // Resulting/contextual status shown on the card. Prefer resultingStatus when it maps onto
  // a real ThreadStatus; use resultingStatusLabel for card-only states like "Negotiation Continues"
  // that don't correspond to a thread-level status.
  resultingStatus?: ThreadStatus;
  resultingStatusLabel?: string;
  effectiveDate?: string; // ISO — for plan_approved

  // installment_paid / installment_overdue context
  installmentIndex?: number;
  installmentTotal?: number;
  installmentAmount?: number;
  installmentDueDate?: string;
  paymentMethod?: string;
  paymentReference?: string;

  // Rich free-form context on the tenant's original request (proposal_requested only)
  chargesBreakdown?: ChargeLine[];
  preferredScheduleText?: string;
  tenantNote?: string;
}

export interface PaymentPlanThread {
  id: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  /** e.g. "Entire Tenancy", "Rent", "Service Charge", "Legal Fee" */
  title: string;
  tenancyStartDate?: string;
  tenancyEndDate?: string;
  amountDue: number;
  status: ThreadStatus;
  revisions: ProposalRevision[];
  events: ThreadEvent[];
  createdAt: string; // ISO
  lastActivityAt: string; // ISO
}

type Listener = () => void;
const _listeners = new Set<Listener>();

function _notify() {
  _listeners.forEach((l) => l());
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function actorLabel(actor: "landlord" | "tenant"): string {
  return actor === "landlord" ? "Property Manager" : "Tenant";
}

/** Detects a regular monthly/weekly/quarterly/annual cadence from installment due dates. */
function deriveFrequencyLabel(installments: ProposalInstallment[]): string | undefined {
  if (installments.length < 2) return undefined;
  const dates = installments.map((i) => new Date(i.dueDate + "T00:00:00").getTime());
  const dayMs = 86400000;
  const deltasDays = dates.slice(1).map((d, i) => Math.round((d - dates[i]) / dayMs));
  const first = deltasDays[0];
  if (!deltasDays.every((d) => d === first)) return undefined;
  if (first >= 27 && first <= 31) return "Monthly";
  if (first === 7) return "Weekly";
  if (first >= 89 && first <= 92) return "Quarterly";
  if (first >= 364 && first <= 366) return "Annually";
  return undefined;
}

function snapshotFromInstallments(installments: ProposalInstallment[]): ProposalSnapshot {
  return {
    installmentCount: installments.length,
    installmentAmount: installments[0]?.amount ?? 0,
    totalAmount: installments.reduce((sum, i) => sum + i.amount, 0),
    frequencyLabel: deriveFrequencyLabel(installments),
    installments,
  };
}

// Seed installment schedules, defined once and reused so every ThreadEvent snapshot below stays
// perfectly consistent with the ProposalRevision it corresponds to.
const _tenancySchedule1: ProposalInstallment[] = [
  { id: "pi-t1-1", amount: 418333, dueDate: "2026-05-01", status: "pending" },
  { id: "pi-t1-2", amount: 418333, dueDate: "2026-06-01", status: "pending" },
  { id: "pi-t1-3", amount: 418333, dueDate: "2026-07-01", status: "pending" },
  { id: "pi-t1-4", amount: 418333, dueDate: "2026-08-01", status: "pending" },
  { id: "pi-t1-5", amount: 418334, dueDate: "2026-09-01", status: "pending" },
  { id: "pi-t1-6", amount: 418334, dueDate: "2026-10-01", status: "pending" },
];
const _tenancySchedule2: ProposalInstallment[] = [
  { id: "pi-003-1", amount: 627500, dueDate: "2026-05-01", status: "paid" },
  { id: "pi-003-2", amount: 627500, dueDate: "2026-06-01", status: "pending" },
  { id: "pi-003-3", amount: 627500, dueDate: "2026-07-01", status: "pending" },
  { id: "pi-003-4", amount: 627500, dueDate: "2026-08-01", status: "pending" },
];
const _rentSchedule: ProposalInstallment[] = [
  { id: "pi-001-1", amount: 600000, dueDate: "2026-06-01", status: "pending" },
  { id: "pi-001-2", amount: 600000, dueDate: "2026-07-01", status: "pending" },
  { id: "pi-001-3", amount: 600000, dueDate: "2026-08-01", status: "pending" },
];
const _serviceChargeSchedule: ProposalInstallment[] = [
  { id: "pi-002-1", amount: 125000, dueDate: "2026-06-01", status: "paid" },
  { id: "pi-002-2", amount: 125000, dueDate: "2026-07-01", status: "paid" },
];
// Tenant's original 5-installment request on the Service Charge thread, before the Property
// Manager consolidated it into the 2-installment schedule above.
const _serviceChargeTenantRequest: ProposalInstallment[] = [
  { id: "pi-sc-req-1", amount: 50000, dueDate: "2026-04-30", status: "pending" },
  { id: "pi-sc-req-2", amount: 50000, dueDate: "2026-05-31", status: "pending" },
  { id: "pi-sc-req-3", amount: 50000, dueDate: "2026-06-30", status: "pending" },
  { id: "pi-sc-req-4", amount: 50000, dueDate: "2026-07-31", status: "pending" },
  { id: "pi-sc-req-5", amount: 50000, dueDate: "2026-08-31", status: "pending" },
];

const _threads: PaymentPlanThread[] = [
  {
    id: "thr-seed-tenancy",
    propertyName: "Lekki Phase 1 Duplex",
    tenantId: "t-001",
    tenantName: "Amara Okonkwo",
    title: "Entire Tenancy",
    tenancyStartDate: "2026-05-01",
    tenancyEndDate: "2027-04-30",
    amountDue: 2510000,
    status: "approved",
    createdAt: "2026-04-12T10:30:00.000Z",
    lastActivityAt: "2026-06-02T09:00:00.000Z",
    revisions: [
      {
        id: "rev-tenancy-1",
        revisionNumber: 1,
        proposedBy: "tenant",
        totalAmount: 2510000,
        planType: "equal",
        status: "declined",
        createdAt: "2026-04-12T10:30:00.000Z",
        note: "I'd like to spread the full tenancy cost over 6 months. Please let me know if this works.",
        installments: _tenancySchedule1,
      },
      {
        id: "rev-tenancy-2",
        revisionNumber: 2,
        proposedBy: "landlord",
        totalAmount: 2510000,
        planType: "equal",
        status: "accepted",
        createdAt: "2026-04-20T14:00:00.000Z",
        installments: _tenancySchedule2,
      },
    ],
    events: [
      {
        id: "evt-t-1",
        type: "proposal_requested",
        actor: "tenant",
        headline: "Tenant requested a payment plan",
        createdAt: "2026-04-12T10:30:00.000Z",
        proposal: snapshotFromInstallments(_tenancySchedule1),
        resultingStatus: "awaiting_landlord_approval",
        chargesBreakdown: [
          { label: "Rent (Annually)", amount: 2260000 },
          { label: "Service Charge", amount: 250000 },
        ],
        preferredScheduleText: "₦418,333 for 6 months",
        tenantNote: "Please help me spread this out, it's a lot to pay at once.",
      },
      {
        id: "evt-t-2",
        type: "proposal_declined",
        actor: "landlord",
        headline: "Property Manager declined the proposal",
        createdAt: "2026-04-18T11:15:00.000Z",
        proposal: snapshotFromInstallments(_tenancySchedule1),
        reason: "6 installments extends beyond the property's maximum payment plan window.",
        resultingStatus: "declined",
      },
      {
        id: "evt-t-3",
        type: "proposal_revised",
        actor: "landlord",
        headline: "Property Manager revised the proposal",
        createdAt: "2026-04-20T14:00:00.000Z",
        previousProposal: snapshotFromInstallments(_tenancySchedule1),
        proposal: snapshotFromInstallments(_tenancySchedule2),
        reason: "Adjusted to comply with the property's payment policy.",
        resultingStatus: "awaiting_tenant_response",
      },
      {
        id: "evt-t-4",
        type: "proposal_accepted",
        actor: "tenant",
        headline: "Tenant accepted the revised proposal",
        createdAt: "2026-04-21T09:00:00.000Z",
        proposal: snapshotFromInstallments(_tenancySchedule2),
        resultingStatus: "approved",
      },
      {
        id: "evt-t-5",
        type: "plan_approved",
        actor: "system",
        headline: "Property Manager approved the payment plan",
        createdAt: "2026-04-21T09:05:00.000Z",
        proposal: snapshotFromInstallments(_tenancySchedule2),
        effectiveDate: "2026-04-21",
        resultingStatus: "approved",
      },
      {
        id: "evt-t-6",
        type: "installment_paid",
        actor: "system",
        headline: "Installment 1 Paid",
        createdAt: "2026-05-01T08:00:00.000Z",
        installmentIndex: 1,
        installmentTotal: 4,
        installmentAmount: 627500,
        installmentDueDate: "2026-05-01",
        paymentMethod: "Bank Transfer",
        paymentReference: "TRX-20260501-11207",
      },
      { id: "evt-t-7", type: "reminder_sent", actor: "system", headline: "Reminder sent", createdAt: "2026-05-28T09:00:00.000Z" },
      {
        id: "evt-t-8",
        type: "installment_overdue",
        actor: "system",
        headline: "Installment 2 Overdue",
        createdAt: "2026-06-02T09:00:00.000Z",
        installmentIndex: 2,
        installmentTotal: 4,
        installmentAmount: 627500,
        installmentDueDate: "2026-06-01",
      },
    ],
  },
  {
    id: "thr-seed-rent",
    propertyName: "Lekki Phase 1 Duplex",
    tenantId: "t-001",
    tenantName: "Amara Okonkwo",
    title: "Rent",
    amountDue: 1800000,
    status: "approved",
    createdAt: "2026-05-01T00:00:00.000Z",
    lastActivityAt: "2026-05-01T00:00:00.000Z",
    revisions: [
      {
        id: "rev-rent-1",
        revisionNumber: 1,
        proposedBy: "landlord",
        totalAmount: 1800000,
        planType: "equal",
        status: "accepted",
        createdAt: "2026-05-01T00:00:00.000Z",
        installments: _rentSchedule,
      },
    ],
    events: [
      {
        id: "evt-r-1",
        type: "proposal_created",
        actor: "landlord",
        headline: "Property Manager proposed a payment plan",
        createdAt: "2026-05-01T00:00:00.000Z",
        proposal: snapshotFromInstallments(_rentSchedule),
        resultingStatus: "awaiting_tenant_response",
      },
      {
        id: "evt-r-2",
        type: "plan_approved",
        actor: "system",
        headline: "Property Manager approved the payment plan",
        createdAt: "2026-05-01T00:05:00.000Z",
        proposal: snapshotFromInstallments(_rentSchedule),
        effectiveDate: "2026-05-01",
        resultingStatus: "approved",
      },
    ],
  },
  {
    id: "thr-seed-service-charge",
    propertyName: "Lekki Phase 1 Duplex",
    tenantId: "t-001",
    tenantName: "Amara Okonkwo",
    title: "Service Charge",
    amountDue: 250000,
    status: "completed",
    createdAt: "2026-04-28T16:18:00.000Z",
    lastActivityAt: "2026-07-01T08:00:00.000Z",
    revisions: [
      {
        id: "rev-sc-0",
        revisionNumber: 1,
        proposedBy: "tenant",
        totalAmount: 250000,
        planType: "equal",
        status: "declined",
        createdAt: "2026-04-28T16:18:00.000Z",
        note:
          "I'm unable to pay the full service charge at once because of some unexpected financial commitments. I'd appreciate the opportunity to spread the payment over five months, and I'll ensure each installment is paid on time.",
        installments: _serviceChargeTenantRequest,
      },
      {
        id: "rev-sc-1",
        revisionNumber: 2,
        proposedBy: "landlord",
        totalAmount: 250000,
        planType: "equal",
        status: "accepted",
        createdAt: "2026-05-01T00:00:00.000Z",
        installments: _serviceChargeSchedule,
      },
    ],
    events: [
      {
        id: "evt-sc-0",
        type: "proposal_requested",
        actor: "tenant",
        headline: "Tenant requested a payment plan",
        createdAt: "2026-04-28T16:18:00.000Z",
        proposal: snapshotFromInstallments(_serviceChargeTenantRequest),
        resultingStatus: "awaiting_landlord_approval",
        chargesBreakdown: [{ label: "Service Charge", amount: 250000 }],
        preferredScheduleText: "₦50,000 monthly for 5 months",
        tenantNote:
          "I'm unable to pay the full service charge at once because of some unexpected financial commitments. I'd appreciate the opportunity to spread the payment over five months, and I'll ensure each installment is paid on time.",
      },
      {
        id: "evt-sc-1",
        type: "proposal_revised",
        actor: "landlord",
        headline: "Property Manager revised the proposal",
        createdAt: "2026-05-01T00:00:00.000Z",
        previousProposal: snapshotFromInstallments(_serviceChargeTenantRequest),
        proposal: snapshotFromInstallments(_serviceChargeSchedule),
        reason: "Consolidated into 2 installments to align with the property's billing cycle.",
        resultingStatus: "awaiting_tenant_response",
      },
      {
        id: "evt-sc-2",
        type: "plan_approved",
        actor: "system",
        headline: "Property Manager approved the payment plan",
        createdAt: "2026-05-01T00:05:00.000Z",
        proposal: snapshotFromInstallments(_serviceChargeSchedule),
        effectiveDate: "2026-05-01",
        resultingStatus: "approved",
      },
      {
        id: "evt-sc-3",
        type: "installment_paid",
        actor: "system",
        headline: "Installment 1 Paid",
        createdAt: "2026-06-01T08:00:00.000Z",
        installmentIndex: 1,
        installmentTotal: 2,
        installmentAmount: 125000,
        installmentDueDate: "2026-06-01",
        paymentMethod: "Bank Transfer",
        paymentReference: "TRX-20260601-48392",
      },
      {
        id: "evt-sc-4",
        type: "installment_paid",
        actor: "system",
        headline: "Installment 2 Paid",
        createdAt: "2026-07-01T08:00:00.000Z",
        installmentIndex: 2,
        installmentTotal: 2,
        installmentAmount: 125000,
        installmentDueDate: "2026-07-01",
        paymentMethod: "Bank Transfer",
        paymentReference: "TRX-20260701-93810",
      },
      {
        id: "evt-sc-5",
        type: "plan_completed",
        actor: "system",
        headline: "Payment Plan Completed",
        createdAt: "2026-07-01T08:05:00.000Z",
        proposal: snapshotFromInstallments(_serviceChargeSchedule),
        resultingStatus: "completed",
      },
    ],
  },
];

export function subscribeToPaymentPlanThreads(listener: Listener): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

export function getPaymentPlanThreads(propertyName: string, tenantId: string): PaymentPlanThread[] {
  return _threads
    .filter((t) => t.propertyName === propertyName && t.tenantId === tenantId)
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

export function getPaymentPlanThread(threadId: string): PaymentPlanThread | undefined {
  const thread = _threads.find((t) => t.id === threadId);
  return thread ? { ...thread } : undefined;
}

export function getCurrentRevision(thread: PaymentPlanThread): ProposalRevision | undefined {
  // The most recently created revision determines what's "active" right now. If it was
  // deleted, there is no current proposal — deletion is not meant to reveal older history.
  const latest = thread.revisions[thread.revisions.length - 1];
  if (!latest || latest.status === "deleted") return undefined;
  return (
    thread.revisions.find((r) => r.status === "current") ??
    [...thread.revisions].reverse().find((r) => r.status === "accepted" || r.status === "pending") ??
    latest
  );
}

/** Whether the thread's active proposal can be deleted outright (never accepted, no payments made). */
export function canDeleteCurrentProposal(thread: PaymentPlanThread): boolean {
  const revision = getCurrentRevision(thread);
  if (!revision) return false;
  if (revision.status !== "pending") return false;
  if (revision.installments.some((i) => i.status === "paid")) return false;
  return thread.status === "awaiting_landlord_approval" || thread.status === "awaiting_tenant_response";
}

function touch(thread: PaymentPlanThread, at?: string) {
  thread.lastActivityAt = at ?? new Date().toISOString();
}

/** Create a brand-new thread (first proposal). */
export function createPaymentPlanThread(input: {
  propertyName: string;
  tenantId: string;
  tenantName: string;
  title: string;
  amountDue: number;
  tenancyStartDate?: string;
  tenancyEndDate?: string;
  proposedBy: "landlord" | "tenant";
  planType: "equal" | "custom";
  installments: ProposalInstallment[];
}): PaymentPlanThread {
  const now = new Date().toISOString();
  const revision: ProposalRevision = {
    id: generateId("rev"),
    revisionNumber: 1,
    proposedBy: input.proposedBy,
    totalAmount: input.amountDue,
    planType: input.planType,
    status: "pending",
    createdAt: now,
    installments: input.installments,
  };
  const snapshot = snapshotFromInstallments(input.installments);
  const resultingStatus: ThreadStatus =
    input.proposedBy === "landlord" ? "awaiting_tenant_response" : "awaiting_landlord_approval";
  const thread: PaymentPlanThread = {
    id: generateId("thr"),
    propertyName: input.propertyName,
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    title: input.title,
    tenancyStartDate: input.tenancyStartDate,
    tenancyEndDate: input.tenancyEndDate,
    amountDue: input.amountDue,
    status: resultingStatus,
    createdAt: now,
    lastActivityAt: now,
    revisions: [revision],
    events: [
      {
        id: generateId("evt"),
        type: input.proposedBy === "tenant" ? "proposal_requested" : "proposal_created",
        actor: input.proposedBy,
        headline:
          input.proposedBy === "tenant"
            ? "Tenant requested a payment plan"
            : "Property Manager proposed a payment plan",
        createdAt: now,
        proposal: snapshot,
        resultingStatus,
      },
    ],
  };
  _threads.push(thread);
  _notify();
  return thread;
}

/** Add a new proposal revision to an existing thread (edit / counter-proposal). */
export function addProposalRevision(
  threadId: string,
  input: {
    proposedBy: "landlord" | "tenant";
    planType: "equal" | "custom";
    installments: ProposalInstallment[];
    note?: string;
  }
) {
  const thread = _threads.find((t) => t.id === threadId);
  if (!thread) return;
  const now = new Date().toISOString();
  const totalAmount = input.installments.reduce((sum, i) => sum + i.amount, 0);
  const nextNumber = thread.revisions.length + 1;
  const previousRevision = thread.revisions[thread.revisions.length - 1];
  const previousSnapshot = snapshotFromInstallments(previousRevision?.installments ?? []);

  thread.revisions.push({
    id: generateId("rev"),
    revisionNumber: nextNumber,
    proposedBy: input.proposedBy,
    totalAmount,
    planType: input.planType,
    status: "pending",
    createdAt: now,
    note: input.note,
    installments: input.installments,
  });

  const snapshot = snapshotFromInstallments(input.installments);
  const resultingStatus: ThreadStatus =
    input.proposedBy === "landlord" ? "awaiting_tenant_response" : "awaiting_landlord_approval";

  thread.events.push({
    id: generateId("evt"),
    type: "proposal_revised",
    actor: input.proposedBy,
    headline: `${actorLabel(input.proposedBy)} revised the proposal`,
    createdAt: now,
    previousProposal: previousSnapshot,
    proposal: snapshot,
    reason: input.note,
    resultingStatus,
  });
  thread.status = resultingStatus;
  touch(thread, now);
  _notify();
}

/** Accept/approve the latest pending proposal — marks it current and the thread approved. */
export function approveProposal(threadId: string, revisionId: string, actor: "landlord" | "tenant" = "landlord") {
  const thread = _threads.find((t) => t.id === threadId);
  if (!thread) return;
  const now = new Date().toISOString();
  const revision = thread.revisions.find((r) => r.id === revisionId);
  if (!revision) return;
  const isRevised = revision.revisionNumber > 1;
  const snapshot = snapshotFromInstallments(revision.installments);

  thread.revisions = thread.revisions.map((r) => {
    if (r.id === revisionId) return { ...r, status: "current" as ProposalStatus };
    if (r.status === "current") return { ...r, status: "accepted" as ProposalStatus };
    return r;
  });

  if (actor === "landlord") {
    // Property Manager approving = final approval of the payment plan.
    thread.events.push({
      id: generateId("evt"),
      type: "plan_approved",
      actor,
      headline: "Property Manager approved the payment plan",
      createdAt: now,
      proposal: snapshot,
      effectiveDate: now.slice(0, 10),
      resultingStatus: "approved",
    });
  } else {
    // Tenant accepting a proposal from the Property Manager.
    thread.events.push({
      id: generateId("evt"),
      type: "proposal_accepted",
      actor,
      headline: `Tenant accepted the ${isRevised ? "revised " : ""}proposal`,
      createdAt: now,
      proposal: snapshot,
      resultingStatus: "approved",
    });
    thread.events.push({
      id: generateId("evt"),
      type: "plan_approved",
      actor: "system",
      headline: "Property Manager approved the payment plan",
      createdAt: now,
      proposal: snapshot,
      effectiveDate: now.slice(0, 10),
      resultingStatus: "approved",
    });
  }
  thread.status = "approved";
  touch(thread, now);
  _notify();
}

export function declineProposal(
  threadId: string,
  revisionId: string,
  actor: "landlord" | "tenant" = "landlord",
  reason?: string
) {
  const thread = _threads.find((t) => t.id === threadId);
  if (!thread) return;
  const now = new Date().toISOString();
  const revision = thread.revisions.find((r) => r.id === revisionId);
  if (!revision) return;
  const isRevised = revision.revisionNumber > 1;
  const snapshot = snapshotFromInstallments(revision.installments);

  thread.revisions = thread.revisions.map((r) =>
    r.id === revisionId ? { ...r, status: "declined" as ProposalStatus } : r
  );

  // A tenant declining keeps the negotiation open; a Property Manager decline is definitive.
  const resultingStatus: ThreadStatus = actor === "tenant" ? "awaiting_landlord_approval" : "declined";

  thread.events.push({
    id: generateId("evt"),
    type: "proposal_declined",
    actor,
    headline:
      actor === "landlord"
        ? "Property Manager declined the proposal"
        : `Tenant declined the ${isRevised ? "revised " : ""}proposal`,
    createdAt: now,
    proposal: snapshot,
    reason,
    resultingStatus: actor === "landlord" ? "declined" : undefined,
    resultingStatusLabel: actor === "tenant" ? "Negotiation Continues" : undefined,
  });
  thread.status = resultingStatus;
  touch(thread, now);
  _notify();
}

/**
 * Delete the current proposal outright. Only allowed while it has never been
 * accepted and no installment on it has been paid (canDeleteCurrentProposal()).
 * Removes it from "Current Proposal" and records the deletion in the timeline —
 * the proposal itself stays in thread.revisions for history, just marked deleted.
 */
export function deleteCurrentProposal(threadId: string, actor: "landlord" | "tenant" = "landlord") {
  const thread = _threads.find((t) => t.id === threadId);
  if (!thread) return;
  if (!canDeleteCurrentProposal(thread)) return;
  const revision = getCurrentRevision(thread);
  if (!revision) return;
  const now = new Date().toISOString();
  const snapshot = snapshotFromInstallments(revision.installments);

  thread.revisions = thread.revisions.map((r) =>
    r.id === revision.id ? { ...r, status: "deleted" as ProposalStatus } : r
  );

  thread.events.push({
    id: generateId("evt"),
    type: "proposal_deleted",
    actor,
    headline: `${actorLabel(actor)} deleted the payment plan proposal`,
    createdAt: now,
    proposal: snapshot,
    resultingStatusLabel: "Deleted",
  });
  thread.status = "cancelled";
  touch(thread, now);
  _notify();
}

/**
 * Cancel a payment plan that has already been accepted/approved or has payment
 * history. Unlike deleteCurrentProposal, the plan and its history remain fully
 * visible — only its status changes.
 */
export function cancelThread(threadId: string, actor: "landlord" | "tenant" = "landlord", reason?: string) {
  const thread = _threads.find((t) => t.id === threadId);
  if (!thread) return;
  const now = new Date().toISOString();
  const revision = getCurrentRevision(thread);
  thread.status = "cancelled";
  thread.events.push({
    id: generateId("evt"),
    type: "plan_cancelled",
    actor,
    headline: `${actorLabel(actor)} cancelled the payment plan`,
    createdAt: now,
    proposal: revision ? snapshotFromInstallments(revision.installments) : undefined,
    reason,
    resultingStatusLabel: "Cancelled",
  });
  touch(thread, now);
  _notify();
}

export function markInstallmentPaid(threadId: string, revisionId: string, installmentId: string) {
  const thread = _threads.find((t) => t.id === threadId);
  if (!thread) return;
  const revision = thread.revisions.find((r) => r.id === revisionId);
  if (!revision) return;
  const installment = revision.installments.find((i) => i.id === installmentId);
  if (!installment || installment.status === "paid") return;
  installment.status = "paid";
  const now = new Date().toISOString();
  const idx = revision.installments.indexOf(installment) + 1;
  const total = revision.installments.length;
  const datePart = now.slice(0, 10).replace(/-/g, "");
  const reference = `TRX-${datePart}-${Math.floor(10000 + Math.random() * 90000)}`;
  thread.events.push({
    id: generateId("evt"),
    type: "installment_paid",
    actor: "system",
    headline: `Installment ${idx} Paid`,
    createdAt: now,
    installmentIndex: idx,
    installmentTotal: total,
    installmentAmount: installment.amount,
    installmentDueDate: installment.dueDate,
    paymentMethod: "Bank Transfer",
    paymentReference: reference,
  });
  const allPaid = revision.installments.every((i) => i.status === "paid");
  if (allPaid && getCurrentRevision(thread)?.id === revision.id) {
    thread.status = "completed";
    thread.events.push({
      id: generateId("evt"),
      type: "plan_completed",
      actor: "system",
      headline: "Payment Plan Completed",
      createdAt: now,
      proposal: snapshotFromInstallments(revision.installments),
      resultingStatus: "completed",
    });
  }
  touch(thread, now);
  _notify();
}

export function sendReminder(threadId: string) {
  const thread = _threads.find((t) => t.id === threadId);
  if (!thread) return;
  const now = new Date().toISOString();
  thread.events.push({
    id: generateId("evt"),
    type: "reminder_sent",
    actor: "system",
    headline: "Reminder sent",
    createdAt: now,
  });
  touch(thread, now);
  _notify();
}

export function removeThread(threadId: string) {
  const idx = _threads.findIndex((t) => t.id === threadId);
  if (idx !== -1) {
    _threads.splice(idx, 1);
    _notify();
  }
}

export const THREAD_STATUS_LABELS: Record<ThreadStatus, string> = {
  awaiting_tenant_response: "Awaiting Tenant Response",
  awaiting_landlord_approval: "Awaiting Landlord Approval",
  approved: "Approved",
  declined: "Declined",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const THREAD_STATUS_STYLES: Record<ThreadStatus, string> = {
  awaiting_tenant_response: "bg-amber-50 text-amber-600",
  awaiting_landlord_approval: "bg-blue-50 text-blue-600",
  approved: "bg-green-100 text-green-700",
  declined: "bg-red-50 text-red-500",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-400",
};

/** "Yesterday", "2 hours ago", or a short date for anything older than a week. */
export function formatLastActivity(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isSameDay) {
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (isYesterday) return "Yesterday";
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Full history-card timestamp, e.g. "21 Apr 2026 • 09:15 AM". */
export function formatFullTimestamp(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart} • ${timePart}`;
}
