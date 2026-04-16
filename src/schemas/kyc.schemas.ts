import { z } from "zod";

// Enums matching backend
export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export enum MaritalStatus {
  SINGLE = "single",
  MARRIED = "married",
  DIVORCED = "divorced",
  WIDOWED = "widowed",
}

export enum EmploymentStatus {
  EMPLOYED = "employed",
  SELF_EMPLOYED = "self-employed",
}

export enum Religion {
  CHRISTIANITY = "Christianity",
  ISLAM = "Islam",
  TRADITIONAL = "Traditional",
  OTHER = "Other",
}

// Enhanced validation helpers
const nameValidation = z
  .string()
  .min(1, "This field is required")
  .min(2, "Must be at least 2 characters long")
  .max(50, "Must be no more than 50 characters long")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Can only contain letters, spaces, hyphens, and apostrophes"
  )
  .transform((val) => val.trim());

const phoneValidation = z
  .string()
  .min(1, "Phone number is required")
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number is too long")
  .regex(
    /^[\+]?[\d\s\-\(\)]{10,15}$/,
    "Please enter a valid phone number format"
  )
  .transform((val) => val.trim());

const emailValidation = z
  .string()
  .min(1, "Email address is required")
  .email("Please enter a valid email address (e.g., user@example.com)")
  .max(254, "Email address is too long")
  .transform((val) => val.trim().toLowerCase())
  .refine((email) => {
    // Check for common domain typos
    const commonTypos = [
      { typo: "@gmail.co", correct: "@gmail.com" },
      { typo: "@yahoo.co", correct: "@yahoo.com" },
      { typo: "@hotmail.co", correct: "@hotmail.com" },
      { typo: "@outlook.co", correct: "@outlook.com" },
    ];

    const hasTypo = commonTypos.some(({ typo }) => email.includes(typo));
    return !hasTypo;
  }, "Please check your email domain (did you mean .com?)");

const dateOfBirthValidation = z
  .string()
  .min(1, "Date of birth is required")
  .refine((date) => {
    const birthDate = new Date(date);
    return !isNaN(birthDate.getTime());
  }, "Please enter a valid date")
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge =
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ? age - 1
        : age;
    return actualAge >= 10;
  }, "You must be at least 10 years old")
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age <= 150;
  }, "Please enter a valid birth date");

const addressValidation = z
  .string()
  .min(1, "Address is required")
  .min(10, "Please provide a complete address")
  .max(200, "Address is too long")
  .transform((val) => val.trim());

const relationshipValidation = z
  .string()
  .min(1, "Relationship is required")
  .min(2, "Please specify the relationship")
  .max(50, "Relationship description is too long")
  .regex(
    /^[a-zA-Z\s'-]+$/,
    "Can only contain letters, spaces, hyphens, and apostrophes"
  )
  .transform((val) => val.trim());

// KYC Form Schema with enhanced validation
export const kycFormSchema = z
  //This data must be an object with these keys, and each key must follow these rules.
  .object({
    // Personal Information
    first_name: nameValidation.refine(
      (val) => val.length >= 2,
      "First name must be at least 2 characters long"
    ),
    last_name: nameValidation.refine(
      (val) => val.length >= 2,
      "Last name must be at least 2 characters long"
    ),
    email: emailValidation,
    contact_address: addressValidation,
    phone_number: phoneValidation,
    date_of_birth: dateOfBirthValidation,
    gender: z.nativeEnum(Gender, {
      required_error: "Please select your gender",
      invalid_type_error: "Please select a valid gender option",
    }),
    nationality: z
      .string()
      .min(1, "Nationality is required")
      .min(2, "Please enter your nationality")
      .max(60, "Nationality is too long")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Can only contain letters, spaces, hyphens, and apostrophes"
      )
      .transform((val) => val.trim()),
    state_of_origin: z
      .string()
      .min(1, "State of origin is required")
      .min(2, "Please enter your state of origin")
      .max(60, "State name is too long")
      .transform((val) => val.trim()),
    marital_status: z.nativeEnum(MaritalStatus, {
      required_error: "Please select your marital status",
      invalid_type_error: "Please select a valid marital status",
    }),
    religion: z.nativeEnum(Religion, {
      required_error: "Please select your religion",
      invalid_type_error: "Please select a valid religion",
    }),

    // Employment Information
    employment_status: z.nativeEnum(EmploymentStatus, {
      required_error: "Please select your employment status",
      invalid_type_error: "Please select a valid employment status",
    }),
    job_title: z
      .string()
      .max(100, "Job title is too long")
      .transform((val) => val?.trim() || "")
      .optional(),
    employer_name: z
      .string()
      .max(100, "Employer name is too long")
      .transform((val) => val?.trim() || "")
      .optional(),
    work_address: z
      .string()
      .max(200, "Work address is too long")
      .transform((val) => val?.trim() || "")
      .optional(),
    work_phone_number: z
      .string()
      .max(15, "Phone number is too long")
      .regex(/^[\+]?[\d\s\-\(\)]*$/, "Please enter a valid phone number format")
      .transform((val) => val?.trim() || "")
      .optional(),
    length_of_employment: z
      .string()
      .max(50, "Length of employment is too long")
      .transform((val) => val?.trim() || "")
      .optional(),
    monthly_net_income: z
      .string()
      .transform((val) => val?.trim() || "")
      .optional(),

    // Self-Employed specific fields
    nature_of_business: z
      .string()
      .max(100, "Nature of business is too long")
      .transform((val) => val?.trim() || "")
      .optional(),
    business_name: z
      .string()
      .max(100, "Business name is too long")
      .transform((val) => val?.trim() || "")
      .optional(),
    business_address: z
      .string()
      .max(200, "Business address is too long")
      .transform((val) => val?.trim() || "")
      .optional(),
    business_duration: z
      .string()
      .max(50, "Business duration is too long")
      .transform((val) => val?.trim() || "")
      .optional(),
    estimated_monthly_income: z
      .string()
      .transform((val) => val?.trim() || "")
      .optional(),

    // Next of Kin
    next_of_kin_full_name: nameValidation.refine(
      (val) => val.length >= 2,
      "Next of kin full name must be at least 2 characters long"
    ),
    next_of_kin_email: emailValidation,
    next_of_kin_phone_number: phoneValidation,
    next_of_kin_address: addressValidation,
    next_of_kin_relationship: relationshipValidation,

    // Referral Agent (Optional)
    referral_agent_full_name: z
      .string()
      .max(50, "Referral agent name is too long")
      .regex(
        /^[a-zA-Z\s'-]*$/,
        "Can only contain letters, spaces, hyphens, and apostrophes"
      )
      .transform((val) => val?.trim() || "")
      .optional(),
    referral_agent_phone_number: z
      .string()
      .max(15, "Phone number is too long")
      .regex(/^[\+]?[\d\s\-\(\)]*$/, "Please enter a valid phone number format")
      .transform((val) => val?.trim() || "")
      .optional(),

    // Tenancy Information
    property_applying_for: z
      .string()
      .min(1, "Property is required")
      .transform((val) => val.trim()),
    selected_rent_range: z
      .string()
      .min(1, "Rent range is required")
      .transform((val) => val.trim()),
    tenant_type: z
      .string()
      .min(1, "Tenant type is required")
      .transform((val) => val.trim()),
    intended_use_of_property: z
      .string()
      .min(1, "Intended use of property is required")
      .min(2, "Please specify the intended use")
      .max(200, "Intended use description is too long")
      .transform((val) => val.trim()),
    number_of_occupants: z
      .string()
      .min(1, "Number of occupants is required")
      .refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num > 0 && num <= 50;
      }, "Please enter a valid number of occupants (1-50)")
      .transform((val) => val.trim()),
    parking_needs: z
      .string()
      .min(1, "Parking needs is required")
      .transform((val) => val.trim()),
    proposed_rent_amount: z
      .string()
      .min(1, "Proposed rent amount is required")
      .refine((val) => {
        const num = parseFloat(val.replace(/[^\d.]/g, ""));
        return !isNaN(num) && num > 0;
      }, "Please enter a valid rent amount")
      .transform((val) => val.trim()),
    rent_payment_frequency: z
      .string()
      .min(1, "Rent payment frequency is required")
      .transform((val) => val.trim()),
    additional_notes: z
      .string()
      .max(500, "Additional notes are too long")
      .transform((val) => val?.trim() || "")
      .optional(),

    // Identification & Declaration
    passport_photo: z
      .instanceof(File, { message: "Passport photo is required" })
      .refine((file) => file.size <= 5000000, "File size must be less than 5MB")
      .refine(
        (file) => ["image/jpeg", "image/jpg", "image/png"].includes(file.type),
        "Only JPEG, JPG, and PNG formats are allowed"
      )
      .nullable(),
    id_document: z
      .instanceof(File, { message: "ID document is required" })
      .refine((file) => file.size <= 5000000, "File size must be less than 5MB")
      .refine(
        (file) =>
          ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(
            file.type
          ),
        "Only JPEG, JPG, PNG, and PDF formats are allowed"
      )
      .nullable(),
    employment_proof: z
      .instanceof(File)
      .refine((file) => file.size <= 5000000, "File size must be less than 5MB")
      .refine(
        (file) =>
          ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(
            file.type
          ),
        "Only JPEG, JPG, PNG, and PDF formats are allowed"
      )
      .nullable()
      .optional(),
    business_proof: z
      .instanceof(File)
      .refine((file) => file.size <= 5000000, "File size must be less than 5MB")
      .refine(
        (file) =>
          ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(
            file.type
          ),
        "Only JPEG, JPG, PNG, and PDF formats are allowed"
      )
      .nullable()
      .optional(),
    declaration_accepted: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must accept the declaration to proceed"
      ),

    // UI-only fields for tracking uploaded document URLs (not validated, just typed)
    passport_photo_url: z.string().optional(),
    id_document_url: z.string().optional(),
    employment_proof_url: z.string().optional(),
    business_proof_url: z.string().optional(),

    // Pending KYC metadata (for property filtering)
    pending_kyc_id: z.string().optional(),
    available_property_ids: z.string().optional(), // Comma-separated list of property IDs
  })
  .refine(
    (data) => {
      // Passport photo is required
      return data.passport_photo !== null;
    },
    {
      message: "Passport photo is required",
      path: ["passport_photo"],
    }
  )
  .refine(
    (data) => {
      // ID document is required
      return data.id_document !== null;
    },
    {
      message: "ID document is required",
      path: ["id_document"],
    }
  )
  .refine(
    (data) => {
      // If employment status is employed, employment proof is required
      if (data.employment_status === EmploymentStatus.EMPLOYED) {
        return (
          data.employment_proof !== null && data.employment_proof !== undefined
        );
      }
      return true;
    },
    {
      message:
        "Employment proof is required when employment status is 'Employed'",
      path: ["employment_proof"],
    }
  )
  .refine(
    (data) => {
      // If employment status is self-employed, business proof is required
      if (data.employment_status === EmploymentStatus.SELF_EMPLOYED) {
        return (
          data.business_proof !== null && data.business_proof !== undefined
        );
      }
      return true;
    },
    {
      message:
        "Business proof is required when employment status is 'Self-Employed'",
      path: ["business_proof"],
    }
  )
  .refine(
    (data) => {
      // If employment status is employed, employer fields are required
      if (data.employment_status === EmploymentStatus.EMPLOYED) {
        return (
          data.employer_name &&
          data.employer_name.trim() !== "" &&
          data.work_address &&
          data.work_address.trim() !== "" &&
          data.job_title &&
          data.job_title.trim() !== "" &&
          data.work_phone_number &&
          data.work_phone_number.trim() !== "" &&
          data.monthly_net_income &&
          data.monthly_net_income.trim() !== "" &&
          data.length_of_employment &&
          data.length_of_employment.trim() !== ""
        );
      }
      return true;
    },
    {
      message:
        "Employer name, job title, work address, work phone, monthly income, and length of employment are required when employment status is 'Employed'",
      path: ["employer_name"],
    }
  )
  .refine(
    (data) => {
      // If employment status is self-employed, business fields are required
      if (data.employment_status === EmploymentStatus.SELF_EMPLOYED) {
        return (
          data.nature_of_business &&
          data.nature_of_business.trim() !== "" &&
          data.business_name &&
          data.business_name.trim() !== "" &&
          data.business_address &&
          data.business_address.trim() !== "" &&
          data.business_duration &&
          data.business_duration.trim() !== "" &&
          data.estimated_monthly_income &&
          data.estimated_monthly_income.trim() !== ""
        );
      }
      return true;
    },
    {
      message:
        "Nature of business, business name, business address, business duration, and estimated monthly income are required when employment status is 'Self-Employed'",
      path: ["nature_of_business"],
    }
  )
  .refine(
    (data) => {
      // Validate monthly income format for employed
      if (
        data.employment_status === EmploymentStatus.EMPLOYED &&
        data.monthly_net_income &&
        data.monthly_net_income.trim() !== ""
      ) {
        const num = parseFloat(data.monthly_net_income.replace(/[^\d.]/g, ""));
        return !isNaN(num) && num >= 10000 && num <= 100000000;
      }
      return true;
    },
    {
      message: "Monthly income must be between ₦10,000 and ₦100,000,000",
      path: ["monthly_net_income"],
    }
  )
  .refine(
    (data) => {
      // Validate estimated monthly income format for self-employed
      if (
        data.employment_status === EmploymentStatus.SELF_EMPLOYED &&
        data.estimated_monthly_income &&
        data.estimated_monthly_income.trim() !== ""
      ) {
        const num = parseFloat(
          data.estimated_monthly_income.replace(/[^\d.]/g, "")
        );
        return !isNaN(num) && num >= 10000 && num <= 100000000;
      }
      return true;
    },
    {
      message:
        "Estimated monthly income must be between ₦10,000 and ₦100,000,000",
      path: ["estimated_monthly_income"],
    }
  )
  .refine(
    (data) => {
      // If referral agent name is provided, phone number should also be provided
      if (
        data.referral_agent_full_name &&
        data.referral_agent_full_name.trim() !== ""
      ) {
        return (
          data.referral_agent_phone_number &&
          data.referral_agent_phone_number.trim() !== ""
        );
      }
      return true;
    },
    {
      message:
        "If you provide a referral agent name, please also provide their phone number",
      path: ["referral_agent_phone_number"],
    }
  );

export type KYCFormData = z.infer<typeof kycFormSchema>;

// Type for existing KYC data from server (backend field names)
// Uses Pick and Omit to derive from KYCFormData, avoiding duplication
type BackendKYCFields = Pick<
  KYCFormData,
  | "first_name"
  | "last_name"
  | "email"
  | "phone_number"
  | "date_of_birth"
  | "gender"
  | "nationality"
  | "state_of_origin"
  | "marital_status"
  | "religion"
  | "employment_status"
  | "employer_name"
  | "job_title"
  | "work_address"
  | "work_phone_number"
  | "monthly_net_income"
  | "length_of_employment"
  | "nature_of_business"
  | "business_name"
  | "business_address"
  | "business_duration"
  | "estimated_monthly_income"
  | "passport_photo_url"
  | "id_document_url"
  | "employment_proof_url"
  | "business_proof_url"
>;

// Backend uses different field names for some fields
type BackendSpecificFields = {
  id: string;
  property_id?: string;
  contact_address?: string;
  work_address?: string; // Direct field name
  work_phone_number?: string; // Direct field name
  employer_address?: string; // Legacy field name, maps to work_address
  employer_phone_number?: string; // Legacy field name, maps to work_phone_number
  length_of_employment?: string;
  // Next of Kin - current field names
  next_of_kin_full_name?: string;
  next_of_kin_address?: string;
  next_of_kin_relationship?: string;
  next_of_kin_phone_number?: string;
  next_of_kin_email?: string;
  // Next of Kin - legacy field names (reference1_*)
  reference1_name?: string;
  reference1_address?: string;
  reference1_relationship?: string;
  reference1_phone_number?: string;
  reference1_email?: string;
  // Guarantor (backend uses reference2_*)
  reference2_name?: string;
  reference2_address?: string;
  reference2_relationship?: string;
  reference2_phone_number?: string;
  // Metadata
  created_at?: string;
  updated_at?: string;
  status?: string;
  application_type?: string;
};

// Combine and make all fields optional (server may not return all fields)
export type ExistingKYCData = Partial<BackendKYCFields & BackendSpecificFields>;
