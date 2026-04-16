"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Send, Download, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OfferLetterDocument,
  OfferLetterData,
} from "@/components/OfferLetterDocument";
import type { ContentSnapshot, RentFrequency } from "@/services/offer-letters";
import {
  useCreateOfferLetterMutation,
  useSendOfferLetterMutation,
  offerLetterApi,
} from "@/services/offer-letters";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLandlordBranding } from "@/hooks/useLandlordBranding";
import { useLandlordTemplate } from "@/hooks/useLandlordTemplate";
import { EditModeBanner } from "@/components/EditModeBanner";
import {
  mergeTemplateWithData,
  type TemplateMergeData,
} from "@/utils/offer-letter-template-utils";
import { DEFAULT_TEMPLATE } from "@/types/offer-letter-template";

export interface TermsOfTenancy {
  title: string;
  content: string | string[];
}

export interface OfferLetterPreviewProps {
  data: OfferLetterData;
  applicantPhone: string;
  kycApplicationId: string;
  propertyId: string;
  onBack: () => void;
  onComplete: () => void; // Called after successful send
  initialSavedOfferToken?: string; // Token of an already-saved offer letter (for viewing/downloading)
  initialSavedOfferId?: string; // ID of an already-saved offer letter
}

export function OfferLetterPreview({
  data,
  applicantPhone,
  kycApplicationId,
  propertyId,
  onBack,
  onComplete,
  initialSavedOfferToken,
  initialSavedOfferId,
}: OfferLetterPreviewProps) {
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [termsOfTenancy, setTermsOfTenancy] = useState<TermsOfTenancy[]>([]);
  const [contentSnapshot, setContentSnapshot] = useState<
    ContentSnapshot | undefined
  >(undefined);

  // State machine for tracking preview modes
  // Transitions: view -> edit -> saving -> saved -> sending -> (close modal)
  // From saved: can go back to edit via "Edit" button
  // Error transitions: saving -> edit (on error), sending -> saved (on error)
  // Initial mode: If there's an initialSavedOfferToken, start in "saved" mode so all
  // action buttons (Edit, Download, Send) are available immediately.
  // Otherwise, start in "edit" mode (new offer, ready to save)
  const [mode, setMode] = useState<
    "view" | "edit" | "saving" | "saved" | "sending"
  >(initialSavedOfferToken ? "saved" : "edit");

  // State variables to store the saved offer letter ID and token
  const [savedOfferId, setSavedOfferId] = useState<string | null>(
    initialSavedOfferId || null,
  );
  const [savedOfferToken, setSavedOfferToken] = useState<string | null>(
    initialSavedOfferToken || null,
  );

  // Error state for displaying error messages to the user
  const [error, setError] = useState<string | null>(null);

  // Initialize the create offer letter mutation
  const createOfferLetterMutation = useCreateOfferLetterMutation();

  // Initialize the send offer letter mutation
  const sendOfferLetterMutation = useSendOfferLetterMutation();

  // Suppress unused variable warnings
  void error;
  void initialSavedOfferToken;

  // Fetch landlord's branding data (logo, signature, etc.)
  const { branding } = useLandlordBranding();

  // Fetch landlord's offer letter template
  const { template } = useLandlordTemplate();

  // Initialize termsOfTenancy from the landlord's template (or DEFAULT_TEMPLATE)
  // Requirements: 7.1, 7.4
  useEffect(() => {
    const effectiveTemplate = template || DEFAULT_TEMPLATE;
    setTermsOfTenancy(effectiveTemplate.termsOfTenancy.map((t) => ({ ...t })));
  }, [template]);

  const handleTermsUpdate = (terms: TermsOfTenancy[]) => {
    setTermsOfTenancy(terms);
  };

  const handleContentUpdate = (snapshot: ContentSnapshot) => {
    setContentSnapshot(snapshot);
  };

  /**
   * Handle entering edit mode from view or saved state
   * Requirements: 8.1, 8.2
   */
  const handleEdit = () => {
    setMode("edit");
  };

  /**
   * Build TemplateMergeData from the offer letter data for placeholder replacement.
   * Requirements: 7.1, 7.2
   */
  const buildMergeData = (): TemplateMergeData => {
    const nameParts = data.applicantName.split(" ");
    const lastName = nameParts[nameParts.length - 1];
    const salutation =
      data.applicantGender?.toLowerCase() === "female" ? "Ms" : "Mr";

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      const suffix =
        day === 1 || day === 21 || day === 31
          ? "st"
          : day === 2 || day === 22
            ? "nd"
            : day === 3 || day === 23
              ? "rd"
              : "th";
      return `${month} ${day}${suffix}, ${year}`;
    };

    const calculateTenancyTerm = () => {
      if (!data.tenancyEndDate) return "One Year Fixed";
      const start = new Date(data.tenancyStartDate);
      const end = new Date(data.tenancyEndDate);
      const months = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      if (months >= 12) {
        const years = Math.floor(months / 12);
        return `${years} Year${years > 1 ? "s" : ""} Fixed`;
      }
      return `${months} Month${months > 1 ? "s" : ""} Fixed`;
    };

    const tenancyPeriod = `${formatDate(data.tenancyStartDate)}${data.tenancyEndDate ? ` to ${formatDate(data.tenancyEndDate)}` : ""}`;

    return {
      propertyName: data.propertyName,
      tenantName: data.applicantName,
      tenantAddress: data.tenantAddress || "",
      salutation,
      lastName,
      rentAmount: `₦${Number(data.rentAmount).toLocaleString()}`,
      serviceCharge: data.serviceCharge
        ? `₦${Number(data.serviceCharge).toLocaleString()}`
        : "",
      cautionDeposit: data.cautionDeposit
        ? `₦${Number(data.cautionDeposit).toLocaleString()}`
        : "",
      legalFee: data.legalFee
        ? `₦${Number(data.legalFee).toLocaleString()}`
        : "",
      agencyFee:
        typeof data.agencyFee === "number"
          ? `₦${Number(data.agencyFee).toLocaleString()}`
          : data.agencyFee ||
            "As agreed between tenant and agent (paid directly to agent)",
      tenancyTerm: calculateTenancyTerm(),
      tenancyPeriod,
      issuedDate: formatDate(data.createdAt || new Date().toISOString()),
    };
  };

  /**
   * Handle save operation - saves the offer letter to the backend
   * Requirements: 7.1, 7.2, 7.4, 7.5, 8.6, 8.7
   *
   * This function:
   * 1. Sets mode to 'saving' to show loading state
   * 2. Uses mergeTemplateWithData to produce the content snapshot if not already set
   * 3. Builds CreateOfferLetterRequest with template-based terms
   * 4. On success: stores ID and token, transitions to 'saved' mode
   * 5. On error: displays error toast, remains in 'edit' mode
   */
  const handleSave = async () => {
    // Clear any previous error
    setError(null);

    // Transition to saving mode to show loading state
    setMode("saving");

    // Use the landlord's template (or DEFAULT_TEMPLATE) for merge
    const effectiveTemplate = template || DEFAULT_TEMPLATE;

    // Build the content snapshot from the template if the user hasn't edited
    // Requirements: 7.2, 7.5
    let snapshotToSend = contentSnapshot;
    if (!snapshotToSend) {
      const mergeData = buildMergeData();
      const merged = mergeTemplateWithData(effectiveTemplate, mergeData);
      snapshotToSend = {
        offer_title: merged.offerTitlePattern.toUpperCase(),
        intro_text: merged.introTextPattern,
        agreement_text: merged.agreementText,
        closing_text: merged.closingText,
        for_landlord_text: merged.forLandlordText,
        tenant_address: mergeData.tenantAddress || "",
        permitted_use:
          "Residential, but office use is permitted provided it is carried on in a quiet and discreet manner.",
        rent_amount_formatted: mergeData.rentAmount,
        service_charge_formatted: mergeData.serviceCharge,
        caution_deposit_formatted: mergeData.cautionDeposit,
        legal_fee_formatted: mergeData.legalFee,
        agency_fee_formatted: mergeData.agencyFee,
        tenancy_term: mergeData.tenancyTerm,
        tenancy_period: mergeData.tenancyPeriod,
      };
    }

    // Convert termsOfTenancy to the format expected by the API
    // The API expects content as a string, so we join array content with newlines
    const formattedTerms = termsOfTenancy.map((term) => ({
      title: term.title,
      content: Array.isArray(term.content)
        ? term.content.join("\n")
        : term.content,
    }));

    // Build the CreateOfferLetterRequest with sendNotification: false
    // This ensures the tenant is not notified until explicitly requested
    const request = {
      kycApplicationId,
      propertyId,
      rentAmount: data.rentAmount,
      rentFrequency: data.rentFrequency as RentFrequency,
      serviceCharge: data.serviceCharge,
      tenancyStartDate: data.tenancyStartDate,
      tenancyEndDate: data.tenancyEndDate || data.tenancyStartDate, // Fallback if not provided
      cautionDeposit: data.cautionDeposit,
      legalFee: data.legalFee,
      agencyFee:
        typeof data.agencyFee === "string"
          ? parseFloat(data.agencyFee) || undefined
          : data.agencyFee,
      termsOfTenancy: formattedTerms,
      contentSnapshot: snapshotToSend,
      sendNotification: false, // Key requirement: save without sending notification
    };

    try {
      // Call the createOfferLetter mutation
      const response = await createOfferLetterMutation.mutateAsync({
        data: request,
        applicantName: data.applicantName,
      });

      // On success: store the returned ID and token (Requirements 5.1, 5.2)
      setSavedOfferId(response.id);
      setSavedOfferToken(response.token);

      // Transition to 'saved' mode (Requirement 3.1, 5.3)
      setMode("saved");
    } catch (err) {
      // On error: display error message and remain in 'edit' mode (Requirement 2.5)
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save offer letter";
      setError(errorMessage);
      toast.error(errorMessage);

      // Remain in edit mode to allow retry
      setMode("edit");
    }
  };

  const handleSendClick = () => {
    setShowSendConfirmation(true);
  };

  /**
   * Handle download operation - downloads the pre-generated PDF
   * Requirements: 3.4
   * Property 4: Download Uses Saved Token
   *
   * This function:
   * 1. Uses savedOfferToken to construct the PDF download URL
   * 2. Triggers a browser download by opening the URL in a new tab
   * 3. Handles errors gracefully with toast notifications
   */
  const handleDownload = () => {
    // Ensure we have a saved offer token before attempting to download
    if (!savedOfferToken) {
      toast.error("Cannot download: offer letter has not been saved yet");
      return;
    }

    try {
      // Get the PDF URL using the saved token
      const pdfUrl = offerLetterApi.getOfferLetterPdfUrl(savedOfferToken);

      // Trigger browser download by opening the URL in a new tab
      // The backend will redirect to the actual PDF file or serve it directly
      window.open(pdfUrl, "_blank");
    } catch (err) {
      // Handle any errors gracefully
      const errorMessage =
        err instanceof Error ? err.message : "Failed to download PDF";
      toast.error(errorMessage);
    }
  };

  /**
   * Handle send operation - sends the offer letter via WhatsApp
   * Requirements: 3.3, 3.5, 3.6
   *
   * This function:
   * 1. Closes the confirmation dialog
   * 2. Sets mode to 'sending' to show loading state
   * 3. Calls the send mutation with savedOfferId
   * 4. On success: calls onComplete() callback to close the modal
   * 5. On error: displays error toast, remains in 'saved' mode
   */
  const handleConfirmSend = async () => {
    setShowSendConfirmation(false);

    // Ensure we have a saved offer ID before attempting to send
    if (!savedOfferId) {
      toast.error("Cannot send: offer letter has not been saved yet");
      return;
    }

    // Clear any previous error
    setError(null);

    // Transition to sending mode to show loading state
    setMode("sending");

    try {
      // Call the send mutation with the saved offer ID
      await sendOfferLetterMutation.mutateAsync({
        offerId: savedOfferId,
        applicantName: data.applicantName,
      });

      // On success: call onComplete callback to close the modal (Requirement 3.5)
      onComplete();
    } catch (err) {
      // On error: display error message and remain in 'saved' mode (Requirement 3.6)
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send offer letter";
      setError(errorMessage);
      // Note: toast.error is already called by the mutation's onError handler

      // Remain in saved mode to allow retry
      setMode("saved");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Edit Mode Banner - shown when in edit mode */}
      <EditModeBanner visible={mode === "edit"} />

      {/* Action Bar */}
      <div className="sticky top-0 bg-gray-100 px-4 md:px-6 py-3 flex items-center justify-between z-10 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* View mode: show Edit button */}
          {mode === "view" && (
            <Button
              size="sm"
              onClick={handleEdit}
              className="bg-[#FF5000] hover:bg-[#E64800] text-white flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </Button>
          )}

          {/* Edit mode: show Save button */}
          {/* Saving mode: show Save button with loading state */}
          {(mode === "edit" || mode === "saving") && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={mode === "saving"}
              className="bg-[#FF5000] hover:bg-[#E64800] text-white flex items-center gap-2"
            >
              <span>{mode === "saving" ? "Saving..." : "Save"}</span>
            </Button>
          )}

          {/* Saved mode: show Download, Send, and Edit buttons */}
          {/* Sending mode: show buttons with Send loading state */}
          {(mode === "saved" || mode === "sending") && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                disabled={mode === "sending"}
                className="flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={mode === "sending"}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSendClick}
                disabled={mode === "sending"}
                className="bg-[#FF5000] hover:bg-[#E64800] text-white flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{mode === "sending" ? "Sending..." : "Send"}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Document Preview */}
      <div className="flex-1 bg-gray-100 overflow-y-auto">
        <div className="max-w-4xl mx-auto my-6 md:my-8 px-4">
          {/* Paper-like container */}
          <div className="bg-white shadow-lg rounded-lg">
            <OfferLetterDocument
              data={data}
              mode={mode === "edit" || mode === "saving" ? "edit" : "view"}
              template={template}
              onTermsUpdate={handleTermsUpdate}
              onContentUpdate={handleContentUpdate}
              branding={branding}
              showPlaceholders={false}
              allowStructuralEdits={false}
            />
          </div>
        </div>
      </div>

      {/* Send Confirmation Dialog */}
      <AlertDialog
        open={showSendConfirmation}
        onOpenChange={setShowSendConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Offer Letter?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-muted-foreground text-sm">
                You&apos;re about to send this offer letter to{" "}
                <span className="font-medium text-gray-900">
                  {data.applicantName}
                </span>{" "}
                via WhatsApp at{" "}
                <span className="font-medium text-gray-900">
                  {applicantPhone}
                </span>
                .
                <br />
                <span className="font-semibold text-gray-900">
                  Once sent, the content cannot be edited.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={mode === "saving" || mode === "sending"}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSend}
              disabled={mode === "saving" || mode === "sending"}
              className="bg-[#FF5000] hover:bg-[#E64800] text-white"
            >
              {mode === "sending" ? "Sending..." : "Send Offer Letter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
