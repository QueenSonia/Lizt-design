/* eslint-disable @typescript-eslint/no-explicit-any */
// services/users/query.ts
import { useQuery } from "@tanstack/react-query";
import {
  getLandlords,
  getProfile,
  getSingleTenant,
  getTeamMembers,
  getTenantAndPropertyInfo,
  getTenants,
  getWaitlist,
} from "./api";
import { UserFilter } from "../interface/filter";
import { toSentenceCase } from "@/utilities/utilities";
import { SimpleTenant, TenantDetail } from "@/types/tenant";
import { TeamMember } from "@/types/team";
import { getProperties } from "../property/api";
import { KYCService } from "../kyc/kyc.service";
// import { date } from "zod";

export function useFetchTenantDetails(params?: UserFilter) {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => getTenants(params),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    gcTime: 0, // Don't cache data in memory
    select: (data: any) => {
      if (!data?.users || !Array.isArray(data.users)) {
        return [];
      }

      const processedTenants = data.users.map((item: any) => {
        // Get the active rent (most recent or active status)
        const activeRent =
          item?.rents?.find((rent: any) => rent.rent_status === "active") ||
          item?.rents?.[0];

        // Extract tenant name from profile_name or user object
        const firstName =
          item?.user?.first_name || item?.profile_name?.split(" ")[0] || "";
        const lastName =
          item?.user?.last_name || item?.profile_name?.split(" ")[1] || "";

        // Handle empty lastName gracefully - only use lastName if it's not empty
        const fullName = firstName
          ? (lastName && lastName.trim() !== ""
              ? `${toSentenceCase(firstName)} ${toSentenceCase(lastName)}`
              : toSentenceCase(firstName)
            ).trim()
          : item?.profile_name || "Unknown Tenant";

        const processedTenant = {
          id: item?.id || item?.user?.id,
          email: item?.email || item?.user?.email || "-",
          name: fullName || item?.profile_name || "Unknown Tenant",
          phone: item?.user?.phone_number || "-",
          property: activeRent?.property?.name || "No Property",
          rent: activeRent?.rental_price ? Number(activeRent.rental_price) : 0,
          rentStatus:
            activeRent?.rent_status === "active" ? "Paid" : "Due Soon",
          date:
            item?.user?.created_at || item?.created_at
              ? new Date(
                  item?.user?.created_at || item?.created_at,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-",
          rentExpiryDate: activeRent?.expiry_date
            ? new Date(activeRent.expiry_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "-",
          daysUntilExpiry: activeRent?.expiry_date
            ? Math.ceil(
                (new Date(activeRent.expiry_date).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : 0,
        };

        return processedTenant;
      });

      return processedTenants;
    },
  });
}

export function useFetchSingleTenantDetail(tenant_id: string) {
  return useQuery<TenantDetail, Error>({
    queryKey: ["tenant", tenant_id],
    queryFn: async () => {
      // Check if this is a KYC application ID (prefixed with "app-")
      if (tenant_id && tenant_id.startsWith("app-")) {
        const applicationId = tenant_id.replace("app-", "");
        console.log("Fetching KYC application with ID:", applicationId);

        try {
          const application =
            await KYCService.getApplicationById(applicationId);
          console.log("Received KYC application:", application);
          console.log("Employment details:", {
            employmentStatus: application.employmentStatus,
            employerName: application.employerName,
            jobTitle: application.jobTitle,
            monthlyNetIncome: application.monthlyNetIncome,
          });
          console.log("Documents:", application.documents);

          // The service now properly extracts the application from the response
          if (!application || !application.id) {
            console.error("KYC application not found or invalid:", application);
            throw new Error("KYC application not found");
          }

          // Transform KYCApplication to TenantDetail
          const statusMap: Record<
            string,
            "Active" | "Inactive" | "Pending Approval" | "Rejected"
          > = {
            pending: "Pending Approval",
            approved: "Inactive", // Approved but no active rent yet
            rejected: "Rejected",
          };

          const tenantDetail: TenantDetail = {
            id: `app-${application.id}`,
            firstName: application.firstName,
            lastName: application.lastName,
            dateOfBirth: application.dateOfBirth,
            phone: application.phoneNumber,
            email: application.email,
            gender: application.gender,
            stateOfOrigin: application.stateOfOrigin,
            lga: application.localGovernmentArea,
            nationality: application.nationality,
            maritalStatus: application.maritalStatus,
            religion: application.religion || null,

            employmentStatus: application.employmentStatus,
            employerName: application.employerName || null,
            employerAddress: application.employerAddress || null,
            jobTitle: application.jobTitle,
            workEmail: null, // Not in KYC
            monthlyIncome: application.monthlyNetIncome
              ? Number(application.monthlyNetIncome)
              : null,
            employerPhoneNumber: application.employerPhoneNumber || null,
            lengthOfEmployment: application.lengthOfEmployment || null,

            // Self-employed Information
            natureOfBusiness: null, // Not in KYC application
            businessName: null, // Not in KYC application
            businessAddress: null, // Not in KYC application
            businessDuration: null, // Not in KYC application
            occupation: application.jobTitle || null,

            currentAddress: null, // Not explicitly in KYC top level, maybe in documents

            nokName: application.reference1?.name || null,
            nokRelationship: application.reference1?.relationship || null,
            nokPhone: application.reference1?.phoneNumber || null,
            nokEmail: application.reference1?.email || null,
            nokAddress: application.reference1?.address || null,

            guarantorName: application.reference2?.name || null,
            guarantorPhone: application.reference2?.phoneNumber || null,
            guarantorEmail: application.reference2?.email || null,
            guarantorAddress: application.reference2?.address || null,
            guarantorRelationship: application.reference2?.relationship || null,
            guarantorOccupation: null,

            property: "Pending Assignment", // Placeholder
            propertyId: application.propertyId,
            propertyAddress: "Pending Assignment",
            propertyStatus: "Pending", // Added missing field

            whatsAppConnected: false,

            // Outstanding Balance Info
            totalOutstandingBalance: 0,
            outstandingBalanceBreakdown: [],
            paymentTransactions: [],
            totalCreditBalance: 0,
            creditBalance: 0,

            leaseStartDate: null,
            leaseEndDate: null,
            tenancyStatus: statusMap[application.status] || "Pending Approval",

            rentAmount: application.tenantOffer?.proposedRentAmount
              ? Number(application.tenantOffer.proposedRentAmount)
              : 0,
            rentFrequency:
              application.tenantOffer?.rentPaymentFrequency || "Annually",
            rentStatus: "Pending",
            nextRentDue: null,
            outstandingBalance: 0,

            paymentHistory: [],
            maintenanceIssues: [],
            documents: [
              ...(application.documents?.passportPhoto
                ? [
                    {
                      id: "passport",
                      name: "Passport Photo",
                      url: application.documents.passportPhoto,
                      type: "image",
                      uploadDate: application.createdAt,
                    },
                  ]
                : []),
              ...(application.documents?.idDocument
                ? [
                    {
                      id: "id-doc",
                      name: "ID Document",
                      url: application.documents.idDocument,
                      type: "document",
                      uploadDate: application.createdAt,
                    },
                  ]
                : []),
              ...(application.documents?.employmentProof
                ? [
                    {
                      id: "emp-proof",
                      name: "Employment Proof",
                      url: application.documents.employmentProof,
                      type: "document",
                      uploadDate: application.createdAt,
                    },
                  ]
                : []),
            ],
            activeTenancies: [],
            tenancyHistory: [],
            history: [],
            kycInfo: {
              kycStatus:
                application.status === "approved"
                  ? "Verified"
                  : application.status === "rejected"
                    ? "Rejected"
                    : "Pending",
              kycSubmittedDate: application.submissionDate,
              kycDocuments: [
                ...(application.documents?.passportPhoto
                  ? [
                      {
                        type: "Passport Photo",
                        fileUrl: application.documents.passportPhoto,
                      },
                    ]
                  : []),
                ...(application.documents?.idDocument
                  ? [
                      {
                        type: "ID Document",
                        fileUrl: application.documents.idDocument,
                      },
                    ]
                  : []),
                ...(application.documents?.employmentProof
                  ? [
                      {
                        type: "Employment Proof",
                        fileUrl: application.documents.employmentProof,
                      },
                    ]
                  : []),
              ],
            },

            tenantKycId: null,
            passportPhotoUrl: application.documents?.passportPhoto || null,

            intendedUseOfProperty: application.tenantOffer?.intendedUse || null,
            numberOfOccupants:
              application.tenantOffer?.numberOfOccupants || null,
            numberOfCarsOwned:
              application.tenantOffer?.parkingRequirements || null,
            proposedRentAmount:
              application.tenantOffer?.proposedRentAmount || null,
            rentPaymentFrequency:
              application.tenantOffer?.rentPaymentFrequency || null,
            additionalNotes: application.tenantOffer?.additionalNotes || null,

            status: statusMap[application.status] || "Pending Approval",
          };

          return tenantDetail;
        } catch (appError) {
          console.error("Error fetching KYC application:", appError);
          throw new Error(`Failed to fetch KYC application: ${appError}`);
        }
      }

      // For regular tenant IDs, try to get tenant data
      // If the tenant doesn't have property info, try to get their KYC application
      try {
        const tenantData = await getSingleTenant(tenant_id);

        console.log("Backend tenant data:", tenantData);

        // Always try to fetch KYC application to supplement tenant data
        // This is especially important for tenants without active properties
        try {
          console.log("Fetching KYC application for tenant...");
          // Try to find KYC application by tenant ID
          const allApplications = await KYCService.getAllKycApplications();

          // Filter applications for this tenant
          const tenantApplications = allApplications.filter(
            (app: any) => app.tenantId === tenant_id,
          );

          // Prioritize approved applications over pending ones
          const application =
            tenantApplications.find((app: any) => app.status === "approved") ||
            tenantApplications[0]; // Fallback to first if no approved

          console.log("Found KYC application:", application);

          if (application) {
            // Merge KYC data with tenant data
            return {
              ...tenantData,
              kycApplicationId: application.id,
              firstName: application.firstName || tenantData.firstName,
              lastName: application.lastName || tenantData.lastName,
              dateOfBirth: application.dateOfBirth || tenantData.dateOfBirth,
              phone: application.phoneNumber || tenantData.phone,
              email: application.email || tenantData.email,
              gender: application.gender || tenantData.gender,
              stateOfOrigin:
                application.stateOfOrigin || tenantData.stateOfOrigin,
              lga: application.localGovernmentArea || tenantData.lga,
              nationality: application.nationality || tenantData.nationality,
              maritalStatus:
                application.maritalStatus || tenantData.maritalStatus,
              religion: application.religion || tenantData.religion,
              employmentStatus:
                application.employmentStatus || tenantData.employmentStatus,
              employerName: application.employerName || tenantData.employerName,
              employerAddress:
                application.employerAddress || tenantData.employerAddress,
              jobTitle: application.jobTitle || tenantData.jobTitle,
              monthlyIncome: application.monthlyNetIncome
                ? Number(application.monthlyNetIncome)
                : tenantData.monthlyIncome,
              employerPhoneNumber:
                application.employerPhoneNumber ||
                tenantData.employerPhoneNumber,
              lengthOfEmployment:
                application.lengthOfEmployment || tenantData.lengthOfEmployment,
              nokName: application.reference1?.name || tenantData.nokName,
              nokRelationship:
                application.reference1?.relationship ||
                tenantData.nokRelationship,
              nokPhone:
                application.reference1?.phoneNumber || tenantData.nokPhone,
              nokEmail: application.reference1?.email || tenantData.nokEmail,
              nokAddress:
                application.reference1?.address || tenantData.nokAddress,
              guarantorName:
                application.reference2?.name || tenantData.guarantorName,
              guarantorPhone:
                application.reference2?.phoneNumber ||
                tenantData.guarantorPhone,
              guarantorEmail:
                application.reference2?.email || tenantData.guarantorEmail,
              guarantorAddress:
                application.reference2?.address || tenantData.guarantorAddress,
              guarantorRelationship:
                application.reference2?.relationship ||
                tenantData.guarantorRelationship,
              passportPhotoUrl:
                application.documents?.passportPhoto ||
                tenantData.passportPhotoUrl,
              intendedUseOfProperty:
                application.tenantOffer?.intendedUse ||
                tenantData.intendedUseOfProperty,
              numberOfOccupants:
                application.tenantOffer?.numberOfOccupants ||
                tenantData.numberOfOccupants,
              numberOfCarsOwned:
                application.tenantOffer?.parkingRequirements ||
                tenantData.numberOfCarsOwned,
              proposedRentAmount:
                application.tenantOffer?.proposedRentAmount ||
                tenantData.proposedRentAmount,
              rentPaymentFrequency:
                application.tenantOffer?.rentPaymentFrequency ||
                tenantData.rentPaymentFrequency,
              additionalNotes:
                application.tenantOffer?.additionalNotes ||
                tenantData.additionalNotes,
              documents: [
                ...(tenantData.documents || []),
                ...(application.documents?.passportPhoto
                  ? [
                      {
                        id: "passport",
                        name: "Passport Photo",
                        url: application.documents.passportPhoto,
                        type: "image",
                        uploadDate: application.createdAt,
                      },
                    ]
                  : []),
                ...(application.documents?.idDocument
                  ? [
                      {
                        id: "id-doc",
                        name: "ID Document",
                        url: application.documents.idDocument,
                        type: "document",
                        uploadDate: application.createdAt,
                      },
                    ]
                  : []),
                ...(application.documents?.employmentProof
                  ? [
                      {
                        id: "emp-proof",
                        name: "Employment Proof",
                        url: application.documents.employmentProof,
                        type: "document",
                        uploadDate: application.createdAt,
                      },
                    ]
                  : []),
              ],
            };
          }
        } catch (kycError) {
          console.log("Could not fetch KYC application for tenant:", kycError);
        }

        return tenantData;
      } catch (error) {
        console.error("Error fetching tenant:", error);
        throw error;
      }
    },
    enabled: !!tenant_id, // Only run the query if tenant_id is provided
  });
}

export function useFetchTenantAndPropertyInfo() {
  return useQuery({
    queryKey: ["tenants-property-info"],
    queryFn: () => getTenantAndPropertyInfo(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: any) => {
      const activeProperties = data.property_tenants?.filter(
        (item: any) => item.status === "active",
      );

      const getActiveRent = (rents: any[]) => {
        return rents?.find((rent: any) => rent.rent_status === "active");
      };

      if (!activeProperties?.length) return [];

      return activeProperties.map((item: any) => {
        const rent = getActiveRent(item.property?.rents || []);

        return {
          property_name: item.property.name || "",
          description: item.property?.description || "",
          rental_price: rent?.rental_price || 0,
          security_deposit: rent?.security_deposit || 0,
          service_charge: rent?.service_charge || 0,
          lease_start_date: rent?.rent_start_date || null,
          lease_end_date: rent?.expiry_date || null,
        };
      });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["get-user-profile"],
    queryFn: () => getProfile(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useFetchTeamMembers() {
  return useQuery<TeamMember[], Error>({
    queryKey: ["team-members"],
    queryFn: getTeamMembers,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useFetchWaitlist() {
  return useQuery({
    queryKey: ["get-waitlist"],
    queryFn: () => getWaitlist(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useFetchLandlords() {
  return useQuery({
    queryKey: ["get-landlord"],
    queryFn: () => getLandlords(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useFetchAvailableTenants() {
  return useQuery({
    queryKey: ["available-tenants"],
    queryFn: () => getTenants(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: any) => {
      if (!data?.users) return [];

      return data.users.map((item: any) => ({
        id: item?.id,
        name:
          item?.profile_name ||
          `${item?.tenant?.user?.first_name || ""} ${
            item?.tenant?.user?.last_name || ""
          }`.trim(),
        email: item?.email || item?.tenant?.user?.email || "",
        phone_number: item?.tenant?.user?.phone_number || "",
        profile_name: item?.profile_name,
      })) as SimpleTenant[];
    },
  });
}

/**
 * Alternative tenant fetching that uses property data to get ALL tenants with active rents
 * This ensures we don't miss any tenants who are assigned to properties
 */
export function useFetchTenantDetailsFromProperties(params?: UserFilter) {
  return useQuery({
    queryKey: ["tenants-from-properties", params],
    queryFn: () => getProperties({ page: 1, size: 1000 }), // Get all properties
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
    select: (data: any) => {
      if (!data?.properties || !Array.isArray(data.properties)) {
        return [];
      }

      const tenantMap = new Map(); // Use Map to avoid duplicates

      data.properties.forEach((property: any) => {
        // Find active rent for this property
        const activeRent = property?.rents?.find(
          (rent: any) => rent.rent_status === "active",
        );

        if (activeRent?.tenant?.user) {
          const user = activeRent.tenant.user;
          // tenant_kycs is an array, get first element (filtered by admin_id on backend)
          const tenantKyc = user.tenant_kycs?.[0];
          const tenantId = activeRent.tenant.id;

          // Skip if we already processed this tenant
          if (tenantMap.has(tenantId)) {
            return;
          }

          // Extract tenant name with same logic as property query
          const firstName = tenantKyc?.first_name ?? user.first_name;
          const lastName = tenantKyc?.last_name ?? user.last_name;

          const fullName = firstName
            ? (lastName && lastName.trim() !== ""
                ? `${toSentenceCase(firstName)} ${toSentenceCase(lastName)}`
                : toSentenceCase(firstName)
              ).trim()
            : "Unknown Tenant";

          const processedTenant = {
            id: tenantId,
            email: tenantKyc?.email ?? user.email ?? "-",
            name: fullName,
            phone: tenantKyc?.phone_number ?? user.phone_number ?? "-",
            property: property.name || "No Property",
            rent: activeRent?.rental_price
              ? Number(activeRent.rental_price)
              : 0,
            rentStatus:
              activeRent?.rent_status === "active" ? "Paid" : "Due Soon",
            date: user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-",
            rentExpiryDate: activeRent?.expiry_date
              ? new Date(activeRent.expiry_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-",
            daysUntilExpiry: activeRent?.expiry_date
              ? Math.ceil(
                  (new Date(activeRent.expiry_date).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0,
          };

          tenantMap.set(tenantId, processedTenant);
        }
      });

      const tenants = Array.from(tenantMap.values());
      return tenants;
    },
  });
}

const MOCK_TENANTS_WITH_KYC = [
  {
    id: "t-001",
    kycApplicationId: "kyc-001",
    email: "james.okafor@email.com",
    name: "James Okafor",
    phone: "+234 801 234 5678",
    property: "Lekki Heights",
    rent: 1200000,
    outstandingBalance: 0,
    rentStatus: "Paid",
    status: "Active",
    date: "Jan 15, 2024",
    rentExpiryDate: "Jan 15, 2025",
    daysUntilExpiry: 280,
  },
  {
    id: "t-002",
    kycApplicationId: "kyc-002",
    email: "amina.bello@email.com",
    name: "Amina Bello",
    phone: "+234 802 345 6789",
    property: "Ikoyi Residences",
    rent: 2500000,
    outstandingBalance: 2500000,
    rentStatus: "Paid",
    status: "Active",
    date: "Mar 1, 2024",
    rentExpiryDate: "Mar 1, 2025",
    daysUntilExpiry: 325,
  },
  {
    id: "t-003",
    kycApplicationId: "kyc-003",
    email: "c.nwosu@email.com",
    name: "Chukwuemeka Nwosu",
    phone: "+234 803 456 7890",
    property: "Lekki Heights",
    rent: 900000,
    outstandingBalance: 450000,
    rentStatus: "Due Soon",
    status: "Active",
    date: "Nov 5, 2023",
    rentExpiryDate: "Nov 5, 2024",
    daysUntilExpiry: 15,
  },
  {
    id: "app-kyc-004",
    kycApplicationId: "kyc-004",
    email: "fatima.ab@email.com",
    name: "Fatima Abdullahi",
    phone: "+234 804 567 8901",
    property: "Not Assigned",
    rent: 0,
    outstandingBalance: 0,
    rentStatus: "-",
    status: "Pending Approval",
    date: "Apr 1, 2024",
    rentExpiryDate: "-",
    daysUntilExpiry: 0,
  },
  {
    id: "t-004",
    kycApplicationId: "kyc-005",
    email: "emeka.obi@email.com",
    name: "Emeka Obi",
    phone: "+234 805 678 9012",
    property: "Not Assigned",
    rent: 0,
    outstandingBalance: 0,
    rentStatus: "-",
    status: "Inactive",
    date: "Jun 10, 2023",
    rentExpiryDate: "-",
    daysUntilExpiry: 0,
  },
];

export function useFetchAllTenantsWithKyc(_params?: UserFilter) {
  return useQuery({
    queryKey: ["all-tenants-with-kyc"],
    queryFn: async () => MOCK_TENANTS_WITH_KYC,
    select: (data: any) => data,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useFetchAllTenantsWithKycReal(params?: UserFilter) {
  return useQuery({
    queryKey: ["all-tenants-with-kyc", params],
    queryFn: async () => {
      // Fetch both properties (for active rents) and KYC applications
      const [propertiesData, kycApplications] = await Promise.all([
        getProperties({ page: 1, size: 1000 }),
        KYCService.getAllKycApplications(),
      ]);
      return { properties: propertiesData?.properties || [], kycApplications };
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
    select: (data: any) => {
      const { properties, kycApplications } = data;
      const tenantMap = new Map();

      // 1. Process Active Rents from Properties (Source of Truth for Active Tenants)
      properties.forEach((property: any) => {
        const activeRent = property?.rents?.find(
          (rent: any) => rent.rent_status === "active",
        );

        if (activeRent?.tenant?.user) {
          const user = activeRent.tenant.user;
          // tenant_kycs is an array, get first element (filtered by admin_id on backend)
          const tenantKyc = user.tenant_kycs?.[0];
          const tenantId = activeRent.tenant.id;

          const firstName = tenantKyc?.first_name ?? user.first_name;
          const lastName = tenantKyc?.last_name ?? user.last_name;
          const fullName = firstName
            ? (lastName && lastName.trim() !== ""
                ? `${toSentenceCase(firstName)} ${toSentenceCase(lastName)}`
                : toSentenceCase(firstName)
              ).trim()
            : "Unknown Tenant";

          // Calculate days until expiry with better date handling
          let daysUntilExpiry = 0;
          const expiryDate = activeRent?.expiry_date;

          if (expiryDate) {
            try {
              const endDate = new Date(expiryDate);
              const today = new Date();
              // Reset time to midnight for accurate day calculation
              today.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);

              const diffTime = endDate.getTime() - today.getTime();
              daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } catch (error) {
              console.error(
                "Error calculating days until expiry:",
                error,
                expiryDate,
              );
              daysUntilExpiry = 0;
            }
          }

          tenantMap.set(tenantId, {
            id: tenantId,
            email: tenantKyc?.email ?? user.email ?? "-",
            name: fullName,
            phone: tenantKyc?.phone_number ?? user.phone_number ?? "-",
            property: property.name || "No Property",
            rent: activeRent?.rental_price
              ? Number(activeRent.rental_price)
              : 0,
            rentStatus: "Paid",
            status: "Active",
            created_at: user?.created_at || null,
            date: user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-",
            rentExpiryDate: expiryDate
              ? new Date(expiryDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-",
            daysUntilExpiry: daysUntilExpiry,
          });
        }
      });

      // 2. Process KYC Applications (Source for Pending/Inactive/Rejected)
      kycApplications.forEach((app: any) => {
        // If we already have this tenant (Active), skip
        if (app.tenantId && tenantMap.has(app.tenantId)) {
          return;
        }

        // If tenantId exists but not in map -> Inactive (Approved but no active rent)
        if (app.tenantId) {
          const fullName = `${toSentenceCase(app.firstName)} ${toSentenceCase(
            app.lastName,
          )}`.trim();

          tenantMap.set(app.tenantId, {
            id: app.tenantId,
            email: app.email || "-",
            name: fullName,
            phone: app.phoneNumber || "-",
            property: "Not Assigned", // Or find property name if we have it
            rent: 0,
            rentStatus: "-",
            status: "Inactive",
            created_at: app.createdAt || null,
            date: app.createdAt
              ? new Date(app.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-",
            rentExpiryDate: "-",
            daysUntilExpiry: 0,
          });
          return;
        }

        // If no tenantId -> Pending or Rejected
        // Use application ID as key since there is no tenant ID
        const fullName = `${toSentenceCase(app.firstName)} ${toSentenceCase(
          app.lastName,
        )}`.trim();

        // Determine status based on application status
        let status = "Pending Approval";
        if (app.status === "rejected") status = "Rejected";
        if (app.status === "approved") status = "Inactive"; // Should have tenantId if approved, but fallback

        tenantMap.set(`app-${app.id}`, {
          id: `app-${app.id}`,
          email: app.email || "-",
          name: fullName,
          phone: app.phoneNumber || "-",
          property: "Not Assigned",
          rent: 0,
          rentStatus: "-",
          status: status,
          created_at: app.createdAt || null,
          date: app.createdAt
            ? new Date(app.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "-",
          rentExpiryDate: "-",
          daysUntilExpiry: 0,
        });
      });

      const finalTenants = Array.from(tenantMap.values());

      // Debug: Log tenant data to identify duplicates
      console.log("🔍 Final Tenant List Debug:", {
        totalTenants: finalTenants.length,
        tenantIds: finalTenants.map((t) => t.id),
        tenantNames: finalTenants.map((t) => t.name),
        duplicateNames: finalTenants.filter(
          (t, i, arr) =>
            arr.findIndex(
              (other) => other.name === t.name && other.id !== t.id,
            ) !== -1,
        ),
        punkBabyEntries: finalTenants.filter((t) =>
          t.name.includes("Punk Baby"),
        ),
      });

      return finalTenants;
    },
  });
}
// END _useFetchAllTenantsWithKyc_REAL
