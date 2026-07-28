"use client";

import { ChevronLeft, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormField, KycFormSchema } from "@/types/kycFormBuilder";

interface KycFormPreviewProps {
  schema: KycFormSchema;
  landlordName: string;
  onBackToEditing: () => void;
  onSaveForm: () => void;
}

function PreviewFieldLabel({ field }: { field: FormField }) {
  return (
    <label className="text-sm font-medium text-gray-800 mb-1.5 block">
      {field.label}
      {field.required ? (
        <span className="text-red-500 ml-0.5">*</span>
      ) : (
        <span className="text-gray-400 font-normal ml-1.5 text-xs">
          (Optional)
        </span>
      )}
    </label>
  );
}

function PreviewField({ field }: { field: FormField }) {
  switch (field.type) {
    case "short_text":
    case "email":
    case "phone":
    case "number":
    case "address":
      return (
        <div>
          <PreviewFieldLabel field={field} />
          <Input
            disabled
            type={
              field.type === "email"
                ? "email"
                : field.type === "number"
                  ? "number"
                  : field.type === "phone"
                    ? "tel"
                    : "text"
            }
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="bg-gray-50"
          />
        </div>
      );
    case "long_text":
      return (
        <div>
          <PreviewFieldLabel field={field} />
          <Textarea
            disabled
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className="bg-gray-50"
          />
        </div>
      );
    case "date":
      return (
        <div>
          <PreviewFieldLabel field={field} />
          <Input disabled type="date" className="bg-gray-50" />
        </div>
      );
    case "dropdown":
      return (
        <div>
          <PreviewFieldLabel field={field} />
          <Select disabled>
            <SelectTrigger className="bg-gray-50 w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "radio":
      return (
        <div>
          <PreviewFieldLabel field={field} />
          <RadioGroup disabled className="gap-2">
            {(field.options ?? []).map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <RadioGroupItem value={opt} disabled />
                {opt}
              </label>
            ))}
          </RadioGroup>
        </div>
      );
    case "multi_select":
      return (
        <div>
          <PreviewFieldLabel field={field} />
          <div className="space-y-2">
            {(field.options ?? []).map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <Checkbox disabled />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <Checkbox disabled className="mt-0.5" />
          <span>
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
        </label>
      );
    case "file_upload":
      return (
        <div>
          <PreviewFieldLabel field={field} />
          <div className="border-2 border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <Upload className="w-5 h-5 mb-1.5" />
            <p className="text-xs">Click or drag file to upload</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function KycFormPreview({
  schema,
  landlordName,
  onBackToEditing,
  onSaveForm,
}: KycFormPreviewProps) {
  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onBackToEditing}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            Preview — Tenant Application Form
          </p>
          <p className="text-xs text-gray-500">
            Exactly as tenants applying to {landlordName} will see it
          </p>
        </div>
        <Button variant="outline" onClick={onBackToEditing}>
          Back to Editing
        </Button>
        <Button
          onClick={onSaveForm}
          className="bg-[#FF5722] hover:bg-[#E64A19]"
        >
          Save Form
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm px-6 sm:px-10 py-8 space-y-8">
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900 uppercase">
              Tenant Application Form
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Read-only preview — no data can be entered here.
            </p>
          </div>

          {schema.sections.map((section) => (
            <div key={section.id}>
              <h2 className="text-sm font-bold text-gray-900 uppercase mb-4 pb-2 border-b border-gray-200">
                {section.title}
              </h2>
              <div className="space-y-5">
                {section.fields.map((field) => (
                  <PreviewField key={field.id} field={field} />
                ))}
                {section.fields.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No fields in this section.
                  </p>
                )}
              </div>
            </div>
          ))}

          {schema.sections.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-8">
              This form has no sections yet.
            </p>
          )}
        </div>

        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 mt-6 pb-4">
          <Button variant="outline" onClick={onBackToEditing} className="sm:w-auto">
            Back to Editing
          </Button>
          <Button
            onClick={onSaveForm}
            className="bg-[#FF5722] hover:bg-[#E64A19] sm:w-auto"
          >
            Save Form
          </Button>
        </div>
      </div>
    </div>
  );
}
