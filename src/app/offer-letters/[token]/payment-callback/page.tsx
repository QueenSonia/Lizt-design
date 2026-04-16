"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { paymentApi, PaymentStatusResponse } from "@/services/payments/api";

type PaymentStatus = "verifying" | "success" | "failed" | "timeout";

/**
 * Payment Callback Page
 * Handles return from Paystack popup and verifies payment status
 *
 * Strategy: Hybrid verification approach
 * - Database check first (instant if webhook already processed)
 * - Paystack direct verification as fallback (self-healing if webhook failed)
 * - Cron job as final safety net (every 30 minutes for edge cases)
 * - This approach provides immediate confirmation even if webhooks fail
 *
 * Requirements: US-5, 14.2
 */
export default function PaymentCallbackPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;

  const [status, setStatus] = useState<PaymentStatus>("verifying");
  const [paymentData, setPaymentData] = useState<PaymentStatusResponse | null>(
    null,
  );
  const [pollCount, setPollCount] = useState(0);
  const [, setErrorCount] = useState(0);
  const isPollingRef = useRef(false);

  const reference = searchParams.get("reference");

  // Reduced polling: 10 polls * 5 seconds = 50 seconds
  // Webhook should process within 1-2 seconds, so this is just a fallback
  const maxPolls = 10;
  const pollInterval = 5000; // 5 seconds between polls
  const maxErrors = 3; // Stop after 3 consecutive errors

  // Poll payment status
  const pollPaymentStatus = useCallback(async (): Promise<boolean> => {
    try {
      console.log(
        `[Poll ${pollCount + 1}/${maxPolls}] Checking payment status...`,
      );

      // HYBRID APPROACH:
      // Step 1: Check database first (fast - webhook may have already processed)
      const response = await paymentApi.getPaymentStatus(token);

      // Reset error count on successful request
      setErrorCount(0);
      setPaymentData(response);

      // Check if payment is fully paid (webhook worked)
      if (response.paymentStatus === "fully_paid") {
        console.log("✅ Payment fully paid (webhook processed)!");
        setStatus("success");
        return true;
      }

      // Check if partial payment was completed successfully
      const latestPayment = response.paymentHistory?.[0];

      if (latestPayment?.status === "completed") {
        console.log("✅ Latest payment completed (webhook processed)!");
        setStatus("success");
        return true;
      }

      // Check if the latest payment failed
      if (latestPayment?.status === "failed") {
        console.log("❌ Latest payment failed!");
        setStatus("failed");
        return true;
      }

      // Step 2: Payment still pending - verify with Paystack directly
      console.log("⏳ Payment pending in database, verifying with Paystack...");

      if (reference) {
        const verification =
          await paymentApi.verifyPaymentWithPaystack(reference);

        console.log("📡 Paystack verification:", verification);

        if (verification.status === "success") {
          console.log("✅ Payment verified with Paystack and processed!");
          // Re-fetch with retries: DB may still be committing if the webhook
          // held the processing lock concurrently with this verify call.
          for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise((r) => setTimeout(r, 800));
            try {
              const updatedResponse = await paymentApi.getPaymentStatus(token);
              setPaymentData(updatedResponse);
              if (
                (updatedResponse.amountPaid ?? 0) > 0 ||
                updatedResponse.paymentStatus !== "unpaid"
              ) {
                break;
              }
            } catch {
              // keep retrying
            }
          }
          setStatus("success");
          return true;
        }

        if (verification.status === "failed") {
          console.log("❌ Payment failed on Paystack!");
          setStatus("failed");
          return true;
        }

        console.log(`⏳ Paystack status: ${verification.status}`);
      }

      console.log("⏳ Payment still pending...");
      return false;
    } catch (error) {
      console.error("Error polling payment status:", error);
      setErrorCount((prev) => {
        const newCount = prev + 1;
        // If too many consecutive errors, show timeout with retry option
        if (newCount >= maxErrors) {
          console.log("❌ Too many errors, stopping polls");
          setStatus("timeout");
        }
        return newCount;
      });
      return false;
    }
  }, [token, reference, pollCount]);

  // Start polling on mount
  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    // Prevent double-polling in strict mode
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const startPolling = async () => {
      // Initial check - webhook may have already processed
      const isComplete = await pollPaymentStatus();
      if (isComplete || !isMounted) return;

      // Set up polling interval with longer delays
      intervalId = setInterval(async () => {
        if (!isMounted) {
          if (intervalId) clearInterval(intervalId);
          return;
        }

        setPollCount((prev) => {
          const newCount = prev + 1;

          // Check if we've exceeded max polls
          if (newCount >= maxPolls) {
            if (intervalId) clearInterval(intervalId);
            setStatus("timeout");
            return newCount;
          }

          return newCount;
        });

        const isComplete = await pollPaymentStatus();
        if (isComplete && intervalId) {
          clearInterval(intervalId);
        }
      }, pollInterval);
    };

    startPolling();

    return () => {
      isMounted = false;
      isPollingRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [reference, pollPaymentStatus]);

  // Render based on status
  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
              <Loader2 className="h-16 w-16 animate-spin text-orange-600 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Verifying Payment
              </h2>
              <p className="text-gray-600 text-center mb-4">
                Please wait while we confirm your payment with Paystack...
              </p>
              <p className="text-sm text-gray-500 text-center">
                This may take a few moments. Do not close this page.
              </p>
              <div className="mt-4 text-xs text-gray-400">
                Attempt {pollCount} of {maxPolls}
              </div>
            </CardContent>
          </Card>
        );

      case "success":
        return (
          <Card className="w-full max-w-md mx-auto border-green-200">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Payment Successful!
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Your payment has been confirmed. Thank you!
              </p>

              {paymentData && (
                <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold">
                      ₦{paymentData.amountPaid?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold">
                      ₦{paymentData.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                  {(paymentData.outstandingBalance ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Outstanding:</span>
                      <span className="font-semibold text-red-600">
                        ₦{paymentData.outstandingBalance?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                {paymentData?.paymentHistory?.[0]?.receiptToken && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/receipt/${paymentData.paymentHistory[0].receiptToken}`,
                      )
                    }
                    className="w-full bg-[#FF5000] hover:bg-[#E64800]"
                  >
                    View Receipt
                  </Button>
                )}
                {(paymentData?.outstandingBalance ?? 0) > 0 && (
                  <Button
                    onClick={() =>
                      router.push(`/offer-letters/invoice/${token}`)
                    }
                    variant="outline"
                    className="w-full"
                  >
                    Make Another Payment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case "failed":
        return (
          <Card className="w-full max-w-md mx-auto border-red-200">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Payment Failed
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Your payment could not be processed. Please try again.
              </p>

              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={() => router.push(`/offer-letters/invoice/${token}`)}
                  className="w-full bg-[#FF5000] hover:bg-[#E64800]"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/offer-letters/${token}`)}
                  className="w-full"
                >
                  Back to Offer Letter
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "timeout":
        return (
          <Card className="w-full max-w-md mx-auto border-yellow-200">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Verification Taking Longer
              </h2>
              <p className="text-gray-600 text-center mb-2">
                Your payment is being processed. This can take a moment for bank
                transfers.
              </p>
              <p className="text-sm text-gray-500 text-center mb-6">
                If you completed the payment, it will be confirmed shortly. You
                can check again or view your offer letter.
              </p>

              <div className="flex flex-col gap-3 w-full">
                <Button
                  onClick={() => {
                    setStatus("verifying");
                    setPollCount(0);
                    setErrorCount(0);
                    window.location.reload();
                  }}
                  className="w-full bg-[#FF5000] hover:bg-[#E64800]"
                >
                  Check Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/offer-letters/${token}`)}
                  className="w-full"
                >
                  View Offer Letter
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {renderContent()}
    </div>
  );
}
