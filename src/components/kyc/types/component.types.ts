/**
 * TypeScript interfaces for UI components
 * Requirements: 1.1, 1.2, 1.3
 */

import { ReactNode } from "react";
import { Step, FormData, PropertyInfo } from "./form-data.types";
import { ExistingKYCData } from "@/schemas/kyc.schemas";

export interface StepCardProps {
  title: string;
  subtitle: string;
  stepNumber: string;
  children: ReactNode;
}

export interface VerticalStepTrackerProps {
  currentStep: number;
  steps: Step[];
}

export interface MobileStepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export interface MultiStepFormProps {
  token: string;
  propertyInfo: PropertyInfo;
  vacantProperties?: Array<{
    id: string;
    name: string;
    location: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    description?: string;
    rentalPrice?: number;
    hasPendingKyc?: boolean;
  }>;
  verifiedPhoneNumber: string; // Phone number from verification step (immutable)
  kycVerificationToken: string; // Short-lived JWT from OTP verification for secure KYC lookups
  existingKYCData: ExistingKYCData | null; // Pre-fetched KYC data from server
  availablePropertyIds: string[]; // Property IDs for pending completion
  onSubmissionSuccess: (applicantInfo: {
    applicantName: string;
    applicantEmail: string;
    propertyName?: string;
  }) => void;
  onSubmissionError: (error: string) => void;
  onBackToVerification?: () => void; // Callback to go back to phone verification
}

export interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  isValid: boolean;
  isSubmitting: boolean;
  isUploading?: boolean;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onSkip?: () => void;
}

export interface FormStepProps {
  formData: FormData;
  onDataChange: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
  onValidationChange: (isValid: boolean) => void;
  isFieldTouched: (fieldName: string) => boolean;
  goToNextStep?: () => void;
  token?: string;
  landlordId?: string;
  kycVerificationToken?: string;
  isReturningApplicant?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
  properties?: Array<{
    id: string;
    name: string;
    location: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    description?: string;
    rentalPrice?: number;
    hasPendingKyc?: boolean;
  }>;
}
