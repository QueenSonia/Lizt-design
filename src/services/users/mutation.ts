/* eslint-disable */
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import {
  assignCollaborator,
  attachTenantFromKyc,
  createUser,
  createUserKyc,
  deleteTeamMember,
  forgotPassword,
  loginUser,
  resetPassword,
  updateUser,
  validateOtp,
} from "./api";
import { loginSchema } from "@/schemas/user.schemas";
import { z } from "zod";
import { toast } from "sonner";
import { UserRole } from "@/types/user";

interface LoginSuccessData {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    profile_name?: string;
    role: UserRole;
    is_verified: boolean;
    logo_urls?: string[];
    creator_id?: string;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

export function useLoginMutation() {
  return useMutation<LoginSuccessData, Error, z.infer<typeof loginSchema>>({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const parsed = loginSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error("Invalid login credentials");
      }

      // Call Next.js API route instead of backend directly
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include", // Important for cookies
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      return await response.json();
    },

    onMutate: () => {},

    onError: (error: Error) => {
      const message = error?.message || "Login failed.";
      console.error("❌ Login failed:", message);
      toast.error(message);
    },

    onSuccess: (data: any) => {
      try {
        // Only store non-sensitive user info in sessionStorage for quick access
        sessionStorage.setItem("propertyKraftAuth", "true");
        sessionStorage.setItem("propertyKraftUserRole", data.user.role);
        sessionStorage.setItem("propertyKraftUserId", data.user.id);

        // Store access token if provided (for direct backend API calls)
        if (data.accessToken) {
          sessionStorage.setItem("access_token", data.accessToken);
        }

        // Show welcome toast with profile_name or first_name
        const displayName = data.user.profile_name || data.user.first_name;
        const roleDisplay =
          data.user.role.charAt(0).toUpperCase() +
          data.user.role.slice(1).toLowerCase().replace("_", " ");

        toast.success(`Welcome back, ${displayName}!`, {
          description: `Signed in as ${roleDisplay}`,
          duration: 4000,
        });
      } catch (error: any) {
        console.error("⚠️ Failed to store session data:", error.message);
        toast.error(
          "Login successful but failed to save session. Please try again."
        );
        throw error;
      }
    },
  });
}

export function useCreateUserMutation() {
  return useMutation({
    mutationFn: async (formPayload: any) => {
      return await createUser(formPayload);
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error.message);
      toast.error(error.message || "An error occurred during user creation.");
      return error.message || "An error occurred during user creation.";
    },
    onSuccess: async (data) => {
      toast.success("User created successfully!");
      return data;
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (formPayload: { email: string }) => {
      return await forgotPassword(formPayload);
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error.message);
      toast.error(error.message || "An error occurred during forgot password.");
      return error.message || "An error occurred during forgot password.";
    },
    onSuccess: async (data) => {
      toast.success("Password reset instructions sent!");
      return data;
    },
  });
}

export function useValidateOtpMutation() {
  return useMutation({
    mutationFn: async (formPayload: { otp: string }) => {
      return await validateOtp(formPayload);
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error.message);
      toast.error(error.message || "Invalid OTP. Please try again.");
      return error.message || "An error occurred during otp validation.";
    },
    onSuccess: async (data) => {
      toast.success("OTP validated successfully!");
      return data;
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (formPayload: any) => {
      return await resetPassword(formPayload);
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error.message);
      toast.error(error.message || "Failed to reset password.");
      return error.message || "An error occurred during reset password.";
    },
    onSuccess: async (data) => {
      toast.success("Password reset successfully!");
      return data;
    },
  });
}

export function useUpdateUserMutation() {
  return useMutation({
    mutationFn: async (formPayload: { data: any; userId?: string }) => {
      return await updateUser(formPayload.data, formPayload.userId);
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error.message);
      toast.error(error.message || "Failed to update user.");
      return error.message || "An error occurred during user update.";
    },
    onSuccess: async (data) => {
      toast.success("User updated successfully!");
      return data;
    },
  });
}

export function useCreateUserKYCMutation(user_id: string) {
  return useMutation({
    mutationFn: async (formPayload: any) => {
      return await createUserKyc(formPayload, user_id);
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error.message);
      toast.error(error.message || "Failed to submit KYC.");
      return error.message || "An error occurred during KYC submission.";
    },
    onSuccess: async (data) => {
      toast.success("KYC submitted successfully!");
      return data;
    },
  });
}

export function useInviteCollaboratorMutation() {
  return useMutation({
    mutationFn: async (formPayload: any) => {
      return await assignCollaborator(formPayload);
    },
    onMutate: () => {
      toast.loading("Sending invitation...");
    },
    onError: (error: any) => {
      toast.dismiss();
      toast.error(error.message || "Failed to send invitation.");
    },
    onSuccess: async (data: any) => {
      toast.dismiss();
      toast.success(data.message || "Invitation sent successfully!");
      return data;
    },
  });
}

export const useDeleteTeamMemberMutation = (
  options?: UseMutationOptions<{ message: string }, Error, string>
) => {
  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteTeamMember,
    onSuccess: (data) => {
      toast.success(data.message || "Team member deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete team member.");
    },
    ...options,
  });
};

export function useAttachTenantFromKycMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formPayload: {
      kycApplicationId: string;
      propertyId: string;
      rentAmount: number;
      rentFrequency: string;
      tenancyStartDate: string;
      rentDueDate: string;
      serviceCharge?: number;
      outstandingBalance?: number;
      outstandingBalanceReason?: string;
    }) => {
      return await attachTenantFromKyc(formPayload);
    },
    onMutate: () => {
      toast.loading("Attaching tenant...");
    },
    onError: (error: any) => {
      toast.dismiss();
      toast.error(error.message || "Failed to attach tenant.");
    },
    onSuccess: async (data) => {
      toast.dismiss();
      toast.success("Tenant attached successfully!");

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["kyc-applications"] });

      return data;
    },
  });
}
