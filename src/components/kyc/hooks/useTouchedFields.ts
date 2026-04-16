/**
 * Hook to manage touched fields state
 * Only show validation errors for fields that have been interacted with
 */

import { useState, useCallback } from "react";

export const useTouchedFields = () => {
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {}
  );

  const markFieldAsTouched = useCallback((fieldName: string) => {
    setTouchedFields((prev) => ({
      ...prev,
      [fieldName]: true,
    }));
  }, []);

  const markAllFieldsAsTouched = useCallback((fieldNames: string[]) => {
    const allTouched = fieldNames.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouchedFields((prev) => ({ ...prev, ...allTouched }));
  }, []);

  const resetTouchedFields = useCallback(() => {
    setTouchedFields({});
  }, []);

  const isFieldTouched = useCallback(
    (fieldName: string) => {
      return touchedFields[fieldName] === true;
    },
    [touchedFields]
  );

  return {
    touchedFields,
    markFieldAsTouched,
    markAllFieldsAsTouched,
    resetTouchedFields,
    isFieldTouched,
  };
};
