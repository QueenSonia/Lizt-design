"use client";
import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, X, Building, Wrench, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { User, UserRole } from "@/types/user";
import {
  authenticate,
  buildUser,
  MOCK_ACCOUNTS,
  MockAccount,
} from "@/contexts/AuthContext";

interface SignInProps {
  onSignInSuccess: (user: User) => void;
  onForgotPassword?: () => void;
  onLogoClick?: () => void;
  isLoading?: boolean;
}

const ROLE_LABEL: Record<Exclude<UserRole, "">, string> = {
  landlord: "Landlord",
  "facility-manager": "Facility Manager",
  admin: "Admin",
};

const ROLE_DESCRIPTION: Record<Exclude<UserRole, "">, string> = {
  landlord: "Manage properties, tenants, rent, and applicants.",
  "facility-manager": "Triage maintenance issues and inspect common areas.",
  admin: "Oversee platform-wide activity, users, and operations.",
};

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
  const [pendingAccount, setPendingAccount] = useState<MockAccount | null>(
    null
  );
  const [demoCardOpen, setDemoCardOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const validateIdentifier = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return "Email or phone number is required";
    const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
    const isPhone = phonePattern.test(trimmedValue.replace(/\s/g, ""));
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailPattern.test(trimmedValue);
    if (!isPhone && !isEmail) {
      return "Please enter a valid email address or phone number";
    }
    return null;
  };

  const getIdentifierType = (value: string): "email" | "phone" | "unknown" => {
    const trimmedValue = value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(trimmedValue)) return "email";
    const phonePattern = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (phonePattern.test(trimmedValue.replace(/\s/g, ""))) return "phone";
    return "unknown";
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
    if (identifierError) newErrors.identifier = identifierError;
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const finishLogin = (account: MockAccount, role: UserRole) => {
    onSignInSuccess(buildUser(account, role));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;
    setSubmitting(true);
    const account = authenticate(identifier, password);
    setSubmitting(false);
    if (!account) {
      setErrors({ general: "Invalid credentials. Please try again." });
      return;
    }
    if (account.roles.length === 1) {
      finishLogin(account, account.roles[0]);
      return;
    }
    setPendingAccount(account);
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    if (errors.identifier || errors.general) {
      setErrors((prev) => ({
        ...prev,
        identifier: undefined,
        general: undefined,
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
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
    if (onForgotPassword) onForgotPassword();
  };

  const useDemoAccount = (account: MockAccount) => {
    setIdentifier(account.email);
    setPassword(account.password);
    setErrors({});
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
            {pendingAccount ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Choose a role to continue
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {pendingAccount.name} has access to multiple workspaces.
                    Pick one to start.
                  </p>
                </div>
                <div className="space-y-3">
                  {pendingAccount.roles
                    .filter((r): r is Exclude<UserRole, ""> => r !== "")
                    .map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => finishLogin(pendingAccount, role)}
                        className="w-full text-left flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-[#FF5000] hover:bg-orange-50 transition-colors"
                      >
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md bg-orange-50 text-[#FF5000]">
                          {role === "landlord" ? (
                            <Building className="h-5 w-5" />
                          ) : role === "facility-manager" ? (
                            <Wrench className="h-5 w-5" />
                          ) : (
                            <ShieldCheck className="h-5 w-5" />
                          )}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold text-slate-900">
                            Continue as {ROLE_LABEL[role]}
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5">
                            {ROLE_DESCRIPTION[role]}
                          </span>
                        </span>
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPendingAccount(null)}
                  className="text-xs text-slate-500 hover:text-[#FF5000]"
                >
                  ← Use different credentials
                </button>
              </div>
            ) : (
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
                    disabled={isLoading || submitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF5000] hover:bg-[#E04500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading || submitting ? (
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
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              © 2025 Property Kraft. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <DemoCredentialsCard
        open={demoCardOpen}
        onClose={() => setDemoCardOpen(false)}
        onUse={useDemoAccount}
      />
      {!demoCardOpen && (
        <button
          type="button"
          onClick={() => setDemoCardOpen(true)}
          className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-lg hover:bg-slate-800 transition"
        >
          Show demo accounts
        </button>
      )}
    </div>
  );
}

function DemoCredentialsCard({
  open,
  onClose,
  onUse,
}: {
  open: boolean;
  onClose: () => void;
  onUse: (account: MockAccount) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40 w-[320px] max-w-[calc(100vw-32px)] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5000]">
            Design demo
          </p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">
            Try a sample account
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide demo credentials"
          className="text-slate-400 hover:text-slate-600 transition-colors -mt-1 -mr-1 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {MOCK_ACCOUNTS.map((account) => (
          <li key={account.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {account.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {account.roles
                    .map((r) =>
                      r === "landlord"
                        ? "Landlord"
                        : r === "facility-manager"
                        ? "Facility Manager"
                        : r === "admin"
                        ? "Admin"
                        : ""
                    )
                    .filter(Boolean)
                    .join(" + ")}
                  {account.roles.length > 1 && " — picks role on sign-in"}
                </p>
                <p className="text-[11px] text-slate-600 mt-1.5 font-mono break-all">
                  {account.email}
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  {account.password}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUse(account)}
                className="shrink-0 text-[11px] font-semibold text-[#FF5000] hover:text-[#E04500] border border-[#FF5000] rounded-md px-2.5 py-1 transition-colors"
              >
                Use
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
