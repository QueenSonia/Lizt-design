/**
 * In-memory store for Property-Manager-assigned "official" agent names, keyed by normalized
 * phone number. An agent's identity is always the phone number — this store only overrides
 * the *display* name shown for that phone number across the app; it never touches the
 * KYC-submitted names (aliases), which remain read-only historical references.
 */

// normalizedPhone → official display name
const _officialNames = new Map<string, string>();

type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribeToAgentStore(listener: Listener) {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

function _notify() {
  _listeners.forEach((l) => l());
}

export function getOfficialAgentName(normalizedPhone: string): string | undefined {
  return _officialNames.get(normalizedPhone);
}

export function setOfficialAgentName(normalizedPhone: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  _officialNames.set(normalizedPhone, trimmed);
  _notify();
}
