import { useQuery } from "@tanstack/react-query";
import { receiptsApi, ReceiptResponse } from "./api";

/**
 * Query key factory for receipt queries
 */
export const receiptKeys = {
  all: ["receipts"] as const,
  byOffer: (offerLetterId: string) =>
    [...receiptKeys.all, "by-offer", offerLetterId] as const,
  byProperty: (propertyId: string) =>
    [...receiptKeys.all, "by-property", propertyId] as const,
};

/**
 * Hook to fetch receipts by offer letter ID
 * Requirements: 7.1
 */
export const useReceiptsByOfferLetterId = (
  offerLetterId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<ReceiptResponse[], Error>({
    queryKey: receiptKeys.byOffer(offerLetterId),
    queryFn: () => receiptsApi.getByOfferLetterId(offerLetterId),
    enabled: options?.enabled !== false && !!offerLetterId,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
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
 * Hook to fetch receipts by property ID
 * Requirements: 7.2
 */
export const useReceiptsByPropertyId = (
  propertyId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<ReceiptResponse[], Error>({
    queryKey: receiptKeys.byProperty(propertyId),
    queryFn: () => receiptsApi.getByPropertyId(propertyId),
    enabled: options?.enabled !== false && !!propertyId,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
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
