/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Form data persistence utility for KYC form
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * CHANGED: Now uses sessionStorage instead of localStorage for:
 * - Better security (data clears when tab closes)
 * - No cross-tab conflicts
 * - Automatic cleanup (no expiry logic needed)
 */

import { FormData } from "../types";

export class FormPersistence {
  private static readonly STORAGE_PREFIX = "kyc_form_";
  private static readonly STEP_KEY = "current_step";
  // Note: Expiry logic removed - sessionStorage auto-clears on tab close

  /**
   * Generate storage key for a specific token
   */
  private static getStorageKey(token: string): string {
    return `${this.STORAGE_PREFIX}${token}`;
  }

  /**
   * Generate step storage key for a specific token
   */
  private static getStepKey(token: string): string {
    return `${this.STORAGE_PREFIX}${token}_${this.STEP_KEY}`;
  }

  /**
   * Save form data to sessionStorage
   * NOTE: Document URLs are NOT saved - server is the source of truth
   */
  static saveFormData(token: string, formData: Partial<FormData>): boolean {
    try {
      // Don't save File objects or document URLs
      const dataToSave = { ...formData };

      // Remove File objects (can't be serialized)
      if ((dataToSave as any).passportPhoto instanceof File) {
        delete (dataToSave as any).passportPhoto;
      }
      if ((dataToSave as any).idDocument instanceof File) {
        delete (dataToSave as any).idDocument;
      }
      if ((dataToSave as any).employmentProof instanceof File) {
        delete (dataToSave as any).employmentProof;
      }
      if ((dataToSave as any).businessProof instanceof File) {
        delete (dataToSave as any).businessProof;
      }

      // Remove document URLs - server autofill will provide these
      delete dataToSave.passport_photo_url;
      delete dataToSave.id_document_url;
      delete dataToSave.employment_proof_url;
      delete dataToSave.business_proof_url;

      const serializedData = JSON.stringify(dataToSave);
      sessionStorage.setItem(this.getStorageKey(token), serializedData);

      return true;
    } catch (error) {
      console.error("Error saving form data:", error);
      return false;
    }
  }

  /**
   * Load form data from sessionStorage
   */
  static loadFormData(token: string): Partial<FormData> | null {
    try {
      const serializedData = sessionStorage.getItem(this.getStorageKey(token));
      if (!serializedData) return null;

      const formData = JSON.parse(serializedData) as Partial<FormData>;
      return formData;
    } catch (error) {
      console.error("Error loading form data:", error);
      return null;
    }
  }

  /**
   * Save current step
   */
  static saveCurrentStep(token: string, step: number): boolean {
    try {
      sessionStorage.setItem(this.getStepKey(token), step.toString());
      return true;
    } catch (error) {
      console.error("Error saving current step:", error);
      return false;
    }
  }

  /**
   * Load current step
   */
  static loadCurrentStep(token: string): number | null {
    try {
      const stepStr = sessionStorage.getItem(this.getStepKey(token));
      if (!stepStr) return null;

      const step = parseInt(stepStr, 10);
      return isNaN(step) ? null : step;
    } catch (error) {
      console.error("Error loading current step:", error);
      return null;
    }
  }

  /**
   * Clear all form data for a specific token
   */
  static clearFormData(token: string): boolean {
    try {
      sessionStorage.removeItem(this.getStorageKey(token));
      sessionStorage.removeItem(this.getStepKey(token));
      return true;
    } catch (error) {
      console.error("Error clearing form data:", error);
      return false;
    }
  }

  /**
   * Check if sessionStorage is available
   */
  static isStorageAvailable(): boolean {
    try {
      const test = "__storage_test__";
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    isAvailable: boolean;
    hasData: boolean;
    dataCount: number;
  } {
    const isAvailable = this.isStorageAvailable();
    let hasData = false;
    let dataCount = 0;

    if (isAvailable) {
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(this.STORAGE_PREFIX)) {
            hasData = true;
            dataCount++;
          }
        }
      } catch (error) {
        console.warn("Error getting storage info:", error);
      }
    }

    return {
      isAvailable,
      hasData,
      dataCount,
    };
  }
}
