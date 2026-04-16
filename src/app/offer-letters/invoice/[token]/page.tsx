"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOfferLetterByToken } from "@/services/offer-letters/query";
import { invoiceApi } from "@/services/invoices/api";
import { InvoiceDocument, InvoiceData } from "@/components/InvoiceDocument";
import { paymentApi } from "@/services/payments/api";
import { toast } from "sonner";
import PaystackPop from "@paystack/inline-js";

/**
 * Payment Invoice Page
 * Route: /offer-letters/invoice/[token]
 * Shows payment breakdown using the same InvoiceDocument styling as the modal
 * and allows tenant to proceed to Paystack
 */
export default function PaymentInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: offerLetter,
    isLoading,
    error: fetchError,
  } = useOfferLetterByToken(token);

  // Track invoice view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        const ipAddress = await invoiceApi.getUserIP();
        await invoiceApi.trackInvoiceView(token, ipAddress);
      } catch (error) {
        console.error("Failed to track invoice view:", error);
      }
    };

    if (token && offerLetter) {
      trackView();
    }
  }, [token, offerLetter]);

  const handlePayNow = useCallback(async () => {
    if (!offerLetter) return;
    setIsProcessing(true);

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = `${origin}/offer-letters/${token}/payment-callback`;

      const response = await paymentApi.initiatePayment(token, {
        amount: offerLetter.totalAmount,
        email: offerLetter.applicantEmail,
        callbackUrl,
      });

      if (!response.accessCode) {
        throw new Error("No access code received from payment service");
      }

      const popup = new PaystackPop();
      popup.resumeTransaction(response.accessCode, {
        onSuccess: (transaction: { reference: string }) => {
          toast.success("Payment successful! Verifying...");
          router.push(
            `/offer-letters/${token}/payment-callback?reference=${transaction.reference}`,
          );
        },
        onCancel: () => {
          toast.info("Payment cancelled");
          paymentApi.trackPaymentCancelled(token);
          setIsProcessing(false);
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    } catch (err: unknown) {
      console.error("Failed to initiate payment:", err);
      const error = err as {
        response?: {
          data?: { message?: string | string[]; error?: string };
          status?: number;
        };
      };
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to initiate payment. Please try again.";
      toast.error(
        Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage,
      );
      setIsProcessing(false);
    }
  }, [offerLetter, token, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
            <p className="text-gray-600 text-center">Loading invoice...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (fetchError || !offerLetter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
              Invoice Not Available
            </h2>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              Unable to load payment invoice. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build line items from offer letter data
  const lineItems: Array<{ description: string; amount: number }> = [];
  if (offerLetter.rentAmount) {
    lineItems.push({
      description: `Rent — ${offerLetter.rentFrequency || "Annual"}`,
      amount: offerLetter.rentAmount,
    });
  }
  if (offerLetter.serviceCharge) {
    lineItems.push({
      description: "Service Charge",
      amount: offerLetter.serviceCharge,
    });
  }
  if (offerLetter.cautionDeposit) {
    lineItems.push({
      description: "Caution Deposit (Refundable)",
      amount: offerLetter.cautionDeposit,
    });
  }
  if (offerLetter.legalFee) {
    lineItems.push({ description: "Legal Fee", amount: offerLetter.legalFee });
  }
  if (offerLetter.agencyFee) {
    lineItems.push({
      description: "Agency Fee",
      amount: offerLetter.agencyFee,
    });
  }

  const totalAmount = offerLetter.totalAmount || 0;
  const amountPaid = offerLetter.amountPaid || 0;
  const amountDue = offerLetter.outstandingBalance || totalAmount - amountPaid;
  const isFullyPaid = amountDue <= 0 && amountPaid > 0;

  const invoiceData: InvoiceData = {
    invoiceNumber: `INV-${token.substring(0, 8).toUpperCase()}`,
    invoiceDate: offerLetter.createdAt || new Date().toISOString(),
    status: isFullyPaid
      ? "Paid"
      : amountPaid > 0
        ? "Partially Paid"
        : "Pending",
    tenantName: offerLetter.applicantName,
    tenantEmail: offerLetter.applicantEmail,
    tenantPhone: offerLetter.applicantPhone || "",
    propertyName: offerLetter.propertyName,
    propertyAddress: offerLetter.propertyAddress || "",
    lineItems,
    subtotal: totalAmount,
    total: totalAmount,
    amountPaid,
    amountDue,
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
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-lg overflow-hidden">
        {/* Invoice Document — same styling as the modal */}
        <InvoiceDocument data={invoiceData} />

        {/* Pay Now section — only show if not fully paid */}
        {!isFullyPaid && (
          <div className="px-8 md:px-12 pb-8 border-t border-gray-200">
            <div className="flex items-center justify-between pt-6">
              <div>
                <p className="text-xs text-gray-500">Secured by Paystack</p>
              </div>
              <Button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Pay Now"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
