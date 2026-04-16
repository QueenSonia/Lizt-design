/* eslint-disable */
import { useState, useCallback, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";
import {
  useCreatePropertyMutation,
  useCreatePropertyWithTenantMutation,
} from "@/services/property/mutation";
import AddressAutocomplete from "./AddressAutoComplete";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchAvailableTenants } from "@/services/users/query";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { checkDuplicatePhone } from "@/services/property/api";
import { normalizePhoneNumber } from "@/utils/phoneNormalization";
import { PropertyCreationSuccessModal } from "./PropertyCreationSuccessModal";
import { calculateRentDueDate } from "@/utils/rentDueDateCalculator";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { formatLocalDate } from "@/utils/date-utils";

interface LandlordAddPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyAdded: () => void;
}

export function LandlordAddPropertyModal({
  open,
  onOpenChange,
  onPropertyAdded,
}: LandlordAddPropertyModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role;
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch available tenants
  const { data: availableTenants = [], isLoading: isLoadingTenants } =
    useFetchAvailableTenants();

  // Property form state
  const [propertyData, setPropertyData] = useState({
    name: "",
    address: "",
    description: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
  });

  // Tenant occupancy state
  const [hasTenant, setHasTenant] = useState<"yes" | "no" | "">("");
  const [tenantData, setTenantData] = useState({
    firstName: "",
    surname: "",
    phone: "",
    email: "",
    rentAmount: "",
    rentFrequency: "",
    serviceChargeAmount: "",
  });

  // Date states for DatePicker components
  const [tenancyStartDate, setTenancyStartDate] = useState<Date | undefined>(
    undefined
  );
  const [rentDueDate, setRentDueDate] = useState<Date | undefined>(undefined);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPropertyName, setCreatedPropertyName] = useState("");
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(
    null
  );
  const [isExistingTenant, setIsExistingTenant] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>("");

  // Validation errors state
  const [errors, setErrors] = useState({
    name: "",
    address: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    tenantFirstName: "",
    tenantSurname: "",
    tenantPhone: "",
    tenantRentAmount: "",
    tenantRentFrequency: "",
    tenantTenancyStartDate: "",
    tenantRentDueDate: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setPropertyData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for the field when user starts typing
    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleTenantInputChange = (field: string, value: string) => {
    setTenantData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, ""); // Strip non-digits
    handleTenantInputChange("rentAmount", value); // Store raw numeric string
  };

  const formatRentAmount = (value: string) => {
    if (!value) return ""; // Handle empty input
    const numberValue = parseInt(value, 10);
    if (isNaN(numberValue)) return ""; // Handle invalid input
    return numberValue.toLocaleString("en-US"); // Format with thousand separators
  };

  const checkDuplicateTenantPhone = useCallback(async () => {
    if (!tenantData.phone.trim()) {
      setDuplicateWarning(null);
      return;
    }

    try {
      const normalizedPhone = normalizePhoneNumber(tenantData.phone);
      const result = await checkDuplicatePhone(normalizedPhone);

      if (result && result.propertyName) {
        setDuplicateWarning(
          `⚠️ This phone number is already associated with "${result.propertyName}". The tenant will see multiple properties when completing their KYC form.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error("Error checking duplicate phone:", error);
      // Don't show error to user, just log it
    }
  }, [tenantData.phone]);

  // Auto-calculate rent due date when tenancy start date or rent frequency changes
  useEffect(() => {
    if (tenancyStartDate && tenantData.rentFrequency) {
      // Convert Date to dd/mm/yyyy format for calculation (timezone-safe)
      const year = tenancyStartDate.getFullYear();
      const month = (tenancyStartDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const day = tenancyStartDate.getDate().toString().padStart(2, "0");
      const startDateString = `${day}/${month}/${year}`;

      const calculatedDueDateString = calculateRentDueDate(
        startDateString,
        tenantData.rentFrequency
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
  }, [tenancyStartDate, tenantData.rentFrequency]);

  const createProperty = useCreatePropertyMutation();
  const createPropertyWithTenant = useCreatePropertyWithTenantMutation();

  const validateForm = () => {
    const newErrors = {
      name: "",
      address: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      tenantFirstName: "",
      tenantSurname: "",
      tenantPhone: "",
      tenantRentAmount: "",
      tenantRentFrequency: "",
      tenantTenancyStartDate: "",
      tenantRentDueDate: "",
    };
    let isValid = true;

    // Property validation
    if (!propertyData.name.trim()) {
      newErrors.name = "Please enter property name";
      isValid = false;
    }

    if (!propertyData.address.trim()) {
      newErrors.address = "Please enter property address";
      isValid = false;
    }

    if (!propertyData.propertyType) {
      newErrors.propertyType = "Please select property type";
      isValid = false;
    }

    if (!propertyData.bedrooms) {
      newErrors.bedrooms = "Please select number of bedrooms";
      isValid = false;
    }

    if (!propertyData.bathrooms) {
      newErrors.bathrooms = "Number of bathrooms is required";
      isValid = false;
    }

    // Tenant validation (only if hasTenant === 'yes')
    if (hasTenant === "yes") {
      if (!tenantData.firstName.trim()) {
        newErrors.tenantFirstName = "Please enter tenant's first name";
        isValid = false;
      }
      if (!tenantData.surname.trim()) {
        newErrors.tenantSurname = "Please enter tenant's surname";
        isValid = false;
      }

      if (!tenantData.phone.trim()) {
        newErrors.tenantPhone = "Please enter tenant's phone number";
        isValid = false;
      }

      if (!tenantData.rentAmount || parseFloat(tenantData.rentAmount) <= 0) {
        newErrors.tenantRentAmount = "Please enter a valid rent amount";
        isValid = false;
      }

      if (!tenantData.rentFrequency) {
        newErrors.tenantRentFrequency = "Please select rent frequency";
        isValid = false;
      }

      if (!tenancyStartDate) {
        newErrors.tenantTenancyStartDate = "Please select tenancy start date";
        isValid = false;
      }

      if (!rentDueDate) {
        newErrors.tenantRentDueDate = "Please select rent due date";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const bedrooms = parseInt(propertyData.bedrooms);
      const bathrooms = parseInt(propertyData.bathrooms);
      const isStudio = bedrooms === -1;

      const basePayload = {
        name: propertyData.name,
        location: propertyData.address,
        property_type: propertyData.propertyType,
        no_of_bedrooms: bedrooms,
        no_of_bathrooms: bathrooms,
        description: isStudio
          ? `Property is a studio apartment with ${bathrooms} ${
              bathrooms === 1 ? "bathroom" : "bathrooms"
            } located at ${propertyData.address}`
          : `Property is a ${bedrooms} bedroom ${propertyData.propertyType.toLowerCase()} with ${bathrooms} ${
              bathrooms === 1 ? "bathroom" : "bathrooms"
            } located at ${propertyData.address}`,
      };

      let response;

      // Check if creating with existing tenant
      if (hasTenant === "yes") {
        // Create property with tenant
        const payloadWithTenant = {
          ...basePayload,
          existingTenant: {
            firstName: tenantData.firstName,
            surname: tenantData.surname,
            phone: normalizePhoneNumber(tenantData.phone),
            email: tenantData.email || undefined,
            rentAmount: parseFloat(tenantData.rentAmount),
            rentFrequency: tenantData.rentFrequency,
            tenancyStartDate: tenancyStartDate
              ? formatLocalDate(tenancyStartDate)
              : "",
            rentDueDate: rentDueDate
              ? formatLocalDate(rentDueDate)
              : "",
            serviceChargeAmount: tenantData.serviceChargeAmount
              ? parseFloat(tenantData.serviceChargeAmount)
              : 0,
          },
        };

        response = await createPropertyWithTenant.mutateAsync(
          payloadWithTenant
        );
      } else {
        // Standard property creation without tenant
        response = await createProperty.mutateAsync(basePayload);
      }

      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });

      // Close the property creation modal
      onOpenChange(false);

      // Store property name and ID, then show success modal
      setCreatedPropertyName(propertyData.name);
      setCreatedPropertyId(response?.property?.id || response?.id || null);
      setIsExistingTenant(response?.isExistingTenant || false);
      setKycStatus(response?.kycStatus || "");
      setShowSuccessModal(true);

      // Note: Form reset is moved to handleSuccessModalClose to preserve hasTenant state for the modal
    } catch (error: any) {
      // Error is already handled by the mutation's onError handler
      // Just log it here for debugging
      console.error("Property creation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPropertyData({
        name: "",
        address: "",
        description: "",
        propertyType: "",
        bedrooms: "",
        bathrooms: "",
      });
      setHasTenant("");
      setTenantData({
        firstName: "",
        surname: "",
        phone: "",
        email: "",
        rentAmount: "",
        rentFrequency: "",
        serviceChargeAmount: "",
      });
      setTenancyStartDate(undefined);
      setRentDueDate(undefined);
      setDuplicateWarning(null);
      setErrors({
        name: "",
        address: "",
        propertyType: "",
        bedrooms: "",
        bathrooms: "",
        tenantFirstName: "",
        tenantSurname: "",
        tenantPhone: "",
        tenantRentAmount: "",
        tenantRentFrequency: "",
        tenantTenancyStartDate: "",
        tenantRentDueDate: "",
      });

      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);
    }
    onOpenChange(isOpen);
  };

  const handlePlaceSelected = (
    place: google.maps.places.PlaceResult | null
  ) => {
    const newAddress = place?.formatted_address || "";
    setPropertyData((prev) => ({
      ...prev,
      address: newAddress,
    }));
    setErrors((prev) => ({
      ...prev,
      address: "",
    }));
  };

  const handleSuccessModalClose = (isOpen: boolean) => {
    setShowSuccessModal(isOpen);

    if (!isOpen) {
      // Reset form when modal is closed
      setPropertyData({
        name: "",
        address: "",
        description: "",
        propertyType: "",
        bedrooms: "",
        bathrooms: "",
      });
      setHasTenant("");
      setTenantData({
        firstName: "",
        surname: "",
        phone: "",
        email: "",
        rentAmount: "",
        rentFrequency: "",
        serviceChargeAmount: "",
      });
      setTenancyStartDate(undefined);
      setRentDueDate(undefined);
      setDuplicateWarning(null);
      setErrors({
        name: "",
        address: "",
        propertyType: "",
        bedrooms: "",
        bathrooms: "",
        tenantFirstName: "",
        tenantSurname: "",
        tenantPhone: "",
        tenantRentAmount: "",
        tenantRentFrequency: "",
        tenantTenancyStartDate: "",
        tenantRentDueDate: "",
      });

      if (createdPropertyId) {
        // Navigate to property details page after success modal is closed
        router.push(`/${userRole}/property-detail/${createdPropertyId}`);
        setCreatedPropertyId(null);
      }

      // Reset isExistingTenant and kycStatus state
      setIsExistingTenant(false);
      setKycStatus("");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-lg shadow-2xl border border-slate-200/50">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl text-slate-900">
              Let's set up your property
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Add property details to start managing it on Lizt.
            </DialogDescription>
          </DialogHeader>

          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            {/* Property Name */}
            <div className="space-y-2">
              <Label htmlFor="property-name" className="text-sm text-slate-700">
                Property Name
              </Label>
              <Input
                id="property-name"
                value={propertyData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter property name"
                disabled={isLoading}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label
                htmlFor="property-address"
                className="text-sm text-slate-700"
              >
                Address
              </Label>
              <AddressAutocomplete
                onPlaceSelected={handlePlaceSelected}
                value={propertyData.address}
                error={errors.address}
                disabled={isLoading}
                placeholder="Search address or enter manually"
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-xs text-red-500">{errors.address}</p>
              )}
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label htmlFor="property-type" className="text-sm text-slate-700">
                Property Type
              </Label>
              <Select
                value={propertyData.propertyType}
                onValueChange={(value) =>
                  handleInputChange("propertyType", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger
                  id="property-type"
                  className={errors.propertyType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="mini-flat">Mini Flat</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="duplex">Duplex</SelectItem>
                  <SelectItem value="terrace">Terrace</SelectItem>
                  <SelectItem value="bungalow">Bungalow</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              {errors.propertyType && (
                <p className="text-xs text-red-500">{errors.propertyType}</p>
              )}
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <Label htmlFor="bedrooms" className="text-sm text-slate-700">
                Bedrooms
              </Label>
              <Select
                value={propertyData.bedrooms}
                onValueChange={(value) => handleInputChange("bedrooms", value)}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="bedrooms"
                  className={errors.bedrooms ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select number of bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? "Bedroom" : "Bedrooms"}
                    </SelectItem>
                  ))}
                  <SelectItem value="-1">Studio</SelectItem>
                </SelectContent>
              </Select>
              {errors.bedrooms && (
                <p className="text-xs text-red-500">{errors.bedrooms}</p>
              )}
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <Label htmlFor="bathrooms" className="text-sm text-slate-700">
                Bathrooms
              </Label>
              <Select
                value={propertyData.bathrooms}
                onValueChange={(value) => handleInputChange("bathrooms", value)}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="bathrooms"
                  className={errors.bathrooms ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select number of bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? "Bathroom" : "Bathrooms"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bathrooms && (
                <p className="text-xs text-red-500">{errors.bathrooms}</p>
              )}
            </div>

            {/* Tenant Occupancy Question */}
            <div className="space-y-3 pt-2">
              <Label className="text-sm text-slate-700">
                Do you already have a tenant living in this property?
              </Label>
              <RadioGroup
                value={hasTenant}
                onValueChange={(value) => setHasTenant(value as "yes" | "no")}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="tenant-yes" />
                  <Label
                    htmlFor="tenant-yes"
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="tenant-no" />
                  <Label
                    htmlFor="tenant-no"
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional: Existing Tenant Information */}
            {hasTenant === "yes" && (
              <div className="space-y-5 pt-2 border-t border-slate-200">
                <h3 className="text-base text-slate-900 pt-3">
                  Existing Tenant Information
                </h3>

                {/* Duplicate Warning */}
                {duplicateWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">{duplicateWarning}</p>
                  </div>
                )}

                {/* Tenant First Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tenant-firstname"
                    className="text-sm text-slate-700"
                  >
                    First Name
                  </Label>
                  <Input
                    id="tenant-firstname"
                    value={tenantData.firstName}
                    onChange={(e) =>
                      handleTenantInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter tenant's first name"
                    disabled={isLoading}
                    className={errors.tenantFirstName ? "border-red-500" : ""}
                  />
                  {errors.tenantFirstName && (
                    <p className="text-xs text-red-500">
                      {errors.tenantFirstName}
                    </p>
                  )}
                </div>

                {/* Tenant Surname */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tenant-surname"
                    className="text-sm text-slate-700"
                  >
                    Surname
                  </Label>
                  <Input
                    id="tenant-surname"
                    value={tenantData.surname}
                    onChange={(e) =>
                      handleTenantInputChange("surname", e.target.value)
                    }
                    placeholder="Enter tenant's surname"
                    disabled={isLoading}
                    className={errors.tenantSurname ? "border-red-500" : ""}
                  />
                  {errors.tenantSurname && (
                    <p className="text-xs text-red-500">
                      {errors.tenantSurname}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tenant-phone"
                    className="text-sm text-slate-700"
                  >
                    WhatsApp Number
                  </Label>
                  <Input
                    id="tenant-phone"
                    value={tenantData.phone}
                    onChange={(e) =>
                      handleTenantInputChange("phone", e.target.value)
                    }
                    onBlur={checkDuplicateTenantPhone}
                    placeholder="+234 800 000 0000"
                    disabled={isLoading}
                    className={errors.tenantPhone ? "border-red-500" : ""}
                  />
                  {errors.tenantPhone && (
                    <p className="text-xs text-red-500">{errors.tenantPhone}</p>
                  )}
                </div>

                {/* Email (Optional) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tenant-email"
                    className="text-sm text-slate-700"
                  >
                    Email (Optional)
                  </Label>
                  <Input
                    id="tenant-email"
                    type="email"
                    value={tenantData.email}
                    onChange={(e) =>
                      handleTenantInputChange("email", e.target.value)
                    }
                    placeholder="tenant@example.com"
                    disabled={isLoading}
                  />
                </div>

                {/* Rent Amount */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tenant-rent-amount"
                    className="text-sm text-slate-700"
                  >
                    Rent Amount
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      ₦
                    </span>
                    <Input
                      id="tenant-rent-amount"
                      type="text"
                      value={formatRentAmount(tenantData.rentAmount)}
                      onChange={handleRentAmountChange}
                      placeholder="0"
                      disabled={isLoading}
                      className={`pl-8 ${
                        errors.tenantRentAmount ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.tenantRentAmount && (
                    <p className="text-xs text-red-500">
                      {errors.tenantRentAmount}
                    </p>
                  )}
                </div>

                {/* Rent Frequency */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tenant-rent-frequency"
                    className="text-sm text-slate-700"
                  >
                    Rent Frequency
                  </Label>
                  <Select
                    value={tenantData.rentFrequency}
                    onValueChange={(value) =>
                      handleTenantInputChange("rentFrequency", value)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="tenant-rent-frequency"
                      className={
                        errors.tenantRentFrequency ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select rent frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="biannually">Bi-Annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tenantRentFrequency && (
                    <p className="text-xs text-red-500">
                      {errors.tenantRentFrequency}
                    </p>
                  )}
                </div>

                {/* Tenancy Start Date */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">
                    Tenancy Start Date
                  </Label>
                  <DatePickerInput
                    value={tenancyStartDate}
                    onChange={setTenancyStartDate}
                    placeholder="Select tenancy start date"
                    disabled={isLoading}
                    error={!!errors.tenantTenancyStartDate}
                  />
                  {errors.tenantTenancyStartDate && (
                    <p className="text-xs text-red-500">
                      {errors.tenantTenancyStartDate}
                    </p>
                  )}
                </div>

                {/* Rent Due Date */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">
                    Rent Due Date
                  </Label>
                  <DatePickerInput
                    value={rentDueDate}
                    onChange={setRentDueDate}
                    placeholder="Select rent due date"
                    disabled={isLoading}
                    error={!!errors.tenantRentDueDate}
                  />
                  {errors.tenantRentDueDate && (
                    <p className="text-xs text-red-500">
                      {errors.tenantRentDueDate}
                    </p>
                  )}
                </div>

                {/* Service Charge Amount (Optional) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tenant-service-charge"
                    className="text-sm text-slate-700"
                  >
                    Service Charge Amount (Optional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      ₦
                    </span>
                    <Input
                      id="tenant-service-charge"
                      type="text"
                      value={formatRentAmount(tenantData.serviceChargeAmount)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, "");
                        handleTenantInputChange("serviceChargeAmount", value);
                      }}
                      placeholder="0"
                      disabled={isLoading}
                      className="pl-8"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
                className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white h-11 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Property...</span>
                  </div>
                ) : (
                  "Save Property"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <PropertyCreationSuccessModal
        open={showSuccessModal}
        onOpenChange={handleSuccessModalClose}
        hasTenant={hasTenant === "yes"}
        propertyName={createdPropertyName}
        isExistingTenant={isExistingTenant}
        kycStatus={kycStatus}
      />
    </>
  );
}
