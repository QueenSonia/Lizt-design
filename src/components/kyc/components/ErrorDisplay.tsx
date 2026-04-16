/**
 * Error Display Components
 * Various error display components for different error types
 * Requirements: 7.3, 7.4, 7.5
 */

import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  WifiOff,
  RefreshCw,
  X,
  Clock,
  FileX,
  Shield,
  Server,
} from "lucide-react";

export interface ErrorDisplayProps {
  title: string;
  message: string;
  type?:
    | "error"
    | "warning"
    | "network"
    | "validation"
    | "timeout"
    | "file"
    | "security"
    | "server";
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  showRetry?: boolean;
  showDismiss?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  type = "error",
  onRetry,
  onDismiss,
  retryLabel = "Try Again",
  showRetry = true,
  showDismiss = false,
  className = "",
}) => {
  const getIcon = () => {
    switch (type) {
      case "network":
        return <WifiOff className="w-6 h-6" />;
      case "timeout":
        return <Clock className="w-6 h-6" />;
      case "file":
        return <FileX className="w-6 h-6" />;
      case "security":
        return <Shield className="w-6 h-6" />;
      case "server":
        return <Server className="w-6 h-6" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: "text-yellow-500",
          title: "text-yellow-800",
          message: "text-yellow-700",
          button: "bg-yellow-500 hover:bg-yellow-600",
        };
      case "network":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "text-blue-500",
          title: "text-blue-800",
          message: "text-blue-700",
          button: "bg-blue-500 hover:bg-blue-600",
        };
      default:
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-500",
          title: "text-red-800",
          message: "text-red-700",
          button: "bg-red-500 hover:bg-red-600",
        };
    }
  };

  const colors = getColorClasses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${colors.icon}`}>{getIcon()}</div>

        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${colors.title}`}>{title}</h3>
          <p className={`mt-1 text-sm ${colors.message}`}>{message}</p>

          {(showRetry || showDismiss) && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white ${colors.button} rounded-md transition-colors`}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {retryLabel}
                </button>
              )}

              {showDismiss && onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Specific error components for common scenarios

export const NetworkErrorDisplay: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className }) => (
  <ErrorDisplay
    type="network"
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onRetry={onRetry}
    className={className}
  />
);

export const ValidationErrorDisplay: React.FC<{
  errors: Record<string, string>;
  onDismiss?: () => void;
  className?: string;
}> = ({ errors, onDismiss, className }) => {
  const errorCount = Object.keys(errors).length;
  const firstError = Object.values(errors)[0];

  return (
    <ErrorDisplay
      type="validation"
      title={`${errorCount} Validation Error${errorCount > 1 ? "s" : ""}`}
      message={
        errorCount === 1
          ? firstError
          : `Please fix ${errorCount} validation errors before continuing.`
      }
      showRetry={false}
      showDismiss={!!onDismiss}
      onDismiss={onDismiss}
      className={className}
    />
  );
};

export const FileUploadErrorDisplay: React.FC<{
  fileName?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ fileName, onRetry, className }) => (
  <ErrorDisplay
    type="file"
    title="File Upload Failed"
    message={
      fileName
        ? `Failed to upload "${fileName}". Please try again.`
        : "File upload failed. Please try again."
    }
    onRetry={onRetry}
    retryLabel="Retry Upload"
    className={className}
  />
);

export const TimeoutErrorDisplay: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className }) => (
  <ErrorDisplay
    type="timeout"
    title="Request Timeout"
    message="The request took too long to complete. Please try again."
    onRetry={onRetry}
    className={className}
  />
);

export const ServerErrorDisplay: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className }) => (
  <ErrorDisplay
    type="server"
    title="Server Error"
    message="We're experiencing technical difficulties. Please try again in a few moments."
    onRetry={onRetry}
    className={className}
  />
);

export const TokenErrorDisplay: React.FC<{
  className?: string;
}> = ({ className }) => (
  <ErrorDisplay
    type="security"
    title="Invalid Access Token"
    message="Your access token is invalid or has expired. Please request a new KYC link."
    showRetry={false}
    className={className}
  />
);

export default ErrorDisplay;
