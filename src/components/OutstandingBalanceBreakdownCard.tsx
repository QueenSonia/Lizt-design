"use client";
import { useState } from "react";
import { Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface BalanceLineItem {
  id: string;
  label: string;
  amount: number;
  date?: string;
}

export const DUMMY_OUTSTANDING_BREAKDOWN: BalanceLineItem[] = [
  {
    id: "dummy-rent-1",
    label: "Outstanding Rent",
    amount: 450_000,
    date: "2026-01-12",
  },
  {
    id: "dummy-service-1",
    label: "Service Charge",
    amount: 50_000,
    date: "2026-01-20",
  },
];

interface OutstandingBalancePillProps {
  items: BalanceLineItem[];
  className?: string;
}

const formatNaira = (n: number) =>
  `₦${(n ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export function OutstandingBalanceBreakdownCard({
  items,
  className = "",
}: OutstandingBalancePillProps) {
  const [open, setOpen] = useState(false);
  const total = items.reduce((sum, i) => sum + (i.amount ?? 0), 0);

  if (total <= 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View outstanding balance breakdown"
        className={`inline-flex items-center gap-1.5 rounded-full border border-[#FF5000]/30 bg-[#FFF3EB] px-2.5 py-1 text-xs font-medium text-[#FF5000] hover:bg-[#FFE5D4] hover:border-[#FF5000]/50 transition-colors ${className}`}
      >
        <Wallet className="h-3 w-3" />
        <span className="text-gray-600">Outstanding</span>
        <span className="font-semibold tabular-nums">{formatNaira(total)}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Outstanding Balance Breakdown</DialogTitle>
          </DialogHeader>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Description</th>
                  <th className="px-4 py-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{item.label}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                      {formatNaira(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-sm font-semibold text-gray-900"
                  >
                    Total Outstanding
                  </td>
                  <td className="px-4 py-3 text-right text-base font-semibold text-[#FF5000] tabular-nums whitespace-nowrap">
                    {formatNaira(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
