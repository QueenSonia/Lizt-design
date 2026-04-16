// Replicate your backend enums on the frontend for consistency
export enum PropertyStatusEnum {
  VACANT = "vacant",
  OCCUPIED = "occupied",
  INACTIVE = "inactive",
  READY_FOR_MARKETING = "ready_for_marketing",
  OFFER_PENDING = "offer_pending",
  OFFER_ACCEPTED = "offer_accepted",
}

// This interface matches the full Property entity
export interface Property {
  id: string;
  name: string;
  location: string;
  city: string;
  state: string;
  description?: string;
  property_status: PropertyStatusEnum;
  owner_id: string;
  property_type: string;
  property_images?: string[];
  no_of_bedrooms: number;
  no_of_bathrooms: number;
  size?: number;
  year_built?: number;
  rental_price?: number;
  payment_frequency?: string;
  security_deposit?: number;
  service_charge?: number;
  is_marketing_ready?: boolean;
  comment?: string;
  offer_letter_count?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}

// These types MUST match the backend DTOs

interface ActiveTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  rentAmount: number;
  leaseStartDate: string;
  rentExpiryDate: string;
}

interface RentPayment {
  id: string;
  paymentDate: string;
  amountPaid: number;
  status: string;
}

interface ServiceRequest {
  id: string;
  tenantName: string;
  propertyName: string;
  messagePreview: string;
  dateReported: string;
  status: string;
}

// KYC Application interface
export interface KYCApplicationSummary {
  id: string;
  status: "pending" | "approved" | "rejected";
  applicantName: string;
  email: string;
  phoneNumber: string;
  submissionDate: string;
  employmentStatus?: string;
  monthlyIncome?: string;
}

// The main type for the hook
export interface PropertyDetail {
  id: string;
  name: string;
  location: string;
  description: string;
  status: "VACANT" | "OCCUPIED" | "INACTIVE";
  type: string;
  bedrooms: number;
  propertyType: string; // Or keep as 'type' and update component JSX to property.type
  bathrooms: number;
  size?: number; // Optional if not always present
  yearBuilt?: number; // Optional if not always present
  tenant: ActiveTenant | null;
  rentPayments: RentPayment[];
  serviceRequests: ServiceRequest[];
  kycApplications: KYCApplicationSummary[];
  kycApplicationCount: number;
  offerLetterCount: number;
  hasActiveKYCLink: boolean;
}

// New comprehensive property details type
export interface PropertyDetailWithHistory {
  id: number;
  name: string;
  address: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  status: string;
  rent: number | null;
  serviceCharge: number | null; // Service charge for the property
  rentExpiryDate: string | null;
  pendingRenewalInvoice: { id: string; rentAmount: number; serviceCharge: number; totalAmount: number; paymentFrequency: string | null; endDate: string | null; legalFee?: number; agencyFee?: number; additionalFees?: Array<{ name: string; amount: number }> } | null;
  legalFee?: number;
  agencyFee?: number;
  additionalFees?: Array<{ name: string; amount: number }>;
  rentalPrice: number | null; // Marketing price for vacant properties
  isMarketingReady: boolean;
  description: string;
  currentTenant: {
    id: string;
    tenancyId?: string; // PropertyTenant entity ID for tenancy operations
    name: string;
    email: string;
    phone: string;
    tenancyStartDate: string;
    paymentCycle: string;
    passportPhoto?: string;
    renewalStatus?: "pending" | "paid" | null;
    outstandingBalance?: number;
  } | null;
  history: Array<{
    id: number;
    date: string;
    eventType: string;
    title: string;
    description: string;
    details: string | null;
  }>;
  kycApplications: KYCApplicationSummary[];
  kycApplicationCount: number;
  pendingApplicationsCount: number;
  offerLetterCount: number;
  hasActiveKYCLink: boolean;
}

// This type mirrors the UpdatePropertyDto on the backend.
// It's a partial record of the main Property type.
export type UpdatePropertyPayload = Partial<
  Omit<Property, "id" | "created_at" | "updated_at">
>;
