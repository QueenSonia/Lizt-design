import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Designs",
};

const DESIGNS = [
  {
    slug: "tenant-renewal-acceptance-flow",
    title: "Tenant Renewal Acceptance Flow",
    description:
      "Tenant-facing offer letter with accept/decline, OTP confirmation, payment, and receipt screens.",
  },
  {
    slug: "receipt",
    title: "Receipt",
    description:
      "Standalone payment receipt for a tenancy renewal — itemized breakdown, amount paid, and remaining balance.",
  },
  {
    slug: "kyc-form",
    title: "KYC Form",
    description:
      "Tenant onboarding wizard — phone verification, personal/employment/tenancy details, document uploads, and declaration.",
  },
];

export default function DesignsIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Designs</h1>
          <p className="text-sm text-gray-600">
            Standalone design previews for in-progress flows.
          </p>
        </header>

        <ul className="space-y-3">
          {DESIGNS.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/designs/${d.slug}`}
                className="block rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-[#FF5722] hover:bg-orange-50/30"
              >
                <h2 className="text-base font-semibold text-gray-900 mb-1">{d.title}</h2>
                <p className="text-sm text-gray-600">{d.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
