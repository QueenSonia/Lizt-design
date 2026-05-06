"use client";
import { AdminPageHeader } from "./AdminPageHeader";
import { NOTIFICATIONS } from "./adminMockData";
import { Bell, AlertTriangle, AlertOctagon, Info } from "lucide-react";

const SEVERITY = {
  info: { icon: Info, classes: "bg-blue-50 text-blue-700" },
  warning: { icon: AlertTriangle, classes: "bg-amber-50 text-amber-700" },
  critical: { icon: AlertOctagon, classes: "bg-red-50 text-red-700" },
} as const;

export default function AdminNotifications() {
  return (
    <div className="p-6 lg:p-8 max-w-[900px] mx-auto">
      <AdminPageHeader
        title="Notifications"
        subtitle="System alerts and platform-wide notifications."
      />

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {NOTIFICATIONS.map((n) => {
          const meta = SEVERITY[n.severity as keyof typeof SEVERITY] || SEVERITY.info;
          const Icon = meta.icon;
          return (
            <div key={n.id} className="flex items-start gap-3 p-5 hover:bg-slate-50/50">
              <div
                className={`size-9 rounded-full flex items-center justify-center shrink-0 ${meta.classes}`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">{n.title}</div>
                <div className="text-sm text-slate-600 mt-0.5">{n.body}</div>
                <div className="text-[11px] text-slate-400 mt-1.5">{n.time}</div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <Bell className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
