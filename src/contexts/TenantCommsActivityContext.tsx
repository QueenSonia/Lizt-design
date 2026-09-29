"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { X, MessageSquare } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  tenantId: string;
  tenantName: string;
  direction: "incoming" | "outgoing";
  preview: string;
  timestamp: Date;
}

interface ToastData {
  tenantId: string;
  tenantName: string;
  preview: string;
}

interface ContextValue {
  feed: ActivityEntry[];
  hasNewMessage: boolean;
  triggerSimulation: () => void;
}

// ── Seed feed (newest first) ──────────────────────────────────────────────────

const SEED: { id: string; tenantId: string; tenantName: string; direction: "incoming" | "outgoing"; preview: string; iso: string }[] = [
  { id: "a-001", tenantId: "t-lp-001", tenantName: "Biodun Adewale",    direction: "outgoing", preview: "Yes! We offer flexible payment plans. Please speak with your property manager to set one up.", iso: "2026-09-29T09:23:00" },
  { id: "a-002", tenantId: "t-lp-001", tenantName: "Biodun Adewale",    direction: "incoming", preview: "Can I pay in installments?",                                                                  iso: "2026-09-29T09:22:00" },
  { id: "a-003", tenantId: "t-lp-001", tenantName: "Biodun Adewale",    direction: "outgoing", preview: "Good morning Biodun! Your rent of ₦4,800,000 is overdue by 95 days. Would you like to make a payment or set up a plan?", iso: "2026-09-29T09:15:00" },
  { id: "a-004", tenantId: "t-lp-001", tenantName: "Biodun Adewale",    direction: "incoming", preview: "Good morning, I want to ask about my rent payment",                                           iso: "2026-09-29T09:14:00" },
  { id: "a-005", tenantId: "t-lp-002", tenantName: "Chinyere Okonkwo",  direction: "outgoing", preview: "Hi Chinyere! I've noted your request. Your property manager will send the receipt shortly.",  iso: "2026-09-28T14:34:00" },
  { id: "a-006", tenantId: "t-lp-002", tenantName: "Chinyere Okonkwo",  direction: "incoming", preview: "Hello, I need a receipt for my last payment",                                                 iso: "2026-09-28T14:33:00" },
  { id: "a-007", tenantId: "t-lp-003", tenantName: "Emeka Nwosu",       direction: "outgoing", preview: "Understood! We'll send you a reminder. Is there anything else I can help with?",              iso: "2026-09-28T11:08:00" },
  { id: "a-008", tenantId: "t-lp-003", tenantName: "Emeka Nwosu",       direction: "incoming", preview: "I will pay by end of week",                                                                  iso: "2026-09-28T11:07:00" },
  { id: "a-009", tenantId: "t-lp-003", tenantName: "Emeka Nwosu",       direction: "outgoing", preview: "Hi Emeka! Your payment plan instalment is overdue. Outstanding balance is ₦1,800,000.",      iso: "2026-09-28T11:06:00" },
  { id: "a-010", tenantId: "t-lp-003", tenantName: "Emeka Nwosu",       direction: "incoming", preview: "When is my next instalment due?",                                                             iso: "2026-09-28T11:05:00" },
  { id: "a-011", tenantId: "t-lp-004", tenantName: "Funmilayo Adesanya",direction: "outgoing", preview: "Of course! Your property manager will send you a full breakdown via email.",                  iso: "2026-09-27T16:51:00" },
  { id: "a-012", tenantId: "t-lp-004", tenantName: "Funmilayo Adesanya",direction: "incoming", preview: "I didn't know about this charge. Please send details to my email",                           iso: "2026-09-27T16:50:00" },
  { id: "a-013", tenantId: "t-lp-004", tenantName: "Funmilayo Adesanya",direction: "outgoing", preview: "Hi Funmilayo! Your service charge of ₦150,000 is billed separately. Due 15 Sept.",          iso: "2026-09-27T16:46:00" },
  { id: "a-014", tenantId: "t-lp-004", tenantName: "Funmilayo Adesanya",direction: "incoming", preview: "Is the service charge included in my rent?",                                                  iso: "2026-09-27T16:45:00" },
  { id: "a-015", tenantId: "t-lp-005", tenantName: "Tunde Balogun",     direction: "outgoing", preview: "Good morning Tunde! I'm escalating this to your property manager immediately.",               iso: "2026-09-26T08:31:00" },
  { id: "a-016", tenantId: "t-lp-005", tenantName: "Tunde Balogun",     direction: "incoming", preview: "Good morning, my water supply has been cut off. Please help",                                 iso: "2026-09-26T08:30:00" },
];

// Pool of simulated incoming messages cycled by the periodic timer
const SIM_POOL: Omit<ActivityEntry, "id" | "timestamp">[] = [
  { tenantId: "t-lp-002", tenantName: "Chinyere Okonkwo",   direction: "incoming", preview: "When will my property manager contact me about the receipt?" },
  { tenantId: "t-lp-005", tenantName: "Tunde Balogun",      direction: "incoming", preview: "Has the water issue been resolved? It's still not running" },
  { tenantId: "t-lp-001", tenantName: "Biodun Adewale",     direction: "incoming", preview: "I can pay half the outstanding amount this week" },
  { tenantId: "t-lp-003", tenantName: "Emeka Nwosu",        direction: "incoming", preview: "I made a bank transfer earlier today, please confirm receipt" },
  { tenantId: "t-lp-006", tenantName: "Ngozi Obi",          direction: "incoming", preview: "Good afternoon, I have a question about my lease renewal" },
  { tenantId: "t-lp-004", tenantName: "Funmilayo Adesanya", direction: "incoming", preview: "Did my property manager receive my email about the service charge?" },
];

// ── Context ───────────────────────────────────────────────────────────────────

const TenantCommsActivityContext = createContext<ContextValue | undefined>(undefined);

export function TenantCommsActivityProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [feed, setFeed] = useState<ActivityEntry[]>(() =>
    SEED.map(({ iso, ...rest }) => ({ ...rest, timestamp: new Date(iso) }))
  );
  const [toast, setToast] = useState<ToastData | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simIndex = useRef(0);

  const dismissToast = useCallback(() => {
    setToastVisible(false);
    setTimeout(() => setToast(null), 250); // allow fade-out
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const pushSimulatedMessage = useCallback(() => {
    const msg = SIM_POOL[simIndex.current % SIM_POOL.length];
    simIndex.current += 1;
    const entry: ActivityEntry = { ...msg, id: `sim-${Date.now()}`, timestamp: new Date() };
    setFeed(prev => [entry, ...prev]);
    setToast({ tenantId: msg.tenantId, tenantName: msg.tenantName, preview: msg.preview });
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(dismissToast, 6000);
  }, [dismissToast]);

  // Auto-simulate a new incoming message every 30 seconds
  useEffect(() => {
    const interval = setInterval(pushSimulatedMessage, 30000);
    return () => {
      clearInterval(interval);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [pushSimulatedMessage]);

  const handleToastClick = () => {
    if (toast) {
      const id = toast.tenantId;
      dismissToast();
      router.push(`/tenant-comms/kyc-application-detail/${id}`);
    }
  };

  return (
    <TenantCommsActivityContext.Provider
      value={{ feed, hasNewMessage: toastVisible, triggerSimulation: pushSimulatedMessage }}
    >
      {children}

      {/* ── Toast notification (fixed, visible on any TC screen) ── */}
      {toast && (
        <div
          onClick={handleToastClick}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            width: 320,
            background: "#1A1A1A",
            borderRadius: 12,
            padding: "12px 14px 12px 12px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
            opacity: toastVisible ? 1 : 0,
            transform: toastVisible ? "translateY(0)" : "translateY(12px)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "#FF5000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <MessageSquare size={14} color="white" />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#A0A0A0", marginBottom: 1 }}>New message</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", marginBottom: 2 }}>
              {toast.tenantName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#9A9A9A",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {toast.preview}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={(e) => { e.stopPropagation(); dismissToast(); }}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "#555",
              flexShrink: 0,
              marginTop: -2,
              display: "flex",
            }}
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </TenantCommsActivityContext.Provider>
  );
}

export function useTenantCommsActivity() {
  const ctx = useContext(TenantCommsActivityContext);
  if (!ctx) throw new Error("useTenantCommsActivity must be used within TenantCommsActivityProvider");
  return ctx;
}
