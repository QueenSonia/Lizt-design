/**
 * In-memory store for recurring invoice charges per property.
 * Only items with a non-one_time frequency are shown as Recurring Charges.
 */

export interface RecurringCharge {
  id: string;
  feeName: string;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly" | "annually";
  nextDueDate: string; // ISO date string YYYY-MM-DD
}

// propertyName → RecurringCharge[]
const _charges = new Map<string, RecurringCharge[]>([
  [
    "Lekki Phase 1 Duplex",
    [
      {
        id: "rc-001",
        feeName: "Diesel Fee",
        amount: 20000,
        frequency: "monthly",
        nextDueDate: "2027-06-01",
      },
      {
        id: "rc-002",
        feeName: "Maintenance Fee",
        amount: 10000,
        frequency: "quarterly",
        nextDueDate: "2027-07-01",
      },
    ],
  ],
  [
    "Victoria Island Apartment",
    [
      {
        id: "rc-003",
        feeName: "Generator Levy",
        amount: 15000,
        frequency: "monthly",
        nextDueDate: "2027-05-01",
      },
    ],
  ],
  [
    "Ikoyi Terrace",
    [
      {
        id: "rc-004",
        feeName: "Cleaning Fee",
        amount: 8000,
        frequency: "monthly",
        nextDueDate: "2027-05-15",
      },
      {
        id: "rc-005",
        feeName: "Security Levy",
        amount: 25000,
        frequency: "annually",
        nextDueDate: "2028-01-01",
      },
    ],
  ],
]);

type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribeToRecurringCharges(listener: Listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function _notify() {
  _listeners.forEach((l) => l());
}

export function getRecurringCharges(propertyName: string): RecurringCharge[] {
  return _charges.get(propertyName) ?? [];
}

export function addRecurringCharge(propertyName: string, charge: RecurringCharge) {
  const existing = _charges.get(propertyName) ?? [];
  _charges.set(propertyName, [...existing, charge]);
  _notify();
}

export function removeRecurringCharge(propertyName: string, chargeId: string) {
  const existing = _charges.get(propertyName) ?? [];
  _charges.set(propertyName, existing.filter((c) => c.id !== chargeId));
  _notify();
}
