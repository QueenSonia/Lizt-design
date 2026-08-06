"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FormSection } from "@/types/kycFormBuilder";

interface KycFormSectionSummaryProps {
  section: FormSection;
  defaultCollapsed?: boolean;
}

export function KycFormSectionSummary({
  section,
  defaultCollapsed = false,
}: KycFormSectionSummaryProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {section.title}
          </h3>
          <span className="shrink-0 text-xs text-gray-400">
            {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="px-5 pb-4">
          {section.fields.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-1">
              No fields in this section.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {section.fields.map((field) => (
                <li
                  key={field.id}
                  className="flex items-center justify-between gap-4 py-2 text-sm"
                >
                  <span className="text-gray-700">{field.label}</span>
                  <span
                    className={
                      field.required
                        ? "shrink-0 text-xs font-medium text-gray-500"
                        : "shrink-0 text-xs text-gray-400"
                    }
                  >
                    {field.required ? "Required" : "Optional"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
