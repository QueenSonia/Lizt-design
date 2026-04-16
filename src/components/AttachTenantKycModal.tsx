import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

import { toast } from "sonner";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { formatLocalDate, parseLocalDate } from "@/utils/date-utils";

// Utility functions for number formatting
const formatNumberWithCommas = (value: string) => {
  const numericValue = value.replace(/[^\d]/g, "");
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const parseFormattedNumber = (value: string) => {
  return value.replace(/,/g, "");
};

interface KYCApplication {
  id: number;
  name: string;
  email: string;
  phone: string;
  occupation: string;
  idType: string;
  submittedDate: string;
  status: "Pending" | "Attached" | "Rejected";
}

interface TenancyData {
  rentAmount: number;
  rentFrequency: string;
  tenancyStartDate: string;
  serviceCharge?: number | null;
}

interface AttachTenantKYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: KYCApplication;
  propertyName: string;
  onAttachTenant: (
    applicationId: number,
    tenancyData: TenancyData
  ) => Promise<void>;
}

export function AttachTenantKYCModal({
  isOpen,
  onClose,
  application,
  propertyName,
  onAttachTenant,
}: AttachTenantKYCModalProps) {
  const [rentAmount, setRentAmount] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [rentFrequency, setRentFrequency] = useState("");
  const [tenancyStartDate, setTenancyStartDate] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Handle form validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    const cleanAmount = parseFormattedNumber(rentAmount);
    const numericAmount = parseFloat(cleanAmount);

    if (!cleanAmount || numericAmount <= 0) {
      newErrors.rentAmount = "Please enter a valid rent amount";
    } else if (numericAmount > 2147483647) {
      newErrors.rentAmount =
        "Rent amount is too large. Maximum allowed is ₦2,147,483,647";
    }

    if (!tenancyStartDate) {
      newErrors.tenancyStartDate = "Please select a rent start date";
    }

    if (!rentFrequency) {
      newErrors.rentFrequency = "Please select a rent frequency";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const tenancyData: TenancyData = {
      rentAmount: parseFloat(parseFormattedNumber(rentAmount)),
      rentFrequency,
      tenancyStartDate, // YYYY-MM-DD
      serviceCharge: serviceCharge
        ? parseFloat(parseFormattedNumber(serviceCharge))
        : null,
    };

    console.log("Submitting tenant attachment:", tenancyData);

    try {
      // Close modal immediately to prevent any UI blocking
      onClose();

      // Then proceed with tenant attachment
      await onAttachTenant(application.id, tenancyData);
    } catch (error) {
      // Error is already handled by the mutation hook
      console.error("Failed to attach tenant:", error);
    }
  };

  // Handle modal close with reset
  const handleClose = () => {
    setRentAmount("");
    setServiceCharge("");
    setRentFrequency("");
    setTenancyStartDate("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={true}>
      <DialogContent className="bg-white rounded-xl max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Attach Tenant to {propertyName}</DialogTitle>
          <DialogDescription>
            Complete the tenancy details to attach this applicant as a tenant to
            the property.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Tenancy Details (Editable) */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-gray-900">Tenancy Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent-amount" className="text-sm text-gray-700">
                  Rent Amount (₦) *
                </Label>
                {/* <p className="text-xs text-gray-500">Maximum: ₦2,147,483,647</p> */}
                <Input
                  id="rent-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter rent amount"
                  value={rentAmount}
                  onChange={(e) => {
                    const formatted = formatNumberWithCommas(e.target.value);
                    const numericValue = parseFloat(
                      parseFormattedNumber(formatted)
                    );

                    setRentAmount(formatted);

                    // Clear existing error or set new error for large amounts
                    if (numericValue > 2147483647) {
                      setErrors({
                        ...errors,
                        rentAmount:
                          "Rent amount is too large. Maximum allowed is ₦2,147,483,647",
                      });
                    } else if (errors.rentAmount) {
                      setErrors({ ...errors, rentAmount: "" });
                    }
                  }}
                  onFocus={(e) => {
                    // Scroll input into view on mobile when focused
                    setTimeout(() => {
                      e.target.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 300);
                  }}
                  className={`rounded-xl ${
                    errors.rentAmount ? "border-red-500" : ""
                  }`}
                />
                {errors.rentAmount && (
                  <p className="text-xs text-red-600">{errors.rentAmount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="rent-frequency"
                  className="text-sm text-gray-700"
                >
                  Rent Frequency Cycle *
                </Label>
                <Select
                  value={rentFrequency}
                  onValueChange={(value) => {
                    setRentFrequency(value);
                    if (errors.rentFrequency) {
                      setErrors({ ...errors, rentFrequency: "" });
                    }
                  }}
                >
                  <SelectTrigger
                    id="rent-frequency"
                    className={`rounded-xl ${
                      errors.rentFrequency ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent
                    className="bg-white rounded-xl z-100"
                    position="popper"
                    sideOffset={5}
                  >
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="bi-annually">Bi-Annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
                {errors.rentFrequency && (
                  <p className="text-xs text-red-600">{errors.rentFrequency}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tenancy-start"
                  className="text-sm text-gray-700"
                >
                  Tenancy Start Date *
                </Label>
                <DatePickerInput
                  value={parseLocalDate(tenancyStartDate)}
                  onChange={(date) => {
                    if (date) {
                      setTenancyStartDate(formatLocalDate(date));
                      if (errors.tenancyStartDate) {
                        setErrors({ ...errors, tenancyStartDate: "" });
                      }
                    }
                  }}
                  placeholder="Select tenancy start date"
                  error={!!errors.tenancyStartDate}
                />
                {errors.tenancyStartDate && (
                  <p className="text-xs text-red-600">
                    {errors.tenancyStartDate}
                  </p>
                )}
              </div>

              {/* Next Rent Due Date (Auto-calculated, Read-only) */}
              <div className="space-y-2">
                <Label
                  htmlFor="next-rent-due"
                  className="text-sm text-gray-700"
                >
                  Next Rent Due Date
                </Label>
                <Input
                  id="next-rent-due"
                  type="text"
                  value={(() => {
                    if (!tenancyStartDate || !rentFrequency) return "";
                    // Parse manually to ensure local time and avoid UTC shifts
                    const [y, m, d] = tenancyStartDate.split("-").map(Number);
                    const date = new Date(y, m - 1, d);

                    let monthsToAdd = 0;
                    switch (rentFrequency.toLowerCase()) {
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
                    }
                    date.setMonth(date.getMonth() + monthsToAdd);
                    date.setDate(date.getDate() - 1); // Subtract 1 day

                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    return `${day}/${month}/${year}`;
                  })()}
                  placeholder="dd/mm/yyyy"
                  disabled
                  className="bg-gray-100 text-gray-500 rounded-xl border-gray-200 cursor-not-allowed"
                />
                {/* {tenancyStartDate && rentFrequency && (
                  <p className="text-xs text-gray-500">
                    Auto-calculated based on start date and frequency
                  </p>
                )} */}
              </div>

              {/* Service Charge */}
              <div className="space-y-2">
                <Label
                  htmlFor="service-charge"
                  className="text-sm text-gray-700"
                >
                  Service Charge (₦)
                </Label>
                <Input
                  id="service-charge"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter service charge (optional)"
                  value={serviceCharge}
                  onChange={(e) => {
                    const formatted = formatNumberWithCommas(e.target.value);
                    setServiceCharge(formatted);
                  }}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-200 hover:bg-gray-50 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#FF5000] hover:bg-[#E64500] text-white rounded-xl"
          >
            Attach Tenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
