"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentApi } from "@/services/payments/api";
import { toast } from "sonner";
import PaystackPop from "@paystack/inline-js";

interface PaymentInvoiceContentProps {
  token: string;
  offerData: {
    tenantName: string;
    propertyName: string;
    landlordName?: string;
    rentAmount: number;
    serviceCharge?: number;
    cautionDeposit?: number;
    legalFee?: number;
    agencyFee?: number;
    totalAmount: number;
    applicantEmail: string;
  };
  onClose?: () => void;
  showCloseButton?: boolean;
}

/**
 * Shared Payment Invoice Content Component
 * Uses Paystack Popup for in-page payment experience
 */
export function PaymentInvoiceContent({
  token,
  offerData,
  onClose,
  showCloseButton = false,
}: PaymentInvoiceContentProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "₦0";
    return `₦${amount.toLocaleString()}`;
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePayNow = useCallback(async () => {
    setIsProcessing(true);

    try {
      // Ensure we have a valid callback URL (still needed for backend)
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = `${origin}/offer-letters/${token}/payment-callback`;

      // Step 1: Initialize transaction on backend
      const response = await paymentApi.initiatePayment(token, {
        amount: offerData.totalAmount,
        email: offerData.applicantEmail,
        callbackUrl,
      });

      if (!response.accessCode) {
        throw new Error("No access code received from payment service");
      }

      // Step 2: Open Paystack Popup instead of redirecting
      const popup = new PaystackPop();
      popup.resumeTransaction(response.accessCode, {
        onSuccess: (transaction: { reference: string }) => {
          // Payment successful - redirect to callback page for verification
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
          // User closed the popup (may or may not have completed payment)
          setIsProcessing(false);
        },
      });
    } catch (err: unknown) {
      console.error("Failed to initiate payment:", err);
      const error = err as {
        response?: {
          data?: {
            message?: string | string[];
            error?: string;
          };
          status?: number;
        };
      };

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (Array.isArray(error.response?.data?.message)
          ? error.response?.data?.message.join(", ")
          : null) ||
        "Failed to initiate payment. Please try again.";

      toast.error(errorMessage);
      setIsProcessing(false);
    }
  }, [offerData, token, router]);

  const currentDate = getCurrentDate();
  const rentAmount = offerData.rentAmount || 0;
  const serviceCharge = offerData.serviceCharge || 0;
  const cautionDeposit = offerData.cautionDeposit || 0;
  const legalFee = offerData.legalFee || 0;
  const totalAmount = offerData.totalAmount || 0;

  return (
    <div className="p-6 sm:p-8">
      {/* Header with close button */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            {offerData.landlordName || "Landlord"}
          </h1>
          <p className="text-sm text-gray-600">Landlord</p>
        </div>
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors -mr-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="border-t-2 border-gray-300 pt-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">
          Payment Invoice
        </h2>

        {/* Tenant & Invoice details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Tenant Name</p>
            <p className="text-sm text-gray-900 font-medium">
              {offerData.tenantName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Date Issued</p>
            <p className="text-sm text-gray-900">{currentDate}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-1">Property</p>
          <p className="text-sm text-gray-900 font-medium">
            {offerData.propertyName}
          </p>
        </div>
      </div>

      {/* Charges breakdown */}
      <div className="mb-6">
        <div className="border-b border-gray-200 pb-3 mb-3">
          <div className="flex justify-between items-center py-2.5">
            <span className="text-sm text-gray-700">Rent</span>
            <span className="text-sm text-gray-900 font-medium">
              {formatCurrency(rentAmount)}
            </span>
          </div>

          {serviceCharge > 0 && (
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm text-gray-700">Service Charge</span>
              <span className="text-sm text-gray-900 font-medium">
                {formatCurrency(serviceCharge)}
              </span>
            </div>
          )}

          {cautionDeposit > 0 && (
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm text-gray-700">
                Caution (Refundable)
              </span>
              <span className="text-sm text-gray-900 font-medium">
                {formatCurrency(cautionDeposit)}
              </span>
            </div>
          )}

          {legalFee > 0 && (
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm text-gray-700">Legal Fee</span>
              <span className="text-sm text-gray-900 font-medium">
                {formatCurrency(legalFee)}
              </span>
            </div>
          )}
        </div>

        {/* Total section */}
        <div className="border-t-2 border-gray-900 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">
              Total Amount Due
            </span>
            <span className="text-2xl font-semibold text-gray-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Action area */}
      <div className="pt-6 border-t border-gray-200">
        <Button
          onClick={handlePayNow}
          disabled={isProcessing}
          className="h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
        >
          {isProcessing ? "Processing..." : "Pay Now"}
        </Button>
        <p className="text-xs text-gray-500 mt-3">Secured by Paystack</p>
      </div>
    </div>
  );
}
