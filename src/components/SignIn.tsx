/* eslint-disable */
import { useState } from "react";
import { Eye, EyeOff, Mail, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { useLoginMutation } from "@/services/users/mutation";
import { User } from "@/types/user";
import { transformBackendUser } from "@/utils/auth";

interface SignInProps {
  onSignInSuccess: (user: User) => void;
  onForgotPassword?: () => void;
  onLogoClick?: () => void;
  isLoading?: boolean;
}

export function SignIn({
  onSignInSuccess,
  onForgotPassword,
  onLogoClick,
  isLoading = false,
}: SignInProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
    general?: string;
  }>({});

  const loginMutation = useLoginMutation();

  // Smart validation to detect email or phone number
  const validateIdentifier = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "Email or phone number is required";
    }

    const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
    const isPhone = phonePattern.test(trimmedValue.replace(/\s/g, ""));

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailPattern.test(trimmedValue);

    if (!isPhone && !isEmail) {
      return "Please enter a valid email address or phone number";
    }

    if (isPhone) {
      const cleanPhone = trimmedValue.replace(/[\s\-\(\)\+]/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        return "Please enter a valid phone number";
      }
    }

    return null;
  };

  const getIdentifierType = (value: string): "email" | "phone" | "unknown" => {
    const trimmedValue = value.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(trimmedValue)) {
      return "email";
    }

    const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (phonePattern.test(trimmedValue.replace(/\s/g, ""))) {
      return "phone";
    }

    return "unknown";
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) {
      return cleaned;
    }
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
      return `+234${cleaned.slice(1)}`;
    }
    return cleaned;
  };

  const getPlaceholderText = () => {
    const type = getIdentifierType(identifier);
    switch (type) {
      case "email":
        return "Enter your email address";
      case "phone":
        return "Enter your phone number";
      default:
        return "Enter email or phone number";
    }
  };

  const getInputIcon = () => {
    const type = getIdentifierType(identifier);
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4 text-slate-400" />;
      case "phone":
        return <Phone className="h-4 w-4 text-slate-400" />;
      default:
        return null;
    }
  };

  const validateForm = () => {
    const newErrors: { identifier?: string; password?: string } = {};

    const identifierError = validateIdentifier(identifier);
    if (identifierError) {
      newErrors.identifier = identifierError;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      const formattedIdentifier =
        getIdentifierType(identifier) === "phone"
          ? formatPhoneNumber(identifier)
          : identifier.trim().toLowerCase();

      const result = await loginMutation.mutateAsync({
        identifier: formattedIdentifier,
        password,
      });

      // Transform the user data to match the User type
      const transformedUser = transformBackendUser(result.user);

      // Call the success callback with the user object
      onSignInSuccess(transformedUser);
    } catch (error: any) {
      setErrors({
        general: error.message || "Invalid credentials. Please try again.",
      });
    }
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    if (errors.identifier || errors.general) {
      setErrors((prev) => ({
        ...prev,
        identifier: undefined,
        general: undefined,
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password || errors.general) {
      setErrors((prev) => ({
        ...prev,
        password: undefined,
        general: undefined,
      }));
    }
  };

  const handleForgotPassword = () => {
    const type = getIdentifierType(identifier);
    if (type === "phone") {
      toast.info("Password reset instructions will be sent via SMS.");
    } else {
      toast.info("Password reset instructions will be sent to your email.");
    }
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 sm:px-6 lg:px-8">
      <div className="absolute top-8 left-8">
        <button
          onClick={onLogoClick}
          className="transition-opacity duration-200 hover:opacity-75"
        >
          <Image
            src="/lizt.svg"
            alt="Lizt by Property Kraft"
            width={96}
            height={24}
            className="h-16 sm:h-24 w-auto object-contain"
          />
        </button>
      </div>

      <div className="flex flex-col justify-center min-h-screen">
        <div className="mx-4 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-6 px-4 shadow-sm border border-slate-200 rounded-xl sm:py-8 sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
                  <div className="text-sm text-red-700">{errors.general}</div>
                </div>
              )}

              <div>
                <Label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email or Phone Number
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder={getPlaceholderText()}
                    value={identifier}
                    onChange={handleIdentifierChange}
                    className={`w-full px-3 py-2 ${
                      getInputIcon() ? "pl-10" : ""
                    } border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:border-[#FF5000] text-sm ${
                      errors.identifier ? "border-red-300" : "border-slate-300"
                    }`}
                  />
                  {getInputIcon() && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {getInputIcon()}
                    </div>
                  )}
                  {errors.identifier && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.identifier}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <Label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:border-[#FF5000] text-sm ${
                      errors.password ? "border-red-300" : "border-slate-300"
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-slate-500 hover:text-[#FF5000] transition-colors duration-200"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <div className="mt-16">
                <Button
                  type="submit"
                  disabled={isLoading || loginMutation.isPending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF5000] hover:bg-[#E04500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading || loginMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              © 2025 Property Kraft. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
