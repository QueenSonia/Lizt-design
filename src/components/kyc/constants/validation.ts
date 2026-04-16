/**
 * Validation rules and constants for KYC form
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 *
 * All user-facing fields are required except referral_agent and additional_notes.
 * Employment-specific fields are conditionally required based on employment_status.
 */

export const VALIDATION_RULES = {
  // All fields are now required
  REQUIRED_FIELDS: {
    STEP_1: [
      "last_name",
      "first_name",
      "contact_address",
      "nationality",
      "state_of_origin",
      "gender",
      "date_of_birth",
      "marital_status",
      "religion",
      "email",
      "phone_number",
      "next_of_kin_full_name",
      "next_of_kin_address",
      "next_of_kin_relationship",
      "next_of_kin_phone_number",
      "next_of_kin_email",
    ],
    STEP_2: [
      "employment_status",
      // Fields validated dynamically based on employment status
    ],
    STEP_3: [
      "intended_use_of_property",
      "number_of_occupants",
      "proposed_rent_amount",
      "rent_payment_frequency",
    ],
    STEP_4: [
      "passport_photo",
      "id_document",
      "employment_proof",
      "business_proof",
      "declaration_accepted",
    ],
  },

  // Field length constraints
  MIN_LENGTH: {
    last_name: 2,
    first_name: 2,
    contact_address: 10,
    nationality: 2,
    state_of_origin: 2,
    job_title: 2,
    employer_address: 2,
    job_role: 2,
    business_address: 10,
    next_of_kin_full_name: 2,
    next_of_kin_address: 10,
    next_of_kin_relationship: 2,
    referral_agent_full_name: 2,
    // referral_agent_address no longer exists
    // referral_agent_relationship no longer exists
  },

  MAX_LENGTH: {
    last_name: 50,
    first_name: 50,
    contact_address: 200,
    nationality: 50,
    state_of_origin: 50,
    job_title: 100,
    employer_address: 100,
    job_role: 100,
    business_address: 200,
    next_of_kin_full_name: 100,
    next_of_kin_address: 200,
    next_of_kin_relationship: 50,
    referral_agent_full_name: 100,
    // referral_agent_address no longer exists
    // referral_agent_relationship no longer exists
  },

  // Pattern validation
  PATTERNS: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[\d\s\-\(\)]{10,15}$/,
    name: /^[a-zA-Z\s'-]+$/,
    alphanumeric: /^[a-zA-Z0-9\s]+$/,
    numbers: /^\d+$/,
  },

  // File upload constraints
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: {
      passport: ["image/jpeg", "image/jpg", "image/png"],
      idDocument: ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
    },
  },

  // Age validation
  MIN_AGE: 18,
  MAX_AGE: 100,

  // OTP validation
  OTP_LENGTH: 6,
  OTP_PATTERN: /^\d{6}$/,
};

export const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
  MIN_LENGTH: (field: string, min: number) =>
    `${field} must be at least ${min} characters long`,
  MAX_LENGTH: (field: string, max: number) =>
    `${field} must be no more than ${max} characters long`,
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PHONE: "Please enter a valid phone number",
  INVALID_NAME: "Can only contain letters, spaces, hyphens, and apostrophes",
  INVALID_DATE: "Please enter a valid date",
  AGE_TOO_YOUNG: `You must be at least ${VALIDATION_RULES.MIN_AGE} years old`,
  AGE_TOO_OLD: "Please enter a valid birth date",
  FILE_TOO_LARGE: "File size must be less than 5MB",
  INVALID_FILE_TYPE:
    "Invalid file type. Please upload a valid image or PDF file",
  INVALID_OTP: "Please enter a valid 6-digit OTP",
  DECLARATION_REQUIRED: "You must accept the declaration to proceed",
};

export const SELECT_OPTIONS = {
  SEX: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ],

  MARITAL_STATUS: [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
    { value: "divorced", label: "Divorced" },
    { value: "widowed", label: "Widowed" },
  ],

  EDUCATION_LEVELS: [
    { value: "primary", label: "Primary Education" },
    { value: "secondary", label: "Secondary Education" },
    { value: "tertiary", label: "Tertiary Education" },
    { value: "postgraduate", label: "Postgraduate" },
  ],

  RELIGIONS: [
    { value: "christianity", label: "Christianity" },
    { value: "islam", label: "Islam" },
    { value: "traditional", label: "Traditional" },
    { value: "other", label: "Other" },
  ],
};
