/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
  createServiceRequest,
  updateTenantKyc,
  attachTenantToProperty,
} from "./api";
import { toast } from "sonner";

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: async (data) => {
      toast.success(data?.message || "Service Request Created Successfully");
      queryClient.invalidateQueries({
        queryKey: queryKeys.getTenantServiceRequests(data.property_id),
      });
    },
    onError: (error: any) => {
      console.error("Error creating Service Request:", error);
      toast.error(error?.response?.data?.message || "Error creating space");
    },
  });
}
export function useUpdateTenantKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      kycId,
      data,
      tenantId,
    }: {
      kycId: string;
      data: any;
      tenantId?: string;
    }) => updateTenantKyc(kycId, data, tenantId),
    onSuccess: async () => {
      toast.success("KYC information updated successfully");
      // Invalidate all relevant queries including the specific tenant
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-kyc"] });
      queryClient.invalidateQueries({ queryKey: ["tenant"] }); // This will invalidate all tenant queries
      queryClient.invalidateQueries({ queryKey: ["tenant-kyc-applications"] });
    },
    onError: (error: any) => {
      console.error("Error updating tenant KYC:", error);
      toast.error(error?.message || "Failed to update KYC information");
    },
  });
}

export function useAttachTenantToProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: {
        propertyId: string;
        tenancyStartDate: string;
        rentAmount: number;
        rentFrequency: string;
        rentDueDate: string;
        serviceCharge?: number;
      };
    }) => attachTenantToProperty(tenantId, data),
    onSuccess: async () => {
      toast.success("Tenant successfully attached to property");
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property"] });
    },
    onError: (error: any) => {
      console.error("Error attaching tenant to property:", error);
      toast.error(error?.message || "Failed to attach tenant to property");
    },
  });
}
