import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  updateUser,
  uploadBrandingAsset,
  changePassword,
} from "@/services/users/api";
import {
  ArrowLeft,
  X,
  User,
  Mail,
  Phone,
  Lock,
  Settings,
  Volume2,
  Building2,
  LogOut,
  Upload,
  FileText,
  Trash2,
  Save,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { isValidImageSrc } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { toast } from "sonner";
import { OfferLetterDocument } from "./OfferLetterDocument";

import GooglePlacesAutocomplete from "./GooglePlacesAutocomplete";

/** Capitalize the first letter of each word */
const toTitleCase = (str: string) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

import { normalizePhoneNumber } from "@/utils/phoneNormalization";
import { LogoutConfirmationModal } from "./modals/LogoutConfirmationModal";
import type { OfferLetterTemplate } from "@/types/offer-letter-template";
import { DEFAULT_TEMPLATE } from "@/types/offer-letter-template";
import { validateTemplate } from "@/utils/offer-letter-template-utils";

// Available fonts for offer letter customization
const AVAILABLE_FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "IBM Plex Sans", label: "IBM Plex Sans" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
];

interface AdminSettingsProps {
  onBack?: () => void;
  onLogout?: () => void;
}

interface FormData {
  profileName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface FormErrors {
  profileName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function AdminSettings({
  onBack,
  onLogout,
}: AdminSettingsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userRole = user?.role;

  // Fetch user profile data from API
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const [formData, setFormData] = useState<FormData>({
    profileName: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  // Store original data to detect changes
  const [originalFormData, setOriginalFormData] = useState<FormData>({
    profileName: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  // Store original preferences and branding to detect changes
  const [originalPreferences, setOriginalPreferences] = useState({
    enableLiveFeedSound: true,
    allowDuplicatePropertyNames: false,
  });

  const [originalBrandingData, setOriginalBrandingData] = useState({
    businessName: "",
    businessAddress: "",
    contactPhone: "",
    contactEmail: "",
    websiteLink: "",
    footerColor: "#6B6B6B",
    letterhead: undefined as string | undefined,
    signature: undefined as string | undefined,
    headingFont: "Inter",
    bodyFont: "Inter",
  });

  // Track if form has changes - removed since we now have individual save buttons
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Preferences state - will be loaded from backend
  const [preferences, setPreferences] = useState({
    enableLiveFeedSound: true,
    allowDuplicatePropertyNames: false,
  });

  // Branding data state - will be loaded from backend
  const [brandingData, setBrandingData] = useState({
    businessName: "",
    businessAddress: "",
    contactPhone: "",
    contactEmail: "",
    websiteLink: "",
    footerColor: "#6B6B6B",
    letterhead: undefined as string | undefined,
    signature: undefined as string | undefined,
    headingFont: "Inter",
    bodyFont: "Inter",
  });

  // Template state
  const [templateData, setTemplateData] =
    useState<OfferLetterTemplate>(DEFAULT_TEMPLATE);
  const [savedTemplateData, setSavedTemplateData] =
    useState<OfferLetterTemplate>(DEFAULT_TEMPLATE);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Update form data when profile data is loaded
  useEffect(() => {
    if (profileData) {
      console.log("Full profile data:", profileData);
      console.log("Account ID (profileData.id):", profileData.id);
      console.log("User ID (profileData.userId):", profileData.userId);
      console.log("User object:", profileData.user);

      // Normalize phone number on load
      const rawPhone = profileData.user?.phone_number || "";
      const normalizedPhone = normalizePhoneNumber(rawPhone);

      const loadedData = {
        profileName: profileData.profile_name || "",
        firstName: profileData.user?.first_name || "",
        lastName: profileData.user?.last_name || "",
        email: profileData.user?.email || "",
        phoneNumber: normalizedPhone,
      };
      setFormData(loadedData);
      setOriginalFormData(loadedData);
    }
  }, [profileData]);

  // Load preferences and branding data from profile when available
  useEffect(() => {
    if (profileData?.user?.preferences) {
      const loadedPreferences = {
        enableLiveFeedSound:
          profileData.user.preferences.enableLiveFeedSound ?? true,
        allowDuplicatePropertyNames:
          profileData.user.preferences.allowDuplicatePropertyNames ?? false,
      };
      setPreferences(loadedPreferences);
      setOriginalPreferences(loadedPreferences);
    }

    if (profileData?.user?.branding) {
      const loadedBranding = {
        businessName: profileData.profile_name || "", // Use profile_name instead of branding.businessName
        businessAddress: profileData.user.branding.businessAddress || "",
        contactPhone: profileData.user.branding.contactPhone || "",
        contactEmail: profileData.user.branding.contactEmail || "",
        websiteLink: profileData.user.branding.websiteLink || "",
        footerColor: profileData.user.branding.footerColor || "#6B6B6B",
        letterhead: profileData.user.branding.letterhead,
        signature: profileData.user.branding.signature,
        headingFont: profileData.user.branding.headingFont || "Inter",
        bodyFont: profileData.user.branding.bodyFont || "Inter",
      };
      setBrandingData(loadedBranding);
      setOriginalBrandingData(loadedBranding);
    } else if (profileData?.profile_name) {
      // If no branding exists yet, initialize with profile_name as businessName
      const initialBranding = {
        businessName: profileData.profile_name,
        businessAddress: "",
        contactPhone: "",
        contactEmail: "",
        websiteLink: "",
        footerColor: "#6B6B6B",
        letterhead: undefined,
        signature: undefined,
        headingFont: "Inter",
        bodyFont: "Inter",
      };
      setBrandingData(initialBranding);
      setOriginalBrandingData(initialBranding);
    }

    // Load template data
    const loadedTemplate =
      profileData?.user?.offer_letter_template || DEFAULT_TEMPLATE;
    setTemplateData(loadedTemplate);
    setSavedTemplateData(loadedTemplate);
  }, [profileData]);

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Detect if account details or preferences have changed
  const hasAccountChanges =
    JSON.stringify(formData) !== JSON.stringify(originalFormData) ||
    JSON.stringify(preferences) !== JSON.stringify(originalPreferences);

  // Detect if branding data has changed
  const hasBrandingChanges =
    JSON.stringify(brandingData) !== JSON.stringify(originalBrandingData);

  const validatePasswordForm = (): boolean => {
    const newErrors: PasswordErrors = {};

    // Current Password validation
    if (!passwordData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    // New Password validation
    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    // Confirm Password validation
    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handlePasswordInputChange = (
    field: keyof PasswordData,
    value: string,
  ) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Mutation for updating user profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: {
      profile_name?: string;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      preferences?: typeof preferences;
      branding?: typeof brandingData;
    }) => {
      // Use profileData.id (account ID) instead of profileData.userId
      const accountId = profileData?.id;
      console.log("Using account ID for update:", accountId);
      return updateUser(data, accountId);
    },
    onSuccess: () => {
      toast.success("All settings saved successfully!");
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (error: Error) => {
      console.error("Error saving settings:", error);
      toast.error(
        error.message || "Failed to save settings. Please try again.",
      );
    },
  });

  // Save Account Details only
  const handleSaveAccountDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate account fields
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (
      !/^\+234[0-9]{10}$/.test(formData.phoneNumber.replace(/\s/g, ""))
    ) {
      newErrors.phoneNumber =
        "Please enter a valid Nigerian phone number (+234...)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const titleCasedForm = {
        ...formData,
        firstName: toTitleCase(formData.firstName.trim()),
        lastName: toTitleCase(formData.lastName.trim()),
      };

      const updateData = {
        profile_name: brandingData.businessName || `${titleCasedForm.firstName} ${titleCasedForm.lastName}`,
        first_name: titleCasedForm.firstName,
        last_name: titleCasedForm.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        preferences: preferences,
      };

      await updateProfileMutation.mutateAsync(updateData);

      setFormData(titleCasedForm);
      setOriginalFormData(titleCasedForm);
      setOriginalPreferences(preferences);
      toast.success("Account details saved successfully!");
    } catch (error) {
      console.error("Error saving account details:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Branding only
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const handleSaveBranding = async () => {
    // Validate business name
    if (!brandingData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    } else if (brandingData.businessName.trim().length < 2) {
      toast.error("Business name must be at least 2 characters");
      return;
    }

    setIsSavingBranding(true);

    try {
      // Title-case name and address before saving
      const titleCasedBranding = {
        ...brandingData,
        businessName: toTitleCase(brandingData.businessName.trim()),
        businessAddress: brandingData.businessAddress
          ? toTitleCase(brandingData.businessAddress.trim())
          : brandingData.businessAddress,
      };

      // Include required fields from formData to satisfy TypeScript
      const updateData = {
        profile_name: titleCasedBranding.businessName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber,
        branding: titleCasedBranding,
      };

      await updateProfileMutation.mutateAsync(updateData);

      setBrandingData(titleCasedBranding);
      setOriginalBrandingData(titleCasedBranding);
      setOriginalFormData({
        ...originalFormData,
        profileName: brandingData.businessName,
      });
      toast.success("Branding saved successfully!");
    } catch (error) {
      console.error("Error saving branding:", error);
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully!");
      setIsPasswordModalOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to change password";
      toast.error(
        errorMessage || "Failed to change password. Please try again.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    const normalized = normalizePhoneNumber(value);
    handleInputChange("phoneNumber", normalized);
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences((prev: typeof preferences) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleBrandingChange = (field: string, value: string) => {
    setBrandingData((prev: typeof brandingData) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [isUploadingLetterhead, setIsUploadingLetterhead] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLetterhead(true);
    try {
      const result = await uploadBrandingAsset(file, "letterhead");
      setBrandingData((prev: typeof brandingData) => {
        const updated = { ...prev, letterhead: result.url };
        setOriginalBrandingData((orig) => ({ ...orig, letterhead: result.url }));
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Letterhead uploaded successfully!");
    } catch (error) {
      console.error("Error uploading letterhead:", error);
      toast.error("Failed to upload letterhead. Please try again.");
    } finally {
      setIsUploadingLetterhead(false);
    }
  };

  const handleRemoveLetterhead = async () => {
    const prevLetterhead = brandingData.letterhead;
    setBrandingData((prev: typeof brandingData) => ({
      ...prev,
      letterhead: undefined,
    }));
    try {
      const accountId = profileData?.id;
      await updateUser({ branding: { ...brandingData, letterhead: undefined } }, accountId);
      setOriginalBrandingData((prev) => ({ ...prev, letterhead: undefined }));
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Letterhead removed successfully!");
    } catch (error) {
      console.error("Error removing letterhead:", error);
      setBrandingData((prev: typeof brandingData) => ({
        ...prev,
        letterhead: prevLetterhead,
      }));
      toast.error("Failed to remove letterhead. Please try again.");
    }
  };

  const handleSignatureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSignature(true);
    try {
      const result = await uploadBrandingAsset(file, "signature");
      setBrandingData((prev: typeof brandingData) => {
        const updated = { ...prev, signature: result.url };
        setOriginalBrandingData((orig) => ({ ...orig, signature: result.url }));
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Signature uploaded successfully!");
    } catch (error) {
      console.error("Error uploading signature:", error);
      toast.error("Failed to upload signature. Please try again.");
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleRemoveSignature = async () => {
    const prevSignature = brandingData.signature;
    setBrandingData((prev: typeof brandingData) => ({
      ...prev,
      signature: undefined,
    }));
    try {
      const accountId = profileData?.id;
      await updateUser({ branding: { ...brandingData, signature: undefined } }, accountId);
      setOriginalBrandingData((prev) => ({ ...prev, signature: undefined }));
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Signature removed successfully!");
    } catch (error) {
      console.error("Error removing signature:", error);
      setBrandingData((prev: typeof brandingData) => ({
        ...prev,
        signature: prevSignature,
      }));
      toast.error("Failed to remove signature. Please try again.");
    }
  };

  // Template hasChanges computed
  const templateHasChanges =
    JSON.stringify(templateData) !== JSON.stringify(savedTemplateData);

  const handleSaveTemplate = async () => {
    const validation = validateTemplate(templateData);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    setIsSavingTemplate(true);
    try {
      const accountId = profileData?.id;
      await updateUser({ offer_letter_template: templateData }, accountId);
      setSavedTemplateData(templateData);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Template saved successfully!");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template. Please try again.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleResetTemplate = () => {
    setShowResetDialog(true);
  };

  const confirmResetTemplate = async () => {
    setShowResetDialog(false);
    setTemplateData(DEFAULT_TEMPLATE);
    // Persist reset immediately
    setIsSavingTemplate(true);
    try {
      const accountId = profileData?.id;
      await updateUser({ offer_letter_template: DEFAULT_TEMPLATE }, accountId);
      setSavedTemplateData(DEFAULT_TEMPLATE);
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Template reset to default!");
    } catch (error) {
      console.error("Error resetting template:", error);
      toast.error("Failed to reset template. Please try again.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Show loading state while fetching profile
  if (isProfileLoading) {
    return (
      <div className="page-container">
        <div className="max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                // Navigate back to dashboard
                router.push(`/${userRole}/dashboard`);
              }
            }}
            className="hover:bg-slate-100 shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </Button>
          <div>
            <h1 className="text-2xl text-slate-900 font-semibold">
              Profile & Settings
            </h1>
            <p className="text-sm text-slate-600">
              Manage your account preferences and security
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Account Details Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-gray-900">Account Details</h2>
              </div>

              <div className="space-y-6">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-900">
                    First Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className={`pl-10 capitalize bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 ${
                        errors.firstName
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-red-600 flex items-center">
                      <X className="w-3 h-3 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-900">
                    Last Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className={`pl-10 capitalize bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 ${
                        errors.lastName
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-sm text-red-600 flex items-center">
                      <X className="w-3 h-3 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 ${
                        errors.email ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center">
                      <X className="w-3 h-3 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-gray-900">
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+234 901 234 5678"
                      value={formData.phoneNumber}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      className={`pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 ${
                        errors.phoneNumber
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-600 flex items-center">
                      <X className="w-3 h-3 mr-1" />
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label className="text-gray-900">Password</Label>
                  <Dialog
                    open={isPasswordModalOpen}
                    onOpenChange={setIsPasswordModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={handlePasswordSubmit}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">
                            Current Password *
                          </Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            placeholder="Enter current password"
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              handlePasswordInputChange(
                                "currentPassword",
                                e.target.value,
                              )
                            }
                            className={`bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 ${
                              passwordErrors.currentPassword
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                          />
                          {passwordErrors.currentPassword && (
                            <p className="text-sm text-red-600 flex items-center">
                              <X className="w-3 h-3 mr-1" />
                              {passwordErrors.currentPassword}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password *</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Enter new password"
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              handlePasswordInputChange(
                                "newPassword",
                                e.target.value,
                              )
                            }
                            className={`bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 ${
                              passwordErrors.newPassword
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                          />
                          {passwordErrors.newPassword && (
                            <p className="text-sm text-red-600 flex items-center">
                              <X className="w-3 h-3 mr-1" />
                              {passwordErrors.newPassword}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">
                            Confirm New Password *
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              handlePasswordInputChange(
                                "confirmPassword",
                                e.target.value,
                              )
                            }
                            className={`bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 ${
                              passwordErrors.confirmPassword
                                ? "border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                          />
                          {passwordErrors.confirmPassword && (
                            <p className="text-sm text-red-600 flex items-center">
                              <X className="w-3 h-3 mr-1" />
                              {passwordErrors.confirmPassword}
                            </p>
                          )}
                        </div>

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsPasswordModalOpen(false)}
                            disabled={isChangingPassword}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isChangingPassword}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isChangingPassword ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Changing...
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Change Password
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Save Button - Account Details */}
            <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveAccountDetails}
                  disabled={isSubmitting || !hasAccountChanges}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] sm:min-w-[160px] w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      <span className="hidden sm:inline">
                        Saving Changes...
                      </span>
                      <span className="sm:hidden">Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Offer Letter Branding Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-gray-600" />
                <h2 className="text-gray-900">Offer Letter Branding</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Set your business logo and footer details once, and they&apos;ll
                automatically appear in every offer letter you send.
              </p>

              <div className="space-y-6">
                {/* Upload Logo/Letterhead */}
                <div className="space-y-2">
                  <Label className="text-gray-900">Logo / Letterhead</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    This logo or letterhead will appear at the top of all offer
                    letters.
                  </p>

                  {isValidImageSrc(brandingData.letterhead) ? (
                    <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <Image
                              src={brandingData.letterhead}
                              alt="Letterhead preview"
                              className="w-full h-full object-contain"
                              width={64}
                              height={64}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Letterhead uploaded
                            </p>
                            <p className="text-xs text-gray-500">
                              JPG, PNG, or PDF
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <label
                            htmlFor="letterhead-replace"
                            className="cursor-pointer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              asChild
                              disabled={isUploadingLetterhead}
                            >
                              <span>
                                {isUploadingLetterhead
                                  ? "Uploading..."
                                  : "Replace"}
                              </span>
                            </Button>
                            <input
                              type="file"
                              id="letterhead-replace"
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={handleFileUpload}
                              disabled={isUploadingLetterhead}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLetterhead}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isUploadingLetterhead}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#FF5000] transition-colors">
                      <input
                        type="file"
                        id="letterhead-upload"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        disabled={isUploadingLetterhead}
                      />
                      <label
                        htmlFor="letterhead-upload"
                        className={`cursor-pointer ${isUploadingLetterhead ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {isUploadingLetterhead ? (
                          <>
                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Uploading letterhead...
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Click to upload letterhead
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              JPG, PNG, or PDF
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Landlord Signature Upload */}
                <div className="space-y-2">
                  <Label className="text-gray-900">Landlord Signature</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    This signature will appear on all offer letters you send.
                  </p>

                  {isValidImageSrc(brandingData.signature) ? (
                    <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <Image
                              src={brandingData.signature}
                              alt="Signature preview"
                              className="w-full h-full object-contain"
                              width={128}
                              height={64}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Signature uploaded
                            </p>
                            <p className="text-xs text-gray-500">PNG or JPG</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <label
                            htmlFor="signature-replace"
                            className="cursor-pointer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              asChild
                              disabled={isUploadingSignature}
                            >
                              <span>
                                {isUploadingSignature
                                  ? "Uploading..."
                                  : "Replace"}
                              </span>
                            </Button>
                            <input
                              type="file"
                              id="signature-replace"
                              className="hidden"
                              accept="image/jpeg,image/jpg,image/png"
                              onChange={handleSignatureUpload}
                              disabled={isUploadingSignature}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveSignature}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isUploadingSignature}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#FF5000] transition-colors">
                      <input
                        type="file"
                        id="signature-upload"
                        className="hidden"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleSignatureUpload}
                        disabled={isUploadingSignature}
                      />
                      <label
                        htmlFor="signature-upload"
                        className={`cursor-pointer ${isUploadingSignature ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {isUploadingSignature ? (
                          <>
                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Uploading signature...
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Click to upload signature
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG or JPG only (max 5MB)
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Business / Company Name - This updates the profile name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-gray-900">
                    Business / Company Name *
                  </Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="e.g., ABC Properties Ltd"
                    value={brandingData.businessName}
                    onChange={(e) =>
                      handleBrandingChange("businessName", e.target.value)
                    }
                    className="capitalize bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Business Address */}
                <div className="space-y-2">
                  <Label htmlFor="businessAddress" className="text-gray-900">
                    Business Address
                  </Label>
                  <GooglePlacesAutocomplete
                    value={brandingData.businessAddress}
                    onChange={(value) =>
                      handleBrandingChange("businessAddress", value)
                    }
                    placeholder="e.g., 123 Main Street, Victoria Island, Lagos"
                    types={["address"]}
                    componentRestrictions={{ country: "ng" }}
                    className="capitalize bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Contact Phone */}
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-gray-900">
                    Contact Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="e.g., +234 800 000 0000"
                      value={brandingData.contactPhone}
                      onChange={(e) =>
                        handleBrandingChange("contactPhone", e.target.value)
                      }
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Contact Email */}
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-gray-900">
                    Contact Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="e.g., info@example.com"
                      value={brandingData.contactEmail}
                      onChange={(e) =>
                        handleBrandingChange("contactEmail", e.target.value)
                      }
                      className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Website Link */}
                <div className="space-y-2">
                  <Label htmlFor="websiteLink" className="text-gray-900">
                    Website Link
                  </Label>
                  <Input
                    id="websiteLink"
                    type="text"
                    placeholder="e.g., www.example.com"
                    value={brandingData.websiteLink}
                    onChange={(e) =>
                      handleBrandingChange("websiteLink", e.target.value)
                    }
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Footer Color */}
                <div className="space-y-2">
                  <Label htmlFor="footerColor" className="text-gray-900">
                    Footer Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandingData.footerColor}
                      onChange={(e) =>
                        handleBrandingChange("footerColor", e.target.value)
                      }
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      id="footerColor"
                      type="text"
                      value={brandingData.footerColor}
                      onChange={(e) =>
                        handleBrandingChange("footerColor", e.target.value)
                      }
                      placeholder="#6B6B6B"
                      className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                <Separator />

                {/* Typography Section */}
                <div className="space-y-4">
                  <h3 className="text-gray-900 font-medium">Typography</h3>

                  {/* Heading Font */}
                  <div className="space-y-2">
                    <Label htmlFor="headingFont" className="text-gray-900">
                      Heading Font
                    </Label>
                    <Select
                      value={brandingData.headingFont}
                      onValueChange={(value) =>
                        handleBrandingChange("headingFont", value)
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 placeholder-gray-500">
                        <SelectValue placeholder="Select a font">
                          {brandingData.headingFont}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_FONTS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Body Font */}
                  <div className="space-y-2">
                    <Label htmlFor="bodyFont" className="text-gray-900">
                      Body Font
                    </Label>
                    <Select
                      value={brandingData.bodyFont}
                      onValueChange={(value) =>
                        handleBrandingChange("bodyFont", value)
                      }
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 placeholder-gray-500">
                        <SelectValue placeholder="Select a font">
                          {brandingData.bodyFont}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_FONTS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
              </div>
            </div>

            {/* Save Branding Button */}
            <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveBranding}
                  disabled={isSavingBranding || !hasBrandingChanges}
                  className="bg-[#FF5000] hover:bg-[#E64500] text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] sm:min-w-[160px] w-full sm:w-auto"
                >
                  {isSavingBranding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Branding"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Offer Letter Template Editor Section */}
          {/* Offer Letter Template Editor Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg">
            <div className="p-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900">
                    Offer Letter Template Editor
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Click any text to edit it. Changes apply to all new offer
                    letters going forward.
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetTemplate}
                    size="sm"
                    className="text-gray-700 border-gray-300 hover:bg-gray-50 flex-1 sm:flex-none whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Reset to Default</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                </div>

                {!validateTemplate(templateData).valid &&
                  templateHasChanges && (
                    <p className="text-xs text-red-500 mt-2 sm:mt-0">
                      {validateTemplate(templateData).errors[0]}
                    </p>
                  )}
              </div>

              {/* Document Preview */}
              <div className="border-2 border-gray-200 rounded-lg bg-white shadow-lg overflow-hidden w-full">
                <OfferLetterDocument
                  data={{
                    applicantName: "Tenant Name",
                    applicantEmail: "",
                    propertyName: "Property Name",
                    rentAmount: 0,
                    rentFrequency: "Annually",
                    tenancyStartDate: new Date().toISOString(),
                  }}
                  mode="template-edit"
                  template={templateData}
                  onTemplateChange={setTemplateData}
                  branding={brandingData}
                  showPlaceholders={true}
                  allowStructuralEdits={true}
                />
              </div>

              {/* Save Template Button - Clean, prominent & correctly placed */}
              <div className="flex justify-end mt-8">
                <Button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={
                    isSavingTemplate ||
                    !templateHasChanges ||
                    !validateTemplate(templateData).valid
                  }
                  className="bg-[#FF5000] hover:bg-[#E64800] text-white px-10 py-2.5 text-base font-medium shadow-md"
                  size="default"
                >
                  {isSavingTemplate ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-3" />
                      Save Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Reset Template Confirmation Dialog */}
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Template to Default?</DialogTitle>
                <DialogDescription>
                  This will replace all your customizations with the default
                  template. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmResetTemplate}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Reset to Default
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* System Preferences Section */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-gray-900">System Preferences</h2>
              </div>

              <div className="space-y-6">
                {/* Live Feed Sound Notification */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-4 h-4 text-gray-500" />
                      <Label className="text-gray-900">
                        Enable Live Feed Sound Notification
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Play a sound when new activity appears in the live feed
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enableLiveFeedSound}
                    onCheckedChange={(value) =>
                      handlePreferenceChange("enableLiveFeedSound", value)
                    }
                  />
                </div>

                <Separator />

                {/* Allow Duplicate Property Names */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <Label className="text-gray-900">
                        Allow Duplicate Property Names
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Allow multiple properties to have the same name
                    </p>
                  </div>
                  <Switch
                    checked={preferences.allowDuplicatePropertyNames}
                    onCheckedChange={(value) =>
                      handlePreferenceChange(
                        "allowDuplicatePropertyNames",
                        value,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          {onLogout && (
            <div className="flex justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogoutModal(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {onLogout && (
        <LogoutConfirmationModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            setShowLogoutModal(false);
            onLogout();
          }}
        />
      )}
    </div>
  );
}
