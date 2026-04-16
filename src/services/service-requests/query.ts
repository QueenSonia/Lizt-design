import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../axios-instance";

// Types for Service Requests
export interface StatusHistoryEvent {
  id: string;
  previous_status: string | null;
  new_status: string;
  changed_by_role: string;
  change_reason?: string;
  notes?: string;
  changed_at: string;
  changedBy?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface ServiceRequest {
  id: string;
  request_id: string;
  tenant_name: string;
  property_name: string;
  issue_category: string;
  date_reported: string;
  resolution_date: string | null;
  description: string;
  issue_images: string[] | null;
  resolvedAt: string | null;
  reopened_at: string | null;
  notes: string;
  status:
    | "pending"
    | "open"
    | "in_progress"
    | "resolved"
    | "closed"
    | "reopened"
    | "urgent";
  tenant_id: string;
  property_id: string;
  assigned_to: string | null;
  createdAt: string;
  updatedAt: string;
  created_at: string;
  updated_at: string;
  statusHistory?: StatusHistoryEvent[];
  tenant?: {
    id: string;
    profile_name: string;
    user?: {
      first_name: string;
      last_name: string;
      phone_number: string;
      email: string;
    };
  };
  property?: {
    id: string;
    name: string;
    location: string;
  };
  facilityManager?: {
    id: string;
    account: {
      profile_name: string;
    };
  };
}

export interface ServiceRequestsResponse {
  service_requests: ServiceRequest[];
  pagination: {
    totalRows: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface ServiceRequestFilters {
  page?: number;
  size?: number;
  tenant_id?: string;
  property_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

// Fetch all service requests for landlord
export const useFetchServiceRequests = (filters?: ServiceRequestFilters) => {
  return useQuery({
    queryKey: ["service-requests", filters],
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ServiceRequestsResponse> => {
      try {
        console.log("Fetching service requests with filters:", filters);

        const response = await axiosInstance.get("/service-requests", {
          params: filters,
        });

        console.log("Service requests response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Service requests error:", error);
        const err = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        throw new Error(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch service requests"
        );
      }
    },
  });
};

// Alias for consistency
export const useGetAllServiceRequests = useFetchServiceRequests;

// Fetch single service request by ID
export const useFetchServiceRequest = (id: string) => {
  return useQuery({
    queryKey: ["service-request", id],
    queryFn: async (): Promise<ServiceRequest> => {
      try {
        const response = await axiosInstance.get(`/service-requests/${id}`);
        return response.data;
      } catch (error) {
        const err = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        throw new Error(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch service request"
        );
      }
    },
    enabled: !!id,
  });
};
