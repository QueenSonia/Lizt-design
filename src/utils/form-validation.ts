import { z } from "zod";

/**
 * Enhanced form validation utilities with user-friendly error messages
 * Requirements: 7.4, 7.5
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
}

export interface FieldValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: unknown) => string | null;
}

export class FormValidationUtil {
  /**
   * Enhanced phone number validation with detailed error messages
   */
  static validatePhoneNumber(phoneNumber: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!phoneNumber || typeof phoneNumber !== "string") {
      errors.phoneNumber = "Phone number is required";
      return { isValid: false, errors, firstError: errors.phoneNumber };
    }

    const trimmedPhone = phoneNumber.trim();

    if (trimmedPhone === "") {
      errors.phoneNumber = "Phone number cannot be empty";
      return { isValid: false, errors, firstError: errors.phoneNumber };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = trimmedPhone.replace(/\D/g, "");

    // Check minimum length
    if (digitsOnly.length < 10) {
      errors.phoneNumber = "Phone number must contain at least 10 digits";
      return { isValid: false, errors, firstError: errors.phoneNumber };
    }

    // Check maximum length (E.164 standard)
    if (digitsOnly.length > 15) {
      errors.phoneNumber = "Phone number is too long (maximum 15 digits)";
      return { isValid: false, errors, firstError: errors.phoneNumber };
    }

    // Check for valid patterns
    const validPatterns = [
      /^\+\d{1,3}\s?\d{3,14}$/, // International format with +
      /^\d{10,15}$/, // Digits only
      /^\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}$/, // Common formatting
      /^\(\d{3,4}\)\s?\d{3,4}[\s-]?\d{3,4}$/, // With parentheses
    ];

    const hasValidPattern = validPatterns.some((pattern) =>
      pattern.test(trimmedPhone)
    );

    if (!hasValidPattern) {
      errors.phoneNumber =
        "Please enter a valid phone number format (e.g., +234 803 123 4567)";
      return { isValid: false, errors, firstError: errors.phoneNumber };
    }

    // Additional validation for Nigerian numbers
    if (trimmedPhone.startsWith("+234") || trimmedPhone.startsWith("234")) {
      const nigerianNumber = trimmedPhone
        .replace(/^\+?234/, "")
        .replace(/\D/g, "");
      if (nigerianNumber.length !== 10) {
        errors.phoneNumber =
          "Nigerian phone number should have 10 digits after country code (+234)";
        return { isValid: false, errors, firstError: errors.phoneNumber };
      }

      // Check for valid Nigerian mobile prefixes
      const validPrefixes = ["70", "80", "81", "90", "91", "70"];
      const prefix = nigerianNumber.substring(0, 2);
      if (!validPrefixes.includes(prefix)) {
        errors.phoneNumber = "Please enter a valid Nigerian mobile number";
        return { isValid: false, errors, firstError: errors.phoneNumber };
      }
    }

    return { isValid: true, errors };
  }

  /**
   * Enhanced email validation
   */
  static validateEmail(email: string): ValidationResult {
    const errors: Record<string, string> = {};

    if (!email || typeof email !== "string") {
      errors.email = "Email address is required";
      return { isValid: false, errors, firstError: errors.email };
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail === "") {
      errors.email = "Email address cannot be empty";
      return { isValid: false, errors, firstError: errors.email };
    }

    // Enhanced email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmedEmail)) {
      errors.email =
        "Please enter a valid email address (e.g., user@example.com)";
      return { isValid: false, errors, firstError: errors.email };
    }

    // Check email length
    if (trimmedEmail.length > 254) {
      errors.email = "Email address is too long (maximum 254 characters)";
      return { isValid: false, errors, firstError: errors.email };
    }

    // Check for common typos in domain
    const commonDomainTypos = [
      { typo: "@gmail.co", correct: "@gmail.com" },
      { typo: "@yahoo.co", correct: "@yahoo.com" },
      { typo: "@hotmail.co", correct: "@hotmail.com" },
      { typo: "@outlook.co", correct: "@outlook.com" },
    ];

    const domainTypo = commonDomainTypos.find(({ typo }) =>
      trimmedEmail.toLowerCase().includes(typo)
    );

    if (domainTypo) {
      errors.email = `Did you mean ${trimmedEmail.replace(
        domainTypo.typo,
        domainTypo.correct
      )}?`;
      return { isValid: false, errors, firstError: errors.email };
    }

    return { isValid: true, errors };
  }

  /**
   * Validate required string field with enhanced options
   */
  static validateRequiredString(
    value: unknown,
    fieldName: string,
    options: FieldValidationOptions = {}
  ): ValidationResult {
    const {
      required = true,
      minLength = 1,
      maxLength = 255,
      pattern,
      customValidator,
    } = options;

    const errors: Record<string, string> = {};

    // Check if value exists
    if (!value || typeof value !== "string") {
      if (required) {
        errors[fieldName] = `${this.formatFieldName(fieldName)} is required`;
        return { isValid: false, errors, firstError: errors[fieldName] };
      }
      return { isValid: true, errors };
    }

    const trimmedValue = value.trim();

    // Check if empty
    if (trimmedValue === "") {
      if (required) {
        errors[fieldName] = `${this.formatFieldName(
          fieldName
        )} cannot be empty`;
        return { isValid: false, errors, firstError: errors[fieldName] };
      }
      return { isValid: true, errors };
    }

    // Check minimum length
    if (trimmedValue.length < minLength) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be at least ${minLength} character${
        minLength > 1 ? "s" : ""
      } long`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Check maximum length
    if (trimmedValue.length > maxLength) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be no more than ${maxLength} character${
        maxLength > 1 ? "s" : ""
      } long`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Check pattern
    if (pattern && !pattern.test(trimmedValue)) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} format is invalid`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Custom validation
    if (customValidator) {
      const customError = customValidator(trimmedValue);
      if (customError) {
        errors[fieldName] = customError;
        return { isValid: false, errors, firstError: errors[fieldName] };
      }
    }

    return { isValid: true, errors };
  }

  /**
   * Validate date field
   */
  static validateDate(
    value: unknown,
    fieldName: string,
    required: boolean = true,
    minDate?: Date,
    maxDate?: Date
  ): ValidationResult {
    const errors: Record<string, string> = {};

    if (!value) {
      if (required) {
        errors[fieldName] = `${this.formatFieldName(fieldName)} is required`;
        return { isValid: false, errors, firstError: errors[fieldName] };
      }
      return { isValid: true, errors };
    }

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string") {
      date = new Date(value);
    } else {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be a valid date`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    if (isNaN(date.getTime())) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be a valid date`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Check minimum date
    if (minDate && date < minDate) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} cannot be earlier than ${minDate.toLocaleDateString()}`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Check maximum date
    if (maxDate && date > maxDate) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} cannot be later than ${maxDate.toLocaleDateString()}`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    return { isValid: true, errors };
  }

  /**
   * Validate age from date of birth
   */
  static validateAge(
    dateOfBirth: unknown,
    fieldName: string = "dateOfBirth",
    minAge: number = 18,
    maxAge: number = 100
  ): ValidationResult {
    const errors: Record<string, string> = {};

    // First validate the date
    const dateValidation = this.validateDate(dateOfBirth, fieldName, true);
    if (!dateValidation.isValid) {
      return dateValidation;
    }

    const birthDate = new Date(dateOfBirth as string);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    const actualAge =
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;

    if (actualAge < minAge) {
      errors[fieldName] = `You must be at least ${minAge} years old`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    if (actualAge > maxAge) {
      errors[fieldName] = `Age cannot exceed ${maxAge} years`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    return { isValid: true, errors };
  }

  /**
   * Validate numeric field
   */
  static validateNumber(
    value: unknown,
    fieldName: string,
    required: boolean = true,
    min?: number,
    max?: number,
    allowDecimals: boolean = true
  ): ValidationResult {
    const errors: Record<string, string> = {};

    if (value === null || value === undefined || value === "") {
      if (required) {
        errors[fieldName] = `${this.formatFieldName(fieldName)} is required`;
        return { isValid: false, errors, firstError: errors[fieldName] };
      }
      return { isValid: true, errors };
    }

    const numValue = Number(value);

    if (isNaN(numValue)) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be a valid number`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Check for decimals if not allowed
    if (!allowDecimals && numValue % 1 !== 0) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be a whole number`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Check minimum value
    if (min !== undefined && numValue < min) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be at least ${min}`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Check maximum value
    if (max !== undefined && numValue > max) {
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be no more than ${max}`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    return { isValid: true, errors };
  }

  /**
   * Validate enum/select field
   */
  static validateEnum<T>(
    value: unknown,
    fieldName: string,
    validValues: T[],
    required: boolean = true
  ): ValidationResult {
    const errors: Record<string, string> = {};

    if (!value) {
      if (required) {
        errors[fieldName] = `${this.formatFieldName(fieldName)} is required`;
        return { isValid: false, errors, firstError: errors[fieldName] };
      }
      return { isValid: true, errors };
    }

    if (!validValues.includes(value as T)) {
      const valuesList = validValues.map((v) => `"${v}"`).join(", ");
      errors[fieldName] = `${this.formatFieldName(
        fieldName
      )} must be one of: ${valuesList}`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    return { isValid: true, errors };
  }

  /**
   * Validate rent amount with currency formatting
   */
  static validateRentAmount(
    value: unknown,
    fieldName: string = "rentAmount",
    minAmount: number = 1000,
    maxAmount: number = 10000000
  ): ValidationResult {
    const errors: Record<string, string> = {};

    // First validate as number
    const numberValidation = this.validateNumber(
      value,
      fieldName,
      true,
      minAmount,
      maxAmount,
      true
    );
    if (!numberValidation.isValid) {
      return numberValidation;
    }

    const numValue = Number(value);

    // Additional rent-specific validations
    if (numValue < minAmount) {
      errors[
        fieldName
      ] = `Rent amount must be at least ₦${minAmount.toLocaleString()}`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    if (numValue > maxAmount) {
      errors[
        fieldName
      ] = `Rent amount cannot exceed ₦${maxAmount.toLocaleString()}`;
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    // Check for reasonable rent amounts (not too many decimal places)
    const decimalPlaces = (numValue.toString().split(".")[1] || "").length;
    if (decimalPlaces > 2) {
      errors[fieldName] =
        "Rent amount should not have more than 2 decimal places";
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    return { isValid: true, errors };
  }

  /**
   * Validate rent due date (1-31)
   */
  static validateRentDueDate(
    value: unknown,
    fieldName: string = "rentDueDate"
  ): ValidationResult {
    const errors: Record<string, string> = {};

    const numberValidation = this.validateNumber(
      value,
      fieldName,
      true,
      1,
      31,
      false
    );
    if (!numberValidation.isValid) {
      return numberValidation;
    }

    const dayValue = Number(value);

    // Additional validation for valid calendar days
    if (dayValue < 1 || dayValue > 31) {
      errors[fieldName] = "Rent due date must be between 1 and 31";
      return { isValid: false, errors, firstError: errors[fieldName] };
    }

    return { isValid: true, errors };
  }

  /**
   * Combine multiple validation results
   */
  static combineValidationResults(
    ...results: ValidationResult[]
  ): ValidationResult {
    const allErrors: Record<string, string> = {};
    let firstError: string | undefined;

    results.forEach((result) => {
      Object.assign(allErrors, result.errors);
      if (!firstError && result.firstError) {
        firstError = result.firstError;
      }
    });

    return {
      isValid: Object.keys(allErrors).length === 0,
      errors: allErrors,
      firstError,
    };
  }

  /**
   * Format field name for user-friendly error messages
   */
  private static formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Create Zod schema with enhanced error messages
   */
  static createKYCFormSchema() {
    return z.object({
      firstName: z
        .string()
        .min(1, "First name is required")
        .min(2, "First name must be at least 2 characters long")
        .max(50, "First name must be no more than 50 characters long")
        .regex(
          /^[a-zA-Z\s'-]+$/,
          "First name can only contain letters, spaces, hyphens, and apostrophes"
        ),

      lastName: z
        .string()
        .min(1, "Last name is required")
        .min(2, "Last name must be at least 2 characters long")
        .max(50, "Last name must be no more than 50 characters long")
        .regex(
          /^[a-zA-Z\s'-]+$/,
          "Last name can only contain letters, spaces, hyphens, and apostrophes"
        ),

      email: z
        .string()
        .min(1, "Email address is required")
        .email("Please enter a valid email address")
        .max(254, "Email address is too long"),

      phoneNumber: z
        .string()
        .min(1, "Phone number is required")
        .regex(
          /^[\+]?[\d\s\-\(\)]{10,15}$/,
          "Please enter a valid phone number"
        ),

      dateOfBirth: z
        .string()
        .min(1, "Date of birth is required")
        .refine((date) => {
          const birthDate = new Date(date);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          return age >= 18 && age <= 100;
        }, "You must be between 18 and 100 years old"),

      monthlyNetIncome: z
        .string()
        .min(1, "Monthly income is required")
        .refine((value) => {
          const num = Number(value);
          return !isNaN(num) && num >= 0 && num <= 100000000;
        }, "Please enter a valid monthly income amount"),
    });
  }
}
