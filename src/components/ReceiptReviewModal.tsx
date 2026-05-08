"use client";
import { useMemo } from "react";
import { Send, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptDocument, ReceiptData } from "@/components/ReceiptDocument";

export interface ReceiptReviewData {
  tenantName: string;
  tenantEmail?: string;
  tenantPhone?: string;
  amount: number;
  date: Date | null;
  description: string;
  reference?: string;
  property?: string;
  propertyAddress?: string;
  paymentMethod?: string;
}

interface ReceiptReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptReviewData;
  onSave: () => void | Promise<void>;
  onSend: () => void | Promise<void>;
  saving?: boolean;
}

const formatDateISO = (d: Date | null) => {
  if (!d) return new Date().toISOString();
  return d.toISOString();
};

export function ReceiptReviewModal({
  open,
  onOpenChange,
  data,
  onSave,
  onSend,
  saving = false,
}: ReceiptReviewModalProps) {
  const reference = useMemo(
    () =>
      data.reference ||
      `RCT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`,
    [data.reference],
  );

  const receiptData: ReceiptData = useMemo(
    () => ({
      receiptNumber: reference,
      receiptDate: formatDateISO(data.date),
      paymentReference: reference,
      tenantName: data.tenantName,
      tenantEmail: data.tenantEmail || "",
      tenantPhone: data.tenantPhone,
      propertyName: data.property || "—",
      propertyAddress: data.propertyAddress,
      amountPaid: data.amount,
      paymentMethod: data.paymentMethod || "Manual entry",
      notes: data.description,
    }),
    [data, reference],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#F5F4F1] max-w-4xl max-h-[92vh] overflow-hidden p-0 gap-0">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
          <DialogTitle className="text-base font-semibold text-gray-900">
            Receipt Review
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 sm:px-6 py-6 max-h-[calc(92vh-128px)]">
          <ReceiptDocument data={receiptData} />
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-gray-200 bg-white">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSave}
            disabled={saving}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save
          </Button>
          <Button
            className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white"
            onClick={onSend}
            disabled={saving}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
