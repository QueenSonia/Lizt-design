/**
 * EmploymentDetailsStep Component
 * Form fields for employment information
 * Requirements: 1.1, 1.2, 2.1
 */

import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormStepProps } from "../../types";
import { FormValidator } from "../../utils/form-validator";
import AddressAutocomplete from "@/components/AddressAutoComplete";

const EmploymentDetailsStep: React.FC<FormStepProps> = ({
  formData,
  onDataChange,
  errors,
  onValidationChange,
  isFieldTouched,
}) => {
  // Validate step whenever form data changes
  useEffect(() => {
    const validation = FormValidator.validateStep(2, formData);
    onValidationChange(validation.isValid);
  }, [formData, onValidationChange]);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    onDataChange({ [field]: value });
  };

  // Helper to check if error should be shown (only if field is touched)
  const shouldShowError = (field: string) => {
    // Only show error if the field has been explicitly touched (user tried to navigate)
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

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-5">
          Employment Information
        </h3>
        <div className="space-y-5">
          {/* Employment Status */}
          <div>
            <Label htmlFor="employment_status">Employment Status</Label>
            <Select
              value={formData.employment_status || ""}
              onValueChange={(value) =>
                handleInputChange("employment_status", value)
              }
            >
              <SelectTrigger
                className={`mt-1.5 ${
                  shouldShowError("employment_status") ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select employment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self-employed">Self-Employed</SelectItem>
                {/* <SelectItem value="unemployed">Unemployed</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="retired">Retired</SelectItem> */}
              </SelectContent>
            </Select>
            {shouldShowError("employment_status") && (
              <p className="text-sm text-red-600 mt-1">
                {errors.employment_status}
              </p>
            )}
          </div>

          {/* Employed Fields */}
          {formData.employment_status === "employed" && (
            <>
              <div>
                <Label htmlFor="employer_name">Employer Name</Label>
                <Input
                  id="employer_name"
                  value={formData.employer_name || ""}
                  onChange={(e) =>
                    handleInputChange("employer_name", e.target.value)
                  }
                  placeholder="Enter employer name"
                  className={`mt-1.5 ${
                    shouldShowError("employer_name") ? "border-red-500" : ""
                  }`}
                />
                {shouldShowError("employer_name") && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.employer_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title || ""}
                  onChange={(e) =>
                    handleInputChange("job_title", e.target.value)
                  }
                  placeholder="Enter job title"
                  className={`mt-1.5 ${
                    shouldShowError("job_title") ? "border-red-500" : ""
                  }`}
                />
                {shouldShowError("job_title") && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.job_title}
                  </p>
                )}
              </div>

              <div>
                <AddressAutocomplete
                  id="work_address"
                  label="Work Address"
                  value={formData.work_address || ""}
                  onChange={(value) => handleInputChange("work_address", value)}
                  placeholder="Enter work address"
                  useTextarea={false}
                  error={
                    shouldShowError("work_address")
                      ? errors.work_address
                      : undefined
                  }
                  className={`mt-1.5 ${
                    shouldShowError("work_address") ? "border-red-500" : ""
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work_phone_number">Work Phone Number</Label>
                  <Input
                    id="work_phone_number"
                    type="tel"
                    value={formData.work_phone_number || ""}
                    onChange={(e) =>
                      handleInputChange("work_phone_number", e.target.value)
                    }
                    placeholder="+234 XXX XXX XXXX"
                    className={`mt-1.5 ${
                      shouldShowError("work_phone_number")
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {shouldShowError("work_phone_number") && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.work_phone_number}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="length_of_employment">
                    Length of Employment
                  </Label>
                  <Input
                    id="length_of_employment"
                    value={formData.length_of_employment || ""}
                    onChange={(e) =>
                      handleInputChange("length_of_employment", e.target.value)
                    }
                    placeholder="e.g., 2 years"
                    className={`mt-1.5 ${
                      shouldShowError("length_of_employment")
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {shouldShowError("length_of_employment") && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.length_of_employment}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="monthly_net_income">Monthly Income (₦)</Label>
                <Input
                  id="monthly_net_income"
                  value={formData.monthly_net_income || ""}
                  onChange={(e) =>
                    handleMoneyInput("monthly_net_income", e.target.value)
                  }
                  placeholder="Enter monthly income"
                  className={`mt-1.5 ${
                    shouldShowError("monthly_net_income")
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {shouldShowError("monthly_net_income") && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.monthly_net_income}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Self-Employed Fields */}
          {formData.employment_status === "self-employed" && (
            <>
              <div>
                <Label htmlFor="nature_of_business">Nature of Business</Label>
                <Input
                  id="nature_of_business"
                  value={formData.nature_of_business || ""}
                  onChange={(e) =>
                    handleInputChange("nature_of_business", e.target.value)
                  }
                  placeholder="e.g., Retail, Consulting"
                  className={`mt-1.5 ${
                    shouldShowError("nature_of_business")
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {shouldShowError("nature_of_business") && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.nature_of_business}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={formData.business_name || ""}
                  onChange={(e) =>
                    handleInputChange("business_name", e.target.value)
                  }
                  placeholder="Enter business name"
                  className={`mt-1.5 ${
                    shouldShowError("business_name") ? "border-red-500" : ""
                  }`}
                />
                {shouldShowError("business_name") && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.business_name}
                  </p>
                )}
              </div>

              <div>
                <AddressAutocomplete
                  id="business_address"
                  label="Business Address"
                  value={formData.business_address || ""}
                  onChange={(value) =>
                    handleInputChange("business_address", value)
                  }
                  placeholder="Enter business address"
                  useTextarea={false}
                  error={
                    shouldShowError("business_address")
                      ? errors.business_address
                      : undefined
                  }
                  className={`mt-1.5 ${
                    shouldShowError("business_address") ? "border-red-500" : ""
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_duration">Business Duration</Label>
                  <Input
                    id="business_duration"
                    value={formData.business_duration || ""}
                    onChange={(e) =>
                      handleInputChange("business_duration", e.target.value)
                    }
                    placeholder="e.g., 3 years"
                    className={`mt-1.5 ${
                      shouldShowError("business_duration")
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {shouldShowError("business_duration") && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.business_duration}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="estimated_monthly_income">
                    Estimated Monthly Income (₦)
                  </Label>
                  <Input
                    id="estimated_monthly_income"
                    value={formData.estimated_monthly_income || ""}
                    onChange={(e) =>
                      handleMoneyInput(
                        "estimated_monthly_income",
                        e.target.value
                      )
                    }
                    placeholder="Enter monthly income"
                    className={`mt-1.5 ${
                      shouldShowError("estimated_monthly_income")
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {shouldShowError("estimated_monthly_income") && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.estimated_monthly_income}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmploymentDetailsStep;
