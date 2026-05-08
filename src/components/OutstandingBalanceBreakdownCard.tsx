"use client";
import { Wallet } from "lucide-react";

export interface BalanceLineItem {
  id: string;
  label: string;
  amount: number;
  date?: string;
}

interface OutstandingBalanceBreakdownCardProps {
  items: BalanceLineItem[];
  className?: string;
}

const formatNaira = (n: number) =>
  `₦${(n ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function OutstandingBalanceBreakdownCard({
  items,
  className = "",
}: OutstandingBalanceBreakdownCardProps) {
  const total = items.reduce((sum, i) => sum + (i.amount ?? 0), 0);

  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white ${className}`}
      aria-label="Outstanding Balance Breakdown"
    >
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#FFF3EB] text-[#FF5000] shrink-0">
            <Wallet className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              Outstanding Balance Breakdown
            </h2>
            <p className="text-[11px] text-gray-500">
              {items.length === 0
                ? "No outstanding fees recorded"
                : `${items.length} item${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-wide text-gray-400">
            Total
          </p>
          <p className="text-base font-semibold text-[#FF5000] tabular-nums">
            {formatNaira(total)}
          </p>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="px-4 sm:px-5 py-5 text-xs text-gray-500">
          No outstanding balances on record.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 px-4 sm:px-5 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.label}
                </p>
                {item.date && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {formatDate(item.date)}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                {formatNaira(item.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
