export type OccupancyStatus = "occupied" | "vacant";

export interface OnboardingDocument {
  name: string;
  url: string;
}

export interface OnboardingTenant {
  name: string;
  phone: string;
  email: string;
}

export interface OnboardingTenancy {
  tenancyType: string;
  startDate: string;
  endDate: string;
}

export interface OnboardingProperty {
  id: string;
  name: string;
  description: string;
  address: string;
  occupancyStatus: OccupancyStatus;
  rent?: number;
  serviceCharge?: number;
  tenant?: OnboardingTenant;
  tenancy?: OnboardingTenancy;
  documents: OnboardingDocument[];
  /** Proof of ownership for this specific property — shown in its own "Ownership Documents" section. */
  ownershipDocument?: OnboardingDocument;
}

export type LandlordType = "individual" | "corporate";

/** Landlord identity info as captured by the onboarding form — shape depends on landlordType. */
export interface IndividualLandlordInfo {
  landlordType: "individual";
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  residentialAddress: string;
  meansOfIdentification: OnboardingDocument;
  photoOfIdentification: OnboardingDocument;
}

export interface CorporateLandlordInfo {
  landlordType: "corporate";
  companyName: string;
  officeAddress: string;
  contactFirstName: string;
  contactLastName: string;
  contactPhone: string;
  cacDocument: OnboardingDocument;
}

export type OnboardingLandlordInfo = IndividualLandlordInfo | CorporateLandlordInfo;

export type OnboardingService =
  | "Property Marketing"
  | "Tenant Screening"
  | "Tenant Offer Letter & Tenancy Agreement"
  | "Rent Collection"
  | "Keys Handover"
  | "Tenant Support"
  | "Maintenance Coordination"
  | "Others";

export type OnboardingSubmissionStatus = "pending" | "approved" | "rejected";

export interface OnboardingSubmission {
  id: string;
  landlordName: string;
  landlordPhone: string;
  submittedAt: string;
  status: OnboardingSubmissionStatus;
  landlordInfo: OnboardingLandlordInfo;
  services: OnboardingService[];
  /** Free-text description of the custom service — present only when "Others" is selected. */
  otherServiceDescription?: string;
  properties: OnboardingProperty[];
}

export function propertyCount(submission: OnboardingSubmission): number {
  return submission.properties.length;
}

export function occupancySummary(properties: OnboardingProperty[]): string {
  const occupied = properties.filter((p) => p.occupancyStatus === "occupied").length;
  const vacant = properties.filter((p) => p.occupancyStatus === "vacant").length;
  const parts: string[] = [];
  if (occupied > 0) parts.push(`${occupied} Occupied`);
  if (vacant > 0) parts.push(`${vacant} Vacant`);
  return parts.length > 0 ? parts.join(" • ") : "No properties";
}

export const MOCK_ONBOARDING_SUBMISSIONS: OnboardingSubmission[] = [
  {
    id: "ob-001",
    landlordName: "Michael Adeyemi",
    landlordPhone: "+234 803 100 0001",
    submittedAt: "2026-07-18T09:30:00.000Z",
    status: "pending",
    landlordInfo: {
      landlordType: "individual",
      firstName: "Michael",
      lastName: "Adeyemi",
      dateOfBirth: "1978-03-22",
      email: "michael.adeyemi@email.com",
      phone: "+234 803 100 0001",
      residentialAddress: "5 Bourdillon Road, Ikoyi, Lagos",
      meansOfIdentification: { name: "National ID Card", url: "/mock-documents/means-of-id.pdf" },
      photoOfIdentification: { name: "Passport Photograph", url: "/mock-documents/photo-id.pdf" },
    },
    services: ["Rent Collection", "Tenant Screening", "Maintenance Coordination"],
    properties: [
      {
        id: "ob-001-p1",
        name: "Lekki Phase 1 Duplex",
        description: "4 bedroom detached duplex with BQ and private compound.",
        address: "14 Admiralty Way, Lekki Phase 1, Lagos",
        occupancyStatus: "occupied",
        rent: 3500000,
        serviceCharge: 250000,
        tenant: {
          name: "James Okafor",
          phone: "+234 803 214 5678",
          email: "james.okafor@email.com",
        },
        tenancy: {
          tenancyType: "Annual",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        },
        documents: [
          { name: "Tenant KYC Form", url: "/mock-documents/kyc-form.pdf" },
          { name: "Tenancy Agreement", url: "/mock-documents/tenancy-agreement.pdf" },
        ],
        ownershipDocument: { name: "Certificate of Occupancy", url: "/mock-documents/proof-of-ownership.pdf" },
      },
      {
        id: "ob-001-p2",
        name: "Lekki Phase 1 — Boys Quarters",
        description: "Self-contained studio unit within the same compound.",
        address: "14 Admiralty Way, Lekki Phase 1, Lagos",
        occupancyStatus: "vacant",
        documents: [],
        ownershipDocument: { name: "Certificate of Occupancy", url: "/mock-documents/proof-of-ownership.pdf" },
      },
    ],
  },
  {
    id: "ob-002",
    landlordName: "Adeyemi Holdings Ltd",
    landlordPhone: "+234 805 220 0099",
    submittedAt: "2026-07-19T14:05:00.000Z",
    status: "pending",
    landlordInfo: {
      landlordType: "corporate",
      companyName: "Adeyemi Holdings Ltd",
      officeAddress: "12 Karimu Kotun Street, Victoria Island, Lagos",
      contactFirstName: "Folake",
      contactLastName: "Adeyemi",
      contactPhone: "+234 805 220 0099",
      cacDocument: { name: "CAC Certificate", url: "/mock-documents/cac-certificate.pdf" },
    },
    services: ["Property Marketing", "Tenant Screening", "Tenant Offer Letter & Tenancy Agreement", "Rent Collection", "Keys Handover"],
    properties: [
      {
        id: "ob-002-p1",
        name: "Ikoyi 2-Bed Apartment",
        description: "2 bedroom serviced apartment in a gated estate.",
        address: "3 Cameron Road, Ikoyi, Lagos",
        occupancyStatus: "occupied",
        rent: 2400000,
        serviceCharge: 300000,
        tenant: {
          name: "Adaeze Nwosu",
          phone: "+234 806 332 9910",
          email: "adaeze.nwosu@email.com",
        },
        tenancy: {
          tenancyType: "Annual",
          startDate: "2026-03-15",
          endDate: "2027-03-14",
        },
        documents: [
          { name: "Tenant KYC Form", url: "/mock-documents/kyc-form.pdf" },
          { name: "Tenancy Agreement", url: "/mock-documents/tenancy-agreement.pdf" },
        ],
        ownershipDocument: { name: "Deed of Assignment", url: "/mock-documents/proof-of-ownership.pdf" },
      },
    ],
  },
  {
    id: "ob-003",
    landlordName: "Sarah Johnson",
    landlordPhone: "+234 807 441 2233",
    submittedAt: "2026-06-30T11:20:00.000Z",
    status: "approved",
    landlordInfo: {
      landlordType: "individual",
      firstName: "Sarah",
      lastName: "Johnson",
      dateOfBirth: "1985-11-09",
      email: "sarah.johnson@email.com",
      phone: "+234 807 441 2233",
      residentialAddress: "8 Ozumba Mbadiwe Avenue, Victoria Island, Lagos",
      meansOfIdentification: { name: "International Passport", url: "/mock-documents/means-of-id.pdf" },
      photoOfIdentification: { name: "Passport Photograph", url: "/mock-documents/photo-id.pdf" },
    },
    services: ["Rent Collection", "Tenant Support", "Others"],
    otherServiceDescription: "Annual property inspection and condition reporting.",
    properties: [
      {
        id: "ob-003-p1",
        name: "Victoria Island Studio",
        description: "Compact studio apartment, fully furnished.",
        address: "22 Ozumba Mbadiwe Ave, Victoria Island, Lagos",
        occupancyStatus: "occupied",
        rent: 950000,
        serviceCharge: 120000,
        tenant: {
          name: "Emmanuel Etim",
          phone: "+234 812 554 7723",
          email: "emmanuel.etim@email.com",
        },
        tenancy: {
          tenancyType: "Annual",
          startDate: "2026-06-01",
          endDate: "2027-05-31",
        },
        documents: [
          { name: "Tenant KYC Form", url: "/mock-documents/kyc-form.pdf" },
          { name: "Tenancy Agreement", url: "/mock-documents/tenancy-agreement.pdf" },
        ],
        ownershipDocument: { name: "Certificate of Occupancy", url: "/mock-documents/proof-of-ownership.pdf" },
      },
    ],
  },
  {
    id: "ob-004",
    landlordName: "Grace Bello",
    landlordPhone: "+234 809 662 4410",
    submittedAt: "2026-07-20T08:15:00.000Z",
    status: "pending",
    landlordInfo: {
      landlordType: "individual",
      firstName: "Grace",
      lastName: "Bello",
      dateOfBirth: "1990-06-14",
      email: "grace.bello@email.com",
      phone: "+234 809 662 4410",
      residentialAddress: "17 Walter Carrington Crescent, Lagos Island",
      meansOfIdentification: { name: "Driver's License", url: "/mock-documents/means-of-id.pdf" },
      photoOfIdentification: { name: "Passport Photograph", url: "/mock-documents/photo-id.pdf" },
    },
    services: ["Property Marketing", "Tenant Screening", "Rent Collection", "Keys Handover", "Maintenance Coordination"],
    properties: [
      {
        id: "ob-004-p1",
        name: "Greenfield Towers — Unit 2A",
        description: "3 bedroom apartment on the 2nd floor, recently renovated.",
        address: "9 Walter Carrington Crescent, Lagos Island",
        occupancyStatus: "vacant",
        documents: [],
        ownershipDocument: { name: "Certificate of Occupancy", url: "/mock-documents/proof-of-ownership.pdf" },
      },
      {
        id: "ob-004-p2",
        name: "Greenfield Towers — Unit 2B",
        description: "3 bedroom apartment, mirror layout of Unit 2A.",
        address: "9 Walter Carrington Crescent, Lagos Island",
        occupancyStatus: "vacant",
        documents: [],
        ownershipDocument: { name: "Certificate of Occupancy", url: "/mock-documents/proof-of-ownership.pdf" },
      },
      {
        id: "ob-004-p3",
        name: "Greenfield Towers — Unit 4B",
        description: "3 bedroom apartment on the 4th floor with balcony.",
        address: "9 Walter Carrington Crescent, Lagos Island",
        occupancyStatus: "occupied",
        rent: 1200000,
        serviceCharge: 180000,
        tenant: {
          name: "Chidi Okafor",
          phone: "+234 708 991 2244",
          email: "chidi.okafor@email.com",
        },
        tenancy: {
          tenancyType: "Annual",
          startDate: "2025-08-01",
          endDate: "2026-07-31",
        },
        documents: [
          { name: "Tenant KYC Form", url: "/mock-documents/kyc-form.pdf" },
          { name: "Tenancy Agreement", url: "/mock-documents/tenancy-agreement.pdf" },
        ],
        ownershipDocument: { name: "Certificate of Occupancy", url: "/mock-documents/proof-of-ownership.pdf" },
      },
    ],
  },
  {
    id: "ob-005",
    landlordName: "Tunde Bakare",
    landlordPhone: "+234 813 990 5567",
    submittedAt: "2026-05-12T16:40:00.000Z",
    status: "rejected",
    landlordInfo: {
      landlordType: "individual",
      firstName: "Tunde",
      lastName: "Bakare",
      dateOfBirth: "1982-01-30",
      email: "tunde.bakare@email.com",
      phone: "+234 813 990 5567",
      residentialAddress: "45 Herbert Macaulay Way, Yaba, Lagos",
      meansOfIdentification: { name: "National ID Card", url: "/mock-documents/means-of-id.pdf" },
      photoOfIdentification: { name: "Passport Photograph", url: "/mock-documents/photo-id.pdf" },
    },
    services: ["Rent Collection"],
    properties: [
      {
        id: "ob-005-p1",
        name: "Yaba Mini Flat",
        description: "Single room self-contained unit.",
        address: "45 Herbert Macaulay Way, Yaba, Lagos",
        occupancyStatus: "vacant",
        documents: [],
        ownershipDocument: { name: "Certificate of Occupancy", url: "/mock-documents/proof-of-ownership.pdf" },
      },
    ],
  },
];
