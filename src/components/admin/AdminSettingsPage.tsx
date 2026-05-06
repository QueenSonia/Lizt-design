"use client";
import { useState } from "react";
import { AdminPageHeader } from "./AdminPageHeader";
import { Globe, CreditCard, Shield, Mail, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    icon: Globe,
    title: "Platform",
    description: "Branding, domain, default locale, and timezone.",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description: "Payment gateways, fees, and payout schedules.",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Two-factor auth, session policies, and API keys.",
  },
  {
    icon: Mail,
    title: "Notifications",
    description: "Email and WhatsApp templates for system events.",
  },
];

export default function AdminSettingsPage() {
  const [maintenance, setMaintenance] = useState(false);
  const [autoKyc, setAutoKyc] = useState(true);

  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <AdminPageHeader
        title="Platform Settings"
        subtitle="Manage platform-level configuration."
      />

      <div className="bg-white border border-slate-200 rounded-xl mb-6">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Quick toggles</h3>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="font-medium text-slate-900">Maintenance mode</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Temporarily disable user access for upgrades.
              </div>
            </div>
            <button
              onClick={() => setMaintenance((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                maintenance ? "bg-[#FF5000]" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform ${
                  maintenance ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="font-medium text-slate-900">
                Auto-approve verified KYC
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Skip manual review for high-confidence matches.
              </div>
            </div>
            <button
              onClick={() => setAutoKyc((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoKyc ? "bg-[#FF5000]" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform ${
                  autoKyc ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {SECTIONS.map((s) => (
          <button
            key={s.title}
            className="w-full flex items-center gap-4 p-5 hover:bg-slate-50/50 text-left transition-colors"
          >
            <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
              <s.icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900">{s.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.description}</div>
            </div>
            <ChevronRight className="size-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
