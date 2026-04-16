import React, { useEffect, useRef } from "react";
import { Check, CheckCheck, AlertCircle, MessageCircle } from "lucide-react";
import { safeFormatTime, getChatDateLabel, getDateKey } from "@/utils/date-utils";

// Render message status indicator for tenant messages
const renderMessageStatus = (status?: "sent" | "delivered" | "read") => {
  if (!status) return null;
  if (status === "sent") {
    return <span className="text-gray-400 text-xs">✓</span>;
  }
  if (status === "delivered") {
    return <span className="text-gray-400 text-xs">✓✓</span>;
  }
  if (status === "read") {
    return <span className="text-blue-500 text-xs">✓✓</span>;
  }
  return null;
};

// Status Icon Logic
const StatusIcon = ({ status }: { status: string }) => {
  switch (status.toLowerCase()) {
    case "sent":
      return <Check className="w-3 h-3 text-slate-400" />;
    case "delivered":
      return <CheckCheck className="w-3 h-3 text-slate-400" />;
    case "read":
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    case "failed":
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    default:
      return null;
  }
};

interface ChatLog {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  status: string;
  created_at: string;
  error_reason?: string;
  phone_number: string;
  message_type: string;
  whatsapp_message_id?: string;
  error_code?: string;
  metadata?: Record<string, unknown>;
}

interface TenantChatHistoryProps {
  logs: ChatLog[];
}

export const TenantChatHistory = ({ logs }: TenantChatHistoryProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when component mounts or logs update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [logs]);
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500">No WhatsApp conversation available</p>
      </div>
    );
  }

  return (
    <div
      ref={chatContainerRef}
      className="bg-gray-100 rounded-xl p-4 sm:p-6 max-h-[600px] overflow-y-auto overflow-x-hidden w-full space-y-2.5 scroll-smooth"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23C0C0C0' stroke-width='1.2' opacity='0.3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 25h-8v-8l6-6 6 6v8h-8zm-4-4v4m4-4v4' transform='rotate(-8 15 17)'/%3E%3Cpath d='M68 18l-3-3 3-3m-6 0h6m-3 9v-6' transform='rotate(12 65 15)'/%3E%3Cpath d='M100 58c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6v0l-3 4h-14l-3-4z' transform='translate(-100 -40) rotate(5 110 58)'/%3E%3Cpath d='M58 68h12v16h-12z M61 76h6 M61 80h6' transform='rotate(-10 64 76)'/%3E%3Cpath d='M10 78a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M10 69v6 M7 72h6' transform='rotate(15 10 72)'/%3E%3Cpath d='M100 18c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v2h-2v4h-8v-4h-2v-2z M106 12v-2' transform='translate(-100 0) rotate(-12 106 15)'/%3E%3Cpath d='M55 100h12v14h-12z M58 106h6 M61 100v4 M61 110v4' transform='translate(0 -100) rotate(8 61 107)'/%3E%3Cpath d='M10 105h-8v-8l6-6 6 6v8h-8zm-4-4v4m4-4v4' transform='rotate(10 10 97)'/%3E%3Cpath d='M108 68l-3-3 3-3m-6 0h6m-3 9v-6' transform='translate(-100 0) rotate(-15 108 65)'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: "120px 120px",
        backgroundRepeat: "repeat",
      }}
    >
      {logs.map((log, index) => {
        const isBot = log.direction === "OUTBOUND";
        const isTenant = log.direction === "INBOUND";
        const isSimulated = log.metadata?.is_simulated || false;

        // Show date separator when the day changes between messages
        const currentDateKey = getDateKey(log.created_at);
        const prevDateKey =
          index > 0 ? getDateKey(logs[index - 1].created_at) : "";
        const showDateSeparator =
          currentDateKey && currentDateKey !== prevDateKey;

        return (
          <React.Fragment key={log.id}>
            {showDateSeparator && (
              <div className="flex justify-center my-3">
                <span className="bg-white text-gray-500 text-[11px] px-3 py-1 rounded-lg shadow-sm">
                  {getChatDateLabel(log.created_at)}
                </span>
              </div>
            )}

            <div
              className={`flex ${isTenant ? "justify-end" : "justify-start"}`}
            >
            <div
              className={`max-w-[85%] sm:max-w-[75%] md:max-w-[60%] ${
                isTenant ? "items-end" : "items-start"
              } flex flex-col gap-1`}
            >
              <div
                className={`relative px-3 py-2 ${
                  isBot
                    ? 'bg-[#EDEDED] rounded-[12px] before:content-[""] before:absolute before:bottom-0 before:left-[-6px] before:w-0 before:h-0 before:border-[6px] before:border-transparent before:border-r-[#EDEDED] before:border-b-[#EDEDED] before:rounded-bl-[3px]'
                    : 'bg-white border border-orange-50 rounded-[12px] shadow-sm after:content-[""] after:absolute after:bottom-0 after:right-[-6px] after:w-0 after:h-0 after:border-[6px] after:border-transparent after:border-l-white after:border-b-white after:rounded-br-[3px]'
                } ${
                  isSimulated ? "border-2 border-dashed border-amber-400" : ""
                }`}
              >
                {/* Simulated Badge */}
                {isSimulated && (
                  <div className="absolute -top-3 left-0 bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full border border-amber-200 font-medium">
                    SIMULATED
                  </div>
                )}

                {/* Message Content */}
                <p
                  className={`text-xs sm:text-sm leading-relaxed wrap-break-word whitespace-pre-line ${
                    isBot ? "text-gray-700" : "text-gray-900"
                  }`}
                >
                  {log.content}
                </p>

                {/* Quick reply buttons for template messages */}
                {isBot && log.message_type === "template" && (() => {
                  const BUTTON_LABELS: Record<string, string> = {
                    confirm_tenancy_details: "Confirm details",
                    confirm_resolution_yes: "Yes, it's fixed",
                    confirm_resolution_no: "No, not yet",
                  };
                  type ButtonComponent = {
                    type: string;
                    sub_type?: string;
                    parameters?: Array<{ type: string; payload?: string }>;
                  };
                  const components = (log.metadata as { template?: { components?: ButtonComponent[] } } | undefined)?.template?.components;
                  if (!components) return null;
                  const buttons = components
                    .filter((c) => c.type === "button" && c.sub_type === "quick_reply")
                    .flatMap((c) => c.parameters || [])
                    .filter((p) => p.type === "payload" && p.payload)
                    .map((p) => {
                      const action = p.payload!.includes(":") ? p.payload!.split(":")[0] : p.payload!;
                      return BUTTON_LABELS[action] ?? action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                    });
                  if (buttons.length === 0) return null;
                  return (
                    <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
                      {buttons.map((label, i) => (
                        <div key={i} className="text-xs text-center text-[#00A884] font-medium py-1">
                          {label}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Timestamp and Status (only for tenant messages) */}
              {isTenant && (
                <div className="flex items-center gap-1 px-2">
                  <span className="text-[11px] text-gray-400">
                    {safeFormatTime(log.created_at)}
                  </span>
                  {log.status && (
                    <>
                      <span className="text-[11px] text-gray-300">·</span>
                      {renderMessageStatus(
                        log.status.toLowerCase() as
                          | "sent"
                          | "delivered"
                          | "read"
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Error Display for tenant messages */}
              {isTenant && log.status === "failed" && (
                <div className="px-2">
                  <p className="text-[10px] text-red-500 mt-1 italic">
                    {log.error_reason || "Message failed"}
                    {log.error_code && (
                      <span className="ml-1 text-red-400">({log.error_code})</span>
                    )}
                  </p>
                </div>
              )}

              {/* Metadata & Status for bot messages */}
              {isBot && (
                <div className="flex items-center justify-start gap-1 px-2">
                  <span className="text-[11px] text-gray-400">
                    {safeFormatTime(log.created_at)}
                  </span>
                  <StatusIcon status={log.status} />
                </div>
              )}

              {/* Error Display for bot messages */}
              {isBot && log.status === "failed" && (
                <div className="px-2">
                  <p className="text-[10px] text-red-500 mt-1 italic">
                    {log.error_reason || "Delivery failed"}
                    {log.error_code && (
                      <span className="ml-1 text-red-400">({log.error_code})</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
