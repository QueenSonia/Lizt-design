/* eslint-disable */

import { toast } from "sonner";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export const parseApiError = (error: any): ApiError => {
  // Network errors
  if (error?.code === "NETWORK_ERROR" || error?.code === "ERR_NETWORK") {
    return {
      message:
        "Network connection failed. Please check your internet connection and try again.",
      code: "NETWORK_ERROR",
    };
  }

  // HTTP status errors
  const status = error?.response?.status;
  const responseMessage = error?.response?.data?.message;

  switch (status) {
    case 401:
      return {
        message: "Your session has expired. Please log in again.",
        status,
        code: "UNAUTHORIZED",
      };
    case 403:
      return {
        message: "You don't have permission to perform this action.",
        status,
        code: "FORBIDDEN",
      };
    case 404:
      return {
        message: "The requested resource was not found.",
        status,
        code: "NOT_FOUND",
      };
    case 400:
      return {
        message:
          responseMessage ||
          "Invalid request. Please check your input and try again.",
        status,
        code: "BAD_REQUEST",
      };
    case 422:
      return {
        message:
          responseMessage ||
          "The data provided is invalid. Please check and try again.",
        status,
        code: "VALIDATION_ERROR",
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message:
          "The service is currently experiencing issues. Please try again later.",
        status,
        code: "SERVER_ERROR",
      };
    default:
      return {
        message:
          error?.message || responseMessage || "An unexpected error occurred.",
        status,
        code: "UNKNOWN_ERROR",
      };
  }
};

export const handleApiError = (error: any, context?: string): void => {
  const parsedError = parseApiError(error);

  console.error(`API Error${context ? ` (${context})` : ""}:`, {
    message: parsedError.message,
    status: parsedError.status,
    code: parsedError.code,
    originalError: error,
  });

  // Don't show toast for certain error types that should be handled by UI
  if (parsedError.code === "UNAUTHORIZED") {
    // Let the auth context handle this
    return;
  }

  toast.error(parsedError.message);
};

export const getErrorDisplayInfo = (error: any) => {
  const parsedError = parseApiError(error);

  const isNetworkError = parsedError.code === "NETWORK_ERROR";
  const isPermissionError =
    parsedError.code === "FORBIDDEN" || parsedError.code === "NOT_FOUND";
  const isServerError = parsedError.code === "SERVER_ERROR";
  const isValidationError =
    parsedError.code === "VALIDATION_ERROR" ||
    parsedError.code === "BAD_REQUEST";

  return {
    message: parsedError.message,
    isNetworkError,
    isPermissionError,
    isServerError,
    isValidationError,
    iconColor: isNetworkError
      ? "text-yellow-600"
      : isPermissionError
      ? "text-red-500"
      : isServerError
      ? "text-orange-600"
      : "text-red-500",
    bgColor: isNetworkError
      ? "bg-yellow-100"
      : isPermissionError
      ? "bg-red-100"
      : isServerError
      ? "bg-orange-100"
      : "bg-red-100",
    title: isNetworkError
      ? "Connection Issue"
      : isPermissionError
      ? "Access Denied"
      : isServerError
      ? "Service Unavailable"
      : isValidationError
      ? "Invalid Data"
      : "Error",
  };
};

export const shouldRetryError = (error: any): boolean => {
  const parsedError = parseApiError(error);

  // Don't retry on authentication, permission, or validation errors
  if (
    [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "BAD_REQUEST",
      "VALIDATION_ERROR",
    ].includes(parsedError.code || "")
  ) {
    return false;
  }

  // Retry on network and server errors
  return ["NETWORK_ERROR", "SERVER_ERROR", "UNKNOWN_ERROR"].includes(
    parsedError.code || ""
  );
};

// Enhanced retry utility with exponential backoff and timeout handling
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeoutMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds
  timeoutMs: 30000, // 30 seconds
};

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  context: string,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Wrap operation with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(`Operation timed out after ${finalConfig.timeoutMs}ms`)
          );
        }, finalConfig.timeoutMs);
      });

      const result = await Promise.race([operation(), timeoutPromise]);

      // Log successful retry if this wasn't the first attempt
      if (attempt > 0) {
        console.log(`${context} succeeded on attempt ${attempt + 1}`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Enhanced error logging
      console.error(`${context} failed on attempt ${attempt + 1}:`, {
        error: error instanceof Error ? error.message : String(error),
        attempt: attempt + 1,
        maxRetries: finalConfig.maxRetries,
        willRetry: attempt < finalConfig.maxRetries && shouldRetryError(error),
        timestamp: new Date().toISOString(),
      });

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt >= finalConfig.maxRetries || !shouldRetryError(error)) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = finalConfig.baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * baseDelay; // Add up to 10% jitter
      const delay = Math.min(baseDelay + jitter, finalConfig.maxDelay);

      console.log(
        `Retrying ${context} in ${Math.round(delay)}ms (attempt ${
          attempt + 2
        }/${finalConfig.maxRetries + 1})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Enhanced error display utility with retry options
export interface ErrorDisplayOptions {
  showRetryButton?: boolean;
  onRetry?: () => void;
  retryText?: string;
  showDetails?: boolean;
}

export const getEnhancedErrorDisplay = (
  error: any,
  options: ErrorDisplayOptions = {}
) => {
  const parsedError = parseApiError(error);
  const baseInfo = getErrorDisplayInfo(error);

  const canRetry = shouldRetryError(error);
  const showRetry = options.showRetryButton && canRetry && options.onRetry;

  return {
    ...baseInfo,
    canRetry,
    showRetry,
    retryText: options.retryText || "Try Again",
    onRetry: options.onRetry,
    showDetails: options.showDetails || false,
    errorCode: parsedError.code,
    originalError: options.showDetails ? error : undefined,
  };
};

// Network connectivity checker with enhanced reliability
export const checkNetworkConnectivity = async (): Promise<{
  isOnline: boolean;
  latency?: number;
  connectionType?: string;
}> => {
  const startTime = Date.now();

  try {
    // First try our own API health endpoint
    const response = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-cache",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        isOnline: true,
        latency,
        connectionType: "api",
      };
    }
  } catch (apiError) {
    console.log("API health check failed, trying fallback:", apiError);
  }

  try {
    // Fallback: try to reach a reliable external service
    const fallbackStartTime = Date.now();
    await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-cache",
      signal: AbortSignal.timeout(5000),
    });

    const fallbackLatency = Date.now() - fallbackStartTime;

    return {
      isOnline: true,
      latency: fallbackLatency,
      connectionType: "external",
    };
  } catch (fallbackError) {
    console.log("Fallback connectivity check failed:", fallbackError);

    // Check if navigator.onLine is available (browser support)
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      return {
        isOnline: navigator.onLine,
        connectionType: "navigator",
      };
    }

    return {
      isOnline: false,
      connectionType: "unknown",
    };
  }
};

// Enhanced error handler with comprehensive network checking and retry options
export const handleApiErrorWithRetry = async (
  error: any,
  context: string,
  options: {
    showToast?: boolean;
    checkNetwork?: boolean;
    onRetry?: () => Promise<void>;
    maxRetries?: number;
    retryDelay?: number;
    customErrorMessages?: Record<string, string>;
  } = {}
): Promise<void> => {
  const {
    showToast = true,
    checkNetwork = true,
    onRetry,
    maxRetries = 3,
    retryDelay = 2000,
    customErrorMessages = {},
  } = options;

  const parsedError = parseApiError(error);

  // Enhanced error logging with more context
  console.error(`Enhanced API Error (${context}):`, {
    message: parsedError.message,
    status: parsedError.status,
    code: parsedError.code,
    context,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    url: typeof window !== "undefined" ? window.location.href : "Unknown",
    connectionInfo:
      typeof navigator !== "undefined" && "connection" in navigator
        ? {
            effectiveType: (navigator as any).connection?.effectiveType,
            downlink: (navigator as any).connection?.downlink,
            rtt: (navigator as any).connection?.rtt,
          }
        : undefined,
    originalError: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      response: error?.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data,
          }
        : undefined,
    },
  });

  // Check network connectivity for network-related errors
  if (
    checkNetwork &&
    (parsedError.code === "NETWORK_ERROR" || parsedError.code === "TIMEOUT")
  ) {
    const connectivityResult = await checkNetworkConnectivity();

    if (!connectivityResult.isOnline) {
      if (showToast) {
        toast.error(
          "No internet connection detected. Please check your network and try again.",
          {
            description:
              "Make sure you're connected to the internet and your network is stable.",
            action: onRetry
              ? {
                  label: "Retry",
                  onClick: onRetry,
                }
              : undefined,
            duration: 8000,
          }
        );
      }
      return;
    } else if (
      connectivityResult.latency &&
      connectivityResult.latency > 5000
    ) {
      // Slow connection detected
      if (showToast) {
        toast.warning(
          "Slow internet connection detected. Operations may take longer than usual.",
          {
            description: `Connection latency: ${connectivityResult.latency}ms`,
            duration: 5000,
          }
        );
      }
    }
  }

  // Handle timeout errors specifically
  if (parsedError.code === "TIMEOUT" || error?.code === "ECONNABORTED") {
    if (showToast) {
      const timeoutMessage =
        customErrorMessages.timeout ||
        "The request timed out. This might be due to a slow connection or server issues.";

      toast.error(timeoutMessage, {
        description:
          "Please try again. If the problem persists, check your internet connection.",
        action: onRetry
          ? {
              label: "Retry",
              onClick: onRetry,
            }
          : undefined,
        duration: 8000,
      });
    }
    return;
  }

  // Handle rate limiting
  if (parsedError.code === "RATE_LIMITED" || parsedError.status === 429) {
    const retryAfter = error?.retryAfter
      ? parseInt(error.retryAfter) * 1000
      : retryDelay;

    if (showToast) {
      toast.error(
        customErrorMessages.rateLimited ||
          "Too many requests. Please wait a moment before trying again.",
        {
          description: `Please wait ${Math.ceil(
            retryAfter / 1000
          )} seconds before retrying.`,
          action: onRetry
            ? {
                label: `Retry in ${Math.ceil(retryAfter / 1000)}s`,
                onClick: () => {
                  setTimeout(onRetry, retryAfter);
                },
              }
            : undefined,
          duration: retryAfter + 2000,
        }
      );
    }
    return;
  }

  // Handle server errors with enhanced messaging
  if (
    parsedError.code === "SERVER_ERROR" ||
    (parsedError.status && parsedError.status >= 500)
  ) {
    if (showToast) {
      const serverErrorMessage =
        customErrorMessages.serverError ||
        "The server is experiencing issues. Please try again in a few moments.";

      toast.error(serverErrorMessage, {
        description: "If the problem continues, please contact support.",
        action:
          onRetry && shouldRetryError(error)
            ? {
                label: "Retry",
                onClick: onRetry,
              }
            : undefined,
        duration: 8000,
      });
    }
    return;
  }

  // Handle validation and client errors
  if (
    parsedError.code === "VALIDATION_ERROR" ||
    parsedError.code === "BAD_REQUEST"
  ) {
    if (showToast) {
      const validationMessage =
        customErrorMessages.validation || parsedError.message;

      toast.error(validationMessage, {
        description: "Please check your input and try again.",
        duration: 6000,
      });
    }
    return;
  }

  // Handle authentication errors
  if (parsedError.code === "UNAUTHORIZED") {
    if (showToast) {
      toast.error(
        customErrorMessages.unauthorized ||
          "Your session has expired. Please log in again.",
        {
          description: "You will be redirected to the login page.",
          duration: 5000,
        }
      );
    }

    // Redirect to login after a short delay
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }, 2000);
    return;
  }

  // Handle permission errors
  if (parsedError.code === "FORBIDDEN") {
    if (showToast) {
      toast.error(
        customErrorMessages.forbidden ||
          "You don't have permission to perform this action.",
        {
          description:
            "Please contact your administrator if you believe this is an error.",
          duration: 6000,
        }
      );
    }
    return;
  }

  // Show appropriate error message with retry option for other errors
  if (showToast) {
    const canRetry = shouldRetryError(error) && onRetry;
    const errorMessage = customErrorMessages.general || parsedError.message;

    toast.error(errorMessage, {
      description: canRetry
        ? "You can try again or contact support if the problem persists."
        : undefined,
      action: canRetry
        ? {
            label: "Retry",
            onClick: onRetry,
          }
        : undefined,
      duration: canRetry ? 10000 : 6000, // Longer duration if retry is available
    });
  }
};
