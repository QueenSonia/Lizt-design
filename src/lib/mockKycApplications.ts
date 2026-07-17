import { KYCApplication } from "@/services/kyc/kyc.service";

// Extended type to handle flat tenancy fields and offer letter status from backend API
export interface KYCApplicationWithFlatFields extends KYCApplication {
  proposedRentAmount?: string | number;
  rentPaymentFrequency?: string;
  offerLetterStatus?: string;
  offerLetter?: {
    id: string;
    token: string;
    status: string;
    rentAmount: number;
    rentFrequency: string;
    serviceCharge?: number;
    tenancyStartDate: string;
    tenancyEndDate: string;
    cautionDeposit?: number;
    legalFee?: number;
    agencyFee?: number;
    totalAmount?: number;
    amountPaid?: number;
    outstandingBalance?: number;
    paymentStatus?: string;
    acceptedAt?: string;
    acceptanceOtp?: string;
    acceptedByPhone?: string;
    createdAt?: string;
    updatedAt?: string;
    sentAt?: string;
  };
}

export const mockKYCApplications: KYCApplicationWithFlatFields[] = [
  {
    id: "mock-1",
    propertyId: "prop-1",
    status: "pending",
    firstName: "Jennifer",
    lastName: "Williams",
    email: "jennifer.williams@email.com",
    phoneNumber: "+234 803 456 7890",
    contactAddress: "14 Bode Thomas Street, Surulere, Lagos",
    dateOfBirth: "1995-03-15",
    gender: "Female",
    nationality: "Nigerian",
    stateOfOrigin: "Lagos",
    localGovernmentArea: "Surulere",
    maritalStatus: "Single",
    employmentStatus: "Employed",
    occupation: "Software Engineer",
    jobTitle: "Senior Developer",
    employerName: "TechCorp Lagos",
    monthlyNetIncome: "500000",
    reference1: { name: "Adaeze Okonkwo", relationship: "Colleague", phoneNumber: "+234 801 234 5678" },
    tenantOffer: { proposedRentAmount: "450000", rentPaymentFrequency: "Annually" },
    property: { name: "Sunset View Apartments", address: "12 Admiralty Way, Lekki Phase 1, Lagos" },
    submissionDate: "2024-12-01T14:30:00",
    createdAt: "2024-12-01T14:30:00",
    updatedAt: "2024-12-01T14:30:00",
    proposedRentAmount: "450000",
    rentPaymentFrequency: "Annually",
    referralAgent: { fullName: "Tobi Adenuga", phoneNumber: "+234 813 555 0192" },
  },
  {
    id: "mock-2",
    propertyId: "prop-2",
    status: "pending",
    firstName: "David",
    lastName: "Okafor",
    email: "david.okafor@email.com",
    phoneNumber: "+234 806 123 4567",
    contactAddress: "22 Allen Avenue, Ikeja, Lagos",
    dateOfBirth: "1988-11-22",
    gender: "Male",
    nationality: "Nigerian",
    stateOfOrigin: "Anambra",
    localGovernmentArea: "Awka",
    maritalStatus: "Married",
    employmentStatus: "Employed",
    occupation: "Marketing Manager",
    jobTitle: "Head of Marketing",
    employerName: "Brand Solutions Ltd",
    monthlyNetIncome: "400000",
    reference1: { name: "Emeka Chukwu", relationship: "Friend", phoneNumber: "+234 807 654 3210" },
    tenantOffer: { proposedRentAmount: "600000", rentPaymentFrequency: "Annually" },
    property: { name: "Garden View Complex", address: "5 Adeola Odeku Street, Victoria Island, Lagos" },
    submissionDate: "2024-11-28T09:15:00",
    createdAt: "2024-11-28T09:15:00",
    updatedAt: "2024-11-28T09:15:00",
    proposedRentAmount: "600000",
    rentPaymentFrequency: "Annually",
    offerLetterStatus: "pending",
    offerLetter: {
      id: "ol-1",
      token: "mock-token-1",
      status: "pending",
      rentAmount: 600000,
      rentFrequency: "Annually",
      tenancyStartDate: "2025-01-01",
      tenancyEndDate: "2026-01-01",
      cautionDeposit: 300000,
      totalAmount: 900000,
      amountPaid: 0,
      sentAt: "2024-11-30T10:00:00",
    },
    referralAgent: { fullName: "Tobi A.", phoneNumber: "+234 813 555 0192" },
  },
  {
    id: "mock-3",
    propertyId: "prop-1",
    status: "pending_completion",
    firstName: "Grace",
    lastName: "Adebayo",
    email: "grace.adebayo@email.com",
    phoneNumber: "+234 701 987 6543",
    contactAddress: "8 Olumide Close, Yaba, Lagos",
    dateOfBirth: "1992-06-08",
    gender: "Female",
    nationality: "Nigerian",
    stateOfOrigin: "Ogun",
    localGovernmentArea: "Abeokuta South",
    maritalStatus: "Single",
    employmentStatus: "Self-Employed",
    occupation: "Designer",
    jobTitle: "Creative Director",
    businessDuration: "3 years",
    monthlyNetIncome: "250000",
    reference1: { name: "Tunde Bello", relationship: "Business Partner", phoneNumber: "+234 802 111 2222" },
    tenantOffer: { proposedRentAmount: "350000", rentPaymentFrequency: "Annually" },
    property: { name: "Sunset View Apartments", address: "12 Admiralty Way, Lekki Phase 1, Lagos" },
    submissionDate: "2024-11-25T16:45:00",
    createdAt: "2024-11-25T16:45:00",
    updatedAt: "2024-11-25T16:45:00",
    proposedRentAmount: "350000",
    rentPaymentFrequency: "Annually",
    referralAgent: { fullName: "Ngozi Umeh", phoneNumber: "+234 704 220 8871" },
  },
  {
    id: "mock-4",
    propertyId: "prop-2",
    status: "approved",
    firstName: "Emeka",
    lastName: "Nwachukwu",
    email: "emeka.nwachukwu@email.com",
    phoneNumber: "+234 809 654 3211",
    contactAddress: "3 Awolowo Road, Ikoyi, Lagos",
    dateOfBirth: "1990-02-19",
    gender: "Male",
    nationality: "Nigerian",
    stateOfOrigin: "Imo",
    localGovernmentArea: "Owerri",
    maritalStatus: "Married",
    employmentStatus: "Employed",
    occupation: "Accountant",
    jobTitle: "Finance Manager",
    employerName: "Coastal Bank",
    monthlyNetIncome: "550000",
    reference1: { name: "Ijeoma Nwachukwu", relationship: "Spouse", phoneNumber: "+234 805 222 3344" },
    tenantOffer: { proposedRentAmount: "600000", rentPaymentFrequency: "Annually" },
    property: { name: "Garden View Complex", address: "5 Adeola Odeku Street, Victoria Island, Lagos" },
    submissionDate: "2024-10-10T11:00:00",
    createdAt: "2024-10-10T11:00:00",
    updatedAt: "2024-10-10T11:00:00",
    proposedRentAmount: "600000",
    rentPaymentFrequency: "Annually",
    offerLetter: {
      id: "ol-2",
      token: "mock-token-2",
      status: "accepted",
      rentAmount: 600000,
      rentFrequency: "Annually",
      tenancyStartDate: "2024-11-01",
      tenancyEndDate: "2025-10-31",
      cautionDeposit: 300000,
      totalAmount: 900000,
      amountPaid: 900000,
      acceptedAt: "2024-10-15T09:00:00",
    },
    referralAgent: { fullName: "T. Adenuga", phoneNumber: "+234 813 555 0192" },
  },
];
