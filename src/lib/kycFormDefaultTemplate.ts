import type { KycFormSchema } from "@/types/kycFormBuilder";

// Mirrors the tenant-facing form at src/components/designs/KycForm.tsx.
// This is the generic master template every landlord starts from.
export const DEFAULT_KYC_FORM_SCHEMA: KycFormSchema = {
  sections: [
    {
      id: "sec-personal-info",
      title: "Personal Information",
      fields: [
        { id: "f-whatsapp-phone", type: "phone", label: "WhatsApp Phone Number", required: true },
        { id: "f-first-name", type: "short_text", label: "First Name", required: true },
        { id: "f-last-name", type: "short_text", label: "Last Name", required: true },
        { id: "f-contact-address", type: "address", label: "Contact Address", required: true },
        { id: "f-nationality", type: "short_text", label: "Nationality", required: true },
        { id: "f-state-of-origin", type: "short_text", label: "State of Origin", required: true },
        {
          id: "f-gender",
          type: "dropdown",
          label: "Gender",
          required: true,
          options: ["Male", "Female"],
        },
        { id: "f-dob", type: "date", label: "Date of Birth", required: true },
        {
          id: "f-marital-status",
          type: "dropdown",
          label: "Marital Status",
          required: true,
          options: ["Single", "Married", "Divorced", "Widowed"],
        },
        {
          id: "f-religion",
          type: "dropdown",
          label: "Religion",
          required: false,
          options: ["Christianity", "Islam", "Traditional", "Other"],
        },
        { id: "f-email", type: "email", label: "Email", required: true },
      ],
    },
    {
      id: "sec-next-of-kin",
      title: "Next of Kin Details",
      fields: [
        { id: "f-nok-name", type: "short_text", label: "Full Name", required: true },
        { id: "f-nok-address", type: "address", label: "Address", required: true },
        { id: "f-nok-relationship", type: "short_text", label: "Relationship", required: true },
        { id: "f-nok-phone", type: "phone", label: "Phone Number", required: true },
        { id: "f-nok-email", type: "email", label: "Email", required: false },
      ],
    },
    {
      id: "sec-employment",
      title: "Employment Details",
      fields: [
        {
          id: "f-employment-status",
          type: "dropdown",
          label: "Employment Status",
          required: true,
          options: ["Employed", "Self-Employed"],
        },
        { id: "f-employer-name", type: "short_text", label: "Employer Name", required: false },
        { id: "f-job-title", type: "short_text", label: "Job Title", required: false },
        { id: "f-work-address", type: "address", label: "Work Address", required: false },
        { id: "f-work-phone", type: "phone", label: "Work Phone Number", required: false },
        { id: "f-employment-length", type: "short_text", label: "Length of Employment", required: false },
        { id: "f-monthly-income", type: "number", label: "Monthly Income", required: false },
        { id: "f-business-nature", type: "short_text", label: "Nature of Business", required: false },
        { id: "f-business-name", type: "short_text", label: "Business Name", required: false },
        { id: "f-business-address", type: "address", label: "Business Address", required: false },
        { id: "f-business-duration", type: "short_text", label: "Business Duration", required: false },
        { id: "f-business-income", type: "number", label: "Estimated Monthly Income", required: false },
      ],
    },
    {
      id: "sec-tenancy-info",
      title: "Tenancy Information",
      fields: [
        {
          id: "f-property-applying-for",
          type: "dropdown",
          label: "Property Applying For",
          required: true,
          options: [],
        },
        {
          id: "f-intended-use",
          type: "dropdown",
          label: "Intended Use of Property",
          required: true,
          options: ["Residential", "Commercial"],
        },
        { id: "f-num-occupants", type: "number", label: "Number of Occupants", required: true },
        { id: "f-company-name", type: "short_text", label: "Company Name", required: false },
        { id: "f-industry", type: "short_text", label: "Industry / Business Type", required: false },
        { id: "f-company-nature", type: "short_text", label: "Nature of Business", required: false },
        { id: "f-years-in-operation", type: "short_text", label: "Years in Operation", required: false },
        { id: "f-is-primary-contact", type: "checkbox", label: "Is Primary Contact", required: false },
        { id: "f-company-contact-name", type: "short_text", label: "Company Contact Name", required: false },
        { id: "f-company-contact-title", type: "short_text", label: "Company Contact Job Title", required: false },
        { id: "f-company-contact-phone", type: "phone", label: "Company Contact Phone", required: false },
        { id: "f-first-time-tenant", type: "checkbox", label: "First-Time Tenant", required: false },
        { id: "f-previous-residences", type: "number", label: "Previous Residences Count", required: false },
        { id: "f-parking-needs", type: "checkbox", label: "Parking Needs", required: false },
        { id: "f-proposed-rent", type: "number", label: "Proposed Rent Amount", required: false },
        {
          id: "f-rent-frequency",
          type: "dropdown",
          label: "Rent Payment Frequency",
          required: false,
          options: ["Monthly", "Quarterly", "Annually"],
        },
        { id: "f-additional-notes", type: "long_text", label: "Additional Notes", required: false },
        { id: "f-referral-agent-name", type: "short_text", label: "Referral Agent Name", required: false },
        { id: "f-referral-agent-phone", type: "phone", label: "Referral Agent Phone", required: false },
      ],
    },
    {
      id: "sec-identification",
      title: "Identification & Declaration",
      fields: [
        { id: "f-passport-photo", type: "file_upload", label: "Passport Photograph", required: true },
        { id: "f-means-of-id", type: "file_upload", label: "Means of Identification", required: true },
        { id: "f-proof-of-employment", type: "file_upload", label: "Proof of Employment", required: false },
        { id: "f-proof-of-business", type: "file_upload", label: "Proof of Business", required: false },
        { id: "f-cac-certificate", type: "file_upload", label: "CAC Certificate", required: false },
        {
          id: "f-declaration",
          type: "checkbox",
          label: "I have read and agree to the declaration",
          required: true,
        },
      ],
    },
  ],
};

export function cloneDefaultKycFormSchema(): KycFormSchema {
  return JSON.parse(JSON.stringify(DEFAULT_KYC_FORM_SCHEMA));
}
