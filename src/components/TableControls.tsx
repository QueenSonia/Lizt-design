"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Settings, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

/** "Columns" button + popover — lets the user show/hide table columns via checkboxes. */
export function ColumnsButton<ColumnId extends string>({
  columns,
  visibility,
  primaryColumns,
  onToggle,
  visibleCount,
  totalCount,
}: {
  columns: { id: ColumnId; label: string }[];
  visibility: Record<ColumnId, boolean>;
  primaryColumns: ColumnId[];
  onToggle: (id: ColumnId) => void;
  visibleCount: number;
  totalCount: number;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const openPopover = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 224) });
    }
    setOpen(true);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={openPopover}
        title="Manage columns"
        className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${
          visibleCount < totalCount
            ? "border-[#FF5000] text-[#FF5000] bg-[#FFF3EB]"
            : "border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white"
        }`}
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Columns</span>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[100] w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Columns</p>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-2 py-2 max-h-72 overflow-y-auto">
              {columns.map((col) => {
                const isLastPrimary =
                  primaryColumns.includes(col.id) &&
                  visibility[col.id] &&
                  !primaryColumns.some((p) => p !== col.id && visibility[p]);
                return (
                  <label
                    key={col.id}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm ${
                      isLastPrimary ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                    }`}
                    title={isLastPrimary ? "At least one primary column must stay visible" : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={visibility[col.id]}
                      disabled={isLastPrimary}
                      onChange={() => onToggle(col.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#FF5000] focus:ring-[#FF5000] focus:ring-offset-0 disabled:opacity-50"
                    />
                    {col.label}
                  </label>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

/** Summary + rows-per-page selector + Previous/page-numbers/Next controls for a paginated table. */
export function TablePagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  rangeStart,
  rangeEnd,
  total,
  itemLabel = "records",
  getPageNumbers,
  pageSizeOptions = ROWS_PER_PAGE_OPTIONS,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  itemLabel?: string;
  getPageNumbers: () => (number | string)[];
  pageSizeOptions?: number[];
}) {
  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-gray-500 order-2 sm:order-1">
        <span className="whitespace-nowrap">
          {total === 0 ? `No ${itemLabel}` : `Showing ${rangeStart}–${rangeEnd} of ${total} ${itemLabel}`}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="whitespace-nowrap hidden sm:inline">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[70px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-8 w-8 rounded-lg border-gray-200 hover:bg-[#FFF3EB] hover:border-[#FF5000] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-gray-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {getPageNumbers().map((p, index) =>
          typeof p === "number" ? (
            <Button
              key={index}
              variant={page === p ? "default" : "outline"}
              onClick={() => onPageChange(p)}
              className={`h-8 w-8 rounded-lg text-xs p-0 ${
                page === p
                  ? "bg-white border-2 border-[#FF5000] text-[#FF5000] hover:bg-[#FFF3EB]"
                  : "border-gray-200 hover:bg-[#FFF3EB] hover:border-[#FF5000]"
              }`}
            >
              {p}
            </Button>
          ) : (
            <span key={index} className="px-0.5 text-gray-400 text-xs">{p}</span>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="h-8 w-8 rounded-lg border-gray-200 hover:bg-[#FFF3EB] hover:border-[#FF5000] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-gray-200"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/** Sticky-header class helper — apply to a <thead>, toggling shadow/border once its container has scrolled. */
export function stickyHeadClass(scrolled: boolean): string {
  return `bg-gray-50 border-b sticky top-0 z-10 transition-shadow duration-150 ${
    scrolled ? "border-gray-300 shadow-sm" : "border-gray-200"
  }`;
}

/** Sticky-section-header class helper — for a plain card/list section title (not a <thead>). */
export function stickySectionHeadClass(scrolled: boolean): string {
  return `px-5 py-4 border-b bg-white sticky top-0 z-10 transition-shadow duration-150 ${
    scrolled ? "border-gray-200 shadow-sm" : "border-gray-100"
  }`;
}
