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
}

export type OnboardingSubmissionStatus = "pending" | "approved" | "rejected";

export interface OnboardingSubmission {
  id: string;
  landlordName: string;
  landlordPhone: string;
  submittedAt: string;
  status: OnboardingSubmissionStatus;
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
      },
      {
        id: "ob-001-p2",
        name: "Lekki Phase 1 — Boys Quarters",
        description: "Self-contained studio unit within the same compound.",
        address: "14 Admiralty Way, Lekki Phase 1, Lagos",
        occupancyStatus: "vacant",
        documents: [],
      },
    ],
  },
  {
    id: "ob-002",
    landlordName: "Adeyemi Holdings Ltd",
    landlordPhone: "+234 805 220 0099",
    submittedAt: "2026-07-19T14:05:00.000Z",
    status: "pending",
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
      },
    ],
  },
  {
    id: "ob-003",
    landlordName: "Sarah Johnson",
    landlordPhone: "+234 807 441 2233",
    submittedAt: "2026-06-30T11:20:00.000Z",
    status: "approved",
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
      },
    ],
  },
  {
    id: "ob-004",
    landlordName: "Grace Bello",
    landlordPhone: "+234 809 662 4410",
    submittedAt: "2026-07-20T08:15:00.000Z",
    status: "pending",
    properties: [
      {
        id: "ob-004-p1",
        name: "Greenfield Towers — Unit 2A",
        description: "3 bedroom apartment on the 2nd floor, recently renovated.",
        address: "9 Walter Carrington Crescent, Lagos Island",
        occupancyStatus: "vacant",
        documents: [],
      },
      {
        id: "ob-004-p2",
        name: "Greenfield Towers — Unit 2B",
        description: "3 bedroom apartment, mirror layout of Unit 2A.",
        address: "9 Walter Carrington Crescent, Lagos Island",
        occupancyStatus: "vacant",
        documents: [],
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
      },
    ],
  },
  {
    id: "ob-005",
    landlordName: "Tunde Bakare",
    landlordPhone: "+234 813 990 5567",
    submittedAt: "2026-05-12T16:40:00.000Z",
    status: "rejected",
    properties: [
      {
        id: "ob-005-p1",
        name: "Yaba Mini Flat",
        description: "Single room self-contained unit.",
        address: "45 Herbert Macaulay Way, Yaba, Lagos",
        occupancyStatus: "vacant",
        documents: [],
      },
    ],
  },
];
