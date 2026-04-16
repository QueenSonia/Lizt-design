import { OfferLetterData } from "@/components/OfferLetterDocument";

export type OfferStatus = "pending" | "accepted" | "rejected" | undefined;

export interface IKycApplication {
  id: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  occupation: string;
  idType: string;
  submittedDate: string;
  status: "Pending" | "Pending Completion" | "Attached" | "Rejected";

  // Offer Letter Status (from backend)
  offerLetterStatus?: OfferStatus;
  offerLetter?: {
    id: string;
    token: string;
    status: OfferStatus;
    rentAmount: number;
    rentFrequency: string;
    serviceCharge?: number;
    tenancyStartDate: string;
    tenancyEndDate: string;
    cautionDeposit?: number;
    legalFee?: number;
    agencyFee?: number;
    acceptedAt?: string;
    acceptanceOtp?: string;
    acceptedByPhone?: string;
    sentAt?: string; // When offer was sent to tenant
  };

  // Timestamp fields for timeline events
  offerLetterCreatedAt?: string;
  offerLetterUpdatedAt?: string;
  invoiceCreatedAt?: string;
  invoiceId?: string;
  paymentDate?: string;

  // Legacy fields (for backward compatibility)
  offerStatus?: OfferStatus;
  offerLetterData?: OfferLetterData;
  offerLetterToken?: string;

  // Personal Details
  surname?: string;
  otherNames?: string;
  contactAddress?: string;
  nationality?: string;
  stateOfOrigin?: string;
  sex?: string;
  dateOfBirth?: string;
  passportPhoto?: string;
  religion?: string;

  // Professional
  profession?: string;
  positionInWorkplace?: string;
  jobTitle?: string;
  placeOfWork?: string;

  // Marital Status
  maritalStatus?: string;

  // Employment Details
  employmentStatus?: string;
  levelOfEducation?: string;
  employerName?: string;
  workPhone?: string;
  monthlyIncome?: string;
  officeAddress?: string;
  yearsAtEmployer?: string;

  // Self-employed specific fields
  natureOfBusiness?: string;
  businessName?: string;
  businessAddress?: string;
  businessDuration?: string;

  // Next of Kin (from reference1)
  nextOfKin?: {
    fullName: string;
    address: string;
    relationship: string;
    phone: string;
    email: string;
  };

  // Tenancy Information
  tenantOffer?: {
    proposedRentAmount: number;
    rentPaymentFrequency: "Monthly" | "Quarterly" | "Bi-annually" | "Annually";
    intendedUse?: string;
    numberOfOccupants?: string;
    numberOfCarsOwned?: string;
    additionalNotes?: string;
  };

  // Referral Agent
  referralAgent?: {
    fullName: string;
    phoneNumber: string;
  };

  documents?: Array<{
    name: string;
    url: string;
  }>;

  employmentProof?: {
    type: string;
    url: string;
  };

  businessProof?: {
    type: string;
    url: string;
  };

  declaration?: string;

  // Financial summary (outstanding balance shown on tenant profile)
  outstandingBalance?: number;
  creditBalance?: number;
}
