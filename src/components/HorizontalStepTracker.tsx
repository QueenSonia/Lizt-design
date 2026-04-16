import React from "react";
import { Check } from "lucide-react";

interface HorizontalStepTrackerProps {
  currentStep: number;
  steps: {
    number: number;
    title: string;
    subtitle?: string;
  }[];
}

export function HorizontalStepTracker({
  currentStep,
  steps,
}: HorizontalStepTrackerProps) {
  return (
    <div className="w-full">
      {/* 1. Keep items-start to prevent the 'bouncing' issue on mobile */}
      <div className="flex items-start justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep - 1;
          const isActive = index === currentStep - 1;

          return (
            <React.Fragment key={step.number}>
              {/* Step Item */}
              <div className="flex flex-col items-center relative flex-1 mt-4">
                {/* Step Circle/Icon */}
                <div className="shrink-0 mb-2">
                  {isCompleted ? (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ease-out"
                      style={{ backgroundColor: "#FF5000" }}
                    >
                      <Check
                        className="w-3.5 h-3.5 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  ) : isActive ? (
                    <div
                      className="w-6 h-6 rounded-full transition-all duration-200 ease-out flex items-center justify-center"
                      style={{
                        backgroundColor: "#FF5000",
                        boxShadow: "0 0 0 3px rgba(255, 80, 0, 0.1)",
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white transition-all duration-200 ease-out" />
                  )}
                </div>

                {/* Step Title */}
                <div className="text-center">
                  <div
                    className={`text-[10px] sm:text-xs transition-colors duration-200 ease-out leading-tight ${
                      isActive
                        ? "text-gray-900 font-medium"
                        : isCompleted
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                // 2. We mirror the circle's geometry here:
                //    - mt-4: matches the Step Item's margin
                //    - h-6: matches the Circle's height
                //    - flex items-center: vertically centers the line inside that height
                <div className="flex-1 px-2 mt-4 h-6 flex items-center">
                  <div
                    className="h-0.5 w-full bg-gray-200 transition-all duration-300 ease-out"
                    style={{
                      background:
                        index < currentStep - 1 ? "#FF5000" : "#E5E7EB",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
