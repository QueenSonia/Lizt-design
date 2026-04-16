/**
 * Component to show form storage status and provide manual save/clear options
 * Requirements: 3.4, 3.5
 */

import React from "react";
import { FormPersistence } from "./form-persistence";

interface FormStorageIndicatorProps {
  token: string;
  className?: string;
}

export const FormStorageIndicator: React.FC<FormStorageIndicatorProps> = ({
  token,
  className = "",
}) => {
  const [storageInfo, setStorageInfo] = React.useState(
    FormPersistence.getStorageInfo()
  );
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  // Update storage info periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStorageInfo(FormPersistence.getStorageInfo());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Check for saved data on mount
  React.useEffect(() => {
    const savedData = FormPersistence.loadFormData(token);
    if (savedData) {
      setLastSaved(new Date());
    }
  }, [token]);

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all saved form data?")) {
      FormPersistence.clearFormData(token);
      setStorageInfo(FormPersistence.getStorageInfo());
      setLastSaved(null);
    }
  };

  if (!storageInfo.isAvailable) {
    return (
      <div className={`text-sm text-yellow-600 ${className}`}>
        ⚠️ Local storage not available - form data will not be saved
      </div>
    );
  }

  const savedData = FormPersistence.loadFormData(token);
  const hasSavedData = savedData !== null;

  return (
    <div className={`text-sm ${className}`}>
      {hasSavedData ? (
        <div className="flex items-center justify-between">
          <span className="text-green-600">
            ✓ Form data saved automatically
            {lastSaved && (
              <span className="text-gray-500 ml-1">
                (Last saved: {lastSaved.toLocaleTimeString()})
              </span>
            )}
          </span>
          <button
            onClick={handleClearData}
            className="text-red-600 hover:text-red-800 underline ml-4"
            type="button"
          >
            Clear saved data
          </button>
        </div>
      ) : (
        <span className="text-gray-500">
          Form data will be saved automatically as you type
        </span>
      )}
    </div>
  );
};
