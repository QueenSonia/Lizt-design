/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Form validation utility class for KYC form
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { FormData, StepValidation } from "../types";
import { VALIDATION_RULES, ERROR_MESSAGES } from "../constants";

export class FormValidator {
  /**
   * Validate a specific step of the form
   */
  static validateStep(step: number, formData: FormData): StepValidation {
    switch (step) {
      case 1:
        return this.validatePersonalDetails(formData);
      case 2:
        return this.validateEmploymentDetails(formData);
      case 3:
        return this.validateTenancyInformation(formData);
      case 4:
        return this.validateIdentificationDeclaration(formData);
      default:
        return { isValid: false, errors: { general: "Invalid step number" } };
    }
  }

  /**
   * Validate personal details (Step 1)
   */
  static validatePersonalDetails(data: Partial<FormData>): StepValidation {
    const errors: Record<string, string> = {};

    // Required fields validation
    const requiredFields = VALIDATION_RULES.REQUIRED_FIELDS.STEP_1;
    requiredFields.forEach((field) => {
      const value = data[field as keyof FormData];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors[field] = ERROR_MESSAGES.REQUIRED;
      }
    });

    // Name validation
    if (
      data.last_name &&
      !VALIDATION_RULES.PATTERNS.name.test(data.last_name)
    ) {
      errors.last_name = ERROR_MESSAGES.INVALID_NAME;
    }
    if (
      data.first_name &&
      !VALIDATION_RULES.PATTERNS.name.test(data.first_name)
    ) {
      errors.first_name = ERROR_MESSAGES.INVALID_NAME;
    }

    // Email validation
    if (data.email && !VALIDATION_RULES.PATTERNS.email.test(data.email)) {
      errors.email = ERROR_MESSAGES.INVALID_EMAIL;
    }

    // Phone validation
    if (
      data.phone_number &&
      !VALIDATION_RULES.PATTERNS.phone.test(data.phone_number)
    ) {
      errors.phone_number = ERROR_MESSAGES.INVALID_PHONE;
    }

    // Age validation
    if (data.date_of_birth) {
      const birthDate = new Date(data.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge =
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ? age - 1
          : age;

      if (actualAge < VALIDATION_RULES.MIN_AGE) {
        errors.date_of_birth = ERROR_MESSAGES.AGE_TOO_YOUNG;
      } else if (actualAge > VALIDATION_RULES.MAX_AGE) {
        errors.date_of_birth = ERROR_MESSAGES.AGE_TOO_OLD;
      }
    }

    // Length validation
    Object.entries(VALIDATION_RULES.MIN_LENGTH).forEach(
      ([field, minLength]) => {
        const value = data[field as keyof FormData] as string;
        if (value && value.length < minLength) {
          errors[field] = ERROR_MESSAGES.MIN_LENGTH(field, minLength);
        }
      }
    );

    Object.entries(VALIDATION_RULES.MAX_LENGTH).forEach(
      ([field, maxLength]) => {
        const value = data[field as keyof FormData] as string;
        if (value && value.length > maxLength) {
          errors[field] = ERROR_MESSAGES.MAX_LENGTH(field, maxLength);
        }
      }
    );

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate employment details (Step 2)
   */
  static validateEmploymentDetails(data: Partial<FormData>): StepValidation {
    const errors: Record<string, string> = {};

    // Employment status is required
    if (!data.employment_status || data.employment_status.trim() === "") {
      errors.employment_status = ERROR_MESSAGES.REQUIRED;
      return { isValid: false, errors };
    }

    // Validate based on employment status
    if (data.employment_status === "employed") {
      const employedFields = [
        "employer_name",
        "job_title",
        "work_address",
        "work_phone_number",
        "monthly_net_income",
        "length_of_employment",
      ];
      employedFields.forEach((field) => {
        const value = data[field as keyof FormData];
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors[field] = ERROR_MESSAGES.REQUIRED;
        }
      });

      // Phone validation for work phone
      if (
        data.work_phone_number &&
        !VALIDATION_RULES.PATTERNS.phone.test(data.work_phone_number)
      ) {
        errors.work_phone_number = ERROR_MESSAGES.INVALID_PHONE;
      }
    } else if (data.employment_status === "self-employed") {
      const selfEmployedFields = [
        "nature_of_business",
        "business_name",
        "business_address",
        "business_duration",
        "estimated_monthly_income",
      ];
      selfEmployedFields.forEach((field) => {
        const value = data[field as keyof FormData];
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors[field] = ERROR_MESSAGES.REQUIRED;
        }
      });
    }
    // For unemployed, student, and retired - no additional fields required

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate tenancy information (Step 3)
   */
  static validateTenancyInformation(data: Partial<FormData>): StepValidation {
    const errors: Record<string, string> = {};

    // Property selection is required
    if (
      !data.property_applying_for ||
      data.property_applying_for.trim() === ""
    ) {
      errors.property_applying_for = ERROR_MESSAGES.REQUIRED;
    }

    // Required tenancy fields
    const requiredFields = [
      "intended_use_of_property",
      "number_of_occupants",
      "proposed_rent_amount",
      "rent_payment_frequency",
    ];

    requiredFields.forEach((field) => {
      const value = data[field as keyof FormData];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors[field] = ERROR_MESSAGES.REQUIRED;
      }
    });

    // Validate proposed rent amount is a positive number
    if (data.proposed_rent_amount) {
      const cleanAmount = data.proposed_rent_amount.replace(/,/g, "");
      const amount = parseFloat(cleanAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.proposed_rent_amount = "Please enter a valid rent amount";
      }
    }

    // Validate number of occupants is a positive number
    if (data.number_of_occupants) {
      const occupants = parseInt(data.number_of_occupants);
      if (isNaN(occupants) || occupants <= 0) {
        errors.number_of_occupants = "Please enter a valid number of occupants";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate identification and declaration (Step 4)
   */
  static validateIdentificationDeclaration(
    data: Partial<FormData>
  ): StepValidation {
    const errors: Record<string, string> = {};

    // Required fields validation
    const requiredFields = VALIDATION_RULES.REQUIRED_FIELDS.STEP_4;
    requiredFields.forEach((field) => {
      const value = data[field as keyof FormData];
      if (field === "declaration_accepted") {
        if (!value) {
          errors[field] = ERROR_MESSAGES.DECLARATION_REQUIRED;
        }
      } else if (field === "passport_photo") {
        // Check if either file or URL exists
        const file = (data as any).passport_photo;
        if (!file && !data.passport_photo_url) {
          errors[field] = ERROR_MESSAGES.REQUIRED;
        }
      } else if (field === "id_document") {
        // Check if either file or URL exists
        const file = (data as any).id_document;
        if (!file && !data.id_document_url) {
          errors[field] = ERROR_MESSAGES.REQUIRED;
        }
      } else if (field === "employment_proof") {
        // Only required for employed people, check if either file or URL exists
        if (data.employment_status === "employed") {
          const file = (data as any).employment_proof;
          if (!file && !data.employment_proof_url) {
            errors[field] = ERROR_MESSAGES.REQUIRED;
          }
        }
      } else if (field === "business_proof") {
        // Only required for self-employed people, check if either file or URL exists
        if (data.employment_status === "self-employed") {
          const file = (data as any).business_proof;
          if (!file && !data.business_proof_url) {
            errors[field] = ERROR_MESSAGES.REQUIRED;
          }
        }
      } else if (!value) {
        errors[field] = ERROR_MESSAGES.REQUIRED;
      }
    });

    // File type and size validation for uploaded documents
    if ((data as any).id_document) {
      const file = (data as any).id_document;
      if (file.size > VALIDATION_RULES.FILE_UPLOAD.MAX_SIZE) {
        errors.id_document = ERROR_MESSAGES.FILE_TOO_LARGE;
      }
      if (
        !VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES.idDocument.includes(
          file.type
        )
      ) {
        errors.id_document = ERROR_MESSAGES.INVALID_FILE_TYPE;
      }
    }

    if ((data as any).passport_photo) {
      const file = (data as any).passport_photo;
      if (file.size > VALIDATION_RULES.FILE_UPLOAD.MAX_SIZE) {
        errors.passport_photo = ERROR_MESSAGES.FILE_TOO_LARGE;
      }
      if (
        !VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES.passport.includes(file.type)
      ) {
        errors.passport_photo = ERROR_MESSAGES.INVALID_FILE_TYPE;
      }
    }

    if ((data as any).employment_proof) {
      const file = (data as any).employment_proof;
      if (file.size > VALIDATION_RULES.FILE_UPLOAD.MAX_SIZE) {
        errors.employment_proof = ERROR_MESSAGES.FILE_TOO_LARGE;
      }
      if (
        !VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES.idDocument.includes(
          file.type
        )
      ) {
        errors.employment_proof = ERROR_MESSAGES.INVALID_FILE_TYPE;
      }
    }

    if ((data as any).business_proof) {
      const file = (data as any).business_proof;
      if (file.size > VALIDATION_RULES.FILE_UPLOAD.MAX_SIZE) {
        errors.business_proof = ERROR_MESSAGES.FILE_TOO_LARGE;
      }
      if (
        !VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES.idDocument.includes(
          file.type
        )
      ) {
        errors.business_proof = ERROR_MESSAGES.INVALID_FILE_TYPE;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Legacy validation methods (kept for backward compatibility)
   */
  static validateProfessionalInfo(data: Partial<FormData>): StepValidation {
    return this.validateEmploymentDetails(data);
  }

  static validateDocuments(data: Partial<FormData>): StepValidation {
    const errors: Record<string, string> = {};

    // Check if we have either a file upload OR an existing document URL
    const hasIdDocument =
      (data as any).id_document ||
      (data.id_document_url && data.id_document_url.trim());

    if (!hasIdDocument) {
      errors.id_document = "ID document is required";
    }

    // If there's a file upload, validate it
    if ((data as any).idDocument) {
      const file = (data as any).idDocument;
      if (file.size > VALIDATION_RULES.FILE_UPLOAD.MAX_SIZE) {
        errors.idDocument = ERROR_MESSAGES.FILE_TOO_LARGE;
      }
      if (
        !VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES.idDocument.includes(
          file.type
        )
      ) {
        errors.idDocument = ERROR_MESSAGES.INVALID_FILE_TYPE;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateReferences(data: Partial<FormData>): StepValidation {
    const errors: Record<string, string> = {};
    if (
      data.next_of_kin_email &&
      !VALIDATION_RULES.PATTERNS.email.test(data.next_of_kin_email)
    ) {
      errors.next_of_kin_email = ERROR_MESSAGES.INVALID_EMAIL;
    }
    if (
      data.next_of_kin_phone_number &&
      !VALIDATION_RULES.PATTERNS.phone.test(data.next_of_kin_phone_number)
    ) {
      errors.next_of_kin_phone_number = ERROR_MESSAGES.INVALID_PHONE;
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  static validateDeclaration(data: Partial<FormData>): StepValidation {
    const errors: Record<string, string> = {};
    if (!data.declaration_accepted) {
      errors.declarationAccepted = ERROR_MESSAGES.DECLARATION_REQUIRED;
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate file upload
   */
  static validateFile(
    file: File,
    type: "passport" | "idDocument"
  ): { isValid: boolean; error?: string } {
    // File size validation
    if (file.size > VALIDATION_RULES.FILE_UPLOAD.MAX_SIZE) {
      return { isValid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
    }

    // File type validation
    const allowedTypes = VALIDATION_RULES.FILE_UPLOAD.ALLOWED_TYPES[type];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
    }

    return { isValid: true };
  }
}
