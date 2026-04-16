export interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: string;
  reference: string | null;
}

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  type?: string;
  uploadDate: string;
}

export interface PastTenancyItem {
  id: string;
  property: string;
  startDate: string;
  endDate: string | null;
  status: "Active" | "Completed";
}

// export interface ServiceRequestItem {
//   id: string;
//   title: string;
//   status: string;
//   date: string;
//   priority: "High" | "Medium" | "Low";
// }

export interface MaintenanceIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  reportedDate: string;
  resolvedDate?: string | null;
  priority: "High" | "Medium" | "Low";
}

export interface OfferLetterData {
  id: string;
  token: string;
  propertyName: string;
  propertyId: string;
  rentAmount: number;
  rentFrequency: string;
  serviceCharge: number;
  cautionDeposit: number;
  legalFee: number;
  agencyFee: number;
  totalAmount: number;
  tenancyStartDate: Date;
  tenancyEndDate: Date;
  status: string;
  paymentStatus: string;
  amountPaid: number;
  outstandingBalance: number;
  creditBalance: number;
  // Acceptance tracking fields
  acceptedAt?: string;
  acceptanceOtp?: string;
  acceptedByPhone?: string;
}

export interface ReceiptData {
  id: string;
  propertyName: string;
  propertyId?: string;
  amountPaid: number;
  paymentMethod: string | null;
  reference: string;
  paidAt?: string;
  isPartPayment: boolean;
}

export interface TimeLineEvent {
  id: string;
  type:
    | "payment"
    | "maintenance"
    | "notice"
    | "general"
    | "offer_letter"
    | "invoice"
    | "receipt";
  title: string;
  description: string;
  date: string;
  time: string;
  details?: string; // Additional details like property name or amount
  relatedEntityId?: string;
  relatedEntityType?: string;
  offerLetterData?: OfferLetterData;
  receiptData?: ReceiptData;
}

export interface KycInfo {
  kycStatus: "Verified" | "Pending" | "Rejected" | "Not Submitted";
  kycSubmittedDate: string | null;
  kycDocuments?: Array<{ type: string; fileUrl: string }>; // KYC document objects
}

export interface OutstandingBalanceTransaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
}

export interface OutstandingBalanceBreakdown {
  rentId: string;
  propertyName: string;
  propertyId: string;
  outstandingAmount: number;
  tenancyStartDate: string | Date | null;
  tenancyEndDate: string | Date | null;
  transactions: OutstandingBalanceTransaction[];
}

export interface TenantDetail {
  id: string;

  // KYC Application ID (set when tenant has an associated KYC application)
  kycApplicationId?: string | null;

  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phone: string;
  email: string;
  gender: string | null;
  stateOfOrigin: string | null;
  lga: string | null;
  nationality: string | null;
  maritalStatus: string | null;
  religion: string | null;

  // Employment Information
  employmentStatus: string | null;
  employerName: string | null;
  employerAddress: string | null;
  jobTitle: string | null;
  workEmail: string | null;
  monthlyIncome: number | null;
  employerPhoneNumber: string | null;
  lengthOfEmployment: string | null;

  // Self-employed Information
  natureOfBusiness: string | null;
  businessName: string | null;
  businessAddress: string | null;
  businessDuration: string | null;
  occupation: string | null;

  // Residence information (from KYC)
  currentAddress: string | null;

  // Next of Kin Information (from KYC reference1)
  nokName: string | null;
  nokRelationship: string | null;
  nokPhone: string | null;
  nokEmail: string | null;
  nokAddress: string | null;

  // Guarantor Information (from KYC reference2)
  guarantorName: string | null;
  guarantorPhone: string | null;
  guarantorEmail: string | null;
  guarantorAddress: string | null;
  guarantorRelationship: string | null;
  guarantorOccupation: string | null;

  // Current Tenancy
  property: string;
  propertyId: string;
  propertyAddress: string;
  propertyStatus: string;

  // System Info
  whatsAppConnected: boolean;

  // Wallet balance (positive = credit, negative = outstanding)
  // totalOutstandingBalance and totalCreditBalance are derived from this
  // for backward-compat with existing display code.
  totalOutstandingBalance: number; // Math.max(0, -walletBalance)
  totalCreditBalance: number;      // Math.max(0, walletBalance)
  outstandingBalanceBreakdown: OutstandingBalanceBreakdown[];
  paymentTransactions: OutstandingBalanceTransaction[];

  // Tenancy Details
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  tenancyStatus: string;

  // Rent Information
  rentAmount: number;
  serviceCharge?: number | null;
  rentFrequency: string;
  rentStatus: string;
  nextRentDue: string | null;
  outstandingBalance: number;
  creditBalance: number;

  // Aggregated Data
  paymentHistory: PaymentHistoryItem[];
  maintenanceIssues: MaintenanceIssue[];
  documents: DocumentItem[];
  activeTenancies: PastTenancyItem[]; // Active rent records with full property details
  tenancyHistory: PastTenancyItem[]; // Historical tenancy records (past properties)
  history: TimeLineEvent[];
  kycInfo: KycInfo;

  // TenantKyc ID for updates
  tenantKycId: string | null;

  // Passport Photo URL (from KYC Application)
  passportPhotoUrl?: string | null;

  // Tenancy Proposal Information (from KYC Application)
  intendedUseOfProperty: string | null;
  numberOfOccupants: string | null;
  numberOfCarsOwned: string | null;
  proposedRentAmount: string | null;
  rentPaymentFrequency: string | null;
  additionalNotes: string | null;

  // Status for Landlord/Tenants page
  status?: "Active" | "Inactive" | "Pending Approval" | "Rejected";
}

export interface SimpleTenant {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  profile_name?: string;
}
