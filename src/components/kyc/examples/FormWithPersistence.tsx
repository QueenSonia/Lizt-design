/**
 * Example component demonstrating form validation and persistence
 * This is for reference and testing purposes
 */

import React, { useState, useEffect } from "react";
import { FormData, FormValidator } from "../";
import { useFormPersistence, useAutoSave } from "../hooks";
import { FormStorageIndicator } from "../utils/form-storage-indicator";

interface FormWithPersistenceProps {
  token: string;
}

export const FormWithPersistence: React.FC<FormWithPersistenceProps> = ({
  token,
}) => {
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    loadFormData,
    saveCurrentStep,
    loadCurrentStep,
    clearFormData,
    isStorageAvailable,
  } = useFormPersistence({ token });

  // Auto-save form data with debouncing
  useAutoSave(token, formData, 1000);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFormData();
    const savedStep = loadCurrentStep();

    if (savedData) {
      setFormData(savedData);
    }
    if (savedStep) {
      setCurrentStep(savedStep);
    }
  }, [loadFormData, loadCurrentStep]);

  // Save current step when it changes
  useEffect(() => {
    saveCurrentStep(currentStep);
  }, [currentStep, saveCurrentStep]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = () => {
    const validation = FormValidator.validateStep(
      currentStep,
      formData as FormData
    );
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    const validation = FormValidator.validateStep(
      currentStep,
      formData as FormData
    );
    if (validation.isValid) {
      // Clear saved data on successful submission
      clearFormData();
      alert("Form submitted successfully!");
    } else {
      setErrors(validation.errors);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        KYC Form - Step {currentStep} of 6
      </h1>

      {/* Storage indicator */}
      <FormStorageIndicator token={token} className="mb-4" />

      {/* Storage availability warning */}
      {!isStorageAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <p className="text-yellow-800">
            ⚠️ Local storage is not available. Your form data will not be saved
            automatically.
          </p>
        </div>
      )}

      {/* Example form fields for Step 1 */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.last_name || ""}
              onChange={(e) => handleInputChange("last_name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.last_name ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Enter your last name"
            />
            {errors.last_name && (
              <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.first_name || ""}
              onChange={(e) => handleInputChange("first_name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.first_name ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Enter your first name"
            />
            {errors.first_name && (
              <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentStep < 6 ? (
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Submit
          </button>
        )}
      </div>

      {/* Debug info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Debug Info:</h3>
        <p className="text-sm text-gray-600">Current Step: {currentStep}</p>
        <p className="text-sm text-gray-600">
          Storage Available: {isStorageAvailable ? "Yes" : "No"}
        </p>
        <p className="text-sm text-gray-600">
          Form Data Keys: {Object.keys(formData).length}
        </p>
        <p className="text-sm text-gray-600">
          Validation Errors: {Object.keys(errors).length}
        </p>
      </div>
    </div>
  );
};
