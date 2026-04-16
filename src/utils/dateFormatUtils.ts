/**
 * Utility functions for date formatting and conversion
 * Handles conversion between dd/mm/yyyy (display) and yyyy-mm-dd (database) formats
 */

/**
 * Convert ISO date string (yyyy-mm-dd) to dd/mm/yyyy format for display
 */
export function formatDateForDisplay(isoDate: string): string {
  if (!isoDate) return "";

  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "";

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date for display:", error);
    return "";
  }
}

/**
 * Convert dd/mm/yyyy format to ISO date string (yyyy-mm-dd) for database
 */
export function formatDateForDatabase(displayDate: string): string {
  if (!displayDate) return "";

  try {
    // Handle dd/mm/yyyy format
    const parts = displayDate.split("/");
    if (parts.length !== 3) return "";

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validate date parts
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
      return "";
    }

    // Create date object and validate it's a real date
    const date = new Date(year, month - 1, day);
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return "";
    }

    // Return ISO format (yyyy-mm-dd)
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error formatting date for database:", error);
    return "";
  }
}

/**
 * Validate dd/mm/yyyy date format
 */
export function isValidDisplayDate(displayDate: string): boolean {
  if (!displayDate) return false;

  const parts = displayDate.split("/");
  if (parts.length !== 3) return false;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Basic validation
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900)
    return false;

  // Create date and check if it's valid
  const date = new Date(year, month - 1, day);
  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
}

/**
 * Get current date in dd/mm/yyyy format
 */
export function getCurrentDateForDisplay(): string {
  const today = new Date();
  return formatDateForDisplay(today.toISOString().split("T")[0]);
}

/**
 * Add days to a date in dd/mm/yyyy format and return in same format
 */
export function addDaysToDisplayDate(
  displayDate: string,
  days: number
): string {
  const isoDate = formatDateForDatabase(displayDate);
  if (!isoDate) return "";

  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);

  return formatDateForDisplay(date.toISOString().split("T")[0]);
}

/**
 * Format date input mask for dd/mm/yyyy
 */
export function formatDateInput(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, "");

  // Apply dd/mm/yyyy format
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(
      4,
      8
    )}`;
  }
}
