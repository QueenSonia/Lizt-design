"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";
import {
  renewalInvoiceApi,
  RenewalReceiptData,
} from "@/services/renewal-invoice/api";
import { toast } from "sonner";

/**
 * Renewal Receipt Page
 * Route: /renewal-receipt/[token]
 * Requirements: 4.1-4.8, 5.1-5.6, 8.1-8.3
 */
export default function RenewalReceiptPage() {
  const params = useParams();
  const token = params.token as string;

  const [receiptData, setReceiptData] = useState<RenewalReceiptData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch receipt data on mount
  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        setIsLoading(true);
        const data = await renewalInvoiceApi.getRenewalReceiptByToken(token);
        setReceiptData(data);
      } catch (err) {
        console.error("Failed to fetch receipt data:", err);
        setError(
          "Unable to load receipt. Please check the link or contact support.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchReceiptData();
    }
  }, [token]);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!receiptData) return;

    setIsDownloading(true);
    try {
      const blob = await renewalInvoiceApi.downloadRenewalReceipt(token);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename: payment-receipt-{propertyName}-{date}.pdf
      const date = new Date(receiptData.paymentDate)
        .toISOString()
        .split("T")[0];
      const propertyName = receiptData.propertyName.replace(
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

  // Format currency with Nigerian Naira symbol and thousand separators
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
            <p className="text-gray-600 text-center">Loading receipt...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !receiptData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
              Receipt Not Available
            </h2>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              {error ||
                "Receipt not found. Please check the link or contact support."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-lg overflow-hidden">
        {/* Platform Layer - Lizt Logo - Requirements: 4.1 */}
        <div className="px-8 pt-8 pb-4">
          <Image src="/lizt.svg" alt="Lizt" width={120} height={40} priority />
        </div>

        {/* Document Layer */}
        <div className="px-8 md:px-12 pb-8">
          {/* Landlord Logo - Top right of document - Requirements: 4.2 */}
          {isValidImageSrc(receiptData.landlordLogoUrl) && (
            <div className="flex justify-end mb-8">
              <Image
                src={receiptData.landlordLogoUrl}
                alt="Landlord Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          )}

          {/* Receipt Title - Requirements: 4.3 */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
            Payment Receipt
          </h1>

          {/* Receipt Details - Requirements: 4.4, 4.5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Receipt Details
              </h3>
              <div className="space-y-1">
                <p>
                  <span className="font-medium">Receipt Number:</span>{" "}
                  {receiptData.receiptNumber}
                </p>
                <p>
                  <span className="font-medium">Transaction Reference:</span>{" "}
                  {receiptData.transactionReference}
                </p>
                <p>
                  <span className="font-medium">Payment Date:</span>{" "}
                  {formatDate(receiptData.paymentDate)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tenant Information
              </h3>
              <div className="space-y-1">
                <p>
                  <span className="font-medium">Name:</span>{" "}
                  {receiptData.tenantName}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {receiptData.tenantEmail}
                </p>
                {receiptData.tenantPhone && (
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {receiptData.tenantPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Property Information - Requirements: 4.6, 4.7 */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Property Information
            </h3>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Property Name:</span>{" "}
                {receiptData.propertyName}
              </p>
              <p>
                <span className="font-medium">Address:</span>{" "}
                {receiptData.propertyAddress}
              </p>
            </div>
          </div>

          {/* Payment Breakdown - Requirements: 5.1-5.6 */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Payment Breakdown
            </h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Rent Amount</span>
                  <span className="font-medium">
                    {formatCurrency(receiptData.charges.rentAmount)}
                  </span>
                </div>

                {/* Conditional charges - Requirements: 5.2, 5.3, 5.4 */}
                {receiptData.charges.serviceCharge &&
                  receiptData.charges.serviceCharge > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Service Charge</span>
                      <span className="font-medium">
                        {formatCurrency(receiptData.charges.serviceCharge)}
                      </span>
                    </div>
                  )}

                {receiptData.charges.legalFee &&
                  receiptData.charges.legalFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Legal Fee</span>
                      <span className="font-medium">
                        {formatCurrency(receiptData.charges.legalFee)}
                      </span>
                    </div>
                  )}

                {receiptData.charges.otherCharges &&
                  receiptData.charges.otherCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Other Charges</span>
                      <span className="font-medium">
                        {formatCurrency(receiptData.charges.otherCharges)}
                      </span>
                    </div>
                  )}

                {/* Wallet credit applied (positive walletBalance = credit reduced the invoice) */}
                {(receiptData.walletBalance ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Wallet Credit Applied</span>
                    <span className="font-medium">
                      -{formatCurrency(receiptData.walletBalance!)}
                    </span>
                  </div>
                )}

                {/* Previous outstanding added (negative walletBalance = old debt baked in) */}
                {(receiptData.walletBalance ?? 0) < 0 && (
                  <div className="flex justify-between items-center">
                    <span>Previous Outstanding Balance</span>
                    <span className="font-medium">
                      +{formatCurrency(Math.abs(receiptData.walletBalance!))}
                    </span>
                  </div>
                )}

                <hr className="border-gray-300" />

                {/* Invoice Total */}
                <div className="flex justify-between items-center font-semibold">
                  <span>Invoice Total</span>
                  <span>{formatCurrency(receiptData.totalAmount)}</span>
                </div>

                {/* Amount Paid (if different from invoice total, e.g. partial) */}
                {receiptData.amountPaid != null && receiptData.amountPaid !== receiptData.totalAmount && (
                  <div className="flex justify-between items-center text-orange-700">
                    <span>Amount Paid</span>
                    <span className="font-medium">{formatCurrency(receiptData.amountPaid)}</span>
                  </div>
                )}

                {/* Total Amount Paid - Requirements: 5.5, 5.6 */}
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-3 mt-1">
                  <span>Total Amount Paid</span>
                  <span>{formatCurrency(receiptData.amountPaid ?? receiptData.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Download Button - Requirements: 6.2 */}
          <div className="flex justify-center">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="h-12 px-8 bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-50"
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
          </div>
        </div>
      </div>
    </div>
  );
}
