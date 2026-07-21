"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, ClipboardList, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "./ui/input";
import { TablePagination, stickyHeadClass } from "./TableControls";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useTableScrollShadow } from "@/hooks/useTableScrollShadow";
import {
  MOCK_ONBOARDING_SUBMISSIONS,
  OnboardingSubmission,
  occupancySummary,
  propertyCount,
} from "@/types/onboarding";

type DateBucket = "7d" | "30d" | "90d" | null;

interface OnboardingFilters {
  dateBucket: DateBucket;
}

const EMPTY_FILTERS: OnboardingFilters = { dateBucket: null };

function activeFilterCount(f: OnboardingFilters) {
  return f.dateBucket ? 1 : 0;
}

function matchesDateBucket(submittedAt: string, bucket: DateBucket): boolean {
  if (!bucket) return true;
  const days = bucket === "7d" ? 7 : bucket === "30d" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(submittedAt).getTime() >= cutoff;
}

function formatSubmittedOn(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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

function FilterPopover({
  filters,
  onApply,
  onClose,
  pos,
}: {
  filters: OnboardingFilters;
  onApply: (next: OnboardingFilters) => void;
  onClose: () => void;
  pos: { top: number; left: number };
}) {
  const [draft, setDraft] = useState<OnboardingFilters>(filters);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div
        className="fixed z-[100] w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Filter</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Date Submitted
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterBtn
                label="Last 7 days"
                active={draft.dateBucket === "7d"}
                onClick={() =>
                  setDraft((d) => ({ dateBucket: d.dateBucket === "7d" ? null : "7d" }))
                }
              />
              <FilterBtn
                label="Last 30 days"
                active={draft.dateBucket === "30d"}
                onClick={() =>
                  setDraft((d) => ({ dateBucket: d.dateBucket === "30d" ? null : "30d" }))
                }
              />
              <FilterBtn
                label="Last 90 days"
                active={draft.dateBucket === "90d"}
                onClick={() =>
                  setDraft((d) => ({ dateBucket: d.dateBucket === "90d" ? null : "90d" }))
                }
              />
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setDraft(EMPTY_FILTERS)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
          <button
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="h-8 px-4 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: "#FF5000" }}
          >
            Apply
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

interface LandlordOnboardingProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordOnboarding({ onMenuClick, isMobile }: LandlordOnboardingProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<OnboardingFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterPos, setFilterPos] = useState({ top: 0, left: 0 });
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  const openFilterPopover = () => {
    if (filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      setFilterPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 288) });
    }
    setFilterOpen(true);
  };

  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role ?? "landlord";

  const { ref: tableScrollRef, scrolled: tableScrolled, onScroll: handleTableScroll } =
    useTableScrollShadow<HTMLDivElement>();

  const submissions = MOCK_ONBOARDING_SUBMISSIONS;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return submissions.filter((s) => {
      const matchesSearch =
        !q ||
        s.landlordName.toLowerCase().includes(q) ||
        s.landlordPhone.toLowerCase().includes(q);
      return matchesSearch && matchesDateBucket(s.submittedAt, filters.dateBucket);
    });
  }, [submissions, search, filters]);

  const pagination = useTablePagination(filtered, `${search}|${filters.dateBucket ?? ""}`);

  const goToSubmission = (submission: OnboardingSubmission) => {
    router.push(`/${userRole}/onboarding-detail/${submission.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] overflow-hidden">
      {/* Fixed header */}
      <div className="lg:fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white shadow-sm">
        <div className="px-4 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Onboarding</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Landlord onboarding submissions awaiting review
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mx-4 lg:mx-8" />

        {/* Search + filter row */}
        <div className="px-4 lg:px-8 py-4 flex items-center gap-2">
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by landlord name or phone..."
              className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white focus:ring-1 focus:ring-orange-200 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            ref={filterBtnRef}
            onClick={openFilterPopover}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
              activeFilterCount(filters) > 0
                ? "border-[#FF5000] text-[#FF5000] bg-[#FFF3EB]"
                : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount(filters) > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FF5000] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount(filters)}
              </span>
            )}
          </button>

          {filterOpen && (
            <FilterPopover
              filters={filters}
              onApply={setFilters}
              onClose={() => setFilterOpen(false)}
              pos={filterPos}
            />
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto lg:pt-[125px]">
        <div className="px-4 sm:px-6 pt-8 pb-5">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              {search || activeFilterCount(filters) > 0 ? (
                <>
                  <p className="text-gray-700 text-sm font-medium mb-1">
                    No submissions match your search.
                  </p>
                  <p className="text-gray-400 text-xs">Try a different name, phone number, or date range.</p>
                </>
              ) : (
                <>
                  <p className="text-gray-700 text-sm font-medium mb-1">
                    No onboarding submissions yet.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Landlord onboarding requests will appear here once they are submitted.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div ref={tableScrollRef} onScroll={handleTableScroll} className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className={stickyHeadClass(tableScrolled)}>
                    <tr>
                      <th className="text-left px-6 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Landlord</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Number of Properties</span>
                      </th>
                      <th className="text-left px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Occupancy Summary</span>
                      </th>
                      <th className="text-left px-4 py-3 pr-6">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Submitted On</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagination.paginated.map((submission) => (
                      <tr
                        key={submission.id}
                        onClick={() => goToSubmission(submission)}
                        className="bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">{submission.landlordName}</td>
                        <td className="px-4 py-4 text-gray-700">{submission.landlordPhone}</td>
                        <td className="px-4 py-4 text-gray-700">{propertyCount(submission)}</td>
                        <td className="px-4 py-4 text-gray-700">{occupancySummary(submission.properties)}</td>
                        <td className="px-4 py-4 pr-6 text-gray-500">{formatSubmittedOn(submission.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {pagination.paginated.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => goToSubmission(submission)}
                    className="px-4 py-4 active:bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">{submission.landlordName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{submission.landlordPhone}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span>{propertyCount(submission)} propert{propertyCount(submission) === 1 ? "y" : "ies"}</span>
                      <span className="text-gray-300">•</span>
                      <span>{occupancySummary(submission.properties)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">{formatSubmittedOn(submission.submittedAt)}</p>
                  </div>
                ))}
              </div>

              <TablePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                rangeStart={pagination.rangeStart}
                rangeEnd={pagination.rangeEnd}
                total={pagination.total}
                itemLabel="submissions"
                getPageNumbers={pagination.getPageNumbers}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
