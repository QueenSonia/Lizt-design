/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  getActiveMaintenanceIssues,
  getServiceRequest,
  getServiceRequestByTenant,
} from "./api";

export function useFetchServiceRequest() {
  return useQuery({
    queryKey: ["service-request"],
    queryFn: getServiceRequest,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data) =>
      (data?.service_requests || []).map((service: any) => ({
        requestid: service.request_id,
        // Fix #16: Use optional chaining — tenant relation may not be loaded
        tenant: service.tenant?.profile_name || service.tenant_name || "—",
        property: service.property?.name || service.property_name || "—",
        title: service.description,
        dateSubmitted: new Date(service.created_at).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" }
        ),
        status: service.status,
      })),
  });
}

export function useFetchServiceRequestByTenant() {
  return useQuery({
    queryKey: ["service-request-tenant"],
    queryFn: getServiceRequestByTenant,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data) =>
      (data?.service_requests || []).map((service: any) => ({
        requestid: service.request_id,
        tenant: service.tenant_name,
        property: service.property?.name || service.property_name || "—",
        issue: service.description,
        dateReported: new Date(service.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: service.status,
      })),
  });
}

export function useActiveMaintenanceIssues() {
  return useQuery({
    queryKey: ["active-maintenance-issues"],
    queryFn: getActiveMaintenanceIssues,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data) =>
      (data?.service_requests || []).map((service: any) => ({
        property: service.property?.name || service.property_name || "—",
        tenant: service.tenant_name,
        // Fix #1: Use actual description instead of hardcoded "leaking pipe"
        issue: service.description,
        dateReported: new Date(service.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: service.status,
      })),
  });
}
