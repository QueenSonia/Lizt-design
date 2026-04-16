/**
 * MobileStepProgress Component
 * Mobile-friendly horizontal progress bar
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import React from "react";
import { MobileStepProgressProps } from "../types";
import { BRAND_COLOR } from "../constants/theme";

const MobileStepProgress: React.FC<MobileStepProgressProps> = ({
  currentStep,
  totalSteps,
}) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div
      className="w-full bg-white border-b border-gray-200 px-4 py-4 md:hidden"
      role="region"
      aria-label="Form progress"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm" style={{ color: BRAND_COLOR }}>
          {Math.round(progressPercentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full bg-gray-100 rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Form completion progress: ${Math.round(
          progressPercentage
        )}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: BRAND_COLOR,
          }}
        />
      </div>
    </div>
  );
};

export default MobileStepProgress;
