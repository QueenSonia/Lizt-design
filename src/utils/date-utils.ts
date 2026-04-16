/**
 * Format a Date object to YYYY-MM-DD using local date components.
 * Use this instead of date.toISOString().split("T")[0] to avoid UTC timezone shifts.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a local Date object (no UTC shift).
 * Safer than new Date("2025-04-12") which parses as UTC midnight.
 */
export function parseLocalDate(dateString: string): Date | undefined {
  if (!dateString) return undefined;
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return undefined;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Add months to a date string (YYYY-MM-DD format)
 * @param dateString - Date in YYYY-MM-DD format
 * @param months - Number of months to add
 * @returns New date in YYYY-MM-DD format
 */
export function addMonths(dateString: string, months: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setMonth(date.getMonth() + months);
  date.setDate(date.getDate() - 1); // Subtract 1 day as per requirement

  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, "0");
  const newDay = String(date.getDate()).padStart(2, "0");

  return `${newYear}-${newMonth}-${newDay}`;
}
/**
 * Safely format a timestamp to a time string, handling invalid dates gracefully
 * @param timestamp - Date object, string, or number timestamp
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted time string or empty string if invalid
 */
export function safeFormatTime(
  timestamp: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleTimeString([], {
      ...options,
      timeZone: "Africa/Lagos",
    });
  } catch {
    return "";
  }
}

/**
 * Safely format a timestamp to a date string, handling invalid dates gracefully
 * @param timestamp - Date object, string, or number timestamp
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string or "Invalid date" if invalid
 */
export function safeFormatDate(
  timestamp: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return date.toLocaleDateString([], {
      ...options,
      timeZone: "Africa/Lagos",
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Safely format a timestamp to both date and time, handling invalid dates gracefully
 * @param timestamp - Date object, string, or number timestamp
 * @returns Formatted date and time string or "Invalid date" if invalid
 */
export function safeFormatDateTime(timestamp: Date | string | number): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return `${date.toLocaleDateString([], { timeZone: "Africa/Lagos" })} at ${date.toLocaleTimeString([], { timeZone: "Africa/Lagos" })}`;
  } catch {
    return "Invalid date";
  }
}

/**
 * Get a human-readable date label for chat date separators.
 * Returns "Today", "Yesterday", or a formatted date like "Monday, March 1".
 */
export function getChatDateLabel(dateString: string | Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const lagosNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );
  const lagosMessage = new Date(
    date.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );

  const today = new Date(
    lagosNow.getFullYear(),
    lagosNow.getMonth(),
    lagosNow.getDate()
  );
  const messageDate = new Date(
    lagosMessage.getFullYear(),
    lagosMessage.getMonth(),
    lagosMessage.getDate()
  );

  const diffMs = today.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year:
      lagosMessage.getFullYear() !== lagosNow.getFullYear()
        ? "numeric"
        : undefined,
    timeZone: "Africa/Lagos",
  });
}

/**
 * Get a date key string (YYYY-MM-DD) for grouping messages by day.
 */
export function getDateKey(dateString: string | Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const lagos = new Date(
    date.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );
  return `${lagos.getFullYear()}-${String(lagos.getMonth() + 1).padStart(2, "0")}-${String(lagos.getDate()).padStart(2, "0")}`;
}
