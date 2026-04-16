"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  OfferLetterDocument,
  OfferLetterData,
} from "@/components/OfferLetterDocument";
import { BrandingData } from "@/utils/brandingStorage";
import { useOfferLetterByToken } from "@/services/offer-letters/query";
import {
  offerLetterApi,
  OfferLetterResponse,
} from "@/services/offer-letters/api";
import { OTPVerificationModal } from "./OTPVerificationModal";
import { RejectConfirmationModal } from "./RejectConfirmationModal";
import { PaymentInvoiceModal } from "./PaymentInvoiceModal";

/**
 * Helper to convert API response to OfferLetterData for the document component
 * Requirements: 8.2
 */
function toOfferLetterData(response: OfferLetterResponse): OfferLetterData {
  return {
    applicantName: response.applicantName,
    applicantEmail: response.applicantEmail,
    applicantGender: response.applicantGender,
    propertyName: response.propertyName,
    rentAmount: response.rentAmount,
    rentFrequency: response.rentFrequency,
    serviceCharge: response.serviceCharge,
    tenancyStartDate: response.tenancyStartDate,
    tenancyEndDate: response.tenancyEndDate,
    cautionDeposit: response.cautionDeposit,
    legalFee: response.legalFee,
    agencyFee: response.agencyFee,
    tenantAddress: response.tenantAddress,
    createdAt: response.createdAt,
    status: response.status as
      | "pending"
      | "accepted"
      | "selected"
      | "rejected"
      | undefined,
    signedAt: response.acceptedAt,
    otp: response.acceptanceOtp,
    signedByPhone: response.acceptedByPhone,
  };
}

/**
 * Build a template object from the backend's contentSnapshot and termsOfTenancy
 * so OfferLetterDocument renders the exact content the landlord saved.
 */
function toTemplate(
  response: OfferLetterResponse,
): import("@/types/offer-letter-template").OfferLetterTemplate | undefined {
  if (!response.termsOfTenancy || !response.contentSnapshot) return undefined;
  return {
    offerTitlePattern: response.contentSnapshot.offer_title || "",
    introTextPattern: response.contentSnapshot.intro_text || "",
    agreementText: response.contentSnapshot.agreement_text || "",
    closingText: response.contentSnapshot.closing_text || "",
    forLandlordText: response.contentSnapshot.for_landlord_text || "",
    termsOfTenancy: response.termsOfTenancy.map((term) => ({
      title: term.title,
      content: term.content.includes("\n")
        ? term.content.split("\n").filter((line: string) => line.trim())
        : term.content,
    })),
    footnotes: [
      "Caution/Security Deposit: Refundable deposit held as security against damages or unpaid rent. Returned at end of tenancy subject to property condition and rent payment status.",
    ],
  };
}

/**
 * Helper to convert API branding to BrandingData for the document component
 */
function toBrandingData(
  branding: OfferLetterResponse["branding"],
): BrandingData | undefined {
  if (!branding) return undefined;
  return {
    businessName: branding.businessName,
    businessAddress: branding.businessAddress,
    contactPhone: branding.contactPhone || "",
    contactEmail: branding.contactEmail || "",
    websiteLink: branding.websiteLink || "",
    footerColor: branding.footerColor,
    letterhead: branding.letterhead,
    signature: branding.signature,
    headingFont: branding.headingFont,
    bodyFont: branding.bodyFont,
    updatedAt: branding.updatedAt,
  };
}

/**
 * Public Offer Letter Page Content
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
function OfferLetterPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = params.token as string;

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [phoneLastFour, setPhoneLastFour] = useState("");

  const {
    data: offerLetter,
    isLoading,
    error,
    refetch,
  } = useOfferLetterByToken(token);

  // Track offer letter view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        const ipAddress = await offerLetterApi.getUserIP();
        await offerLetterApi.trackOfferOpen(token, ipAddress);
      } catch (error) {
        // Silently fail - tracking shouldn't block the user experience
        console.error("Failed to track offer letter view:", error);
      }
    };

    if (token && offerLetter) {
      trackView();
    }
  }, [token, offerLetter]);

  // Auto-refresh when returning from payment callback
  useEffect(() => {
    if (searchParams.get("refresh") === "true") {
      refetch();
      // Clean up the URL
      router.replace(`/offer-letters/${token}`, { scroll: false });
    }
  }, [searchParams, refetch, router, token]);

  // Handle Accept button click - initiates OTP flow
  const handleAcceptClick = useCallback(async () => {
    try {
      const response = await offerLetterApi.initiateAcceptance(token);
      setPhoneLastFour(response.phoneLastFour);
      setShowOTPModal(true);
    } catch (err) {
      console.error("Failed to initiate acceptance:", err);
    }
  }, [token]);

  // Handle successful OTP verification
  const handleOTPSuccess = useCallback(() => {
    setShowOTPModal(false);
    // Show success confirmation modal
    setShowSuccessModal(true);
  }, []);

  // Handle rejection confirmation
  const handleRejectConfirm = useCallback(() => {
    setShowRejectModal(false);
    refetch();
  }, [refetch]);

  // Handle success modal close
  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    refetch();
  }, [refetch]);

  // Handle PDF download
  const handleDownloadPDF = useCallback(() => {
    const pdfUrl = offerLetterApi.getOfferLetterPdfUrl(token);
    window.open(pdfUrl, "_blank");
  }, [token]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
            <p className="text-gray-600 text-center">
              Loading offer details...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token / Not Found state - Requirements: 8.4
  if (error || !offerLetter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
              Offer Not Found
            </h2>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              This offer letter is no longer available or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const offerLetterData = toOfferLetterData(offerLetter);
  const brandingData = toBrandingData(offerLetter.branding);
  const isPending = offerLetter.status === "pending";
  const isAccepted = offerLetter.status === "accepted";
  const isRejected = offerLetter.status === "rejected";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Property Unavailable Banner - Requirements: 10.1, 12.2 */}
      {/* Only show if property is unavailable AND this offer is NOT the winning one */}
      {!offerLetter.isPropertyAvailable &&
        offerLetter.status !== "selected" &&
        offerLetter.paymentStatus !== "fully_paid" && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">
                This property is no longer available. Another applicant has
                secured it.
              </span>
            </div>
          </div>
        )}

      {/* Status Banner */}
      {/* Winner Celebration Banner - shows when tenant has secured the property */}
      {(offerLetter.status === "selected" ||
        offerLetter.paymentStatus === "fully_paid") && (
        <div className="bg-emerald-600 border-b border-emerald-700 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-white">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">
              Property secured — tenancy starts{" "}
              {new Date(offerLetter.tenancyStartDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
      {isAccepted &&
        offerLetter.status !== "selected" &&
        offerLetter.paymentStatus !== "fully_paid" && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                You have accepted this offer. Complete your payment to secure
                the property.
              </span>
            </div>
          </div>
        )}
      {isRejected && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">You have rejected this offer</span>
          </div>
        </div>
      )}

      {/* Offer Letter Document - Requirements: 8.2 */}
      <div className="py-8">
        <div className="bg-white shadow-lg max-w-[650px] mx-auto">
          <OfferLetterDocument
            data={offerLetterData}
            mode="view"
            branding={brandingData}
            template={toTemplate(offerLetter)}
          />
        </div>
      </div>

      {/* Action Section - Requirements: 8.3, 8.5 */}
      {isPending && (
        <div className="max-w-[650px] mx-auto px-8 sm:px-12 pb-12">
          <p className="text-[11px] leading-[16px] text-gray-600 mb-4">
            By clicking &quot;Accept Offer&quot;, you confirm that you have
            read, understood, and agree to the terms and conditions outlined in
            this offer letter.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setShowRejectModal(true)}
                variant="outline"
                className="flex-1 sm:flex-none h-9 text-sm min-w-[120px]"
                disabled={!offerLetter.isPropertyAvailable}
              >
                Decline Offer
              </Button>
              <Button
                onClick={handleAcceptClick}
                className="flex-1 sm:flex-none h-9 text-sm bg-[#FF5722] hover:bg-[#E64A19] min-w-[120px]"
                disabled={!offerLetter.isPropertyAvailable}
              >
                Accept Offer
              </Button>
            </div>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="h-9 text-sm flex items-center gap-2 w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Download button for accepted/rejected offers */}
      {!isPending && (
        <div className="max-w-[650px] mx-auto px-8 sm:px-12 pb-12">
          <div className="flex gap-3">
            {isAccepted && (
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="h-9 text-sm flex items-center gap-2 bg-[#FF5722] hover:bg-[#E64A19]"
              >
                View Invoice
              </Button>
            )}
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="h-9 text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* OTP Verification Modal - Requirements: 9.1, 9.2 */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        token={token}
        phoneLastFour={phoneLastFour}
        onSuccess={handleOTPSuccess}
      />

      {/* Reject Confirmation Modal - Requirements: 9.6 */}
      <RejectConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        token={token}
        onConfirm={handleRejectConfirm}
      />

      {/* Payment Invoice Modal */}
      {offerLetter && (
        <PaymentInvoiceModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          token={token}
          offerData={{
            tenantName: offerLetter.applicantName,
            tenantEmail: offerLetter.applicantEmail,
            tenantPhone: offerLetter.applicantPhone,
            propertyName: offerLetter.propertyName,
            propertyAddress: offerLetter.propertyAddress,
            landlordName: offerLetter.branding?.businessName,
            rentAmount: offerLetter.rentAmount,
            rentFrequency: offerLetter.rentFrequency,
            serviceCharge: offerLetter.serviceCharge,
            cautionDeposit: offerLetter.cautionDeposit,
            legalFee: offerLetter.legalFee,
            agencyFee:
              typeof offerLetter.agencyFee === "number"
                ? offerLetter.agencyFee
                : undefined,
            totalAmount: offerLetter.totalAmount || 0,
            amountPaid: offerLetter.amountPaid || 0,
            outstandingBalance: offerLetter.outstandingBalance,
            applicantEmail: offerLetter.applicantEmail,
            createdAt: offerLetter.createdAt,
            branding: offerLetter.branding
              ? {
                  businessName: offerLetter.branding.businessName,
                  businessAddress: offerLetter.branding.businessAddress,
                  contactEmail: offerLetter.branding.contactEmail,
                  contactPhone: offerLetter.branding.contactPhone,
                  letterhead: offerLetter.branding.letterhead,
                  footerColor: offerLetter.branding.footerColor,
                  headingFont: offerLetter.branding.headingFont,
                  bodyFont: offerLetter.branding.bodyFont,
                }
              : undefined,
          }}
        />
      )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={handleSuccessModalClose}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Offer Confirmed
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                Your acceptance has been recorded successfully.
              </p>
              <p className="text-sm text-gray-600 mb-2">
                An invoice and payment link will be sent to your WhatsApp
                shortly.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Please complete your payment to proceed with your tenancy.
              </p>
              <Button
                onClick={handleSuccessModalClose}
                className="w-full h-10 bg-[#FF5722] hover:bg-[#E64A19]"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Public Offer Letter Page
 * Requirements: 8.1
 */
export default function OfferLetterPage() {
  return <OfferLetterPageContent />;
}
