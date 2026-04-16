/**
 * React hook for form data persistence
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 *
 * CHANGED: Now uses sessionStorage, removed document URL storage
 */

import { useCallback, useRef, useEffect } from "react";
import { FormData } from "../types";
import { FormPersistence } from "../utils/form-persistence";

interface UseFormPersistenceOptions {
  token: string;
}

interface UseFormPersistenceReturn {
  saveFormData: (data: Partial<FormData>) => boolean;
  loadFormData: () => Partial<FormData> | null;
  saveCurrentStep: (step: number) => boolean;
  loadCurrentStep: () => number | null;
  clearFormData: () => boolean;
  isStorageAvailable: boolean;
}

export function useFormPersistence({
  token,
}: UseFormPersistenceOptions): UseFormPersistenceReturn {
  const isStorageAvailable = FormPersistence.isStorageAvailable();

  const saveFormData = useCallback(
    (data: Partial<FormData>): boolean => {
      if (!isStorageAvailable) return false;
      return FormPersistence.saveFormData(token, data);
    },
    [token, isStorageAvailable]
  );

  const loadFormData = useCallback((): Partial<FormData> | null => {
    if (!isStorageAvailable) return null;
    return FormPersistence.loadFormData(token);
  }, [token, isStorageAvailable]);

  const saveCurrentStep = useCallback(
    (step: number): boolean => {
      if (!isStorageAvailable) return false;
      return FormPersistence.saveCurrentStep(token, step);
    },
    [token, isStorageAvailable]
  );

  const loadCurrentStep = useCallback((): number | null => {
    if (!isStorageAvailable) return null;
    return FormPersistence.loadCurrentStep(token);
  }, [token, isStorageAvailable]);

  const clearFormData = useCallback((): boolean => {
    if (!isStorageAvailable) return false;
    return FormPersistence.clearFormData(token);
  }, [token, isStorageAvailable]);

  return {
    saveFormData,
    loadFormData,
    saveCurrentStep,
    loadCurrentStep,
    clearFormData,
    isStorageAvailable,
  };
}

/**
 * Hook for auto-saving form data with debouncing
 */
export function useAutoSave(
  token: string,
  formData: Partial<FormData>,
  delay: number = 1000
): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStorageAvailable = FormPersistence.isStorageAvailable();

  useEffect(() => {
    if (!isStorageAvailable) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      FormPersistence.saveFormData(token, formData);
    }, delay);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [token, formData, delay, isStorageAvailable]);
}
