/**
 * Normalizes phone numbers to a consistent format
 * Handles +234, 0234, 234, and 10-digit formats
 * Returns format: +234XXXXXXXXXX
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Return empty string if no digits
  if (!cleaned) return "";

  // Handle different formats
  if (cleaned.startsWith("234") && cleaned.length === 13) {
    // Already in international format without + (234XXXXXXXXXX)
    return `+${cleaned}`;
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    // Nigerian local format (0XXXXXXXXXX)
    return `+234${cleaned.substring(1)}`;
  } else if (
    cleaned.length === 10 &&
    !cleaned.startsWith("0") &&
    !cleaned.startsWith("234")
  ) {
    // 10 digits without country code (XXXXXXXXXX)
    return `+234${cleaned}`;
  } else if (cleaned.startsWith("234") && cleaned.length > 13) {
    // Truncate if too long
    return `+${cleaned.substring(0, 13)}`;
  } else if (cleaned.startsWith("0") && cleaned.length > 11) {
    // Truncate if too long
    return `+234${cleaned.substring(1, 11)}`;
  } else if (
    cleaned.length > 10 &&
    !cleaned.startsWith("0") &&
    !cleaned.startsWith("234")
  ) {
    // Truncate if too long
    return `+234${cleaned.substring(0, 10)}`;
  }

  // For incomplete numbers, return as-is with +234 prefix if it makes sense
  if (cleaned.startsWith("234")) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith("0")) {
    return `+234${cleaned.substring(1)}`;
  } else {
    return `+234${cleaned}`;
  }
}
