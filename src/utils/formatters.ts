/**
 * Format a number with commas as thousand separators
 * @param value - The number or string to format
 * @returns Formatted string with commas
 */
export function formatNumberWithCommas(value: string | number): string {
  const stringValue = typeof value === "number" ? value.toString() : value;
  const digits = stringValue.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Parse a formatted number string (with commas) back to a plain number string
 * @param value - The formatted string with commas
 * @returns Plain number string without commas
 */
export function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, "");
}
