import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  formatNumberWithCommas,
  parseFormattedNumber,
} from "../utilities/utilities";
import { calculateEndDate } from "./RenewTenancyModal";

const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export interface EditTenancyData {
  rentAmount: number;
  serviceCharge: number;
  paymentFrequency: string;
  /** ISO date string (YYYY-MM-DD) — only set if manually overridden */
  endDate?: string;
}

interface EditTenancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: EditTenancyData) => void;
  mode: "current" | "next-period";
  currentRentAmount: number;
  currentServiceCharge: number;
  currentPaymentFrequency: string;
  /** Required for next-period mode — used to preview the upcoming period dates */
  currentExpiryDate?: string;
  /** Pre-fill end date (e.g. from an existing pending renewal invoice) */
  initialEndDate?: string;
  isLoading?: boolean;
}

export function EditTenancyModal({
  isOpen,
  onClose,
  onConfirm,
  mode,
  currentRentAmount,
  currentServiceCharge,
  currentPaymentFrequency,
  currentExpiryDate = "",
  initialEndDate,
  isLoading = false,
}: EditTenancyModalProps) {
  const [paymentFrequency, setPaymentFrequency] = useState(currentPaymentFrequency);
  const [rentAmount, setRentAmount] = useState(
    currentRentAmount ? formatNumberWithCommas(currentRentAmount) : "",
  );
  const [serviceCharge, setServiceCharge] = useState(
    currentServiceCharge ? formatNumberWithCommas(currentServiceCharge) : "",
  );
  const [customEndDate, setCustomEndDate] = useState<string>(initialEndDate ?? "");
  const [errors, setErrors] = useState<{ rentAmount?: string; paymentFrequency?: string; endDate?: string }>({});

  const isNextPeriod = mode === "next-period";

  // Next period start = current expiry + 1 day (only used in next-period mode)
  const nextPeriodStart = useMemo(() => {
    if (!isNextPeriod || !currentExpiryDate) return "";
    const date = new Date(currentExpiryDate);
    if (isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [isNextPeriod, currentExpiryDate]);

  const autoNextPeriodEnd = useMemo(
    () => calculateEndDate(nextPeriodStart, paymentFrequency),
    [nextPeriodStart, paymentFrequency],
  );

  const nextPeriodEnd = customEndDate || autoNextPeriodEnd;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPaymentFrequency(currentPaymentFrequency);
      setRentAmount(currentRentAmount ? formatNumberWithCommas(currentRentAmount) : "");
      setServiceCharge(currentServiceCharge ? formatNumberWithCommas(currentServiceCharge) : "");
      setCustomEndDate(initialEndDate ?? "");
      setErrors({});
    } else if (!isLoading) {
      onClose();
    }
  };

  const handleRentAmountChange = (value: string) => {
    const numeric = value.replace(/[^0-9.]/g, "");
    setRentAmount(formatNumberWithCommas(parseFloat(numeric) || 0));
    setErrors((prev) => ({ ...prev, rentAmount: undefined }));
  };

  const handleServiceChargeChange = (value: string) => {
    const numeric = value.replace(/[^0-9.]/g, "");
    if (!numeric || parseFloat(numeric) === 0) {
      setServiceCharge("");
      return;
    }
    setServiceCharge(formatNumberWithCommas(parseFloat(numeric) || 0));
  };

  const validate = (): boolean => {
    const newErrors: { rentAmount?: string; paymentFrequency?: string; endDate?: string } = {};
    if (!paymentFrequency) newErrors.paymentFrequency = "Payment frequency is required";
    if (!rentAmount || parseFormattedNumber(rentAmount) === "0") {
      newErrors.rentAmount = "Rent amount is required";
    } else if (isNaN(parseFloat(parseFormattedNumber(rentAmount)))) {
      newErrors.rentAmount = "Please enter a valid rent amount";
    }
    if (isNextPeriod && customEndDate && nextPeriodStart && customEndDate <= nextPeriodStart) {
      newErrors.endDate = "End date must be after the start date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onConfirm({
      rentAmount: parseFloat(parseFormattedNumber(rentAmount)),
      serviceCharge: serviceCharge ? parseFloat(parseFormattedNumber(serviceCharge)) : 0,
      paymentFrequency,
      endDate: isNextPeriod && customEndDate ? customEndDate : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {isNextPeriod ? "Edit Next Period" : "Edit Tenancy"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {isNextPeriod
              ? "Set the rent terms for this tenant's upcoming renewal period. These details will be used when the renewal invoice is sent to the tenant."
              : "Update the current tenancy details. Changes take effect immediately on the active rent record."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Next period dates */}
          {isNextPeriod && nextPeriodStart && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Start date</p>
                <p className="text-sm text-gray-700 font-medium">{formatDisplayDate(nextPeriodStart)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">End date</p>
                <input
                  type="date"
                  value={customEndDate || autoNextPeriodEnd}
                  min={nextPeriodStart || undefined}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setErrors((prev) => ({ ...prev, endDate: undefined }));
                  }}
                  disabled={isLoading}
                  className={`w-full rounded-md border px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5000] ${errors.endDate ? "border-red-500" : "border-gray-300"}`}
                />
                {customEndDate && autoNextPeriodEnd && customEndDate !== autoNextPeriodEnd ? (
                  <p className="text-xs text-blue-600 mt-1">
                    Manually set (auto: {formatDisplayDate(autoNextPeriodEnd)}).{" "}
                    <button type="button" className="underline" onClick={() => setCustomEndDate("")}>Reset</button>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Auto-calculated. You can adjust it.</p>
                )}
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>
          )}

          {/* Payment Frequency */}
          <div className="space-y-2">
            <Label className="text-gray-700">Payment Frequency *</Label>
            <Select
              value={paymentFrequency}
              onValueChange={(v) => {
                setPaymentFrequency(v);
                setCustomEndDate(""); // reset override so auto-calc takes over
                setErrors((prev) => ({ ...prev, paymentFrequency: undefined }));
              }}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.paymentFrequency ? "border-red-500" : "border-gray-300"}>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Bi-annually">Bi-annually</SelectItem>
                <SelectItem value="Annually">Annually</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentFrequency && (
              <p className="text-xs text-red-500">{errors.paymentFrequency}</p>
            )}
          </div>

          {/* Rent Amount */}
          <div className="space-y-2">
            <Label className="text-gray-700">Rent Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <Input
                type="text"
                placeholder="0"
                value={rentAmount}
                onChange={(e) => handleRentAmountChange(e.target.value)}
                className={`pl-10 ${errors.rentAmount ? "border-red-500" : "border-gray-300"}`}
                disabled={isLoading}
              />
            </div>
            {errors.rentAmount && (
              <p className="text-xs text-red-500">{errors.rentAmount}</p>
            )}
          </div>

          {/* Service Charge */}
          <div className="space-y-2">
            <Label className="text-gray-700">Service Charge</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <Input
                type="text"
                placeholder="0"
                value={serviceCharge}
                onChange={(e) => handleServiceChargeChange(e.target.value)}
                className="pl-10 border-gray-300"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#FF5000] hover:bg-[#E64500] text-white"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
