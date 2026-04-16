import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { FormStepProps } from "../../types";
import { FormValidator } from "../../utils/form-validator";

const TenancyInformationStep: React.FC<
  FormStepProps & {
    properties?: Array<{
      id: string;
      name: string;
      location: string;
      propertyType: string;
      bedrooms: number;
      bathrooms: number;
      description?: string;
      rentalPrice?: number;
      hasPendingKyc?: boolean;
    }>;
  }
> = ({
  formData,
  onDataChange,
  errors,
  onValidationChange,
  isFieldTouched,
  goToNextStep,
  properties = [],
}) => {
  const [propertySearchOpen, setPropertySearchOpen] = useState(false);

  // Filter properties based on pending KYC - Requirements 4.9, 7.4
  const filteredProperties: typeof properties = React.useMemo(() => {
    // If there's a pending KYC with available property IDs, filter to only those
    if (formData.available_property_ids) {
      const availableIds = formData.available_property_ids
        .split(",")
        .filter(Boolean);

      if (availableIds.length > 0) {
        return properties.filter((p) => availableIds.includes(p.id));
      }
    }

    // Otherwise, show all properties EXCEPT those with pending KYC (reserved)
    // Requirements: Fresh users should not see properties reserved for pending KYC completions
    return properties.filter((p) => !p.hasPendingKyc);
  }, [properties, formData.available_property_ids]);

  // Validate step whenever form data changes
  useEffect(() => {
    const validation = FormValidator.validateStep(3, formData);
    onValidationChange(validation.isValid);
  }, [formData, onValidationChange]);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    onDataChange({ [field]: value });
    if (field === "tenancyStatus" && value === "Existing Tenant") {
      if (goToNextStep) {
        goToNextStep();
      }
    }
  };

  // Helper to check if error should be shown (only if field is touched)
  const shouldShowError = (field: string) => {
    return isFieldTouched(field) && !!errors[field];
  };

  // Format number with commas
  const formatNumberWithCommas = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleMoneyInput = (field: string, value: string) => {
    const formatted = formatNumberWithCommas(value);
    handleInputChange(field, formatted);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Property Applying For */}
      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">
          Property Applying For
        </h3>
        <div className="space-y-4">
          <div>
            <Popover
              open={propertySearchOpen}
              onOpenChange={setPropertySearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={propertySearchOpen}
                  className={`w-full !h-auto !min-h-[44px] justify-start !items-center !py-2 !px-3 !text-left !whitespace-normal hover:bg-gray-50 ${
                    shouldShowError("property_applying_for")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  {formData.property_applying_for ? (
                    (() => {
                      const selected = filteredProperties.find(
                        (p) => p.id === formData.property_applying_for
                      );
                      return selected ? (
                        <div className="flex flex-col items-start gap-0.5 w-full">
                          <span
                            className="font-semibold block w-full text-left"
                            style={{ lineHeight: "16px" }}
                          >
                            {selected.name}
                          </span>
                          <span
                            className="text-sm block w-full text-left text-gray-600"
                            style={{ lineHeight: "15px" }}
                          >
                            {selected.description}
                          </span>
                          {selected.rentalPrice && (
                            <span
                              className="text-sm block w-full text-left"
                              style={{ lineHeight: "15px", color: "#FF5000" }}
                            >
                              {formatCurrency(selected.rentalPrice)} per year
                            </span>
                          )}
                        </div>
                      ) : null;
                    })()
                  ) : (
                    <span className="text-gray-500">Select a property</span>
                  )}
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-2rem)] sm:w-[600px] p-0"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search properties..."
                    className="h-9 border-0 focus:ring-0 focus:ring-offset-0"
                  />
                  <CommandList>
                    <CommandEmpty>No property found.</CommandEmpty>
                    <CommandGroup>
                      {filteredProperties.map((property) => (
                        <CommandItem
                          key={property.id}
                          value={`${property.name} ${property.description}`}
                          onSelect={() => {
                            handleInputChange(
                              "property_applying_for",
                              property.id
                            );
                            setPropertySearchOpen(false);
                          }}
                          className="py-2.5 !items-start min-h-[50px] cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 shrink-0 ${
                              formData.property_applying_for === property.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col items-start gap-0.5 w-full">
                            <span
                              className="font-semibold"
                              style={{ lineHeight: "20px" }}
                            >
                              {property.name}
                            </span>
                            <span
                              className="text-sm text-gray-600"
                              style={{ lineHeight: "18px" }}
                            >
                              {property.description}
                            </span>
                            {property.rentalPrice && (
                              <span
                                className="text-sm"
                                style={{ lineHeight: "18px", color: "#FF5000" }}
                              >
                                {formatCurrency(property.rentalPrice)} per year
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {shouldShowError("property_applying_for") && (
              <p className="text-sm text-red-600 mt-1">
                {errors.property_applying_for}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Property Usage */}
      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">
          Property Usage
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="intended_use_of_property" className="mb-2">
                Intended Use of Property
              </Label>
              <Select
                value={formData.intended_use_of_property || ""}
                onValueChange={(value) =>
                  handleInputChange("intended_use_of_property", value)
                }
              >
                <SelectTrigger
                  id="intended_use_of_property"
                  className={
                    shouldShowError("intended_use_of_property")
                      ? "border-red-500"
                      : ""
                  }
                >
                  <SelectValue placeholder="Select intended use" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
              {shouldShowError("intended_use_of_property") && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.intended_use_of_property}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="number_of_occupants" className="mb-2">
                Number of Occupants
              </Label>
              <Input
                id="number_of_occupants"
                type="number"
                min="0"
                value={formData.number_of_occupants || ""}
                onChange={(e) =>
                  handleInputChange("number_of_occupants", e.target.value)
                }
                placeholder="0"
                className={
                  shouldShowError("number_of_occupants") ? "border-red-500" : ""
                }
              />
              {shouldShowError("number_of_occupants") && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.number_of_occupants}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="parking_needs" className="mb-2">
              Number of Cars Owned
            </Label>
            <Input
              id="parking_needs"
              type="number"
              min="0"
              value={formData.parking_needs || ""}
              onChange={(e) =>
                handleInputChange("parking_needs", e.target.value)
              }
              placeholder="0"
              className={
                shouldShowError("parking_needs") ? "border-red-500" : ""
              }
            />
            {shouldShowError("parking_needs") && (
              <p className="text-sm text-red-600 mt-1">
                {errors.parking_needs}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rental Offer */}
      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">
          Rental Offer
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proposed_rent_amount" className="mb-2">
                Proposed Rent Amount (₦)
              </Label>
              <Input
                id="proposed_rent_amount"
                value={formData.proposed_rent_amount || ""}
                onChange={(e) =>
                  handleMoneyInput("proposed_rent_amount", e.target.value)
                }
                placeholder="0"
                className={
                  shouldShowError("proposed_rent_amount")
                    ? "border-red-500"
                    : ""
                }
              />
              {shouldShowError("proposed_rent_amount") && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.proposed_rent_amount}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="rent_payment_frequency" className="mb-2">
                Rent Payment Frequency
              </Label>
              <Select
                value={formData.rent_payment_frequency || ""}
                onValueChange={(value) =>
                  handleInputChange("rent_payment_frequency", value)
                }
              >
                <SelectTrigger
                  id="rent_payment_frequency"
                  className={
                    shouldShowError("rent_payment_frequency")
                      ? "border-red-500"
                      : ""
                  }
                >
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Bi-Annually">Bi-Annually</SelectItem>
                  <SelectItem value="Annually">Annually</SelectItem>
                </SelectContent>
              </Select>
              {shouldShowError("rent_payment_frequency") && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.rent_payment_frequency}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="additional_notes" className="mb-2">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="additional_notes"
              value={formData.additional_notes || ""}
              onChange={(e) =>
                handleInputChange("additional_notes", e.target.value)
              }
              placeholder="Any additional information you'd like to share..."
              rows={4}
              className="mt-1.5 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Agent Referral Information */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-5">
          Agent Referral Information
        </h3>
        <div className="space-y-5">
          <div>
            <Label htmlFor="referral_agent_full_name">Agent Name</Label>
            <Input
              id="referral_agent_full_name"
              value={formData.referral_agent_full_name || ""}
              onChange={(e) =>
                handleInputChange("referral_agent_full_name", e.target.value)
              }
              placeholder="Enter agent's name"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="referral_agent_phone_number">
              Agent Phone Number
            </Label>
            <Input
              id="referral_agent_phone_number"
              type="tel"
              value={formData.referral_agent_phone_number || ""}
              onChange={(e) =>
                handleInputChange("referral_agent_phone_number", e.target.value)
              }
              placeholder="+234 XXX XXX XXXX"
              className="mt-1.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenancyInformationStep;
