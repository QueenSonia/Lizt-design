"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoiceDocument, InvoiceData } from "@/components/InvoiceDocument";
import { paymentApi } from "@/services/payments/api";
import { toast } from "sonner";
import PaystackPop from "@paystack/inline-js";

interface PaymentInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  offerData: {
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
    propertyName: string;
    propertyAddress?: string;
    landlordName?: string;
    rentAmount: number;
    rentFrequency?: string;
    serviceCharge?: number;
    cautionDeposit?: number;
    legalFee?: number;
    agencyFee?: number;
    totalAmount: number;
    amountPaid?: number;
    outstandingBalance?: number;
    applicantEmail: string;
    createdAt?: string;
    branding?: {
      businessName?: string;
      businessAddress?: string;
      contactEmail?: string;
      contactPhone?: string;
      letterhead?: string;
      footerColor?: string;
      headingFont?: string;
      bodyFont?: string;
    };
  };
}

/**
 * Payment Invoice Modal Component
 * Now uses InvoiceDocument for consistent styling with the invoice page.
 */
export function PaymentInvoiceModal({
  isOpen,
  onClose,
  token,
  offerData,
}: PaymentInvoiceModalProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = useCallback(async () => {
    setIsProcessing(true);

    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = `${origin}/offer-letters/${token}/payment-callback`;

      const response = await paymentApi.initiatePayment(token, {
        amount: offerData.totalAmount,
        email: offerData.applicantEmail,
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
  }, [offerData, token, router]);

  if (!isOpen) return null;

  // Build line items from offer data (same logic as the invoice page)
  const lineItems: Array<{ description: string; amount: number }> = [];
  if (offerData.rentAmount) {
    lineItems.push({
      description: `Rent — ${offerData.rentFrequency || "Annual"}`,
      amount: offerData.rentAmount,
    });
  }
  if (offerData.serviceCharge) {
    lineItems.push({
      description: "Service Charge",
      amount: offerData.serviceCharge,
    });
  }
  if (offerData.cautionDeposit) {
    lineItems.push({
      description: "Caution Deposit (Refundable)",
      amount: offerData.cautionDeposit,
    });
  }
  if (offerData.legalFee) {
    lineItems.push({ description: "Legal Fee", amount: offerData.legalFee });
  }
  if (offerData.agencyFee) {
    lineItems.push({
      description: "Agency Fee",
      amount: offerData.agencyFee,
    });
  }

  const totalAmount = offerData.totalAmount || 0;
  const amountPaid = offerData.amountPaid || 0;
  const amountDue = offerData.outstandingBalance ?? totalAmount - amountPaid;
  const isFullyPaid = amountDue <= 0 && amountPaid > 0;

  const invoiceData: InvoiceData = {
    invoiceNumber: `INV-${token.substring(0, 8).toUpperCase()}`,
    invoiceDate: offerData.createdAt || new Date().toISOString(),
    status: isFullyPaid
      ? "Paid"
      : amountPaid > 0
        ? "Partially Paid"
        : "Pending",
    tenantName: offerData.tenantName,
    tenantEmail: offerData.applicantEmail,
    tenantPhone: offerData.tenantPhone || "",
    propertyName: offerData.propertyName,
    propertyAddress: offerData.propertyAddress || "",
    lineItems,
    subtotal: totalAmount,
    total: totalAmount,
    amountPaid,
    amountDue,
    branding: offerData.branding,
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-hidden shadow-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Invoice Document — same component as the invoice page */}
          <InvoiceDocument data={invoiceData} />

          {/* Pay Now section — only show if not fully paid */}
          {!isFullyPaid && (
            <div className="px-8 md:px-12 pb-8 border-t border-gray-200">
              <div className="flex items-center justify-between pt-6">
                <p className="text-xs text-gray-500">Secured by Paystack</p>
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
    </div>
  );
}
