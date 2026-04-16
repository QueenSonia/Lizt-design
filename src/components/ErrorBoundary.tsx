"use client";
import React from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    errorInfo?: React.ErrorInfo;
    reset: () => void;
    retryCount: number;
  }>;
  maxRetries?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

/**
 * Enhanced Error Boundary with retry mechanism and detailed error reporting
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    this.logErrorDetails(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logErrorDetails(error: Error, errorInfo: React.ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
    };

    // In production, you might want to send this to an error reporting service
    console.group("🚨 Error Boundary Details");
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.table(errorDetails);
    console.groupEnd();
  }

  private handleReset = () => {
    const { maxRetries = 3 } = this.props;
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount <= maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: newRetryCount,
      });
    } else {
      // Max retries reached, show permanent error state
      console.warn(`Max retries (${maxRetries}) reached for error boundary`);
    }
  };

  private handleAutoRetry = () => {
    // Auto-retry after 5 seconds for certain types of errors
    this.retryTimeoutId = setTimeout(() => {
      if (this.isRetryableError(this.state.error)) {
        this.handleReset();
      }
    }, 5000);
  };

  private isRetryableError(error?: Error): boolean {
    if (!error) return false;

    const retryablePatterns = [
      "network",
      "fetch",
      "timeout",
      "connection",
      "unavailable",
      "ChunkLoadError",
      "Loading chunk",
    ];

    return retryablePatterns.some((pattern) =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          reset={this.handleReset}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  errorInfo,
  reset,
  retryCount,
}: {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  reset: () => void;
  retryCount: number;
}) {
  const [showDetails, setShowDetails] = React.useState(false);
  const maxRetries = 3;
  const canRetry = retryCount < maxRetries;

  const getErrorType = (error?: Error): string => {
    if (!error) return "Unknown Error";

    if (
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk")
    ) {
      return "Resource Loading Error";
    }
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return "Network Error";
    }
    if (error.message.includes("timeout")) {
      return "Timeout Error";
    }
    return "Application Error";
  };

  const getErrorMessage = (error?: Error): string => {
    if (!error) return "An unexpected error occurred";

    const errorType = getErrorType(error);

    switch (errorType) {
      case "Resource Loading Error":
        return "Failed to load application resources. This might be due to a network issue or an app update.";
      case "Network Error":
        return "Network connection issue. Please check your internet connection.";
      case "Timeout Error":
        return "The operation took too long to complete. Please try again.";
      default:
        return error.message || "An unexpected error occurred";
    }
  };

  const getErrorSuggestion = (error?: Error): string => {
    const errorType = getErrorType(error);

    switch (errorType) {
      case "Resource Loading Error":
        return "Try refreshing the page or clearing your browser cache.";
      case "Network Error":
        return "Check your internet connection and try again.";
      case "Timeout Error":
        return "Wait a moment and try the operation again.";
      default:
        return "If the problem persists, please contact support.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
        {/* Error Icon and Title */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {getErrorType(error)}
          </h2>
          <p className="text-slate-600 mb-4">{getErrorMessage(error)}</p>
          <p className="text-sm text-slate-500">{getErrorSuggestion(error)}</p>
        </div>

        {/* Retry Information */}
        {retryCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              Retry attempt {retryCount} of {maxRetries}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {canRetry ? (
            <button
              onClick={reset}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          )}

          <button
            onClick={() => (window.location.href = "/")}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>

        {/* Error Details Toggle */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <Bug className="w-4 h-4" />
            {showDetails ? "Hide" : "Show"} Error Details
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-slate-100 rounded-md">
              <div className="text-xs font-mono text-slate-700 space-y-2">
                <div>
                  <strong>Error:</strong> {error?.message || "Unknown error"}
                </div>
                {error?.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-all">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-all">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
                <div>
                  <strong>Timestamp:</strong> {new Date().toISOString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
