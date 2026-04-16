import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../axios-instance";
import { KYCService } from "./kyc.service";
import { KYCFormData } from "../../schemas/kyc.schemas";
import { toast } from "sonner";

export interface AttachTenantData {
  rentAmount: number;
  rentDueDate: number;
  rentFrequency: "monthly" | "quarterly" | "bi-annually" | "annually";
  tenancyStartDate?: string;
  securityDeposit?: number;
  serviceCharge?: number;
}

export interface AttachTenantResponse {
  success: boolean;
  message: string;
  data: {
    tenantId: string;
    propertyId: string;
  };
}

interface BackendKYCData {
  tenant_id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  state_of_origin?: string;
  local_government_area?: string;
  marital_status?: string;
  employment_status?: string;
  occupation?: string;
  job_title?: string;
  employer_name?: string;
  employer_address?: string;
  monthly_net_income?: string;
  reference1_name?: string;
  reference1_address?: string;
  reference1_relationship?: string;
  reference1_phone_number?: string;
  reference2_name?: string | null;
  reference2_address?: string | null;
  reference2_relationship?: string | null;
  reference2_phone_number?: string | null;
}

export interface TenantKYCData {
  tenantId?: string; // Add tenant ID
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  stateOfOrigin?: string;
  localGovernmentArea?: string;
  maritalStatus?: string;
  employmentStatus?: string;
  occupation?: string;
  jobTitle?: string;
  employerName?: string;
  employerAddress?: string;
  monthlyNetIncome?: string;
  reference1Name?: string;
  reference1Address?: string;
  reference1Relationship?: string;
  reference1PhoneNumber?: string;
  reference2Name?: string;
  reference2Address?: string;
  reference2Relationship?: string;
  reference2PhoneNumber?: string;
}

export interface TenantKYCResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

// Create or update tenant KYC information
export const useCreateTenantKYCMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kycData: TenantKYCData): Promise<TenantKYCResponse> => {
      // Validate required fields
      if (!kycData.tenantId) {
        throw new Error("Tenant ID is required");
      }
      if (!kycData.firstName?.trim()) {
        throw new Error("First name is required");
      }
      if (!kycData.lastName?.trim()) {
        throw new Error("Last name is required");
      }
      if (!kycData.phoneNumber?.trim()) {
        throw new Error("Phone number is required");
      }

      // Log validation info
      console.log("KYC Validation passed for:", {
        tenantId: kycData.tenantId,
        firstName: kycData.firstName,
        lastName: kycData.lastName,
        phoneNumber: kycData.phoneNumber,
      });

      // Transform frontend data to backend format
      const backendData = {
        tenant_id: kycData.tenantId?.toString(), // Ensure tenant ID is a string
        first_name: kycData.firstName?.trim(),
        last_name: kycData.lastName?.trim(),
        email: kycData.email?.trim() || null, // Send null instead of undefined
        phone_number: kycData.phoneNumber?.trim(),
        date_of_birth:
          kycData.dateOfBirth?.trim() || new Date().toISOString().split("T")[0], // Provide default date
        gender: kycData.gender?.toLowerCase() || "male", // Provide default gender
        nationality: kycData.nationality?.trim() || "Nigerian", // Provide default nationality
        state_of_origin: kycData.stateOfOrigin?.trim() || "", // Provide empty string instead of undefined
        local_government_area: kycData.localGovernmentArea?.trim() || "", // Provide empty string instead of undefined
        marital_status: kycData.maritalStatus?.toLowerCase() || "single", // Provide default marital status
        employment_status:
          kycData.employmentStatus?.toLowerCase() || "employed", // Provide default employment status
        occupation: kycData.occupation?.trim() || "——",
        job_title: kycData.jobTitle?.trim() || "——",
        employer_name: kycData.employerName?.trim() || "——",
        employer_address: kycData.employerAddress?.trim() || "——",
        monthly_net_income: kycData.monthlyNetIncome?.trim() || "0",
        reference1_name: kycData.reference1Name?.trim() || "——",
        reference1_address: kycData.reference1Address?.trim() || "——",
        reference1_relationship:
          kycData.reference1Relationship?.trim() || "Family",
        reference1_phone_number:
          kycData.reference1PhoneNumber?.trim() ||
          kycData.phoneNumber?.trim() ||
          "+234000000000",
        reference2_name: kycData.reference2Name?.trim() || null,
        reference2_address: kycData.reference2Address?.trim() || null,
        reference2_relationship: kycData.reference2Relationship?.trim() || null,
        reference2_phone_number: kycData.reference2PhoneNumber?.trim() || null,
      };

      // Remove any undefined values
      Object.keys(backendData).forEach((key) => {
        if (backendData[key as keyof typeof backendData] === undefined) {
          delete backendData[key as keyof typeof backendData];
        }
      });

      // Log the data being sent for debugging
      console.log("Sending KYC data to backend:", backendData);

      // Try the existing tenant endpoint first
      let response;
      try {
        response = await axiosInstance.post(
          "/tenant-kyc/existing-tenant",
          backendData,
        );
      } catch (error: unknown) {
        // If tenant doesn't exist, try creating a new KYC application
        if (
          (
            error as {
              response?: { status?: number; data?: { message?: string } };
            }
          )?.response?.status === 400 &&
          (
            error as {
              response?: { status?: number; data?: { message?: string } };
            }
          )?.response?.data?.message?.includes("Invalid or non-existent tenant")
        ) {
          console.log(
            "Tenant doesn't exist, trying to create KYC application instead...",
          );

          // Try using a different endpoint or approach
          // Option 1: Try using user_id instead of tenant_id
          const userBasedData: BackendKYCData = { ...backendData };
          delete userBasedData.tenant_id;
          userBasedData.user_id = kycData.tenantId; // Use as user_id instead

          try {
            response = await axiosInstance.post("/tenant-kyc", userBasedData);
          } catch (secondError: unknown) {
            console.error("Failed with user_id approach:", secondError);

            // Option 2: Try creating without any ID and let backend handle it
            const noIdData: BackendKYCData = { ...backendData };
            delete noIdData.tenant_id;

            try {
              response = await axiosInstance.post("/tenant-kyc", noIdData);
            } catch (thirdError: unknown) {
              console.error("Failed with no ID approach:", thirdError);
              throw error; // Throw the original error
            }
          }
        } else {
          throw error;
        }
      }

      return {
        success: true,
        message: "KYC information saved successfully",
        data: response.data,
      };
    },
    onError: (error: unknown) => {
      console.error("KYC Creation Error:", error);
      console.error(
        "Error Response:",
        (error as { response?: { data?: unknown } })?.response?.data,
      );

      // Extract meaningful error message
      let errorMessage = "Failed to create KYC information";

      const errorResponse = error as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };

      if (errorResponse?.response?.data?.message) {
        if (Array.isArray(errorResponse.response.data.message)) {
          // Validation errors
          errorMessage = errorResponse.response.data.message.join(", ");
        } else {
          errorMessage = errorResponse.response.data.message;
        }
      } else if (errorResponse?.message) {
        errorMessage = errorResponse.message;
      }

      throw new Error(errorMessage);
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["tenant-kyc-applications"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant"] }); // This will invalidate all tenant queries
      queryClient.invalidateQueries({ queryKey: ["tenant-kyc"] });

      // Force remove all cached data to ensure fresh fetch
      queryClient.removeQueries({ queryKey: ["tenant"] });
      queryClient.removeQueries({ queryKey: ["tenants"] });
    },
  });
};

// Attach tenant to property from KYC application
export const useAttachTenantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      attachmentData,
    }: {
      applicationId: string;
      attachmentData: AttachTenantData;
    }): Promise<AttachTenantResponse> => {
      const response = await axiosInstance.post(
        `/api/kyc-applications/${applicationId}/attach`,
        attachmentData,
      );

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["kyc-applications"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({
        queryKey: ["tenant-kyc-applications", data.data.tenantId],
      });
    },
  });
};

/**
 * Hook for checking existing KYC system-wide
 * Returns KYC data for autofill purposes regardless of landlord or status
 * SECURITY: Requires KYC verification JWT (issued after OTP verification)
 */
export const useCheckExistingKYCQuery = (
  verificationToken: string,
  email?: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["check-existing-kyc", verificationToken, email],
    queryFn: async () => {
      return await KYCService.checkExistingKYC(verificationToken, email);
    },
    enabled: enabled && !!verificationToken,
    staleTime: 5 * 60 * 1000, // 5 minutes - can cache longer since this is for autofill
    retry: false, // Don't retry on 404 (no existing KYC)
  });
};

/**
 * Hook for checking pending completion KYC
 * Requirements: 4.4 - Check if phone number matches any pending completion KYC
 * SECURITY: Requires KYC verification JWT (issued after OTP verification)
 */
export const useCheckPendingKYCQuery = (
  verificationToken: string,
  email?: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["check-pending-kyc", verificationToken, email],
    queryFn: async () => {
      return await KYCService.checkPendingKYC(verificationToken, email);
    },
    enabled: enabled && !!verificationToken,
    staleTime: 0, // Always fetch fresh data
    retry: false, // Don't retry on 404 (no pending KYC)
  });
};

/**
 * Hook for completing a pending KYC application
 * Requirements: 5.1 - Update existing KYC with completion data
 * SECURITY: Requires KYC token, phone number, and OTP verification
 */
export const useCompletePendingKYCMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      phoneNumber,
      otp,
      completionData,
    }: {
      token: string;
      phoneNumber: string;
      otp: string;
      completionData: Partial<KYCFormData>;
    }) => {
      return await KYCService.completePendingKYC(
        token,
        phoneNumber,
        otp,
        completionData,
      );
    },
    onMutate: () => {
      toast.loading("Completing KYC application...");
    },
    onError: async (error: unknown) => {
      toast.dismiss();

      // Enhanced error logging
      console.error("KYC completion error:", {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      // Use enhanced error handling with retry options
      const { handleApiErrorWithRetry } =
        await import("@/utilities/errorHandling");

      await handleApiErrorWithRetry(error, "KYC completion", {
        showToast: true,
        checkNetwork: true,
        customErrorMessages: {
          validation: "Please check all required fields and try again.",
          notFound: "KYC application not found or already completed.",
          serverError: "Failed to complete KYC. Please try again in a moment.",
          general: "Failed to complete KYC application. Please try again.",
        },
      });
    },
    onSuccess: (data) => {
      toast.dismiss();
      toast.success("KYC application completed successfully!");

      // Invalidate all KYC-related queries to refresh data
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "kyc-applications",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "kyc-application",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenant-kyc-applications",
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "check-pending-kyc" ||
          query.queryKey[0] === "check-existing-kyc",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "tenants",
      });

      return data;
    },
    onSettled: () => {
      toast.dismiss();
    },
    retry: (failureCount, error) => {
      // Import utilities dynamically to avoid circular dependencies
      const errorWithResponse = error as { response?: { status?: number } };
      const parsedError =
        errorWithResponse?.response?.status === 404
          ? { code: "NOT_FOUND" }
          : errorWithResponse?.response?.status === 400
            ? { code: "VALIDATION_ERROR" }
            : { code: "UNKNOWN_ERROR" };

      // Don't retry on validation or not found errors
      if (
        ["VALIDATION_ERROR", "NOT_FOUND", "BAD_REQUEST"].includes(
          parsedError.code || "",
        )
      ) {
        return false;
      }

      // Retry up to 2 times for network and server errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s
      return Math.min(1000 * Math.pow(2, attemptIndex), 2000);
    },
  });
};
