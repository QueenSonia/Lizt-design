"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { KYCService, type PropertyKYCData } from "@/services/kyc/kyc.service";
import { Loader2, Wifi, WifiOff, CircleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { KYCFormPage as NewKYCFormPage, SuccessPage } from "@/components/kyc";
import KYCErrorBoundary from "@/components/KYCErrorBoundary";
import { ErrorHandler } from "@/utils/error-handling";

function KYCFormPageContent() {
  const params = useParams();
  const token = params.token as string;

  const [propertyData, setPropertyData] = useState<PropertyKYCData | null>(
    null,
  );
  const [isValidating, setIsValidating] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [selectedPropertyName, setSelectedPropertyName] = useState("");

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored");
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Connection lost. Your data will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        setIsValidating(true);
        const data = await KYCService.validateToken(token);
        setPropertyData(data);

        // Track form open with IP address
        if (data.valid) {
          const ipAddress = await KYCService.getUserIP();
          await KYCService.trackFormOpen(token, ipAddress);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setPropertyData({
          valid: false,
          message:
            "Failed to validate KYC form. Please check your connection and try again.",
        });
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  // Handle successful form submission
  const handleSubmissionSuccess = (applicantInfo: {
    applicantName: string;
    applicantEmail: string;
    propertyName?: string;
  }) => {
    setApplicantName(applicantInfo.applicantName);
    setApplicantEmail(applicantInfo.applicantEmail);
    setSelectedPropertyName(
      applicantInfo.propertyName || "Property Application",
    );
    setSubmitSuccess(true);
    toast.success("Your KYC application has been submitted successfully!");
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 text-center">Validating KYC form...</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  Offline
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (!propertyData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            {/* Colored "crossed house" icon – clear prohibition without feeling overly alarming */}
            <div className="relative h-12 w-12 mb-4">
              <CircleAlert className="h-12 w-12 text-amber-500 mb-4" />
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
              KYC Form Unavailable
            </h2>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              {propertyData?.message || "This KYC form is no longer available."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state after submission
  if (submitSuccess && propertyData.vacantProperties) {
    return (
      <SuccessPage
        propertyInfo={{
          id: "general",
          name: selectedPropertyName,
          address: "Multiple Properties Available",
          landlordId: propertyData.landlordId,
        }}
        submissionDate={new Date()}
        applicantName={applicantName}
        applicantEmail={applicantEmail}
        landlordId={propertyData.landlordId}
      />
    );
  }

  // Main form with new multi-step implementation!
  return (
    <NewKYCFormPage
      token={token}
      onComplete={handleSubmissionSuccess}
      vacantProperties={propertyData.vacantProperties || []}
    />
  );
}

/**
 * Main KYC Form Page component wrapped with error boundary
 */
export default function KYCFormPage() {
  const handleError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      ErrorHandler.logError(error, "KYC Form Page");

      // In production, you might want to send this to an error reporting service
      console.error("KYC Form Error:", { error, errorInfo });
    },
    [],
  );

  return (
    <KYCErrorBoundary onError={handleError}>
      <KYCFormPageContent />
    </KYCErrorBoundary>
  );
}
