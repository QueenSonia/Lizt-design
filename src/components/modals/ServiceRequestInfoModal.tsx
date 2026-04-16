"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface ServiceRequestData {
  id: string;
  issue: string;
  description: string;
  status: string;
  property: string;
  reportedBy: string;
  assignedTo: string;
  submittedDate: string;
  resolvedDate?: string;
  activityLog: Array<{ action: string; date: string }>;
}

interface ServiceRequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ServiceRequestData;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ServiceRequestInfoModal({
  isOpen,
  onClose,
  data,
}: ServiceRequestInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>{data.issue}</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Service Request · {data.property}
          </p>
          <DialogDescription className="sr-only">
            Service request details for {data.issue}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Reported by, Assigned to */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Reported by:</span>
              <span className="text-gray-900 font-medium">
                {data.reportedBy}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Assigned to:</span>
              <span className="text-gray-900 font-medium">
                {data.assignedTo}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {data.status}
            </span>
          </div>

          {/* Dates */}
          <div className="space-y-3 pt-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Submitted:</p>
              <p className="text-sm text-gray-900">
                {formatDate(data.submittedDate)}
              </p>
            </div>
            {data.resolvedDate &&
              data.status?.toLowerCase() === "resolved" && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Resolved:</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(data.resolvedDate)}
                  </p>
                </div>
              )}
          </div>

          {/* Description */}
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-2">Description:</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.description}
            </p>
          </div>

          {/* Activity Log */}
          {data.activityLog && data.activityLog.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 mb-3">Activity log:</p>
              <div className="space-y-2">
                {data.activityLog.map(
                  (activity: { action: string; date: string }, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{activity.action}</span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
