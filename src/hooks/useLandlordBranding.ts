/**
 * Custom hook to fetch landlord's branding data from the backend
 * Used by offer letter components to display landlord's logo and signature
 */

import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/users/api";
import { BrandingData } from "@/utils/brandingStorage";

export function useLandlordBranding() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract branding data from profile
  const brandingData: BrandingData | undefined = profileData?.user?.branding
    ? {
        businessName: profileData.user.branding.businessName || "",
        businessAddress: profileData.user.branding.businessAddress || "",
        contactPhone: profileData.user.branding.contactPhone || "",
        contactEmail: profileData.user.branding.contactEmail || "",
        websiteLink: profileData.user.branding.websiteLink || "",
        footerColor: profileData.user.branding.footerColor || "#6B6B6B",
        letterhead: profileData.user.branding.letterhead,
        signature: profileData.user.branding.signature,
        headingFont: profileData.user.branding.headingFont || "Inter",
        bodyFont: profileData.user.branding.bodyFont || "Inter",
      }
    : undefined;

  return {
    branding: brandingData,
    isLoading,
  };
}
