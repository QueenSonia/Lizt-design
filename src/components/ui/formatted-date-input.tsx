import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormattedDateInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: string; // YYYY-MM-DD format
  onChange?: (value: string) => void; // Returns YYYY-MM-DD format
}

/**
 * Date input component that displays dates in DD/MM/YY format
 * but stores and returns dates in YYYY-MM-DD format for backend compatibility
 */
const FormattedDateInput = React.forwardRef<
  HTMLInputElement,
  FormattedDateInputProps
>(({ className, value, onChange, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState("");

  // Convert YYYY-MM-DD to DD/MM/YY for display
  const formatForDisplay = (isoDate: string): string => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    if (!year || !month || !day) return "";
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
  };

  // Convert DD/MM/YY to YYYY-MM-DD for storage
  const formatForStorage = (displayDate: string): string => {
    if (!displayDate) return "";
    const parts = displayDate.split("/");
    if (parts.length !== 3) return "";

    const [day, month, year] = parts;
    // Handle 2-digit year (assume 20xx for years 00-99)
    const fullYear = year.length === 2 ? `20${year}` : year;

    return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  // Update display value when prop value changes
  React.useEffect(() => {
    if (value) {
      setDisplayValue(formatForDisplay(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Allow only numbers and slashes
    const cleaned = input.replace(/[^\d/]/g, "");

    // Auto-format as user types
    let formatted = cleaned;
    if (cleaned.length >= 2 && !cleaned.includes("/")) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }
    if (cleaned.length >= 5 && cleaned.split("/").length === 2) {
      const parts = cleaned.split("/");
      formatted =
        parts[0] + "/" + parts[1].slice(0, 2) + "/" + parts[1].slice(2);
    }

    // Limit to DD/MM/YY format (8 characters including slashes)
    if (formatted.length <= 8) {
      setDisplayValue(formatted);

      // Only call onChange if we have a complete date
      if (formatted.length === 8) {
        const isoDate = formatForStorage(formatted);
        if (onChange && isoDate) {
          onChange(isoDate);
        }
      }
    }
  };

  const handleBlur = () => {
    // Validate and reformat on blur
    if (displayValue.length === 8) {
      const isoDate = formatForStorage(displayValue);
      if (onChange && isoDate) {
        onChange(isoDate);
      }
    }
  };

  return (
    <input
      type="text"
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="DD/MM/YY"
      maxLength={8}
      {...props}
    />
  );
});
FormattedDateInput.displayName = "FormattedDateInput";

export { FormattedDateInput };
