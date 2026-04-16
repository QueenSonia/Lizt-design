/* eslint-disable */
"use client";

import React, { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
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
import { useFetchAllVacantProperties } from "@/services/property/query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AddressAutocomplete from "./AddressAutoComplete";

interface LandlordAddTenantPageProps {
  onBack?: () => void;
  onTenantAdded?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordAddTenantPage({
  onBack,
  onTenantAdded,
  onMenuClick,
  isMobile = false,
}: LandlordAddTenantPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role;
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateProperty, setShowCreateProperty] = useState(false);
  const queryClient = useQueryClient();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handlePlaceSelected = (
    place: google.maps.places.PlaceResult | null
  ) => {
    setTenantData((prev) => ({
      ...prev,
      propertyAddress: place?.formatted_address || "",
    }));
  };
  const { data: properties } = useFetchAllVacantProperties();

  // Auto-show create property form if no vacant properties available
  React.useEffect(() => {
    if (
      properties !== undefined &&
      properties.length === 0 &&
      !showCreateProperty
    ) {
      setShowCreateProperty(true);
    }
  }, [properties, showCreateProperty]);

  // Tenant form state
  const [tenantData, setTenantData] = useState({
    name: "",
    email: "",
    phone: "",
    rentAmount: "",
    rentDueDate: "",
    propertyId: "",
    propertyName: "",
    propertyAddress: "",
    propertyDescription: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setTenantData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove all non-digit characters
    const numericValue = value.replace(/[^\d]/g, "");
    handleInputChange("rentAmount", numericValue);
  };

  const formatRentAmount = (value: string) => {
    if (!value) return "";
    return parseInt(value).toLocaleString("en-US");
  };

  const createUser = useCreateUserMutation();

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

    if (!tenantData.rentDueDate) {
      toast.error("Please select rent due date");
      return;
    }

    if (!showCreateProperty && !tenantData.propertyId) {
      if (!properties || properties.length === 0) {
        toast.error(
          "No vacant properties available. Please create a new property first."
        );
      } else {
        toast.error("Please select a property");
      }
      return;
    }

    if (showCreateProperty) {
      if (!tenantData.propertyName.trim()) {
        toast.error("Please enter property name");
        return;
      }
      if (!tenantData.propertyAddress.trim()) {
        toast.error("Please enter property address");
        return;
      }
    }

    setIsLoading(true);

    const formattedData = {
      ...tenantData,
      full_name: tenantData.name,
      phone_number: tenantData.phone,
      due_date: new Date(tenantData.rentDueDate).toISOString(),
      rent_amount: parseInt(tenantData.rentAmount.replace(/,/g, ""), 10) || 0,
      property_id: tenantData.propertyId,
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
          rentDueDate: "",
          propertyId: "",
          propertyName: "",
          propertyAddress: "",
          propertyDescription: "",
        });
        setShowCreateProperty(false);
        toast.success(`Tenant ${tenantData.name} added successfully!`);
        queryClient.invalidateQueries({
          queryKey: ["fetch-property-overview"],
        });
        if (onTenantAdded) {
          onTenantAdded();
        }
        handleBack();
      })
      .catch(() => {
        toast.error("Failed to add tenant. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            Add new tenant
          </h1>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-8">
          {/* Tenant Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Tenant Information</h3>

            <div className="space-y-2">
              <Label htmlFor="tenant-name" className="text-sm">
                Tenant Name *
              </Label>
              <Input
                id="tenant-name"
                value={tenantData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter tenant's full name"
                disabled={isLoading}
                className="w-full text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-email" className="text-sm">
                Email Address *
              </Label>
              <Input
                id="tenant-email"
                type="email"
                value={tenantData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="tenant@example.com"
                disabled={isLoading}
                className="w-full text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant-phone" className="text-sm">
                Phone Number
              </Label>
              <Input
                id="tenant-phone"
                value={tenantData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+234 xxx xxx xxxx"
                disabled={isLoading}
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Rent Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Rent Information</h3>

            <div className="space-y-2">
              <Label htmlFor="rent-amount" className="text-sm">
                Rent Amount *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  ₦
                </span>
                <Input
                  id="rent-amount"
                  type="text"
                  inputMode="numeric"
                  value={formatRentAmount(tenantData.rentAmount)}
                  onChange={handleRentAmountChange}
                  placeholder="0"
                  className="pl-8 text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent-due-date" className="text-sm">
                Rent Due Date *
              </Label>
              <Input
                id="rent-due-date"
                type="date"
                value={tenantData.rentDueDate}
                onChange={(e) =>
                  handleInputChange("rentDueDate", e.target.value)
                }
                className="text-sm"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Property Assignment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                Property Assignment
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateProperty(!showCreateProperty)}
                disabled={isLoading}
                className="text-[#FF5000] border-[#FF5000] hover:bg-[#FF5000]/5 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                {showCreateProperty ? "Select Existing" : "Create New"}
              </Button>
            </div>

            {!showCreateProperty ? (
              <div className="space-y-2">
                <Label htmlFor="property-select" className="text-sm">
                  Select Property *
                </Label>
                <Select
                  value={tenantData.propertyId}
                  onValueChange={(value) =>
                    handleInputChange("propertyId", value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="property-select" className="text-sm">
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
                            <div className="font-medium text-sm">
                              {property.property}
                            </div>
                            <div className="text-xs text-slate-500">
                              {property.location}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500 text-center">
                        No vacant properties available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-white rounded-lg border border-slate-200">
                <h4 className="font-medium text-slate-900 text-sm">
                  Create New Property
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="property-name" className="text-sm">
                    Property Name *
                  </Label>
                  <Input
                    id="property-name"
                    value={tenantData.propertyName}
                    onChange={(e) =>
                      handleInputChange("propertyName", e.target.value)
                    }
                    placeholder="Enter property name"
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property-address" className="text-sm">
                    Property Address *
                  </Label>
                  <AddressAutocomplete
                    onPlaceSelected={handlePlaceSelected}
                    placeholder="Enter full address"
                    disabled={isLoading}
                  />
                  {tenantData.propertyAddress && (
                    <p className="text-green-600 text-xs mt-1">
                      ✓ Address selected: {tenantData.propertyAddress}
                    </p>
                  )}
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="property-description" className="text-sm">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="property-description"
                    value={tenantData.propertyDescription}
                    onChange={(e) =>
                      handleInputChange("propertyDescription", e.target.value)
                    }
                    placeholder="Brief description of the property"
                    rows={3}
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div> */}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Fixed Bottom Button with Safe Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 safe-area-bottom">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-[#FF5000] hover:bg-[#FF5000]/90 text-white h-12"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Adding Tenant...</span>
            </div>
          ) : (
            "Add Tenant"
          )}
        </Button>
      </div>
    </div>
  );
}
