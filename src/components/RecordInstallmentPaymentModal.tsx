"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  installmentAmountPaid,
  installmentBalance,
  type InstallmentPaymentMethod,
  type ProposalInstallment,
} from "@/lib/paymentPlanThreadStore";

function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
}

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const PAYMENT_METHODS: InstallmentPaymentMethod[] = ["Bank Transfer", "Cash", "POS", "Cheque", "Other"];

export interface RecordInstallmentPaymentResult {
  amount: number;
  date: string;
  method: InstallmentPaymentMethod;
  reference?: string;
  notes?: string;
}

interface Props {
  open: boolean;
  installment: ProposalInstallment | null;
  installmentIndex: number;
  installmentTotal: number;
  onClose: () => void;
  onSave: (result: RecordInstallmentPaymentResult) => void;
}

export function RecordInstallmentPaymentModal({
  open,
  installment,
  installmentIndex,
  installmentTotal,
  onClose,
  onSave,
}: Props) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [method, setMethod] = useState<InstallmentPaymentMethod>("Bank Transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const balance = installment ? installmentBalance(installment) : 0;
  const alreadyPaid = installment ? installmentAmountPaid(installment) : 0;

  useEffect(() => {
    if (open && installment) {
      setAmount(String(installmentBalance(installment)));
      setDate(toISODate(new Date()));
      setMethod("Bank Transfer");
      setReference("");
      setNotes("");
      setErrors([]);
    }
  }, [open, installment]);

  if (!installment) return null;

  function handleSave() {
    const parsedAmount = parseCurrency(amount);
    const nextErrors: string[] = [];
    if (parsedAmount <= 0) nextErrors.push("Enter a payment amount greater than ₦0.");
    if (parsedAmount > balance) nextErrors.push(`Amount paid cannot exceed the remaining balance of ${formatCurrency(balance)}.`);
    if (!date) nextErrors.push("Select a payment date.");
    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSave({
      amount: parsedAmount,
      date,
      method,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Installment Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Installment being updated */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Installment</span>
              <span className="font-medium text-gray-900">{installmentIndex} of {installmentTotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Due Date</span>
              <span className="font-medium text-gray-900">{formatDate(installment.dueDate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Expected Amount</span>
              <span className="font-medium text-gray-900">{formatCurrency(installment.amount)}</span>
            </div>
            {alreadyPaid > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Already Paid</span>
                <span className="font-medium text-gray-900">{formatCurrency(alreadyPaid)}</span>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Amount Paid</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="₦0"
              inputMode="decimal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as InstallmentPaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reference (Optional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transaction reference or receipt number"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context about this payment…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-[#FF5000] hover:bg-[#e04600] text-white" onClick={handleSave}>
            Save Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
