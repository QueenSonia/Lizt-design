/* eslint-disable */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deletePropertyById,
  getHistoryByPropertyId,
  getMarketingReadyProperties,
  getProperties,
  getPropertiesById,
  getPropertyDetails,
  getPropertyRent,
  getPropertyServiceRequests,
  fetchAllVacantProperties,
  syncPropertyStatuses,
  getScheduledMoveOuts,
} from "./api";
import { getAdminDashboardAnalytics } from "../users/api";
import { PropertyFilter } from "../interface/filter";
import { PropertyDetail } from "@/types/property";
import { KYCService } from "../kyc/kyc.service";

// Hook for fetching paginated list of properties (for property listing pages)
export function useFetchPropertyDetails(
  params?: PropertyFilter,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: ["get-properties", params],
    queryFn: ({ pageParam = 1 }) =>
      getProperties({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage?.pagination?.hasNextPage) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    enabled: options?.enabled !== false,
    select: (data) => {
      // Flatten all pages into a single array
      const allProperties = data.pages.flatMap((page) =>
        page.properties.map((property: any) => {
          // Find active rent for this property
          const activeRent = property?.rents?.find(
            (item: any) => item.rent_status === "active",
          );

          return {
            id: property.id,
            name: property.name,
            address: property.description,
            location: property.location,
            status:
              property.property_status === "inactive"
                ? "Inactive"
                : property.property_status === "offer_pending"
                  ? "Offer Pending"
                  : property.property_status === "offer_accepted"
                    ? "Offer Accepted"
                    : property.property_status === "ready_for_marketing"
                      ? "Vacant"
                      : activeRent
                        ? "Occupied"
                        : "Vacant",
            activeStatus:
              property.property_status === "inactive" ? "Inactive" : "Active",
            tenantName: activeRent?.tenant?.user
              ? (() => {
                  const user = activeRent.tenant.user;
                  // tenant_kycs is an array, get first element (filtered by admin_id on backend)
                  const tenantKyc = user.tenant_kycs?.[0];

                  // Prioritize TenantKyc data over User data for consistency and security
                  const firstName = tenantKyc?.first_name ?? user.first_name;
                  const lastName = tenantKyc?.last_name ?? user.last_name;

                  // Handle cases where lastName might be empty or null
                  if (firstName) {
                    return lastName && lastName.trim() !== ""
                      ? `${firstName} ${lastName}`
                      : firstName; // Return just first name if lastName is empty
                  }
                  return null;
                })()
              : null,
            rentAmount: activeRent?.rental_price
              ? Number(activeRent.rental_price)
              : null,
            rentExpiryDate: activeRent?.expiry_date
              ? activeRent.expiry_date
              : null,
            tenancyCycle: activeRent?.payment_frequency || null, // Get payment frequency from the rent record
            phoneNumber: activeRent?.tenant?.user
              ? (() => {
                  const user = activeRent.tenant.user;
                  const tenantKyc = user.tenant_kycs?.[0];
                  return tenantKyc?.phone_number ?? user.phone_number;
                })()
              : null,
            email: activeRent?.tenant?.user
              ? (() => {
                  const user = activeRent.tenant.user;
                  const tenantKyc = user.tenant_kycs?.[0];
                  return tenantKyc?.email ?? user.email;
                })()
              : null,
            leaseStartDate: activeRent?.rent_start_date || null,
            propertyType: property.property_type || "Apartment",
            // Add property's rental_price for marketing purposes (different from active rent amount)
            marketingPrice: property.rental_price
              ? Number(property.rental_price)
              : null,
            isMarketingReady: property.is_marketing_ready ?? false,
            offerLetterCount: property.offer_letter_count || 0,
          };
        }),
      );
      return allProperties;
    },
  });
}

export function useFetchMarketingReadyProperties() {
  return useQuery({
    queryKey: ["get-marketing-ready-properties"],
    queryFn: () => getMarketingReadyProperties(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: any) => {
      return data?.map((property: any) => ({
        id: property.id,
        name: property.name,
        location: property.location,
        status:
          property.property_status === "offer_pending"
            ? "Offer Pending"
            : property.property_status === "offer_accepted"
              ? "Offer Accepted"
              : property.property_status === "occupied"
                ? "Occupied"
                : "Vacant",
        isMarketingReady: property.is_marketing_ready ?? true,
        marketingPrice: property.rental_price
          ? Number(property.rental_price)
          : null,
      }));
    },
  });
}

const MOCK_VACANT_PROPERTIES = [
  { id: "prop-001", name: "Lekki Phase 1 Duplex", address: "15 Admiralty Way, Lekki Phase 1, Lagos", status: "Vacant" },
  { id: "prop-002", name: "Victoria Island Apartment", address: "3B Ozumba Mbadiwe Ave, Victoria Island, Lagos", status: "Vacant" },
  { id: "prop-003", name: "Ikoyi Terrace", address: "22 Alexander Road, Ikoyi, Lagos", status: "Offer Pending" },
  { id: "prop-004", name: "Ajah Bungalow", address: "7 Addo Road, Ajah, Lagos", status: "Vacant" },
];

export function useFetchAllVacantProperties() {
  return useQuery({
    queryKey: ["get-all-vacant-properties"],
    queryFn: async () => MOCK_VACANT_PROPERTIES,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching all properties (for dropdowns and simple lists)
export function useFetchAllProperties() {
  return useQuery({
    queryKey: ["get-all-properties"],
    queryFn: () => getProperties(),
    refetchOnWindowFocus: false,
    select: (data: any) => {
      return (
        data?.properties?.map((property: any) => ({
          id: property.id,
          name: property.name,
          address: property.description,
          location: property.location,
          status: property.property_status,
        })) || []
      );
    },
  });
}

export function useFetchPropertyById(id: string) {
  return useQuery<PropertyDetail, Error>({
    // Provide the success (PropertyDetail) and error (Error) types
    queryKey: ["get-properties-by-id", id],
    queryFn: () => getPropertiesById(id),
    enabled: !!id, // Ensure query only runs if id is provided
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter stale time for KYC data freshness
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    // 🚀 The entire `select` function is removed!
    // The data arriving here is already in the perfect shape.
  });
}

// Hook for fetching comprehensive property details with history (for property detail pages)
const MOCK_PROPERTY_DETAIL = {
  id: 1,
  name: "Lekki Phase 1 Duplex",
  address: "15 Admiralty Way, Lekki Phase 1, Lagos",
  type: "Duplex",
  bedrooms: 4,
  bathrooms: 3,
  status: "OCCUPIED",
  rent: 1800000,
  serviceCharge: 250000,
  legalFee: 150000,
  agencyFee: 200000,
  additionalFees: [
    { name: "Diesel Fee", amount: 100000 },
  ],
  rentExpiryDate: "2026-12-31",
  pendingRenewalInvoice: null,
  rentalPrice: null,
  isMarketingReady: false,
  description: "A well-maintained 4-bedroom duplex in the heart of Lekki Phase 1.",
  currentTenant: {
    id: "t-001",
    tenancyId: "tenancy-001",
    name: "James Okafor",
    email: "james.okafor@email.com",
    phone: "+234 801 234 5678",
    tenancyStartDate: "2025-01-01",
    paymentCycle: "Annually",
    passportPhoto: undefined,
    renewalStatus: null,
    outstandingBalance: 0,
  },
  history: [],
  kycApplications: [],
  kycApplicationCount: 1,
  pendingApplicationsCount: 0,
  offerLetterCount: 1,
  hasActiveKYCLink: false,
};

export function useFetchPropertyDetailsWithHistory(id: string) {
  return useQuery({
    queryKey: ["get-property-details-with-history", id],
    queryFn: async () => MOCK_PROPERTY_DETAIL,
    enabled: !!id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useFetchPropertyRentById(id: string) {
  return useQuery({
    queryKey: ["get-properties-rent-by-id", id],
    queryFn: () => getPropertyRent(id),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: any) =>
      data.rents.map((rent: any) => ({
        tenantName: rent.tenant.first_name + " " + rent.tenant.last_name,
        moveInDate: new Date(rent.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        moveOutDate: new Date(rent.expiry_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        initialRent: rent.amount_paid,
        currentRent: rent.amount_paid,
        leaseRenewed: rent.status,
        rentIncreases: [
          { amount: "₦500,000", date: "4th July,2021" },
          { amount: "₦200,000", date: "2nd March,2020" },
        ],
      })),
  });
}

export function useFetchServiceRequestById(id: string) {
  return useQuery({
    queryKey: ["get-service-request-by-id", id],
    queryFn: () => getPropertyServiceRequests(id),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: any) =>
      data.service_requests.map((service_request: any) => ({
        issueType: service_request.issue_category,
        dateReported: new Date(service_request.created_at).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        ),
        status: service_request.status,
        resolutionDate: new Date(
          service_request.effective_date,
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      })),
  });
}

export function useAdminDashboardAnalytics() {
  return useQuery({
    queryKey: ["admin-dashboard-analytics"],
    queryFn: getAdminDashboardAnalytics,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useFetchHistoryByPropertyId(id: string) {
  return useQuery({
    queryKey: ["fetch-property-history"],
    queryFn: () => getHistoryByPropertyId(id),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: any) =>
      data.map((item: any) => ({
        id: item.id,
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        type: item.type,
        description: item.description,
        status: item.status,
      })),
  });
}

// KYC-related queries for property components
// Requirements: 1.1, 3.1, 4.1, 5.1 - Add queries for fetching KYC applications by property

/**
 * Hook for fetching KYC applications for a specific property
 * Requirements: 4.1 - Display KYC applications for property owners
 */
export function useFetchKYCApplicationsByProperty(
  propertyId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["kyc-applications", propertyId],
    queryFn: () => KYCService.getApplicationsByProperty(propertyId),
    enabled: !!propertyId && enabled,
    staleTime: 1 * 60 * 1000, // 1 minute - fresh data for KYC applications
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    retry: (failureCount, error: any) => {
      // Don't retry on authentication or permission errors
      if (
        error?.message?.includes("session has expired") ||
        error?.message?.includes("permission") ||
        error?.message?.includes("not found")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000, // 1 second retry delay
  });
}

/**
 * Hook for fetching KYC application statistics for a property
 * Requirements: 4.1 - Show application count and status
 */
export function useFetchKYCApplicationStatistics(
  propertyId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["kyc-application-statistics", propertyId],
    queryFn: () => KYCService.getApplicationStatistics(propertyId),
    enabled: !!propertyId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    retry: 1, // Only retry once for statistics
  });
}

/**
 * Hook for fetching KYC applications by tenant ID
 * Requirements: 4.5, 6.4 - Display KYC application history in tenant details
 */
export function useFetchKYCApplicationsByTenant(
  tenantId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["kyc-applications-by-tenant", tenantId],
    queryFn: () => KYCService.getApplicationsByTenant(tenantId),
    enabled: !!tenantId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - fresh data for tenant KYC history
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    retry: (failureCount, error: any) => {
      // Don't retry on authentication or permission errors
      if (
        error?.message?.includes("session has expired") ||
        error?.message?.includes("permission") ||
        error?.message?.includes("not found")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000, // 1 second retry delay
    // Ensure we always return an array even on error
    select: (data) => {
      return Array.isArray(data) ? data : [];
    },
  });
}

const MOCK_KYC_APPLICATIONS: Record<string, any> = {
  "kyc-001": {
    id: "kyc-001",
    propertyId: "prop-1",
    status: "approved",
    firstName: "James",
    lastName: "Okafor",
    email: "james.okafor@email.com",
    phoneNumber: "+234 801 234 5678",
    contactAddress: "14 Admiralty Way, Lekki Phase 1, Lagos",
    dateOfBirth: "1988-03-15",
    gender: "Male",
    nationality: "Nigerian",
    stateOfOrigin: "Imo",
    maritalStatus: "Married",
    religion: "Christianity",
    employmentStatus: "employed",
    occupation: "Software Engineer",
    jobTitle: "Senior Engineer",
    employerName: "TechCorp Nigeria Ltd",
    employerAddress: "Plot 3 Adeola Odeku, Victoria Island, Lagos",
    workPhoneNumber: "+234 700 123 4567",
    monthlyNetIncome: "750000",
    lengthOfEmployment: "5 years",
    nextOfKinFullName: "Grace Okafor",
    nextOfKinAddress: "22 Okwu Street, Owerri, Imo State",
    nextOfKinRelationship: "Spouse",
    nextOfKinPhoneNumber: "+234 806 123 4567",
    nextOfKinEmail: "grace.okafor@email.com",
    intendedUseOfProperty: "Residential",
    numberOfOccupants: "4",
    parkingNeeds: "1 car space",
    proposedRentAmount: 1200000,
    rentPaymentFrequency: "Annually",
    property: { name: "Lekki Heights", address: "12 Admiralty Way, Lekki", status: "occupied" },
    submissionDate: "2024-01-10T09:00:00Z",
    outstandingBalance: 120000,
    creditBalance: 0,
  },
  "kyc-002": {
    id: "kyc-002",
    propertyId: "prop-2",
    status: "approved",
    firstName: "Amina",
    lastName: "Bello",
    email: "amina.bello@email.com",
    phoneNumber: "+234 802 345 6789",
    contactAddress: "7 Bourdillon Crescent, Ikoyi, Lagos",
    dateOfBirth: "1992-07-22",
    gender: "Female",
    nationality: "Nigerian",
    stateOfOrigin: "Kano",
    maritalStatus: "Single",
    religion: "Islam",
    employmentStatus: "employed",
    occupation: "Banker",
    jobTitle: "Relationship Manager",
    employerName: "First Bank of Nigeria",
    employerAddress: "Marina, Lagos Island",
    workPhoneNumber: "+234 700 234 5678",
    monthlyNetIncome: "980000",
    lengthOfEmployment: "3 years",
    nextOfKinFullName: "Ibrahim Bello",
    nextOfKinAddress: "15 Kingsway Road, Ikoyi, Lagos",
    nextOfKinRelationship: "Father",
    nextOfKinPhoneNumber: "+234 807 234 5678",
    nextOfKinEmail: "ibrahim.bello@email.com",
    intendedUseOfProperty: "Residential",
    numberOfOccupants: "2",
    parkingNeeds: "1 car space",
    proposedRentAmount: 2500000,
    rentPaymentFrequency: "Annually",
    property: { name: "Ikoyi Residences", address: "5 Bourdillon Road, Ikoyi", status: "occupied" },
    submissionDate: "2024-02-20T10:30:00Z",
    offerLetterStatus: "accepted",
    outstandingBalance: 0,
    creditBalance: 0,
  },
  "kyc-003": {
    id: "kyc-003",
    propertyId: "prop-1",
    status: "approved",
    firstName: "Chukwuemeka",
    lastName: "Nwosu",
    email: "c.nwosu@email.com",
    phoneNumber: "+234 803 456 7890",
    contactAddress: "9 Akin Adesola, Victoria Island, Lagos",
    dateOfBirth: "1985-11-30",
    gender: "Male",
    nationality: "Nigerian",
    stateOfOrigin: "Anambra",
    maritalStatus: "Married",
    religion: "Christianity",
    employmentStatus: "self-employed",
    occupation: "Business Owner",
    natureOfBusiness: "Import/Export",
    businessName: "Nwosu Enterprises",
    businessAddress: "Alaba International Market, Ojo",
    businessDuration: "8 years",
    monthlyNetIncome: "1200000",
    nextOfKinFullName: "Chioma Nwosu",
    nextOfKinAddress: "9 Akin Adesola, Victoria Island",
    nextOfKinRelationship: "Spouse",
    nextOfKinPhoneNumber: "+234 808 456 7890",
    nextOfKinEmail: "chioma.nwosu@email.com",
    intendedUseOfProperty: "Residential",
    numberOfOccupants: "3",
    proposedRentAmount: 900000,
    rentPaymentFrequency: "Annually",
    property: { name: "Lekki Heights", address: "12 Admiralty Way, Lekki", status: "occupied" },
    submissionDate: "2023-10-28T08:00:00Z",
    outstandingBalance: 45000,
    creditBalance: 0,
  },
  "kyc-004": {
    id: "kyc-004",
    propertyId: "prop-3",
    status: "pending",
    firstName: "Fatima",
    lastName: "Abdullahi",
    email: "fatima.ab@email.com",
    phoneNumber: "+234 804 567 8901",
    contactAddress: "3 Ahmadu Bello Way, Victoria Island",
    dateOfBirth: "1995-04-18",
    gender: "Female",
    nationality: "Nigerian",
    stateOfOrigin: "Kaduna",
    maritalStatus: "Single",
    religion: "Islam",
    employmentStatus: "employed",
    occupation: "Accountant",
    jobTitle: "Senior Accountant",
    employerName: "Deloitte Nigeria",
    monthlyNetIncome: "600000",
    nextOfKinFullName: "Musa Abdullahi",
    nextOfKinRelationship: "Father",
    nextOfKinPhoneNumber: "+234 809 567 8901",
    intendedUseOfProperty: "Residential",
    numberOfOccupants: "1",
    proposedRentAmount: 1800000,
    rentPaymentFrequency: "Annually",
    property: { name: "Victoria Garden City", address: "Block C, VGC, Lagos", status: "vacant" },
    submissionDate: "2024-04-01T14:00:00Z",
    outstandingBalance: 0,
    creditBalance: 0,
  },
  "kyc-005": {
    id: "kyc-005",
    propertyId: "prop-3",
    status: "approved",
    firstName: "Emeka",
    lastName: "Obi",
    email: "emeka.obi@email.com",
    phoneNumber: "+234 805 678 9012",
    contactAddress: "11 Lugard Avenue, Ikoyi, Lagos",
    dateOfBirth: "1980-09-05",
    gender: "Male",
    nationality: "Nigerian",
    stateOfOrigin: "Delta",
    maritalStatus: "Married",
    religion: "Christianity",
    employmentStatus: "employed",
    occupation: "Civil Engineer",
    jobTitle: "Project Manager",
    employerName: "Julius Berger Nigeria",
    monthlyNetIncome: "850000",
    nextOfKinFullName: "Ngozi Obi",
    nextOfKinRelationship: "Spouse",
    nextOfKinPhoneNumber: "+234 810 678 9012",
    intendedUseOfProperty: "Residential",
    numberOfOccupants: "5",
    proposedRentAmount: 1500000,
    rentPaymentFrequency: "Annually",
    property: { name: "Victoria Garden City", address: "Block C, VGC, Lagos", status: "inactive" },
    submissionDate: "2023-05-20T11:00:00Z",
    outstandingBalance: 0,
    creditBalance: 0,
  },
};

/**
 * Hook for fetching a specific KYC application by ID
 * Requirements: 4.5, 6.4 - Display detailed KYC application information
 */
export function useFetchKYCApplicationById(
  applicationId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["kyc-application", applicationId],
    queryFn: async () => {
      const mock = MOCK_KYC_APPLICATIONS[applicationId];
      if (mock) return mock;
      // Fallback: return a minimal mock for unknown IDs
      return {
        id: applicationId,
        status: "approved",
        firstName: "Tenant",
        lastName: "",
        email: "-",
        phoneNumber: "-",
        property: { name: "Unknown Property", address: "-", status: "vacant" },
        submissionDate: new Date().toISOString(),
        outstandingBalance: 0,
        creditBalance: 0,
      };
    },
    enabled: !!applicationId && enabled,
    staleTime: Infinity,
  });
}
export const useFetchScheduledMoveOuts = () => {
  return useQuery({
    queryKey: ["get-scheduled-move-outs"],
    queryFn: getScheduledMoveOuts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
