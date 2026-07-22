"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { installmentAmountPaid, type ProposalInstallment } from "@/lib/paymentPlanThreadStore";

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}

interface Props {
  open: boolean;
  installment: ProposalInstallment | null;
  installmentIndex: number;
  installmentTotal: number;
  onClose: () => void;
}

/** Read-only view of everything recorded against a fully-paid installment — opened by clicking its "Paid" badge. */
export function InstallmentPaymentDetailsModal({
  open,
  installment,
  installmentIndex,
  installmentTotal,
  onClose,
}: Props) {
  if (!installment) return null;

  const payments = [...(installment.payments ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const totalPaid = installmentAmountPaid(installment);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1.5">
            <DetailRow label="Installment" value={`${installmentIndex} of ${installmentTotal}`} />
            <DetailRow label="Due Date" value={formatDate(installment.dueDate)} />
            <DetailRow label="Expected Amount" value={formatCurrency(installment.amount)} />
            <DetailRow label="Total Paid" value={formatCurrency(totalPaid)} />
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-gray-400">No individual payment records are available for this installment.</p>
          ) : (
            <div className="space-y-3">
              {payments.length > 1 && (
                <p className="text-xs font-medium text-gray-500">
                  {payments.length} payments recorded, in chronological order
                </p>
              )}
              {payments.map((p, i) => (
                <div key={p.id} className="rounded-lg border border-gray-100 p-3 space-y-1.5">
                  {payments.length > 1 && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Payment {i + 1}
                    </p>
                  )}
                  <DetailRow label="Amount Paid" value={formatCurrency(p.amount)} />
                  <DetailRow label="Payment Date" value={formatDate(p.date)} />
                  <DetailRow label="Payment Method" value={p.method} />
                  {p.reference && <DetailRow label="Reference" value={p.reference} />}
                  {p.notes && <DetailRow label="Notes" value={p.notes} />}
                  <DetailRow label="Recorded By" value={p.recordedBy} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
