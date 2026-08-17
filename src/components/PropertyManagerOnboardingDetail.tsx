"use client";

import { ChevronLeft, Phone, Calendar, Building2 } from "lucide-react";
import { PropertyManagerOnboardingSubmission } from "@/types/propertyManagerOnboarding";

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) +
    ", " +
    date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

interface PropertyManagerOnboardingDetailProps {
  submission: PropertyManagerOnboardingSubmission;
  onBack: () => void;
}

export default function PropertyManagerOnboardingDetail({
  submission,
  onBack,
}: PropertyManagerOnboardingDetailProps) {
  return (
    <div className="page-container">
      {/* Header card */}
      <div className="bg-white shadow-sm mb-4 overflow-hidden -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 lg:-mt-8 lg:-mx-8">
        <div className="px-6 sm:px-8 py-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Onboarding
          </button>
        </div>

        <div className="border-t border-gray-100" />

        <div className="px-6 sm:px-8 py-5">
          <h1 className="text-xl font-semibold text-slate-900 leading-snug">
            {submission.propertyManagerName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            {submission.propertyManagerPhone}
          </p>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Submitted {formatDateTime(submission.submittedAt)}
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
            Property Manager Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-xs text-gray-500">Property Manager</p>
              <p className="text-sm text-gray-900 mt-0.5">{submission.propertyManagerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone Number</p>
              <p className="text-sm text-gray-900 mt-0.5">{submission.propertyManagerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                Number of Properties
              </p>
              <p className="text-sm text-gray-900 mt-0.5">{submission.numberOfProperties}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Submitted On</p>
              <p className="text-sm text-gray-900 mt-0.5">{formatDateTime(submission.submittedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
