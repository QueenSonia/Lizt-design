/**
 * Error Handling Hook
 * Provides centralized error handling functionality for components
 * Requirements: 7.3, 7.4, 7.5
 */

import { useState, useCallback } from "react";
import {
  ErrorHandler,
  AppError,
  NetworkError,
  ValidationError,
  FileUploadError,
  TimeoutError,
  ServerError,
  TokenError,
  withRetry,
  RetryConfig,
} from "../utils/error-handler";
import { useToastHelpers } from "../components/Toast";

export interface UseErrorHandlingOptions {
  showToasts?: boolean;
  logErrors?: boolean;
  onError?: (error: AppError) => void;
}

export interface ErrorState {
  error: AppError | null;
  isLoading: boolean;
  retryCount: number;
}

export const useErrorHandling = (options: UseErrorHandlingOptions = {}) => {
  const { showToasts = true, onError } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0,
  });

  const toast = useToastHelpers();
  const errorHandler = ErrorHandler.getInstance();

  // Handle error with optional toast notification
  const handleError = useCallback(
    (error: unknown, operation: string = "operation") => {
      const appError = errorHandler.handleError(error, operation);

      setErrorState((prev) => ({
        ...prev,
        error: appError,
        isLoading: false,
      }));

      if (showToasts) {
        const message = errorHandler.getUserMessage(appError);

        switch (appError.type) {
          case "NETWORK_ERROR":
            toast.error("Connection Error", message);
            break;
          case "VALIDATION_ERROR":
            toast.warning("Validation Error", message);
            break;
          case "FILE_UPLOAD_ERROR":
            toast.error("Upload Failed", message);
            break;
          case "TIMEOUT_ERROR":
            toast.warning("Request Timeout", message);
            break;
          case "SERVER_ERROR":
            toast.error("Server Error", message);
            break;
          case "TOKEN_ERROR":
            toast.error("Authentication Error", message);
            break;
          default:
            toast.error("Error", message);
        }
      }

      if (onError) {
        onError(appError);
      }

      return appError;
    },
    [errorHandler, showToasts, toast, onError]
  );

  // Clear error state
  const clearError = useCallback(() => {
    setErrorState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Execute async operation with error handling
  const executeWithErrorHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationName: string = "operation"
    ): Promise<T | null> => {
      try {
        setErrorState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const result = await operation();

        setErrorState((prev) => ({
          ...prev,
          isLoading: false,
        }));

        return result;
      } catch (error) {
        handleError(error, operationName);
        return null;
      }
    },
    [handleError]
  );

  // Execute with retry mechanism
  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      retryConfig: RetryConfig,
      operationName: string = "operation"
    ): Promise<T | null> => {
      try {
        setErrorState((prev) => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        const result = await withRetry(operation, retryConfig)();

        setErrorState((prev) => ({
          ...prev,
          isLoading: false,
        }));

        return result;
      } catch (error) {
        handleError(error, operationName);
        return null;
      }
    },
    [handleError]
  );

  // Retry the last failed operation
  const retry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationName: string = "retry_operation"
    ): Promise<T | null> => {
      setErrorState((prev) => ({
        ...prev,
        retryCount: prev.retryCount + 1,
      }));

      return executeWithErrorHandling(operation, operationName);
    },
    [executeWithErrorHandling]
  );

  // Check if current error is retryable
  const isRetryable = useCallback(() => {
    return errorState.error
      ? errorHandler.isRetryable(errorState.error)
      : false;
  }, [errorState.error, errorHandler]);

  // Get user-friendly error message
  const getErrorMessage = useCallback(() => {
    return errorState.error
      ? errorHandler.getUserMessage(errorState.error)
      : null;
  }, [errorState.error, errorHandler]);

  // Create specific error types
  const createError = {
    network: (message?: string) => new NetworkError(message),
    validation: (message?: string, fields?: Record<string, string>) =>
      new ValidationError(message, fields),
    fileUpload: (message?: string, fileName?: string, fileSize?: number) =>
      new FileUploadError(message, fileName, fileSize),
    timeout: (message?: string) => new TimeoutError(message),
    server: (message?: string, statusCode?: number) =>
      new ServerError(message, statusCode),
    token: (message?: string) => new TokenError(message),
  };

  return {
    // State
    error: errorState.error,
    isLoading: errorState.isLoading,
    retryCount: errorState.retryCount,

    // Actions
    handleError,
    clearError,
    executeWithErrorHandling,
    executeWithRetry,
    retry,

    // Utilities
    isRetryable,
    getErrorMessage,
    createError,

    // Error type checks
    isNetworkError: () => errorState.error?.type === "NETWORK_ERROR",
    isValidationError: () => errorState.error?.type === "VALIDATION_ERROR",
    isFileUploadError: () => errorState.error?.type === "FILE_UPLOAD_ERROR",
    isTimeoutError: () => errorState.error?.type === "TIMEOUT_ERROR",
    isServerError: () => errorState.error?.type === "SERVER_ERROR",
    isTokenError: () => errorState.error?.type === "TOKEN_ERROR",
  };
};

// Specialized hooks for common scenarios

export const useNetworkErrorHandling = () => {
  const errorHandling = useErrorHandling({
    showToasts: true,
    logErrors: true,
  });

  const executeNetworkRequest = useCallback(
    async <T>(
      request: () => Promise<T>,
      operationName: string = "network_request"
    ): Promise<T | null> => {
      return errorHandling.executeWithRetry(
        request,
        {
          maxAttempts: 3,
          delay: 1000,
          backoffMultiplier: 2,
          shouldRetry: (error) =>
            error.message.includes("fetch") ||
            error.message.includes("network") ||
            error.message.includes("timeout"),
        },
        operationName
      );
    },
    [errorHandling]
  );

  return {
    ...errorHandling,
    executeNetworkRequest,
  };
};

export const useFileUploadErrorHandling = () => {
  const errorHandling = useErrorHandling({
    showToasts: true,
    logErrors: true,
  });

  const executeFileUpload = useCallback(
    async <T>(
      upload: () => Promise<T>,
      fileName?: string,
      operationName: string = "file_upload"
    ): Promise<T | null> => {
      return errorHandling.executeWithRetry(
        upload,
        {
          maxAttempts: 2,
          delay: 2000,
          shouldRetry: (error) =>
            !error.message.includes("file too large") &&
            !error.message.includes("invalid file type"),
        },
        operationName
      );
    },
    [errorHandling]
  );

  return {
    ...errorHandling,
    executeFileUpload,
  };
};

export default useErrorHandling;
