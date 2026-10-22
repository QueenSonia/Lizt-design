const STORAGE_KEY = "lizt_marketing_ready";
const _listeners = new Set<() => void>();

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(s: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
  } catch {
    // ignore
  }
}

export function isMarketingReadyById(id: string): boolean {
  return readSet().has(id);
}

export function toggleMarketingReady(id: string): void {
  const s = readSet();
  if (s.has(id)) {
    s.delete(id);
  } else {
    s.add(id);
  }
  writeSet(s);
  _listeners.forEach((cb) => cb());
}

export function subscribeToMarketingReady(cb: () => void): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}
