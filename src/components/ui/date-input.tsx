import React, { forwardRef, useState, useEffect } from "react";
import { Input } from "./input";
import {
  formatDateInput,
  isValidDisplayDate,
  formatDateForDatabase,
} from "@/utils/dateFormatUtils";
import { cn } from "@/lib/utils";

export interface DateInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: string; // dd/mm/yyyy format
  onChange?: (value: string) => void; // Returns dd/mm/yyyy format
  onDatabaseValueChange?: (value: string) => void; // Returns yyyy-mm-dd format for database
  error?: boolean;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    { className, value = "", onChange, onDatabaseValueChange, error, ...props },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isValid, setIsValid] = useState(true);

    // Update display value when prop value changes
    useEffect(() => {
      setDisplayValue(value);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formattedValue = formatDateInput(inputValue);

      setDisplayValue(formattedValue);

      // Validate the date as user types
      const valid =
        formattedValue.length < 10 || isValidDisplayDate(formattedValue);
      setIsValid(valid);

      // Call onChange with display format
      onChange?.(formattedValue);

      // If date is complete and valid, also call database format callback
      if (formattedValue.length === 10 && valid) {
        const dbValue = formatDateForDatabase(formattedValue);
        onDatabaseValueChange?.(dbValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value && !isValidDisplayDate(value)) {
        setIsValid(false);
      }
      props.onBlur?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder="DD/MM/YYYY"
        maxLength={10}
        className={cn(
          className,
          (!isValid || error) && "border-red-500 focus:border-red-500"
        )}
      />
    );
  }
);

DateInput.displayName = "DateInput";

export { DateInput };
