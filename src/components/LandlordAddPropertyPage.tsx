/* eslint-disable */
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { checkDuplicatePhone } from "@/services/property/api";
import { normalizePhoneNumber } from "@/utils/phoneNormalization";
import { PropertyCreationSuccessModal } from "./PropertyCreationSuccessModal";
import { calculateRentDueDate } from "@/utils/rentDueDateCalculator";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { formatLocalDate } from "@/utils/date-utils";

interface LandlordAddPropertyPageProps {
  onBack?: () => void;
  onPropertyAdded?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordAddPropertyPage({
  onBack,
  onPropertyAdded,
  onMenuClick,
  isMobile = false,
}: LandlordAddPropertyPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role;
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // ✅ Fetch available tenants from database (no longer needed - formerlly for assigning tenants during property creation)
  // const { data: availableTenants = [], isLoading: isLoadingTenants } =
  //   useFetchAvailableTenants();

  // ✅ Property mutations
  const createProperty = useCreatePropertyMutation();
  const createPropertyWithTenant = useCreatePropertyWithTenantMutation();

  // Property form state
  const [propertyData, setPropertyData] = useState({
    name: "",
    address: "",
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
  const [tenancyStartDate, setTenancyStartDate] = useState<Date | undefined>(undefined);
  const [rentDueDate, setRentDueDate] = useState<Date | undefined>(undefined);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPropertyName, setCreatedPropertyName] = useState("");
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [isExistingTenant, setIsExistingTenant] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>("");

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

  // Responsive redirect: if user switches to desktop, go back
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        if (onBack) {
          onBack();
        } else {
          router.back();
        }
      }
    };

    if (window.innerWidth >= 1024) {
      if (onBack) {
        onBack();
      } else {
        router.back();
      }
      return;
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onBack, router]);

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
    const value = e.target.value.replace(/[^\d]/g, "");
    handleTenantInputChange("rentAmount", value);
  };

  const formatRentAmount = (value: string) => {
    if (!value) return "";
    const numberValue = parseInt(value, 10);
    if (isNaN(numberValue)) return "";
    return numberValue.toLocaleString("en-US");
  };

  // Auto-calculate rent due date when tenancy start date or rent frequency changes
  useEffect(() => {
    if (tenancyStartDate && tenantData.rentFrequency) {
      const year = tenancyStartDate.getFullYear();
      const month = (tenancyStartDate.getMonth() + 1).toString().padStart(2, "0");
      const day = tenancyStartDate.getDate().toString().padStart(2, "0");
      const startDateString = `${day}/${month}/${year}`;

      const calculatedDueDateString = calculateRentDueDate(startDateString, tenantData.rentFrequency);

      if (calculatedDueDateString) {
        const parts = calculatedDueDateString.split("/");
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          setRentDueDate(new Date(y, m, d));
        }
      }
    }
  }, [tenancyStartDate, tenantData.rentFrequency]);

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

      // ✅ Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });

      if (onPropertyAdded) {
        onPropertyAdded();
      }

      // Store property name and ID, then show success modal
      setCreatedPropertyName(propertyData.name);
      setCreatedPropertyId(response?.property?.id || response?.id || null);
      setIsExistingTenant(response?.isExistingTenant || false);
      setKycStatus(response?.kycStatus || "");
      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(
        error?.message || "Failed to add property. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = (isOpen: boolean) => {
    setShowSuccessModal(isOpen);

    if (!isOpen && createdPropertyId) {
      // Navigate to property details page after success modal is closed
      router.push(`/${userRole}/property-detail/${createdPropertyId}`);
      setCreatedPropertyId(null);
    }
  };

  return (
    <>
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
            <div>
              <h1 className="text-lg text-slate-900">
                Let's set up your property
              </h1>
              <p className="text-xs text-slate-600">
                Add property details to start managing it on Lizt.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto pb-20 pt-10">
          <form onSubmit={handleSubmit} className="px-4 py-6 space-y-7">
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
                      className={`pl-8 ${errors.tenantRentAmount ? "border-red-500" : ""}`}
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
                  <Label
                    htmlFor="tenant-start-date"
                    className="text-sm text-slate-700"
                  >
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
                  <Label
                    htmlFor="tenant-rent-due-date"
                    className="text-sm text-slate-700"
                  >
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
          </form>
        </div>

        {/* Fixed Bottom Button with Safe Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 safe-area-bottom">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-[#FF5000] hover:bg-[#E64800] text-white h-11 transition-all duration-200 shadow-md hover:shadow-lg"
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
      </div>

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
