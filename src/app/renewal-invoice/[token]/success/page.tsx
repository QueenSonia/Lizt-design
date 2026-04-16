"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  renewalInvoiceApi,
  PaymentSuccessData,
} from "@/services/renewal-invoice/api";
import { toast } from "sonner";

/**
 * Payment Success Page
 * Route: /renewal-invoice/[token]/success
 * Requirements: 1.1-1.7, 7.1-7.3
 */
export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [successData, setSuccessData] = useState<PaymentSuccessData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch payment success data on mount
  useEffect(() => {
    const fetchSuccessData = async () => {
      try {
        setIsLoading(true);
        const data = await renewalInvoiceApi.getPaymentSuccessData(token);
        setSuccessData(data);
      } catch (err) {
        console.error("Failed to fetch payment success data:", err);
        setError("Failed to load payment information. Please contact support.");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchSuccessData();
    }
  }, [token]);

  // Handle receipt download
  const handleDownloadReceipt = async () => {
    if (!successData?.receiptToken) return;

    setIsDownloading(true);
    try {
      const blob = await renewalInvoiceApi.downloadRenewalReceipt(
        successData.receiptToken,
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename: payment-receipt-{propertyName}-{date}.pdf
      const date = new Date(successData.paidAt).toISOString().split("T")[0];
      const propertyName = successData.invoice.propertyName.replace(
        /[^a-zA-Z0-9]/g,
        "-",
      );
      link.download = `payment-receipt-${propertyName}-${date}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Receipt downloaded successfully");
    } catch (err) {
      console.error("Failed to download receipt:", err);
      toast.error("Failed to download receipt. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle navigation to receipt page
  const handleDone = () => {
    if (successData?.receiptToken) {
      router.push(`/renewal-receipt/${successData.receiptToken}`);
    } else {
      router.push(`/renewal-invoice/${token}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
            <p className="text-gray-600 text-center">
              Loading payment confirmation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !successData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
              Unable to Load Payment Information
            </h2>
            <p className="text-gray-600 text-center text-sm sm:text-base mb-4">
              {error ||
                "Payment information not available. Please contact support."}
            </p>
            <Button onClick={handleDone} variant="outline">
              Back to Invoice
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Lizt Logo - Page layer, top-left */}
      <div className="mb-6">
        <Image
          src="/lizt.svg"
          alt="Lizt"
          width={120}
          height={40}
          priority
        />
      </div>

      <div className="flex items-center justify-center">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg overflow-hidden">
        <CardContent className="px-8 py-8">
          {/* Success Icon and Heading - Requirements: 1.2, 1.3 */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful 🎉
            </h1>
          </div>

          {/* Success Messages - Requirements: 1.4, 1.5 */}
          <div className="text-center mb-8 space-y-2">
            <p className="text-gray-700">
              Your tenancy renewal payment has been received successfully.
            </p>
            <p className="text-gray-600 text-sm">
              Your receipt has been sent to your WhatsApp.
            </p>
          </div>

          {/* Action Buttons - Requirements: 1.6, 1.7 */}
          <div className="space-y-3">
            <Button
              onClick={handleDownloadReceipt}
              disabled={isDownloading}
              className="w-full h-12 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </>
              )}
            </Button>

            <Button
              onClick={handleDone}
              variant="outline"
              className="w-full h-12"
            >
              Done
            </Button>
          </div>
        </CardContent>
      </div>
      </div>
    </div>
  );
}
