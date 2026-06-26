/* eslint-disable */
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Building2, Users, Home, KeyRound, Wrench, FileCheck, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ── Mock corpus ───────────────────────────────────────────────────────────────

const CORPUS = {
  landlords: [
    { id: "ll-001", name: "Michael Adeyemi", sub: "michael@email.com · +234 803 100 0001" },
    { id: "ll-002", name: "Sarah Johnson", sub: "sarah@email.com · +234 803 100 0002" },
    { id: "ll-003", name: "Funke Balogun", sub: "funke@email.com · +234 803 100 0003" },
    { id: "ll-004", name: "Adeyemi Holdings Ltd", sub: "Corporate · Contact: Michael Adeyemi" },
    { id: "ll-005", name: "Prime Estates Limited", sub: "Corporate · Contact: Sarah Johnson" },
  ],
  properties: [
    { id: "p-001", name: "Lekki Phase 1 Duplex", sub: "14 Admiralty Way, Lekki Phase 1, Lagos" },
    { id: "p-002", name: "Ikoyi 2-Bed Apartment", sub: "3 Cameron Road, Ikoyi, Lagos" },
    { id: "p-003", name: "Victoria Island Studio", sub: "22 Ozumba Mbadiwe Ave, VI, Lagos" },
    { id: "p-004", name: "Banana Island Terrace", sub: "5 Banana Island Road, Ikoyi, Lagos" },
    { id: "p-005", name: "Lekki Conservation Bungalow", sub: "7 Lekki Conservation Drive, Lagos" },
    { id: "p-006", name: "Surulere Mini Flat", sub: "12 Adeniran Ogunsanya St, Surulere" },
    { id: "p-007", name: "Greenfield Towers", sub: "9 Walter Carrington Crescent, Lagos Island" },
    { id: "p-008", name: "Marina Commercial Hub", sub: "15 Marina St, Lagos Island" },
    { id: "p-009", name: "Ajah Estate Block A", sub: "1 Abraham Adesanya Estate, Ajah, Lagos" },
    { id: "p-010", name: "Prime Towers VI", sub: "22 Adeola Odeku St, Victoria Island" },
    { id: "p-011", name: "Prime Gardens Lekki", sub: "10 Admiralty Way, Lekki Phase 1, Lagos" },
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
    { id: "is01", name: "Elevator malfunction on Floor 8", sub: "Greenfield Towers · Open" },
    { id: "is02", name: "Water leakage in B-block corridor", sub: "Horizon Residences · In Progress" },
    { id: "is03", name: "Power outage in parking bay 3", sub: "Greenfield Towers · In Progress" },
    { id: "is04", name: "HVAC noise in Unit 501", sub: "Marina Heights · Open" },
    { id: "is05", name: "Fire exit door jammed — Floor 3", sub: "Marina Heights · Open" },
    { id: "is06", name: "Broken gate latch — East entrance", sub: "Parkview Estate · Resolved" },
    { id: "is11", name: "Cracked bathroom tiles in unit 4B", sub: "Parkview Estate · Open" },
  ],
};

type Category = "landlords" | "properties" | "tenants" | "tenancies" | "maintenance";

export interface GlobalResultItem {
  id: string;
  name: string;
  sub: string;
  category: Category;
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  landlords: { label: "Landlords", icon: <Building2 className="w-3.5 h-3.5" />, color: "text-blue-600" },
  properties: { label: "Properties", icon: <Home className="w-3.5 h-3.5" />, color: "text-orange-500" },
  tenants: { label: "Tenants", icon: <Users className="w-3.5 h-3.5" />, color: "text-purple-600" },
  tenancies: { label: "Tenancies", icon: <KeyRound className="w-3.5 h-3.5" />, color: "text-green-600" },
  maintenance: { label: "Maintenance", icon: <Wrench className="w-3.5 h-3.5" />, color: "text-red-500" },
};

// ── Search logic ──────────────────────────────────────────────────────────────

function runSearch(q: string): GlobalResultItem[] {
  const lower = q.toLowerCase().trim();
  if (lower.length < 2) return [];
  const results: GlobalResultItem[] = [];
  for (const [cat, items] of Object.entries(CORPUS) as [Category, { id: string; name: string; sub: string }[]][]) {
    for (const item of items) {
      if (item.name.toLowerCase().includes(lower) || item.sub.toLowerCase().includes(lower)) {
        results.push({ ...item, category: cat });
      }
    }
  }
  return results.sort((a, b) => {
    const aEx = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
    const bEx = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
    return aEx - bEx;
  });
}

// ── Highlight ─────────────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded-sm px-0.5 not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Dropdown ──────────────────────────────────────────────────────────────────
// Drop this beside any search <input> to give it global search behaviour.
// Pass the current input value, a setter, and an anchor ref pointing to the input wrapper.

interface GlobalSearchDropdownProps {
  query: string;
  anchorRef: React.RefObject<HTMLElement>;   // the wrapper div around the input
  onClose: () => void;
}

export function GlobalSearchDropdown({ query, anchorRef, onClose }: GlobalSearchDropdownProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";
  const [activeIdx, setActiveIdx] = useState(-1);

  const results = runSearch(query);
  const flat = results.slice(0, 25);
  const grouped = flat.reduce<Partial<Record<Category, GlobalResultItem[]>>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  const navigate = useCallback((item: GlobalResultItem) => {
    onClose();
    if (item.category === "landlords") router.push(`/${userRole}/landlords`);
    else if (item.category === "properties") router.push(`/${userRole}/property-detail/${item.id}`);
    else if (item.category === "tenants") router.push(`/${userRole}/kyc-application-detail/${item.id}`);
    else if (item.category === "tenancies") router.push(`/${userRole}/tenancies`);
    else if (item.category === "maintenance") router.push(`/${userRole}/facility`);
  }, [router, userRole, onClose]);

  // Keyboard nav — attach to document so it works regardless of input focus
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flat.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
      else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); navigate(flat[activeIdx]); }
      else if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [flat, activeIdx, navigate, onClose]);

  if (results.length === 0 && query.length >= 2) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-8 text-center">
        <Search className="w-7 h-7 text-gray-200 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-500">No results for "{query}"</p>
        <p className="text-xs text-gray-400 mt-0.5">Try a different name, address, or reference.</p>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto">
      {(Object.entries(grouped) as [Category, GlobalResultItem[]][]).map(([cat, items]) => {
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat}>
            {/* Category header */}
            <div className={`px-3 py-2 flex items-center gap-1.5 bg-gray-50 border-b border-gray-100 ${meta.color}`}>
              {meta.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider">{meta.label}</span>
            </div>
            {/* Items */}
            {items.map((item) => {
              const idx = flat.indexOf(item);
              const isActive = idx === activeIdx;
              return (
                <button
                  key={item.id}
                  onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                  onClick={() => navigate(item)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-gray-50 last:border-0 transition-colors ${
                    isActive ? "bg-orange-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      <Highlight text={item.name} query={query} />
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </button>
              );
            })}
          </div>
        );
      })}
      {/* Keyboard hint */}
      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center gap-3">
        <span className="text-[10px] text-gray-400">↑↓ navigate</span>
        <span className="text-[10px] text-gray-400">↵ open</span>
        <span className="text-[10px] text-gray-400">Esc close</span>
      </div>
    </div>
  );
}
