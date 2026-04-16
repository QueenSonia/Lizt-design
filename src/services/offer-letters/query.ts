import { useQuery } from "@tanstack/react-query";
import { offerLetterApi, OfferLetterResponse } from "./api";

/**
 * Query key factory for offer letter queries
 */
export const offerLetterKeys = {
  all: ["offer-letters"] as const,
  byToken: (token: string) => [...offerLetterKeys.all, "token", token] as const,
  checkExisting: (kycApplicationId: string, propertyId: string) =>
    [...offerLetterKeys.all, "check", kycApplicationId, propertyId] as const,
};

/**
 * Hook to fetch an offer letter by its token
 * Used on the public offer letter page
 * Requirements: 10.2
 *
 * @param token - The unique offer letter token
 * @param options - Optional query options
 */
export const useOfferLetterByToken = (
  token: string,
  options?: {
    enabled?: boolean;
    onError?: (error: Error) => void;
  },
) => {
  return useQuery<OfferLetterResponse, Error>({
    queryKey: offerLetterKeys.byToken(token),
    queryFn: () => offerLetterApi.getOfferLetterByToken(token),
    enabled: options?.enabled !== false && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (invalid token)
      if (
        error.message.includes("not found") ||
        error.message.includes("404")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook to check if an offer letter exists for a KYC application and property
 * Used in the attach tenant modal to detect existing offers
 *
 * @param kycApplicationId - The KYC application ID
 * @param propertyId - The property ID
 * @param options - Optional query options
 */
export const useCheckExistingOffer = (
  kycApplicationId: string,
  propertyId: string,
  options?: {
    enabled?: boolean;
  },
) => {
  return useQuery<OfferLetterResponse | null, Error>({
    queryKey: offerLetterKeys.checkExisting(kycApplicationId, propertyId),
    queryFn: () =>
      offerLetterApi.checkExistingOffer(kycApplicationId, propertyId),
    enabled: options?.enabled !== false && !!kycApplicationId && !!propertyId,
    staleTime: 30 * 1000, // 30 seconds - short stale time for real-time checks
    retry: false, // Don't retry, null response is valid
  });
};

const offerLetterQueries = {
  useOfferLetterByToken,
  useCheckExistingOffer,
  offerLetterKeys,
};

export default offerLetterQueries;
