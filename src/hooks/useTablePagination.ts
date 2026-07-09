"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Slices `items` into pages. Resets to page 1 whenever `resetKey` changes (pass a value derived
 * from search/filter/sort state) so a new result set always starts at the top — but navigating
 * pages of the *same* result set never triggers a reset.
 */
export function useTablePagination<T>(
  items: T[],
  resetKey: unknown,
  defaultPageSize = 20
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, pageSize]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(currentPage, totalPages);

  const paginated = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  const rangeStart = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, items.length);

  function getPageNumbers(): (number | string)[] {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);
    if (page <= 2) end = Math.min(totalPages - 1, 4);
    if (page >= totalPages - 1) start = Math.max(2, totalPages - 3);
    if (start > 2) pages.push("...");
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  }

  return {
    page,
    setPage: setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginated,
    rangeStart,
    rangeEnd,
    total: items.length,
    getPageNumbers,
  };
}
