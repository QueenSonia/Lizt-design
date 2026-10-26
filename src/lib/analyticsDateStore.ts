const PERIOD_KEY = "pk_analytics_period";
const ACCOUNT_KEY = "pk_analytics_account";
const _listeners = new Set<() => void>();

export type Period = "weekly" | "monthly" | "yearly";
export type AccountType = "all" | "landlord" | "pm";

export const PERIOD_LABELS: Record<Period, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  all: "All account types",
  landlord: "Landlords",
  pm: "Property managers",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getPeriod(): Period {
  return read<Period>(PERIOD_KEY, "monthly");
}

export function setPeriod(period: Period): void {
  write(PERIOD_KEY, period);
  _listeners.forEach((cb) => cb());
}

export function getAccountType(): AccountType {
  return read<AccountType>(ACCOUNT_KEY, "all");
}

export function setAccountType(type: AccountType): void {
  write(ACCOUNT_KEY, type);
  _listeners.forEach((cb) => cb());
}

export function subscribeToAnalyticsFilters(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}
