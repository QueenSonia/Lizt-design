"use client";
import { useMemo } from "react";
import { Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ReceiptReviewData {
  tenantName: string;
  amount: number;
  date: Date | null;
  description: string;
  reference?: string;
  property?: string;
}

interface ReceiptReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptReviewData;
  onSave: () => void | Promise<void>;
  onSend: () => void | Promise<void>;
  saving?: boolean;
}

const formatNaira = (n: number) =>
  `₦${(n ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const formatDateLong = (d: Date | null) => {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-lg">
        <DialogHeader>
          <DialogTitle>Receipt Review</DialogTitle>
        </DialogHeader>

        {/* Receipt preview */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                Payment Receipt
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {data.tenantName}
              </p>
              {data.property && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {data.property}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">
                Reference
              </p>
              <p className="text-xs font-mono text-gray-900 mt-0.5">
                {reference}
              </p>
            </div>
          </div>

          <dl className="divide-y divide-gray-100">
            <div className="flex justify-between px-5 py-3">
              <dt className="text-xs text-gray-500">Description</dt>
              <dd className="text-sm font-medium text-gray-900 text-right">
                {data.description || "—"}
              </dd>
            </div>
            <div className="flex justify-between px-5 py-3">
              <dt className="text-xs text-gray-500">Payment Date</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatDateLong(data.date)}
              </dd>
            </div>
            <div className="flex justify-between px-5 py-4 bg-[#FFF8F4]">
              <dt className="text-sm font-semibold text-gray-900">
                Amount Paid
              </dt>
              <dd className="text-base font-semibold text-[#FF5000] tabular-nums">
                {formatNaira(data.amount)}
              </dd>
            </div>
          </dl>

          <div className="px-5 py-3 border-t border-gray-100 text-[10px] text-gray-400">
            Receipt will be saved to History and Documents.
          </div>
        </div>

        <div className="flex gap-2 pt-2">
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
