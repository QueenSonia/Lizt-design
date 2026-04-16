/**
 * PersonalDetailsStep Component
 * Step 1: Personal Details & Next of Kin
 * Requirements: 1.1, 1.2, 2.1, 5.1, 5.4, 4.1, 4.2
 */

import React, { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormStepProps, FormData as KYCFormData } from "../../types";
import { FormValidator } from "../../utils/form-validator";
import { SELECT_OPTIONS } from "../../constants/validation";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import {
  getCountryCode,
  extractCountryFromPlace,
} from "@/utils/countryMapping";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { formatLocalDate, parseLocalDate } from "@/utils/date-utils";
import AddressAutocomplete from "@/components/AddressAutoComplete";
import { normalizePhoneNumber } from "@/utils/phoneNormalization";
import { API_CONFIG } from "../../utils/api-config";
import { Loader2 } from "lucide-react";

interface PendingKYCData {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  property_id: string;
  phone_number: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  state_of_origin?: string;
  marital_status?: string;
  religion?: string;
  contact_address?: string;
  reference1_name?: string;
  reference1_address?: string;
  reference1_relationship?: string;
  reference1_phone_number?: string;
  reference1_email?: string;
  employment_status?: string;
  employer_name?: string;
  job_title?: string;
  employer_address?: string;
  employer_phone_number?: string;
  monthly_net_income?: string;
  length_of_employment?: string;
  nature_of_business?: string;
  business_name?: string;
  business_address?: string;
  business_duration?: string;
  reference2_name?: string;
  reference2_address?: string;
  reference2_relationship?: string;
  reference2_phone_number?: string;
  // Document URLs
  passport_photo_url?: string;
  id_document_url?: string;
  employment_proof_url?: string;
  business_proof_url?: string;
}

const PersonalDetailsStep: React.FC<FormStepProps> = ({
  formData,
  onDataChange,
  errors,
  onValidationChange,
  isFieldTouched,
  token: _token, // eslint-disable-line @typescript-eslint/no-unused-vars
  landlordId,
  kycVerificationToken,
  properties: _properties, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  // State for phone-first flow
  const [isPhoneEntered, setIsPhoneEntered] = useState(false);
  const [isCheckingPending, setIsCheckingPending] = useState(false);
  const [pendingKYCData, setPendingKYCData] = useState<PendingKYCData | null>(
    null,
  );
  const [availablePropertyIds, setAvailablePropertyIds] = useState<string[]>(
    [],
  );
  const [lastCheckedPhone, setLastCheckedPhone] = useState<string>("");
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(
    new Set(),
  );
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Helper function to get KYC value for a specific field
  const getKYCValueForField = useCallback(
    (fieldName: string, kycData: PendingKYCData) => {
      const fieldMapping: Record<string, string | undefined> = {
        first_name: kycData.first_name,
        last_name: kycData.last_name,
        email: kycData.email,
        date_of_birth: kycData.date_of_birth,
        gender: kycData.gender,
        nationality: kycData.nationality,
        state_of_origin: kycData.state_of_origin,
        marital_status: kycData.marital_status,
        religion: kycData.religion,
        contact_address: kycData.contact_address,
        next_of_kin_full_name: kycData.reference1_name,
        next_of_kin_address: kycData.reference1_address,
        next_of_kin_relationship: kycData.reference1_relationship,
        next_of_kin_phone_number: kycData.reference1_phone_number,
        next_of_kin_email: kycData.reference1_email,
        employment_status: kycData.employment_status,
        employer_name: kycData.employer_name,
        job_title: kycData.job_title,
        employer_address: kycData.employer_address,
        employer_phone_number: kycData.employer_phone_number,
        monthly_net_income: kycData.monthly_net_income,
        length_of_employment: kycData.length_of_employment,
        nature_of_business: kycData.nature_of_business,
        business_name: kycData.business_name,
        business_address: kycData.business_address,
        business_duration: kycData.business_duration,
        // estimatedMonthlyIncome mapped to monthly_net_income
        // guarantor fields removed
        passport_photo_url: kycData.passport_photo_url,
        id_document_url: kycData.id_document_url,
        employment_proof_url: kycData.employment_proof_url,
        business_proof_url: kycData.business_proof_url,
      };
      return fieldMapping[fieldName];
    },
    [],
  );

  // Check if phone is entered (at least 10 digits) - phone is pre-verified
  useEffect(() => {
    const phoneValue = formData.phone_number || "";
    const digitsOnly = phoneValue.replace(/\D/g, "");
    const isComplete = digitsOnly.length >= 10;
    setIsPhoneEntered(isComplete);
  }, [formData.phone_number]);

  // Validate step whenever form data changes
  useEffect(() => {
    const validation = FormValidator.validatePersonalDetails(formData);
    onValidationChange(validation.isValid);
  }, [formData, onValidationChange]);

  // Handle input changes
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      onDataChange({ [field]: value });
    },
    [onDataChange],
  );

  // Clear autofilled data when phone number changes to a different user
  const clearAutofilledData = useCallback(() => {
    console.log(
      "🧹 clearAutofilledData called, autofilledFields.size:",
      autofilledFields.size,
    );
    if (autofilledFields.size === 0 && !pendingKYCData) {
      console.log(
        "🧹 No autofilled fields to clear and no pending data, returning early",
      );
      return;
    }

    setIsClearing(true);

    const clearData: Partial<KYCFormData> = {};

    // Clear all autofilled fields except phoneNumber (user is changing it)
    autofilledFields.forEach((fieldName) => {
      if (fieldName !== "phoneNumber") {
        // Only clear fields that exist in FormData type - using UI field names that match autofillData
        const validFields = [
          "first_name",
          "last_name",
          "email",
          "date_of_birth",
          "gender",
          "nationality",
          "state_of_origin",
          "marital_status",
          "religion",
          "contact_address",
          "next_of_kin_full_name",
          "next_of_kin_address",
          "next_of_kin_relationship",
          "next_of_kin_phone_number",
          "next_of_kin_email",
          "employment_status",
          "employer_name",
          "job_title",
          "employer_address",
          "employer_phone_number",
          "monthly_net_income",
          "length_of_employment",
          "nature_of_business",
          "business_name",
          "business_address",
          "business_duration",
          // guarantor fields removed
          "passport_photo_url",
          "id_document_url",
          "employment_proof_url",
          "business_proof_url",
        ];

        if (validFields.includes(fieldName)) {
          (clearData as Record<string, string>)[fieldName] = "";
        }
      }
    });

    onDataChange(clearData);
    setAutofilledFields(new Set());

    // Clear the pending KYC data and available property IDs to remove success message
    setPendingKYCData(null);
    setAvailablePropertyIds([]);

    // Don't clear lastCheckedPhone here - we need it to track changes

    console.log(
      "🧹 Cleared autofilled data and success message for phone number change",
    );

    // Reset clearing flag after a short delay
    setTimeout(() => {
      setIsClearing(false);
    }, 200);

    // Optional: Show a brief notification to user (you can uncomment this if you want visual feedback)
    // toast.info("Form cleared", "Previous data cleared for new phone number");
  }, [autofilledFields, onDataChange, pendingKYCData]);

  // Separate function to perform the actual KYC check
  const performKYCCheck = useCallback(
    async (normalizedPhone: string) => {
      console.log("🔍 Starting KYC check for phone:", normalizedPhone);

      // Skip KYC lookups if no verification token
      if (!kycVerificationToken) {
        console.log("ℹ️ No verification token - skipping KYC lookup");
        return;
      }

      setIsCheckingPending(true);
      const authHeaders = {
        Authorization: `Bearer ${kycVerificationToken}`,
      };

      try {
        // First check for pending completion (landlord-specific) - this takes priority
        if (landlordId) {
          // Only include email if it looks like a real email (avoid placeholder values like '-' or '@placeholder.lizt.app' causing cross-tenant matches)
          const isRealEmail =
            formData.email &&
            formData.email !== "-" &&
            !formData.email.includes("@placeholder.lizt.app");
          const emailParam = isRealEmail
            ? `&email=${encodeURIComponent(formData.email!)}`
            : "";
          const pendingRes = await fetch(
            `${API_CONFIG.baseUrl}/api/kyc/check-pending?landlordId=${landlordId}${emailParam}`,
            { headers: authHeaders },
          );
          const pendingResponse = await pendingRes.json();

          if (pendingResponse.success && pendingResponse.hasPending) {
            // Store pending KYC data - this will use complete-pending endpoint
            console.log(
              "✅ Found pending KYC data for phone:",
              normalizedPhone,
            );
            setPendingKYCData(pendingResponse.kycData);
            setAvailablePropertyIds(pendingResponse.propertyIds || []);
            return; // Exit early - this takes priority
          }
        }

        // If no pending completion found, check for any existing KYC system-wide for autofill
        const existingEmailParam = formData.email
          ? `?email=${encodeURIComponent(formData.email)}`
          : "";
        const existingRes = await fetch(
          `${API_CONFIG.baseUrl}/api/kyc/check-existing${existingEmailParam}`,
          { headers: authHeaders },
        );
        const existingResponse = await existingRes.json();

        if (existingResponse.success && existingResponse.hasExisting) {
          // Store existing KYC data for autofill only (no pendingKYCId)
          console.log("✅ Found existing KYC data for phone:", normalizedPhone);
          setPendingKYCData(existingResponse.kycData);
          setAvailablePropertyIds([]); // No property restriction for system-wide autofill
        } else {
          // No KYC found at all - just clear autofill state, DON'T wipe sessionStorage
          console.log("❌ No KYC data found for phone:", normalizedPhone);
          console.log(
            "✅ Keeping sessionStorage data intact - user can continue with manual entry",
          );
          setPendingKYCData(null);
          setAvailablePropertyIds([]);
          setAutofilledFields(new Set());
          // DON'T call onDataChange with empty data - preserve sessionStorage!
        }
      } catch (error) {
        console.error("Error checking KYC:", error);
        // Don't show error to user, just continue with normal flow
        setPendingKYCData(null);
        setAvailablePropertyIds([]);
      } finally {
        setIsCheckingPending(false);
      }
    },
    [landlordId, formData.email, kycVerificationToken],
  );

  // System-wide KYC lookup for autofill
  const checkExistingKYC = useCallback(
    async (phone: string) => {
      console.log("🔍 Checking KYC for:", phone);

      if (!phone || phone.replace(/\D/g, "").length < 10) {
        console.log(
          "📞 Phone too short for KYC check:",
          phone,
          "Length:",
          phone.replace(/\D/g, "").length,
        );
        return;
      }

      const normalizedPhone = normalizePhoneNumber(phone);
      console.log(
        "📞 Checking KYC for normalized phone:",
        normalizedPhone,
        "from input:",
        phone,
      );

      // Check if this is a different phone number than the last checked one
      // Clear data if we have autofilled fields and the phone number changed
      if (lastCheckedPhone && lastCheckedPhone !== normalizedPhone) {
        console.log(
          "📞 Phone number changed from",
          lastCheckedPhone,
          "to",
          normalizedPhone,
        );

        // If we have autofilled data from previous phone, clear it first
        if (autofilledFields.size > 0 || pendingKYCData) {
          console.log("📞 Clearing previous autofilled data");
          clearAutofilledData();

          // Add a small delay before checking new phone to allow clearing to complete
          setTimeout(() => {
            setLastCheckedPhone(normalizedPhone);
            // Continue with KYC check after clearing
            performKYCCheck(normalizedPhone);
          }, 150);
          return;
        }
      }

      // Update the last checked phone number
      setLastCheckedPhone(normalizedPhone);

      // Perform KYC check immediately if no clearing needed
      performKYCCheck(normalizedPhone);
    },
    [
      lastCheckedPhone,
      autofilledFields.size,
      clearAutofilledData,
      performKYCCheck,
      pendingKYCData,
    ],
  );

  // Initial phone check when component loads - phone is pre-verified and immutable
  useEffect(() => {
    const phoneValue = formData.phone_number || "";
    const digitsOnly = phoneValue.replace(/\D/g, "");
    const isComplete = digitsOnly.length >= 10;

    // Phone is pre-verified, so check for KYC immediately on mount
    // Skip if parent already loaded KYC data (pending_kyc_id is set) to avoid overwriting correct data
    if (
      isComplete &&
      !lastCheckedPhone &&
      !isCheckingPending &&
      !formData.pending_kyc_id
    ) {
      console.log("📱 Initial KYC check for verified phone:", phoneValue);
      checkExistingKYC(phoneValue);
    }
  }, [
    formData.phone_number,
    lastCheckedPhone,
    isCheckingPending,
    checkExistingKYC,
    formData.pending_kyc_id,
  ]);

  // Pre-fill form data when existing KYC is found - autofill everything except tenancy info
  useEffect(() => {
    if (pendingKYCData && !isClearing) {
      // Create comprehensive autofill data object - ONLY use KYC data, no fallbacks to formData
      const autofillData: Record<string, unknown> = {
        // Personal Details
        first_name: pendingKYCData.first_name || "",
        last_name: pendingKYCData.last_name || "",
        email: pendingKYCData.email || "",
        date_of_birth: pendingKYCData.date_of_birth || "",
        gender: pendingKYCData.gender || "",
        nationality: pendingKYCData.nationality || "",
        state_of_origin: pendingKYCData.state_of_origin || "",
        marital_status: pendingKYCData.marital_status || "",
        religion: pendingKYCData.religion || "",

        // Contact Address (if available)
        contact_address: pendingKYCData.contact_address || "",

        // Next of Kin Information
        next_of_kin_full_name: pendingKYCData.reference1_name || "",
        next_of_kin_address: pendingKYCData.reference1_address || "",
        next_of_kin_relationship: pendingKYCData.reference1_relationship || "",
        next_of_kin_phone_number: pendingKYCData.reference1_phone_number || "",
        next_of_kin_email: pendingKYCData.reference1_email || "",

        // Employment Details
        employment_status: pendingKYCData.employment_status || "",

        // For Employed
        employer_name: pendingKYCData.employer_name || "",
        job_title: pendingKYCData.job_title || "",
        employer_address: pendingKYCData.employer_address || "",
        employer_phone_number: pendingKYCData.employer_phone_number || "",
        monthly_net_income: pendingKYCData.monthly_net_income || "",
        length_of_employment: pendingKYCData.length_of_employment || "",

        // For Self-Employed
        nature_of_business: pendingKYCData.nature_of_business || "",
        business_name: pendingKYCData.business_name || "",
        business_address: pendingKYCData.business_address || "",
        business_duration: pendingKYCData.business_duration || "",
        // estimatedMonthlyIncome mapped to monthly_net_income above

        // Guarantor Information (if available from reference2)
        // guarantor logic removed

        // Document URLs - Auto-fill existing document URLs
        passport_photo_url: pendingKYCData.passport_photo_url || "",
        id_document_url: pendingKYCData.id_document_url || "",
        employment_proof_url: pendingKYCData.employment_proof_url || "",
        business_proof_url: pendingKYCData.business_proof_url || "",

        // Store metadata for completion flow - ONLY for PENDING_COMPLETION KYCs
        ...(availablePropertyIds.length > 0 && {
          pending_kyc_id: pendingKYCData.id,
          available_property_ids: availablePropertyIds.join(","),
          property_applying_for: pendingKYCData.property_id || "",
        }),
      };

      // Filter out undefined/null values to avoid overwriting existing form data with empty values
      const filteredAutofillData = Object.fromEntries(
        Object.entries(autofillData).filter(
          ([, value]) => value !== undefined && value !== null && value !== "",
        ),
      );

      // Track which fields are being autofilled
      const newAutofilledFields = new Set<string>();
      Object.keys(filteredAutofillData).forEach((key) => {
        // Only track as autofilled if the value is actually from KYC data (not fallback to existing form data)
        const kycValue = getKYCValueForField(key, pendingKYCData);
        if (
          kycValue &&
          kycValue !== "" &&
          kycValue !== null &&
          kycValue !== undefined
        ) {
          newAutofilledFields.add(key);
        }
      });

      setAutofilledFields(newAutofilledFields);
      onDataChange(filteredAutofillData);

      console.log("✨ Autofilled fields:", Array.from(newAutofilledFields));
    }
  }, [
    pendingKYCData,
    isClearing,
    availablePropertyIds,
    onDataChange,
    getKYCValueForField,
  ]);

  // Helper to check if error should be shown (only if field is touched)
  const shouldShowError = (field: string) => {
    // Only show error if the field has been explicitly touched (user tried to navigate)
    return isFieldTouched(field) && !!errors[field];
  };

  // Determine if fields should be disabled (phone not entered yet)
  const areFieldsDisabled = !isPhoneEntered;

  // Determine if specific fields should be locked (read-only)
  const isFieldLocked = (field: string): boolean => {
    if (!pendingKYCData) return false;

    // For pending completion (landlord-specific), lock property field
    if (availablePropertyIds.length > 0) {
      const lockedFields = ["property_applying_for"];
      return lockedFields.includes(field);
    }

    // For system-wide autofill, don't lock any fields - user can edit everything
    return false;
  };

  // Email remains editable even when pre-filled - Requirement 4.7
  // const isEmailEditable = true; // Unused variable removed

  return (
    <div className="space-y-6">
      {/* Personal Information Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-5">
          Personal Information
        </h3>
        {pendingKYCData && !isClearing && (
          <p className="text-sm text-gray-600 mb-4">
            {availablePropertyIds.length > 0
              ? "✓ We found your pending application! Complete the remaining details."
              : "✓ We found your information and pre-filled the form! You can edit any field as needed."}
          </p>
        )}
        <div className="space-y-5">
          {/* Phone Number - Requirements 4.1, 4.2 */}
          <div>
            <Label htmlFor="phone_number">
              WhatsApp Phone Number <span style={{ color: "#FF5000" }}>*</span>
            </Label>
            <div className="relative">
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number || ""}
                placeholder="+234 XXX XXX XXXX"
                className="max-w-sm mt-1.5 bg-gray-50 cursor-not-allowed"
                readOnly
                disabled
              />
              {isCheckingPending && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Verified phone number
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name{" "}
                {isFieldLocked("first_name") && (
                  <span className="text-blue-600 text-xs">(Pre-filled)</span>
                )}
              </Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name || ""}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Enter first name"
                className={
                  shouldShowError("first_name") ? "border-red-500" : ""
                }
                disabled={areFieldsDisabled}
                readOnly={isFieldLocked("first_name")}
              />
              {shouldShowError("first_name") && (
                <p className="text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name{" "}
                {isFieldLocked("last_name") && (
                  <span className="text-blue-600 text-xs">(Pre-filled)</span>
                )}
              </Label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name || ""}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Enter last name"
                className={shouldShowError("last_name") ? "border-red-500" : ""}
                disabled={areFieldsDisabled}
                readOnly={isFieldLocked("last_name")}
              />
              {shouldShowError("last_name") && (
                <p className="text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>
          </div>

          {!pendingKYCData && (
            <div className="space-y-2">
              <AddressAutocomplete
                id="contact_address"
                label="Contact Address"
                value={formData.contact_address || ""}
                onChange={(value) =>
                  handleInputChange("contact_address", value)
                }
                placeholder="Enter your current residential address"
                useTextarea={false}
                error={errors.contact_address}
                className={
                  shouldShowError("contact_address") ? "border-red-500" : ""
                }
                disabled={areFieldsDisabled}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <GooglePlacesAutocomplete
                label="Nationality"
                value={formData.nationality || ""}
                onChange={(value, place) => {
                  const countryName = place
                    ? extractCountryFromPlace(place)
                    : value;
                  handleInputChange("nationality", countryName || value);
                }}
                placeholder="Select nationality"
                types={["country"]}
                className={
                  shouldShowError("nationality") ? "border-red-500" : ""
                }
              />
              {shouldShowError("nationality") && (
                <p className="text-sm text-red-600">{errors.nationality}</p>
              )}
            </div>

            <div className="space-y-2">
              <GooglePlacesAutocomplete
                label="State of Origin"
                value={formData.state_of_origin || ""}
                onChange={(value) =>
                  handleInputChange("state_of_origin", value)
                }
                placeholder="Select state"
                types={["administrative_area_level_1"]}
                componentRestrictions={{
                  country: getCountryCode(formData.nationality),
                }}
                className={
                  shouldShowError("state_of_origin") ? "border-red-500" : ""
                }
              />
              {shouldShowError("state_of_origin") && (
                <p className="text-sm text-red-600">{errors.state_of_origin}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender || ""}
                onValueChange={(value) => handleInputChange("gender", value)}
                disabled={areFieldsDisabled}
              >
                <SelectTrigger
                  className={shouldShowError("gender") ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  {SELECT_OPTIONS.SEX.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <DatePickerInput
                value={parseLocalDate(formData.date_of_birth)}
                onChange={(date) => {
                  if (date) {
                    handleInputChange("date_of_birth", formatLocalDate(date));
                  }
                }}
                placeholder="DD/MM/YYYY"
                disabled={areFieldsDisabled}
                error={!!errors.date_of_birth}
                disabledDates={(date) => date > new Date()}
                fromYear={1900}
                toYear={new Date().getFullYear()}
              />
              {errors.date_of_birth && (
                <p className="text-sm text-red-600">{errors.date_of_birth}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select
                value={formData.marital_status || ""}
                onValueChange={(value) =>
                  handleInputChange("marital_status", value)
                }
                disabled={areFieldsDisabled}
              >
                <SelectTrigger
                  className={errors.marital_status ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {SELECT_OPTIONS.MARITAL_STATUS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.marital_status && (
                <p className="text-sm text-red-600">{errors.marital_status}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="religion">Religion</Label>
              <Select
                value={formData.religion || ""}
                onValueChange={(value) => handleInputChange("religion", value)}
                disabled={areFieldsDisabled}
              >
                <SelectTrigger
                  className={errors.religion ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Christianity">Christianity</SelectItem>
                  <SelectItem value="Islam">Islam</SelectItem>
                  <SelectItem value="Traditional">Traditional</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.religion && (
                <p className="text-sm text-red-600">{errors.religion}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your.email@example.com"
                className={shouldShowError("email") ? "border-red-500" : ""}
                disabled={areFieldsDisabled}
              />
              {shouldShowError("email") && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next of Kin Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-5">
          Next of Kin Details
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="next_of_kin_full_name">Full Name</Label>
            <Input
              id="next_of_kin_full_name"
              value={formData.next_of_kin_full_name || ""}
              onChange={(e) =>
                handleInputChange("next_of_kin_full_name", e.target.value)
              }
              placeholder="Enter next of kin full name"
              className={errors.next_of_kin_full_name ? "border-red-500" : ""}
              disabled={areFieldsDisabled}
            />
            {errors.next_of_kin_full_name && (
              <p className="text-sm text-red-600">
                {errors.next_of_kin_full_name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <AddressAutocomplete
              id="next_of_kin_address"
              label="Address"
              value={formData.next_of_kin_address || ""}
              onChange={(value) =>
                handleInputChange("next_of_kin_address", value)
              }
              placeholder="Enter next of kin address"
              useTextarea={false}
              error={errors.next_of_kin_address}
              className={errors.next_of_kin_address ? "border-red-500" : ""}
              disabled={areFieldsDisabled}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="next_of_kin_relationship">Relationship</Label>
              <Input
                id="next_of_kin_relationship"
                value={formData.next_of_kin_relationship || ""}
                onChange={(e) =>
                  handleInputChange("next_of_kin_relationship", e.target.value)
                }
                placeholder="e.g., Father, Sister"
                className={
                  errors.next_of_kin_relationship ? "border-red-500" : ""
                }
                disabled={areFieldsDisabled}
              />
              {errors.next_of_kin_relationship && (
                <p className="text-sm text-red-600">
                  {errors.next_of_kin_relationship}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_of_kin_phone_number">Phone Number</Label>
              <Input
                id="next_of_kin_phone_number"
                type="tel"
                value={formData.next_of_kin_phone_number || ""}
                onChange={(e) =>
                  handleInputChange("next_of_kin_phone_number", e.target.value)
                }
                placeholder="+234 XXX XXX XXXX"
                className={
                  errors.next_of_kin_phone_number ? "border-red-500" : ""
                }
                disabled={areFieldsDisabled}
              />
              {errors.next_of_kin_phone_number && (
                <p className="text-sm text-red-600">
                  {errors.next_of_kin_phone_number}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_of_kin_email">Email Address</Label>
            <Input
              id="next_of_kin_email"
              type="email"
              value={formData.next_of_kin_email || ""}
              onChange={(e) =>
                handleInputChange("next_of_kin_email", e.target.value)
              }
              placeholder="next.of.kin@example.com"
              className={errors.next_of_kin_email ? "border-red-500" : ""}
              disabled={areFieldsDisabled}
            />
            {errors.next_of_kin_email && (
              <p className="text-sm text-red-600">{errors.next_of_kin_email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsStep;
