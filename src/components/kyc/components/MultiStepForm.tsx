/**
 * MultiStepForm Container Component
 * Main form wrapper with step state management and navigation
 * Requirements: 1.1, 1.4, 1.5
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MultiStepFormProps } from "../types/component.types";
import { FORM_STEPS, TOTAL_STEPS, BACKGROUND_GRADIENT } from "../constants";
import { FormValidator } from "../utils/form-validator";
import { useFormPersistence, useAutoSave } from "../hooks/useFormPersistence";
import { useTouchedFields } from "../hooks/useTouchedFields";
import {
  StepCard,
  PersonalDetailsStep,
  EmploymentDetailsStep,
  TenancyInformationStep,
  IdentificationDeclarationStep,
} from "./index";
import { HorizontalStepTracker } from "@/components/HorizontalStepTracker";
import { BrandBanner } from "@/components/ui/BrandBanner";
import NavigationControls from "./NavigationControls";
import { API_CONFIG } from "../utils/api-config";
import {
  KYCFormData,
  Gender,
  MaritalStatus,
  EmploymentStatus,
  Religion,
} from "@/schemas/kyc.schemas";

// Initial form data - strictly typed to match kycFormSchema with UI-only fields
const initialFormData: KYCFormData = {
  // Personal Information
  first_name: "",
  last_name: "",
  email: "",
  contact_address: "",
  phone_number: "",
  date_of_birth: "",
  gender: "" as Gender,
  nationality: "",
  state_of_origin: "",
  marital_status: "" as MaritalStatus,
  religion: "" as Religion,

  // Employment Information
  employment_status: "" as EmploymentStatus,
  job_title: "",
  employer_name: "",
  work_address: "",
  work_phone_number: "",
  length_of_employment: "",
  monthly_net_income: "",

  // Self-Employed specific fields
  nature_of_business: "",
  business_name: "",
  business_address: "",
  business_duration: "",
  estimated_monthly_income: "",

  // Next of Kin
  next_of_kin_full_name: "",
  next_of_kin_email: "",
  next_of_kin_phone_number: "",
  next_of_kin_address: "",
  next_of_kin_relationship: "",

  // Referral Agent (Optional)
  referral_agent_full_name: "",
  referral_agent_phone_number: "",

  // Tenancy Information
  property_applying_for: "",
  selected_rent_range: "",
  tenant_type: "",
  intended_use_of_property: "",
  number_of_occupants: "",
  parking_needs: "",
  proposed_rent_amount: "",
  rent_payment_frequency: "",
  additional_notes: "",

  // Identification & Declaration
  passport_photo: null,
  id_document: null,
  employment_proof: null,
  business_proof: null,
  declaration_accepted: false,

  // UI-only fields for tracking uploaded document URLs
  passport_photo_url: "",
  id_document_url: "",
  employment_proof_url: "",
  business_proof_url: "",
};

const MultiStepForm: React.FC<MultiStepFormProps> = ({
  token,
  propertyInfo,
  vacantProperties = [],
  verifiedPhoneNumber,
  kycVerificationToken,
  existingKYCData,
  availablePropertyIds,
  onSubmissionSuccess,
  onSubmissionError,
  onBackToVerification,
}) => {
  // For property addition, step 3 (Tenancy Information) is hidden
  const isPropertyAddition =
    existingKYCData?.application_type === "property_addition";
  const visibleSteps = isPropertyAddition
    ? FORM_STEPS.filter((s) => s.number !== 3)
    : FORM_STEPS;
  const totalVisibleSteps = visibleSteps.length;

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<KYCFormData>(initialFormData);
  const [stepValidations, setStepValidations] = useState<
    Record<number, boolean>
  >({});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isReturningApplicant, setIsReturningApplicant] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form persistence hooks
  const {
    saveFormData,
    loadFormData,
    saveCurrentStep,
    loadCurrentStep,
    clearFormData,
  } = useFormPersistence({ token });

  // Touched fields hook
  const { markAllFieldsAsTouched, resetTouchedFields, isFieldTouched } =
    useTouchedFields();

  // Auto-save form data
  useAutoSave(token, formData, 1000);

  // Load persisted data on mount, set verified phone number, and apply existing KYC data
  useEffect(() => {
    const savedData = loadFormData();
    const savedStep = loadCurrentStep();

    // Start with verified phone number
    let initialData: Partial<KYCFormData> = {
      phone_number: verifiedPhoneNumber,
    };

    // If we have full server data (has id), apply it and clear stale session data
    // If existingKYCData only has application_type (OTP skip restore), fall through to session storage
    if (existingKYCData?.id) {
      // Clear any stale session data from a previous tenant using the same link
      clearFormData();
      setIsReturningApplicant(true);

      const autofillData: Partial<KYCFormData> = {
        phone_number: verifiedPhoneNumber,
        // Personal Details
        first_name: existingKYCData.first_name || "",
        last_name: existingKYCData.last_name || "",
        email: existingKYCData.email || "",
        contact_address: existingKYCData.contact_address || "",
        date_of_birth: existingKYCData.date_of_birth || "",
        gender: existingKYCData.gender as Gender | undefined,
        nationality: existingKYCData.nationality || "",
        state_of_origin: existingKYCData.state_of_origin || "",
        marital_status: existingKYCData.marital_status as
          | MaritalStatus
          | undefined,
        religion: existingKYCData.religion as Religion | undefined,
        // Employment Details
        employment_status: existingKYCData.employment_status as
          | EmploymentStatus
          | undefined,
        employer_name: existingKYCData.employer_name || "",
        job_title: existingKYCData.job_title || "",
        work_address:
          existingKYCData.work_address ||
          existingKYCData.employer_address ||
          "",
        work_phone_number:
          existingKYCData.work_phone_number ||
          existingKYCData.employer_phone_number ||
          "",
        monthly_net_income: existingKYCData.monthly_net_income || "",
        length_of_employment: existingKYCData.length_of_employment || "",
        nature_of_business: existingKYCData.nature_of_business || "",
        business_name: existingKYCData.business_name || "",
        business_address: existingKYCData.business_address || "",
        business_duration: existingKYCData.business_duration || "",
        estimated_monthly_income: existingKYCData.monthly_net_income || "",
        // Next of Kin - backend now uses next_of_kin_* fields directly
        next_of_kin_full_name:
          existingKYCData.next_of_kin_full_name ||
          existingKYCData.reference1_name ||
          "",
        next_of_kin_address:
          existingKYCData.next_of_kin_address ||
          existingKYCData.reference1_address ||
          "",
        next_of_kin_relationship:
          existingKYCData.next_of_kin_relationship ||
          existingKYCData.reference1_relationship ||
          "",
        next_of_kin_phone_number:
          existingKYCData.next_of_kin_phone_number ||
          existingKYCData.reference1_phone_number ||
          "",
        next_of_kin_email:
          existingKYCData.next_of_kin_email ||
          existingKYCData.reference1_email ||
          "",
        // Document URLs
        passport_photo_url: existingKYCData.passport_photo_url || "",
        id_document_url: existingKYCData.id_document_url || "",
        employment_proof_url: existingKYCData.employment_proof_url || "",
        business_proof_url: existingKYCData.business_proof_url || "",
        // Metadata for pending completion
        ...(availablePropertyIds.length > 0 && {
          pending_kyc_id: existingKYCData.id,
          property_applying_for: existingKYCData.property_id || "",
        }),
      };

      // Filter out empty values
      const filteredData = Object.fromEntries(
        Object.entries(autofillData).filter(
          ([, value]) => value !== undefined && value !== null && value !== "",
        ),
      );

      initialData = filteredData;
    } else if (savedData) {
      // No full server data — use sessionStorage (covers OTP-skip refresh and new applicants)
      initialData = { ...initialData, ...savedData };
    }

    setFormData((prev) => ({ ...prev, ...initialData }));

    // Save initial data (including phone number) to sessionStorage immediately
    if (Object.keys(initialData).length > 0) {
      saveFormData(initialData);
    }

    // Only skip step restore when full server data was loaded (and storage was cleared)
    if (
      !existingKYCData?.id &&
      savedStep &&
      savedStep >= 1 &&
      savedStep <= totalVisibleSteps
    ) {
      setCurrentStep(savedStep);
    }
  }, [
    loadFormData,
    loadCurrentStep,
    saveFormData,
    clearFormData,
    verifiedPhoneNumber,
    existingKYCData,
    availablePropertyIds,
    totalVisibleSteps,
  ]);

  // Save current step when it changes
  useEffect(() => {
    saveCurrentStep(currentStep);
  }, [currentStep, saveCurrentStep]);

  // Handle form data changes
  const handleDataChange = useCallback(
    (data: Partial<KYCFormData>) => {
      setFormData((prev) => {
        const newData = { ...prev, ...data };
        saveFormData(newData);
        return newData;
      });
    },
    [saveFormData],
  );

  // Handle step validation changes
  const handleValidationChange = useCallback(
    (isValid: boolean) => {
      setStepValidations((prev) => ({
        ...prev,
        [currentStep]: isValid,
      }));

      // Don't set errors here - only set them when user tries to navigate
      // This prevents "This field is required" from showing immediately
    },
    [currentStep],
  );

  // Track direction for animations
  const [direction, setDirection] = useState(0);

  // Navigation functions
  const goToNextStep = useCallback(async () => {
    if (currentStep >= totalVisibleSteps) return;

    // Validate current step before proceeding
    const validation = FormValidator.validateStep(currentStep, formData);
    if (!validation.isValid) {
      // Mark all fields in current step as touched to show errors
      const errorFields = Object.keys(validation.errors);
      markAllFieldsAsTouched(errorFields);
      setStepErrors(validation.errors);
      return;
    }

    // Set direction for animation and move to next step
    setDirection(1);
    setCurrentStep((prev) => prev + 1);
    setStepErrors({});
    resetTouchedFields(); // Reset touched fields for next step

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [
    currentStep,
    formData,
    markAllFieldsAsTouched,
    resetTouchedFields,
    totalVisibleSteps,
  ]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep <= 1) return;

    // Set direction for animation and move to previous step
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
    setStepErrors({});
    resetTouchedFields(); // Reset touched fields when going back

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, resetTouchedFields]);

  const goToLastStep = useCallback(async () => {
    // Validate first step before allowing skip
    const validation = FormValidator.validateStep(1, formData);
    if (!validation.isValid) {
      // Mark all fields in step 1 as touched to show errors
      const errorFields = Object.keys(validation.errors);
      markAllFieldsAsTouched(errorFields);
      setStepErrors(validation.errors);
      return;
    }

    // Set direction for animation and move to last step
    setDirection(1);
    setCurrentStep(TOTAL_STEPS);
    setStepErrors({});
    resetTouchedFields(); // Reset touched fields for last step

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [formData, markAllFieldsAsTouched, resetTouchedFields]);

  // Form submission
  const handleSubmit = useCallback(async () => {
    // Ref-based guard: prevents double execution even if two clicks fire
    // before React re-renders the disabled button state.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Final validation of all steps
    let allValid = true;
    const allErrors: Record<string, string> = {};

    for (const step of visibleSteps.map((s) => s.number)) {
      const validation = FormValidator.validateStep(step, formData);
      if (!validation.isValid) {
        allValid = false;
        Object.assign(allErrors, validation.errors);
        console.log(`Step ${step} validation failed:`, validation.errors);
      }
    }

    if (!allValid) {
      // Mark all error fields as touched to show all errors
      const errorFields = Object.keys(allErrors);
      markAllFieldsAsTouched(errorFields);
      setStepErrors(allErrors);
      console.log("All validation errors:", allErrors);
      console.log("Form data:", formData);
      onSubmissionError("Please fix all fields before submitting.");
      isSubmittingRef.current = false;
      return;
    }

    setIsSubmitting(true);

    try {
      // Map frontend form data to backend DTO format
      const submissionData: Record<string, string> = {
        // Required fields (form validation guarantees presence)
        property_id: formData.property_applying_for,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        email: formData.email,
        contact_address: formData.contact_address,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender.toLowerCase(),
        nationality: formData.nationality,
        state_of_origin: formData.state_of_origin,
        marital_status: formData.marital_status.toLowerCase(),
        religion: formData.religion,
        employment_status: formData.employment_status.toLowerCase(),
        // Next of Kin
        next_of_kin_full_name: formData.next_of_kin_full_name,
        next_of_kin_address: formData.next_of_kin_address,
        next_of_kin_relationship: formData.next_of_kin_relationship,
        next_of_kin_phone_number: formData.next_of_kin_phone_number,
        next_of_kin_email: formData.next_of_kin_email,
        // Tenancy information (omitted for property_addition — landlord already set these)
        ...(!isPropertyAddition && {
          intended_use_of_property: formData.intended_use_of_property,
          number_of_occupants: formData.number_of_occupants,
          proposed_rent_amount: formData.proposed_rent_amount?.replace(
            /,/g,
            "",
          ),
          rent_payment_frequency: formData.rent_payment_frequency,
        }),
      };

      // Employment fields (conditional on employment status)
      if (formData.employer_name && formData.employer_name.trim()) {
        submissionData.employer_name = formData.employer_name;
      }

      if (formData.job_title && formData.job_title.trim()) {
        submissionData.job_title = formData.job_title;
        // Set occupation from job_title for employed users
        submissionData.occupation = formData.job_title;
      }

      if (formData.work_address && formData.work_address.trim()) {
        submissionData.work_address = formData.work_address;
      }

      if (formData.monthly_net_income && formData.monthly_net_income.trim()) {
        const cleanedIncome = formData.monthly_net_income.replace(/,/g, "");
        submissionData.monthly_net_income = cleanedIncome;
      }

      if (formData.work_phone_number && formData.work_phone_number.trim()) {
        submissionData.work_phone_number = formData.work_phone_number;
      }

      if (
        formData.length_of_employment &&
        formData.length_of_employment.trim()
      ) {
        submissionData.length_of_employment = formData.length_of_employment;
      }

      // Self-employed fields (conditional on employment status)
      if (formData.nature_of_business && formData.nature_of_business.trim()) {
        submissionData.nature_of_business = formData.nature_of_business;
        // Also set occupation for backward compatibility
        submissionData.occupation = formData.nature_of_business;
      }

      if (formData.business_name && formData.business_name.trim()) {
        submissionData.business_name = formData.business_name;
      }

      if (formData.business_address && formData.business_address.trim()) {
        submissionData.business_address = formData.business_address;
      }

      if (formData.business_duration && formData.business_duration.trim()) {
        submissionData.business_duration = formData.business_duration;
      }

      if (
        formData.estimated_monthly_income &&
        formData.estimated_monthly_income.trim()
      ) {
        const cleanedIncome = formData.estimated_monthly_income.replace(
          /,/g,
          "",
        );
        submissionData.monthly_net_income = cleanedIncome;
      }

      // Ensure occupation is set for employed users (required by backend)
      if (
        submissionData.employment_status === "employed" &&
        !submissionData.occupation
      ) {
        if (submissionData.job_title) {
          submissionData.occupation = submissionData.job_title;
        }
      }

      // Optional fields
      if (
        formData.referral_agent_full_name &&
        formData.referral_agent_full_name.trim()
      ) {
        submissionData.referral_agent_full_name =
          formData.referral_agent_full_name;
      }

      if (
        formData.referral_agent_phone_number &&
        formData.referral_agent_phone_number.trim()
      ) {
        submissionData.referral_agent_phone_number =
          formData.referral_agent_phone_number;
      }

      if (formData.parking_needs && formData.parking_needs.trim()) {
        submissionData.parking_needs = formData.parking_needs;
      }

      if (formData.additional_notes && formData.additional_notes.trim()) {
        submissionData.additional_notes = formData.additional_notes;
      }

      // Validate required document URLs before submission
      const missingDocuments: string[] = [];

      // Passport Photo - REQUIRED
      if (!formData.passport_photo_url || !formData.passport_photo_url.trim()) {
        missingDocuments.push("Passport Photo");
      } else {
        submissionData.passport_photo_url = formData.passport_photo_url;
      }

      // ID Document - REQUIRED
      if (!formData.id_document_url || !formData.id_document_url.trim()) {
        missingDocuments.push("ID Document");
      } else {
        submissionData.id_document_url = formData.id_document_url;
      }

      // Employment Proof - REQUIRED for employed users
      if (formData.employment_status === "employed") {
        if (
          !formData.employment_proof_url ||
          !formData.employment_proof_url.trim()
        ) {
          missingDocuments.push("Employment Proof");
        } else {
          submissionData.employment_proof_url = formData.employment_proof_url;
        }
      }

      // Business Proof - REQUIRED for self-employed users
      if (formData.employment_status === "self-employed") {
        if (
          !formData.business_proof_url ||
          !formData.business_proof_url.trim()
        ) {
          missingDocuments.push("Business Proof");
        } else {
          submissionData.business_proof_url = formData.business_proof_url;
        }
      }

      // If any required documents are missing, show error and stop submission
      if (missingDocuments.length > 0) {
        const errorMessage = `Please upload the following required documents: ${missingDocuments.join(
          ", ",
        )}. Make sure the upload completes successfully before submitting.`;
        console.error("❌ Missing document URLs:", missingDocuments);
        throw new Error(errorMessage);
      }

      // Get user's IP address for tracking
      let userIP: string | undefined;
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
      } catch (error) {
        console.error("Failed to get user IP:", error);
      }

      // Pull form open tracking data from sessionStorage
      const trackingKey = `kyc_tracking_${token}`;
      let formOpenTracking: Record<string, string> = {};
      try {
        const stored = sessionStorage.getItem(trackingKey);
        if (stored) {
          formOpenTracking = JSON.parse(stored);
        }
      } catch {
        // Tracking data is best-effort
      }

      // Add all tracking data to submission
      const submissionDataWithTracking = {
        ...submissionData,
        decision_made_ip: userIP,
        form_opened_at: formOpenTracking.form_opened_at,
        form_opened_ip: formOpenTracking.form_opened_ip,
        user_agent: formOpenTracking.user_agent,
      };

      // Determine which endpoint to use - Requirements 5.1, 5.4
      let response;
      let endpoint;

      if (isPropertyAddition) {
        // Property addition — submit to simplified endpoint
        endpoint = API_CONFIG.kyc.submitPropertyAddition();

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...submissionDataWithTracking,
            kyc_token: token,
          }),
        });
      } else if (formData.pending_kyc_id) {
        // Update existing pending KYC - PUT /api/kyc/complete-pending/:kycId
        endpoint = `${API_CONFIG.baseUrl}/api/kyc/complete-pending/${formData.pending_kyc_id}`;

        response = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionDataWithTracking),
        });
      } else {
        // Create new KYC application - POST /api/kyc/submit
        endpoint = API_CONFIG.kyc.submit();

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...submissionDataWithTracking,
            kyc_token: token,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Submission failed");
      }

      // Clear form data and tracking data on successful submission
      clearFormData();
      sessionStorage.removeItem(trackingKey);

      // Pass applicant info to success callback
      const selectedProperty = vacantProperties.find(
        (p) => p.id === formData.property_applying_for,
      );

      onSubmissionSuccess({
        applicantName: `${formData.first_name} ${formData.last_name}`.trim(),
        applicantEmail: formData.email,
        propertyName: selectedProperty?.name || propertyInfo.name,
      });
    } catch (error) {
      console.error("Form submission error:", error);
      onSubmissionError(
        error instanceof Error
          ? error.message
          : "Failed to submit form. Please try again.",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    formData,
    token,
    clearFormData,
    onSubmissionSuccess,
    onSubmissionError,
    markAllFieldsAsTouched,
    propertyInfo.name,
    vacantProperties,
    isPropertyAddition,
    visibleSteps,
  ]);

  // Render current step component
  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      onDataChange: handleDataChange,
      errors: stepErrors,
      onValidationChange: handleValidationChange,
      isFieldTouched,
      goToNextStep,
      token,
      landlordId: propertyInfo?.landlordId,
      properties: vacantProperties,
      kycVerificationToken,
    };

    // Map the visible step index to the actual step number
    const actualStepNumber = visibleSteps[currentStep - 1]?.number;
    switch (actualStepNumber) {
      case 1:
        return <PersonalDetailsStep {...stepProps} />;
      case 2:
        return <EmploymentDetailsStep {...stepProps} />;
      case 3:
        return (
          <TenancyInformationStep
            {...stepProps}
            properties={vacantProperties}
          />
        );
      case 4:
        return (
          <IdentificationDeclarationStep
            {...stepProps}
            isReturningApplicant={isReturningApplicant}
            onUploadingChange={setIsUploading}
          />
        );
      default:
        return null;
    }
  };

  const currentStepData = visibleSteps[currentStep - 1];
  const isCurrentStepValid = stepValidations[currentStep] ?? false;

  // Animation variants for step transitions
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div className={`min-h-screen ${BACKGROUND_GRADIENT}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <BrandBanner
          onBack={currentStep === 1 ? onBackToVerification : goToPreviousStep}
          showBackButton={currentStep > 1 || !!onBackToVerification}
        />
      </div>

      {/* Main Content */}
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        role="main"
      >
        {/* Horizontal Step Tracker */}
        <div className="mb-10 sm:mb-12">
          <HorizontalStepTracker
            steps={visibleSteps}
            currentStep={currentStep}
          />
        </div>

        {/* Form Content */}
        <div className="w-full">
          {/* Returning Applicant Welcome - Only show on Personal Details step */}
          {isReturningApplicant && currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-white border border-gray-200 rounded-xl p-5"
            >
              <h3 className="text-base font-medium text-gray-900 mb-1.5">
                Welcome back 👋
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                We found your previous application.
              </p>
              <p className="text-sm text-gray-600">
                You can review your details and continue.
              </p>
              {existingKYCData?.updated_at && (
                <p className="text-xs text-gray-400 mt-2.5">
                  Last updated:{" "}
                  {new Date(existingKYCData.updated_at).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              role="region"
              aria-live="polite"
              aria-label={`Step ${currentStep}: ${currentStepData?.title}`}
            >
              <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
                <StepCard
                  title={currentStepData?.title || ""}
                  subtitle={currentStepData?.subtitle || ""}
                  stepNumber={`${currentStep}`}
                >
                  <div
                    role="group"
                    aria-labelledby={`step-${currentStep}-title`}
                  >
                    {renderCurrentStep()}
                  </div>

                  <NavigationControls
                    currentStep={currentStep}
                    totalSteps={totalVisibleSteps}
                    isValid={isCurrentStepValid}
                    isSubmitting={isSubmitting}
                    isUploading={isUploading}
                    onNext={goToNextStep}
                    onBack={goToPreviousStep}
                    onSubmit={handleSubmit}
                    onSkip={goToLastStep}
                  />
                </StepCard>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;
