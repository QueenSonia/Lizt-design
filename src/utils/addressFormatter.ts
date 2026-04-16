/**
 * Format Nigerian address for postal/letter use
 * Converts various address formats into a standardized Nigerian postal format
 *
 * Standard format:
 * Street Number and Name
 * Area/Neighborhood
 * City Postal Code
 * State/Territory
 * NIGERIA
 *
 * @param address - Raw address string from user input
 * @returns Formatted address with proper line breaks
 */
export function formatNigerianAddress(address: string | undefined): string {
  if (!address || address.trim() === "") {
    return "Lagos, Nigeria";
  }

  // Clean up the address
  const cleaned = address.trim();

  // If address already has line breaks, preserve them
  if (cleaned.includes("\n")) {
    return cleaned;
  }

  // Common separators in Nigerian addresses
  const separators = [",", ";", "|"];
  let parts: string[] = [];

  // Try to split by common separators
  for (const separator of separators) {
    if (cleaned.includes(separator)) {
      parts = cleaned
        .split(separator)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      break;
    }
  }

  // If no separators found, return as single line
  if (parts.length === 0) {
    return cleaned;
  }

  // Join parts with line breaks for proper postal format
  return parts.join("\n");
}

/**
 * Format address for display in a single line (comma-separated)
 * Useful for compact displays
 *
 * @param address - Raw address string
 * @returns Single-line comma-separated address
 */
export function formatAddressInline(address: string | undefined): string {
  if (!address || address.trim() === "") {
    return "Lagos, Nigeria";
  }

  const cleaned = address.trim();

  // If it has line breaks, convert to comma-separated
  if (cleaned.includes("\n")) {
    return cleaned
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join(", ");
  }

  // Normalize separators to commas
  return cleaned
    .replace(/[;|]/g, ",")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(", ");
}

/**
 * Validate if an address looks like a Nigerian address
 * Checks for common Nigerian location indicators
 *
 * @param address - Address string to validate
 * @returns true if address appears to be Nigerian
 */
export function isNigerianAddress(address: string | undefined): boolean {
  if (!address) return false;

  const lowerAddress = address.toLowerCase();

  // Common Nigerian states and cities
  const nigerianLocations = [
    "lagos",
    "abuja",
    "fct",
    "kano",
    "ibadan",
    "port harcourt",
    "benin",
    "kaduna",
    "jos",
    "ilorin",
    "enugu",
    "abeokuta",
    "owerri",
    "calabar",
    "akure",
    "oyo",
    "osun",
    "ogun",
    "rivers",
    "delta",
    "edo",
    "anambra",
    "imo",
    "ekiti",
    "kwara",
    "plateau",
    "benue",
    "niger",
    "kogi",
    "nasarawa",
    "taraba",
    "adamawa",
    "borno",
    "yobe",
    "bauchi",
    "gombe",
    "jigawa",
    "katsina",
    "kebbi",
    "sokoto",
    "zamfara",
    "cross river",
    "akwa ibom",
    "bayelsa",
    "ebonyi",
    "abia",
    "nigeria",
  ];

  return nigerianLocations.some((location) => lowerAddress.includes(location));
}
