"use client";

import { useParams, useRouter } from "next/navigation";
import { Download, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRenewalInvoiceQuery } from "@/services/renewal-invoice/query";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import PaystackPop from "@paystack/inline-js";
import axiosInstance from "@/services/axios-instance";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import renewalInvoiceApi, {
  type WalletHistoryEntry,
} from "@/services/renewal-invoice/api";

/**
 * Renewal Invoice Display Page
 * Requirements: 4.1-4.8, 9.1, 10.1-10.5, 11.1
 */
export default function RenewalInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [paymentOption, setPaymentOption] = useState<"full" | "custom">("full");
  const [customAmount, setCustomAmount] = useState("");

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletHistory, setWalletHistory] = useState<WalletHistoryEntry[]>([]);
  const [isFetchingWalletHistory, setIsFetchingWalletHistory] = useState(false);

  const handleOpenWalletModal = useCallback(async () => {
    setShowWalletModal(true);
    if (walletHistory.length > 0) return;
    setIsFetchingWalletHistory(true);
    try {
      const entries = await renewalInvoiceApi.getWalletHistory(token);
      setWalletHistory(entries);
    } catch {
      toast.error("Failed to load wallet history");
    } finally {
      setIsFetchingWalletHistory(false);
    }
  }, [token, walletHistory.length]);

  // Fetch invoice data - Requirements: 4.1-4.7, 10.1-10.5
  const { data: invoice, isLoading, error } = useRenewalInvoiceQuery(token);

  /**
   * Format currency with ₦ symbol and thousand separators
   * Requirements: 10.4
   */
  const formatCurrency = useCallback((amount: number | undefined) => {
    if (!amount) return "₦0";
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  /**
   * Format date as human-readable string
   * Requirements: 10.3
   */
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Wallet and balance computed values
  const outstandingBalance = invoice?.outstandingBalance || 0;
  const hasOutstandingBalance = outstandingBalance > 0;
  const walletBalance = invoice?.walletBalance ?? 0;
  const isTenantGenerated = invoice?.tokenType === "tenant";
  const fullPaymentAmount = isTenantGenerated
    ? outstandingBalance
    : invoice?.totalAmount || 0;

  const getPaymentAmount = useCallback(() => {
    switch (paymentOption) {
      case "full":
        return fullPaymentAmount;
      case "custom": {
        const parsed = parseFloat(customAmount.replace(/,/g, ""));
        return isNaN(parsed) ? 0 : parsed;
      }
      default:
        return fullPaymentAmount;
    }
  }, [paymentOption, customAmount, fullPaymentAmount]);

  // Default to 'full' always
  useEffect(() => {
    setPaymentOption("full");
  }, []);

  /**
   * Handle payment initialization with Paystack
   * Requirements: 5.1-5.5
   */
  const handlePayment = useCallback(async () => {
    if (!invoice) return;

    setIsProcessingPayment(true);

    try {
      // Initialize payment with backend
      const paymentAmount = getPaymentAmount();
      const response = await axiosInstance.post<{
        success: boolean;
        data: {
          accessCode: string;
          reference: string;
          authorizationUrl: string;
        };
      }>(`/tenancies/renewal-invoice/${token}/initialize-payment`, {
        email: invoice.tenantEmail,
        paymentOption,
        amount: paymentAmount,
      });

      if (!response.data.data?.accessCode) {
        throw new Error("No access code received from payment service");
      }

      // Open Paystack popup
      const popup = new PaystackPop();
      popup.resumeTransaction(response.data.data.accessCode, {
        onSuccess: async (transaction: { reference: string }) => {
          // Payment successful - verify payment
          toast.success("Payment successful! Verifying...");

          try {
            await axiosInstance.post(
              `/tenancies/renewal-invoice/${token}/verify-payment`,
              {
                reference: transaction.reference,
              },
            );

            // Navigate to success page with enhanced error handling
            try {
              router.push(`/renewal-invoice/${token}/success`);
            } catch (navigationError) {
              // Log navigation error for debugging
              console.error(
                "Navigation to success page failed:",
                navigationError,
              );

              // Log error to backend for monitoring
              axiosInstance
                .post(`/tenancies/renewal-invoice/${token}/log-error`, {
                  error: "navigation_failure",
                  details:
                    navigationError instanceof Error
                      ? navigationError.message
                      : "Unknown navigation error",
                  context: "success_page_navigation",
                  timestamp: new Date().toISOString(),
                })
                .catch(() => {
                  // Silent fail for logging - don't block user experience
                });

              // Fallback to page reload if navigation fails
              toast.info("Redirecting to updated invoice...");
              window.location.reload();
            }
          } catch (verifyError) {
            console.error("Payment verification failed:", verifyError);

            // Log verification error to backend for monitoring
            axiosInstance
              .post(`/tenancies/renewal-invoice/${token}/log-error`, {
                error: "payment_verification_failure",
                details:
                  verifyError instanceof Error
                    ? verifyError.message
                    : "Unknown verification error",
                context: "payment_verification",
                timestamp: new Date().toISOString(),
              })
              .catch(() => {
                // Silent fail for logging - don't block user experience
              });

            toast.error("Payment verification failed. Please contact support.");

            // Fallback to page reload if verification fails
            window.location.reload();
          }
        },
        onCancel: () => {
          toast.info("Payment cancelled");
          setIsProcessingPayment(false);

          // Log cancellation with enhanced error tracking
          axiosInstance
            .post(`/tenancies/renewal-invoice/${token}/log-error`, {
              error: "payment_cancelled",
              details: "User cancelled payment during Paystack flow",
              context: "paystack_cancellation",
              timestamp: new Date().toISOString(),
            })
            .catch(() => {
              // Silent fail for logging - don't block user experience
            });
        },
        onClose: () => {
          setIsProcessingPayment(false);
        },
      });
    } catch (err) {
      console.error("Failed to initiate payment:", err);

      // Log payment initialization error to backend for monitoring
      axiosInstance
        .post(`/tenancies/renewal-invoice/${token}/log-error`, {
          error: "payment_initialization_failure",
          details:
            err instanceof Error ? err.message : "Unknown initialization error",
          context: "paystack_initialization",
          timestamp: new Date().toISOString(),
        })
        .catch(() => {
          // Silent fail for logging - don't block user experience
        });

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initiate payment. Please try again.";
      toast.error(errorMessage);
      setIsProcessingPayment(false);
    }
  }, [
    invoice,
    token,
    router,
    hasOutstandingBalance,
    paymentOption,
    getPaymentAmount,
  ]);

  /**
   * Handle PDF download
   * Requirements: 9.1, 9.2, 9.5
   */
  const handleDownload = useCallback(async () => {
    if (!invoice) return;

    setIsDownloading(true);

    try {
      const response = await axiosInstance.get(
        `/tenancies/renewal-invoice/${token}/download`,
        {
          responseType: "blob",
        },
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename: renewal-invoice-{propertyName}-{date}.pdf
      const propertyName = invoice.propertyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const dateStr = new Date().toISOString().split("T")[0];
      link.setAttribute(
        "download",
        `renewal-invoice-${propertyName}-${dateStr}.pdf`,
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded successfully");
    } catch (err) {
      console.error("Failed to download invoice:", err);
      toast.error("Failed to download invoice. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [invoice, token]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF5722]" />
          <p className="text-sm text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Error state - Requirements: 12.1, 12.3
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Invoice Not Found
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            {error?.message ||
              "This renewal link is invalid or has expired. Please contact your landlord for a new link."}
          </p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isPaid = invoice.paymentStatus === "paid";
  const isPartial = invoice.paymentStatus === "partial";
  const isPendingApproval = invoice.paymentStatus === "pending_approval";

  // Pending approval state
  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Pending Landlord Approval
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Your rent payment request for{" "}
            <strong>{invoice.propertyName}</strong> is awaiting your
            landlord&apos;s approval.
          </p>
          <p className="text-sm text-gray-500">
            You&apos;ll be notified via WhatsApp once your landlord responds.
            This page will become active after approval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Platform layer - Lizt logo */}
        <div className="px-6 py-4">
          <Image
            alt="Lizt"
            className="h-[40px] w-auto"
            src="/lizt.svg"
            width={120}
            height={40}
          />
        </div>

        {/* Document layer - Centered invoice container */}
        <div className="flex justify-center px-4 pb-12">
          <div className="bg-white shadow-sm max-w-[850px] w-full px-8 sm:px-12 py-12 relative">
            {/* Paid Stamp Overlay - Requirements: 10.1, 10.3 */}
            {isPaid && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div
                  className="transform -rotate-12"
                  style={{
                    transform:
                      "rotate(-15deg) translateX(-100px) translateY(-50px)",
                  }}
                >
                  {/* SVG filter for distressed effect */}
                  <svg width="0" height="0" className="absolute">
                    <defs>
                      <filter id="distressed-renewal-paid">
                        <feTurbulence
                          type="fractalNoise"
                          baseFrequency="0.04"
                          numOctaves="5"
                          result="noise"
                        />
                        <feDisplacementMap
                          in="SourceGraphic"
                          in2="noise"
                          scale="3"
                          xChannelSelector="R"
                          yChannelSelector="G"
                        />
                      </filter>
                    </defs>
                  </svg>

                  {/* Main stamp container */}
                  <div
                    className="px-8 py-4 border-4 rounded-md"
                    style={{
                      borderColor: "rgba(34, 139, 34, 0.6)",
                      backgroundColor: "transparent",
                      filter: "url(#distressed-renewal-paid)",
                      opacity: 0.85,
                    }}
                  >
                    {/* Inner border for depth */}
                    <div
                      className="absolute inset-1 border-2 rounded-sm pointer-events-none"
                      style={{
                        borderColor: "rgba(34, 139, 34, 0.4)",
                      }}
                    />

                    {/* Stamp content */}
                    <div className="flex flex-col items-center gap-1">
                      {/* Main PAID text */}
                      <div
                        className="text-4xl font-extrabold tracking-widest uppercase"
                        style={{
                          color: "rgba(34, 139, 34, 0.6)",
                          fontFamily:
                            'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif',
                          textShadow: "2px 2px 0px rgba(34, 139, 34, 0.25)",
                          WebkitTextStroke: "1px rgba(34, 139, 34, 0.3)",
                        }}
                      >
                        PAID
                      </div>

                      {/* Payment date */}
                      {invoice.paidAt && (
                        <div
                          className="text-sm font-bold tracking-wide uppercase"
                          style={{
                            color: "rgba(34, 139, 34, 0.6)",
                            fontFamily:
                              'Impact, "Arial Black", "Franklin Gothic Bold", sans-serif',
                            textShadow: "1px 1px 0px rgba(34, 139, 34, 0.25)",
                          }}
                        >
                          {formatDate(invoice.paidAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Landlord logo - Top right of document */}
            {isValidImageSrc(invoice.landlordLogoUrl) && (
              <div className="flex justify-end mb-8">
                <Image
                  alt={invoice.landlordBranding?.businessName || "Landlord"}
                  className="h-[50px] w-auto object-contain"
                  src={invoice.landlordLogoUrl}
                  width={100}
                  height={50}
                />
              </div>
            )}

            {/* Title - Centered within document */}
            <h1 className="text-[16px] leading-[22px] font-bold text-[#1a1b23] mb-8 uppercase text-center">
              {isTenantGenerated
                ? "Outstanding Balance Invoice"
                : "Tenancy Renewal Invoice"}
            </h1>

            {/* Property and Tenant Information */}
            <div className="mb-8 space-y-4">
              <div>
                <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                  Property Name
                </p>
                <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                  {invoice.propertyName}
                </p>
                <p className="text-[11px] leading-[15px] text-[#1a1b23]">
                  {invoice.propertyAddress}
                </p>
              </div>

              <div>
                <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                  Tenant Name
                </p>
                <p className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                  {invoice.tenantName}
                </p>
              </div>

              {!isTenantGenerated && (
                <div>
                  <p className="text-[11px] leading-[15px] text-gray-500 mb-1">
                    Renewal Period
                  </p>
                  <p className="text-[11px] leading-[15px] text-[#1a1b23]">
                    {invoice.renewalPeriod?.startDate
                      ? formatDate(invoice.renewalPeriod.startDate)
                      : "Not available"}{" "}
                    to{" "}
                    {invoice.renewalPeriod?.endDate
                      ? formatDate(invoice.renewalPeriod.endDate)
                      : "Not available"}
                  </p>
                </div>
              )}
            </div>

            {/* Gradient separator line */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

            {/* Breakdown of Charges */}
            <div className="mb-8">
              <h2 className="text-[12px] leading-[16px] font-bold text-[#1a1b23] mb-6 uppercase">
                Breakdown of Charges
              </h2>
              <div className="space-y-4">
                {!isTenantGenerated && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                      Rent
                    </span>
                    <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                      {formatCurrency(invoice.charges?.rentAmount)}
                    </span>
                  </div>
                )}

                {!isTenantGenerated &&
                  (invoice.charges?.serviceCharge ?? 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                        Service Charge
                      </span>
                      <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                        {formatCurrency(invoice.charges.serviceCharge)}
                      </span>
                    </div>
                  )}

                {!isTenantGenerated && (invoice.charges?.legalFee ?? 0) > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                      Legal Fee
                    </span>
                    <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                      {formatCurrency(invoice.charges.legalFee)}
                    </span>
                  </div>
                )}

                {!isTenantGenerated &&
                  (invoice.charges?.otherCharges ?? 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-[11px] leading-[15px] text-[#1a1b23]">
                        Other Charges
                      </span>
                      <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                        {formatCurrency(invoice.charges.otherCharges)}
                      </span>
                    </div>
                  )}

                {walletBalance > 0 && (
                  <button
                    onClick={handleOpenWalletModal}
                    className="flex justify-between items-center py-2 border-b border-gray-200 w-full text-left hover:bg-emerald-50 transition-colors rounded-sm group"
                  >
                    <span className="text-[11px] leading-[15px] text-emerald-600 underline decoration-dotted underline-offset-2 group-hover:decoration-solid">
                      Wallet Credit Applied
                    </span>
                    <span className="text-[11px] leading-[15px] text-emerald-600 font-bold">
                      -{formatCurrency(walletBalance)}
                    </span>
                  </button>
                )}

                {walletBalance < 0 && (
                  <button
                    onClick={handleOpenWalletModal}
                    className="flex justify-between items-center py-2 border-b border-gray-200 w-full text-left hover:bg-orange-50 transition-colors rounded-sm group"
                  >
                    <span className="flex items-center gap-1 text-[#FF5000] font-semibold hover:underline transition-all cursor-pointer">
                      Previous Outstanding Balance
                      <ExternalLink className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] leading-[15px] text-[#1a1b23] font-bold">
                      +{formatCurrency(Math.abs(walletBalance))}
                    </span>
                  </button>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-gray-900">
                  <span className="text-[14px] leading-[18px] text-[#1a1b23] font-bold uppercase">
                    Total Amount Payable
                  </span>
                  <span className="text-[18px] leading-[24px] text-[#1a1b23] font-bold">
                    {formatCurrency(
                      isTenantGenerated
                        ? outstandingBalance
                        : invoice.totalAmount,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Option Selection - only when outstanding balance exists and not yet paid */}
            {hasOutstandingBalance && !isPaid && !isPartial && (
              <>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

                <div className="mb-8">
                  <h2 className="text-[12px] leading-[16px] font-bold text-[#1a1b23] mb-4 uppercase">
                    Choose What You Want to Pay
                  </h2>
                  <div className="space-y-3">
                    {/* Full Payment - hidden for tenant-generated invoices */}
                    {!isTenantGenerated && (
                      <label
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${paymentOption === "full" ? "border-[#FF5722] bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentOption"
                            value="full"
                            checked={paymentOption === "full"}
                            onChange={() => setPaymentOption("full")}
                            className="w-4 h-4 text-[#FF5722] accent-[#FF5722]"
                          />
                          <div>
                            <p className="text-[12px] leading-[16px] font-semibold text-[#1a1b23]">
                              Full Payment
                            </p>
                          </div>
                        </div>
                        <span className="text-[12px] leading-[16px] font-bold text-[#1a1b23]">
                          {formatCurrency(fullPaymentAmount)}
                        </span>
                      </label>
                    )}

                    {/* Custom Amount */}
                    <label
                      className={`flex items-start justify-between p-4 border rounded-lg cursor-pointer transition-colors ${paymentOption === "custom" ? "border-[#FF5722] bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="custom"
                          checked={paymentOption === "custom"}
                          onChange={() => setPaymentOption("custom")}
                          className="w-4 h-4 mt-0.5 text-[#FF5722] accent-[#FF5722]"
                        />
                        <div className="flex-1">
                          <p className="text-[12px] leading-[16px] font-semibold text-[#1a1b23]">
                            Custom Amount
                          </p>
                          {paymentOption === "custom" && (
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-[12px] text-gray-500 pointer-events-none">
                                ₦
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={customAmount}
                                onChange={(e) => {
                                  const val = e.target.value.replace(
                                    /[^0-9.,]/g,
                                    "",
                                  );
                                  setCustomAmount(val);
                                }}
                                placeholder="0.00"
                                className="w-full pl-7 pr-3 py-2 text-[12px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF5722] focus:border-[#FF5722]"
                              />
                              {parseFloat(customAmount.replace(/,/g, "")) <
                                fullPaymentAmount &&
                                customAmount && (
                                  <p className="text-[10px] text-red-600 mt-1">
                                    Amount must be at least ₦
                                    {fullPaymentAmount.toLocaleString()} (full
                                    payment amount).
                                  </p>
                                )}
                              {parseFloat(customAmount.replace(/,/g, "")) >
                                fullPaymentAmount && (
                                <p className="text-[10px] text-emerald-600 mt-1">
                                  Amount above total — ₦
                                  {(
                                    parseFloat(customAmount.replace(/,/g, "")) -
                                    fullPaymentAmount
                                  ).toLocaleString()}{" "}
                                  will be added to your wallet as credit.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Partial payment message */}
            {isPartial && (
              <>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />
                <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[12px] leading-[18px] text-amber-800 font-semibold mb-1">
                    Partial Payment Received
                  </p>
                  <p className="text-[11px] leading-[16px] text-amber-700">
                    A partial payment has been made on this invoice. You can
                    generate a new payment link via WhatsApp to pay the
                    remaining balance.
                  </p>
                </div>
              </>
            )}

            {/* Gradient separator line */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8" />

            {/* Action Buttons */}
            <div className="mt-8">
              {isPaid || isPartial ? (
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full sm:w-auto h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading Receipt...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div>
                    <Button
                      onClick={handlePayment}
                      disabled={
                        isProcessingPayment ||
                        (paymentOption === "custom" &&
                          getPaymentAmount() < fullPaymentAmount)
                      }
                      className="w-full sm:w-auto h-10 px-8 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
                    >
                      {isProcessingPayment
                        ? "Processing Payment..."
                        : `Pay ${formatCurrency(getPaymentAmount())}`}
                    </Button>
                    <p className="text-[11px] leading-[15px] text-gray-500 mt-3">
                      Secured by Paystack
                    </p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    variant="outline"
                    className="w-full sm:w-auto h-10 px-8"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet History Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {walletBalance > 0
                ? "Wallet Credit Breakdown"
                : "Outstanding Balance Breakdown"}
            </DialogTitle>
          </DialogHeader>

          {isFetchingWalletHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : walletHistory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No history found
            </p>
          ) : (
            <div className="mt-2">
              <div className="mb-4">
                {(() => {
                  // Use the final balanceAfter from history (accurate current balance)
                  // rather than the invoice snapshot (stale at invoice creation time)
                  const currentBalance =
                    walletHistory.length > 0
                      ? walletHistory[walletHistory.length - 1].balanceAfter
                      : walletBalance;
                  const isCredit = currentBalance > 0;
                  if (currentBalance === 0) {
                    return (
                      <>
                        <p className="text-xs text-gray-500 mb-0.5">
                          Outstanding Balance
                        </p>
                        <p className="text-xl font-semibold text-emerald-600">
                          No outstanding balance
                        </p>
                      </>
                    );
                  }
                  return isCredit ? (
                    <>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Current Credit Balance
                      </p>
                      <p className="text-xl font-semibold text-emerald-600">
                        {formatCurrency(currentBalance)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Applied to this invoice
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Outstanding Balance
                      </p>
                      <p className="text-xl font-semibold text-orange-600">
                        {formatCurrency(Math.abs(currentBalance))}
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-gray-500 font-medium whitespace-nowrap">
                        Date
                      </th>
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">
                        Description
                      </th>
                      <th className="text-right py-2 px-2 text-gray-500 font-medium whitespace-nowrap">
                        Amount
                      </th>
                      <th className="text-right py-2 px-2 text-gray-500 font-medium whitespace-nowrap">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...walletHistory].reverse().map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-2 text-gray-700">
                          {entry.description}
                        </td>
                        <td
                          className={`py-3 px-2 text-right whitespace-nowrap font-medium ${entry.balanceChange > 0 ? "text-emerald-600" : "text-gray-900"}`}
                        >
                          {entry.balanceChange > 0
                            ? `+${formatCurrency(entry.balanceChange)}`
                            : `-${formatCurrency(Math.abs(entry.balanceChange))}`}
                        </td>
                        <td
                          className={`py-3 px-2 text-right whitespace-nowrap font-medium ${entry.balanceAfter < 0 ? "text-orange-600" : entry.balanceAfter > 0 ? "text-emerald-600" : "text-gray-900"}`}
                        >
                          {entry.balanceAfter < 0
                            ? `-${formatCurrency(Math.abs(entry.balanceAfter))}`
                            : formatCurrency(entry.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
