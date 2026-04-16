/**
 * StepCard Component
 * Reusable card wrapper for each form step with title, subtitle, and step number
 * Requirements: 1.1, 1.2
 */

import React from "react";
import { StepCardProps } from "../types";

const StepCard: React.FC<StepCardProps> = ({
  title,
  subtitle,
  stepNumber,
  children,
}) => {
  return (
    <div className="bg-white p-6 md:p-8 w-full h-full">
      {/* Step Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-1">
          <h2 id={`step-${stepNumber}-title`} className="text-gray-900">
            {title}
          </h2>
        </div>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      {/* Step Content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default StepCard;
