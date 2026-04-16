"use client";

import React, { useState, useEffect } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

/**
 * Enhanced form field with real-time validation feedback and loading states
 * Requirements: 7.4, 7.5
 */

interface EnhancedFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "password" | "date" | "number";
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showValidationIcon?: boolean;
  validateOnChange?: boolean;
  customValidator?: (value: unknown) => Promise<string | null> | string | null;
  formatValue?: (value: unknown) => string;
  parseValue?: (value: string) => unknown;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  suggestions?: string[];
}

export function EnhancedFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  description,
  required = false,
  disabled = false,
  className,
  showValidationIcon = true,
  validateOnChange = true,
  customValidator,
  formatValue,
  parseValue,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  suggestions = [],
}: EnhancedFormFieldProps<TFieldValues, TName>) {
  const [isValidating, setIsValidating] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Filter suggestions based on input value
  useEffect(() => {
    if (suggestions.length > 0) {
      setFilteredSuggestions(suggestions);
    }
  }, [suggestions]);

  const handleCustomValidation = async (value: unknown) => {
    if (!customValidator || !validateOnChange) return;

    setIsValidating(true);
    setCustomError(null);

    try {
      const result = await customValidator(value);
      setCustomError(result);
    } catch {
      setCustomError("Validation error occurred");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSuggestionFilter = (inputValue: string) => {
    if (!inputValue || suggestions.length === 0) {
      setFilteredSuggestions(suggestions);
      setShowSuggestions(false);
      return;
    }

    const filtered = suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = fieldState.error || customError;
        const isValid = !hasError && field.value && !isValidating;
        const displayValue = formatValue
          ? formatValue(field.value)
          : field.value;

        return (
          <FormItem className={cn("relative", className)}>
            <FormLabel
              className={cn(
                "flex items-center gap-1",
                required && "after:content-['*'] after:text-red-500 after:ml-1"
              )}
            >
              {label}
              {description && (
                <span className="text-xs text-gray-500 font-normal">
                  ({description})
                </span>
              )}
            </FormLabel>

            <div className="relative">
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={type === "password" && showPassword ? "text" : type}
                    placeholder={placeholder}
                    disabled={disabled || isValidating}
                    value={displayValue || ""}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const parsedValue = parseValue
                        ? parseValue(rawValue)
                        : rawValue;

                      field.onChange(parsedValue);

                      // Handle suggestions
                      if (suggestions.length > 0) {
                        handleSuggestionFilter(rawValue);
                      }

                      // Handle custom validation
                      if (validateOnChange) {
                        handleCustomValidation(parsedValue);
                      }
                    }}
                    onBlur={() => {
                      field.onBlur();
                      setShowSuggestions(false);

                      // Validate on blur if not validating on change
                      if (!validateOnChange && customValidator) {
                        handleCustomValidation(field.value);
                      }
                    }}
                    onFocus={() => {
                      if (
                        suggestions.length > 0 &&
                        filteredSuggestions.length > 0
                      ) {
                        setShowSuggestions(true);
                      }
                    }}
                    className={cn(
                      "pr-10",
                      hasError &&
                        "border-red-500 focus:border-red-500 focus:ring-red-500",
                      isValid &&
                        "border-green-500 focus:border-green-500 focus:ring-green-500",
                      isValidating && "border-blue-500"
                    )}
                    maxLength={maxLength}
                    minLength={minLength}
                    pattern={pattern}
                    autoComplete={autoComplete}
                    aria-invalid={hasError ? "true" : "false"}
                    aria-describedby={
                      hasError
                        ? `${name}-error`
                        : description
                        ? `${name}-description`
                        : undefined
                    }
                  />

                  {/* Validation Icons */}
                  {showValidationIcon && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isValidating && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {!isValidating && hasError && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {!isValidating && isValid && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  )}

                  {/* Password Toggle */}
                  {type === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </FormControl>

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => {
                        const parsedValue = parseValue
                          ? parseValue(suggestion)
                          : suggestion;
                        field.onChange(parsedValue);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Character Count */}
            {maxLength && field.value && (
              <div className="text-xs text-gray-500 text-right">
                {field.value.length}/{maxLength}
              </div>
            )}

            {/* Error Messages */}
            <FormMessage id={`${name}-error`} />
            {customError && (
              <p className="text-sm text-red-600 mt-1">{customError}</p>
            )}

            {/* Description */}
            {description && !hasError && (
              <p
                id={`${name}-description`}
                className="text-sm text-gray-500 mt-1"
              >
                {description}
              </p>
            )}
          </FormItem>
        );
      }}
    />
  );
}

/**
 * Enhanced Select Field with better validation feedback
 */
interface EnhancedSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  placeholder?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showValidationIcon?: boolean;
}

export function EnhancedSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  placeholder = "Select an option",
  options,
  description,
  required = false,
  disabled = false,
  className,
  showValidationIcon = true,
}: EnhancedSelectFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = fieldState.error;
        const isValid = !hasError && field.value;

        return (
          <FormItem className={cn("relative", className)}>
            <FormLabel
              className={cn(
                "flex items-center gap-1",
                required && "after:content-['*'] after:text-red-500 after:ml-1"
              )}
            >
              {label}
              {description && (
                <span className="text-xs text-gray-500 font-normal">
                  ({description})
                </span>
              )}
            </FormLabel>

            <div className="relative">
              <FormControl>
                <select
                  {...field}
                  disabled={disabled}
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    hasError &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500",
                    isValid &&
                      "border-green-500 focus:border-green-500 focus:ring-green-500",
                    showValidationIcon && "pr-10"
                  )}
                  aria-invalid={hasError ? "true" : "false"}
                  aria-describedby={
                    hasError
                      ? `${name}-error`
                      : description
                      ? `${name}-description`
                      : undefined
                  }
                >
                  <option value="" disabled>
                    {placeholder}
                  </option>
                  {options.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormControl>

              {/* Validation Icons */}
              {showValidationIcon && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  {hasError && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {isValid && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              )}
            </div>

            {/* Error Messages */}
            <FormMessage id={`${name}-error`} />

            {/* Description */}
            {description && !hasError && (
              <p
                id={`${name}-description`}
                className="text-sm text-gray-500 mt-1"
              >
                {description}
              </p>
            )}
          </FormItem>
        );
      }}
    />
  );
}
