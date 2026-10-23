const RANGE_KEY = "pk_analytics_range";
const ACCOUNT_KEY = "pk_analytics_account";
const _listeners = new Set<() => void>();

export type DateRange = "30d" | "90d" | "12m";
export type AccountType = "all" | "landlord" | "pm";

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
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

export function getDateRange(): DateRange {
  return read<DateRange>(RANGE_KEY, "30d");
}

export function setDateRange(range: DateRange): void {
  write(RANGE_KEY, range);
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
