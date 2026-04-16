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

export interface EditNextPeriodData {
  rentAmount: number;
  serviceCharge: number;
  paymentFrequency: string;
}

interface EditNextPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: EditNextPeriodData) => void;
  currentRentAmount: number;
  currentServiceCharge: number;
  currentPaymentFrequency: string;
  /** The current lease expiry date (ISO string) — used to preview the next period */
  currentExpiryDate: string;
  isLoading?: boolean;
}

export function EditNextPeriodModal({
  isOpen,
  onClose,
  onConfirm,
  currentRentAmount,
  currentServiceCharge,
  currentPaymentFrequency,
  currentExpiryDate,
  isLoading = false,
}: EditNextPeriodModalProps) {
  const [paymentFrequency, setPaymentFrequency] = useState(
    currentPaymentFrequency,
  );
  const [rentAmount, setRentAmount] = useState(
    currentRentAmount ? formatNumberWithCommas(currentRentAmount) : "",
  );
  const [serviceCharge, setServiceCharge] = useState(
    currentServiceCharge ? formatNumberWithCommas(currentServiceCharge) : "",
  );
  const [errors, setErrors] = useState<{
    rentAmount?: string;
    paymentFrequency?: string;
  }>({});

  // Next period start = current expiry + 1 day
  const nextPeriodStart = useMemo(() => {
    if (!currentExpiryDate) return "";
    const date = new Date(currentExpiryDate);
    if (isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [currentExpiryDate]);

  const nextPeriodEnd = useMemo(
    () => calculateEndDate(nextPeriodStart, paymentFrequency),
    [nextPeriodStart, paymentFrequency],
  );

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPaymentFrequency(currentPaymentFrequency);
      setRentAmount(
        currentRentAmount ? formatNumberWithCommas(currentRentAmount) : "",
      );
      setServiceCharge(
        currentServiceCharge
          ? formatNumberWithCommas(currentServiceCharge)
          : "",
      );
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
    const newErrors: { rentAmount?: string; paymentFrequency?: string } = {};
    if (!paymentFrequency)
      newErrors.paymentFrequency = "Payment frequency is required";
    if (!rentAmount || parseFormattedNumber(rentAmount) === "0") {
      newErrors.rentAmount = "Rent amount is required";
    } else if (isNaN(parseFloat(parseFormattedNumber(rentAmount)))) {
      newErrors.rentAmount = "Please enter a valid rent amount";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onConfirm({
      rentAmount: parseFloat(parseFormattedNumber(rentAmount)),
      serviceCharge: serviceCharge
        ? parseFloat(parseFormattedNumber(serviceCharge))
        : 0,
      paymentFrequency,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Edit Next Period</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Set the rent terms for this tenant&apos;s upcoming renewal period.
            These details will be used when the renewal invoice is sent to the
            tenant.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Period preview */}
          {nextPeriodStart && nextPeriodEnd && (
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">Next period</p>
              <p className="text-sm text-gray-700 font-medium">
                {formatDisplayDate(nextPeriodStart)} —{" "}
                {formatDisplayDate(nextPeriodEnd)}
              </p>
            </div>
          )}

          {/* Payment Frequency */}
          <div className="space-y-2">
            <Label className="text-gray-700">Payment Frequency *</Label>
            <Select
              value={paymentFrequency}
              onValueChange={(v) => {
                setPaymentFrequency(v);
                setErrors((prev) => ({ ...prev, paymentFrequency: undefined }));
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                className={
                  errors.paymentFrequency ? "border-red-500" : "border-gray-300"
                }
              >
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ₦
              </span>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ₦
              </span>
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
