/* eslint-disable */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, AlertCircle } from "lucide-react";

/**
 * Form progress indicator with validation status
 * Requirements: 7.4, 7.5
 */

interface FormSection {
  id: string;
  title: string;
  fields: string[];
  isValid?: boolean;
  hasErrors?: boolean;
  isComplete?: boolean;
}

interface FormProgressProps {
  sections: FormSection[];
  currentSection?: string;
  className?: string;
  showValidationStatus?: boolean;
}

export function FormProgress({
  sections,
  currentSection,
  className,
  showValidationStatus = true,
}: FormProgressProps) {
  const totalSections = sections.length;
  const completedSections = sections.filter(
    (section) => section.isComplete
  ).length;
  const progressPercentage = (completedSections / totalSections) * 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Form Progress</span>
          <span>
            {completedSections}/{totalSections} sections completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-3">
        {sections.map((section, index) => {
          const isCurrent = currentSection === section.id;
          const isCompleted = section.isComplete;
          const hasErrors = section.hasErrors;
          const isValid = section.isValid;

          return (
            <div
              key={section.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                isCurrent && "bg-blue-50 border border-blue-200",
                isCompleted &&
                  !isCurrent &&
                  "bg-green-50 border border-green-200",
                hasErrors && "bg-red-50 border border-red-200",
                !isCurrent &&
                  !isCompleted &&
                  !hasErrors &&
                  "bg-gray-50 border border-gray-200"
              )}
            >
              {/* Section Icon */}
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : hasErrors ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Circle
                    className={cn(
                      "h-5 w-5",
                      isCurrent ? "text-blue-600" : "text-gray-400"
                    )}
                  />
                )}
              </div>

              {/* Section Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={cn(
                      "text-sm font-medium truncate",
                      isCurrent && "text-blue-900",
                      isCompleted && !isCurrent && "text-green-900",
                      hasErrors && "text-red-900",
                      !isCurrent &&
                        !isCompleted &&
                        !hasErrors &&
                        "text-gray-700"
                    )}
                  >
                    {section.title}
                  </h3>

                  {showValidationStatus && (
                    <div className="flex items-center gap-1 text-xs">
                      {isCompleted && (
                        <span className="text-green-600 font-medium">
                          Complete
                        </span>
                      )}
                      {hasErrors && !isCompleted && (
                        <span className="text-red-600 font-medium">Errors</span>
                      )}
                      {isValid && !isCompleted && !hasErrors && (
                        <span className="text-blue-600 font-medium">Valid</span>
                      )}
                      {!isValid && !hasErrors && !isCompleted && (
                        <span className="text-gray-500">Incomplete</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Field Count */}
                <p className="text-xs text-gray-500 mt-1">
                  {section.fields.length} field
                  {section.fields.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">
              {completedSections}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">
              {sections.filter((s) => s.hasErrors).length}
            </div>
            <div className="text-xs text-gray-600">With Errors</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-600">
              {totalSections - completedSections}
            </div>
            <div className="text-xs text-gray-600">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact form progress indicator for smaller spaces
 */
interface CompactFormProgressProps {
  totalFields: number;
  completedFields: number;
  errorFields: number;
  className?: string;
}

export function CompactFormProgress({
  totalFields,
  completedFields,
  errorFields,
  className,
}: CompactFormProgressProps) {
  const progressPercentage = (completedFields / totalFields) * 100;
  const hasErrors = errorFields > 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Progress Circle */}
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${progressPercentage * 0.88} 88`}
            className={cn(
              "transition-all duration-300",
              hasErrors ? "text-red-500" : "text-blue-500"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {/* Progress Text */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">
          {completedFields}/{totalFields} fields completed
        </div>
        {hasErrors && (
          <div className="text-xs text-red-600">
            {errorFields} field{errorFields !== 1 ? "s" : ""} with errors
          </div>
        )}
      </div>
    </div>
  );
}
