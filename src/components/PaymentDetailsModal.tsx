/* eslint-disable */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card, CardContent } from "./ui/card";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  Copy,
  User,
  Building,
  CreditCard,
} from "lucide-react";

interface PaymentDetailsModalProps {
  payment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDetailsModal({
  payment,
  open,
  onOpenChange,
}: PaymentDetailsModalProps) {
  if (!payment) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
        return "bg-green-100 text-green-700 border-green-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "refunded":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <RotateCcw className="w-4 h-4" />;
      case "refunded":
        return <RotateCcw className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownloadReceipt = () => {
    // Handle receipt download logic
    console.log("Downloading receipt for payment:", payment.paymentId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment Details</span>
            <Badge
              className={`${getStatusColor(
                payment.status
              )} flex items-center gap-1`}
            >
              {getStatusIcon(payment.status)}
              {payment.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500 mb-1 block">
                    Payment ID
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-slate-900">
                      {payment.paymentId}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(payment.paymentId)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500 mb-1 block">
                    Transaction Reference
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-slate-900">
                      {payment.transactionRef}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(payment.transactionRef)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500 mb-1 block">
                    Amount Paid
                  </label>
                  <p className="text-2xl font-bold text-slate-900">
                    ₦{payment.amountPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500 mb-1 block">
                    Payment Method
                  </label>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <p className="text-slate-900">{payment.paymentMethod}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500 mb-1 block">
                    Date & Time
                  </label>
                  <p className="text-slate-900">
                    {(() => {
                      const date = new Date(payment.dateTime);
                      if (isNaN(date.getTime())) {
                        return "Invalid date";
                      }
                      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                    })()}
                  </p>
                </div>
                {payment.status === "Failed" && payment.failureReason && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Failure Reason
                    </label>
                    <p className="text-red-600">{payment.failureReason}</p>
                  </div>
                )}
                {payment.status === "Refunded" && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Refund Reason
                    </label>
                    <p className="text-blue-600">{payment.refundReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-slate-500" />
                  <h3 className="font-semibold text-slate-900">
                    Tenant Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Name
                    </label>
                    <p className="text-slate-900">{payment.tenantName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Email
                    </label>
                    <p className="text-slate-900">{payment.tenantEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Phone
                    </label>
                    <p className="text-slate-900">{payment.tenantPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Building className="w-5 h-5 text-slate-500" />
                  <h3 className="font-semibold text-slate-900">
                    Property Information
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Property
                    </label>
                    <p className="text-slate-900">{payment.property}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Address
                    </label>
                    <p className="text-slate-900">{payment.propertyAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Payment Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Rent</span>
                  <span className="font-medium text-slate-900">
                    ₦{payment.breakdown.rent.toLocaleString()}
                  </span>
                </div>
                {payment.breakdown.serviceCharge > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Service Charge</span>
                    <span className="font-medium text-slate-900">
                      ₦{payment.breakdown.serviceCharge.toLocaleString()}
                    </span>
                  </div>
                )}
                {payment.breakdown.lateFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Late Fee</span>
                    <span className="font-medium text-red-600">
                      ₦{payment.breakdown.lateFee.toLocaleString()}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900">
                    ₦{payment.breakdown.total.toLocaleString()}
                  </span>
                </div>
                {payment.status === "Refunded" && payment.refundAmount && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-600">
                        Refunded Amount
                      </span>
                      <span className="font-medium text-blue-600">
                        ₦{payment.refundAmount.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bank Details (if available) */}
          {payment.bankDetails && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Bank
                    </label>
                    <p className="text-slate-900">{payment.bankDetails.bank}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Account Number
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="font-mono text-slate-900">
                        {payment.bankDetails.accountNumber}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(payment.bankDetails.accountNumber)
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 mb-1 block">
                      Account Name
                    </label>
                    <p className="text-slate-900">
                      {payment.bankDetails.accountName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {payment.status === "Successful" && (
              <Button
                onClick={handleDownloadReceipt}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
