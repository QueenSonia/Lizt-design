export interface WalletFee {
  id: string;
  feeName: string;
  amount: number;
  paymentDate: string;
}

const STORAGE_KEY = "applicantWalletFees";

type WalletStore = Record<string, WalletFee[]>;

function readAll(): WalletStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WalletStore) : {};
  } catch {
    return {};
  }
}

function writeAll(store: WalletStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToWalletFees(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

export function getWalletFees(applicationId: string): WalletFee[] {
  return readAll()[applicationId] ?? [];
}

export function getWalletBalance(applicationId: string): number {
  return getWalletFees(applicationId).reduce((sum, f) => sum + f.amount, 0);
}

export function addWalletFee(applicationId: string, fee: WalletFee) {
  const store = readAll();
  store[applicationId] = [...(store[applicationId] ?? []), fee];
  writeAll(store);
  notify();
}
