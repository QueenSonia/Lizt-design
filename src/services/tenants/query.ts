/* eslint-disable */
import { useQuery } from "@tanstack/react-query";
import {
  getTenantRentDetails,
  getTenantServiceRequest,
  getTenantPropertyHistory,
  getTenantProperty,
  getAdminDetails,
} from "./api";
import { queryKeys } from "./queryKeys";

export function useGetTenantRent(tenant_id: string) {
  return useQuery({
    queryKey: queryKeys.getTenantRent(tenant_id),
    queryFn: () => getTenantRentDetails(tenant_id),
    enabled: !!tenant_id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    //   onError: (error) => {
    //     toast.error(error?.response?.data?.message || "An error occurred while fetching rent");
    //   },
  });
}

export function useGetPropertyHistory(property_id: string) {
  return useQuery({
    queryKey: queryKeys.getTenantPropertyHistory(property_id),
    queryFn: () => getTenantPropertyHistory(property_id),
    enabled: !!property_id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    //   onError: (error) => {
    //     toast.error(error?.response?.data?.message || "An error occurred while fetching property history");
    //   },
  });
}

export function useGetTenantProperty(property_id: string) {
  return useQuery({
    queryKey: queryKeys.getTenantPropertyDetails(property_id),
    queryFn: () => getTenantProperty(property_id),
    enabled: !!property_id,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    //   onError: (error) => {
    //     toast.error(error?.response?.data?.message || "An error occurred while fetching property details");
    //   },
  });
}

export function useFetchTenantServiceRequest(status: string) {
  return useQuery({
    queryKey: ["tenant-service-request"],
    queryFn: () => getTenantServiceRequest(status),
    enabled: !!status,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    select: (data) => {
      return data?.map((service: any) => ({
        id: service.id,
        requestid: service.request_id,
        property: service.property_name,
        tenant: service.tenant_name,
        issue: service.description,
        dateReported: service.date_reported,
        status: service.status,
        created_at: new Date(service.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        date_resolved: new Date(service.resolution_date).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        ),
      }));
    },
  });
}

export function useGetAdminPhoneNumber(user_id: string, fields: string[]) {
  return useQuery({
    queryKey: queryKeys.getAdminPhoneNumber(user_id, fields),
    queryFn: () => getAdminDetails(user_id, fields),
    enabled: !!user_id && !!fields && fields.length > 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    //   onError: (error) => {
    //     toast.error(error?.response?.data?.message || "An error occurred while fetching admin details");
    //   },
  });
}
