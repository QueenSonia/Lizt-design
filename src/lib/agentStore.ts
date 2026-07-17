import { KYCApplication } from "@/services/kyc/kyc.service";

/**
 * In-memory store for agent identity data that isn't derived from KYC applications:
 * - Property-Manager-assigned "official" names, keyed by normalized phone number.
 * - Extra aliases captured outside the normal KYC-application flow (e.g. a tenant edits the
 *   auto-populated agent name on the KYC form to a name that differs from the official one —
 *   that edited name is saved here as an alias rather than creating a duplicate agent).
 *
 * An agent's identity is always the phone number. This store never creates new agents and never
 * touches the KYC-submitted names that make up the base alias list — it only layers on top of
 * what `deriveAgents` already computes from KYC application data.
 */

// normalizedPhone → official display name
const _officialNames = new Map<string, string>();
// normalizedPhone → extra aliases (deduped against KYC-derived names at read time)
const _extraAliases = new Map<string, string[]>();

type Listener = () => void;
const _listeners = new Set<Listener>();

export function subscribeToAgentStore(listener: Listener) {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

function _notify() {
  _listeners.forEach((l) => l());
}

export function getOfficialAgentName(normalizedPhone: string): string | undefined {
  return _officialNames.get(normalizedPhone);
}

export function setOfficialAgentName(normalizedPhone: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  _officialNames.set(normalizedPhone, trimmed);
  _notify();
}

export function getExtraAliases(normalizedPhone: string): string[] {
  return _extraAliases.get(normalizedPhone) ?? [];
}

/** Records `name` as an additional alias for `normalizedPhone`, without touching the official name. */
export function addAgentAlias(normalizedPhone: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = _extraAliases.get(normalizedPhone) ?? [];
  if (existing.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return;
  _extraAliases.set(normalizedPhone, [...existing, trimmed]);
  _notify();
}

/* -------------------------------------------------------------------------
 * Agent derivation — shared between the Property Manager Agents page and the
 * tenant-facing KYC form's agent lookup.
 * ---------------------------------------------------------------------- */

/**
 * An agent is derived from KYC data rather than owning its own record — every field here is
 * rolled up from every `application.referralAgent` that shares the same normalized phone number.
 * Phone number is the identity; every name seen alongside that phone becomes an alias, and the
 * most frequently used one (ties broken by first-seen order) is shown as the primary name, unless
 * a Property Manager has assigned an official name for that phone number.
 */
export interface Agent {
  /** Normalized phone number — the unique identifier so the same agent entered under different
   *  names by different tenants collapses into a single row. */
  id: string;
  /** Phone number as first entered, used for display. */
  phone: string;
  primaryName: string;
  /** Other names used for this phone number, excluding the primary name. */
  aliases: string[];
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export function deriveAgents(applications: KYCApplication[]): Agent[] {
  interface AgentBucket {
    phone: string;
    nameCounts: Map<string, number>;
    nameFirstSeen: Map<string, number>;
  }

  const byPhone = new Map<string, AgentBucket>();
  let order = 0;

  for (const app of applications) {
    const agent = app.referralAgent;
    if (!agent?.phoneNumber || !agent.fullName) continue;
    const id = normalizePhone(agent.phoneNumber);
    const name = agent.fullName.trim();
    if (!name) continue;

    let bucket = byPhone.get(id);
    if (!bucket) {
      bucket = { phone: agent.phoneNumber, nameCounts: new Map(), nameFirstSeen: new Map() };
      byPhone.set(id, bucket);
    }

    bucket.nameCounts.set(name, (bucket.nameCounts.get(name) ?? 0) + 1);
    if (!bucket.nameFirstSeen.has(name)) bucket.nameFirstSeen.set(name, order++);
  }

  // Extra aliases (e.g. from KYC form name edits) can introduce phone numbers that have no
  // referralAgent-bearing application yet — make sure those still surface as agents.
  for (const id of _extraAliases.keys()) {
    if (!byPhone.has(id)) {
      byPhone.set(id, { phone: id, nameCounts: new Map(), nameFirstSeen: new Map() });
    }
  }

  return Array.from(byPhone.entries())
    .map(([id, bucket]) => {
      const names = Array.from(bucket.nameCounts.keys()).sort((a, b) => {
        const countDiff = (bucket.nameCounts.get(b) ?? 0) - (bucket.nameCounts.get(a) ?? 0);
        if (countDiff !== 0) return countDiff;
        return (bucket.nameFirstSeen.get(a) ?? 0) - (bucket.nameFirstSeen.get(b) ?? 0);
      });

      // A Property-Manager-assigned official name takes over as the primary display name. The
      // KYC-derived name it replaces isn't discarded — it folds back into the alias list (unless
      // it's already there) so the original submitted names stay visible as historical references.
      const officialName = getOfficialAgentName(id);
      let primaryName: string;
      let baseAliases: string[];
      if (officialName) {
        primaryName = officialName;
        baseAliases = names.includes(officialName) ? names.filter((n) => n !== officialName) : names;
      } else if (names.length > 0) {
        [primaryName, ...baseAliases] = names;
      } else {
        primaryName = "";
        baseAliases = [];
      }

      // Merge in extra aliases captured outside the KYC-application flow, deduped case-insensitively.
      const extra = getExtraAliases(id).filter(
        (n) =>
          n.toLowerCase() !== primaryName.toLowerCase() &&
          !baseAliases.some((a) => a.toLowerCase() === n.toLowerCase())
      );
      const aliases = [...baseAliases, ...extra];

      return { id, phone: bucket.phone, primaryName, aliases };
    })
    .filter((a) => a.primaryName)
    .sort((a, b) => a.primaryName.localeCompare(b.primaryName));
}

/** Looks up a single agent by (possibly partial/unnormalized) phone number, for live KYC-form lookup. */
export function findAgentByPhone(
  applications: KYCApplication[],
  phone: string
): Agent | undefined {
  const id = normalizePhone(phone);
  if (!id) return undefined;
  return deriveAgents(applications).find((a) => a.id === id);
}
