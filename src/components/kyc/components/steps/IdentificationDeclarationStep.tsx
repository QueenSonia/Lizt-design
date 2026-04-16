/**
 * IdentificationDeclarationStep Component
 * Document uploads and declaration acceptance
 * Requirements: 2.2, 2.3, 2.4, 2.5, 3.1, 3.2
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ModernFileUpload } from "../ModernFileUpload";
import { FormStepProps } from "../../types";
import { FormValidator } from "../../utils/form-validator";
import { BRAND_COLOR } from "../../constants/theme";
import { CloudinaryUploadService } from "../../services/cloudinary.service";

const IdentificationDeclarationStep: React.FC<FormStepProps> = ({
  formData,
  onDataChange,
  errors,
  onValidationChange,
  isFieldTouched,
  isReturningApplicant = false,
  onUploadingChange,
}) => {
  const [uploadStatus, setUploadStatus] = useState<{
    isUploading: boolean;
    error: string | null;
  }>({
    isUploading: false,
    error: null,
  });

  // Track number of active uploads to know when all are done
  const activeUploadsRef = useRef(0);
  const handleUploadingChange = useCallback(
    (isUploading: boolean) => {
      activeUploadsRef.current += isUploading ? 1 : -1;
      onUploadingChange?.(activeUploadsRef.current > 0);
    },
    [onUploadingChange],
  );

  // Cloudinary configuration
  const cloudinaryConfig = CloudinaryUploadService.getConfig();

  // Validate step whenever form data changes
  useEffect(() => {
    const validation = FormValidator.validateStep(4, formData);
    onValidationChange(validation.isValid);
  }, [formData, onValidationChange]);

  // Helper to check if error should be shown (only if field is touched)
  const shouldShowError = (field: string) => {
    // Only show error if the field has been explicitly touched (user tried to navigate)
    return isFieldTouched(field) && !!errors[field];
  };

  // Handle file upload
  const handleFileUpload = (field: string, file: File | null) => {
    onDataChange({ [field]: file });
    if (file) {
      setUploadStatus({ isUploading: false, error: null });
    }
  };

  // Handle upload completion (Cloudinary URL)
  const handleUploadComplete = (field: string, url: string) => {
    console.log(`✅ Document uploaded successfully:`, { field, url });
    onDataChange({ [`${field}_url`]: url });
  };

  // Handle upload error
  const handleUploadError = (error: { message: string; code?: string }) => {
    setUploadStatus({ isUploading: false, error: error.message });
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    onDataChange({ declaration_accepted: checked });
  };

  return (
    <div className="space-y-6">
      {/* Document Uploads Section */}
      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">
          Document Uploads
        </h3>
        <div className="space-y-6">
          {/* Passport Photo Upload */}
          <div>
            {isReturningApplicant && formData.passport_photo_url && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  ✓ You have a previously uploaded photo. Upload a new one to
                  replace it, or leave as-is.
                </p>
              </div>
            )}
            <ModernFileUpload
              label="Passport Photograph"
              description="Upload a recent passport-size photograph (JPG, PNG - Max 5MB)"
              accept="image/*"
              file={formData.passport_photo}
              onChange={(file) => handleFileUpload("passport_photo", file)}
              cloudinaryConfig={cloudinaryConfig}
              onUploadComplete={(url) =>
                handleUploadComplete("passport_photo", url)
              }
              onUploadError={handleUploadError}
              onUploadingChange={handleUploadingChange}
            />
            {shouldShowError("passport_photo") && (
              <p className="text-sm text-red-600">{errors.passport_photo}</p>
            )}
          </div>

          {/* ID Document Upload */}
          <div>
            {isReturningApplicant && formData.id_document_url && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  ✓ You have a previously uploaded ID document. Upload a new one
                  to replace it, or leave as-is.
                </p>
              </div>
            )}
            <ModernFileUpload
              label="Means of Identification"
              description="Upload valid ID (National ID, Driver's License, Voter's Card, Int'l Passport - PDF or Image)"
              accept="image/*,.pdf"
              file={formData.id_document}
              onChange={(file) => handleFileUpload("id_document", file)}
              cloudinaryConfig={cloudinaryConfig}
              onUploadComplete={(url) =>
                handleUploadComplete("id_document", url)
              }
              onUploadError={handleUploadError}
              onUploadingChange={handleUploadingChange}
            />
            {shouldShowError("id_document") && (
              <p className="text-sm text-red-600">{errors.id_document}</p>
            )}
          </div>

          {formData.employment_status === "employed" && (
            <div>
              {isReturningApplicant && formData.employment_proof_url && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ You have a previously uploaded employment proof. Upload a
                    new one to replace it, or leave as-is.
                  </p>
                </div>
              )}
              <ModernFileUpload
                label="Proof of Employment"
                description="Upload employment letter or recent payslip (PDF or Image)"
                accept="image/*,.pdf"
                file={formData.employment_proof}
                onChange={(file) => handleFileUpload("employment_proof", file)}
                cloudinaryConfig={cloudinaryConfig}
                onUploadComplete={(url) =>
                  handleUploadComplete("employment_proof", url)
                }
                onUploadError={handleUploadError}
                onUploadingChange={handleUploadingChange}
              />
              {shouldShowError("employment_proof") && (
                <p className="text-sm text-red-600">
                  {errors.employment_proof}
                </p>
              )}
            </div>
          )}

          {formData.employment_status === "self-employed" && (
            <div>
              {isReturningApplicant && formData.business_proof_url && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ You have a previously uploaded business proof. Upload a
                    new one to replace it, or leave as-is.
                  </p>
                </div>
              )}
              <ModernFileUpload
                label="Proof of Business"
                description="e.g., CAC certificate, business registration document, social media profile screenshot, or utility bill with business name"
                accept="image/*,.pdf"
                file={formData.business_proof}
                onChange={(file) => handleFileUpload("business_proof", file)}
                cloudinaryConfig={cloudinaryConfig}
                onUploadComplete={(url) =>
                  handleUploadComplete("business_proof", url)
                }
                onUploadError={handleUploadError}
                onUploadingChange={handleUploadingChange}
              />
              {shouldShowError("business_proof") && (
                <p className="text-sm text-red-600">{errors.business_proof}</p>
              )}
            </div>
          )}

          {/* Display upload errors */}
          {uploadStatus.error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{uploadStatus.error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Declaration Section */}
      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">
          Declaration
        </h3>
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="text-sm text-gray-700 space-y-3">
            <p>I hereby declare that:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                All information provided in this application is true and
                accurate to the best of my knowledge
              </li>
              <li>
                I understand that any false information may result in immediate
                termination of the tenancy agreement
              </li>
              <li>
                I consent to Property Kraft conducting background checks and
                verifying the information provided
              </li>
              <li>
                I agree to abide by all terms and conditions of the tenancy
                agreement
              </li>
              <li>
                I will use the property solely for the intended purpose stated
                in this application
              </li>
            </ul>
          </div>
          <div className="flex items-start gap-3 pt-4">
            <Checkbox
              id="declaration"
              checked={formData.declaration_accepted || false}
              onCheckedChange={handleCheckboxChange}
            />
            <Label
              htmlFor="declaration"
              className="cursor-pointer leading-relaxed"
            >
              I have read and agree to the above declaration{" "}
              <span style={{ color: BRAND_COLOR }}>*</span>
            </Label>
          </div>
          {shouldShowError("declaration_accepted") && (
            <p className="text-sm text-red-600">
              {errors.declaration_accepted}
            </p>
          )}
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
        <p className="text-sm text-gray-900">
          <strong>📋 Note:</strong> By submitting this application, you
          acknowledge that Property Kraft may contact your references, verify
          your employment, and conduct necessary background checks. Your
          information will be kept confidential and used solely for tenancy
          processing.
        </p>
      </div>
    </div>
  );
};

export default IdentificationDeclarationStep;
