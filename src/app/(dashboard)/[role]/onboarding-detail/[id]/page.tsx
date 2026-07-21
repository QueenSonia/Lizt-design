"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import LandlordOnboardingDetail from "@/components/LandlordOnboardingDetail";
import { LoadingFallback } from "@/components/LoadingFallback";
import { MOCK_ONBOARDING_SUBMISSIONS } from "@/types/onboarding";

function OnboardingDetailContent() {
  const { id, role } = useParams();
  const router = useRouter();
  const onboardingId = Array.isArray(id) ? id[0] : id;

  const submission = MOCK_ONBOARDING_SUBMISSIONS.find((s) => s.id === onboardingId);

  const handleBack = () => {
    router.push(`/${role}/onboarding`);
  };

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Onboarding Submission Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            The requested onboarding submission could not be found.
          </p>
          <button
            onClick={handleBack}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <LandlordOnboardingDetail submission={submission} onBack={handleBack} />;
}

export default function OnboardingDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingDetailContent />
    </Suspense>
  );
}
