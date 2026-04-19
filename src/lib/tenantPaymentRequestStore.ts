/**
 * In-memory store for tenant-requested payment plans.
 */

export type RequestStatus = "pending" | "approved" | "declined";

export interface TenantPaymentRequest {
  id: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  scope: "tenancy" | "charge";
  chargeName?: string; // only for scope === "charge"
  totalAmount: number;
  // Only for scope === "tenancy"
  tenancyStartDate?: string; // ISO YYYY-MM-DD
  tenancyEndDate?: string;   // ISO YYYY-MM-DD
  // Tenant-submitted fields
  installmentAmount: number;       // "Amount to Pay in Installments"
  preferredSchedule: string;       // "Preferred Schedule" — free text
  tenantNote: string;              // "Anything Else You'd Like to Add"
  requestedAt: string;             // ISO
  status: RequestStatus;
}

type Listener = () => void;
const _listeners = new Set<Listener>();

const _requests: TenantPaymentRequest[] = [
  {
    id: "tpr-001",
    propertyName: "Lekki Phase 1 Duplex",
    tenantId: "t-001",
    tenantName: "Amara Okonkwo",
    scope: "tenancy",
    totalAmount: 2510000,
    tenancyStartDate: "2026-05-01",
    tenancyEndDate: "2027-04-30",
    installmentAmount: 627500,
    preferredSchedule: "Monthly payments starting in May",
    tenantNote: "I'd like to spread the full tenancy cost over 4 months. Please let me know if this works.",
    requestedAt: "2026-04-12T10:30:00.000Z",
    status: "pending",
  },
];

function _notify() {
  _listeners.forEach((l) => l());
}

export function subscribeToPaymentRequests(listener: Listener): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

export function getPaymentRequests(propertyName: string, tenantId: string): TenantPaymentRequest[] {
  return _requests.filter((r) => r.propertyName === propertyName && r.tenantId === tenantId);
}

export function updateRequestStatus(id: string, status: RequestStatus) {
  const req = _requests.find((r) => r.id === id);
  if (!req) return;
  req.status = status;
  _notify();
}
