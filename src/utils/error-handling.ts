import { toast } from "sonner";

/**
 * Enhanced error handling utilities for frontend KYC operations
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

export interface ApiError {
  response?: {
    status: number;
    data?: {
      message?: string;
      errorCode?: string;
      details?: unknown;
      retryAfter?: number;
    };
  };
  message?: string;
  code?: string;
  name?: string;
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  fallbackMessage?: string;
  onRetry?: () => void;
}

export enum KYCErrorCode {
  // Token validation errors
  INVALID_TOKEN = "INVALID_TOKEN",
  EXPIRED_TOKEN = "EXPIRED_TOKEN",
  TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
  TOKEN_DEACTIVATED = "TOKEN_DEACTIVATED",

  // Property-related errors
  PROPERTY_NOT_FOUND = "PROPERTY_NOT_FOUND",
  PROPERTY_OCCUPIED = "PROPERTY_OCCUPIED",
  PROPERTY_UNAVAILABLE = "PROPERTY_UNAVAILABLE",
  UNAUTHORIZED_PROPERTY_ACCESS = "UNAUTHORIZED_PROPERTY_ACCESS",

  // Application submission errors
  DUPLICATE_APPLICATION = "DUPLICATE_APPLICATION",
  INVALID_APPLICATION_DATA = "INVALID_APPLICATION_DATA",
  APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND",
  APPLICATION_ALREADY_PROCESSED = "APPLICATION_ALREADY_PROCESSED",

  // WhatsApp integration errors
  WHATSAPP_RATE_LIMITED = "WHATSAPP_RATE_LIMITED",
  WHATSAPP_INVALID_PHONE = "WHATSAPP_INVALID_PHONE",
  WHATSAPP_SERVICE_UNAVAILABLE = "WHATSAPP_SERVICE_UNAVAILABLE",
  WHATSAPP_NETWORK_ERROR = "WHATSAPP_NETWORK_ERROR",
  WHATSAPP_AUTH_ERROR = "WHATSAPP_AUTH_ERROR",
  WHATSAPP_UNKNOWN_ERROR = "WHATSAPP_UNKNOWN_ERROR",

  // Tenant attachment errors
  TENANT_ALREADY_ATTACHED = "TENANT_ALREADY_ATTACHED",
  INVALID_TENANCY_DETAILS = "INVALID_TENANCY_DETAILS",
  TENANCY_CREATION_FAILED = "TENANCY_CREATION_FAILED",
  RENT_AMOUNT_TOO_LARGE = "RENT_AMOUNT_TOO_LARGE",

  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
  INVALID_FIELD_FORMAT = "INVALID_FIELD_FORMAT",

  // System errors
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

export const KYC_ERROR_MESSAGES: Record<KYCErrorCode, string> = {
  // Token validation errors
  [KYCErrorCode.INVALID_TOKEN]: "This KYC form link is invalid",
  [KYCErrorCode.EXPIRED_TOKEN]: "This KYC form has expired",
  [KYCErrorCode.TOKEN_NOT_FOUND]: "This KYC form is no longer available",
  [KYCErrorCode.TOKEN_DEACTIVATED]: "This KYC form has been deactivated",

  // Property-related errors
  [KYCErrorCode.PROPERTY_NOT_FOUND]: "Property not found",
  [KYCErrorCode.PROPERTY_OCCUPIED]:
    "Cannot generate link. Property already has an active tenant",
  [KYCErrorCode.PROPERTY_UNAVAILABLE]: "This property is no longer available",
  [KYCErrorCode.UNAUTHORIZED_PROPERTY_ACCESS]:
    "You don't have permission to access this property",

  // Application submission errors
  [KYCErrorCode.DUPLICATE_APPLICATION]:
    "You have already submitted an application for this property",
  [KYCErrorCode.INVALID_APPLICATION_DATA]:
    "Please check your form data and try again",
  [KYCErrorCode.APPLICATION_NOT_FOUND]: "KYC application not found",
  [KYCErrorCode.APPLICATION_ALREADY_PROCESSED]:
    "This application has already been processed",

  // WhatsApp integration errors
  [KYCErrorCode.WHATSAPP_RATE_LIMITED]:
    "Too many messages sent. Please wait before trying again",
  [KYCErrorCode.WHATSAPP_INVALID_PHONE]:
    "Enter a valid phone number to send via WhatsApp",
  [KYCErrorCode.WHATSAPP_SERVICE_UNAVAILABLE]:
    "WhatsApp service is temporarily unavailable. Please try again later",
  [KYCErrorCode.WHATSAPP_NETWORK_ERROR]:
    "Network error occurred. Please check your connection and try again",
  [KYCErrorCode.WHATSAPP_AUTH_ERROR]:
    "WhatsApp service authentication failed. Please contact support",
  [KYCErrorCode.WHATSAPP_UNKNOWN_ERROR]:
    "Failed to send link. Please try again or copy manually",

  // Tenant attachment errors
  [KYCErrorCode.TENANT_ALREADY_ATTACHED]:
    "This applicant has already been attached to a property",
  [KYCErrorCode.INVALID_TENANCY_DETAILS]:
    "Please check all required tenancy fields and try again",
  [KYCErrorCode.TENANCY_CREATION_FAILED]:
    "Failed to create tenancy. Please try again",
  [KYCErrorCode.RENT_AMOUNT_TOO_LARGE]:
    "Rent amount is too large. Please enter a smaller amount (maximum 2,147,483,647)",

  // Validation errors
  [KYCErrorCode.VALIDATION_FAILED]:
    "Please check all required fields and try again",
  [KYCErrorCode.MISSING_REQUIRED_FIELDS]: "Missing required fields",
  [KYCErrorCode.INVALID_FIELD_FORMAT]: "Invalid field format provided",

  // System errors
  [KYCErrorCode.DATABASE_ERROR]: "Database error occurred. Please try again",
  [KYCErrorCode.INTERNAL_SERVER_ERROR]:
    "An unexpected error occurred. Please try again",
  [KYCErrorCode.SERVICE_UNAVAILABLE]:
    "Service is temporarily unavailable. Please try again later",
  [KYCErrorCode.NETWORK_ERROR]:
    "Network error. Please check your connection and try again",
  [KYCErrorCode.TIMEOUT_ERROR]: "Request timed out. Please try again",
};

export class ErrorHandler {
  /**
   * Handle API errors with enhanced error processing
   */
  static handleApiError(
    error: ApiError,
    options: ErrorHandlingOptions = {}
  ): {
    message: string;
    errorCode?: string;
    isRetryable: boolean;
    retryAfter?: number;
    details?: unknown;
  } {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = "An unexpected error occurred",
    } = options;

    if (logError) {
      console.error("API Error:", error);
    }

    // Extract error information
    const status = error.response?.status;
    const errorData = error.response?.data;
    const errorCode = errorData?.errorCode;
    const apiMessage = errorData?.message;
    const retryAfter = errorData?.retryAfter;
    const details = errorData?.details;

    // Determine if error is retryable
    const isRetryable = this.isRetryableError(error);

    // Get user-friendly message
    let message: string;

    // Check for specific database errors first
    if (apiMessage && this.isDatabaseIntegerOverflowError(apiMessage)) {
      message = KYC_ERROR_MESSAGES[KYCErrorCode.RENT_AMOUNT_TOO_LARGE];
    } else if (errorCode && KYC_ERROR_MESSAGES[errorCode as KYCErrorCode]) {
      message = KYC_ERROR_MESSAGES[errorCode as KYCErrorCode];
    } else if (apiMessage) {
      message = this.formatDatabaseErrorMessage(apiMessage);
    } else {
      message = this.getStatusMessage(status) || fallbackMessage;
    }

    // Show toast notification
    if (showToast) {
      this.showErrorToast(message, isRetryable, retryAfter, options.onRetry);
    }

    return {
      message,
      errorCode,
      isRetryable,
      retryAfter,
      details,
    };
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(
    error: ApiError,
    options: ErrorHandlingOptions = {}
  ): {
    message: string;
    isRetryable: boolean;
    suggestion: string;
  } {
    const { showToast = true, logError = true } = options;

    if (logError) {
      console.error("Network Error:", error);
    }

    let message: string;
    let suggestion: string;

    if (!error.response) {
      // Network error (no response received)
      message = "Network error. Please check your connection and try again";
      suggestion = "Check your internet connection and try again";
    } else if (error.code === "ECONNREFUSED") {
      message = "Unable to connect to the server";
      suggestion =
        "The server may be temporarily unavailable. Please try again later";
    } else if (error.code === "ETIMEDOUT") {
      message = "Request timed out. Please try again";
      suggestion =
        "The request took too long. Check your connection and try again";
    } else {
      message = "Connection error occurred";
      suggestion = "Please check your internet connection and try again";
    }

    if (showToast) {
      this.showErrorToast(message, true, 30, options.onRetry);
    }

    return {
      message,
      isRetryable: true,
      suggestion,
    };
  }

  /**
   * Handle validation errors with field-specific messages
   */
  static handleValidationError(
    error: ApiError,
    options: ErrorHandlingOptions = {}
  ): {
    message: string;
    fieldErrors: Record<string, string>;
    details?: unknown;
  } {
    const { showToast = true, logError = true } = options;

    if (logError) {
      console.error("Validation Error:", error);
    }

    const errorData = error.response?.data;
    const details = errorData?.details;
    const fieldErrors: Record<string, string> = {};

    // Process field-specific errors
    if (details && Array.isArray(details)) {
      details.forEach((detail: unknown) => {
        if (
          detail &&
          typeof detail === "object" &&
          "field" in detail &&
          "message" in detail
        ) {
          const typedDetail = detail as { field: string; message: string };
          fieldErrors[typedDetail.field] = typedDetail.message;
        }
      });
    }

    const message =
      errorData?.message || "Please check all required fields and try again";

    if (showToast) {
      toast.error(message);
    }

    return {
      message,
      fieldErrors,
      details,
    };
  }

  /**
   * Show enhanced error toast with retry option
   */
  private static showErrorToast(
    message: string,
    isRetryable: boolean,
    retryAfter?: number,
    onRetry?: () => void
  ) {
    if (isRetryable && onRetry) {
      const retryText = retryAfter ? `Retry in ${retryAfter}s` : "Retry";

      toast.error(message, {
        action: {
          label: retryText,
          onClick: onRetry,
        },
        duration: retryAfter ? retryAfter * 1000 : 5000,
      });
    } else {
      toast.error(message);
    }
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: unknown): boolean {
    const apiError = error as ApiError;
    const status = apiError.response?.status;
    const errorCode = apiError.response?.data?.errorCode;

    // Network errors are retryable
    if (!apiError.response) {
      return true;
    }

    // Retryable HTTP status codes
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    if (status && retryableStatusCodes.includes(status)) {
      return true;
    }

    // Retryable KYC error codes
    const retryableKYCErrors = [
      KYCErrorCode.NETWORK_ERROR,
      KYCErrorCode.SERVICE_UNAVAILABLE,
      KYCErrorCode.TIMEOUT_ERROR,
      KYCErrorCode.DATABASE_ERROR,
      KYCErrorCode.WHATSAPP_SERVICE_UNAVAILABLE,
      KYCErrorCode.WHATSAPP_NETWORK_ERROR,
    ];

    if (errorCode && retryableKYCErrors.includes(errorCode as KYCErrorCode)) {
      return true;
    }

    return false;
  }

  /**
   * Get user-friendly message for HTTP status codes
   */
  private static getStatusMessage(status?: number): string | null {
    if (!status) return null;

    const statusMessages: Record<number, string> = {
      400: "Invalid request. Please check your input",
      401: "Authentication required. Please log in",
      403: "You don't have permission to perform this action",
      404: "The requested resource was not found",
      409: "Conflict occurred. The resource may already exist",
      410: "The requested resource is no longer available",
      422: "Please check all required fields and try again",
      429: "Too many requests. Please wait before trying again",
      500: "Server error occurred. Please try again",
      502: "Service temporarily unavailable. Please try again",
      503: "Service is temporarily unavailable. Please try again later",
      504: "Request timed out. Please try again",
    };

    return statusMessages[status] || null;
  }

  /**
   * Create retry function with exponential backoff
   */
  static createRetryFunction<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): () => Promise<T> {
    return async () => {
      let lastError: unknown;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;

          if (
            !this.isRetryableError(error as ApiError) ||
            attempt === maxRetries
          ) {
            throw error;
          }

          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    };
  }

  /**
   * Check if error message indicates database integer overflow
   */
  private static isDatabaseIntegerOverflowError(message: string): boolean {
    const integerOverflowPatterns = [
      /value ".*" is out of range for type integer/i,
      /integer out of range/i,
      /value too large for integer/i,
      /numeric value out of range/i,
    ];

    return integerOverflowPatterns.some((pattern) => pattern.test(message));
  }

  /**
   * Format database error messages to be more user-friendly
   */
  private static formatDatabaseErrorMessage(message: string): string {
    // Handle integer overflow errors
    if (this.isDatabaseIntegerOverflowError(message)) {
      return KYC_ERROR_MESSAGES[KYCErrorCode.RENT_AMOUNT_TOO_LARGE];
    }

    // Handle other common database errors
    if (message.includes("duplicate key value violates unique constraint")) {
      return "This record already exists. Please check your input.";
    }

    if (message.includes("violates foreign key constraint")) {
      return "Invalid reference data. Please check your selection.";
    }

    if (message.includes("violates not-null constraint")) {
      return "Required field is missing. Please fill in all required fields.";
    }

    if (message.includes("violates check constraint")) {
      return "Invalid data format. Please check your input values.";
    }

    // Return original message if no specific pattern matches
    return message;
  }

  /**
   * Log error for debugging and monitoring
   */
  static logError(error: Error, context?: string) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.group(`🚨 Error${context ? ` in ${context}` : ""}`);
    console.error("Error:", error);
    console.table(errorInfo);
    console.groupEnd();

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
}
