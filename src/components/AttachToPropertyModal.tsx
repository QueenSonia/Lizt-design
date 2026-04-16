import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import {
  formatNumberWithCommas,
  parseFormattedNumber,
} from "@/utils/formatters";
import { useAttachTenantToProperty } from "@/services/tenants/mutation";
import { calculateRentDueDate } from "@/utils/rentDueDateCalculator";
import { DatePickerInput } from "@/components/ui/date-picker-input";

interface Property {
  id: string;
  name: string;
  location: string;
  status: "Vacant" | "Occupied" | "Offer Pending" | "Offer Accepted";
  isMarketingReady?: boolean;
  marketingPrice?: number | null;
}

interface AttachToPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  onAttachSuccess: () => void;
  vacantProperties: Property[];
}

export function AttachToPropertyModal({
  isOpen,
  onClose,
  tenantId,
  tenantName: _tenantName, // eslint-disable-line @typescript-eslint/no-unused-vars
  onAttachSuccess,
  vacantProperties,
}: AttachToPropertyModalProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [showTenancyInfo, setShowTenancyInfo] = useState(false);
  const [tenancyStartDate, setTenancyStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [rentAmount, setRentAmount] = useState("");
  const [rentFrequency, setRentFrequency] = useState("");
  const [rentDueDate, setRentDueDate] = useState<Date | undefined>(undefined);
  const [serviceCharge, setServiceCharge] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const attachTenantMutation = useAttachTenantToProperty();

  // Show all vacant properties (not just those ready for marketing)
  const availableProperties = vacantProperties;

  // Show tenancy information fields when property is selected
  useEffect(() => {
    if (selectedPropertyId) {
      setShowTenancyInfo(true);
    } else {
      setShowTenancyInfo(false);
    }
  }, [selectedPropertyId]);

  // Auto-calculate rent due date when tenancy start date or rent frequency changes
  useEffect(() => {
    if (tenancyStartDate && rentFrequency) {
      // Convert Date to dd/mm/yyyy format for calculation (timezone-safe)
      const year = tenancyStartDate.getFullYear();
      const month = (tenancyStartDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const day = tenancyStartDate.getDate().toString().padStart(2, "0");
      const startDateString = `${day}/${month}/${year}`;

      // Map frequency values to match the calculator function
      const frequencyMap: { [key: string]: string } = {
        Monthly: "monthly",
        Quarterly: "quarterly",
        "Bi-Annually": "biannually",
        Annually: "annually",
      };

      const calculatedDueDateString = calculateRentDueDate(
        startDateString,
        frequencyMap[rentFrequency] || rentFrequency.toLowerCase(),
      );

      if (calculatedDueDateString) {
        // Convert back to Date object for DatePicker (timezone-safe)
        const parts = calculatedDueDateString.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          const newDueDate = new Date(year, month, day);
          setRentDueDate(newDueDate);
        }
      }
    }
  }, [tenancyStartDate, rentFrequency]);

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedPropertyId) {
      newErrors.property = "Please select a property";
    }

    if (!tenancyStartDate) {
      newErrors.tenancyStartDate = "Please select a tenancy start date";
    }

    const cleanAmount = parseFormattedNumber(rentAmount);
    if (!cleanAmount || parseFloat(cleanAmount) <= 0) {
      newErrors.rentAmount = "Please enter a valid rent amount";
    }

    if (!rentFrequency) {
      newErrors.rentFrequency = "Please select a rent frequency";
    }

    if (!rentDueDate) {
      newErrors.rentDueDate = "Please select a rent due date";
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

    try {
      await attachTenantMutation.mutateAsync({
        tenantId,
        data: {
          propertyId: selectedPropertyId,
          tenancyStartDate: tenancyStartDate
            ? `${tenancyStartDate.getFullYear()}-${String(
                tenancyStartDate.getMonth() + 1,
              ).padStart(2, "0")}-${String(tenancyStartDate.getDate()).padStart(
                2,
                "0",
              )}`
            : "",
          rentAmount: parseFloat(parseFormattedNumber(rentAmount)),
          rentFrequency,
          rentDueDate: rentDueDate
            ? `${rentDueDate.getFullYear()}-${String(
                rentDueDate.getMonth() + 1,
              ).padStart(2, "0")}-${String(rentDueDate.getDate()).padStart(
                2,
                "0",
              )}`
            : "",
          serviceCharge: serviceCharge
            ? parseFloat(parseFormattedNumber(serviceCharge))
            : undefined,
        },
      });

      handleClose();
      onAttachSuccess();
    } catch (error) {
      // Error is already handled by the mutation's onError
      console.error("Error attaching tenant:", error);
    }
  };

  // Handle modal close with reset
  const handleClose = () => {
    setSelectedPropertyId("");
    setShowTenancyInfo(false);
    setTenancyStartDate(undefined);
    setRentAmount("");
    setRentFrequency("");
    setRentDueDate(undefined);
    setServiceCharge("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white rounded-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach to Property</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Property Selection */}
          <div className="space-y-2 my-4">
            <Label htmlFor="property" className="text-sm text-gray-700">
              Select Property *
            </Label>
            <Select
              value={selectedPropertyId}
              onValueChange={(value) => {
                setSelectedPropertyId(value);
                if (errors.property) {
                  setErrors({ ...errors, property: "" });
                }
              }}
            >
              <SelectTrigger
                id="property"
                className={`rounded-xl py-6 ${
                  errors.property ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl py-4">
                {availableProperties.length === 0 ? (
                  <div className="px-2 py-4 text-center text-gray-500">
                    No vacant properties available
                  </div>
                ) : (
                  availableProperties.map((property) => (
                    <SelectItem
                      key={property.id}
                      value={property.id}
                      disabled={property.status === "Occupied"}
                    >
                      <div>
                        <p className="font-medium">
                          {property.name}
                          {property.status === "Occupied" && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Occupied)
                            </span>
                          )}
                          {property.isMarketingReady && (
                            <span className="ml-2 text-xs text-[#FF5000]">
                              (Ready for Marketing)
                            </span>
                          )}
                          {property.status === "Vacant" && (
                            <span className="ml-2 text-xs text-green-600">
                              (Vacant)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {property.location}
                        </p>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.property && (
              <p className="text-xs text-red-600">{errors.property}</p>
            )}
          </div>

          {/* Tenancy Information Section */}
          {showTenancyInfo && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-gray-900">Tenancy Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tenancy Start Date */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tenancy-start-date"
                    className="text-sm text-gray-700"
                  >
                    Tenancy Start Date *
                  </Label>
                  <DatePickerInput
                    value={tenancyStartDate}
                    onChange={(date) => {
                      setTenancyStartDate(date);
                      if (errors.tenancyStartDate) {
                        setErrors((e) => ({ ...e, tenancyStartDate: "" }));
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

                {/* Rent Frequency */}
                <div className="space-y-2">
                  <Label
                    htmlFor="rent-frequency"
                    className="text-sm text-gray-700"
                  >
                    Rent Frequency *
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
                    <SelectContent className="bg-white rounded-xl">
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Bi-Annually">Bi-Annually</SelectItem>
                      <SelectItem value="Annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.rentFrequency && (
                    <p className="text-xs text-red-600">
                      {errors.rentFrequency}
                    </p>
                  )}
                </div>

                {/* Rent Amount */}
                <div className="space-y-2">
                  <Label
                    htmlFor="rent-amount"
                    className="text-sm text-gray-700"
                  >
                    Rent Amount (₦) *
                  </Label>
                  <Input
                    id="rent-amount"
                    type="text"
                    placeholder="Enter rent amount"
                    value={rentAmount}
                    onChange={(e) => {
                      const formatted = formatNumberWithCommas(e.target.value);
                      setRentAmount(formatted);
                      if (errors.rentAmount) {
                        setErrors({ ...errors, rentAmount: "" });
                      }
                    }}
                    className={`rounded-xl ${
                      errors.rentAmount ? "border-red-500" : ""
                    }`}
                  />
                  {errors.rentAmount && (
                    <p className="text-xs text-red-600">{errors.rentAmount}</p>
                  )}
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
                    placeholder="Enter service charge (optional)"
                    value={serviceCharge}
                    onChange={(e) => {
                      const formatted = formatNumberWithCommas(e.target.value);
                      setServiceCharge(formatted);
                    }}
                    className="rounded-xl"
                  />
                </div>

                {/* Rent Due Date */}
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="rent-due-date"
                    className="text-sm text-gray-700"
                  >
                    Rent Due Date *
                  </Label>
                  <DatePickerInput
                    value={rentDueDate}
                    onChange={(date) => {
                      setRentDueDate(date);
                      if (errors.rentDueDate) {
                        setErrors((e) => ({ ...e, rentDueDate: "" }));
                      }
                    }}
                    placeholder="Select rent due date"
                    error={!!errors.rentDueDate}
                  />
                  {errors.rentDueDate && (
                    <p className="text-xs text-red-600">{errors.rentDueDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <DialogFooter className="mt-6">
          <div className="flex gap-3 justify-end w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={attachTenantMutation.isPending}
              className="bg-[#FF5000] hover:bg-[#E64800] text-white rounded-xl"
            >
              {attachTenantMutation.isPending
                ? "Attaching..."
                : "Attach Tenant"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
