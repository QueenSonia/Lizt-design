"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";

/**
 * Loading state components with enhanced user feedback
 * Requirements: 7.4, 7.5
 */

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  type?: "loading" | "success" | "error" | "warning";
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "Loading...",
  submessage,
  type = "loading",
  showIcon = true,
  className,
  size = "md",
}: LoadingStateProps) {
  const icons = {
    loading: Loader2,
    success: CheckCircle,
    error: AlertCircle,
    warning: Clock,
  };

  const colors = {
    loading: "text-blue-600",
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
  };

  const bgColors = {
    loading: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
  };

  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border",
        bgColors[type],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            sizes[size],
            colors[type],
            type === "loading" && "animate-spin"
          )}
        />
      )}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-medium",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg",
            colors[type]
          )}
        >
          {message}
        </div>
        {submessage && (
          <div className="text-sm text-gray-600 mt-1">{submessage}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Form submission loading state with progress steps
 */
interface FormSubmissionLoadingProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function FormSubmissionLoading({
  steps,
  currentStep,
  className,
}: FormSubmissionLoadingProps) {
  return (
    <div
      className={cn(
        "bg-blue-50 border border-blue-200 rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        <div>
          <h3 className="text-sm font-medium text-blue-900">
            Processing Your Application
          </h3>
          <p className="text-sm text-blue-700">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-sm",
              index < currentStep && "text-green-700",
              index === currentStep && "text-blue-700 font-medium",
              index > currentStep && "text-gray-500"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                index < currentStep && "bg-green-500",
                index === currentStep && "bg-blue-500",
                index > currentStep && "bg-gray-300"
              )}
            />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Connection status indicator
 */
interface ConnectionStatusProps {
  isOnline: boolean;
  className?: string;
  showText?: boolean;
}

export function ConnectionStatus({
  isOnline,
  className,
  showText = true,
}: ConnectionStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isOnline ? "text-green-600" : "text-red-600",
        className
      )}
    >
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      {showText && (
        <span className="text-sm font-medium">
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
}

/**
 * Skeleton loader for form fields
 */
interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({ fields = 6, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * Success state with action buttons
 */
interface SuccessStateProps {
  title: string;
  message: string;
  submessage?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }>;
  className?: string;
}

export function SuccessState({
  title,
  message,
  submessage,
  actions = [],
  className,
}: SuccessStateProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-3">{title}</h2>

      <p className="text-gray-600 mb-4">{message}</p>

      {submessage && <p className="text-sm text-gray-500 mb-6">{submessage}</p>}

      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={cn(
                "px-6 py-2 rounded-md font-medium transition-colors",
                action.variant === "primary"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Error state with retry functionality
 */
interface ErrorStateProps {
  title: string;
  message: string;
  submessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  retryLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function ErrorState({
  title,
  message,
  submessage,
  onRetry,
  onCancel,
  retryLabel = "Try Again",
  cancelLabel = "Cancel",
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>

      <p className="text-gray-600 mb-4">{message}</p>

      {submessage && <p className="text-sm text-gray-500 mb-6">{submessage}</p>}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            {retryLabel}
          </button>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-900 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  );
}
