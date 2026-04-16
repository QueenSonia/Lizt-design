import { useQuery } from "@tanstack/react-query";
import {
  renewalInvoiceApi,
  RenewalInvoiceResponse,
  PaymentSuccessData,
  RenewalReceiptData,
} from "./api";

/**
 * Query keys for renewal invoices
 */
export const renewalInvoiceKeys = {
  all: ["renewal-invoices"] as const,
  byToken: (token: string) => ["renewal-invoice", token] as const,
  successData: (token: string) =>
    ["renewal-invoice", token, "success"] as const,
  receiptData: (token: string) => ["renewal-receipt", token] as const,
};

/**
 * Hook to fetch renewal invoice by token
 * Requirements: 4.1-4.7
 */
export const useRenewalInvoiceQuery = (token: string) => {
  return useQuery<RenewalInvoiceResponse, Error>({
    queryKey: renewalInvoiceKeys.byToken(token),
    queryFn: () => renewalInvoiceApi.getRenewalInvoiceByToken(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

/**
 * Hook to fetch payment success data
 * Requirements: 1.1-1.7
 */
export const usePaymentSuccessQuery = (token: string) => {
  return useQuery<PaymentSuccessData, Error>({
    queryKey: renewalInvoiceKeys.successData(token),
    queryFn: () => renewalInvoiceApi.getPaymentSuccessData(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
};

/**
 * Hook to fetch renewal receipt data
 * Requirements: 4.1-4.8, 8.1-8.3
 */
export const useRenewalReceiptQuery = (token: string) => {
  return useQuery<RenewalReceiptData, Error>({
    queryKey: renewalInvoiceKeys.receiptData(token),
    queryFn: () => renewalInvoiceApi.getRenewalReceiptByToken(token),
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10 minutes (receipts are static)
    retry: 2,
  });
};

const renewalInvoiceQueries = {
  useRenewalInvoiceQuery,
  usePaymentSuccessQuery,
  useRenewalReceiptQuery,
};

export default renewalInvoiceQueries;
