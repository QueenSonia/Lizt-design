"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import {
  OfferLetterDocument,
  OfferLetterData,
} from "@/components/OfferLetterDocument";
import { useLandlordBranding } from "@/hooks/useLandlordBranding";
import {
  offerLetterApi,
  type OfferLetterResponse,
} from "@/services/offer-letters";

export type { OfferLetterData };

// Print styles to ensure full document is captured
const printStyles = `
  @media print {
    /* Reset body and html for printing */
    html, body {
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Hide everything except the modal content */
    body > *:not(.offer-letter-modal-container) {
      display: none !important;
    }
    
    /* Remove modal backdrop and positioning */
    .offer-letter-modal-container {
      position: static !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      display: block !important;
      height: auto !important;
      overflow: visible !important;
    }
    
    /* Remove modal styling constraints */
    .offer-letter-modal {
      position: static !important;
      background: white !important;
      padding: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      max-width: 100% !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      margin: 0 !important;
    }
    
    /* Remove ALL height/overflow constraints from content container */
    .offer-letter-modal-content {
      overflow: visible !important;
      max-height: none !important;
      height: auto !important;
      display: block !important;
    }
    
    /* Ensure document prints without page breaks in wrong places */
    .offer-letter-print-root {
      page-break-inside: avoid;
      height: auto !important;
      overflow: visible !important;
    }
    
    /* Hide buttons and controls */
    .print\\:hidden {
      display: none !important;
    }
  }
`;

// Inject print styles on mount
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = printStyles;
  document.head.appendChild(styleElement);
}

interface OfferLetterViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: OfferLetterData;
  token?: string; // Optional token for backend PDF download
  stampType?: "accepted" | "rejected";
  stampMetadata?: {
    acceptedAt?: string;
    rejectedAt?: string;
    signedByPhone?: string;
  };
}

export function OfferLetterViewModal({
  isOpen,
  onClose,
  data,
  token,
}: OfferLetterViewModalProps) {
  // Fetch landlord's branding data (logo, signature, etc.)
  const { branding } = useLandlordBranding();

  // State for fetched offer letter data (includes customizations)
  const [offerLetterData, setOfferLetterData] =
    useState<OfferLetterResponse | null>(null);
  const [isLoadingOfferLetter, setIsLoadingOfferLetter] = useState(false);

  // Fetch offer letter data from backend if token is provided
  useEffect(() => {
    const fetchOfferLetter = async () => {
      if (!token || !isOpen) return;

      console.log("=== FETCHING OFFER LETTER DATA ===");
      console.log("Token:", token);

      setIsLoadingOfferLetter(true);
      try {
        const response = await offerLetterApi.getOfferLetterByToken(token);
        console.log("Offer letter fetched successfully:", {
          id: response.id,
          status: response.status,
          hasContentSnapshot: !!response.contentSnapshot,
          hasTermsOfTenancy: !!response.termsOfTenancy,
          termsCount: response.termsOfTenancy?.length,
        });
        setOfferLetterData(response);
      } catch (error) {
        console.error("Error fetching offer letter:", error);
        // Fall back to using the data prop if fetch fails
        setOfferLetterData(null);
      } finally {
        setIsLoadingOfferLetter(false);
      }
    };

    fetchOfferLetter();
  }, [token, isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle download as PDF
  const handleDownload = () => {
    console.log("=== OFFER LETTER DOWNLOAD DEBUG ===");
    console.log("Token:", token);
    console.log("Data:", {
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      propertyName: data.propertyName,
      rentAmount: data.rentAmount,
      status: data.status,
    });

    // If token is available, use backend PDF generation
    if (token) {
      const pdfUrl = `/api/proxy/offer-letters/${token}/pdf`;
      console.log("Using backend PDF generation");
      console.log("PDF URL:", pdfUrl);
      console.log("Opening URL in new tab...");

      try {
        window.open(pdfUrl, "_blank");
        console.log("window.open() called successfully");
      } catch (error) {
        console.error("Error opening PDF URL:", error);
      }
      return;
    }

    console.log("No token available, using browser print fallback");

    // Fallback to browser print for preview mode (no token)
    // Generate filename
    const tenantName = data.applicantName.replace(/\s+/g, "-");
    const propertyName = data.propertyName
      .replace(/\s+/g, "-")
      .substring(0, 30);
    const filename = `Offer-Letter-${tenantName}-${propertyName}`;

    console.log("Generated filename:", filename);

    // Set document title for PDF filename
    const originalTitle = document.title;
    document.title = filename;

    // Trigger browser print dialog
    console.log("Triggering browser print dialog...");
    window.print();

    // Restore original title
    setTimeout(() => {
      document.title = originalTitle;
      console.log("Document title restored");
    }, 100);
  };

  return (
    <div
      className="offer-letter-modal-container fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="offer-letter-modal relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden my-8 print:max-h-none print:overflow-visible print:shadow-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close and Download buttons */}
        <div className="absolute top-4 right-4 z-10 flex gap-2 print:hidden">
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Download PDF"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="offer-letter-modal-content overflow-y-auto max-h-[90vh] bg-gray-100 p-6 md:p-8 print:p-0 print:bg-white print:overflow-visible print:max-h-none">
          {isLoadingOfferLetter ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-200 border-t-orange-500" />
            </div>
          ) : (
            /* Use canonical component in VIEW mode with paper styling */
            <div className="relative bg-white shadow-xl rounded-lg overflow-hidden max-w-4xl mx-auto offer-letter-print-root print:shadow-none print:rounded-none">
              <OfferLetterDocument
                data={
                  offerLetterData
                    ? {
                        applicantName: offerLetterData.applicantName,
                        applicantEmail: offerLetterData.applicantEmail,
                        applicantGender: offerLetterData.applicantGender,
                        propertyName: offerLetterData.propertyName,
                        rentAmount: offerLetterData.rentAmount,
                        rentFrequency: offerLetterData.rentFrequency,
                        serviceCharge: offerLetterData.serviceCharge,
                        tenancyStartDate: offerLetterData.tenancyStartDate,
                        tenancyEndDate: offerLetterData.tenancyEndDate,
                        cautionDeposit: offerLetterData.cautionDeposit,
                        legalFee: offerLetterData.legalFee,
                        agencyFee: offerLetterData.agencyFee,
                        tenantAddress: offerLetterData.tenantAddress,
                        createdAt: offerLetterData.createdAt,
                        status: offerLetterData.status as
                          | "pending"
                          | "accepted"
                          | "selected"
                          | "rejected"
                          | undefined,
                        signedAt: offerLetterData.acceptedAt,
                        otp: offerLetterData.acceptanceOtp,
                        signedByPhone: offerLetterData.acceptedByPhone,
                      }
                    : data
                }
                mode="view"
                branding={branding}
                template={
                  offerLetterData?.termsOfTenancy &&
                  offerLetterData?.contentSnapshot
                    ? {
                        offerTitlePattern:
                          offerLetterData.contentSnapshot.offer_title || "",
                        introTextPattern:
                          offerLetterData.contentSnapshot.intro_text || "",
                        agreementText:
                          offerLetterData.contentSnapshot.agreement_text || "",
                        closingText:
                          offerLetterData.contentSnapshot.closing_text || "",
                        forLandlordText:
                          offerLetterData.contentSnapshot.for_landlord_text ||
                          "",
                        termsOfTenancy: offerLetterData.termsOfTenancy.map(
                          (term) => ({
                            title: term.title,
                            content: term.content.includes("\n")
                              ? term.content
                                  .split("\n")
                                  .filter((line: string) => line.trim())
                              : term.content,
                          }),
                        ),
                        footnotes: [
                          "Caution/Security Deposit: Refundable deposit held as security against damages or unpaid rent. Returned at end of tenancy subject to property condition and rent payment status.",
                        ],
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
