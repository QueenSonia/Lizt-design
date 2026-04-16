export const formatDate = (dateString: Date) => {
  const date = new Date(dateString);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

export const formatNumberWithCommas = (num: number): string => {
  return num.toLocaleString("en-US");
};

// Utility function to parse formatted number string back to number
export const parseFormattedNumber = (formattedValue: string): string => {
  return formattedValue.replace(/,/g, "");
};

// Currency formatting utilities for tenancy operations
export const formatCurrency = (
  amount: number | null,
  currency: string = "₦"
): string => {
  if (amount === null || amount === undefined) return "——";
  return `${currency}${formatNumberWithCommas(amount)}`;
};

// Parse currency string back to number
export const parseCurrency = (currencyString: string): number => {
  const numericString = currencyString.replace(/[₦,$\s]/g, "");
  const parsed = parseFloat(parseFormattedNumber(numericString));
  return isNaN(parsed) ? 0 : parsed;
};

// Date formatting helpers for tenancy dates
export const formatTenancyDate = (dateString: string | null): string => {
  if (!dateString) return "——";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Format date for form inputs (YYYY-MM-DD)
export const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

// Validate date range for tenancy operations
export const validateDateRange = (
  startDate: string,
  endDate: string
): { isValid: boolean; error?: string } => {
  if (!startDate || !endDate) {
    return { isValid: false, error: "Both start and end dates are required" };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: "Invalid date format" };
  }

  if (end <= start) {
    return { isValid: false, error: "End date must be after start date" };
  }

  return { isValid: true };
};

// Validate rent amount for tenancy operations
export const validateRentAmount = (
  amount: string | number
): { isValid: boolean; error?: string } => {
  const numericAmount =
    typeof amount === "string" ? parseCurrency(amount) : amount;

  if (
    isNaN(numericAmount) ||
    numericAmount === null ||
    numericAmount === undefined
  ) {
    return { isValid: false, error: "Rent amount must be a valid number" };
  }

  if (numericAmount <= 0) {
    return { isValid: false, error: "Rent amount must be a positive value" };
  }

  return { isValid: true };
};

export function toSentenceCase(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
