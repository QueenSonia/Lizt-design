"use client";
/* eslint-disable */
import React, { Dispatch, SetStateAction, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
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
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { useCreateUserMutation } from "@/services/users/mutation";
// AddressAutocomplete removed - property creation moved to separate flow
import {
  useFetchPropertyDetails,
  useFetchAllVacantProperties,
} from "@/services/property/query";
import { useQueryClient } from "@tanstack/react-query";
import { RentFrequencyToggle } from "@/components/RentFrequencyToggle";
import { DatePickerInput } from "@/components/ui/date-picker-input";

interface LandlordAddTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTenantAdded: () => void;
}

export function LandlordAddTenantModal({
  open,
  onOpenChange,
  onTenantAdded,
}: LandlordAddTenantModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Removed showCreateProperty - users must create properties separately
  const [isYearly, setIsYearly] = useState(true); // Default to yearly rent

  const queryClient = useQueryClient();

  // Tenant form state
  const [tenantData, setTenantData] = useState({
    name: "",
    email: "",
    phone: "",
    rentAmount: "",
    paymentFrequency: "yearly" as "yearly" | "monthly",
    propertyId: "",
    securityDeposit: "",
    serviceCharge: "",
  });

  const [leaseStartDate, setLeaseStartDate] = useState<Date | undefined>(
    undefined
  );
  const [leaseEndDate, setLeaseEndDate] = useState<Date | undefined>(undefined);

  const { data: properties } = useFetchAllVacantProperties();

  // Show message if no vacant properties available

  const handleInputChange = (field: string, value: string) => {
    setTenantData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, ""); // Strip non-digits
    handleInputChange("rentAmount", value); // Store raw numeric string
  };

  const formatRentAmount = (value: string) => {
    if (!value) return ""; // Handle empty input
    const numberValue = parseInt(value, 10);
    if (isNaN(numberValue)) return ""; // Handle invalid input
    return numberValue.toLocaleString("en-US"); // Format with thousand separators
  };

  const createUser = useCreateUserMutation();

  // handlePlaceSelected removed - property creation moved to separate flow

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!tenantData.name.trim()) {
      toast.error("Please enter tenant name");
      return;
    }

    if (!tenantData.email.trim()) {
      toast.error("Please enter tenant email");
      return;
    }

    if (!tenantData.rentAmount.trim()) {
      toast.error("Please enter rent amount");
      return;
    }

    if (!leaseStartDate) {
      toast.error("Please select lease start date");
      return;
    }

    if (!leaseEndDate) {
      toast.error("Please select lease end date");
      return;
    }

    if (!tenantData.propertyId) {
      if (!properties || properties.length === 0) {
        toast.error(
          "No vacant properties available. Please create a property first."
        );
      } else {
        toast.error("Please select a property");
      }
      return;
    }

    setIsLoading(true);

    const formattedData = {
      full_name: tenantData.name,
      phone_number: tenantData.phone,
      email: tenantData.email,
      property_id: tenantData.propertyId,
      lease_start_date: leaseStartDate.toISOString(),
      lease_end_date: leaseEndDate.toISOString(),
      rental_price: parseInt(tenantData.rentAmount, 10) || 0,
      security_deposit: parseInt(tenantData.securityDeposit, 10) || 0,
      service_charge: parseInt(tenantData.serviceCharge, 10) || 0,
      payment_frequency:
        tenantData.paymentFrequency === "yearly" ? "Yearly" : "Monthly",
    };

    createUser
      .mutateAsync(formattedData)
      .then(() => {
        // Reset form
        setTenantData({
          name: "",
          email: "",
          phone: "",
          rentAmount: "",
          paymentFrequency: "yearly" as "yearly" | "monthly",
          propertyId: "",
          securityDeposit: "",
          serviceCharge: "",
        });
        setLeaseStartDate(undefined);
        setLeaseEndDate(undefined);
        // Property creation removed - users create properties separately

        toast.success(`Tenant ${tenantData.name} added successfully!`);
        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "get-properties",
        });
        queryClient.invalidateQueries({
          queryKey: ["fetch-property-overview"],
        });
        onOpenChange(false);
        onTenantAdded();
      })
      .catch(() => {
        toast.error("Failed to add tenant. Please try again");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleOpenChange = (isOpen: boolean) => {
    // Check if modal is being closed
    if (!isOpen) {
      setTenantData({
        name: "",
        email: "",
        phone: "",
        rentAmount: "",
        paymentFrequency: "yearly",
        propertyId: "",
        securityDeposit: "",
        serviceCharge: "",
      });
      setLeaseStartDate(undefined);
      setLeaseEndDate(undefined);
      // Property creation removed
      setIsYearly(true);

      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-semibold text-slate-900 mb-1.5">
            Add New Tenant
          </DialogTitle>
          <DialogDescription className="text-base">
            Fill in the tenant information, rent details, and property
            assignment to add a new tenant to your portfolio.
          </DialogDescription>
        </DialogHeader>

        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tenant Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-slate-900 mb-6 mt-2">
              Tenant Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="tenant-name" className="text-sm font-medium">
                  Tenant Name *
                </Label>
                <Input
                  id="tenant-name"
                  value={tenantData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter tenant's full name"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="tenant-email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="tenant-email"
                  type="email"
                  value={tenantData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="tenant@example.com"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-phone">Phone Number</Label>
              <Input
                id="tenant-phone"
                value={tenantData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+234 xxx xxx xxxx"
                disabled={isLoading}
                className="h-11"
              />
            </div>
          </div>

          {/* Rent Information */}
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-slate-900">
                Rent Information
              </h3>
              <RentFrequencyToggle
                isYearly={isYearly}
                onToggle={(yearly) => {
                  setIsYearly(yearly);
                  handleInputChange(
                    "paymentFrequency",
                    yearly ? "yearly" : "monthly"
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="rent-amount" className="text-sm font-medium">
                  Rent Amount *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ₦
                  </span>
                  <Input
                    id="rent-amount"
                    type="text"
                    value={formatRentAmount(tenantData.rentAmount)}
                    onChange={handleRentAmountChange}
                    placeholder={`Enter ${
                      isYearly ? "yearly" : "monthly"
                    } rent amount`}
                    className="pl-8 h-11"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="security-deposit"
                  className="text-sm font-medium"
                >
                  Security Deposit
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ₦
                  </span>
                  <Input
                    id="security-deposit"
                    type="text"
                    value={formatRentAmount(tenantData.securityDeposit)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "");
                      handleInputChange("securityDeposit", value);
                    }}
                    placeholder="Enter security deposit"
                    className="pl-8 h-11"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="service-charge" className="text-sm font-medium">
                  Service Charge
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ₦
                  </span>
                  <Input
                    id="service-charge"
                    type="text"
                    value={formatRentAmount(tenantData.serviceCharge)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, "");
                      handleInputChange("serviceCharge", value);
                    }}
                    placeholder="Enter service charge"
                    className="pl-8 h-11"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="lease-start-date"
                  className="text-sm font-medium"
                >
                  Lease Start Date *
                </Label>
                <DatePickerInput
                  value={leaseStartDate}
                  onChange={setLeaseStartDate}
                  placeholder="Select lease start date"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="lease-end-date" className="text-sm font-medium">
                  Lease End Date *
                </Label>
                <DatePickerInput
                  value={leaseEndDate}
                  onChange={setLeaseEndDate}
                  placeholder="Select lease end date"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Property Assignment */}
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-slate-900">
                Property Assignment
              </h3>
            </div>

            <div className="space-y-3">
              <Label htmlFor="property-select" className="text-sm font-medium">
                Select Property *
              </Label>
              <Select
                value={tenantData.propertyId}
                onValueChange={(value) =>
                  handleInputChange("propertyId", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="property-select" className="h-11">
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties && properties.length > 0 ? (
                    properties.map((property: any) => (
                      <SelectItem
                        key={property.id}
                        value={property.id.toString()}
                      >
                        <div>
                          <div className="font-medium">
                            {property.property || property.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {property.address || property.location}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500 text-center">
                      No vacant properties available. Create a property first.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                className="order-2 sm:order-1 border-slate-300 text-slate-600 hover:bg-slate-50 h-11"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isLoading}
              className="order-1 sm:order-2 bg-[#FF5000] hover:bg-[#FF5000]/90 text-white flex-1 sm:flex-none h-11"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Adding Tenant...</span>
                </div>
              ) : (
                "Add Tenant"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
