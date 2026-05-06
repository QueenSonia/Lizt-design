"use client";
import { Search, Bell } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000]"
            />
          </div>
          <button className="relative p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <Bell className="size-4 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#FF5000]" />
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
}
