"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Send,
  Receipt,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
import { toast } from "sonner";
import { invoiceApi, Invoice } from "../services/invoices/api";
import { InvoiceViewModal, InvoiceData } from "./InvoiceViewModal";
import { ReceiptViewModal, ReceiptData } from "./ReceiptViewModal";
import { useProfile } from "@/services/users/query";

interface BrandingInfo {
  logo?: string;
  letterhead?: string;
  companyName?: string;
  businessName?: string;
  address?: string;
  businessAddress?: string;
  email?: string;
  contactEmail?: string;
  phone?: string;
  contactPhone?: string;
  footerText?: string;
  footerColor?: string;
  headingFont?: string;
  bodyFont?: string;
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LandlordPaymentsNewProps {
  searchTerm?: string;
  onBack?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatDateToDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700 border-green-200";
    case "partially_paid":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "pending":
      return "bg-red-100 text-red-700 border-red-200";
    case "overdue":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "paid":
      return "Paid";
    case "partially_paid":
      return "Partially Paid";
    case "pending":
      return "Pending";
    case "overdue":
      return "Overdue";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LandlordPaymentsNew({
  searchTerm = "",
}: LandlordPaymentsNewProps) {
  // Fetch current landlord profile for branding
  const { data: profileData } = useProfile();

  // State management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null,
  );
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(
    null,
  );

  const effectiveSearchTerm = searchTerm;

  // Fetch invoices from API - only pending and partially paid
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await invoiceApi.getActionableInvoices({
          search: effectiveSearchTerm || undefined,
        });

        setInvoices(response.invoices);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to load invoices. Please try again.");
        toast.error("Failed to load invoices", {
          description: "There was an error loading invoice data.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [effectiveSearchTerm]);

  // Filter invoices based on search (already filtered by status from API)
  const filteredInvoices = invoices.filter((invoice) => {
    if (!effectiveSearchTerm) return true;
    const searchLower = effectiveSearchTerm.toLowerCase();
    return (
      invoice.tenantName.toLowerCase().includes(searchLower) ||
      invoice.propertyName.toLowerCase().includes(searchLower) ||
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      invoice.tenantPhone.includes(effectiveSearchTerm)
    );
  });

  // Event handlers
  const handleViewInvoice = (invoice: Invoice) => {
    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: formatDateToDDMMYYYY(invoice.invoiceDate),
      status: getStatusLabel(invoice.status),
      tenantName: invoice.tenantName,
      tenantEmail: invoice.tenantEmail,
      tenantPhone: invoice.tenantPhone,
      propertyName: invoice.propertyName,
      propertyAddress: invoice.propertyAddress || "",
      lineItems: invoice.lineItems,
      subtotal: invoice.totalAmount,
      total: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.outstandingBalance,
      notes: invoice.notes,
      backendInvoiceId: invoice.id,
      branding: profileData?.user?.branding as BrandingInfo,
    };
    setSelectedInvoice(invoiceData);
    setShowInvoiceModal(true);
  };

  const handleViewReceipt = (invoice: Invoice) => {
    if (invoice.paymentHistory.length === 0) return;

    const lastPayment = invoice.paymentHistory[0];
    const receiptData: ReceiptData = {
      receiptNumber: `RCPT-${invoice.invoiceNumber.replace("INV-", "")}`,
      receiptDate: formatDateToDDMMYYYY(lastPayment.paidAt),
      paymentReference: lastPayment.reference,
      tenantName: invoice.tenantName,
      tenantEmail: invoice.tenantEmail,
      tenantPhone: invoice.tenantPhone,
      propertyName: invoice.propertyName,
      propertyAddress: invoice.propertyAddress || "",
      invoiceNumber: invoice.invoiceNumber,
      amountPaid: invoice.amountPaid,
      paymentMethod: lastPayment.paymentMethod || "Bank Transfer",
      notes: "Thank you for your payment.",
    };
    setSelectedReceipt(receiptData);
    setShowReceiptModal(true);
  };

  const handleSendPaymentLink = (invoice: Invoice) => {
    if (!invoice.offerLetterToken) {
      toast.error("Payment link not available", {
        description: "This invoice is not linked to an offer letter.",
      });
      return;
    }

    // Format phone number for WhatsApp
    let formattedPhone = invoice.tenantPhone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("234") && formattedPhone.length === 11) {
      formattedPhone = "234" + formattedPhone.substring(1);
    } else if (
      !formattedPhone.startsWith("234") &&
      formattedPhone.length === 10
    ) {
      formattedPhone = "234" + formattedPhone;
    }

    // Build payment link
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const paymentLink = `${origin}/offer-letters/invoice/${invoice.offerLetterToken}`;

    // Build message
    const message = `Hi ${invoice.tenantName},\n\nYou have an outstanding payment of ₦${invoice.outstandingBalance.toLocaleString()} for ${invoice.propertyName}.\n\nPlease click the link below to complete your payment:\n${paymentLink}\n\nThank you.`;

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    toast.success(`Payment link sent to ${invoice.tenantName}`);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">
              Track outstanding invoices and follow up on pending payments
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading invoices...
              </h3>
              <p className="text-gray-600">
                Please wait while we fetch your invoice data.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Failed to load invoices
              </h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invoice List */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {invoice.tenantName}
                          </h3>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {invoice.propertyName}
                        </p>
                      </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Total Amount
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          ₦{invoice.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Amount Paid
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          ₦{invoice.amountPaid.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Outstanding Balance
                        </p>
                        <p className="text-sm font-semibold text-red-600">
                          ₦{invoice.outstandingBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Last Payment Date */}
                    {invoice.lastPaymentDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Last payment:{" "}
                          {formatDateToDDMMYYYY(invoice.lastPaymentDate)}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            aria-label="View invoice"
                          >
                            <FileText className="w-4 h-4 text-gray-600" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>View invoice</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSendPaymentLink(invoice)}
                            className="w-9 h-9 rounded-lg bg-[#FF5000] flex items-center justify-center hover:bg-[#FF5000]/90 transition-colors"
                            aria-label="Send payment link"
                          >
                            <Send className="w-4 h-4 text-white" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Send payment link</TooltipContent>
                      </Tooltip>

                      {invoice.amountPaid > 0 &&
                        invoice.paymentHistory.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleViewReceipt(invoice)}
                                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                aria-label="View receipt"
                              >
                                <Receipt className="w-4 h-4 text-gray-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>View receipt</TooltipContent>
                          </Tooltip>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {filteredInvoices.length === 0 && (
              <Card className="border-gray-200">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {invoices.length === 0
                      ? "No outstanding payments"
                      : "No invoices found"}
                  </h3>
                  <p className="text-gray-600">
                    {invoices.length === 0
                      ? "All invoices have been paid in full. Great work!"
                      : effectiveSearchTerm
                        ? "Try adjusting your search or filters."
                        : "No invoice records match the current filters."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Invoice View Modal */}
        {selectedInvoice && (
          <InvoiceViewModal
            isOpen={showInvoiceModal}
            onClose={() => {
              setShowInvoiceModal(false);
              setSelectedInvoice(null);
            }}
            data={selectedInvoice}
          />
        )}

        {/* Receipt View Modal */}
        {selectedReceipt && (
          <ReceiptViewModal
            isOpen={showReceiptModal}
            onClose={() => {
              setShowReceiptModal(false);
              setSelectedReceipt(null);
            }}
            data={selectedReceipt}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
