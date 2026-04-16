/* eslint-disable */
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import AddressAutocomplete from "./AddressAutoComplete";
import { useFetchTenantKYCApplications } from "@/services/kyc/query";
import { useCreateTenantKYCMutation } from "@/services/kyc/mutation";

// Mock data for dropdowns (same as AddNewTenant)
const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

// Import the marketing ready properties hook
import { useFetchMarketingReadyProperties } from "@/services/property/query";

interface FormData {
  // Personal Information
  firstName: string;
  surname: string;
  phoneNumber: string;
  emailAddress: string;
  dateOfBirth: string;
  gender: string;
  stateOfOrigin: string;
  lga: string;
  nationality: string;

  // Employment & Income
  employmentStatus: string;
  employerName: string;
  employerAddress: string;
  jobTitle: string;
  monthlyIncome: string;
  workEmail: string;
  natureOfBusiness: string;
  businessName: string;
  businessAddress: string;
  businessWebsite: string;
  sourceOfFunds: string;
  monthlyIncomeEstimate: string;

  // Marital & Family
  maritalStatus: string;
  spouseName: string;
  spousePhone: string;
  spouseOccupation: string;
  spouseEmployer: string;

  // Tenancy Details
  property: string;
  rentAmount: string;
  tenancyStartDate: string;
  tenancyEndDate: string;

  // Declaration
  declarationAccepted: boolean;
}

interface TenantKYCDetailsProps {
  tenantId: string | null;
  landlordId?: string;
}

export function TenantKYCDetails({
  tenantId,
  landlordId,
}: TenantKYCDetailsProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch real KYC data for this tenant
  const {
    data: kycApplications,
    isLoading,
    error,
  } = useFetchTenantKYCApplications(tenantId || "");

  // Mutation for creating/updating KYC data
  const createKYCMutation = useCreateTenantKYCMutation();

  // Fetch marketing ready properties for property selection
  const { data: properties = [] } = useFetchMarketingReadyProperties();

  // Get the most recent approved KYC application
  const kycData =
    kycApplications?.find((app) => app.status === "approved") ||
    kycApplications?.[0] ||
    null;

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    surname: "",
    phoneNumber: "",
    emailAddress: "",
    dateOfBirth: "",
    gender: "",
    stateOfOrigin: "",
    lga: "",
    nationality: "Nigerian",
    employmentStatus: "",
    employerName: "",
    employerAddress: "",
    jobTitle: "",
    monthlyIncome: "",
    workEmail: "",
    natureOfBusiness: "",
    businessName: "",
    businessAddress: "",
    businessWebsite: "",
    sourceOfFunds: "",
    monthlyIncomeEstimate: "",
    maritalStatus: "",
    spouseName: "",
    spousePhone: "",
    spouseOccupation: "",
    spouseEmployer: "",
    property: "",
    rentAmount: "",
    tenancyStartDate: "",
    tenancyEndDate: "",
    declarationAccepted: false,
  });

  // Update form data when KYC data is loaded
  useEffect(() => {
    if (kycData) {
      setFormData({
        firstName: kycData.firstName || "",
        surname: kycData.lastName || "",
        phoneNumber: kycData.phoneNumber || "",
        emailAddress: kycData.email || "",
        dateOfBirth: kycData.dateOfBirth || "",
        gender: kycData.gender || "",
        stateOfOrigin: kycData.stateOfOrigin || "",
        lga: kycData.localGovernmentArea || "",
        nationality: kycData.nationality || "Nigerian",
        employmentStatus: kycData.employmentStatus || "",
        employerName: kycData.employerName || "",
        employerAddress: kycData.employerAddress || "",
        jobTitle: kycData.jobTitle || "",
        monthlyIncome: kycData.monthlyNetIncome || "",
        workEmail: "",
        natureOfBusiness: "",
        businessName: "",
        businessAddress: "",
        businessWebsite: "",
        sourceOfFunds: "",
        monthlyIncomeEstimate: "",
        maritalStatus: kycData.maritalStatus || "",
        spouseName: kycData.reference1?.name || "",
        spousePhone: kycData.reference1?.phoneNumber || "",
        spouseOccupation: "",
        spouseEmployer: "",
        property: "",
        rentAmount: "",
        tenancyStartDate: "",
        tenancyEndDate: "",
        declarationAccepted: true,
      });
    }
  }, [kycData]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSaveChanges = async () => {
    // Validate required fields
    const requiredFields = {
      firstName: "First Name",
      surname: "Surname",
      phoneNumber: "Phone Number",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      stateOfOrigin: "State of Origin",
      lga: "LGA",
      nationality: "Nationality",
      employmentStatus: "Employment Status",
      maritalStatus: "Marital Status",
      declarationAccepted: "Declaration",
    };

    const newErrors: Record<string, string> = {};

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (field === "declarationAccepted") {
        if (!formData[field as keyof FormData]) {
          newErrors[field] = `${label} must be accepted`;
        }
      } else {
        const value = formData[field as keyof FormData];
        if (!value || (typeof value === "string" && value.trim() === "")) {
          newErrors[field] = `${label} is required`;
        }
      }
    });

    // Validate employment-specific fields
    if (formData.employmentStatus === "employed") {
      if (!formData.employerName?.trim()) {
        newErrors.employerName = "Employer Name is required";
      }
      if (!formData.jobTitle?.trim()) {
        newErrors.jobTitle = "Job Title is required";
      }
      if (!formData.monthlyIncome?.trim()) {
        newErrors.monthlyIncome = "Monthly Income is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const kycData = {
        firstName: formData.firstName,
        lastName: formData.surname,
        email: formData.emailAddress,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationality: formData.nationality,
        stateOfOrigin: formData.stateOfOrigin,
        localGovernmentArea: formData.lga,
        maritalStatus: formData.maritalStatus,
        employmentStatus: formData.employmentStatus,
        occupation:
          formData.employmentStatus === "employed"
            ? formData.jobTitle || "Employee"
            : formData.employmentStatus === "self-employed"
            ? formData.natureOfBusiness || "Business Owner"
            : "Unemployed",
        jobTitle: formData.jobTitle,
        employerName: formData.employerName,
        employerAddress: formData.employerAddress,
        monthlyNetIncome:
          formData.monthlyIncome || formData.monthlyIncomeEstimate || "0",
        reference1Name: formData.spouseName || "——",
        reference1Address: "——",
        reference1Relationship:
          formData.maritalStatus === "married" ? "Spouse" : "Family",
        reference1PhoneNumber: formData.spousePhone || formData.phoneNumber,
        reference2Name: "",
        reference2Address: "",
        reference2Relationship: "",
        reference2PhoneNumber: "",
      };

      await createKYCMutation.mutateAsync(kycData);
      toast.success("KYC details saved successfully");
      setHasUnsavedChanges(false);
      setIsEditing(false);
      setErrors({});
    } catch (error: any) {
      console.error("Error saving KYC:", error);
      toast.error(error.message || "Failed to save KYC details");
    }
  };

  const handleFillKYC = () => {
    setIsEditing(true);
  };

  const handleDiscardChanges = () => {
    if (kycData) {
      setFormData({
        firstName: kycData.firstName || "",
        surname: kycData.lastName || "",
        phoneNumber: kycData.phoneNumber || "",
        emailAddress: kycData.email || "",
        dateOfBirth: kycData.dateOfBirth || "",
        gender: kycData.gender || "",
        stateOfOrigin: kycData.stateOfOrigin || "",
        lga: kycData.localGovernmentArea || "",
        nationality: kycData.nationality || "Nigerian",
        employmentStatus: kycData.employmentStatus || "",
        employerName: kycData.employerName || "",
        employerAddress: kycData.employerAddress || "",
        jobTitle: kycData.jobTitle || "",
        monthlyIncome: kycData.monthlyNetIncome || "",
        workEmail: "",
        natureOfBusiness: "",
        businessName: "",
        businessAddress: "",
        businessWebsite: "",
        sourceOfFunds: "",
        monthlyIncomeEstimate: "",
        maritalStatus: kycData.maritalStatus || "",
        spouseName: kycData.reference1?.name || "",
        spousePhone: kycData.reference1?.phoneNumber || "",
        spouseOccupation: "",
        spouseEmployer: "",
        property: "",
        rentAmount: "",
        tenancyStartDate: "",
        tenancyEndDate: "",
        declarationAccepted: true,
      });
    }
    setHasUnsavedChanges(false);
    setErrors({});
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-6 flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600">Loading KYC information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-6 flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-slate-900">Error Loading KYC Information</h2>
            <p className="text-slate-600 max-w-md">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // If no KYC data exists, show empty state with option to create
  if (!kycData && !isEditing) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Empty State */}
        <div className="p-6 flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 bg-slate-300 rounded"></div>
            </div>
            <h2 className="text-slate-900">
              No KYC information found for this tenant.
            </h2>
            <p className="text-slate-600 max-w-md">
              This tenant may not have completed a KYC application yet, or their
              application may still be pending approval. You can create KYC
              information for this tenant.
            </p>
            {kycApplications && kycApplications.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Found {kycApplications.length} KYC application(s) with status:{" "}
                  {kycApplications.map((app) => app.status).join(", ")}
                </p>
              </div>
            )}
            <div className="mt-6">
              <Button
                onClick={handleFillKYC}
                className="gradient-primary text-white px-6"
              >
                Fill KYC
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-amber-800">You have unsaved changes</p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSaveChanges}
                className="gradient-primary text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-4xl pl-8 pr-6 pt-12 pb-12 space-y-6">
        {/* Section 1: Personal Information */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-slate-900">Personal Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-slate-700 font-medium block"
                >
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Enter first name"
                  className={`h-10 ${
                    errors.firstName
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="surname"
                  className="text-slate-700 font-medium block"
                >
                  Surname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                  placeholder="Enter surname"
                  className={`h-10 ${
                    errors.surname
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.surname && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.surname}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phoneNumber"
                  className="text-slate-700 font-medium block"
                >
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="+234 xxx xxx xxxx"
                  className={`h-10 ${
                    errors.phoneNumber
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="emailAddress"
                  className="text-slate-700 font-medium block"
                >
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) =>
                    handleInputChange("emailAddress", e.target.value)
                  }
                  placeholder="email@example.com"
                  className={`h-10 ${
                    errors.emailAddress
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.emailAddress && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.emailAddress}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="dateOfBirth"
                  className="text-slate-700 font-medium block"
                >
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  className={`h-10 ${
                    errors.dateOfBirth
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="gender"
                  className="text-slate-700 font-medium block"
                >
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.gender
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.gender}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="stateOfOrigin"
                  className="text-slate-700 font-medium block"
                >
                  State of Origin <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.stateOfOrigin}
                  onValueChange={(value) =>
                    handleInputChange("stateOfOrigin", value)
                  }
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.stateOfOrigin
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stateOfOrigin && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.stateOfOrigin}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="lga"
                  className="text-slate-700 font-medium block"
                >
                  LGA <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lga"
                  value={formData.lga}
                  onChange={(e) => handleInputChange("lga", e.target.value)}
                  placeholder="Enter Local Government Area"
                  className={`h-10 ${
                    errors.lga
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.lga && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.lga}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="nationality"
                  className="text-slate-700 font-medium block"
                >
                  Nationality <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) =>
                    handleInputChange("nationality", e.target.value)
                  }
                  placeholder="Enter nationality"
                  className={`h-10 ${
                    errors.nationality
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.nationality && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.nationality}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 2: Employment & Income Information */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-slate-900">Employment & Income Information</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="employmentStatus"
                  className="text-slate-700 font-medium block"
                >
                  Employment Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.employmentStatus}
                  onValueChange={(value) =>
                    handleInputChange("employmentStatus", value)
                  }
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.employmentStatus
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employmentStatus && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.employmentStatus}
                  </p>
                )}
              </div>

              {/* Conditional Fields for Employed */}
              {formData.employmentStatus === "employed" && (
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-6 flex items-center">
                    <span>Employment Details</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="employerName"
                        className="text-slate-700 font-medium block"
                      >
                        Employer Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="employerName"
                        value={formData.employerName}
                        onChange={(e) =>
                          handleInputChange("employerName", e.target.value)
                        }
                        placeholder="Enter employer name"
                        className={`h-10 bg-white ${
                          errors.employerName
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                      {errors.employerName && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.employerName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="jobTitle"
                        className="text-slate-700 font-medium block"
                      >
                        Job Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="jobTitle"
                        value={formData.jobTitle}
                        onChange={(e) =>
                          handleInputChange("jobTitle", e.target.value)
                        }
                        placeholder="Enter job title"
                        className={`h-10 bg-white ${
                          errors.jobTitle
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                      {errors.jobTitle && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.jobTitle}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <AddressAutocomplete
                        id="employerAddress"
                        label="Employer Address"
                        required={true}
                        value={formData.employerAddress}
                        onChange={(value) =>
                          handleInputChange("employerAddress", value)
                        }
                        placeholder="Enter employer address"
                        useTextarea={true}
                        rows={3}
                        error={errors.employerAddress}
                        className={`bg-white ${
                          errors.employerAddress
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="monthlyIncome"
                        className="text-slate-700 font-medium block"
                      >
                        Monthly Income (₦){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                          ₦
                        </span>
                        <Input
                          id="monthlyIncome"
                          value={formData.monthlyIncome}
                          onChange={(e) =>
                            handleInputChange("monthlyIncome", e.target.value)
                          }
                          placeholder="0"
                          className={`h-10 pl-8 bg-white ${
                            errors.monthlyIncome
                              ? "border-red-300 focus:border-red-500"
                              : "border-slate-300"
                          }`}
                        />
                      </div>
                      {errors.monthlyIncome && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.monthlyIncome}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="workEmail"
                        className="text-slate-700 font-medium block"
                      >
                        Work Email (Optional)
                      </Label>
                      <Input
                        id="workEmail"
                        type="email"
                        value={formData.workEmail}
                        onChange={(e) =>
                          handleInputChange("workEmail", e.target.value)
                        }
                        placeholder="work.email@company.com"
                        className="h-10 bg-white border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields for Self-employed */}
              {formData.employmentStatus === "self-employed" && (
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-6 flex items-center">
                    <span>Business Details</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="businessName"
                        className="text-slate-700 font-medium block"
                      >
                        Business Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) =>
                          handleInputChange("businessName", e.target.value)
                        }
                        placeholder="Enter business name"
                        className={`h-10 bg-white ${
                          errors.businessName
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                      {errors.businessName && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.businessName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="natureOfBusiness"
                        className="text-slate-700 font-medium block"
                      >
                        Nature of Business{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="natureOfBusiness"
                        value={formData.natureOfBusiness}
                        onChange={(e) =>
                          handleInputChange("natureOfBusiness", e.target.value)
                        }
                        placeholder="Enter nature of business"
                        className={`h-10 bg-white ${
                          errors.natureOfBusiness
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                      {errors.natureOfBusiness && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.natureOfBusiness}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <AddressAutocomplete
                        id="businessAddress"
                        label="Business Address"
                        required={true}
                        value={formData.businessAddress}
                        onChange={(value) =>
                          handleInputChange("businessAddress", value)
                        }
                        placeholder="Enter business address"
                        useTextarea={true}
                        rows={3}
                        error={errors.businessAddress}
                        className={`bg-white ${
                          errors.businessAddress
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="monthlyIncome"
                        className="text-slate-700 font-medium block"
                      >
                        Monthly Income (₦){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                          ₦
                        </span>
                        <Input
                          id="monthlyIncome"
                          value={formData.monthlyIncome}
                          onChange={(e) =>
                            handleInputChange("monthlyIncome", e.target.value)
                          }
                          placeholder="0"
                          className={`h-10 pl-8 bg-white ${
                            errors.monthlyIncome
                              ? "border-red-300 focus:border-red-500"
                              : "border-slate-300"
                          }`}
                        />
                      </div>
                      {errors.monthlyIncome && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.monthlyIncome}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="businessWebsite"
                        className="text-slate-700 font-medium block"
                      >
                        Business Website (Optional)
                      </Label>
                      <Input
                        id="businessWebsite"
                        value={formData.businessWebsite}
                        onChange={(e) =>
                          handleInputChange("businessWebsite", e.target.value)
                        }
                        placeholder="www.business.com"
                        className="h-10 bg-white border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields for Unemployed */}
              {formData.employmentStatus === "unemployed" && (
                <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-6 flex items-center">
                    <span>Income Details</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="sourceOfFunds"
                        className="text-slate-700 font-medium block"
                      >
                        Source of Funds <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="sourceOfFunds"
                        value={formData.sourceOfFunds}
                        onChange={(e) =>
                          handleInputChange("sourceOfFunds", e.target.value)
                        }
                        placeholder="Enter source of funds"
                        className={`h-10 bg-white ${
                          errors.sourceOfFunds
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                      {errors.sourceOfFunds && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.sourceOfFunds}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="monthlyIncomeEstimate"
                        className="text-slate-700 font-medium block"
                      >
                        Monthly Income Estimate (₦){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                          ₦
                        </span>
                        <Input
                          id="monthlyIncomeEstimate"
                          value={formData.monthlyIncomeEstimate}
                          onChange={(e) =>
                            handleInputChange(
                              "monthlyIncomeEstimate",
                              e.target.value
                            )
                          }
                          placeholder="0"
                          className={`h-10 pl-8 bg-white ${
                            errors.monthlyIncomeEstimate
                              ? "border-red-300 focus:border-red-500"
                              : "border-slate-300"
                          }`}
                        />
                      </div>
                      {errors.monthlyIncomeEstimate && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.monthlyIncomeEstimate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 3: Marital & Family Information */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-slate-900">Marital & Family Information</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="maritalStatus"
                  className="text-slate-700 font-medium block"
                >
                  Marital Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.maritalStatus}
                  onValueChange={(value) =>
                    handleInputChange("maritalStatus", value)
                  }
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.maritalStatus
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.maritalStatus && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.maritalStatus}
                  </p>
                )}
              </div>

              {/* Conditional Fields for Married */}
              {formData.maritalStatus === "married" && (
                <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-6 flex items-center">
                    <span>Spouse Information</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="spouseName"
                        className="text-slate-700 font-medium block"
                      >
                        Spouse Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="spouseName"
                        value={formData.spouseName}
                        onChange={(e) =>
                          handleInputChange("spouseName", e.target.value)
                        }
                        placeholder="Enter spouse full name"
                        className={`h-10 bg-white ${
                          errors.spouseName
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                      {errors.spouseName && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.spouseName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="spousePhone"
                        className="text-slate-700 font-medium block"
                      >
                        Spouse Phone Number{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="spousePhone"
                        value={formData.spousePhone}
                        onChange={(e) =>
                          handleInputChange("spousePhone", e.target.value)
                        }
                        placeholder="+234 xxx xxx xxxx"
                        className={`h-10 bg-white ${
                          errors.spousePhone
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                      {errors.spousePhone && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.spousePhone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="spouseOccupation"
                        className="text-slate-700 font-medium block"
                      >
                        Spouse Occupation{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="spouseOccupation"
                        value={formData.spouseOccupation}
                        onChange={(e) =>
                          handleInputChange("spouseOccupation", e.target.value)
                        }
                        placeholder="Enter spouse occupation"
                        className={`h-10 bg-white ${
                          errors.spouseOccupation
                            ? "border-red-300 focus:border-red-500"
                            : "border-slate-300"
                        }`}
                      />
                      {errors.spouseOccupation && (
                        <p className="text-sm text-red-600 flex items-center mt-1">
                          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                          {errors.spouseOccupation}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="spouseEmployer"
                        className="text-slate-700 font-medium block"
                      >
                        Spouse Employer (Optional)
                      </Label>
                      <Input
                        id="spouseEmployer"
                        value={formData.spouseEmployer}
                        onChange={(e) =>
                          handleInputChange("spouseEmployer", e.target.value)
                        }
                        placeholder="Enter spouse employer"
                        className="h-10 bg-white border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 4: Tenancy Details */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-slate-900">Tenancy Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="property"
                  className="text-slate-700 font-medium block"
                >
                  Property <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.property}
                  onValueChange={(value) =>
                    handleInputChange("property", value)
                  }
                >
                  <SelectTrigger
                    className={`h-10 ${
                      errors.property
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property: any) => (
                      <SelectItem key={property.id} value={property.name}>
                        <div>
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-gray-500">
                            {property.location}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.property && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.property}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="rentAmount"
                  className="text-slate-700 font-medium block"
                >
                  Rent Amount (₦) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                    ₦
                  </span>
                  <Input
                    id="rentAmount"
                    value={formData.rentAmount}
                    onChange={(e) =>
                      handleInputChange("rentAmount", e.target.value)
                    }
                    placeholder="0"
                    className={`h-10 pl-8 ${
                      errors.rentAmount
                        ? "border-red-300 focus:border-red-500"
                        : "border-slate-300"
                    }`}
                  />
                </div>
                {errors.rentAmount && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.rentAmount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tenancyStartDate"
                  className="text-slate-700 font-medium block"
                >
                  Tenancy Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenancyStartDate"
                  type="date"
                  value={formData.tenancyStartDate}
                  onChange={(e) =>
                    handleInputChange("tenancyStartDate", e.target.value)
                  }
                  className={`h-10 ${
                    errors.tenancyStartDate
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.tenancyStartDate && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.tenancyStartDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tenancyEndDate"
                  className="text-slate-700 font-medium block"
                >
                  Tenancy End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenancyEndDate"
                  type="date"
                  value={formData.tenancyEndDate}
                  onChange={(e) =>
                    handleInputChange("tenancyEndDate", e.target.value)
                  }
                  className={`h-10 ${
                    errors.tenancyEndDate
                      ? "border-red-300 focus:border-red-500"
                      : "border-slate-300"
                  }`}
                />
                {errors.tenancyEndDate && (
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {errors.tenancyEndDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 5: Declaration */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-slate-900">Declaration</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  I hereby declare that all the information provided in this
                  form is true, complete, and accurate to the best of my
                  knowledge. I understand that any false information may result
                  in the rejection of my tenancy application or termination of
                  tenancy agreement.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="declarationAccepted"
                  checked={formData.declarationAccepted}
                  onCheckedChange={(checked) =>
                    handleInputChange("declarationAccepted", !!checked)
                  }
                  className={errors.declarationAccepted ? "border-red-300" : ""}
                />
                <Label
                  htmlFor="declarationAccepted"
                  className="text-slate-700 font-medium"
                >
                  I accept the declaration above{" "}
                  <span className="text-red-500">*</span>
                </Label>
              </div>
              {errors.declarationAccepted && (
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.declarationAccepted}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-6 border-t border-slate-200">
          <Button
            onClick={handleSaveChanges}
            className="gradient-primary text-white px-8"
            disabled={!hasUnsavedChanges || createKYCMutation.isPending}
          >
            {createKYCMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
