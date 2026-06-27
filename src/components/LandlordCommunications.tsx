/* eslint-disable */
"use client";
import { useState, useMemo } from "react";
import { Send, X, Plus, Users, Building, User, Check, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import LandlordTopNav from "./LandlordTopNav";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Broadcast {
  id: string;
  title: string;
  body: string;
  recipientType: "all" | "properties" | "individuals";
  recipientCount: number;
  recipientLabel: string;
  sentAt: string;
  status: "sent" | "failed";
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_TENANTS = [
  { id: "t-001", name: "James Okafor", property: "Lekki Phase 1 Duplex" },
  { id: "t-002", name: "Adaeze Nwosu", property: "Ikoyi 2-Bed Apartment" },
  { id: "t-003", name: "Emmanuel Etim", property: "Victoria Island Studio" },
];

const MOCK_PROPERTIES = [
  { id: "p-001", name: "Lekki Phase 1 Duplex", tenants: 1 },
  { id: "p-002", name: "Ikoyi 2-Bed Apartment", tenants: 1 },
  { id: "p-003", name: "Victoria Island Studio", tenants: 1 },
];

const SEED_BROADCASTS: Broadcast[] = [
  {
    id: "bc-001",
    title: "End of Year Maintenance Notice",
    body: "Dear tenants, we will be conducting routine maintenance checks across all properties from December 20–22. Please ensure access is available during this period.",
    recipientType: "all",
    recipientCount: 3,
    recipientLabel: "All Tenants",
    sentAt: "2026-06-10T09:00:00Z",
    status: "sent",
  },
  {
    id: "bc-002",
    title: "Rent Increase Notice — 2027",
    body: "Please be advised that rent for the upcoming renewal period will reflect a 5% increase in line with market rates. Your renewal offer will be sent separately.",
    recipientType: "all",
    recipientCount: 3,
    recipientLabel: "All Tenants",
    sentAt: "2026-05-15T10:30:00Z",
    status: "sent",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}


// ── Compose Modal ─────────────────────────────────────────────────────────────

type RecipientMode = "all" | "individuals";
type Step = "recipients" | "compose" | "preview";

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: (b: Broadcast) => void }) {
  const [step, setStep] = useState<Step>("recipients");
  const [mode, setMode] = useState<RecipientMode>("all");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");

  const recipientCount = mode === "all"
    ? MOCK_TENANTS.length
    : selectedTenants.length;

  const recipientLabel = mode === "all"
    ? "All Tenants"
    : `${selectedTenants.length} Tenant${selectedTenants.length !== 1 ? "s" : ""}`;

  const MAX_BODY = 500;
  const MAX_TITLE = 100;
  const canProceedRecipients = mode === "all" || (mode === "individuals" && selectedTenants.length > 0);
  const canProceedCompose = broadcastTitle.trim().length > 0 && broadcastTitle.length <= MAX_TITLE && body.trim().length > 0 && body.length <= MAX_BODY;
  const previewTenantName = mode === "individuals" && selectedTenants.length === 1
    ? MOCK_TENANTS.find(t => t.id === selectedTenants[0])?.name ?? "Tenant"
    : "Tenant";
  const collapsedBody = body.replace(/\n+/g, " ").trim();

  const filteredTenants = MOCK_TENANTS.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.property.toLowerCase().includes(search.toLowerCase())
  );

  function handleSend() {
    const broadcast: Broadcast = {
      id: `bc-${Date.now()}`,
      title: broadcastTitle.trim(),
      body,
      recipientType: mode,
      recipientCount,
      recipientLabel,
      sentAt: new Date().toISOString(),
      status: "sent",
    };
    onSent(broadcast);
    toast.success(`Broadcast sent to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}.`);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <p className="text-base font-semibold text-gray-900">Send Broadcast</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === "recipients" ? "Step 1: Select recipients" : step === "compose" ? "Step 2: Write announcement" : "Step 3: Confirm & send"}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* Step 1: Recipients */}
            {step === "recipients" && (
              <div className="space-y-5">

                {/* Radio: Select All Tenants */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={mode === "all"}
                    onChange={() => { setMode("all"); setSelectedTenants([]); setSearch(""); }}
                    className="mt-0.5 w-4 h-4 accent-[#FF5000] cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Select All Tenants</p>
                    {mode === "all" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Message will be sent to all <strong>{MOCK_TENANTS.length} active tenants</strong>.
                      </p>
                    )}
                  </div>
                </label>

                {/* Radio: Select Tenants */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={mode === "individuals"}
                    onChange={() => { setMode("individuals"); setSelectedTenants([]); setSearch(""); }}
                    className="mt-0.5 w-4 h-4 accent-[#FF5000] cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Select Tenants</p>
                  </div>
                </label>

                {/* Tenant list — only when "individuals" selected */}
                {mode === "individuals" && (
                  <div className="ml-7 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search tenants…"
                        className="pl-9 h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredTenants.map(t => {
                        const sel = selectedTenants.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                              sel ? "border-[#FF5000] bg-[#FFF3EB]" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => setSelectedTenants(prev => sel ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                              className="w-4 h-4 accent-[#FF5000] shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium truncate">{t.name}</p>
                              <p className="text-xs text-gray-400 truncate">{t.property}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {selectedTenants.length > 0 && (
                      <p className="text-xs font-medium text-gray-500 text-center pt-1">
                        {selectedTenants.length} recipient{selectedTenants.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* Step 2: Compose — template with editable section */}
            {step === "compose" && (
              <div className="space-y-4">
                {/* Broadcast Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-900">
                      Broadcast Title <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs tabular-nums ${broadcastTitle.length > MAX_TITLE ? "text-red-500 font-medium" : "text-gray-400"}`}>
                      {broadcastTitle.length} / {MAX_TITLE}
                    </span>
                  </div>
                  <Input
                    value={broadcastTitle}
                    onChange={e => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Annual Maintenance Notice"
                    maxLength={MAX_TITLE + 10}
                    className={`h-10 text-sm ${broadcastTitle.length > MAX_TITLE ? "border-red-400 focus:ring-red-400" : ""}`}
                    autoFocus
                  />
                  {broadcastTitle.length > MAX_TITLE ? (
                    <p className="text-xs text-red-500">Title must be 100 characters or fewer.</p>
                  ) : (
                    <p className="text-xs text-gray-400">Internal use only — not sent to tenants via WhatsApp.</p>
                  )}
                </div>

                {/* WhatsApp template with inline textarea */}
                <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-4 space-y-2.5">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">ANNOUNCEMENT</p>
                  <p className="text-sm text-gray-800">Hi {previewTenantName},</p>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={5}
                    placeholder="Type your announcement here…"
                    className={`w-full bg-white/70 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 resize-none placeholder:text-gray-400 ${
                      body.length > MAX_BODY ? "ring-2 ring-red-400" : "focus:ring-[#FF5000]/40"
                    }`}
                  />
                  <p className="text-sm text-gray-600 italic">Reply to this if you have any questions.</p>
                  <span className="inline-block border border-gray-400 text-gray-500 text-xs font-medium rounded px-3 py-1">Reply</span>
                  <p className="text-xs text-gray-400 text-right">via WhatsApp</p>
                </div>

                {/* Counter + helper */}
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs ${body.length > MAX_BODY ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {body.length > MAX_BODY
                      ? "Announcement message exceeds the 500-character limit."
                      : "Only the highlighted message section is editable. Messages are delivered using the approved WhatsApp announcement template."}
                  </p>
                  <p className={`text-xs shrink-0 tabular-nums ${body.length > MAX_BODY ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {body.length} / {MAX_BODY}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "preview" && (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Title</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">{broadcastTitle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Recipients</span>
                    <span className="font-medium text-gray-900">{recipientLabel} ({recipientCount})</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Final Message</p>
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-4 space-y-2">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">ANNOUNCEMENT</p>
                    <p className="text-sm text-gray-800">Hi {previewTenantName},</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{collapsedBody}</p>
                    <p className="text-sm text-gray-600 italic">Reply to this if you have any questions.</p>
                    <span className="inline-block border border-gray-400 text-gray-500 text-xs font-medium rounded px-3 py-1">Reply</span>
                    <p className="text-xs text-gray-400 text-right">via WhatsApp</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            {step !== "recipients" && (
              <Button variant="outline" className="border-gray-200 text-gray-700"
                onClick={() => setStep(step === "compose" ? "recipients" : "compose")}>
                Back
              </Button>
            )}
            <Button
              className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white"
              disabled={step === "recipients" ? !canProceedRecipients : step === "compose" ? !canProceedCompose : false}
              onClick={() => {
                if (step === "recipients") setStep("compose");
                else if (step === "compose") setStep("preview");
                else handleSend();
              }}
            >
              {step === "preview" ? <><Send className="w-4 h-4 mr-1.5" /> Send Broadcast</> : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordCommunications({ onMenuClick, isMobile }: Props) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(SEED_BROADCASTS);
  const [showCompose, setShowCompose] = useState(false);

  function handleSent(b: Broadcast) {
    setBroadcasts(prev => [b, ...prev]);
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
      <LandlordTopNav
        title="Communications"
        onMenuClick={onMenuClick}
        isMobile={isMobile}
        showAddButton={false}
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-[73px] lg:pt-[81px]">
        <div className="py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-gray-900">Broadcast Messages</p>
                <p className="text-sm text-gray-400 mt-0.5">Send announcements to all or selected tenants</p>
              </div>
              <Button
                className="bg-[#FF5000] hover:bg-[#e04600] text-white shrink-0"
                onClick={() => setShowCompose(true)}
              >
                <Send className="w-4 h-4 mr-1.5" /> Send Broadcast
              </Button>
            </div>

            {/* List */}
            {broadcasts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500 text-sm">No broadcasts sent yet.</p>
                <p className="text-gray-400 text-xs mt-1">Click Send Broadcast to create your first message.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {broadcasts.map(b => (
                  <div key={b.id} className="px-6 py-5">
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{b.title}</p>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{b.body}</p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400">
                      <span>Recipients: {b.recipientLabel} ({b.recipientCount})</span>
                      <span>Sent: {fmtDate(b.sentAt)} · {fmtTime(b.sentAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSent={handleSent} />}
    </div>
  );
}
