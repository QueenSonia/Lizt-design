/**
 * In-memory store tracking which onboarding submissions have been converted into real records.
 * Lets the Onboarding Detail page track "Landlord Onboarded" / "Property Added" state without a
 * backend — mirrors the Map + subscribe/notify convention used by agentStore.ts and
 * facilityManagerStore.ts.
 *
 * A property can never be marked added before its submission's landlord has been onboarded —
 * markPropertyAdded() is a no-op if the landlord hasn't been onboarded yet, enforcing the rule
 * that a property never exists without first belonging to an onboarded landlord.
 */

// submissionId → the mock landlord id created for it (undefined until onboarded)
const _onboardedLandlords = new Map<string, string>();
// submissionId → set of propertyIds already added as real properties
const _addedProperties = new Map<string, Set<string>>();

type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribeToOnboardingConversionStore(listener: Listener) {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

function _notify() {
  _listeners.forEach((l) => l());
}

export function isLandlordOnboarded(submissionId: string): boolean {
  return _onboardedLandlords.has(submissionId);
}

export function getOnboardedLandlordId(submissionId: string): string | undefined {
  return _onboardedLandlords.get(submissionId);
}

export function isPropertyAdded(submissionId: string, propertyId: string): boolean {
  return _addedProperties.get(submissionId)?.has(propertyId) ?? false;
}

/** Onboards the landlord for a submission, optionally importing a set of properties at the same time. */
export function onboardLandlord(
  submissionId: string,
  landlordId: string,
  propertyIdsToAdd: string[] = []
) {
  _onboardedLandlords.set(submissionId, landlordId);
  const existing = _addedProperties.get(submissionId) ?? new Set<string>();
  propertyIdsToAdd.forEach((id) => existing.add(id));
  _addedProperties.set(submissionId, existing);
  _notify();
}

/** Adds a single property — a no-op if the submission's landlord hasn't been onboarded yet. */
export function markPropertyAdded(submissionId: string, propertyId: string) {
  if (!isLandlordOnboarded(submissionId)) return;
  const existing = _addedProperties.get(submissionId) ?? new Set<string>();
  existing.add(propertyId);
  _addedProperties.set(submissionId, existing);
  _notify();
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function generateLandlordId() {
  return generateId("ll");
}
