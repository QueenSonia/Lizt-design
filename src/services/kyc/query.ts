import { useQuery } from "@tanstack/react-query";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3150";

// Types for KYC applications
export interface KYCApplication {
  id: string;
  propertyId: string;
  status: "pending" | "pending_completion" | "approved" | "rejected";
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string | null;
  stateOfOrigin: string | null;
  localGovernmentArea: string | null;
  maritalStatus: string | null;
  employmentStatus: string | null;
  occupation: string | null;
  jobTitle: string | null;
  employerName: string | null;
  employerAddress: string | null;
  monthlyNetIncome: string | null;
  reference1: {
    name: string | null;
    relationship: string | null;
    phoneNumber: string | null;
    email: string | null;
  };
  reference2: {
    name: string | null;
    relationship: string | null;
    phoneNumber: string | null;
    email: string | null;
  } | null;
  submissionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface KYCApplicationsResponse {
  success: boolean;
  applications: KYCApplication[];
  statistics: {
    total: number;
    pending: number;
    pending_completion: number;
    approved: number;
    rejected: number;
  };
}

// Fetch KYC applications for a property
export const useFetchKYCApplications = (propertyId: string) => {
  return useQuery({
    queryKey: ["kyc-applications", propertyId],
    queryFn: async (): Promise<KYCApplicationsResponse> => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/properties/${propertyId}/kyc-applications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch KYC applications: ${response.statusText}`
        );
      }

      const data = await response.json();
      return {
        success: data.success,
        applications: data.applications || [],
        statistics: data.statistics || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      };
    },
    enabled: !!propertyId,
  });
};

// Fetch specific KYC application by ID
export const useFetchKYCApplication = (applicationId: string) => {
  return useQuery({
    queryKey: ["kyc-application", applicationId],
    queryFn: async (): Promise<KYCApplication> => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/kyc-applications/${applicationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch KYC application: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!applicationId,
  });
};

// Fetch KYC applications by tenant ID
export const useFetchTenantKYCApplications = (tenantId: string) => {
  return useQuery({
    queryKey: ["tenant-kyc-applications", tenantId],
    queryFn: async (): Promise<KYCApplication[]> => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/tenants/${tenantId}/kyc-applications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch tenant KYC applications: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.applications || [];
    },
    enabled: !!tenantId,
  });
};
