/* eslint-disable */
"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare, Send } from "lucide-react";
import { useTenantCommsActivity, type ActivityEntry } from "@/contexts/TenantCommsActivityContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Groups entries by calendar date label
function dateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function EntryRow({ entry, onClick }: { entry: ActivityEntry; onClick: () => void }) {
  const isIncoming = entry.direction === "incoming";
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100 group"
    >
      {/* Direction icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isIncoming ? "bg-green-50" : "bg-orange-50"
        }`}
      >
        {isIncoming
          ? <MessageSquare size={14} className="text-green-500" />
          : <Send size={14} className="text-[#FF5000]" />
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-900 truncate mb-0.5">
          {isIncoming
            ? `Message from ${entry.tenantName} to the Bot`
            : `Message from the Bot to ${entry.tenantName}`}
        </p>
        <p className="text-[12px] text-gray-400 truncate leading-snug">{entry.preview}</p>
      </div>

      {/* Time + arrow */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[11px] text-gray-400 whitespace-nowrap tabular-nums">
          {formatRelativeTime(entry.timestamp)}
        </span>
        <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

interface Props {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function TenantCommsBotActivityScreen({ onMenuClick, isMobile }: Props) {
  const { feed, triggerSimulation } = useTenantCommsActivity();
  const router = useRouter();

  // Group feed entries by date label
  const grouped: { label: string; entries: ActivityEntry[] }[] = [];
  for (const entry of feed) {
    const label = dateLabel(entry.timestamp);
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) {
      last.entries.push(entry);
    } else {
      grouped.push({ label, entries: [entry] });
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm shrink-0">
        <div className="px-4 lg:px-8 py-4 flex items-center gap-3">
          {isMobile && onMenuClick && (
            <button
              onClick={onMenuClick}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-slate-100"
            >
              <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-slate-900">Bot Activity</h1>
          </div>
          <span className="text-sm text-gray-400 font-normal">{feed.length}</span>
          {/* Manual simulation button for demo */}
          <button
            onClick={triggerSimulation}
            title="Simulate incoming message (demo)"
            className="ml-2 h-8 px-3 text-[11px] font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
          >
            Simulate
          </button>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        <div className="px-4 lg:px-8 py-2.5">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Live feed of WhatsApp bot messages — newest first. Click any entry to open that tenant's chat.
          </p>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {grouped.map(({ label, entries }) => (
          <div key={label}>
            {/* Date divider */}
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                {label}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onClick={() => router.push(`/tenant-comms/kyc-application-detail/${entry.tenantId}`)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
