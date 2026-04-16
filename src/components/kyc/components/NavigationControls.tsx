/**
 * NavigationControls Component
 * Back/Next button functionality with proper validation
 * Requirements: 1.4, 5.3
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { NavigationControlsProps } from "../types/component.types";
import { BRAND_COLOR } from "../constants/theme";

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentStep,
  totalSteps,
  isValid,
  isSubmitting,
  isUploading = false,
  onNext,
  onSubmit,
}) => {
  const isLastStep = currentStep === totalSteps;
  const isDisabled = isSubmitting || isUploading;

  return (
    <div>
      <nav
        className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 mt-8 border-t border-gray-200"
        role="navigation"
        aria-label="Form navigation"
      >
        {/* Next/Submit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Validation Status Indicator */}
          {!isValid && currentStep > 1 && (
            <div
              className="flex items-center gap-2 text-sm text-amber-600"
              role="alert"
              aria-live="polite"
            >
              <div
                className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                aria-hidden="true"
              />
              Please complete all required fields
            </div>
          )}

          {/* Skip Button - Only on first step
          {isFirstStep && onSkip && (
            <Button
              type="button"
              onClick={onSkip}
              disabled={!isValid || isSubmitting}
              variant="outline"
              className="h-11 px-6 border-orange-300 text-orange-600 hover:bg-orange-50 w-full sm:w-auto"
              aria-label="Skip to final step"
            >
              Skip to Submit
            </Button>
          )} */}

          {/* Action Button */}
          {isLastStep ? (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isDisabled}
              className="flex-1 h-11 px-6 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
              style={{ backgroundColor: BRAND_COLOR }}
              aria-label="Submit KYC application"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Submitting...
                </>
              ) : isUploading ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Uploading documents...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
              disabled={isSubmitting}
              className="flex-1 h-11 px-6 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
              style={{ backgroundColor: BRAND_COLOR }}
              aria-label={`Continue to step ${currentStep + 1}`}
            >
              Continue
              <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </nav>

      {/* Help Text */}
      <p className="text-center text-xs text-gray-500 mt-6">
        Need help? Contact support at{" "}
        <a
          href="mailto:hello@propertykraft.africa"
          className="hover:underline"
          style={{ color: BRAND_COLOR }}
        >
          hello@propertykraft.africa
        </a>
      </p>
    </div>
  );
};

export default NavigationControls;
