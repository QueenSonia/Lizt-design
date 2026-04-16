/**
 * Offer Letters Service
 * Exports all API functions, types, queries, and mutations for offer letter operations
 * Requirements: 10.1-10.7
 */

// API functions and types
export {
  offerLetterApi,
  type TermsOfTenancy,
  type RentFrequency,
  type OfferLetterStatus,
  type PaymentStatus,
  type ContentSnapshot,
  type CreateOfferLetterRequest,
  type OfferLetterResponse,
  type AcceptanceInitiationResponse,
  type VerifyOtpRequest,
} from "./api";

// Query hooks
export {
  useOfferLetterByToken,
  useCheckExistingOffer,
  offerLetterKeys,
} from "./query";

// Mutation hooks
export {
  useCreateOfferLetterMutation,
  useSendOfferLetterMutation,
  useAcceptOfferMutation,
  useVerifyOTPMutation,
  useRejectOfferMutation,
} from "./mutation";
