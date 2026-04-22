/**
 * In-memory store for payment plans per property + tenant.
 */

export interface PaymentPlanInstallment {
  id: string;
  amount: number;
  dueDate: string; // ISO YYYY-MM-DD
  status: "pending" | "paid";
}

export interface PaymentPlan {
  id: string;
  propertyName: string;
  tenantId: string;
  chargeName: string;
  totalAmount: number;
  planType: "equal" | "custom";
  installments: PaymentPlanInstallment[];
  createdAt: string; // ISO
}

type Listener = () => void;
const _listeners = new Set<Listener>();

const _plans: PaymentPlan[] = [
  {
    id: "pp-seed-001",
    propertyName: "Lekki Phase 1 Duplex",
    tenantId: "t-001",
    chargeName: "Rent",
    totalAmount: 1800000,
    planType: "equal",
    createdAt: "2027-05-01T00:00:00.000Z",
    installments: [
      { id: "pi-001-1", amount: 600000, dueDate: "2027-06-01", status: "pending" },
      { id: "pi-001-2", amount: 600000, dueDate: "2027-07-01", status: "pending" },
      { id: "pi-001-3", amount: 600000, dueDate: "2027-08-01", status: "pending" },
    ],
  },
  {
    id: "pp-seed-003",
    propertyName: "Lekki Phase 1 Duplex",
    tenantId: "t-001",
    chargeName: "Entire Tenancy",
    totalAmount: 2510000,
    planType: "equal",
    createdAt: "2027-05-01T00:00:00.000Z",
    installments: [
      { id: "pi-003-1", amount: 627500, dueDate: "2027-06-01", status: "paid" },
      { id: "pi-003-2", amount: 627500, dueDate: "2027-07-01", status: "pending" },
      { id: "pi-003-3", amount: 627500, dueDate: "2027-08-01", status: "pending" },
      { id: "pi-003-4", amount: 627500, dueDate: "2027-09-01", status: "pending" },
    ],
  },
  {
    id: "pp-seed-002",
    propertyName: "Lekki Phase 1 Duplex",
    tenantId: "t-001",
    chargeName: "Service Charge",
    totalAmount: 250000,
    planType: "equal",
    createdAt: "2027-05-01T00:00:00.000Z",
    installments: [
      { id: "pi-002-1", amount: 125000, dueDate: "2027-06-01", status: "paid" },
      { id: "pi-002-2", amount: 125000, dueDate: "2027-07-01", status: "pending" },
    ],
  },
];

function _notify() {
  _listeners.forEach((l) => l());
}

export function subscribeToPaymentPlans(listener: Listener): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

export function getPaymentPlans(propertyName: string, tenantId: string): PaymentPlan[] {
  return _plans.filter((p) => p.propertyName === propertyName && p.tenantId === tenantId);
}

export function addPaymentPlan(plan: Omit<PaymentPlan, "id" | "createdAt">): PaymentPlan {
  const newPlan: PaymentPlan = {
    ...plan,
    id: `pp-${Date.now()}`,
    createdAt: new Date().toISOString(),
    installments: plan.installments.map((inst) => ({
      ...inst,
      status: inst.status ?? "pending",
    })),
  };
  _plans.push(newPlan);
  _notify();
  return newPlan;
}

export function markInstallmentPaid(planId: string, installmentId: string) {
  const plan = _plans.find((p) => p.id === planId);
  if (!plan) return;
  plan.installments = plan.installments.map((inst) =>
    inst.id === installmentId ? { ...inst, status: "paid" } : inst
  );
  _notify();
}

export function removePaymentPlan(planId: string) {
  const idx = _plans.findIndex((p) => p.id === planId);
  if (idx !== -1) {
    _plans.splice(idx, 1);
    _notify();
  }
}

export function updatePaymentPlan(planId: string, updates: Pick<PaymentPlan, "planType" | "installments">) {
  const plan = _plans.find((p) => p.id === planId);
  if (!plan) return;
  plan.planType = updates.planType;
  plan.installments = updates.installments;
  _notify();
}
