/**
 * Custom hook to fetch landlord's offer letter template from the backend
 * Used by offer letter preview components to apply the landlord's template
 */

import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/users/api";
import {
  OfferLetterTemplate,
  DEFAULT_TEMPLATE,
} from "@/types/offer-letter-template";

export function useLandlordTemplate() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const template: OfferLetterTemplate =
    profileData?.user?.offer_letter_template || DEFAULT_TEMPLATE;

  return {
    template,
    isLoading,
  };
}
