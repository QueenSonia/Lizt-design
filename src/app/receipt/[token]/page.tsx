"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReceiptDocument, ReceiptData } from "@/components/ReceiptDocument";
import { receiptsApi } from "@/services/receipts/api";

interface ReceiptApiResponse {
  id: string;
  receipt_number: string;
  receipt_date: string;
  payment_reference: string;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  property_name: string;
  property_address: string | null;
  invoice_number: string | null;
  amount_paid: number;
  payment_method: string | null;
  notes: string | null;
  pdf_url: string | null;
  branding: Record<string, unknown> | null;
}

function formatReceiptDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function toReceiptData(response: ReceiptApiResponse): ReceiptData {
  return {
    receiptNumber: response.receipt_number,
    receiptDate: formatReceiptDate(response.receipt_date),
    paymentReference: response.payment_reference,
    tenantName: response.tenant_name,
    tenantEmail: response.tenant_email || "",
    tenantPhone: response.tenant_phone || undefined,
    propertyName: response.property_name,
    propertyAddress: response.property_address || undefined,
    invoiceNumber: response.invoice_number || "",
    amountPaid: Number(response.amount_paid),
    paymentMethod: response.payment_method || undefined,
    notes: response.notes || undefined,
  };
}

function ReceiptPageContent() {
  const params = useParams();
  const token = params.token as string;
  const receiptRef = useRef<HTMLDivElement>(null);

  const [receipt, setReceipt] = useState<ReceiptApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/proxy/receipts/public/${token}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const data: ReceiptApiResponse = await res.json();
        setReceipt(data);

        // Set branding in localStorage for ReceiptDocument component
        if (data.branding) {
          localStorage.setItem(
            "offerLetterBranding",
            JSON.stringify(data.branding),
          );
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReceipt();
  }, [token]);

  // Track receipt view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        const ipAddress = await receiptsApi.getUserIP();
        await receiptsApi.trackReceiptView(token, ipAddress);
      } catch (error) {
        // Silently fail - tracking shouldn't block the user experience
        console.error("Failed to track receipt view:", error);
      }
    };

    if (token && receipt) {
      trackView();
    }
  }, [token, receipt]);

  const handleDownloadPDF = useCallback(async () => {
    if (!receipt || !receiptRef.current) return;
    setIsDownloading(true);

    try {
      // Try backend PDF first if available
      if (receipt.pdf_url) {
        const link = document.createElement("a");
        link.href = receipt.pdf_url;
        link.download = `receipt-${receipt.receipt_number}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Client-side PDF generation fallback
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(receiptRef.current, {
        useCORS: true,
        background: "#ffffff",
        width: receiptRef.current.scrollWidth * 2,
        height: receiptRef.current.scrollHeight * 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${receipt.receipt_number}.pdf`);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [receipt]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
            <p className="text-gray-600 text-center">Loading receipt...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
              Receipt Not Found
            </h2>
            <p className="text-gray-600 text-center text-sm sm:text-base">
              This receipt is no longer available or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const receiptData = toReceiptData(receipt);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-8">
        <div
          ref={receiptRef}
          className="bg-white shadow-lg max-w-[800px] mx-auto"
        >
          <ReceiptDocument data={receiptData} />
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-8 pb-12">
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          variant="outline"
          className="h-9 text-sm flex items-center gap-2"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return <ReceiptPageContent />;
}
