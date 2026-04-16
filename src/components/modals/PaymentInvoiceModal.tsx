"use client";

import { useEffect } from "react";
import { X, Download, Calendar } from "lucide-react";
import { Button } from "../ui/button";

export interface PaymentInvoiceData {
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  invoiceDate: string;
  paymentHistory: Array<{
    id: number;
    amount: number;
    date: string;
    reference: string;
  }>;
}

interface PaymentInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PaymentInvoiceData;
}

export function PaymentInvoiceModal({
  isOpen,
  onClose,
  data,
}: PaymentInvoiceModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 payment-invoice-modal-container">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto payment-invoice-modal">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            Payment Invoice
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Print
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invoice Header */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Date: {data.invoiceDate}</span>
            </div>
          </div>

          {/* Tenant Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              BILL TO:
            </h4>
            <div className="text-gray-900">
              <p className="font-medium">{data.tenantName}</p>
              <p className="text-sm text-gray-600">{data.tenantEmail}</p>
              <p className="text-sm text-gray-600">{data.propertyName}</p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Amount</span>
              <span className="font-semibold text-gray-900">
                ₦{data.totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Amount Paid</span>
              <span className="font-semibold text-green-600">
                ₦{data.amountPaid.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Outstanding Balance
                </span>
                <span className="text-lg font-bold text-red-600">
                  ₦{data.outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {data.paymentHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                PAYMENT HISTORY
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {payment.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.reference}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          ₦{payment.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="text-sm text-gray-600 text-center pt-4 border-t border-gray-200">
            <p>Thank you for your business</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body > *:not(.payment-invoice-modal-container) {
            display: none !important;
          }
          .payment-invoice-modal-container {
            position: static !important;
            background: white !important;
            padding: 0 !important;
          }
          .payment-invoice-modal {
            max-width: 100% !important;
            max-height: none !important;
            box-shadow: none !important;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
