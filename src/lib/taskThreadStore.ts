/**
 * Shared in-memory thread store for maintenance task communication.
 * Both the Landlord Dashboard and the Facility Manager Dashboard read/write
 * from this store, so messages appear in both views simultaneously.
 */

export type ThreadAuthor = "landlord" | "facility_manager";

export interface ThreadMessage {
  id: string;
  type: "message";
  author: ThreadAuthor;
  authorName: string;
  body: string;
  timestamp: string; // ISO
}

export interface ThreadEvent {
  id: string;
  type: "event";
  body: string;
  timestamp: string;
}

export type ThreadEntry = ThreadMessage | ThreadEvent;

export function makeMsgId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function fmtThreadTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function fmtThreadDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return "Today";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Seed data ─────────────────────────────────────────────────────────────────
// Landlord-side requests use IDs like "sr-002". FM-side issues use "is01" etc.
// Both share this single store.

const _threads = new Map<string, ThreadEntry[]>([
  [
    "sr-002",
    [
      { id: "e-001", type: "event", body: "Maintenance request submitted", timestamp: "2026-04-22T14:10:00.000Z" },
      { id: "e-002", type: "event", body: "Assigned to Chukwuemeka Obi", timestamp: "2026-04-22T15:00:00.000Z" },
      { id: "m-001", type: "message", author: "landlord", authorName: "Landlord", body: "Please prioritize this — tenant has complained twice already.", timestamp: "2026-04-22T15:30:00.000Z" },
      { id: "m-002", type: "message", author: "facility_manager", authorName: "Chukwuemeka Obi", body: "Understood. I'll visit the property by 2 PM today to assess the sockets.", timestamp: "2026-04-23T09:12:00.000Z" },
      { id: "e-003", type: "event", body: "Request approved", timestamp: "2026-04-23T09:30:00.000Z" },
      { id: "m-003", type: "message", author: "facility_manager", authorName: "Chukwuemeka Obi", body: "Visited the property. The issue is a tripped breaker and one damaged socket. Parts ordered — will complete by tomorrow.", timestamp: "2026-04-23T15:45:00.000Z" },
    ],
  ],
  [
    "sr-004",
    [
      { id: "e-101", type: "event", body: "Maintenance request submitted", timestamp: "2026-04-18T10:00:00.000Z" },
      { id: "e-102", type: "event", body: "Assigned to Tunde Adeyemi", timestamp: "2026-04-18T11:00:00.000Z" },
      { id: "m-101", type: "message", author: "facility_manager", authorName: "Tunde Adeyemi", body: "I'll carry out the inspection this week. Will report back by Friday.", timestamp: "2026-04-19T08:20:00.000Z" },
      { id: "m-102", type: "message", author: "landlord", authorName: "Landlord", body: "Thanks. Let me know if you need anything from me.", timestamp: "2026-04-19T09:05:00.000Z" },
      { id: "m-103", type: "message", author: "facility_manager", authorName: "Tunde Adeyemi", body: "Inspection done. Found a cracked tile near the shower drain — sourcing a replacement now.", timestamp: "2026-04-21T14:10:00.000Z" },
      { id: "e-103", type: "event", body: "Marked as resolved", timestamp: "2026-04-24T16:30:00.000Z" },
      { id: "m-104", type: "message", author: "facility_manager", authorName: "Tunde Adeyemi", body: "Tile replaced and re-grouted. No further damage observed. Resolution form submitted.", timestamp: "2026-04-24T16:35:00.000Z" },
    ],
  ],
  // FM-side issues (seeded conversations for is01, is02)
  [
    "is01",
    [
      { id: "fe-001", type: "event", body: "Task assigned to you", timestamp: "2026-04-27T08:00:00.000Z" },
      { id: "fm-001", type: "message", author: "landlord", authorName: "Landlord", body: "This needs urgent attention — residents on upper floors are stranded.", timestamp: "2026-04-27T08:15:00.000Z" },
      { id: "fm-002", type: "message", author: "facility_manager", authorName: "You", body: "Noted. Engineer is on the way. Will update you by noon.", timestamp: "2026-04-27T08:45:00.000Z" },
    ],
  ],
  [
    "is02",
    [
      { id: "fe-101", type: "event", body: "Task assigned to you", timestamp: "2026-04-27T10:00:00.000Z" },
      { id: "fm-101", type: "message", author: "facility_manager", authorName: "You", body: "Plumber is on site. Ceiling drip traced to a burst joint in Unit 206. Isolating the supply now.", timestamp: "2026-04-27T11:30:00.000Z" },
      { id: "fm-102", type: "message", author: "landlord", authorName: "Landlord", body: "Good work, keep me posted on the repair cost.", timestamp: "2026-04-27T11:45:00.000Z" },
    ],
  ],
]);

type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribeToThreadStore(listener: Listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function _notify() {
  _listeners.forEach((l) => l());
}

export function getThread(taskId: string): ThreadEntry[] {
  return _threads.get(taskId) ?? [];
}

export function appendThreadEntry(taskId: string, entry: ThreadEntry) {
  const existing = _threads.get(taskId) ?? [];
  _threads.set(taskId, [...existing, entry]);
  _notify();
}
