/* eslint-disable */
"use client";
import { useState, useMemo } from "react";
import { Send, ChevronRight, X, Plus, Users, Building, User, Check, Search } from "lucide-react";
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

// ── Broadcast Detail ──────────────────────────────────────────────────────────

function BroadcastDetail({ broadcast, onClose }: { broadcast: Broadcast; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">{broadcast.title}</p>
            <p className="text-xs text-gray-400 mt-1">{broadcast.recipientLabel} · {fmtDate(broadcast.sentAt)} at {fmtTime(broadcast.sentAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Recipients</p>
              <p className="text-lg font-bold text-gray-900">{broadcast.recipientCount}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className="text-sm font-semibold text-green-600 capitalize">{broadcast.status}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Message</p>
            <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-gray-800 leading-relaxed">{broadcast.body}</p>
              <p className="text-xs text-gray-400 text-right mt-1">via WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Compose Modal ─────────────────────────────────────────────────────────────

type RecipientMode = "all" | "properties" | "individuals";
type Step = "recipients" | "compose" | "preview";

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: (b: Broadcast) => void }) {
  const [step, setStep] = useState<Step>("recipients");
  const [mode, setMode] = useState<RecipientMode>("all");
  const [selectedProps, setSelectedProps] = useState<string[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");

  const recipientCount = mode === "all"
    ? MOCK_TENANTS.length
    : mode === "properties"
    ? MOCK_PROPERTIES.filter(p => selectedProps.includes(p.id)).reduce((s, p) => s + p.tenants, 0)
    : selectedTenants.length;

  const recipientLabel = mode === "all"
    ? "All Tenants"
    : mode === "properties"
    ? `${selectedProps.length} Propert${selectedProps.length !== 1 ? "ies" : "y"}`
    : `${selectedTenants.length} Tenant${selectedTenants.length !== 1 ? "s" : ""}`;

  const canProceedRecipients = mode === "all" || (mode === "properties" && selectedProps.length > 0) || (mode === "individuals" && selectedTenants.length > 0);
  const canProceedCompose = title.trim().length > 0 && body.trim().length > 0;

  const filteredTenants = MOCK_TENANTS.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.property.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProps = MOCK_PROPERTIES.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSend() {
    const broadcast: Broadcast = {
      id: `bc-${Date.now()}`,
      title,
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
                {step === "recipients" ? "Step 1: Select recipients" : step === "compose" ? "Step 2: Compose message" : "Step 3: Preview & send"}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* Step 1: Recipients */}
            {step === "recipients" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "all", label: "All Tenants", icon: <Users className="w-4 h-4" /> },
                    { id: "properties", label: "By Property", icon: <Building className="w-4 h-4" /> },
                    { id: "individuals", label: "Individual", icon: <User className="w-4 h-4" /> },
                  ] as { id: RecipientMode; label: string; icon: React.ReactNode }[]).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setMode(opt.id); setSelectedProps([]); setSelectedTenants([]); setSearch(""); }}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-colors ${
                        mode === opt.id ? "border-[#FF5000] bg-[#FFF3EB] text-[#FF5000]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>

                {mode === "all" && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700">Message will be sent to <strong>all {MOCK_TENANTS.length} active tenants</strong>.</p>
                    <ul className="mt-2 space-y-1">
                      {MOCK_TENANTS.map(t => (
                        <li key={t.id} className="text-xs text-gray-500 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />{t.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(mode === "properties" || mode === "individuals") && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={mode === "properties" ? "Search properties…" : "Search tenants…"}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {mode === "properties" && filteredProps.map(p => {
                        const sel = selectedProps.includes(p.id);
                        return (
                          <button key={p.id} onClick={() => setSelectedProps(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${sel ? "border-[#FF5000] bg-[#FFF3EB]" : "border-gray-200 hover:border-gray-300"}`}>
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.tenants} tenant{p.tenants !== 1 ? "s" : ""}</p>
                            </div>
                            {sel && <Check className="w-4 h-4 text-[#FF5000] shrink-0" />}
                          </button>
                        );
                      })}
                      {mode === "individuals" && filteredTenants.map(t => {
                        const sel = selectedTenants.includes(t.id);
                        return (
                          <button key={t.id} onClick={() => setSelectedTenants(prev => sel ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors ${sel ? "border-[#FF5000] bg-[#FFF3EB]" : "border-gray-200 hover:border-gray-300"}`}>
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{t.name}</p>
                              <p className="text-xs text-gray-400">{t.property}</p>
                            </div>
                            {sel && <Check className="w-4 h-4 text-[#FF5000] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {recipientCount > 0 && (
                  <p className="text-xs text-gray-500 text-center">{recipientCount} recipient{recipientCount !== 1 ? "s" : ""} selected</p>
                )}
              </div>
            )}

            {/* Step 2: Compose */}
            {step === "compose" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Message Title <span className="text-red-500">*</span></label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Maintenance Notice" className="h-9 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Message Body <span className="text-red-500">*</span></label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={6}
                    placeholder="Type your message here…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF5000] resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{body.length} characters</p>
                </div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === "preview" && (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Recipients</span>
                    <span className="font-medium text-gray-900">{recipientLabel} ({recipientCount})</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Title</span>
                    <span className="font-medium text-gray-900 text-right max-w-[200px]">{title}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Message Preview</p>
                  <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{body}</p>
                    <p className="text-xs text-gray-400 text-right mt-1">via WhatsApp</p>
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
            <Button variant="outline" className="border-gray-200 text-gray-700" onClick={onClose}>Cancel</Button>
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
  const [selected, setSelected] = useState<Broadcast | null>(null);

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
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-base font-semibold text-gray-900">Broadcast Messages</p>
              <p className="text-sm text-gray-400 mt-0.5">Send announcements to all or selected tenants</p>
            </div>
            <Button
              className="bg-[#FF5000] hover:bg-[#e04600] text-white"
              onClick={() => setShowCompose(true)}
            >
              <Send className="w-4 h-4 mr-1.5" /> Send Broadcast
            </Button>
          </div>

          {/* History */}
          {broadcasts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <p className="text-gray-500 text-sm">No broadcasts sent yet.</p>
              <p className="text-gray-400 text-xs mt-1">Click Send Broadcast to create your first message.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{b.title}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{b.body}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>Recipients: {b.recipientLabel} ({b.recipientCount})</span>
                    <span>Sent: {fmtDate(b.sentAt)} · {fmtTime(b.sentAt)}</span>
                    <span className={`font-medium capitalize ${b.status === "sent" ? "text-green-600" : "text-red-500"}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSent={handleSent} />}
      {selected && <BroadcastDetail broadcast={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
