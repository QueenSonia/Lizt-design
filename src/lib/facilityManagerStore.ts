/**
 * Lightweight in-memory store for Facility Manager ↔ Property assignments.
 * Shared across LandlordPropertyDetail and LandlordFacility within the same session.
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

// propertyName → managerId
const _assignments = new Map<string, string>([
  ["Lekki Phase 1 Duplex", "fm-001"],
  ["Victoria Island Apartment", "fm-002"],
  ["Ikoyi Terrace", "fm-001"],
  ["Ajah Bungalow", "fm-003"],
]);

// Listeners so components can re-render when the store changes
type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribeToFMStore(listener: Listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function _notify() {
  _listeners.forEach((l) => l());
}

export function getAssignedManager(propertyName: string): MockFacilityManager | null {
  const id = _assignments.get(propertyName);
  return id ? (MOCK_FM_LIST.find((m) => m.id === id) ?? null) : null;
}

export function setAssignedManager(propertyName: string, managerId: string | null) {
  if (managerId) {
    _assignments.set(propertyName, managerId);
  } else {
    _assignments.delete(propertyName);
  }
  _notify();
}

/** Returns all property names assigned to a given manager */
export function getPropertiesForManager(managerId: string): string[] {
  return Array.from(_assignments.entries())
    .filter(([, mid]) => mid === managerId)
    .map(([prop]) => prop);
}
