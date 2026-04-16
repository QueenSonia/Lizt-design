/**
 * Error Handler Utility
 * Centralized error handling and retry mechanisms
 * Requirements: 7.3, 7.4, 7.5
 */

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
}

export interface ErrorContext {
  operation: string;
  timestamp: Date;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
}

export class AppError extends Error {
  public readonly type: string;
  public readonly code?: string;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: string = "UNKNOWN_ERROR",
    code?: string,
    context?: ErrorContext,
    retryable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.code = code;
    this.context = context;
    this.retryable = retryable;
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string = "Network connection failed",
    context?: ErrorContext
  ) {
    super(message, "NETWORK_ERROR", "NETWORK_FAILED", context, true);
  }
}

export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(
    message: string = "Validation failed",
    fields: Record<string, string> = {},
    context?: ErrorContext
  ) {
    super(message, "VALIDATION_ERROR", "VALIDATION_FAILED", context, false);
    this.fields = fields;
  }
}

export class FileUploadError extends AppError {
  public readonly fileName?: string;
  public readonly fileSize?: number;

  constructor(
    message: string = "File upload failed",
    fileName?: string,
    fileSize?: number,
    context?: ErrorContext
  ) {
    super(message, "FILE_UPLOAD_ERROR", "UPLOAD_FAILED", context, true);
    this.fileName = fileName;
    this.fileSize = fileSize;
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = "Request timeout", context?: ErrorContext) {
    super(message, "TIMEOUT_ERROR", "REQUEST_TIMEOUT", context, true);
  }
}

export class ServerError extends AppError {
  public readonly statusCode?: number;

  constructor(
    message: string = "Server error",
    statusCode?: number,
    context?: ErrorContext
  ) {
    super(message, "SERVER_ERROR", "SERVER_FAILED", context, true);
    this.statusCode = statusCode;
  }
}

export class TokenError extends AppError {
  constructor(
    message: string = "Invalid or expired token",
    context?: ErrorContext
  ) {
    super(message, "TOKEN_ERROR", "TOKEN_INVALID", context, false);
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and classify errors
   */
  handleError(error: unknown, operation: string = "unknown"): AppError {
    const context: ErrorContext = {
      operation,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      // Classify common error types
      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        appError = new NetworkError(error.message, context);
      } else if (error.message.includes("timeout")) {
        appError = new TimeoutError(error.message, context);
      } else {
        appError = new AppError(
          error.message,
          "UNKNOWN_ERROR",
          undefined,
          context,
          false
        );
      }
    } else {
      appError = new AppError(
        "An unknown error occurred",
        "UNKNOWN_ERROR",
        undefined,
        context,
        false
      );
    }

    // Log the error
    this.logError(appError);

    return appError;
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = { maxAttempts: 3, delay: 1000 }
  ): Promise<T> {
    let lastError: Error;
    let delay = config.delay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry this error
        if (config.shouldRetry && !config.shouldRetry(lastError)) {
          throw this.handleError(lastError, "retry_operation");
        }

        // Don't wait after the last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Apply backoff multiplier
        if (config.backoffMultiplier) {
          delay *= config.backoffMultiplier;
        }
      }
    }

    throw this.handleError(lastError!, "retry_operation");
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.retryable;
    }

    if (error instanceof Error) {
      // Network errors are generally retryable
      if (
        error.message.includes("fetch") ||
        error.message.includes("network")
      ) {
        return true;
      }
      // Timeout errors are retryable
      if (error.message.includes("timeout")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: unknown): string {
    if (error instanceof AppError) {
      switch (error.type) {
        case "NETWORK_ERROR":
          return "Unable to connect to the server. Please check your internet connection.";
        case "VALIDATION_ERROR":
          return "Please fix the validation errors and try again.";
        case "FILE_UPLOAD_ERROR":
          return "File upload failed. Please try again.";
        case "TIMEOUT_ERROR":
          return "The request took too long. Please try again.";
        case "SERVER_ERROR":
          return "We're experiencing technical difficulties. Please try again later.";
        case "TOKEN_ERROR":
          return "Your session has expired. Please refresh the page.";
        default:
          return error.message || "An unexpected error occurred.";
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred.";
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(error: AppError): void {
    // Add to in-memory log
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorHandler:", error);
    }

    // In production, you might want to send to monitoring service
    // this.sendToMonitoring(error);
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(count: number = 10): AppError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Utility functions for common error scenarios

export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string = "operation"
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ErrorHandler.getInstance().handleError(error, operation);
    }
  };
};

export const withRetry = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  config?: RetryConfig
) => {
  return (...args: T): Promise<R> => {
    return ErrorHandler.getInstance().retry(() => fn(...args), config);
  };
};

// Default retry configurations
export const RETRY_CONFIGS = {
  network: {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error: Error) =>
      error.message.includes("fetch") || error.message.includes("network"),
  },
  fileUpload: {
    maxAttempts: 2,
    delay: 2000,
    shouldRetry: (error: Error) =>
      !error.message.includes("file too large") &&
      !error.message.includes("invalid file type"),
  },
  api: {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 1.5,
    shouldRetry: (error: Error) => {
      // Only retry on network errors and 5xx server errors
      // Do NOT retry on 4xx client errors (400, 401, 403, 404, etc.)
      return (
        (error.message.includes("fetch") ||
          error.message.includes("network") ||
          error.message.includes("500") ||
          error.message.includes("502") ||
          error.message.includes("503") ||
          error.message.includes("504")) &&
        // Explicitly exclude 4xx errors
        !(
          error.message.includes("400") ||
          error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("404") ||
          error.message.includes("409") ||
          error.message.includes("422")
        )
      );
    },
  },
} as const;

export default ErrorHandler;
