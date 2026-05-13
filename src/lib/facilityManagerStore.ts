/**
 * Lightweight in-memory store for Maintenance Request ↔ Facility Manager assignments.
 * Shared across LandlordFacility within the same session.
 *
 * Note: Facility managers are no longer assigned to *properties* — they are
 * assigned to specific maintenance requests / tasks. The legacy property-assignment
 * APIs are kept as thin no-op shims so older components don't crash, but they
 * no longer do anything meaningful.
 */

export interface MockFacilityManager {
  id: string;
  name: string;
}

export const MOCK_FM_LIST: MockFacilityManager[] = [
  { id: "fm-001", name: "Chukwuemeka Obi" },
  { id: "fm-002", name: "Amaka Nwosu" },
  { id: "fm-003", name: "Tunde Adeyemi" },
  { id: "fm-004", name: "Ngozi Eze" },
  { id: "fm-005", name: "Femi Olawale" },
  { id: "fm-006", name: "Blessing Okafor" },
];

// requestId → managerId
const _requestAssignments = new Map<string, string>([
  ["sr-002", "fm-001"],
  ["sr-004", "fm-003"],
]);

type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribeToFMStore(listener: Listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function _notify() {
  _listeners.forEach((l) => l());
}

// ─── Service request assignments ─────────────────────────────────

export function getRequestAssignee(
  requestId: string,
): MockFacilityManager | null {
  const id = _requestAssignments.get(requestId);
  return id ? (MOCK_FM_LIST.find((m) => m.id === id) ?? null) : null;
}

export function assignRequestToManager(
  requestId: string,
  managerId: string | null,
) {
  if (managerId) {
    _requestAssignments.set(requestId, managerId);
  } else {
    _requestAssignments.delete(requestId);
  }
  _notify();
}

export function getRequestsForManager(managerId: string): string[] {
  return Array.from(_requestAssignments.entries())
    .filter(([, mid]) => mid === managerId)
    .map(([reqId]) => reqId);
}

// ─── Manager management ──────────────────────────────────────────

export function removeFacilityManager(managerId: string) {
  const idx = MOCK_FM_LIST.findIndex((m) => m.id === managerId);
  if (idx !== -1) {
    MOCK_FM_LIST.splice(idx, 1);
  }
  for (const [reqId, mid] of Array.from(_requestAssignments.entries())) {
    if (mid === managerId) _requestAssignments.delete(reqId);
  }
  _notify();
}

// ─── Legacy property-assignment shims (no-ops) ───────────────────
// These are kept to avoid breaking existing imports while the property-based
// flow is being phased out. They no longer mutate any real state.

export function getAssignedManager(_propertyName: string): MockFacilityManager | null {
  return null;
}

export function setAssignedManager(
  _propertyName: string,
  _managerId: string | null,
) {
  // intentionally left blank — property assignment is no longer supported
}

export function getPropertiesForManager(_managerId: string): string[] {
  return [];
}
