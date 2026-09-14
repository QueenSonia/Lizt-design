/* eslint-disable */
"use client";
import { useState } from "react";
import { Send, X, Search, Check } from "lucide-react";
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

type RecipientMode = "all" | "individuals";
type ComposeStep = "message" | "tenants";

const COMPOSE_STEPS: { key: ComposeStep; label: string }[] = [
  { key: "message", label: "Message" },
  { key: "tenants", label: "Tenants" },
];

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_TENANTS = [
  { id: "t-001", name: "James Okafor", property: "Lekki Phase 1 Duplex" },
  { id: "t-002", name: "Adaeze Nwosu", property: "Ikoyi 2-Bed Apartment" },
  { id: "t-003", name: "Emmanuel Etim", property: "Victoria Island Studio" },
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

// ── Compose Modal (2-step: Message → Tenants) ─────────────────────────────────

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: (b: Broadcast) => void }) {
  const [step, setStep] = useState<ComposeStep>("message");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [var2, setVar2] = useState("");
  const [var3, setVar3] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [tenantSearch, setTenantSearch] = useState("");

  const stepIndex = COMPOSE_STEPS.findIndex(s => s.key === step);

  // {{1}} is always the tenant name — auto-filled at send time, not shown as editable.
  // {{2}} and {{3}} are the admin-filled content variables.
  const previewVar2 = var2.trim() || "[Variable 2]";
  const previewVar3 = var3.trim() || "[Variable 3]";

  const canProceedToTenants =
    broadcastTitle.trim().length > 0 && var2.trim().length > 0 && var3.trim().length > 0;
  const canSend = recipientMode === "all" || selectedTenants.length > 0;

  const recipientCount = recipientMode === "all" ? MOCK_TENANTS.length : selectedTenants.length;
  const recipientLabel =
    recipientMode === "all"
      ? "All Tenants"
      : `${selectedTenants.length} Tenant${selectedTenants.length !== 1 ? "s" : ""}`;

  const filteredTenants = MOCK_TENANTS.filter(
    t =>
      !tenantSearch ||
      t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.property.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  function handleSend() {
    const broadcast: Broadcast = {
      id: `bc-${Date.now()}`,
      title: broadcastTitle.trim(),
      body: `${var2.trim()}\n\n${var3.trim()}`,
      recipientType: recipientMode,
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
            <p className="text-base font-semibold text-gray-900">Send Broadcast</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center px-6 py-4 border-b border-gray-100 shrink-0">
            {COMPOSE_STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    stepIndex >= i
                      ? "bg-[#FF5000] border-[#FF5000] text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}>
                    {stepIndex > i ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    step === s.key ? "text-[#FF5000]" : stepIndex > i ? "text-gray-700" : "text-gray-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < COMPOSE_STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-colors ${stepIndex > i ? "bg-[#FF5000]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* Step 1: Message */}
            {step === "message" && (
              <div className="space-y-5">
                {/* Internal title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-900">
                    Broadcast Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={broadcastTitle}
                    onChange={e => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Annual Maintenance Notice"
                    className="h-10 text-sm"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400">Internal label — not sent to tenants.</p>
                </div>

                {/* Variable inputs */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">Message content</p>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    {/* {{1}} — read-only, auto-filled */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1.5 rounded shrink-0 min-w-[48px] text-center">
                        {"{{1}}"}
                      </span>
                      <div className="flex-1 h-9 px-3 flex items-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400 italic select-none">
                        Tenant Name — auto-filled per recipient
                      </div>
                    </div>
                    {/* {{2}} */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-amber-100 text-amber-800 px-2 py-1.5 rounded shrink-0 min-w-[48px] text-center">
                        {"{{2}}"}
                      </span>
                      <Input
                        value={var2}
                        onChange={e => setVar2(e.target.value)}
                        placeholder="Variable 2"
                        className="h-9 text-sm flex-1"
                      />
                    </div>
                    {/* {{3}} */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-amber-100 text-amber-800 px-2 py-1.5 rounded shrink-0 min-w-[48px] text-center">
                        {"{{3}}"}
                      </span>
                      <Input
                        value={var3}
                        onChange={e => setVar3(e.target.value)}
                        placeholder="Variable 3"
                        className="h-9 text-sm flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Live preview */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-gray-100" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">Live Preview</p>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-4 space-y-2">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">ANNOUNCEMENT</p>
                    <p className="text-sm text-gray-800">
                      Hi <span className="italic text-gray-500">{"{Tenant Name}"}</span>,
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                      {`${previewVar2}\n\n${previewVar3}`}
                    </p>
                    <p className="text-sm text-gray-600 italic">Reply to this if you have any questions.</p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="inline-block border border-gray-400 text-gray-500 text-xs font-medium rounded px-3 py-1">Reply</span>
                      <p className="text-xs text-gray-400">via WhatsApp</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    <span className="italic">"{"{Tenant Name}"}"</span> is filled in automatically for each recipient at send time.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Tenants */}
            {step === "tenants" && (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="composeMode"
                    checked={recipientMode === "all"}
                    onChange={() => { setRecipientMode("all"); setSelectedTenants([]); setTenantSearch(""); }}
                    className="mt-0.5 w-4 h-4 accent-[#FF5000] cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">All Tenants</p>
                    {recipientMode === "all" && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Message will be sent to all <strong>{MOCK_TENANTS.length} active tenants</strong>.
                      </p>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="composeMode"
                    checked={recipientMode === "individuals"}
                    onChange={() => { setRecipientMode("individuals"); setSelectedTenants([]); setTenantSearch(""); }}
                    className="mt-0.5 w-4 h-4 accent-[#FF5000] cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Select Tenants</p>
                  </div>
                </label>

                {recipientMode === "individuals" && (
                  <div className="ml-7 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <Input
                        value={tenantSearch}
                        onChange={e => setTenantSearch(e.target.value)}
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
                              onChange={() =>
                                setSelectedTenants(prev =>
                                  sel ? prev.filter(x => x !== t.id) : [...prev, t.id]
                                )
                              }
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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            {step === "message" ? (
              <Button variant="outline" className="border-gray-200 text-gray-700" onClick={onClose}>
                Cancel
              </Button>
            ) : (
              <Button variant="outline" className="border-gray-200 text-gray-700" onClick={() => setStep("message")}>
                Back
              </Button>
            )}
            <Button
              className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white"
              disabled={step === "message" ? !canProceedToTenants : !canSend}
              onClick={() => {
                if (step === "message") setStep("tenants");
                else handleSend();
              }}
            >
              {step === "tenants" ? <><Send className="w-4 h-4 mr-1.5" /> Send</> : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Resend Modal ──────────────────────────────────────────────────────────────

function ResendModal({
  broadcast,
  onClose,
  onConfirm,
}: {
  broadcast: Broadcast;
  onClose: () => void;
  onConfirm: (updated: Broadcast) => void;
}) {
  const defaultMode: RecipientMode = broadcast.recipientType === "all" ? "all" : "individuals";
  const [mode, setMode] = useState<RecipientMode>(defaultMode);
  const [selectedTenants, setSelectedTenants] = useState<string[]>(
    defaultMode === "individuals" ? MOCK_TENANTS.map(t => t.id) : []
  );
  const [search, setSearch] = useState("");

  const recipientCount = mode === "all" ? MOCK_TENANTS.length : selectedTenants.length;
  const recipientLabel =
    mode === "all"
      ? "All Tenants"
      : `${selectedTenants.length} Tenant${selectedTenants.length !== 1 ? "s" : ""}`;
  const canConfirm = mode === "all" || selectedTenants.length > 0;

  const filteredTenants = MOCK_TENANTS.filter(
    t =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.property.toLowerCase().includes(search.toLowerCase())
  );

  function handleConfirm() {
    const updated: Broadcast = {
      ...broadcast,
      recipientType: mode,
      recipientCount,
      recipientLabel,
      sentAt: new Date().toISOString(),
    };
    onConfirm(updated);
    toast.success(
      `Resent "${broadcast.title}" to ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}.`
    );
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <p className="text-base font-semibold text-gray-900">Resend Broadcast</p>
              <p className="text-xs text-gray-400 mt-0.5">Review message and confirm recipients before sending</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Message preview */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Message</p>
              <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-4 space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">ANNOUNCEMENT</p>
                <p className="text-sm text-gray-800">Hi Tenant,</p>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{broadcast.body}</p>
                <p className="text-sm text-gray-600 italic">Reply to this if you have any questions.</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="inline-block border border-gray-400 text-gray-500 text-xs font-medium rounded px-3 py-1">Reply</span>
                  <p className="text-xs text-gray-400">via WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Recipient selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recipients</p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="resendMode"
                    checked={mode === "all"}
                    onChange={() => { setMode("all"); setSelectedTenants([]); setSearch(""); }}
                    className="mt-0.5 w-4 h-4 accent-[#FF5000] cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">All Tenants</p>
                    {mode === "all" && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Message will be sent to all <strong>{MOCK_TENANTS.length} active tenants</strong>.
                      </p>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="resendMode"
                    checked={mode === "individuals"}
                    onChange={() => { setMode("individuals"); setSelectedTenants([]); setSearch(""); }}
                    className="mt-0.5 w-4 h-4 accent-[#FF5000] cursor-pointer shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Select Tenants</p>
                  </div>
                </label>

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
                              onChange={() =>
                                setSelectedTenants(prev =>
                                  sel ? prev.filter(x => x !== t.id) : [...prev, t.id]
                                )
                              }
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
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            <Button variant="outline" className="border-gray-200 text-gray-700" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              <Send className="w-4 h-4 mr-1.5" /> Confirm &amp; Send
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Broadcast Card ────────────────────────────────────────────────────────────

function BroadcastCard({ broadcast, onResend }: { broadcast: Broadcast; onResend: () => void }) {
  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-sm font-bold text-gray-900">{broadcast.title}</p>
      <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-4 space-y-2">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">ANNOUNCEMENT</p>
        <p className="text-sm text-gray-800">Hi Tenant,</p>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{broadcast.body}</p>
        <p className="text-sm text-gray-600 italic">Reply to this if you have any questions.</p>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="inline-block border border-gray-400 text-gray-500 text-xs font-medium rounded px-3 py-1">Reply</span>
          <p className="text-xs text-gray-400">via WhatsApp</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400">
        <span>Recipients: <span className="text-gray-600 font-medium">{broadcast.recipientLabel} ({broadcast.recipientCount})</span></span>
        <span>Sent: <span className="text-gray-600 font-medium">{fmtDate(broadcast.sentAt)} · {fmtTime(broadcast.sentAt)}</span></span>
        <button
          onClick={onResend}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FF5000] text-xs font-medium text-[#FF5000] bg-[#FFF3EB] hover:bg-orange-100 transition-colors shrink-0"
        >
          <Send className="w-3 h-3" />
          Resend
        </button>
      </div>
    </div>
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
  const [resendingBroadcast, setResendingBroadcast] = useState<Broadcast | null>(null);

  function handleSent(b: Broadcast) {
    setBroadcasts(prev => [b, ...prev]);
  }

  function handleResent(updated: Broadcast) {
    setBroadcasts(prev => prev.map(b => b.id === updated.id ? updated : b));
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

            {broadcasts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500 text-sm">No broadcasts sent yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {broadcasts.map(b => (
                  <BroadcastCard key={b.id} broadcast={b} onResend={() => setResendingBroadcast(b)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCompose && (
        <ComposeModal onClose={() => setShowCompose(false)} onSent={handleSent} />
      )}

      {resendingBroadcast && (
        <ResendModal
          broadcast={resendingBroadcast}
          onClose={() => setResendingBroadcast(null)}
          onConfirm={updated => { handleResent(updated); setResendingBroadcast(null); }}
        />
      )}
    </div>
  );
}
