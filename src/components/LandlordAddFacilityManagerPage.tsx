import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import axiosInstance from "@/services/axios-instance";
import axios from "axios";

interface LandlordAddFacilityManagerPageProps {
  onBack: () => void;
  onFacilityManagerAdded: () => void;
}

export default function LandlordAddFacilityManagerPage({
  onBack,
  onFacilityManagerAdded,
}: LandlordAddFacilityManagerPageProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone_number: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        role: "facility_manager",
        permissions: [],
      };

      const response = await axiosInstance.post(
        "/users/assign-collaborator",
        payload
      );

      if (response.status !== 200) {
        throw new Error("Failed to add facility manager");
      }

      toast.success(
        `Facility manager ${formData.firstName} ${formData.lastName} added successfully!`
      );

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
      });
      setErrors({});

      onFacilityManagerAdded();
      onBack();
    } catch (error) {
      let errorMessage = "Failed to add facility manager. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            Add Facility Manager
          </h1>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
          {/* Description */}
          <p className="text-sm text-slate-600">
            Add a new facility manager to help manage your properties and assist
            with tenant requests.
          </p>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm">
              First Name *
            </Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              placeholder="Enter first name"
              className={`w-full text-sm ${
                errors.firstName ? "border-red-300 focus:border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm">
              Last Name *
            </Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              placeholder="Enter last name"
              className={`w-full text-sm ${
                errors.lastName ? "border-red-300 focus:border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              className={`w-full text-sm ${
                errors.email ? "border-red-300 focus:border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm">
              Phone Number *
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder="e.g. +234 801 234 5678"
              className={`w-full text-sm ${
                errors.phoneNumber ? "border-red-300 focus:border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-600">{errors.phoneNumber}</p>
            )}
          </div>
        </form>
      </div>

      {/* Fixed Bottom Button with Safe Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 safe-area-bottom">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-[#FF5000] hover:bg-[#FF5000]/90 text-white h-12"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Adding...</span>
            </div>
          ) : (
            "Save Facility Manager"
          )}
        </Button>
      </div>
    </div>
  );
}
