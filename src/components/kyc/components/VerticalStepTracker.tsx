/**
 * VerticalStepTracker Component
 * Desktop sidebar step tracker with progress indicators
 * Requirements: 1.3
 */

import React from "react";
import { Check } from "lucide-react";
import { VerticalStepTrackerProps } from "../types";

const VerticalStepTracker: React.FC<VerticalStepTrackerProps> = ({
  currentStep,
  steps,
}) => {
  return (
    <div className="hidden lg:block w-80 h-fit sticky top-32">
      <div className="relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep - 1;
          const isActive = index === currentStep - 1;

          return (
            <div
              key={step.number}
              className="relative"
              style={{ paddingBottom: index < steps.length - 1 ? "48px" : "0" }}
            >
              {/* Connecting line between steps - positioned to go through circle centers */}
              {index < steps.length - 1 && (
                <div
                  className="absolute transition-all duration-300 ease-out"
                  style={{
                    left: "20.25px", // Centered through the circle (16px padding + 5px circle radius - 1px for line width)
                    top: "15px", // Start from circle center (10px padding + 5px circle radius)
                    width: "2px",
                    height: "calc(100% - 5px)", // Extend to next circle center
                    backgroundColor: "#E5E7EB",
                  }}
                >
                  {/* Filled portion of the line (orange) */}
                  <div
                    className="transition-all duration-300 ease-out"
                    style={{
                      width: "100%",
                      height: index < currentStep - 1 ? "100%" : "0%",
                      backgroundColor: "#FF5000",
                    }}
                  />
                </div>
              )}

              <div
                className={`flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg transition-all duration-200 ease-out relative ${
                  isActive ? "bg-orange-50/30" : "hover:bg-gray-50/50"
                }`}
              >
                {/* Step Circle/Icon */}
                <div className="flex-shrink-0 relative z-10">
                  {isCompleted ? (
                    <div
                      className="w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all duration-200 ease-out shadow-sm"
                      style={{ backgroundColor: "#FF5000" }}
                    >
                      <Check
                        className="w-1.5 h-1.5 text-white"
                        strokeWidth={3}
                      />
                    </div>
                  ) : isActive ? (
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-all duration-200 ease-out"
                      style={{
                        backgroundColor: "#FF5000",
                        boxShadow:
                          "0 0 0 3px rgba(255, 80, 0, 0.15), 0 1px 2px rgba(255, 80, 0, 0.2)",
                      }}
                    />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-white transition-all duration-200 ease-out" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`transition-colors duration-200 ease-out ${
                      isActive
                        ? "text-gray-900"
                        : isCompleted
                        ? "text-gray-700"
                        : "text-gray-500"
                    }`}
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                      lineHeight: "130%",
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerticalStepTracker;
