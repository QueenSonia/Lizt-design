

/**
 * Calculate the rent due date based on tenancy start date and payment frequency
 * Accepts dd/mm/yyyy format and returns dd/mm/yyyy format for display
 */
export function calculateRentDueDate(
  tenancyStartDate: string,
  rentFrequency: string
): string {
  if (!tenancyStartDate || !rentFrequency) {
    return "";
  }

  // Parse dd/mm/yyyy format directly (timezone-safe)
  const parts = tenancyStartDate.split("/");
  if (parts.length !== 3) {
    return "";
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Validate date parts
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    return "";
  }

  // Create date object using local timezone (month is 0-indexed)
  const startDate = new Date(year, month - 1, day);

  // Validate the start date
  if (isNaN(startDate.getTime())) {
    return "";
  }

  const dueDate = new Date(startDate);

  switch (rentFrequency) {
    case "monthly":
      // Add 1 month
      dueDate.setMonth(dueDate.getMonth() + 1);
      break;
    case "quarterly":
      // Add 3 months
      dueDate.setMonth(dueDate.getMonth() + 3);
      break;
    case "biannually":
      // Add 6 months
      dueDate.setMonth(dueDate.getMonth() + 6);
      break;
    case "annually":
      // Add 1 year
      dueDate.setFullYear(dueDate.getFullYear() + 1);
      break;
    default:
      return "";
  }

  // Subtract 1 day from the calculated date
  dueDate.setDate(dueDate.getDate() - 1);

  // Convert back to display format (dd/mm/yyyy) using local timezone
  const resultDay = dueDate.getDate().toString().padStart(2, "0");
  const resultMonth = (dueDate.getMonth() + 1).toString().padStart(2, "0");
  const resultYear = dueDate.getFullYear();

  return `${resultDay}/${resultMonth}/${resultYear}`;
}
