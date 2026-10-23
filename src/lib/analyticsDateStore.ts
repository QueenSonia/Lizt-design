const RANGE_KEY = "pk_analytics_range";
const LANDLORD_KEY = "pk_analytics_landlord";
const _listeners = new Set<() => void>();

export type DateRange = "30d" | "90d" | "12m";

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
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

export function getLandlordFilter(): string {
  return read<string>(LANDLORD_KEY, "all");
}

export function setLandlordFilter(id: string): void {
  write(LANDLORD_KEY, id);
  _listeners.forEach((cb) => cb());
}

export function subscribeToAnalyticsFilters(cb: () => void): () => void {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}
