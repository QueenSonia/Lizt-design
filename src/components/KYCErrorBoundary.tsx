/* eslint-disable */

"use client";
import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ExternalLink,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface KYCErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface KYCErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    errorInfo?: React.ErrorInfo;
    reset: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * KYC-specific Error Boundary with specialized error handling for KYC operations
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
class KYCErrorBoundary extends React.Component<
  KYCErrorBoundaryProps,
  KYCErrorBoundaryState
> {
  constructor(props: KYCErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<KYCErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("KYC Error caught by boundary:", error, errorInfo);

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log KYC-specific error details
    this.logKYCErrorDetails(error, errorInfo);
  }

  private logKYCErrorDetails(error: Error, errorInfo: React.ErrorInfo) {
    const kycErrorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      isKYCForm: window.location.pathname.includes("/kyc/"),
      token: this.extractTokenFromURL(),
    };

    console.group("🏠 KYC Error Boundary Details");
    console.error("KYC Error:", error);
    console.error("KYC Error Info:", errorInfo);
    console.table(kycErrorDetails);
    console.groupEnd();
  }

  private extractTokenFromURL(): string | null {
    const match = window.location.pathname.match(/\/kyc\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || KYCErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          reset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function KYCErrorFallback({
  error,
  errorInfo,
  reset,
}: {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = React.useState(false);
  const isKYCForm = window.location.pathname.includes("/kyc/");
  const token = window.location.pathname.match(/\/kyc\/([^\/]+)/)?.[1];

  const getKYCErrorType = (error?: Error): string => {
    if (!error) return "KYC System Error";

    const message = error.message.toLowerCase();

    if (
      message.includes("token") ||
      message.includes("invalid") ||
      message.includes("expired")
    ) {
      return "KYC Link Issue";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "Connection Error";
    }
    if (message.includes("validation") || message.includes("form")) {
      return "Form Validation Error";
    }
    if (message.includes("submission") || message.includes("submit")) {
      return "Submission Error";
    }
    return "KYC System Error";
  };

  const getKYCErrorMessage = (error?: Error): string => {
    if (!error) return "An error occurred with the KYC system";

    const errorType = getKYCErrorType(error);

    switch (errorType) {
      case "KYC Link Issue":
        return "There's an issue with your KYC application link. It may be invalid, expired, or no longer available.";
      case "Connection Error":
        return "Unable to connect to the KYC system. Please check your internet connection.";
      case "Form Validation Error":
        return "There was an issue validating your form data. Please check all fields and try again.";
      case "Submission Error":
        return "Your KYC application could not be submitted. Please try again.";
      default:
        return "An unexpected error occurred with the KYC system.";
    }
  };

  const getKYCErrorActions = (error?: Error) => {
    const errorType = getKYCErrorType(error);

    switch (errorType) {
      case "KYC Link Issue":
        return {
          primary: "Contact Property Owner",
          primaryAction: () => {
            toast.info("Please contact the property owner for a new KYC link");
          },
          secondary: "Go to Homepage",
          secondaryAction: () => (window.location.href = "/"),
        };
      case "Connection Error":
        return {
          primary: "Retry Connection",
          primaryAction: reset,
          secondary: "Check Connection",
          secondaryAction: () => {
            window.open("https://www.google.com", "_blank");
          },
        };
      case "Form Validation Error":
      case "Submission Error":
        return {
          primary: "Try Again",
          primaryAction: reset,
          secondary: "Refresh Page",
          secondaryAction: () => window.location.reload(),
        };
      default:
        return {
          primary: "Try Again",
          primaryAction: reset,
          secondary: "Go Home",
          secondaryAction: () => (window.location.href = "/"),
        };
    }
  };

  const handleCopyToken = async () => {
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        toast.success("Token copied to clipboard");
      } catch {
        toast.error("Failed to copy token");
      }
    }
  };

  const actions = getKYCErrorActions(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-6">
        {/* Error Icon and Title */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {getKYCErrorType(error)}
          </h2>
          <p className="text-slate-600 mb-4">{getKYCErrorMessage(error)}</p>
        </div>

        {/* KYC-specific Information */}
        {isKYCForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">
              KYC Application Details
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>Form URL: {window.location.href}</div>
              {token && (
                <div className="flex items-center gap-2">
                  <span>Token: {token.substring(0, 8)}...</span>
                  <button
                    onClick={handleCopyToken}
                    className="text-blue-600 hover:text-blue-800"
                    title="Copy full token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div>Time: {new Date().toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={actions.primaryAction}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {actions.primary}
          </button>

          <button
            onClick={actions.secondaryAction}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {actions.secondary === "Check Connection" ? (
              <ExternalLink className="w-4 h-4" />
            ) : (
              <Home className="w-4 h-4" />
            )}
            {actions.secondary}
          </button>
        </div>

        {/* Help Text */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Make sure you&apos;re using the correct KYC link</li>
            <li>• Check that your internet connection is stable</li>
            <li>• Try refreshing the page or clearing your browser cache</li>
            <li>• Contact the property owner if the link has expired</li>
          </ul>
        </div>

        {/* Error Details Toggle */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            {showDetails ? "Hide" : "Show"} Technical Details
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
                    <pre className="mt-1 whitespace-pre-wrap break-all text-xs">
                      {error.stack.substring(0, 500)}
                      {error.stack.length > 500 && "..."}
                    </pre>
                  </div>
                )}
                <div>
                  <strong>Component:</strong> KYC System
                </div>
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

export default KYCErrorBoundary;
