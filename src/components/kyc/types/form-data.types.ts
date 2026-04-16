/**
 * TypeScript interfaces for KYC form data
 * Requirements: 1.1, 1.2
 *
 * NOTE: This file re-exports KYCFormData from kyc.schemas.ts as the single source of truth
 * All form fields including UI-only fields are now defined in the schema
 */

import {
  KYCFormData,
  Gender,
  MaritalStatus,
  EmploymentStatus,
  Religion,
} from "../../../schemas/kyc.schemas";

// Re-export KYCFormData as the primary form data type
export type FormData = KYCFormData;

// Re-export enums from schema
export { Gender, MaritalStatus, EmploymentStatus, Religion };

export interface Step {
  number: number;
  title: string;
  subtitle: string;
}

export interface StepValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface PropertyInfo {
  id: string;
  name: string;
  location?: string;
  address?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  landlordId?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  propertyInfo?: PropertyInfo;
  vacantProperties?: Array<{
    id: string;
    name: string;
    location: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    description?: string;
  }>;
  message?: string;
}
