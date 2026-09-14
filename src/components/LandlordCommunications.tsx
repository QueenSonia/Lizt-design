/* eslint-disable */
"use client";
import { useState, useMemo } from "react";
import {
  Send, X, Plus, Search, Check,
  Clock, AlertCircle, FileText, RotateCcw,
} from "lucide-react";
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

export type TemplateStatus = "draft" | "pending_approval" | "approved" | "rejected";

export interface TemplateVariable {
  position: number;
  name: string;
}

export interface Template {
  id: string;
  name: string;
  body: string;
  variables: TemplateVariable[];
  status: TemplateStatus;
  metaTemplateId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

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

const SEED_TEMPLATES: Template[] = [
  {
    id: "tpl-001",
    name: "Rent Increase Notice",
    body: "Dear {{1}},\n\nPlease be advised that your rent will increase by {{2}}% effective {{3}}. Your updated rent amount will be included in your renewal offer letter.\n\nThank you for your continued tenancy at Lizt.",
    variables: [
      { position: 1, name: "Tenant Name" },
      { position: 2, name: "Increase Percentage" },
      { position: 3, name: "Effective Date" },
    ],
    status: "approved",
    metaTemplateId: "LTMPL_93FA2C",
    rejectionReason: null,
    createdAt: "2026-05-01T09:00:00Z",
    updatedAt: "2026-05-20T14:30:00Z",
  },
  {
    id: "tpl-002",
    name: "Maintenance Visit Scheduled",
    body: "Hi {{1}},\n\nOur maintenance team will visit {{2}} on {{3}} between {{4}}. Please ensure someone is available to grant access.\n\nApologies for any inconvenience.",
    variables: [
      { position: 1, name: "Tenant Name" },
      { position: 2, name: "Property Address" },
      { position: 3, name: "Visit Date" },
      { position: 4, name: "Time Window" },
    ],
    status: "pending_approval",
    metaTemplateId: null,
    rejectionReason: null,
    createdAt: "2026-08-10T11:00:00Z",
    updatedAt: "2026-08-10T11:00:00Z",
  },
  {
    id: "tpl-003",
    name: "Water Service Disruption",
    body: "Hi {{1}}, water supply to {{2}} will be interrupted on {{3}} from 8am–4pm for infrastructure upgrades.",
    variables: [
      { position: 1, name: "Tenant Name" },
      { position: 2, name: "Property Address" },
      { position: 3, name: "Disruption Date" },
    ],
    status: "rejected",
    metaTemplateId: null,
    rejectionReason: "Template must include opt-out instructions to comply with Meta's messaging policy. Please add 'Reply STOP to unsubscribe' or equivalent language.",
    createdAt: "2026-07-15T09:00:00Z",
    updatedAt: "2026-07-22T16:45:00Z",
  },
  {
    id: "tpl-004",
    name: "Lease Expiry Reminder",
    body: "Dear {{1}},\n\nThis is a reminder that your lease for {{2}} expires on {{3}}. Please reach out to discuss your renewal options before this date.",
    variables: [
      { position: 1, name: "Tenant Name" },
      { position: 2, name: "Property Name" },
      { position: 3, name: "Expiry Date" },
    ],
    status: "draft",
    metaTemplateId: null,
    rejectionReason: null,
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-01T08:00:00Z",
  },
];

// ── Status badge config ────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TemplateStatus, { label: string; className: string }> = {
  draft:            { label: "Draft",            className: "bg-gray-100 text-gray-600 border-gray-200" },
  pending_approval: { label: "Pending Approval", className: "bg-amber-100 text-amber-700 border-amber-200" },
  approved:         { label: "Approved",         className: "bg-green-100 text-green-700 border-green-200" },
  rejected:         { label: "Rejected",         className: "bg-red-100 text-red-700 border-red-200" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function parseVariablePositions(body: string): number[] {
  const matches = [...body.matchAll(/\{\{(\d+)\}\}/g)];
  return [...new Set(matches.map(m => parseInt(m[1], 10)))].sort((a, b) => a - b);
}

// Renders body text with {{n}} placeholders as highlighted chips inline.
function BodyWithHighlights({ body, variables }: { body: string; variables: TemplateVariable[] }) {
  const varMap = new Map(variables.map(v => [v.position, v.name]));
  const parts = body.split(/(\{\{\d+\}\})/);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\{\{(\d+)\}\}$/);
        if (m) {
          const pos = parseInt(m[1], 10);
          const label = varMap.get(pos);
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono text-xs mx-0.5 align-middle"
            >
              {`{{${pos}}}`}
              {label && <span className="font-sans text-[11px] text-amber-600 not-italic">· {label}</span>}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ── Compose Modal (existing, unchanged) ───────────────────────────────────────

type RecipientMode = "all" | "individuals";
type Step = "recipients" | "compose" | "preview";

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: (b: Broadcast) => void }) {
  const [step, setStep] = useState<Step>("recipients");
  const [mode, setMode] = useState<RecipientMode>("all");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");

  const recipientCount = mode === "all" ? MOCK_TENANTS.length : selectedTenants.length;
  const recipientLabel = mode === "all" ? "All Tenants" : `${selectedTenants.length} Tenant${selectedTenants.length !== 1 ? "s" : ""}`;
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
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <p className="text-base font-semibold text-gray-900">Send Broadcast</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {step === "recipients" ? "Step 1: Select recipients" : step === "compose" ? "Step 2: Write announcement" : "Step 3: Confirm & send"}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {step === "recipients" && (
              <div className="space-y-5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="radio" name="recipientMode" checked={mode === "all"} onChange={() => { setMode("all"); setSelectedTenants([]); setSearch(""); }} className="mt-0.5 w-4 h-4 accent-[#FF5000] cursor-pointer shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Select All Tenants</p>
                    {mode === "all" && <p className="text-xs text-gray-500 mt-1">Message will be sent to all <strong>{MOCK_TENANTS.length} active tenants</strong>.</p>}
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="radio" name="recipientMode" checked={mode === "individuals"} onChange={() => { setMode("individuals"); setSelectedTenants([]); setSearch(""); }} className="mt-0.5 w-4 h-4 accent-[#FF5000] cursor-pointer shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Select Tenants</p>
                  </div>
                </label>
                {mode === "individuals" && (
                  <div className="ml-7 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants…" className="pl-9 h-9 text-sm" />
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {filteredTenants.map(t => {
                        const sel = selectedTenants.includes(t.id);
                        return (
                          <label key={t.id} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${sel ? "border-[#FF5000] bg-[#FFF3EB]" : "border-gray-200 hover:border-gray-300"}`}>
                            <input type="checkbox" checked={sel} onChange={() => setSelectedTenants(prev => sel ? prev.filter(x => x !== t.id) : [...prev, t.id])} className="w-4 h-4 accent-[#FF5000] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium truncate">{t.name}</p>
                              <p className="text-xs text-gray-400 truncate">{t.property}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {selectedTenants.length > 0 && <p className="text-xs font-medium text-gray-500 text-center pt-1">{selectedTenants.length} recipient{selectedTenants.length !== 1 ? "s" : ""} selected</p>}
                  </div>
                )}
              </div>
            )}

            {step === "compose" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-900">Broadcast Title <span className="text-red-500">*</span></label>
                    <span className={`text-xs tabular-nums ${broadcastTitle.length > MAX_TITLE ? "text-red-500 font-medium" : "text-gray-400"}`}>{broadcastTitle.length} / {MAX_TITLE}</span>
                  </div>
                  <Input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="e.g. Annual Maintenance Notice" maxLength={MAX_TITLE + 10} className={`h-10 text-sm ${broadcastTitle.length > MAX_TITLE ? "border-red-400 focus:ring-red-400" : ""}`} autoFocus />
                  {broadcastTitle.length > MAX_TITLE ? <p className="text-xs text-red-500">Title must be 100 characters or fewer.</p> : <p className="text-xs text-gray-400">Internal use only — not sent to tenants via WhatsApp.</p>}
                </div>
                <div className="bg-[#DCF8C6] rounded-2xl rounded-tl-sm px-4 py-4 space-y-2.5">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">ANNOUNCEMENT</p>
                  <p className="text-sm text-gray-800">Hi {previewTenantName},</p>
                  <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Type your announcement here…" className={`w-full bg-white/70 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 resize-none placeholder:text-gray-400 ${body.length > MAX_BODY ? "ring-2 ring-red-400" : "focus:ring-[#FF5000]/40"}`} />
                  <p className="text-sm text-gray-600 italic">Reply to this if you have any questions.</p>
                  <span className="inline-block border border-gray-400 text-gray-500 text-xs font-medium rounded px-3 py-1">Reply</span>
                  <p className="text-xs text-gray-400 text-right">via WhatsApp</p>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs ${body.length > MAX_BODY ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {body.length > MAX_BODY ? "Announcement message exceeds the 500-character limit." : "Only the highlighted message section is editable. Messages are delivered using the approved WhatsApp announcement template."}
                  </p>
                  <p className={`text-xs shrink-0 tabular-nums ${body.length > MAX_BODY ? "text-red-500 font-medium" : "text-gray-400"}`}>{body.length} / {MAX_BODY}</p>
                </div>
              </div>
            )}

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

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            {step !== "recipients" && (
              <Button variant="outline" className="border-gray-200 text-gray-700" onClick={() => setStep(step === "compose" ? "recipients" : "compose")}>Back</Button>
            )}
            <Button
              className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white"
              disabled={step === "recipients" ? !canProceedRecipients : step === "compose" ? !canProceedCompose : false}
              onClick={() => { if (step === "recipients") setStep("compose"); else if (step === "compose") setStep("preview"); else handleSend(); }}
            >
              {step === "preview" ? <><Send className="w-4 h-4 mr-1.5" /> Send Broadcast</> : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Broadcast Card ────────────────────────────────────────────────────────────

function BroadcastCard({ broadcast, onSend }: { broadcast: Broadcast; onSend: () => void }) {
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
          onClick={onSend}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FF5000] text-xs font-medium text-[#FF5000] bg-[#FFF3EB] hover:bg-orange-100 transition-colors shrink-0"
        >
          <Send className="w-3 h-3" />
          Send
        </button>
      </div>
    </div>
  );
}

// ── Template Form Modal (new) ─────────────────────────────────────────────────

interface TemplateFormInitial {
  name: string;
  body: string;
  variables: TemplateVariable[];
}

function TemplateFormModal({
  onClose,
  onSaved,
  initialValues,
}: {
  onClose: () => void;
  onSaved: (t: Template) => void;
  initialValues?: TemplateFormInitial;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [body, setBody] = useState(initialValues?.body ?? "");
  const [varNames, setVarNames] = useState<Record<number, string>>(
    () => Object.fromEntries((initialValues?.variables ?? []).map(v => [v.position, v.name]))
  );

  const detectedPositions = useMemo(() => parseVariablePositions(body), [body]);

  function handleBodyChange(val: string) {
    setBody(val);
    const positions = parseVariablePositions(val);
    setVarNames(prev => {
      const next = { ...prev };
      positions.forEach(pos => { if (!(pos in next)) next[pos] = ""; });
      return next;
    });
  }

  const canSubmit = name.trim().length > 0 && body.trim().length > 0;

  function handleSave() {
    const variables: TemplateVariable[] = detectedPositions.map(pos => ({
      position: pos,
      name: (varNames[pos] ?? "").trim(),
    }));
    const now = new Date().toISOString();
    const template: Template = {
      id: `tpl-${Date.now()}`,
      name: name.trim(),
      body,
      variables,
      status: "draft",
      metaTemplateId: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };
    onSaved(template);
    toast.success("Template saved as draft.");
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <p className="text-base font-semibold text-gray-900">
                {initialValues ? "Revise Template" : "New Template"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {initialValues ? "Saved as a new draft — submit for Meta approval when ready" : "Saved as draft — submit for Meta approval when ready"}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">
                Template Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rent Increase Notice"
                className="h-10 text-sm"
                autoFocus={!initialValues}
              />
              <p className="text-xs text-gray-400">Internal name for reference only.</p>
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-900">
                Message Body <span className="text-red-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={e => handleBodyChange(e.target.value)}
                rows={6}
                placeholder={"e.g. Dear {{1}}, your rent of {{2}} is due on {{3}}."}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/30 focus:border-[#FF5000] resize-none placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400">
                Use{" "}
                <span className="font-mono bg-gray-100 px-1 rounded text-gray-600">{"{{1}}"}</span>,{" "}
                <span className="font-mono bg-gray-100 px-1 rounded text-gray-600">{"{{2}}"}</span>{" "}
                etc. as variable placeholders — filled in when you send.
              </p>
            </div>

            {/* Variable naming — shown when placeholders are detected */}
            {detectedPositions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">Name your variables</p>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                <div className="space-y-2">
                  {detectedPositions.map(pos => (
                    <div key={pos} className="flex items-center gap-3">
                      <span className="font-mono text-xs bg-amber-100 text-amber-800 px-2 py-1.5 rounded shrink-0 min-w-[48px] text-center">
                        {`{{${pos}}}`}
                      </span>
                      <Input
                        value={varNames[pos] ?? ""}
                        onChange={e => setVarNames(prev => ({ ...prev, [pos]: e.target.value }))}
                        placeholder={`Label for position ${pos} (e.g. "Tenant Name")`}
                        className="h-9 text-sm flex-1"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  These names remind you what each placeholder means when you use the template later.
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            <Button variant="outline" className="border-gray-200 text-gray-700" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-[#FF5000] hover:bg-[#e04600] text-white"
              disabled={!canSubmit}
              onClick={handleSave}
            >
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Template Card (new) ───────────────────────────────────────────────────────

function TemplateCard({
  template,
  onSubmitForApproval,
  onRevise,
}: {
  template: Template;
  onSubmitForApproval: (id: string) => void;
  onRevise: (t: Template) => void;
}) {
  const badge = STATUS_BADGE[template.status];

  return (
    <div className="px-6 py-5 space-y-4">

      {/* Header: name + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-gray-900 leading-tight">{template.name}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Body preview with highlighted variable chips */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        <BodyWithHighlights body={template.body} variables={template.variables} />
      </div>

      {/* Variable map */}
      {template.variables.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {template.variables.map(v => (
            <span key={v.position} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600 border border-gray-200">
              <span className="font-mono text-gray-400">{`{{${v.position}}}`}</span>
              <span className="text-gray-300">→</span>
              <span className="font-medium text-gray-700">{v.name || <em className="text-gray-400 font-normal">unnamed</em>}</span>
            </span>
          ))}
        </div>
      )}

      {/* Approved: Meta template ID */}
      {template.status === "approved" && template.metaTemplateId && (
        <p className="text-xs text-gray-400">
          Meta ID: <span className="font-mono text-gray-600">{template.metaTemplateId}</span>
        </p>
      )}

      {/* Pending: waiting notice */}
      {template.status === "pending_approval" && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Awaiting review by Meta — no further action needed.
        </div>
      )}

      {/* Rejected: rejection reason */}
      {template.status === "rejected" && template.rejectionReason && (
        <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection reason</p>
            <p className="text-xs text-red-600 leading-relaxed">{template.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Footer: updated date + actions */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <p className="text-xs text-gray-400">Updated {fmtDate(template.updatedAt)}</p>
        <div className="flex items-center gap-2">
          {template.status === "draft" && (
            <button
              onClick={() => onSubmitForApproval(template.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FF5000] text-xs font-medium text-[#FF5000] bg-[#FFF3EB] hover:bg-orange-100 transition-colors"
            >
              <Send className="w-3 h-3" />
              Submit for Approval
            </button>
          )}
          {template.status === "rejected" && (
            <button
              onClick={() => onRevise(template)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-[#FF5000] hover:text-[#FF5000] hover:bg-[#FFF3EB] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Revise &amp; Resubmit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Messages Tab ──────────────────────────────────────────────────────────────

function MessagesTab({
  broadcasts,
  onSent,
}: {
  broadcasts: Broadcast[];
  onSent: (b: Broadcast) => void;
}) {
  const [showCompose, setShowCompose] = useState(false);

  function handleSend(b: Broadcast) {
    toast.success(`Resending "${b.title}" to ${b.recipientCount} recipient${b.recipientCount !== 1 ? "s" : ""}.`);
  }

  return (
    <>
      <div className="px-6 py-5 border-b border-gray-100">
        <p className="text-base font-semibold text-gray-900">Broadcast Messages</p>
        <p className="text-sm text-gray-400 mt-0.5">Send announcements to all or selected tenants</p>
      </div>

      {broadcasts.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500 text-sm">No broadcasts sent yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {broadcasts.map(b => (
            <BroadcastCard key={b.id} broadcast={b} onSend={() => handleSend(b)} />
          ))}
        </div>
      )}

      {showCompose && (
        <ComposeModal onClose={() => setShowCompose(false)} onSent={onSent} />
      )}
    </>
  );
}

// ── Template Library Tab ──────────────────────────────────────────────────────

function TemplatesTab({
  templates,
  onTemplatesChange,
}: {
  templates: Template[];
  onTemplatesChange: (templates: Template[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [revisingTemplate, setRevisingTemplate] = useState<Template | null>(null);

  function handleSaved(t: Template) {
    onTemplatesChange([t, ...templates]);
  }

  function handleSubmitForApproval(id: string) {
    onTemplatesChange(
      templates.map(t =>
        t.id === id
          ? { ...t, status: "pending_approval" as TemplateStatus, updatedAt: new Date().toISOString() }
          : t
      )
    );
    toast.success("Template submitted for Meta approval.");
  }

  function handleRevise(template: Template) {
    setRevisingTemplate(template);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setRevisingTemplate(null);
  }

  return (
    <>
      <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-gray-900">Template Library</p>
          <p className="text-sm text-gray-400 mt-0.5">Reusable message templates approved by Meta</p>
        </div>
        <Button
          className="bg-[#FF5000] hover:bg-[#e04600] text-white shrink-0"
          onClick={() => { setRevisingTemplate(null); setShowForm(true); }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No templates yet.</p>
          <p className="text-gray-400 text-xs mt-1">Create a template and submit it for Meta approval to get started.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onSubmitForApproval={handleSubmitForApproval}
              onRevise={handleRevise}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TemplateFormModal
          onClose={handleClose}
          onSaved={handleSaved}
          initialValues={revisingTemplate ? {
            name: revisingTemplate.name,
            body: revisingTemplate.body,
            variables: revisingTemplate.variables,
          } : undefined}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordCommunications({ onMenuClick, isMobile }: Props) {
  const [activeTab, setActiveTab] = useState<"messages" | "templates">("messages");
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(SEED_BROADCASTS);
  const [templates, setTemplates] = useState<Template[]>(SEED_TEMPLATES);

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

            {/* Tab bar */}
            <div className="flex border-b border-gray-100 px-1">
              {(["messages", "templates"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-[#FF5000] text-[#FF5000]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "messages" ? "Messages" : "Template Library"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "messages" && (
              <MessagesTab
                broadcasts={broadcasts}
                onSent={handleSent}
              />
            )}
            {activeTab === "templates" && (
              <TemplatesTab
                templates={templates}
                onTemplatesChange={setTemplates}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
