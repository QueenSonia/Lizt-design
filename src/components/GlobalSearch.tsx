/* eslint-disable */
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Building2, Users, Home, KeyRound, Wrench, FileCheck, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ── Mock data corpus ──────────────────────────────────────────────────────────
// In a real app these would come from an API / global store.

const CORPUS = {
  landlords: [
    { id: "ll-001", name: "Michael Adeyemi", sub: "Individual · michael@email.com" },
    { id: "ll-002", name: "Sarah Johnson", sub: "Individual · sarah@email.com" },
    { id: "ll-003", name: "Funke Balogun", sub: "Individual · funke@email.com" },
    { id: "ll-004", name: "Adeyemi Holdings Ltd", sub: "Corporate · Contact: Michael Adeyemi" },
    { id: "ll-005", name: "Prime Estates Limited", sub: "Corporate · Contact: Sarah Johnson" },
  ],
  properties: [
    { id: "p-001", name: "Lekki Phase 1 Duplex", sub: "14 Admiralty Way, Lekki Phase 1" },
    { id: "p-002", name: "Ikoyi 2-Bed Apartment", sub: "3 Cameron Road, Ikoyi" },
    { id: "p-003", name: "Victoria Island Studio", sub: "22 Ozumba Mbadiwe Ave, VI" },
    { id: "p-004", name: "Banana Island Terrace", sub: "5 Banana Island Road, Ikoyi" },
    { id: "p-005", name: "Lekki Conservation Bungalow", sub: "7 Lekki Conservation Drive" },
    { id: "p-006", name: "Surulere Mini Flat", sub: "12 Adeniran Ogunsanya St, Surulere" },
    { id: "p-007", name: "Greenfield Towers", sub: "9 Walter Carrington Crescent, Lagos Island" },
    { id: "p-008", name: "Marina Commercial Hub", sub: "15 Marina St, Lagos Island" },
    { id: "p-009", name: "Ajah Estate Block A", sub: "1 Abraham Adesanya Estate, Ajah" },
    { id: "p-010", name: "Prime Towers VI", sub: "22 Adeola Odeku St, Victoria Island" },
    { id: "p-011", name: "Prime Gardens Lekki", sub: "10 Admiralty Way, Lekki Phase 1" },
  ],
  tenants: [
    { id: "kyc-001", name: "James Okafor", sub: "Lekki Phase 1 Duplex · +234 803 214 5678" },
    { id: "kyc-002", name: "Adaeze Nwosu", sub: "Ikoyi 2-Bed Apartment · +234 806 332 9910" },
    { id: "kyc-003", name: "Chidi Okafor", sub: "Banana Island Terrace · +234 708 991 2244" },
    { id: "kyc-004", name: "Amina Bello", sub: "Banana Island Terrace · +234 802 987 6543" },
    { id: "kyc-005", name: "Emmanuel Etim", sub: "Lekki Conservation Bungalow · +234 812 554 7723" },
    { id: "kyc-006", name: "Ngozi Eze", sub: "Surulere Mini Flat · +234 815 443 2211" },
    { id: "kyc-007", name: "Tunde Adebayo", sub: "Surulere Mini Flat · +234 803 567 8901" },
    { id: "kyc-008", name: "Bola Fashola", sub: "Greenfield Towers · +234 803 111 2222" },
    { id: "kyc-009", name: "Kemi Adesanya", sub: "Marina Commercial Hub · +234 706 334 5566" },
    { id: "kyc-010", name: "Seun Williams", sub: "Ajah Estate Block A · +234 812 778 9900" },
    { id: "kyc-011", name: "Akin Martins", sub: "Prime Towers VI · +234 905 221 3344" },
    { id: "kyc-012", name: "Ifeanyi Dike", sub: "Prime Gardens Lekki · +234 803 445 6677" },
    { id: "kyc-013", name: "Mary Johnson", sub: "Unassigned · +234 802 123 4567" },
  ],
  tenancies: [
    { id: "tn-001", name: "TEN-0001", sub: "James Okafor · Lekki Phase 1 Duplex · Active" },
    { id: "tn-002", name: "TEN-0002", sub: "Adaeze Nwosu · Ikoyi 2-Bed Apartment · Active" },
    { id: "tn-004", name: "TEN-0004", sub: "Chidi Okafor · Banana Island Terrace · Active" },
    { id: "tn-007", name: "TEN-0007", sub: "Ngozi Eze · Surulere Mini Flat · Outstanding" },
    { id: "tn-009", name: "TEN-0009", sub: "Bola Fashola · Greenfield Towers · Active" },
  ],
  maintenance: [
    { id: "is01", name: "Elevator malfunction on Floor 8", sub: "Greenfield Towers · Jide Akinola" },
    { id: "is02", name: "Water leakage in B-block corridor", sub: "Horizon Residences · Jide Akinola" },
    { id: "is03", name: "Power outage in parking bay 3", sub: "Greenfield Towers · Sarah Okonkwo" },
    { id: "is04", name: "HVAC noise in Unit 501", sub: "Marina Heights · Unassigned" },
    { id: "is05", name: "Fire exit door jammed — Floor 3", sub: "Marina Heights · John Adewale" },
    { id: "is06", name: "Broken gate latch — East entrance", sub: "Parkview Estate · Resolved" },
    { id: "is11", name: "Cracked bathroom tiles in unit 4B", sub: "Parkview Estate · Sarah Okonkwo" },
  ],
};

type Category = "landlords" | "properties" | "tenants" | "tenancies" | "maintenance";

interface ResultItem {
  id: string;
  name: string;
  sub: string;
  category: Category;
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  landlords: { label: "Landlords", icon: <Building2 className="w-3.5 h-3.5" />, color: "text-blue-600" },
  properties: { label: "Properties", icon: <Home className="w-3.5 h-3.5" />, color: "text-orange-600" },
  tenants: { label: "Tenants", icon: <Users className="w-3.5 h-3.5" />, color: "text-purple-600" },
  tenancies: { label: "Tenancies", icon: <KeyRound className="w-3.5 h-3.5" />, color: "text-green-600" },
  maintenance: { label: "Maintenance", icon: <Wrench className="w-3.5 h-3.5" />, color: "text-red-600" },
};

const RECENT_KEY = "gs_recent";
const MAX_RECENT = 5;

function getRecent(): ResultItem[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function saveRecent(item: ResultItem) {
  try {
    const prev = getRecent().filter((r) => !(r.id === item.id && r.category === item.category));
    localStorage.setItem(RECENT_KEY, JSON.stringify([item, ...prev].slice(0, MAX_RECENT)));
  } catch {}
}

// ── Highlight matching text ───────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Search logic ──────────────────────────────────────────────────────────────

function search(q: string): ResultItem[] {
  const lower = q.toLowerCase().trim();
  if (lower.length < 2) return [];
  const results: ResultItem[] = [];
  for (const [cat, items] of Object.entries(CORPUS) as [Category, typeof CORPUS.landlords][]) {
    for (const item of items) {
      if (item.name.toLowerCase().includes(lower) || item.sub.toLowerCase().includes(lower)) {
        results.push({ ...item, category: cat });
      }
    }
  }
  // Exact name matches first
  return results.sort((a, b) => {
    const aExact = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
    const bExact = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
    return aExact - bExact;
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

interface GlobalSearchProps {
  onNavigate?: () => void; // called after navigation (e.g. close mobile sidebar)
}

export function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<ResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.length >= 2 ? search(query) : [];

  // Group results by category
  const grouped = results.reduce<Partial<Record<Category, ResultItem[]>>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flat = results.slice(0, 20);

  const handleFocus = () => {
    setRecent(getRecent());
    setOpen(true);
    setActiveIdx(-1);
  };

  const handleChange = (v: string) => {
    setQuery(v);
    setActiveIdx(-1);
  };

  const navigateTo = useCallback((item: ResultItem) => {
    saveRecent(item);
    setQuery("");
    setOpen(false);
    setActiveIdx(-1);

    if (item.category === "landlords") {
      router.push(`/${userRole}/landlords`);
    } else if (item.category === "properties") {
      router.push(`/${userRole}/property-detail/${item.id}`);
    } else if (item.category === "tenants") {
      router.push(`/${userRole}/kyc-application-detail/${item.id}`);
    } else if (item.category === "tenancies") {
      router.push(`/${userRole}/tenancies`);
    } else if (item.category === "maintenance") {
      router.push(`/${userRole}/facility`);
    }
    onNavigate?.();
  }, [router, userRole, onNavigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    const list = query.length >= 2 ? flat : recent;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); navigateTo(list[activeIdx]); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const showDropdown = open && (query.length >= 2 ? results.length > 0 : recent.length > 0);

  return (
    <div ref={containerRef} className="relative px-4 py-3">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search everything..."
          className="w-full pl-9 pr-8 h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto">
          {/* Recent searches */}
          {query.length < 2 && recent.length > 0 && (
            <div>
              <div className="px-3 py-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recent</p>
                <button
                  onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline"
                >
                  Clear
                </button>
              </div>
              {recent.map((item, i) => {
                const meta = CATEGORY_META[item.category];
                const isActive = i === activeIdx;
                return (
                  <button
                    key={`${item.category}-${item.id}`}
                    onClick={() => navigateTo(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${isActive ? "bg-orange-50" : "hover:bg-slate-50"}`}
                  >
                    <span className={`${meta.color} shrink-0`}>{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Search results grouped by category */}
          {query.length >= 2 && (
            <div>
              {(Object.entries(grouped) as [Category, ResultItem[]][]).map(([cat, items]) => {
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat}>
                    <div className={`px-3 py-2 flex items-center gap-1.5 ${meta.color}`}>
                      {meta.icon}
                      <p className="text-[10px] font-semibold uppercase tracking-wider">{meta.label}</p>
                    </div>
                    {items.slice(0, 5).map((item) => {
                      const globalIdx = flat.indexOf(item);
                      const isActive = globalIdx === activeIdx;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigateTo(item)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-t border-slate-50 ${isActive ? "bg-orange-50" : "hover:bg-slate-50"}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800 font-medium truncate">
                              <Highlight text={item.name} query={query} />
                            </p>
                            <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No results for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try a different name, address, or reference.</p>
            </div>
          )}

          {/* Keyboard hint */}
          <div className="px-3 py-2 border-t border-slate-100 flex items-center gap-3 bg-slate-50">
            <span className="text-[10px] text-slate-400">↑↓ navigate</span>
            <span className="text-[10px] text-slate-400">↵ select</span>
            <span className="text-[10px] text-slate-400">Esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}
