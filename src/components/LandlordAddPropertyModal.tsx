/* eslint-disable */
import { useState, useCallback, useEffect, useRef } from "react";
import { X, Plus, ChevronDown, Check, ChevronsUpDown, Search } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
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

  // ── Landlord state ────────────────────────────────────────────────────────────
  type MockLandlord =
    | { id: string; name: string; type: "individual" }
    | { id: string; name: string; type: "corporate"; contact: string };

  const [landlordList, setLandlordList] = useState<MockLandlord[]>([
    { id: "ll-001", name: "Michael Adeyemi", type: "individual" },
    { id: "ll-002", name: "Sarah Johnson", type: "individual" },
    { id: "ll-003", name: "Funke Balogun", type: "individual" },
    { id: "ll-004", name: "Emeka Okonkwo", type: "individual" },
    { id: "ll-005", name: "Adeyemi Holdings Ltd", type: "corporate", contact: "Michael Adeyemi" },
    { id: "ll-006", name: "Prime Estates Limited", type: "corporate", contact: "Sarah Johnson" },
  ]);

  const [selectedLandlordId, setSelectedLandlordId] = useState("");
  const [landlordSearchOpen, setLandlordSearchOpen] = useState(false);
  const [landlordSearchQuery, setLandlordSearchQuery] = useState("");
  const [showNewLandlordForm, setShowNewLandlordForm] = useState(false);
  const [newLandlordType, setNewLandlordType] = useState<"individual" | "corporate">("individual");
  const [newLandlordData, setNewLandlordData] = useState({
    fullName: "", corporateName: "", email: "", phone: "",
  });
  const [landlordError, setLandlordError] = useState("");

  const filteredLandlords = landlordList.filter(l =>
    l.name.toLowerCase().includes(landlordSearchQuery.toLowerCase()) ||
    ("contact" in l && l.contact?.toLowerCase().includes(landlordSearchQuery.toLowerCase()))
  );

  const selectedLandlord = landlordList.find(l => l.id === selectedLandlordId);

  const effectiveLandlord = showNewLandlordForm
    ? (newLandlordType === "corporate"
        ? `${newLandlordData.corporateName}${newLandlordData.fullName ? ` (Contact: ${newLandlordData.fullName})` : ""}`
        : newLandlordData.fullName)
    : selectedLandlord?.name ?? "";

  const handleAddNewLandlordFromDropdown = () => {
    setLandlordSearchOpen(false);
    setLandlordSearchQuery("");
    setShowNewLandlordForm(true);
    setSelectedLandlordId("");
    setLandlordError("");
  };

  const handleSaveNewLandlord = () => {
    const name = newLandlordType === "corporate"
      ? newLandlordData.corporateName.trim()
      : newLandlordData.fullName.trim();

    if (!name) {
      setLandlordError(
        newLandlordType === "corporate"
          ? "Please enter the corporate name"
          : "Please enter the landlord's full name"
      );
      return;
    }

    const newId = `ll-new-${Date.now()}`;
    const newEntry: MockLandlord = newLandlordType === "corporate"
      ? { id: newId, name, type: "corporate", contact: newLandlordData.fullName.trim() }
      : { id: newId, name, type: "individual" };

    setLandlordList(prev => [...prev, newEntry]);
    setSelectedLandlordId(newId);
    setShowNewLandlordForm(false);
    setNewLandlordData({ fullName: "", corporateName: "", email: "", phone: "" });
    setNewLandlordType("individual");
    setLandlordError("");
  };

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

    // Landlord validation
    if (!showNewLandlordForm && !selectedLandlordId) {
      setLandlordError("Please select or add a landlord");
      isValid = false;
    } else if (showNewLandlordForm) {
      if (newLandlordType === "individual" && !newLandlordData.fullName.trim()) {
        setLandlordError("Please enter the landlord's full name");
        isValid = false;
      } else if (newLandlordType === "corporate" && !newLandlordData.corporateName.trim()) {
        setLandlordError("Please enter the corporate name");
        isValid = false;
      } else {
        setLandlordError("");
      }
    } else {
      setLandlordError("");
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
      setSelectedLandlordId("");
      setLandlordSearchQuery("");
      setLandlordSearchOpen(false);
      setShowNewLandlordForm(false);
      setNewLandlordType("individual");
      setNewLandlordData({ fullName: "", corporateName: "", email: "", phone: "" });
      setLandlordError("");
      setLandlordList([
        { id: "ll-001", name: "Michael Adeyemi", type: "individual" },
        { id: "ll-002", name: "Sarah Johnson", type: "individual" },
        { id: "ll-003", name: "Funke Balogun", type: "individual" },
        { id: "ll-004", name: "Emeka Okonkwo", type: "individual" },
        { id: "ll-005", name: "Adeyemi Holdings Ltd", type: "corporate", contact: "Michael Adeyemi" },
        { id: "ll-006", name: "Prime Estates Limited", type: "corporate", contact: "Sarah Johnson" },
      ]);
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
      setSelectedLandlordId("");
      setLandlordSearchQuery("");
      setLandlordSearchOpen(false);
      setShowNewLandlordForm(false);
      setNewLandlordType("individual");
      setNewLandlordData({ fullName: "", corporateName: "", email: "", phone: "" });
      setLandlordError("");
      setLandlordList([
        { id: "ll-001", name: "Michael Adeyemi", type: "individual" },
        { id: "ll-002", name: "Sarah Johnson", type: "individual" },
        { id: "ll-003", name: "Funke Balogun", type: "individual" },
        { id: "ll-004", name: "Emeka Okonkwo", type: "individual" },
        { id: "ll-005", name: "Adeyemi Holdings Ltd", type: "corporate", contact: "Michael Adeyemi" },
        { id: "ll-006", name: "Prime Estates Limited", type: "corporate", contact: "Sarah Johnson" },
      ]);
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

            {/* Landlord */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-700">Landlord <span className="text-red-500">*</span></Label>

              {!showNewLandlordForm ? (
                /* Searchable landlord combobox with inline "+ Add New Landlord" at bottom */
                <Popover open={landlordSearchOpen} onOpenChange={setLandlordSearchOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={isLoading}
                      className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm text-left bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 ${
                        landlordError ? "border-red-500" : "border-input hover:border-gray-400"
                      } disabled:opacity-50`}
                    >
                      {selectedLandlord ? (
                        <span className="text-slate-900">
                          {selectedLandlord.type === "corporate" && "contact" in selectedLandlord
                            ? <span>{selectedLandlord.name} <span className="text-slate-500 text-xs">(Contact: {selectedLandlord.contact})</span></span>
                            : selectedLandlord.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Select landlord</span>
                      )}
                      <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="flex items-center border-b px-3 py-2 gap-2">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        autoFocus
                        value={landlordSearchQuery}
                        onChange={e => setLandlordSearchQuery(e.target.value)}
                        placeholder="Search landlord..."
                        className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {filteredLandlords.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-slate-400 text-center">No landlords found</p>
                      ) : (
                        filteredLandlords.map(l => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setSelectedLandlordId(l.id);
                              setLandlordError("");
                              setLandlordSearchOpen(false);
                              setLandlordSearchQuery("");
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${
                              selectedLandlordId === l.id ? "bg-orange-50" : ""
                            }`}
                          >
                            <div>
                              <div className="font-medium text-slate-900">{l.name}</div>
                              {l.type === "corporate" && "contact" in l && (
                                <div className="text-xs text-slate-500">Contact: {l.contact}</div>
                              )}
                            </div>
                            {selectedLandlordId === l.id && (
                              <Check className="w-4 h-4 text-[#FF5000] shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                    {/* Always-visible Add New Landlord action */}
                    <div className="border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleAddNewLandlordFromDropdown}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#FF5000] hover:bg-orange-50 transition-colors"
                      >
                        <Plus className="w-4 h-4 shrink-0" />
                        Add New Landlord
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                /* Inline new-landlord form */
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-700">New Landlord</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewLandlordForm(false);
                        setNewLandlordData({ fullName: "", corporateName: "", email: "", phone: "" });
                        setNewLandlordType("individual");
                        setLandlordError("");
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Landlord Type toggle */}
                  <div className="flex gap-2">
                    {(["individual", "corporate"] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewLandlordType(t)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors ${
                          newLandlordType === t
                            ? "border-[#FF5000] bg-[#FFF3EB] text-[#FF5000]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {newLandlordType === "corporate" && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Primary Contact Name</Label>
                      <Input
                        placeholder="e.g. Michael Adeyemi"
                        value={newLandlordData.fullName}
                        onChange={e => setNewLandlordData(p => ({ ...p, fullName: e.target.value }))}
                        disabled={isLoading}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">
                      {newLandlordType === "corporate" ? "Corporate / Business Name" : "Full Name"} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder={newLandlordType === "corporate" ? "e.g. Adeyemi Holdings Ltd" : "e.g. Michael Adeyemi"}
                      value={newLandlordType === "corporate" ? newLandlordData.corporateName : newLandlordData.fullName}
                      onChange={e => setNewLandlordData(p => ({
                        ...p,
                        [newLandlordType === "corporate" ? "corporateName" : "fullName"]: e.target.value
                      }))}
                      disabled={isLoading}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={newLandlordData.email}
                      onChange={e => setNewLandlordData(p => ({ ...p, email: e.target.value }))}
                      disabled={isLoading}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Phone Number</Label>
                    <Input
                      placeholder="+234 xxx xxx xxxx"
                      value={newLandlordData.phone}
                      onChange={e => setNewLandlordData(p => ({ ...p, phone: e.target.value }))}
                      disabled={isLoading}
                      className="h-9 text-sm"
                    />
                  </div>

                  {landlordError && <p className="text-xs text-red-500">{landlordError}</p>}

                  <Button
                    type="button"
                    onClick={handleSaveNewLandlord}
                    className="w-full h-9 bg-[#FF5000] hover:bg-[#E64800] text-white text-sm"
                  >
                    Add Landlord
                  </Button>
                </div>
              )}

              {!showNewLandlordForm && landlordError && (
                <p className="text-xs text-red-500">{landlordError}</p>
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
