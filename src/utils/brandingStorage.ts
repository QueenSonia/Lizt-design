/**
 * Utility for managing Offer Letter Branding persistence
 * Ensures branding assets remain available across sessions
 *
 * KEY FEATURES:
 * - Automatic timestamp tracking (updatedAt)
 * - Centralized storage management
 * - Consistent data structure across all components
 * - Persistent across browser refreshes and tab closes
 *
 * USAGE:
 * - Call loadBranding() to retrieve saved branding or defaults
 * - Call saveBranding(data) to persist branding with automatic timestamp
 * - Components automatically reload branding on mount
 */

export interface BrandingData {
  businessName: string;
  businessAddress: string;
  contactPhone: string;
  contactEmail: string;
  websiteLink: string;
  footerColor: string;
  letterhead?: string;
  signature?: string;
  headingFont: string;
  bodyFont: string;
  updatedAt?: string;
}

const STORAGE_KEY = "offerLetterBranding";

const DEFAULT_BRANDING: BrandingData = {
  businessName: "",
  businessAddress: "",
  contactPhone: "",
  contactEmail: "",
  websiteLink: "",
  footerColor: "#6B6B6B",
  letterhead: undefined,
  signature: undefined,
  headingFont: "Inter",
  bodyFont: "Inter",
  updatedAt: undefined,
};

/**
 * Load branding from localStorage
 * Returns saved branding if exists, otherwise returns defaults
 */
export function loadBranding(): BrandingData {
  if (typeof window === "undefined") {
    return DEFAULT_BRANDING;
  }

  try {
    const savedBranding = localStorage.getItem(STORAGE_KEY);
    if (savedBranding) {
      return JSON.parse(savedBranding);
    }
  } catch (error) {
    console.error("Failed to load branding settings:", error);
  }
  return DEFAULT_BRANDING;
}

/**
 * Save branding to localStorage
 */
export function saveBranding(branding: BrandingData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const brandingWithTimestamp = {
      ...branding,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brandingWithTimestamp));
  } catch (error) {
    console.error("Failed to save branding settings:", error);
    throw error;
  }
}

/**
 * Check if branding has been customized (has uploaded assets or modified defaults)
 */
export function hasBrandingBeenCustomized(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const savedBranding = localStorage.getItem(STORAGE_KEY);
    if (!savedBranding) return false;

    const branding = JSON.parse(savedBranding) as BrandingData;
    return (
      !!branding.updatedAt || !!branding.letterhead || !!branding.signature
    );
  } catch {
    return false;
  }
}

/**
 * Clear all branding data (reset to defaults)
 */
export function clearBranding(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.error("Failed to clear branding settings");
  }
}

/**
 * Get default branding values
 */
export function getDefaultBranding(): BrandingData {
  return { ...DEFAULT_BRANDING };
}
