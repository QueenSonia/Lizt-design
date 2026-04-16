/* eslint-disable */
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// import liztLogo from './lizt.svg'
import { toast } from "sonner";

interface ForgotPasswordProps {
  onBack: () => void;
  onLogoClick?: () => void;
  isLoading?: boolean;
}

export function ForgotPassword({
  onBack,
  onLogoClick,
  isLoading = false,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; general?: string }>(
    {}
  );

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
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

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsSubmitted(true);
      toast.success("Password reset instructions sent to your email!");
    } catch (error) {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white py-12 sm:px-6 lg:px-8">
        {/* Logo - Top Left */}
        <div className="absolute top-8 left-8">
          <button
            onClick={onLogoClick}
            className="transition-opacity duration-200 hover:opacity-75"
          >
            <img
              src={"./lizt.svg" as any}
              alt="Lizt by Property Kraft"
              className="h-24 w-auto object-contain"
            />
          </button>
        </div>

        <div className="flex flex-col justify-center min-h-screen">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-xl sm:px-10">
              <div className="text-center space-y-6">
                {/* Success Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Check your email
                  </h2>
                  <p className="text-sm text-slate-600">
                    We've sent password reset instructions to{" "}
                    <span className="font-medium text-slate-900">{email}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Didn't receive the email? Check your spam folder or try
                    again.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={onBack}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF5000] hover:bg-[#E04500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5000] transition-colors duration-200"
                  >
                    Back to Sign In
                  </Button>

                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                      setErrors({});
                    }}
                    className="w-full text-sm text-slate-500 hover:text-[#FF5000] transition-colors duration-200"
                  >
                    Try a different email address
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
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

  return (
    <div className="min-h-screen bg-white py-12 sm:px-6 lg:px-8">
      {/* Logo - Top Left */}
      <div className="absolute top-8 left-8">
        <button
          onClick={onLogoClick}
          className="transition-opacity duration-200 hover:opacity-75"
        >
          <img
            src={"./lizt.svg" as any}
            alt="Lizt by Property Kraft"
            className="h-24 w-auto object-contain"
          />
        </button>
      </div>

      <div className="flex flex-col justify-center min-h-screen">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 rounded-xl sm:px-10">
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onBack}
                    className="flex items-center text-slate-600 hover:text-[#FF5000] transition-colors duration-200"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Reset your password
                  </h2>
                </div>
                <p className="text-sm text-slate-600">
                  Enter your email address and we'll send you instructions to
                  reset your password.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* General Error */}
                {errors.general && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-4">
                    <div className="text-sm text-red-700">{errors.general}</div>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <Label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF5000] focus:border-[#FF5000] ${
                        errors.email ? "border-red-300" : "border-slate-300"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF5000] hover:bg-[#E04500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending instructions...
                      </div>
                    ) : (
                      "Send reset instructions"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
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
