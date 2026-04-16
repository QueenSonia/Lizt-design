/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createPropertySchema } from "@/schemas/property.schemas";
import {
  AttachTenantToProperty,
  createProperty,
  createPropertyWithTenant,
  deletePropertyById,
  updateProperty,
  syncPropertyStatuses,
  moveTenantOut,
  cancelScheduledMoveOut,
  getScheduledMoveOuts,
} from "./api";
import { toast } from "sonner";
import { KYCService, TenancyDetails } from "../kyc/kyc.service";
import { renewTenancy, createPropertyHistoryEntry } from "../tenancy";
import { RenewTenancyDto } from "@/types/tenancy";
import {
  parseApiError,
  shouldRetryError,
  handleApiErrorWithRetry,
} from "@/utilities/errorHandling";
import { error } from "console";

export function useCreatePropertyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formPayload: any) => {
      return await createProperty(formPayload);
    },
    onMutate: () => {
      toast.loading("Creating property...");
    },
    onError: async (error: any) => {
      toast.dismiss();

      // Enhanced error logging
      console.error("Property creation error:", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      // Use enhanced error handling with retry options
      await handleApiErrorWithRetry(error, "property creation", {
        showToast: true,
        checkNetwork: true,
        customErrorMessages: {
          validation: "Please check all property information and try again.",
          serverError:
            "Failed to create property. Please try again in a moment.",
          general: "Failed to create property. Please try again.",
        },
      });
    },
    onSuccess: async (data) => {
      toast.dismiss();
      toast.success("Property created successfully!");

      // Invalidate the query so the page refreshes
      queryClient.invalidateQueries({
        queryKey: ["get-properties"], // same as in useFetchPropertyDetails
      });
      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      const parsedError = parseApiError(error);
      if (
        ["VALIDATION_ERROR", "BAD_REQUEST", "FORBIDDEN"].includes(
          parsedError.code || "",
        )
      ) {
        return false;
      }
      // Retry up to 2 times for network and server errors
      return failureCount < 2 && shouldRetryError(error);
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s
      return Math.min(1000 * Math.pow(2, attemptIndex), 2000);
    },
  });
}

export function useCreatePropertyWithTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formPayload: any) => {
      return await createPropertyWithTenant(formPayload);
    },
    onMutate: () => {
      toast.loading("Creating property with tenant...");
    },
    onError: async (error: any) => {
      toast.dismiss();

      // Enhanced error logging
      console.error("Property with tenant creation error:", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      // Extract the error message
      let errorMessage =
        "Failed to create property with tenant. Please try again.";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Show user-friendly toast with longer duration for important messages
      toast.error(errorMessage, {
        duration: 6000, // Show for 6 seconds
        description:
          error?.response?.status === 409 || error?.response?.status === 500
            ? "Please check the information and try again with different values."
            : undefined,
        style: {
          maxWidth: "500px",
        },
      });
    },
    onSuccess: async (data) => {
      toast.dismiss();
      // Show appropriate success message based on KYC status
      let successMessage: string;
      if (data?.isExistingTenant) {
        // Use the detailed message from the backend
        successMessage =
          data?.message ||
          "Property created successfully! Existing tenant has been attached.";
      } else {
        successMessage =
          "Property created successfully! KYC link sent to tenant.";
      }
      toast.success(successMessage);

      // Invalidate the query so the page refreshes
      queryClient.invalidateQueries({
        queryKey: ["get-properties"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tenants"],
      });
      queryClient.invalidateQueries({
        queryKey: ["kyc-applications"],
      });
      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
    retry: (failureCount, error) => {
      // Don't retry on validation errors, conflicts, or client errors
      const parsedError = parseApiError(error);
      if (
        ["VALIDATION_ERROR", "BAD_REQUEST", "FORBIDDEN", "CONFLICT"].includes(
          parsedError.code || "",
        )
      ) {
        return false;
      }
      // Don't retry on 409 Conflict or 500 errors with specific messages
      if (error?.response?.status === 409 || error?.status === 409) {
        return false;
      }
      // Don't retry on 500 errors that are actually user errors (duplicate phone, etc.)
      if (
        (error?.response?.status === 500 || error?.status === 500) &&
        error?.response?.data?.message?.includes("already registered")
      ) {
        return false;
      }
      // Retry up to 2 times for network and server errors only
      return failureCount < 2 && shouldRetryError(error);
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s
      return Math.min(1000 * Math.pow(2, attemptIndex), 2000);
    },
  });
}

export function useUpdatePropertyMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formPayload: any) => {
      console.log("formPayload:", formPayload);
      return await updateProperty(formPayload, id);
    },
    onMutate: async (variables) => {
      // Show loading toast for status changes
      if (variables.property_status === "inactive") {
        toast.loading("Deactivating property...");
      } else if (variables.property_status === "vacant") {
        toast.loading("Reactivating property...");
      } else {
        toast.loading("Updating property...");
      }

      // Cancel any outgoing refetches to avoid optimistic update conflicts
      await queryClient.cancelQueries({
        queryKey: ["get-property-details-with-history", id],
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData([
        "get-property-details-with-history",
        id,
      ]);

      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // Dismiss loading toast
      toast.dismiss();

      console.error("Property update error:", error.message);

      // Rollback optimistic update if we had one
      if (context?.previousData) {
        queryClient.setQueryData(
          ["get-property-details-with-history", id],
          context.previousData,
        );
      }

      // Show specific error message
      toast.error(error.message || "An error occurred during property update.");
    },
    onSuccess: async (data, variables) => {
      // Dismiss loading toast
      toast.dismiss();

      // Show appropriate success message based on what was updated
      if (variables.property_status === "inactive") {
        toast.success("Property deactivated successfully");
      } else if (variables.property_status === "vacant") {
        toast.success("Property reactivated successfully");
      } else {
        toast.success("Property updated successfully");
      }

      // Refresh the specific property details and properties list
      queryClient.invalidateQueries({
        queryKey: ["get-property-details-with-history", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["get-properties-by-id", id],
      });
      // Invalidate all variations of the properties list query
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });

      return data;
    },
    onSettled: () => {
      // Always dismiss any remaining loading toasts
      toast.dismiss();
    },
  });
}

// export function useDeletePropertyMutation() {
//   return useMutation({
//     mutationFn: async (id: string) => {
//       return await deletePropertyById(id);
//     },
//     onMutate: () => {

//     },
//     onError: (error: any) => {
//       console.error(error);
//       toast.error(error || "An error occurred during property deletion.");
//     },
//     onSuccess: () => {
//       toast.success("Property deleted successfully");
//     },
//   });
// }

export function useDeletePropertyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePropertyById,
    onMutate: () => {
      toast.loading("Deleting property...");
    },
    onSuccess: (data) => {
      toast.dismiss();
      toast.success(data.message || "Property deleted successfully!");

      // invalidate the properties list so it is refreshed automatically
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });
    },
    onError: (error: Error) => {
      toast.dismiss();
      console.error("Property deletion error:", error.message);
      toast.error(error.message || "Failed to delete property.");
    },
    onSettled: () => {
      // Always dismiss any remaining loading toasts
      toast.dismiss();
    },
  });
}

export function useAssignTenantToProperty(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formPayload: any) => {
      return await AttachTenantToProperty(id, formPayload);
    },
    onMutate: () => {
      toast.loading("Assigning tenant to property...");
    },
    onError: (error: any) => {
      toast.dismiss();
      console.error(error.message);
      toast.error(
        error.message || "An error occurred during tenant assignment.",
      );
    },
    onSuccess: async (data) => {
      toast.dismiss();
      toast.success("Tenant has been assigned to property successfully");

      // Refresh property data to show updated status and KYC information
      // Requirements: 6.4 - Ensure proper data refresh after tenant attachment
      queryClient.invalidateQueries({
        queryKey: ["get-properties-by-id", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["get-property-details-with-history", id],
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });
      // Refresh the tenant list to show newly assigned tenants
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenants",
      });

      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
  });
}

export function useSyncPropertyStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await syncPropertyStatuses();
    },
    onMutate: () => {
      toast.loading("Syncing property statuses...");
    },
    onError: (error: any) => {
      toast.dismiss();
      console.error(error.message);
      toast.error(
        error.message || "An error occurred while syncing property statuses.",
      );
    },
    onSuccess: async (data: {
      message: string;
      statusUpdates: number;
      historyRecordsCreated: number;
    }) => {
      toast.dismiss();

      let successMessage = "Property statuses synchronized successfully!";
      if (data.statusUpdates > 0 || data.historyRecordsCreated > 0) {
        successMessage += ` Updated ${data.statusUpdates} property statuses and created ${data.historyRecordsCreated} missing history records.`;
      }

      toast.success(successMessage);

      // Refresh the properties list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });

      return data;
    },
  });
}

export function useMoveTenantOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      property_id: string;
      tenant_id: string;
      move_out_date: string;
      move_out_reason?: string;
      owner_comment?: string;
    }) => {
      return await moveTenantOut(data);
    },
    onMutate: () => {
      toast.loading("Ending tenancy...");
    },
    onError: async (error: any, variables) => {
      toast.dismiss();

      // Enhanced error logging for debugging
      console.error("End tenancy mutation error:", {
        error: error instanceof Error ? error.message : String(error),
        propertyId: variables.property_id,
        tenantId: variables.tenant_id,
        moveOutDate: variables.move_out_date,
        reason: variables.move_out_reason,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined,
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      // Use enhanced error handling with retry options
      await handleApiErrorWithRetry(error, "end tenancy", {
        showToast: true,
        checkNetwork: true,
        onRetry: async () => {
          // Retry the mutation
          try {
            await moveTenantOut(variables);
            toast.success("Tenancy ended successfully!");

            // Refresh data after successful retry
            queryClient.invalidateQueries({
              queryKey: ["get-property-details-with-history"],
            });
            queryClient.invalidateQueries({
              predicate: (query) => query.queryKey[0] === "get-properties",
            });
          } catch (retryError) {
            console.error("Retry failed for end tenancy:", retryError);
            const parsedRetryError = parseApiError(retryError);
            toast.error(
              parsedRetryError.message ||
                "Retry failed. Please try again manually.",
            );
          }
        },
      });
    },
    onSuccess: async (data, variables) => {
      toast.dismiss();

      // Log successful tenancy end for debugging
      console.log("Tenancy end successful:", {
        propertyId: variables.property_id,
        tenantId: variables.tenant_id,
        scheduled: data.scheduled,
        effectiveDate: data.effective_date,
        timestamp: new Date().toISOString(),
      });

      if (data.scheduled) {
        toast.success(
          `Tenancy end scheduled for ${data.effective_date}. The tenant will be automatically moved out on that date.`,
        );
      } else {
        toast.success("Tenancy ended successfully!");
      }

      // Refresh the property details and properties list
      queryClient.invalidateQueries({
        queryKey: ["get-property-details-with-history"],
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });
      // Refresh the tenant list to remove tenants who no longer have active assignments
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenants",
      });
      // Refresh the specific tenant detail to update history
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenant",
      });

      return data;
    },
    onSettled: () => {
      // Always dismiss any remaining loading toasts
      toast.dismiss();
    },
    retry: (failureCount, error) => {
      // Implement smart retry logic
      const parsedError = parseApiError(error);

      // Don't retry on validation errors, not found, or forbidden
      if (
        ["VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN", "BAD_REQUEST"].includes(
          parsedError.code || "",
        )
      ) {
        return false;
      }

      // Retry up to 2 times for network and server errors
      return failureCount < 2 && shouldRetryError(error);
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
    },
  });
}

/**
 * Hook for refreshing property data after tenant attachment
 * Requirements: 6.4 - Ensure proper data refresh after tenant attachment
 */
export function useRefreshPropertyDataMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      // This doesn't make an API call, just refreshes cached data
      await queryClient.invalidateQueries({
        queryKey: ["get-properties-by-id", propertyId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["get-property-details-with-history", propertyId],
      });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Property data refreshed successfully!");
    },
    onError: (error: any) => {
      console.error("Property data refresh error:", error);
      toast.error("Failed to refresh property data");
    },
  });
}

// KYC-related mutations for property components
// Requirements: 1.1, 3.1, 4.1, 5.1 - Add mutations for KYC link generation and tenant attachment

/**
 * Hook for generating KYC links for properties
 * Requirements: 1.1 - Generate KYC link for vacant properties
 */
export function useGenerateKYCLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      return await KYCService.generateGeneralKYCLink();
    },
    onMutate: () => {
      toast.loading("Generating KYC link...");
    },
    onError: (error: any) => {
      toast.dismiss();
      console.error("KYC link generation error:", error.message);
      toast.error(
        error.message || "Failed to generate KYC link. Please try again.",
      );
    },
    onSuccess: (data) => {
      toast.dismiss();
      toast.success("KYC link generated successfully!");
      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
  });
}

/**
 * Hook for resending KYC completion links
 */
export function useResendKYCCompletionLinkMutation() {
  return useMutation({
    mutationFn: async (applicationId: string) => {
      return await KYCService.resendKYCCompletionLink(applicationId);
    },
    onMutate: () => {
      toast.loading("Resending KYC completion link...");
    },
    onError: (error: any) => {
      toast.dismiss();
      console.error("Resend KYC error:", error.message);
      toast.error(
        error.message ||
          "Failed to resend KYC completion link. Please try again.",
      );
    },
    onSuccess: (data) => {
      toast.dismiss();
      toast.success("KYC completion link resent successfully!");
      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
  });
}

/**
 * Hook for attaching tenants to properties from KYC applications
 * Requirements: 5.1 - Attach tenant to property with tenancy details
 */
export function useAttachTenantFromKYCMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      tenancyDetails,
    }: {
      applicationId: string;
      tenancyDetails: TenancyDetails;
    }) => {
      return await KYCService.attachTenantToProperty(
        applicationId,
        tenancyDetails,
      );
    },
    onMutate: () => {
      toast.loading("Attaching tenant to property...");
    },
    onError: (error: any) => {
      toast.dismiss();
      console.error("Tenant attachment error:", error.message);
      toast.error(
        error.message || "Failed to attach tenant. Please try again.",
      );
    },
    onSuccess: (data, variables) => {
      toast.dismiss();
      toast.success("Tenant attached successfully!");

      console.log(
        "Tenant attachment successful, clearing cache for property:",
        data.data?.propertyId,
      );

      // More aggressive cache clearing to prevent stale data issues
      // Requirements: 6.4 - Ensure proper data refresh after tenant attachment

      // First, remove all cached data to force fresh fetches
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === "get-property-details-with-history",
      });
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "get-properties-by-id",
      });
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "kyc-applications",
      });
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === "kyc-application-statistics",
      });
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "tenants",
      });
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "tenant",
      });
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "tenants-property-info",
      });
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] === "available-tenants",
      });

      // Also specifically target the property that was updated if we have the propertyId
      const propertyId = data.data?.propertyId;
      if (propertyId) {
        queryClient.removeQueries({
          predicate: (query) =>
            query.queryKey[0] === "get-property-details-with-history" &&
            query.queryKey[1] === propertyId,
        });
        queryClient.removeQueries({
          predicate: (query) =>
            query.queryKey[0] === "get-properties-by-id" &&
            query.queryKey[1] === propertyId,
        });
      }

      // Then invalidate to trigger fresh fetches
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "get-property-details-with-history",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties-by-id",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "kyc-applications",
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "kyc-application-statistics",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenants",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenant",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenants-property-info",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "available-tenants",
      });

      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
  });
}

/**
 * Hook for validating KYC tokens
 * Requirements: 3.5 - Validate KYC tokens for form access
 */
export function useValidateKYCTokenMutation() {
  return useMutation({
    mutationFn: async (token: string) => {
      return await KYCService.validateToken(token);
    },
    onError: (error: any) => {
      console.error("KYC token validation error:", error.message);
      // Don't show toast for validation errors as they're handled in the UI
    },
  });
}

/**
 * Hook for fixing data inconsistencies - admin/landlord only
 * This cleans up orphaned tenant assignments and property status issues
 */
export function useFixDataInconsistenciesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await KYCService.fixDataInconsistencies();
    },
    onMutate: () => {
      toast.loading("Fixing data inconsistencies...", {
        description: "This may take a few moments to complete.",
      });
    },
    onError: (error: any) => {
      toast.dismiss();
      console.error("Data cleanup error:", error.message);
      toast.error(
        error.message ||
          "Failed to fix data inconsistencies. Please try again.",
      );
    },
    onSuccess: (data) => {
      toast.dismiss();
      toast.success("Data inconsistencies fixed successfully!", {
        description: `Cleaned up ${data.cleanedUpTenants} tenants and ${data.cleanedUpProperties} properties.`,
      });

      // Refresh all property and tenant data after cleanup
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "get-property-details-with-history",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties-by-id",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenants",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenant",
      });

      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
  });
}
export function useCancelScheduledMoveOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      return await cancelScheduledMoveOut(scheduleId);
    },
    onMutate: () => {
      toast.loading("Cancelling scheduled move-out...");
    },
    onError: (error: any) => {
      toast.dismiss();
      console.error("Cancel scheduled move-out error:", error.message);
      toast.error(
        error.message ||
          "An error occurred while cancelling the scheduled move-out.",
      );
    },
    onSuccess: async (data) => {
      toast.dismiss();
      toast.success("Scheduled move-out cancelled successfully!");

      // Refresh the scheduled move-outs and property details
      queryClient.invalidateQueries({
        queryKey: ["get-scheduled-move-outs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["get-property-details-with-history"],
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });

      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
  });
}

/**
 * Hook for renewing tenancy with updated terms
 * Requirements: 2.4, 2.5, 5.2, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5, 4.2, 4.3, 4.4, 4.5
 */
export function useRenewTenancyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      propertyTenantId: string;
      renewalData: RenewTenancyDto;
      propertyId?: string;
      previousRentAmount?: number;
    }) => {
      const result = await renewTenancy(
        data.propertyTenantId,
        data.renewalData,
      );

      // Note: Property history is for tenant move-in/move-out records, not event logging
      // Tenancy renewal events are tracked through the PropertyTenant entity updates

      return result;
    },
    onMutate: () => {
      toast.loading("Renewing tenancy...");
    },
    onSuccess: (data, variables) => {
      toast.dismiss();
      toast.success("Tenancy renewed successfully!");

      // Log successful renewal for debugging
      console.log("Tenancy renewal successful:", {
        propertyTenantId: variables.propertyTenantId,
        renewalData: variables.renewalData,
        propertyId: variables.propertyId,
        timestamp: new Date().toISOString(),
      });

      // Invalidate relevant queries for data refresh
      // Requirements: 7.4, 7.5 - Refresh property data after successful renewal
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties",
      });
      queryClient.invalidateQueries({
        queryKey: ["get-property-details-with-history"],
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "get-properties-by-id",
      });

      return data;
    },
    onError: async (error: any, variables) => {
      toast.dismiss();

      // Enhanced error logging for debugging
      console.error("Tenancy renewal mutation error:", {
        error: error instanceof Error ? error.message : String(error),
        propertyTenantId: variables.propertyTenantId,
        renewalData: variables.renewalData,
        propertyId: variables.propertyId,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined,
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      // Use enhanced error handling with retry options
      await handleApiErrorWithRetry(error, "tenancy renewal", {
        showToast: true,
        checkNetwork: true,
        onRetry: async () => {
          // Retry the mutation
          try {
            await renewTenancy(
              variables.propertyTenantId,
              variables.renewalData,
            );
            toast.success("Tenancy renewed successfully!");

            // Refresh data after successful retry
            queryClient.invalidateQueries({
              predicate: (query) => query.queryKey[0] === "get-properties",
            });
            queryClient.invalidateQueries({
              queryKey: ["get-property-details-with-history"],
            });
          } catch (retryError) {
            console.error("Retry failed for tenancy renewal:", retryError);
            const parsedRetryError = parseApiError(retryError);
            toast.error(
              parsedRetryError.message ||
                "Retry failed. Please try again manually.",
            );
          }
        },
      });
    },
    onSettled: () => {
      // Always dismiss any remaining loading toasts
      // Requirements: 5.2 - Proper loading state management
      toast.dismiss();
    },
    retry: (failureCount, error) => {
      // Implement smart retry logic
      const parsedError = parseApiError(error);

      // Don't retry on validation errors, not found, or forbidden
      if (
        ["VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN", "BAD_REQUEST"].includes(
          parsedError.code || "",
        )
      ) {
        return false;
      }

      // Retry up to 2 times for network and server errors
      return failureCount < 2 && shouldRetryError(error);
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
    },
  });
}
