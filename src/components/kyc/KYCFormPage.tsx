/**
 * Enhanced KYC Form Page with Error Handling and Success States
 * Main page component that integrates all error handling and success functionality
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MultiStepForm,
  SuccessPage,
  ErrorBoundary,
  ConnectionStatus,
  OfflineIndicator,
  ToastProvider,
  useToastHelpers,
  TokenErrorDisplay,
  NetworkErrorDisplay,
  ServerErrorDisplay,
} from "./components";
import { PhoneVerification } from "./components/PhoneVerification";
import {
  ErrorHandler,
  NetworkError,
  TokenError,
  ServerError,
  withErrorHandling,
  withRetry,
  RETRY_CONFIGS,
} from "./utils";
import { API_CONFIG } from "./utils/api-config";
import { PropertyInfo, TokenValidationResult } from "./types";
import { normalizePhoneNumber } from "@/utils/phoneNormalization";
import { ExistingKYCData } from "@/schemas/kyc.schemas";

export interface KYCFormPageProps {
  token: string;
  onComplete?: (applicantInfo: {
    applicantName: string;
    applicantEmail: string;
  }) => void;
  onError?: (error: string) => void;
  vacantProperties?: Array<{
    id: string;
    name: string;
    location: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    description?: string;
    hasPendingKyc?: boolean;
  }>;
}

// Token validation function with error handling
const validateToken = withRetry(
  withErrorHandling(async (token: string): Promise<TokenValidationResult> => {
    const response = await fetch(API_CONFIG.kyc.validate(token));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new TokenError("Invalid or expired KYC token");
      }
      if (response.status >= 500) {
        throw new ServerError(`Server error: ${response.status}`);
      }
      throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle the backend response structure: { success, message, data: { valid, vacantProperties } }
    if (data.success && data.data && data.data.valid) {
      // Validate that we have vacant properties
      if (
        !data.data.vacantProperties ||
        !Array.isArray(data.data.vacantProperties) ||
        data.data.vacantProperties.length === 0
      ) {
        throw new TokenError("No vacant properties available for application");
      }

      // Create a general property info for backward compatibility
      const generalPropertyInfo = {
        id: "general",
        name: "Property Application",
        location: `${data.data.vacantProperties.length} properties available`,
        landlordId: data.data.landlordId,
      };

      return {
        valid: data.data.valid,
        propertyInfo: generalPropertyInfo,
        vacantProperties: data.data.vacantProperties,
      };
    }

    // Handle backend error response
    if (data.success === false) {
      throw new TokenError(data.message || "Token validation failed");
    }

    // Fallback for unexpected response structure
    throw new TokenError("Unexpected response format from server");
  }, "token_validation"),
  RETRY_CONFIGS.api,
);

const KYCFormPageContent: React.FC<KYCFormPageProps> = ({
  token,
  onComplete,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);
  const [availableProperties, setAvailableProperties] = useState<
    Array<{
      id: string;
      name: string;
      location: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      description?: string;
      hasPendingKyc?: boolean;
    }>
  >([]);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>();
  const [applicantName, setApplicantName] = useState<string>("");
  const [applicantEmail, setApplicantEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string>("");
  const [kycVerificationToken, setKycVerificationToken] = useState<string>("");
  const [isCheckingKYC, setIsCheckingKYC] = useState(false);
  const [existingKYCData, setExistingKYCData] =
    useState<ExistingKYCData | null>(null);
  const [availablePropertyIds, setAvailablePropertyIds] = useState<string[]>(
    [],
  );

  const toast = useToastHelpers();
  const errorHandler = ErrorHandler.getInstance();

  // Validate token on mount
  useEffect(() => {
    const handleTokenValidation = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await validateToken(token);

        if (result.valid && result.propertyInfo && result.vacantProperties) {
          setTokenValid(true);
          setPropertyInfo(result.propertyInfo);
          setAvailableProperties(result.vacantProperties);
          toast.success("KYC form loaded successfully", undefined, 5000);

          // Capture form open tracking data (only on first open within this session)
          const trackingKey = `kyc_tracking_${token}`;
          if (!sessionStorage.getItem(trackingKey)) {
            const trackingData: Record<string, string> = {
              form_opened_at: new Date().toISOString(),
              user_agent: navigator.userAgent,
            };

            // Capture IP address (best-effort, non-blocking)
            try {
              const ipResponse = await fetch(
                "https://api.ipify.org?format=json",
              );
              const ipData = await ipResponse.json();
              if (ipData.ip) {
                trackingData.form_opened_ip = ipData.ip;
              }
            } catch {
              // IP capture is optional — don't block form loading
            }

            sessionStorage.setItem(trackingKey, JSON.stringify(trackingData));
          }
        } else {
          throw new TokenError("Invalid token response");
        }
      } catch (err) {
        const appError = errorHandler.handleError(err, "token_validation");
        setError(errorHandler.getUserMessage(appError));
        setErrorType(appError.type);
        setTokenValid(false);

        if (onError) {
          onError(appError.message);
        }
      } finally {
        setLoading(false);
      }
    };

    handleTokenValidation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, onError]); // Removed retryCount to prevent infinite loop

  // Handle form submission success
  const handleSubmissionSuccess = async (applicantInfo: {
    applicantName: string;
    applicantEmail: string;
  }) => {
    try {
      // In a real implementation, you might want to get the submission ID from the form
      const mockSubmissionId = `KYC-${Date.now()}`;
      setSubmissionId(mockSubmissionId);
      setApplicantName(applicantInfo.applicantName);
      setApplicantEmail(applicantInfo.applicantEmail);
      setSubmissionSuccess(true);

      toast.success("Application submitted successfully!");

      if (onComplete) {
        onComplete(applicantInfo);
      }
    } catch (err) {
      const appError = errorHandler.handleError(err, "submission_success");
      toast.error(
        "Error processing submission",
        errorHandler.getUserMessage(appError),
      );
    }
  };

  // Handle form submission error
  const handleSubmissionError = (errorMessage: string) => {
    setError(errorMessage);
    setErrorType("SUBMISSION_ERROR");
    toast.error("Submission failed", errorMessage);

    if (onError) {
      onError(errorMessage);
    }
  };

  // Handle retry actions
  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);

      const result = await validateToken(token);

      if (result.valid && result.propertyInfo) {
        setTokenValid(true);
        setPropertyInfo(result.propertyInfo);
        toast.success("KYC form loaded successfully");
      } else {
        throw new TokenError("Invalid token response");
      }
    } catch (err) {
      const appError = errorHandler.handleError(err, "token_validation");
      setError(errorHandler.getUserMessage(appError));
      setErrorType(appError.type);
      setTokenValid(false);

      if (onError) {
        onError(appError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle connection status changes
  const handleConnectionChange = (isOnline: boolean) => {
    if (isOnline) {
      toast.info("Connection restored", "You're back online");
    } else {
      toast.warning("Connection lost", "You're currently offline");
    }
  };

  // Handle phone verification completion
  const handlePhoneVerificationComplete = async (
    phoneNumber: string,
    verificationToken: string,
  ) => {
    setVerifiedPhoneNumber(phoneNumber);
    setKycVerificationToken(verificationToken);
    setIsCheckingKYC(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      console.log("🔍 Checking for existing KYC data for:", normalizedPhone);

      // Skip KYC lookups if no verification token (e.g., OTP was skipped via saved form data)
      // Restore application_type from session storage so form shape is preserved across refreshes
      if (!verificationToken) {
        console.log(
          "ℹ️ No verification token - restoring application_type from session storage",
        );
        try {
          const savedType = sessionStorage.getItem(`kyc_app_type_${token}`);
          if (savedType) {
            setExistingKYCData({
              application_type: savedType,
            } as ExistingKYCData);
          }
        } catch {
          // session storage unavailable, leave existingKYCData null
        }
        setAvailablePropertyIds([]);
        setPhoneVerified(true);
        toast.success("Phone verified successfully!");
        return;
      }

      const kycAuthHeaders = {
        Authorization: `Bearer ${verificationToken}`,
      };

      // First check for pending completion (landlord-specific)
      if (propertyInfo?.landlordId) {
        const pendingRes = await fetch(
          `${API_CONFIG.baseUrl}/api/kyc/check-pending?landlordId=${propertyInfo.landlordId}`,
          { headers: kycAuthHeaders },
        );
        const pendingResponse = await pendingRes.json();

        if (pendingResponse.success && pendingResponse.hasPending) {
          console.log("✅ Found pending KYC for landlord");
          setExistingKYCData(pendingResponse.kycData);
          setAvailablePropertyIds(pendingResponse.propertyIds || []);
          if (pendingResponse.kycData?.application_type) {
            sessionStorage.setItem(
              `kyc_app_type_${token}`,
              pendingResponse.kycData.application_type,
            );
          }
          setPhoneVerified(true);
          toast.success("Welcome back! We found your pending application.");
          return;
        }
      }

      // Check for any existing KYC system-wide
      const existingRes = await fetch(
        `${API_CONFIG.baseUrl}/api/kyc/check-existing`,
        { headers: kycAuthHeaders },
      );
      const existingResponse = await existingRes.json();

      if (existingResponse.success && existingResponse.hasExisting) {
        console.log("✅ Found existing KYC data");
        // Strip application_type from check-existing results — it only applies to
        // the specific pending link it was created for, not future KYC applications.
        // Only check-pending results should control form shape (e.g. hiding step 3).
        const { application_type: _ignored, ...kycDataWithoutType } =
          existingResponse.kycData ?? {};
        setExistingKYCData(kycDataWithoutType);
        setAvailablePropertyIds([]);
        setPhoneVerified(true);
        toast.success("Welcome back! We found your previous application.");
      } else {
        console.log("ℹ️ No existing KYC found - new applicant");
        setExistingKYCData(null);
        setAvailablePropertyIds([]);
        setPhoneVerified(true);
        toast.success("Phone verified successfully!");
      }
    } catch (error) {
      console.error("Error checking KYC:", error);
      // Don't block the user - let them proceed even if check fails
      setExistingKYCData(null);
      setAvailablePropertyIds([]);
      setPhoneVerified(true);
      toast.success("Phone verified successfully!");
    } finally {
      setIsCheckingKYC(false);
    }
  };

  // Handle phone verification error
  const handlePhoneVerificationError = (errorMessage: string) => {
    toast.error("Verification failed", errorMessage);
  };

  // Handle going back to phone verification from form
  const handleBackToVerification = () => {
    // Clear session storage when going back to change phone number
    // This prevents stale data from a different phone number being loaded
    try {
      // Clear all KYC form data for this token
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("kyc_form_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn("Error clearing session storage:", error);
    }

    setPhoneVerified(false);
    setVerifiedPhoneNumber("");
    setExistingKYCData(null);
    setAvailablePropertyIds([]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC form...</p>
        </motion.div>
      </div>
    );
  }

  // Phone verification step (before showing the form)
  if (!phoneVerified && tokenValid) {
    return (
      <>
        <PhoneVerification
          token={token}
          onVerificationComplete={handlePhoneVerificationComplete}
          onError={handlePhoneVerificationError}
        />
        {isCheckingKYC && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    Checking your information...
                  </p>
                  <p className="text-sm text-gray-500">
                    This will only take a moment
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </>
    );
  }

  // Success state
  if (submissionSuccess && propertyInfo) {
    return (
      <SuccessPage
        propertyInfo={propertyInfo}
        submissionId={submissionId}
        submissionDate={new Date()}
        applicantName={applicantName}
        applicantEmail={applicantEmail}
        landlordId={propertyInfo.landlordId}
      />
    );
  }

  // Error states
  if (error && !tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {errorType === "TOKEN_ERROR" && (
            <TokenErrorDisplay className="mb-4" />
          )}

          {errorType === "NETWORK_ERROR" && (
            <NetworkErrorDisplay onRetry={handleRetry} className="mb-4" />
          )}

          {errorType === "SERVER_ERROR" && (
            <ServerErrorDisplay onRetry={handleRetry} className="mb-4" />
          )}

          {!["TOKEN_ERROR", "NETWORK_ERROR", "SERVER_ERROR"].includes(
            errorType || "",
          ) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Unable to Load Form
              </h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main form state
  if (tokenValid && propertyInfo) {
    return (
      <div className="relative">
        <ConnectionStatus onConnectionChange={handleConnectionChange} />
        <OfflineIndicator />

        <MultiStepForm
          token={token}
          propertyInfo={propertyInfo}
          vacantProperties={availableProperties}
          verifiedPhoneNumber={verifiedPhoneNumber}
          kycVerificationToken={kycVerificationToken}
          existingKYCData={existingKYCData}
          availablePropertyIds={availablePropertyIds}
          onSubmissionSuccess={handleSubmissionSuccess}
          onSubmissionError={handleSubmissionError}
          onBackToVerification={handleBackToVerification}
        />
      </div>
    );
  }

  // Fallback state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">
          Something went wrong. Please refresh the page.
        </p>
      </div>
    </div>
  );
};

// Main component with error boundary and toast provider
const KYCFormPage: React.FC<KYCFormPageProps> = (props) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("KYC Form Error:", error, errorInfo);
        // In production, send to monitoring service
      }}
    >
      <ToastProvider>
        <KYCFormPageContent {...props} />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default KYCFormPage;
