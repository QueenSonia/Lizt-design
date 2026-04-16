import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  offerLetterApi,
  CreateOfferLetterRequest,
  OfferLetterResponse,
  AcceptanceInitiationResponse,
} from "./api";
import { offerLetterKeys } from "./query";

/**
 * Hook to create and send an offer letter
 * Requirements: 10.1
 */
export const useCreateOfferLetterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    OfferLetterResponse,
    Error,
    {
      data: CreateOfferLetterRequest;
      applicantName: string;
    }
  >({
    mutationFn: ({ data }) => offerLetterApi.createOfferLetter(data),
    onSuccess: (response, { applicantName, data }) => {
      // Show appropriate success message based on whether notification was sent
      // Requirements: 7.3
      if (data.sendNotification) {
        toast.success(
          `Offer letter sent to ${applicantName} — Awaiting response`,
        );
      } else {
        toast.success(`Offer letter saved for ${applicantName}`);
      }

      // Invalidate related queries to update UI immediately
      queryClient.invalidateQueries({ queryKey: offerLetterKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["get-all-vacant-properties"],
      });
      queryClient.invalidateQueries({ queryKey: ["get-all-properties"] });
      queryClient.invalidateQueries({ queryKey: ["kyc-applications"] });

      // Invalidate property-specific queries to update property status
      queryClient.invalidateQueries({
        queryKey: ["property", data.propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["property-detail", data.propertyId],
      });

      // Invalidate KYC applications for the specific property
      queryClient.invalidateQueries({
        queryKey: ["kyc-applications", data.propertyId],
      });

      // Invalidate the specific KYC application
      queryClient.invalidateQueries({
        queryKey: ["kyc-application", data.kycApplicationId],
      });

      return response;
    },
    onError: (error) => {
      // Requirements: 7.4
      console.error("Failed to create offer letter:", error);
      toast.error(error.message || "Failed to send offer letter");
    },
  });
};

/**
 * Hook to send an offer letter via WhatsApp
 * Requirements: 7.1, 7.2
 */
export const useSendOfferLetterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { offerId: string; applicantName: string }
  >({
    mutationFn: ({ offerId }) => offerLetterApi.sendOfferLetter(offerId),
    onSuccess: (response, { applicantName }) => {
      toast.success(`Offer letter sent to ${applicantName} via WhatsApp`);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: offerLetterKeys.all });
      queryClient.invalidateQueries({ queryKey: ["kyc-applications"] });
      // Also invalidate individual KYC application detail queries so the
      // detail page reflects the updated offer status without a manual refresh
      queryClient.invalidateQueries({ queryKey: ["kyc-application"] });
    },
    onError: (error) => {
      toast.error(`Failed to send offer letter: ${error.message}`);
    },
  });
};

/**
 * Hook to initiate offer acceptance (sends OTP)
 * Requirements: 10.5
 */
export const useAcceptOfferMutation = () => {
  return useMutation<AcceptanceInitiationResponse, Error, string>({
    mutationFn: (token) => offerLetterApi.initiateAcceptance(token),
    onSuccess: (response) => {
      toast.success(response.message || "Verification code sent");
      return response;
    },
    onError: (error) => {
      console.error("Failed to initiate acceptance:", error);
      toast.error(error.message || "Failed to send verification code");
    },
  });
};

/**
 * Hook to verify OTP and complete acceptance
 * Requirements: 10.6
 */
export const useVerifyOTPMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    OfferLetterResponse,
    Error,
    { token: string; otp: string; ipAddress?: string }
  >({
    mutationFn: ({ token, otp, ipAddress }) =>
      offerLetterApi.verifyOtpAndAccept(token, otp, ipAddress),
    onSuccess: (response, { token }) => {
      toast.success("Offer accepted successfully!");

      // Invalidate the specific offer letter query to refresh status
      queryClient.invalidateQueries({
        queryKey: offerLetterKeys.byToken(token),
      });
      queryClient.invalidateQueries({ queryKey: offerLetterKeys.all });

      return response;
    },
    onError: (error) => {
      console.error("Failed to verify OTP:", error);
      // Don't show toast here - let the component handle it for retry logic
    },
  });
};

/**
 * Hook to reject an offer letter
 * Requirements: 10.7
 */
export const useRejectOfferMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    OfferLetterResponse,
    Error,
    { token: string; ipAddress?: string }
  >({
    mutationFn: ({ token, ipAddress }) =>
      offerLetterApi.rejectOfferLetter(token, ipAddress),
    onSuccess: (response, { token }) => {
      toast.success("Offer rejected");

      // Invalidate the specific offer letter query to refresh status
      queryClient.invalidateQueries({
        queryKey: offerLetterKeys.byToken(token),
      });
      queryClient.invalidateQueries({ queryKey: offerLetterKeys.all });
      queryClient.invalidateQueries({ queryKey: ["properties"] });

      return response;
    },
    onError: (error) => {
      console.error("Failed to reject offer:", error);
      toast.error(error.message || "Failed to reject offer");
    },
  });
};

const offerLetterMutations = {
  useCreateOfferLetterMutation,
  useSendOfferLetterMutation,
  useAcceptOfferMutation,
  useVerifyOTPMutation,
  useRejectOfferMutation,
};

export default offerLetterMutations;
