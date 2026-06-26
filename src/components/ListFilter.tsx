/* eslint-disable */
"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X, Search, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  multi?: boolean;       // allow multiple selections (default false = single-select)
  searchable?: boolean;  // render as searchable selector instead of chip buttons
}

export type FilterValues = Record<string, string[]>; // groupKey → selected values

interface ListFilterProps {
  groups: FilterGroup[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onClear: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function activeFilterCount(values: FilterValues): number {
  return Object.values(values).reduce((sum, arr) => sum + arr.length, 0);
}

function chipList(groups: FilterGroup[], values: FilterValues): { groupKey: string; value: string; label: string }[] {
  const chips: { groupKey: string; value: string; label: string }[] = [];
  for (const group of groups) {
    for (const val of values[group.key] ?? []) {
      const opt = group.options.find((o) => o.value === val);
      if (opt) chips.push({ groupKey: group.key, value: val, label: opt.label });
    }
  }
  return chips;
}

// ── Chip-style Filter Button ──────────────────────────────────────────────────

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? "border-[#FF5000] bg-[#FFF3EB] text-[#FF5000]"
          : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
      }`}
    >
      {label}
    </button>
  );
}

// ── Searchable Selector (inline, within panel) ────────────────────────────────

function SearchableSelector({
  group,
  draft,
  onToggle,
}: {
  group: FilterGroup;
  draft: FilterValues;
  onToggle: (groupKey: string, value: string, multi: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const selected = draft[group.key] ?? [];
  const filtered = q.trim()
    ? group.options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : group.options;

  return (
    <div>
      {/* Search box */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${group.label.toLowerCase()}...`}
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 outline-none focus:bg-white focus:border-gray-300"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Option list */}
      <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
        ) : (
          filtered.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggle(group.key, opt.value, group.multi ?? false)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                  isSelected ? "bg-orange-50 text-[#FF5000]" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
              </button>
            );
          })
        )}
      </div>

      {/* Clear selection */}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onToggle(group.key, selected[0], false)}
          className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 hover:underline"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ListFilter({ groups, values, onChange, onClear }: ListFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const count = activeFilterCount(values);
  const chips = chipList(groups, values);

  const openPanel = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 320) });
    }
    setDraft(structuredClone(values));
    setOpen(true);
  };

  const toggle = (groupKey: string, value: string, multi: boolean) => {
    setDraft((prev) => {
      const current = prev[groupKey] ?? [];
      if (multi) {
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [groupKey]: next };
      } else {
        return { ...prev, [groupKey]: current.includes(value) ? [] : [value] };
      }
    });
  };

  const apply = () => { onChange(draft); setOpen(false); };
  const resetDraft = () => setDraft({});

  const removeChip = (groupKey: string, value: string) => {
    onChange({ ...values, [groupKey]: (values[groupKey] ?? []).filter((v) => v !== value) });
  };

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const panel = document.getElementById("list-filter-panel");
      if (panel && !panel.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        onClick={openPanel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 36,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 8,
          border: `1px solid ${count > 0 ? "#FFD4C2" : "#E5E3DF"}`,
          background: count > 0 ? "#FFF3EB" : "#FFFFFF",
          color: count > 0 ? "#FF5000" : "#6B7280",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          width: "auto",
          transition: "border-color 0.15s, color 0.15s, background 0.15s",
          fontFamily: "inherit",
        }}
      >
        <SlidersHorizontal style={{ width: 16, height: 16, flexShrink: 0 }} />
        <span>Filter</span>
        {count > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 18, height: 18, borderRadius: "50%",
            background: "#FF5000", color: "#FFFFFF", fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>
            {count}
          </span>
        )}
      </button>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {chips.map(({ groupKey, value, label }) => (
            <span key={`${groupKey}-${value}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700 font-medium">
              {label}
              <button onClick={() => removeChip(groupKey, value)} className="text-gray-400 hover:text-gray-600 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button onClick={onClear} className="text-xs text-[#FF5000] hover:underline font-medium ml-1">
            Clear All
          </button>
        </div>
      )}

      {/* Filter panel */}
      {open && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            id="list-filter-panel"
            className="fixed z-[100] w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
            style={{ top: pos.top, left: pos.left }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Filters</p>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Groups */}
            <div className="px-4 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
              {groups.map((group) => (
                <div key={group.key}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {group.label}
                  </p>
                  {group.searchable ? (
                    <SearchableSelector group={group} draft={draft} onToggle={toggle} />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const selected = (draft[group.key] ?? []).includes(opt.value);
                        return (
                          <FilterBtn
                            key={opt.value}
                            label={opt.label}
                            active={selected}
                            onClick={() => toggle(group.key, opt.value, group.multi ?? false)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2 justify-end">
              <button onClick={resetDraft} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Reset
              </button>
              <button onClick={apply} className="px-3 py-1.5 text-xs font-medium text-white bg-[#FF5000] rounded-lg hover:bg-[#e04600] transition-colors">
                Apply
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
