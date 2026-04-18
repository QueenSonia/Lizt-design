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

/**
 * Calculates the end date based on the start date and payment frequency.
 * Start date + frequency months - 1 day.
 */
export const calculateEndDate = (
  startDateString: string,
  frequency: string,
): string => {
  if (!startDateString || !frequency) {
    return "";
  }
  const [year, month, day] = startDateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  let monthsToAdd = 0;
  switch (frequency.toLowerCase()) {
    case "monthly":
      monthsToAdd = 1;
      break;
    case "quarterly":
      monthsToAdd = 3;
      break;
    case "bi-annually":
      monthsToAdd = 6;
      break;
    case "annually":
      monthsToAdd = 12;
      break;
    default:
      return "";
  }

  date.setMonth(date.getMonth() + monthsToAdd);

  // Handle month overflow (e.g. Jan 31 + 1 month -> Feb 28/29)
  const targetMonth = (month - 1 + monthsToAdd) % 12;
  if (date.getMonth() !== targetMonth) {
    date.setDate(0);
  }

  date.setDate(date.getDate() - 1);

  const calculatedYear = date.getFullYear();
  const calculatedMonth = String(date.getMonth() + 1).padStart(2, "0");
  const calculatedDay = String(date.getDate()).padStart(2, "0");
  return `${calculatedYear}-${calculatedMonth}-${calculatedDay}`;
};

export interface RenewTenancyData {
  rentAmount: string;
  paymentFrequency: string;
  serviceCharge: string;
  /** ISO date string (YYYY-MM-DD) — only set if landlord manually overrode it */
  endDate?: string;
}

interface RenewTenancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: RenewTenancyData) => void;
  tenantName?: string;
  propertyName?: string;
  currentExpiryDate?: string;
  currentRentAmount?: number;
  currentPaymentFrequency?: string;
  currentServiceCharge?: number;
  isLoading?: boolean;
}

const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function RenewTenancyModal({
  isOpen,
  onClose,
  onConfirm,
  tenantName = "Unknown Tenant",
  propertyName = "Unknown Property",
  currentExpiryDate = "",
  currentRentAmount = 0,
  currentPaymentFrequency = "Annually",
  currentServiceCharge = 0,
  isLoading = false,
}: RenewTenancyModalProps) {
  const [paymentFrequency, setPaymentFrequency] = useState(
    currentPaymentFrequency,
  );
  const [rentAmount, setRentAmount] = useState(
    currentRentAmount ? formatNumberWithCommas(currentRentAmount) : "",
  );
  const [serviceCharge, setServiceCharge] = useState(
    currentServiceCharge ? formatNumberWithCommas(currentServiceCharge) : "",
  );
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [errors, setErrors] = useState<{
    rentAmount?: string;
    paymentFrequency?: string;
    endDate?: string;
  }>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Compute new start date = current expiry + 1 day
  const newStartDate = useMemo(() => {
    if (!currentExpiryDate) return "";
    const date = new Date(currentExpiryDate);
    if (isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [currentExpiryDate]);

  // Auto-calculated end date (frequency-based)
  const autoEndDate = useMemo(() => {
    return calculateEndDate(newStartDate, paymentFrequency);
  }, [newStartDate, paymentFrequency]);

  // Effective end date: custom override takes precedence
  const newEndDate = customEndDate || autoEndDate;

  const handlePaymentFrequencyChange = (value: string) => {
    setPaymentFrequency(value);
    setCustomEndDate(""); // reset override so auto-calc takes over
    setErrors((prev) => ({ ...prev, paymentFrequency: undefined }));
  };

  const handleRentAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const formatted = formatNumberWithCommas(parseFloat(numericValue) || 0);
    setRentAmount(formatted);
    setErrors((prev) => ({ ...prev, rentAmount: undefined }));
  };

  const handleServiceChargeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    if (!numericValue || parseFloat(numericValue) === 0) {
      setServiceCharge("");
      return;
    }
    const formatted = formatNumberWithCommas(parseFloat(numericValue) || 0);
    setServiceCharge(formatted);
  };

  const validateForm = (): boolean => {
    const newErrors: { rentAmount?: string; paymentFrequency?: string; endDate?: string } = {};

    if (!paymentFrequency) {
      newErrors.paymentFrequency = "Payment frequency is required";
    }

    if (!rentAmount || parseFormattedNumber(rentAmount) === "0") {
      newErrors.rentAmount = "Rent amount is required";
    } else {
      const numericValue = parseFloat(parseFormattedNumber(rentAmount));
      if (isNaN(numericValue) || numericValue <= 0) {
        newErrors.rentAmount = "Please enter a valid rent amount";
      }
    }

    if (customEndDate && newStartDate && customEndDate <= newStartDate) {
      newErrors.endDate = "End date must be after the start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleSendRenewal = () => {
    onConfirm({
      rentAmount,
      paymentFrequency,
      serviceCharge,
      endDate: customEndDate || undefined,
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      setShowConfirmation(false);
      setErrors({});
      onClose();
    }
  };

  const formatDateRange = (): string => {
    return `${formatDisplayDate(newStartDate)} - ${formatDisplayDate(newEndDate)}`;
  };

  const formatRentAmount = (amount: string): string => {
    return `₦${amount}`;
  };

  // Reset form when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPaymentFrequency(currentPaymentFrequency);
      setRentAmount(
        currentRentAmount ? formatNumberWithCommas(currentRentAmount) : "",
      );
      setServiceCharge(
        currentServiceCharge ? formatNumberWithCommas(currentServiceCharge) : "",
      );
      setCustomEndDate("");
      setErrors({});
      setShowConfirmation(false);
    } else {
      handleClose();
    }
  };

  // Confirmation Modal
  if (showConfirmation) {
    return (
      <Dialog open={true} onOpenChange={() => setShowConfirmation(false)}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Confirm Tenancy Renewal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-700">
              You are about to renew tenancy for{" "}
              <span className="font-medium text-gray-900">{tenantName}</span> at{" "}
              <span className="font-medium text-gray-900">{propertyName}</span>.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tenancy Period</p>
                <p className="text-sm text-gray-900 font-medium">
                  {formatDateRange()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Payment Frequency</p>
                <p className="text-sm text-gray-900 font-medium">
                  {paymentFrequency}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Rent Amount</p>
                <p className="text-sm text-gray-900 font-medium">
                  {formatRentAmount(rentAmount)}
                </p>
              </div>

              {serviceCharge && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Service Charge</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {formatRentAmount(serviceCharge)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendRenewal}
              disabled={isLoading}
              className="bg-[#FF5000] hover:bg-[#E64500] text-white"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Send Renewal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Main Renewal Form Modal
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Renew Tenancy</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Extend the tenancy period for{" "}
            <span className="font-medium text-gray-700">{tenantName}</span> at{" "}
            <span className="font-medium text-gray-700">{propertyName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSaveRenewal} className="space-y-6 py-4">
          {/* Payment Frequency - First */}
          <div className="space-y-2">
            <Label htmlFor="paymentFrequency" className="text-gray-700">
              Payment Frequency *
            </Label>
            <Select
              value={paymentFrequency}
              onValueChange={handlePaymentFrequencyChange}
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

          {/* Start Date - Read-only */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-gray-700">
              Tenancy Start Date
            </Label>
            <Input
              id="startDate"
              type="text"
              value={formatDisplayDate(newStartDate)}
              disabled
              readOnly
              className="bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300"
            />
            <p className="text-xs text-gray-500">
              Auto-calculated from previous tenancy end date
            </p>
          </div>

          {/* End Date - Editable */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-gray-700">
              End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              value={customEndDate || autoEndDate}
              min={newStartDate || undefined}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setErrors((prev) => ({ ...prev, endDate: undefined }));
              }}
              className={errors.endDate ? "border-red-500" : "border-gray-300"}
              disabled={isLoading}
            />
            {customEndDate && autoEndDate && customEndDate !== autoEndDate ? (
              <p className="text-xs text-blue-600">
                Manually set (auto-calculated: {formatDisplayDate(autoEndDate)}).{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setCustomEndDate("")}
                >
                  Reset
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Auto-calculated from payment frequency. You can adjust it manually.
              </p>
            )}
            {errors.endDate && (
              <p className="text-xs text-red-500">{errors.endDate}</p>
            )}
          </div>

          {/* Rent Amount - Editable */}
          <div className="space-y-2">
            <Label htmlFor="rentAmount" className="text-gray-700">
              Rent Amount *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                ₦
              </span>
              <Input
                id="rentAmount"
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

          {/* Service Charge - Editable, autofilled from previous period */}
          <div className="space-y-2">
            <Label htmlFor="serviceCharge" className="text-gray-700">
              Service Charge
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                ₦
              </span>
              <Input
                id="serviceCharge"
                type="text"
                placeholder="0"
                value={serviceCharge}
                onChange={(e) => handleServiceChargeChange(e.target.value)}
                className="pl-10 border-gray-300"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Auto-filled from previous period. Leave empty or 0 if not applicable.
            </p>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
              Save Renewal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
