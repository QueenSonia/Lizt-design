/* eslint-disable */
"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, AlertCircle, ChevronLeft } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { addPaymentPlan, updatePaymentPlan, type PaymentPlan } from "@/lib/paymentPlanStore";
import type { PlanScope } from "./PlanScopePickerModal";

export interface ChargeOption {
  name: string;
  amount: number;
}

interface Installment {
  id: string;
  amount: string;
  dueDate: string;
}

type Frequency = "weekly" | "monthly" | "quarterly" | "annually";

interface Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  propertyName: string;
  tenantId: string;
  charges: ChargeOption[];
  scope: PlanScope;
  existingPlan?: PaymentPlan; // when set, modal is in edit mode
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
}

function formatCurrency(n: number): string {
  return `₦${n.toLocaleString()}`;
}

function addPeriod(base: Date, frequency: Frequency, count: number): Date {
  const d = new Date(base);
  switch (frequency) {
    case "weekly":  d.setDate(d.getDate() + count * 7); break;
    case "monthly": d.setMonth(d.getMonth() + count); break;
    case "quarterly": d.setMonth(d.getMonth() + count * 3); break;
    case "annually": d.setFullYear(d.getFullYear() + count); break;
  }
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildEqualInstallments(total: number, n: number, frequency: Frequency, startDate: string): Installment[] {
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  const origin = startDate ? new Date(startDate + "T00:00:00") : new Date();
  return Array.from({ length: n }, (_, i) => ({
    id: generateId(),
    amount: String(i === n - 1 ? base + remainder : base),
    dueDate: toISODate(addPeriod(origin, frequency, i)),
  }));
}

const FREQ_LABELS: Record<Frequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
};

export function CreatePaymentPlanModal({
  open,
  onClose,
  onBack,
  propertyName,
  tenantId,
  charges,
  scope,
  existingPlan,
}: Props) {
  const isEditMode = !!existingPlan;
  const [selectedCharge, setSelectedCharge] = useState<string>("");
  const [planType, setPlanType] = useState<"equal" | "custom">("equal");
  const [numInstallments, setNumInstallments] = useState("2");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [startDate, setStartDate] = useState<string>("");
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const tenancyTotal = charges.reduce((sum, c) => sum + c.amount, 0);
  const chargeObj = charges.find((c) => c.name === selectedCharge) ?? null;
  const total = scope === "tenancy" ? tenancyTotal : (chargeObj?.amount ?? 0);
  const isReady = scope === "tenancy" ? total > 0 : !!chargeObj;

  // Track previous open state to detect open transition
  const prevOpenRef = useRef(false);

  // When modal opens, reset everything and seed schedule
  if (open && !prevOpenRef.current) {
    prevOpenRef.current = true;
    // Synchronously initialize state for this open
  }
  if (!open && prevOpenRef.current) {
    prevOpenRef.current = false;
  }

  // Reset on open — pre-fill if editing
  useEffect(() => {
    if (!open) return;
    setErrors([]);
    if (existingPlan) {
      setSelectedCharge(existingPlan.chargeName === "Entire Tenancy" ? "" : existingPlan.chargeName);
      setPlanType(existingPlan.planType);
      setNumInstallments(String(existingPlan.installments.length));
      setFrequency("monthly");
      setStartDate(existingPlan.installments[0]?.dueDate ?? "");
      setInstallments(existingPlan.installments.map((i) => ({
        id: i.id,
        amount: String(i.amount),
        dueDate: i.dueDate,
      })));
    } else {
      setSelectedCharge("");
      setPlanType("equal");
      setNumInstallments("2");
      setFrequency("monthly");
      setStartDate("");
      setInstallments([]);
    }
  }, [open]);

  // Regenerate equal schedule whenever inputs that affect it change
  // For tenancy: total is known immediately. For charge: waits until chargeObj is set.
  useEffect(() => {
    if (!open) return;
    if (planType !== "equal") return;
    if (total <= 0) return;
    const n = Math.max(1, parseInt(numInstallments) || 1);
    setInstallments(buildEqualInstallments(total, n, frequency, startDate));
    setErrors([]);
  }, [open, total, planType, numInstallments, frequency, startDate]);

  // Seed one blank row when switching to custom
  useEffect(() => {
    if (planType === "custom") {
      setInstallments([{ id: generateId(), amount: "", dueDate: "" }]);
      setErrors([]);
    }
  }, [planType]);

  function updateInstallment(id: string, field: "amount" | "dueDate", value: string) {
    setInstallments((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    setErrors([]);
  }

  function addRow() {
    setInstallments((prev) => [...prev, { id: generateId(), amount: "", dueDate: "" }]);
  }

  function removeRow(id: string) {
    setInstallments((prev) => prev.filter((r) => r.id !== id));
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (scope === "charge" && !selectedCharge) errs.push("Please select a charge.");
    if (planType === "equal" && !startDate) errs.push("Please select a start date.");
    if (installments.length === 0) errs.push("Add at least one installment.");
    installments.forEach((row, i) => {
      if (parseCurrency(row.amount) <= 0)
        errs.push(`Installment ${i + 1}: amount must be greater than zero.`);
      if (!row.dueDate) errs.push(`Installment ${i + 1}: due date is required.`);
    });
    if (errs.length === 0 && total > 0) {
      const sum = installments.reduce((acc, r) => acc + parseCurrency(r.amount), 0);
      if (Math.abs(sum - total) > 1) {
        errs.push(
          `Installment total (${formatCurrency(sum)}) must equal the ${scope === "tenancy" ? "tenancy total" : "charge amount"} (${formatCurrency(total)}).`
        );
      }
    }
    return errs;
  }

  function handleCreate() {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    const mappedInstallments = installments.map((row) => ({
      id: row.id,
      amount: parseCurrency(row.amount),
      dueDate: row.dueDate,
      status: "pending" as const,
    }));
    if (isEditMode && existingPlan) {
      updatePaymentPlan(existingPlan.id, { planType, installments: mappedInstallments });
    } else {
      addPaymentPlan({
        propertyName,
        tenantId,
        chargeName: scope === "tenancy" ? "Entire Tenancy" : selectedCharge,
        totalAmount: total,
        planType,
        installments: mappedInstallments,
      });
    }
    handleClose();
  }

  function handleClose() {
    setSelectedCharge("");
    setPlanType("equal");
    setNumInstallments("2");
    setFrequency("monthly");
    setStartDate("");
    setInstallments([]);
    setErrors([]);
    onClose();
  }

  const installmentSum = installments.reduce((acc, r) => acc + parseCurrency(r.amount), 0);
  const remaining = total - installmentSum;
  const scopeLabel = scope === "tenancy" ? "Entire Tenancy" : "Specific Charge";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600 transition-colors -ml-1 p-1 rounded"
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <DialogTitle>Create Payment Plan</DialogTitle>
              <p className="text-xs text-gray-400 mt-0.5">{scopeLabel}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* Charge selector — Specific Charge only */}
          {scope === "charge" && (
            <div className="space-y-1.5">
              <Label>Charge</Label>
              <Select value={selectedCharge} onValueChange={(v) => { setSelectedCharge(v); setErrors([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a charge" />
                </SelectTrigger>
                <SelectContent>
                  {charges.map((c) => (
                    <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* No charges warning */}
          {scope === "tenancy" && tenancyTotal === 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              No charge data available for this property. Go back to the property page and try again.
            </div>
          )}

          {/* Total amount */}
          {isReady && (
            <div className="space-y-1.5">
              <Label>Total Amount</Label>
              <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700 font-medium">
                {formatCurrency(total)}
                {scope === "tenancy" && charges.length > 1 && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    ({charges.map((c) => c.name).join(" + ")})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Plan type toggle */}
          {isReady && (
            <div className="space-y-1.5">
              <Label>Plan Type</Label>
              <div className="flex gap-2">
                {(["equal", "custom"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPlanType(type)}
                    className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                      planType === type
                        ? "border-[#FF5000] bg-[#FFF3EB] text-[#FF5000]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {type === "equal" ? "Equal Split" : "Custom Plan"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Equal split controls */}
          {isReady && planType === "equal" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Number of Installments</Label>
                <Input
                  type="number"
                  min="2"
                  max="52"
                  value={numInstallments}
                  onChange={(e) => setNumInstallments(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FREQ_LABELS) as Frequency[]).map((f) => (
                      <SelectItem key={f} value={f}>{FREQ_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Installment schedule */}
          {isReady && installments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Installment Schedule</Label>
                {planType === "custom" && (
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1 text-xs text-[#FF5000] hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Add row
                  </button>
                )}
              </div>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-gray-400 px-1">
                <span>Amount</span>
                <span>Due Date</span>
                <span />
              </div>
              <div className="space-y-2">
                {installments.map((row) => (
                  <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    {planType === "equal" ? (
                      <div className="px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                        {formatCurrency(parseCurrency(row.amount))}
                      </div>
                    ) : (
                      <Input
                        placeholder="₦0"
                        value={row.amount}
                        onChange={(e) => updateInstallment(row.id, "amount", e.target.value)}
                      />
                    )}
                    <Input
                      type="date"
                      value={row.dueDate}
                      readOnly={planType === "equal"}
                      className={planType === "equal" ? "bg-gray-50" : ""}
                      onChange={(e) => planType === "custom" && updateInstallment(row.id, "dueDate", e.target.value)}
                    />
                    {planType === "custom" && installments.length > 1 ? (
                      <button type="button" onClick={() => removeRow(row.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="w-4" />
                    )}
                  </div>
                ))}
              </div>
              {planType === "custom" && total > 0 && (
                <div className={`text-xs mt-1 ${Math.abs(remaining) <= 1 ? "text-green-600" : "text-orange-500"}`}>
                  {Math.abs(remaining) <= 1
                    ? "Total matches amount ✓"
                    : `Remaining: ${formatCurrency(Math.abs(remaining))} ${remaining > 0 ? "unallocated" : "over"}`}
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-1">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={scope === "charge" ? !selectedCharge : !isReady}
            className="bg-[#FF5000] hover:bg-[#e04600] text-white"
          >
            Create Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
