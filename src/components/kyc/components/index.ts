/**
 * Component exports for KYC form components
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

export { default as StepCard } from "./StepCard";
export { default as VerticalStepTracker } from "./VerticalStepTracker";
export { default as MobileStepProgress } from "./MobileStepProgress";
export { ModernFileUpload } from "./ModernFileUpload";
export { default as MultiStepForm } from "./MultiStepForm";
export { default as NavigationControls } from "./NavigationControls";
export { PhoneVerification } from "./PhoneVerification";

// Step Components
export {
  PersonalDetailsStep,
  EmploymentDetailsStep,
  TenancyInformationStep,
  IdentificationDeclarationStep,
} from "./steps";

// Success and Error Handling Components
export { default as SuccessPage } from "./SuccessPage";
export { default as ErrorBoundary } from "./ErrorBoundary";
export {
  default as ErrorDisplay,
  NetworkErrorDisplay,
  ValidationErrorDisplay,
  FileUploadErrorDisplay,
  TimeoutErrorDisplay,
  ServerErrorDisplay,
  TokenErrorDisplay,
} from "./ErrorDisplay";
export {
  default as ConnectionStatus,
  useConnectionStatus,
  OfflineIndicator,
} from "./ConnectionStatus";
export {
  ToastProvider,
  useToast,
  useToastHelpers,
  createToastHelpers,
} from "./Toast";
