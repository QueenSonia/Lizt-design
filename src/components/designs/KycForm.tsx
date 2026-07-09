"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as React from "react";
import Image from "next/image";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as LabelPrimitive from "@radix-ui/react-label";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckIcon,
  ChevronDownIcon,
  Loader2,
  Lock,
  Upload,
  FileText,
  ImageIcon,
  X,
} from "lucide-react";

const BRAND_COLOR = "#FF5000";
const LOGO_SRC = "/designs/receipt/lizt.png";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------------------------------
 * Small UI primitives (flattened, shadcn-style)
 * ---------------------------------------------------------------------- */

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-sm font-medium text-gray-700 flex items-center gap-1 select-none",
        className,
      )}
      {...props}
    />
  );
}

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm placeholder:text-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-gray-300 bg-white outline-none transition-colors data-[state=checked]:text-white disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        backgroundColor: props.checked ? BRAND_COLOR : undefined,
        borderColor: props.checked ? BRAND_COLOR : undefined,
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />;
}
function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value {...props} />;
}
function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-gray-400",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}
function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        className={cn(
          "z-50 max-h-64 min-w-[8rem] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md data-[side=bottom]:translate-y-1",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1 w-full min-w-[var(--radix-select-trigger-width)]">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none focus:bg-gray-100",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="text-sm text-red-600 mt-1">{children}</p>;
}

/* -------------------------------------------------------------------------
 * Brand banner
 * ---------------------------------------------------------------------- */

function BrandBanner({
  onBack,
  showBackButton = !!onBack,
}: {
  onBack?: () => void;
  showBackButton?: boolean;
}) {
  return (
    <div
      className="w-full py-2 px-4 mt-2 sm:py-4 sm:px-6 sm:mt-4 lg:px-8"
      style={{ backgroundColor: "#1f2937" }}
    >
      <div className="max-w-7xl mx-auto relative flex items-center justify-center h-8">
        {showBackButton && (
          <button
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Image src={LOGO_SRC} alt="Lizt" width={120} height={32} className="h-8 w-auto object-contain" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Mock file upload (no Cloudinary — just a local preview)
 * ---------------------------------------------------------------------- */

function MockFileUpload({
  label,
  description,
  accept,
  required,
  file,
  onChange,
}: {
  label: string;
  description: string;
  accept: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.type?.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span style={{ color: BRAND_COLOR }} className="ml-1">
            *
          </span>
        )}
      </label>

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          isDragOver
            ? "border-orange-500 bg-orange-50"
            : file
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onChange(f);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f);
          }}
        />

        <div className="text-center">
          {file ? (
            <div className="flex items-center justify-center space-x-3">
              {file.type?.startsWith("image/") ? (
                <ImageIcon className="h-8 w-8 text-blue-500" />
              ) : (
                <FileText className="h-8 w-8 text-gray-500" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-orange-600">Click to upload</span> or drag and
                drop
              </p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="mt-3">
          <Image
            src={previewUrl}
            alt={`Preview of ${file?.name}`}
            width={128}
            height={128}
            unoptimized
            className="max-w-full h-32 object-cover rounded-lg border"
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Step tracker
 * ---------------------------------------------------------------------- */

const FORM_STEPS = [
  { number: 1, title: "Personal Details", subtitle: "Tell us about yourself and your emergency contact" },
  { number: 2, title: "Employment Details", subtitle: "Tell us about your work and income" },
  { number: 3, title: "Tenancy Information", subtitle: "Tell us about your rental requirements" },
  { number: 4, title: "Identification & Declaration", subtitle: "Upload your documents and confirm details" },
];

function HorizontalStepTracker({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between max-w-3xl mx-auto">
        {FORM_STEPS.map((step, index) => {
          const isCompleted = index < currentStep - 1;
          const isActive = index === currentStep - 1;
          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center relative flex-1 mt-4">
                <div className="shrink-0 mb-2">
                  {isCompleted ? (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: BRAND_COLOR }}
                    >
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    </div>
                  ) : isActive ? (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: BRAND_COLOR, boxShadow: "0 0 0 3px rgba(255, 80, 0, 0.1)" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-[10px] sm:text-xs leading-tight",
                      isActive ? "text-gray-900 font-medium" : isCompleted ? "text-gray-700" : "text-gray-400",
                    )}
                  >
                    {step.title}
                  </div>
                </div>
              </div>
              {index < FORM_STEPS.length - 1 && (
                <div className="flex-1 px-2 mt-4 h-6 flex items-center">
                  <div
                    className="h-0.5 w-full"
                    style={{ background: index < currentStep - 1 ? BRAND_COLOR : "#E5E7EB" }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Form data + mock state
 * ---------------------------------------------------------------------- */

interface KycFormData {
  first_name: string;
  last_name: string;
  email: string;
  contact_address: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  state_of_origin: string;
  marital_status: string;
  religion: string;
  next_of_kin_full_name: string;
  next_of_kin_email: string;
  next_of_kin_phone_number: string;
  next_of_kin_address: string;
  next_of_kin_relationship: string;
  employment_status: string;
  job_title: string;
  employer_name: string;
  work_address: string;
  work_phone_number: string;
  length_of_employment: string;
  monthly_net_income: string;
  nature_of_business: string;
  business_name: string;
  business_address: string;
  business_duration: string;
  estimated_monthly_income: string;
  property_applying_for: string;
  intended_use_of_property: string;
  number_of_occupants: string;
  parking_needs: string;
  proposed_rent_amount: string;
  rent_payment_frequency: string;
  additional_notes: string;
  referral_agent_full_name: string;
  referral_agent_phone_number: string;
  passport_photo: File | null;
  id_document: File | null;
  employment_proof: File | null;
  business_proof: File | null;
  declaration_accepted: boolean;
}

const INITIAL_FORM_DATA: KycFormData = {
  first_name: "",
  last_name: "",
  email: "",
  contact_address: "",
  phone_number: "",
  date_of_birth: "",
  gender: "",
  nationality: "",
  state_of_origin: "",
  marital_status: "",
  religion: "",
  next_of_kin_full_name: "",
  next_of_kin_email: "",
  next_of_kin_phone_number: "",
  next_of_kin_address: "",
  next_of_kin_relationship: "",
  employment_status: "",
  job_title: "",
  employer_name: "",
  work_address: "",
  work_phone_number: "",
  length_of_employment: "",
  monthly_net_income: "",
  nature_of_business: "",
  business_name: "",
  business_address: "",
  business_duration: "",
  estimated_monthly_income: "",
  property_applying_for: "",
  intended_use_of_property: "",
  number_of_occupants: "",
  parking_needs: "",
  proposed_rent_amount: "",
  rent_payment_frequency: "",
  additional_notes: "",
  referral_agent_full_name: "",
  referral_agent_phone_number: "",
  passport_photo: null,
  id_document: null,
  employment_proof: null,
  business_proof: null,
  declaration_accepted: false,
};

const MOCK_PROPERTIES = [
  {
    id: "prop-1",
    name: "Two Bedroom Flat — Lekki Phase 1",
    description: "3 Taye Olowu Street, Lekki, Lagos",
    rentalPrice: 3500000,
  },
  {
    id: "prop-2",
    name: "Three Bedroom Duplex — Ikoyi",
    description: "12 Bourdillon Road, Ikoyi, Lagos",
    rentalPrice: 8500000,
  },
  {
    id: "prop-3",
    name: "Studio Apartment — Yaba",
    description: "45 Herbert Macaulay Way, Yaba, Lagos",
    rentalPrice: 1800000,
  },
];

const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
const formatNumberWithCommas = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function inputClass(hasError?: boolean) {
  return hasError ? "border-red-500" : "";
}

/* -------------------------------------------------------------------------
 * Step 1 — Personal Details
 * ---------------------------------------------------------------------- */

function PersonalDetailsStep({
  formData,
  onChange,
  errors,
}: {
  formData: KycFormData;
  onChange: (data: Partial<KycFormData>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-5">
          Personal Information
        </h3>
        <div className="space-y-5">
          <div>
            <Label htmlFor="phone_number">
              WhatsApp Phone Number <span style={{ color: BRAND_COLOR }}>*</span>
            </Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              readOnly
              disabled
              className="max-w-sm mt-1.5 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1.5">Verified phone number</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => onChange({ first_name: e.target.value })}
                placeholder="Enter first name"
                className={inputClass(!!errors.first_name)}
              />
              <FieldError>{errors.first_name}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => onChange({ last_name: e.target.value })}
                placeholder="Enter last name"
                className={inputClass(!!errors.last_name)}
              />
              <FieldError>{errors.last_name}</FieldError>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_address">Contact Address</Label>
            <Input
              id="contact_address"
              value={formData.contact_address}
              onChange={(e) => onChange({ contact_address: e.target.value })}
              placeholder="Enter your current residential address"
              className={inputClass(!!errors.contact_address)}
            />
            <FieldError>{errors.contact_address}</FieldError>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => onChange({ nationality: e.target.value })}
                placeholder="Select nationality"
                className={inputClass(!!errors.nationality)}
              />
              <FieldError>{errors.nationality}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_of_origin">State of Origin</Label>
              <Input
                id="state_of_origin"
                value={formData.state_of_origin}
                onChange={(e) => onChange({ state_of_origin: e.target.value })}
                placeholder="Select state"
                className={inputClass(!!errors.state_of_origin)}
              />
              <FieldError>{errors.state_of_origin}</FieldError>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => onChange({ gender: v })}>
                <SelectTrigger id="gender" className={inputClass(!!errors.gender)}>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{errors.gender}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => onChange({ date_of_birth: e.target.value })}
                className={inputClass(!!errors.date_of_birth)}
              />
              <FieldError>{errors.date_of_birth}</FieldError>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select
                value={formData.marital_status}
                onValueChange={(v) => onChange({ marital_status: v })}
              >
                <SelectTrigger id="marital_status" className={inputClass(!!errors.marital_status)}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{errors.marital_status}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="religion">Religion</Label>
              <Select value={formData.religion} onValueChange={(v) => onChange({ religion: v })}>
                <SelectTrigger id="religion" className={inputClass(!!errors.religion)}>
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Christianity">Christianity</SelectItem>
                  <SelectItem value="Islam">Islam</SelectItem>
                  <SelectItem value="Traditional">Traditional</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{errors.religion}</FieldError>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="your.email@example.com"
              className={inputClass(!!errors.email)}
            />
            <FieldError>{errors.email}</FieldError>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-5">
          Next of Kin Details
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="next_of_kin_full_name">Full Name</Label>
            <Input
              id="next_of_kin_full_name"
              value={formData.next_of_kin_full_name}
              onChange={(e) => onChange({ next_of_kin_full_name: e.target.value })}
              placeholder="Enter next of kin full name"
              className={inputClass(!!errors.next_of_kin_full_name)}
            />
            <FieldError>{errors.next_of_kin_full_name}</FieldError>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_of_kin_address">Address</Label>
            <Input
              id="next_of_kin_address"
              value={formData.next_of_kin_address}
              onChange={(e) => onChange({ next_of_kin_address: e.target.value })}
              placeholder="Enter next of kin address"
              className={inputClass(!!errors.next_of_kin_address)}
            />
            <FieldError>{errors.next_of_kin_address}</FieldError>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="next_of_kin_relationship">Relationship</Label>
              <Input
                id="next_of_kin_relationship"
                value={formData.next_of_kin_relationship}
                onChange={(e) => onChange({ next_of_kin_relationship: e.target.value })}
                placeholder="e.g., Father, Sister"
                className={inputClass(!!errors.next_of_kin_relationship)}
              />
              <FieldError>{errors.next_of_kin_relationship}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_of_kin_phone_number">Phone Number</Label>
              <Input
                id="next_of_kin_phone_number"
                type="tel"
                value={formData.next_of_kin_phone_number}
                onChange={(e) => onChange({ next_of_kin_phone_number: e.target.value })}
                placeholder="+234 800 000 0000"
                className={inputClass(!!errors.next_of_kin_phone_number)}
              />
              <FieldError>{errors.next_of_kin_phone_number}</FieldError>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_of_kin_email">Email Address</Label>
            <Input
              id="next_of_kin_email"
              type="email"
              value={formData.next_of_kin_email}
              onChange={(e) => onChange({ next_of_kin_email: e.target.value })}
              placeholder="next.of.kin@example.com"
              className={inputClass(!!errors.next_of_kin_email)}
            />
            <FieldError>{errors.next_of_kin_email}</FieldError>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Step 2 — Employment Details
 * ---------------------------------------------------------------------- */

function EmploymentDetailsStep({
  formData,
  onChange,
  errors,
}: {
  formData: KycFormData;
  onChange: (data: Partial<KycFormData>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-5">
          Employment Information
        </h3>
        <div className="space-y-5">
          <div>
            <Label htmlFor="employment_status">Employment Status</Label>
            <Select
              value={formData.employment_status}
              onValueChange={(v) => onChange({ employment_status: v })}
            >
              <SelectTrigger id="employment_status" className={cn("mt-1.5", inputClass(!!errors.employment_status))}>
                <SelectValue placeholder="Select employment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self-employed">Self-Employed</SelectItem>
              </SelectContent>
            </Select>
            <FieldError>{errors.employment_status}</FieldError>
          </div>

          {formData.employment_status === "employed" && (
            <>
              <div>
                <Label htmlFor="employer_name">Employer Name</Label>
                <Input
                  id="employer_name"
                  value={formData.employer_name}
                  onChange={(e) => onChange({ employer_name: e.target.value })}
                  placeholder="Enter employer name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => onChange({ job_title: e.target.value })}
                  placeholder="Enter job title"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="work_address">Work Address</Label>
                <Input
                  id="work_address"
                  value={formData.work_address}
                  onChange={(e) => onChange({ work_address: e.target.value })}
                  placeholder="Enter work address"
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work_phone_number">Work Phone Number</Label>
                  <Input
                    id="work_phone_number"
                    type="tel"
                    value={formData.work_phone_number}
                    onChange={(e) => onChange({ work_phone_number: e.target.value })}
                    placeholder="+234 800 000 0000"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="length_of_employment">Length of Employment</Label>
                  <Input
                    id="length_of_employment"
                    value={formData.length_of_employment}
                    onChange={(e) => onChange({ length_of_employment: e.target.value })}
                    placeholder="e.g., 2 years"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="monthly_net_income">Monthly Income (₦)</Label>
                <Input
                  id="monthly_net_income"
                  value={formData.monthly_net_income}
                  onChange={(e) =>
                    onChange({ monthly_net_income: formatNumberWithCommas(e.target.value) })
                  }
                  placeholder="Enter monthly income"
                  className="mt-1.5"
                />
              </div>
            </>
          )}

          {formData.employment_status === "self-employed" && (
            <>
              <div>
                <Label htmlFor="nature_of_business">Nature of Business</Label>
                <Input
                  id="nature_of_business"
                  value={formData.nature_of_business}
                  onChange={(e) => onChange({ nature_of_business: e.target.value })}
                  placeholder="e.g., Retail, Consulting"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => onChange({ business_name: e.target.value })}
                  placeholder="Enter business name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="business_address">Business Address</Label>
                <Input
                  id="business_address"
                  value={formData.business_address}
                  onChange={(e) => onChange({ business_address: e.target.value })}
                  placeholder="Enter business address"
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_duration">Business Duration</Label>
                  <Input
                    id="business_duration"
                    value={formData.business_duration}
                    onChange={(e) => onChange({ business_duration: e.target.value })}
                    placeholder="e.g., 3 years"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_monthly_income">Estimated Monthly Income (₦)</Label>
                  <Input
                    id="estimated_monthly_income"
                    value={formData.estimated_monthly_income}
                    onChange={(e) =>
                      onChange({
                        estimated_monthly_income: formatNumberWithCommas(e.target.value),
                      })
                    }
                    placeholder="Enter monthly income"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Step 3 — Tenancy Information
 * ---------------------------------------------------------------------- */

function TenancyInformationStep({
  formData,
  onChange,
  errors,
}: {
  formData: KycFormData;
  onChange: (data: Partial<KycFormData>) => void;
  errors: Record<string, string>;
}) {
  const selected = MOCK_PROPERTIES.find((p) => p.id === formData.property_applying_for);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">Property Applying For</h3>
        <div className="space-y-2">
          <Select
            value={formData.property_applying_for}
            onValueChange={(v) => onChange({ property_applying_for: v })}
          >
            <SelectTrigger id="property_applying_for" className={cn("h-auto min-h-[44px] py-2", inputClass(!!errors.property_applying_for))}>
              {selected ? (
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-semibold">{selected.name}</span>
                  <span className="text-sm text-gray-600">{selected.description}</span>
                  <span className="text-sm" style={{ color: BRAND_COLOR }}>
                    {formatCurrency(selected.rentalPrice)} per year
                  </span>
                </div>
              ) : (
                <SelectValue placeholder="Select a property" />
              )}
            </SelectTrigger>
            <SelectContent>
              {MOCK_PROPERTIES.map((property) => (
                <SelectItem key={property.id} value={property.id} className="py-2.5">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold">{property.name}</span>
                    <span className="text-sm text-gray-600">{property.description}</span>
                    <span className="text-sm" style={{ color: BRAND_COLOR }}>
                      {formatCurrency(property.rentalPrice)} per year
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{errors.property_applying_for}</FieldError>
        </div>
      </div>

      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">Property Usage</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="intended_use_of_property" className="mb-2">
                Intended Use of Property
              </Label>
              <Select
                value={formData.intended_use_of_property}
                onValueChange={(v) => onChange({ intended_use_of_property: v })}
              >
                <SelectTrigger id="intended_use_of_property" className={inputClass(!!errors.intended_use_of_property)}>
                  <SelectValue placeholder="Select intended use" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{errors.intended_use_of_property}</FieldError>
            </div>
            <div>
              <Label htmlFor="number_of_occupants" className="mb-2">
                Number of Occupants
              </Label>
              <Input
                id="number_of_occupants"
                type="number"
                min="0"
                value={formData.number_of_occupants}
                onChange={(e) => onChange({ number_of_occupants: e.target.value })}
                placeholder="0"
                className={inputClass(!!errors.number_of_occupants)}
              />
              <FieldError>{errors.number_of_occupants}</FieldError>
            </div>
          </div>

          <div>
            <Label htmlFor="parking_needs" className="mb-2">
              Number of Cars Owned
            </Label>
            <Input
              id="parking_needs"
              type="number"
              min="0"
              value={formData.parking_needs}
              onChange={(e) => onChange({ parking_needs: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">Rental Offer</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proposed_rent_amount" className="mb-2">
                Proposed Rent Amount (₦)
              </Label>
              <Input
                id="proposed_rent_amount"
                value={formData.proposed_rent_amount}
                onChange={(e) =>
                  onChange({ proposed_rent_amount: formatNumberWithCommas(e.target.value) })
                }
                placeholder="0"
                className={inputClass(!!errors.proposed_rent_amount)}
              />
              <FieldError>{errors.proposed_rent_amount}</FieldError>
            </div>
            <div>
              <Label htmlFor="rent_payment_frequency" className="mb-2">
                Rent Payment Frequency
              </Label>
              <Select
                value={formData.rent_payment_frequency}
                onValueChange={(v) => onChange({ rent_payment_frequency: v })}
              >
                <SelectTrigger id="rent_payment_frequency" className={inputClass(!!errors.rent_payment_frequency)}>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Bi-Annually">Bi-Annually</SelectItem>
                  <SelectItem value="Annually">Annually</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{errors.rent_payment_frequency}</FieldError>
            </div>
          </div>

          <div>
            <Label htmlFor="additional_notes" className="mb-2">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="additional_notes"
              value={formData.additional_notes}
              onChange={(e) => onChange({ additional_notes: e.target.value })}
              placeholder="Any additional information you'd like to share..."
              rows={4}
              className="mt-1.5 resize-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-5">
          Agent Referral Information
        </h3>
        <div className="space-y-5">
          <div>
            <Label htmlFor="referral_agent_full_name">
              Agent Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="referral_agent_full_name"
              value={formData.referral_agent_full_name}
              onChange={(e) => onChange({ referral_agent_full_name: e.target.value })}
              placeholder="Enter agent's name"
              className="mt-1.5"
            />
            <FieldError>{errors.referral_agent_full_name}</FieldError>
          </div>
          <div>
            <Label htmlFor="referral_agent_phone_number">
              Agent Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="referral_agent_phone_number"
              type="tel"
              value={formData.referral_agent_phone_number}
              onChange={(e) => onChange({ referral_agent_phone_number: e.target.value })}
              placeholder="+234 800 000 0000"
              className="mt-1.5"
            />
            <FieldError>{errors.referral_agent_phone_number}</FieldError>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Step 4 — Identification & Declaration
 * ---------------------------------------------------------------------- */

function IdentificationDeclarationStep({
  formData,
  onChange,
  errors,
}: {
  formData: KycFormData;
  onChange: (data: Partial<KycFormData>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">Document Uploads</h3>
        <div className="space-y-6">
          <MockFileUpload
            label="Passport Photograph"
            description="Upload a recent passport-size photograph (JPG, PNG - Max 5MB)"
            accept="image/*"
            required
            file={formData.passport_photo}
            onChange={(file) => onChange({ passport_photo: file })}
          />
          <FieldError>{errors.passport_photo}</FieldError>

          <MockFileUpload
            label="Means of Identification"
            description="Upload valid ID (National ID, Driver's License, Voter's Card, Int'l Passport)"
            accept="image/*,.pdf"
            required
            file={formData.id_document}
            onChange={(file) => onChange({ id_document: file })}
          />
          <FieldError>{errors.id_document}</FieldError>

          {formData.employment_status === "employed" && (
            <MockFileUpload
              label="Proof of Employment"
              description="Upload employment letter or recent payslip (PDF or Image)"
              accept="image/*,.pdf"
              required
              file={formData.employment_proof}
              onChange={(file) => onChange({ employment_proof: file })}
            />
          )}

          {formData.employment_status === "self-employed" && (
            <MockFileUpload
              label="Proof of Business"
              description="e.g., CAC certificate, business registration document, or utility bill with business name"
              accept="image/*,.pdf"
              required
              file={formData.business_proof}
              onChange={(file) => onChange({ business_proof: file })}
            />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-gray-900 mb-8 pb-2 border-b border-gray-200">Declaration</h3>
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div className="text-sm text-gray-700 space-y-3">
            <p>I hereby declare that:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>All information provided in this application is true and accurate to the best of my knowledge</li>
              <li>I understand that any false information may result in immediate termination of the tenancy agreement</li>
              <li>I consent to background checks and verification of the information provided</li>
              <li>I agree to abide by all terms and conditions of the tenancy agreement</li>
              <li>I will use the property solely for the intended purpose stated in this application</li>
            </ul>
          </div>
          <div className="flex items-start gap-3 pt-4">
            <Checkbox
              id="declaration"
              checked={formData.declaration_accepted}
              onCheckedChange={(checked) => onChange({ declaration_accepted: checked === true })}
              className="mt-0.5"
            />
            <Label htmlFor="declaration" className="cursor-pointer leading-relaxed font-normal">
              I have read and agree to the above declaration <span style={{ color: BRAND_COLOR }}>*</span>
            </Label>
          </div>
          <FieldError>{errors.declaration_accepted}</FieldError>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
        <p className="text-sm text-gray-900">
          <strong>📋 Note:</strong> By submitting this application, you acknowledge that the
          landlord may contact your references, verify your employment, and conduct necessary
          background checks. Your information will be kept confidential and used solely for
          tenancy processing.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Navigation controls
 * ---------------------------------------------------------------------- */

function NavigationControls({
  currentStep,
  totalSteps,
  isSubmitting,
  onNext,
  onSubmit,
}: {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const isLastStep = currentStep === totalSteps;
  return (
    <div>
      <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 mt-8 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {isLastStep ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 h-11 px-6 rounded-md text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Application <ArrowRight className="ml-1 w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex-1 h-11 px-6 rounded-md text-white text-sm font-medium transition-all w-full sm:w-auto inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              Continue <ArrowRight className="ml-1 w-4 h-4" />
            </button>
          )}
        </div>
      </nav>
      <p className="text-center text-xs text-gray-500 mt-6">
        Need help? Contact support at{" "}
        <a href="mailto:hello@example.com" className="hover:underline" style={{ color: BRAND_COLOR }}>
          hello@example.com
        </a>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Mock phone verification (no real OTP backend)
 * ---------------------------------------------------------------------- */

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function MockPhoneVerification({ onComplete }: { onComplete: (phone: string) => void }) {
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const submitPhone = () => {
    if (!isValidPhone(phone)) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStage("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }, 600);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (index === 5 && value && next.join("").length === 6) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onComplete(phone);
      }, 500);
    }
  };

  if (stage === "phone") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 flex flex-col">
        <BrandBanner />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl p-8 sm:p-10"
          >
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-1.5">Welcome 👋</h2>
              <p className="text-sm text-gray-600">
                Enter your WhatsApp number to get started with your KYC.
              </p>
              <p className="text-sm text-gray-600 mt-1">
                We&apos;ll send a verification code to you on WhatsApp to securely confirm your
                identity.
              </p>
            </div>
            <div className="space-y-5">
              <div>
                <Label htmlFor="phone" className="mb-2 block">
                  WhatsApp Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  disabled={isSubmitting}
                />
              </div>
              <button
                onClick={submitPhone}
                disabled={!isValidPhone(phone) || isSubmitting}
                className="w-full h-11 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: isValidPhone(phone) ? BRAND_COLOR : "#d1d5db" }}
              >
                {isSubmitting ? "Sending..." : "Continue"}
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-500">
              <Lock className="w-3.5 h-3.5" />
              <p className="text-xs">Your information is secure</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 flex flex-col">
      <BrandBanner onBack={() => setStage("phone")} />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl p-8 sm:p-10"
        >
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-1.5">Verify Your Number</h2>
            <p className="text-sm text-gray-600">
              We&apos;ve sent a 6-digit code to <span className="font-medium text-gray-900">{phone}</span>
            </p>
          </div>
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Enter verification code</Label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    disabled={isSubmitting}
                    className="w-11 h-12 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg outline-none transition-all disabled:opacity-50"
                  />
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                Enter any 6 digits to continue — this is a design preview.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Success page
 * ---------------------------------------------------------------------- */

function SuccessPage({ applicantName }: { applicantName: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 flex flex-col">
      <BrandBanner />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl p-8 sm:p-10 text-center"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "#F0FDF4" }}
          >
            <Check className="w-8 h-8 text-green-600" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted</h2>
          <p className="text-sm text-gray-600 mb-1">
            Thank you{applicantName ? `, ${applicantName}` : ""}. Your KYC application has been
            received.
          </p>
          <p className="text-sm text-gray-600">
            The landlord will review your application and reach out with next steps.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Multi-step form shell
 * ---------------------------------------------------------------------- */

function MultiStepForm({ verifiedPhone, onSubmitted }: { verifiedPhone: string; onSubmitted: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<KycFormData>({
    ...INITIAL_FORM_DATA,
    phone_number: verifiedPhone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(0);

  const totalSteps = FORM_STEPS.length;

  const handleDataChange = useCallback((data: Partial<KycFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const goToNextStep = () => {
    if (currentStep >= totalSteps) return;
    setErrors({});
    setDirection(1);
    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPreviousStep = () => {
    if (currentStep <= 1) return;
    setErrors({});
    setDirection(-1);
    setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitted();
    }, 900);
  };

  const stepData = FORM_STEPS[currentStep - 1];

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      <div className="sticky top-0 z-40 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <BrandBanner onBack={goToPreviousStep} showBackButton={currentStep > 1} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-10 sm:mb-12">
          <HorizontalStepTracker currentStep={currentStep} />
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
          >
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
              <div className="mb-6">
                <h2 className="text-gray-900 text-lg font-semibold">{stepData.title}</h2>
                <p className="text-sm text-gray-500">{stepData.subtitle}</p>
              </div>

              <div className="space-y-4">
                {currentStep === 1 && (
                  <PersonalDetailsStep formData={formData} onChange={handleDataChange} errors={errors} />
                )}
                {currentStep === 2 && (
                  <EmploymentDetailsStep formData={formData} onChange={handleDataChange} errors={errors} />
                )}
                {currentStep === 3 && (
                  <TenancyInformationStep formData={formData} onChange={handleDataChange} errors={errors} />
                )}
                {currentStep === 4 && (
                  <IdentificationDeclarationStep formData={formData} onChange={handleDataChange} errors={errors} />
                )}

                <NavigationControls
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  isSubmitting={isSubmitting}
                  onNext={goToNextStep}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Root component
 * ---------------------------------------------------------------------- */

export default function KycForm() {
  const [stage, setStage] = useState<"verify" | "form" | "success">("verify");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [applicantName, setApplicantName] = useState("");

  if (stage === "verify") {
    return (
      <MockPhoneVerification
        onComplete={(phone) => {
          setVerifiedPhone(phone);
          setStage("form");
        }}
      />
    );
  }

  if (stage === "success") {
    return <SuccessPage applicantName={applicantName} />;
  }

  return (
    <MultiStepForm
      verifiedPhone={verifiedPhone}
      onSubmitted={() => {
        setApplicantName("");
        setStage("success");
      }}
    />
  );
}
