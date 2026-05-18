/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare,
  Clock,
  CalendarIcon,
  AlertCircle,
  Bell,
  Wrench,
  Users,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  getRequestAssignee,
  subscribeToFMStore,
} from "@/lib/facilityManagerStore";
import {
  isTaskPriority,
  subscribeToThreadStore,
} from "@/lib/taskThreadStore";
import { useFetchPropertyOverview } from "@/services/notification/query";
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from "@/types/notification";
import LandlordTopNav from "@/components/LandlordTopNav";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMobile } from "@/contexts/MobileContext";
import { LandlordAddPropertyModal } from "@/components/LandlordAddPropertyModal";
import { LandlordAddTenantModal } from "@/components/LandlordAddTenantModal";
import AddManagerModal from "@/components/AddManagerModal";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";
import axios from "@/services/axios-instance";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface LandlordLiveFeedProps {
  searchTerm?: string;
  onItemClick?: (
    tenantId: string,
    section: "overview" | "history" | "documents" | "chat",
  ) => void;
  onItemClick2?: (propertyId: string) => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
  showAddButton?: boolean;
  isMenuOpen?: boolean;
}

interface Activity {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  date: Date;
  property: string;
  propertyId?: string;
  status: NotificationStatus;
  package: string;
  tenantId?: string;
  section: "overview" | "history" | "documents" | "chat";
}

interface ActivitySection {
  title: string;
  activities: Activity[];
}

const getActivitySection = (type: NotificationType): Activity["section"] => {
  switch (type) {
    case NotificationType.USER_ADDED_TO_PROPERTY:
    case NotificationType.LEASE_SIGNED:
    case NotificationType.NOTICE_AGREEMENT:
    case NotificationType.USER_SIGNED_UP:
    case NotificationType.KYC_SUBMITTED:
    case NotificationType.OFFER_LETTER_SENT:
    case NotificationType.OFFER_LETTER_ACCEPTED:
    case NotificationType.OFFER_LETTER_REJECTED:
    case NotificationType.RENEWAL_LINK_SENT:
    case NotificationType.RENEWAL_PAYMENT_RECEIVED:
    case NotificationType.RENEWAL_PAYMENT_MADE:
    case NotificationType.RENT_CREATED:
    case NotificationType.RENT_REMINDER:
    case NotificationType.USER_ADDED_HISTORY:
      return "overview";
    case NotificationType.SERVICE_REQUEST:
    default:
      return "history";
  }
};

export function mapNotificationToActivities(
  notifications: Notification[],
): Activity[] {
  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.property?.name || "Property Notification",
    description: notification.description,
    date: new Date(notification.date),
    property: notification.property?.name || "Unknown Property",
    propertyId: notification.property?.id,
    status: notification.status,
    package: "base",
    tenantId: notification.tenant_id ? notification.tenant_id : undefined,
    section: getActivitySection(notification.type),
  }));
}

export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

export const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleTimeString("en-US", options);
};

export const getStartOfDay = (date: Date): string => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.toDateString();
};

const getDates = () => ({
  today: new Date(),
  yesterday: new Date(new Date().setDate(new Date().getDate() - 1)),
});

const LiveFeedSkeletonLoader = () => {
  return (
    <div className="space-y-3">
      {[1, 2].map((sectionIndex) => (
        <div key={sectionIndex}>
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>

          <div>
            {[1, 2, 3].map((itemIndex) => (
              <div
                key={itemIndex}
                className="p-6 border-b border-slate-100 animate-pulse"
              >
                <div className="flex items-start">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-slate-200 rounded" />
                        <div className="h-3 w-16 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Pending Maintenance Tasks ─────────────────────────────────────────────────

interface PendingRequest {
  id: string;
  description: string;
  property_name: string;
  tenant_name: string;
  reporter_name?: string;
  source: "tenant" | "facility_manager";
  status: string;
  date_reported: string;
}

const PENDING_REQUESTS: PendingRequest[] = [
  {
    id: "sr-001",
    description: "Kitchen sink is leaking and water pools under the cabinet.",
    property_name: "Lekki Phase 1 Duplex",
    tenant_name: "James Okafor",
    reporter_name: "James Okafor",
    source: "tenant",
    status: "open",
    date_reported: "2026-04-25T09:30:00.000Z",
  },
  {
    id: "sr-003",
    description: "Driveway gate motor is jammed; needs replacement bracket.",
    property_name: "Lekki Phase 1 Duplex",
    tenant_name: "—",
    reporter_name: "Tobi Adekunle",
    source: "facility_manager",
    status: "open",
    date_reported: "2026-04-26T07:45:00.000Z",
  },
  {
    id: "sr-005",
    description: "Air conditioner not cooling, just blowing warm air.",
    property_name: "Victoria Island Studio",
    tenant_name: "Emmanuel Etim",
    reporter_name: "Emmanuel Etim",
    source: "tenant",
    status: "urgent",
    date_reported: "2026-04-27T19:05:00.000Z",
  },
];

// Returns action tag label and style for a request
function getActionTag(req: PendingRequest, assigneeName: string | null, isPriority: boolean): { label: string; color: string; bg: string; border: string } {
  if (isPriority) return { label: "Priority", color: "#C94A00", bg: "#FFF1EC", border: "#FFD4C2" };
  if (req.status === "urgent") return { label: "Urgent", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" };
  if (!assigneeName) return { label: "Unassigned", color: "#6B5800", bg: "#FEFBE8", border: "#F0E68A" };
  return { label: "Needs Approval", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" };
}

function PendingMaintenanceTasks({ onNavigateToFacility }: { onNavigateToFacility: () => void }) {
  const [, tick] = useState(0);

  useEffect(() => {
    const unsubFM = subscribeToFMStore(() => tick((n) => n + 1));
    const unsubThread = subscribeToThreadStore(() => tick((n) => n + 1));
    return () => { unsubFM(); unsubThread(); };
  }, []);

  // Filter: show open/urgent (not resolved/closed)
  const pending = PENDING_REQUESTS.filter(
    (r) => !["resolved", "closed"].includes(r.status.toLowerCase()),
  );

  // Sort: priority first, then urgent
  const sorted = [...pending].sort((a, b) => {
    const ap = isTaskPriority(a.id) ? 0 : a.status === "urgent" ? 1 : 2;
    const bp = isTaskPriority(b.id) ? 0 : b.status === "urgent" ? 1 : 2;
    return ap - bp;
  });

  if (sorted.length === 0) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        border: "1px solid #EDECEA",
        boxShadow: "0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.03)",
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid #F0EEEA",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Wrench style={{ width: 15, height: 15, color: "#FF5000", flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>
            Pending Maintenance Tasks
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#FF5000",
              background: "#FFF1EC",
              border: "1px solid #FFD4C2",
              borderRadius: 99,
              padding: "1px 7px",
              lineHeight: 1.7,
            }}
          >
            {sorted.length}
          </span>
        </div>
      </div>

      {/* List */}
      <div>
        {sorted.map((req, i) => {
          const assignee = getRequestAssignee(req.id);
          const isPriority = isTaskPriority(req.id);
          const tag = getActionTag(req, assignee?.name ?? null, isPriority);
          const meta = req.source === "tenant" ? req.reporter_name || req.tenant_name : req.reporter_name || "FM";
          const showAssignCta = !assignee && !isPriority && req.status !== "urgent";

          return (
            <div
              key={req.id}
              style={{
                padding: "14px 20px",
                borderBottom: i < sorted.length - 1 ? "1px solid #F5F4F1" : "none",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: isPriority ? "#FFF1EC" : req.status === "urgent" ? "#FEF2F2" : "#F5F4F1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Wrench style={{ width: 14, height: 14, color: isPriority || req.status === "urgent" ? "#FF5000" : "#9A9790" }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1A1A1A",
                    lineHeight: 1.4,
                    marginBottom: 3,
                    wordBreak: "break-word",
                  }}
                >
                  {req.description}
                </p>
                <div
                  style={{
                    fontSize: 12,
                    color: "#9A9790",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span>{req.property_name}</span>
                  <span style={{ color: "#D5D2CD" }}>·</span>
                  {assignee ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Users style={{ width: 11, height: 11 }} />
                      {assignee.name}
                    </span>
                  ) : (
                    <span>{meta}</span>
                  )}
                </div>
                {/* Tags + actions row */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: tag.color,
                      background: tag.bg,
                      border: `1px solid ${tag.border}`,
                      borderRadius: 99,
                      padding: "2px 8px",
                      lineHeight: 1.6,
                    }}
                  >
                    {tag.label}
                  </span>
                  {showAssignCta && (
                    <button
                      type="button"
                      onClick={onNavigateToFacility}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#6B5800",
                        background: "#FEFBE8",
                        border: "1px solid #F0E68A",
                        borderRadius: 99,
                        padding: "2px 8px",
                        lineHeight: 1.6,
                        cursor: "pointer",
                      }}
                    >
                      Assign FM
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onNavigateToFacility}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#5A5650",
                      background: "transparent",
                      border: "1px solid #E5E2DC",
                      borderRadius: 99,
                      padding: "2px 10px",
                      lineHeight: 1.6,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    View
                    <ChevronRight style={{ width: 10, height: 10 }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <button
        type="button"
        onClick={onNavigateToFacility}
        style={{
          width: "100%",
          padding: "12px 20px",
          borderTop: "1px solid #F0EEEA",
          background: "#FAFAF9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          fontSize: 13,
          fontWeight: 600,
          color: "#FF5000",
          cursor: "pointer",
          border: "none",
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        }}
      >
        View all maintenance tasks
        <ChevronRight style={{ width: 13, height: 13 }} />
      </button>
    </div>
  );
}

export default function LandlordLiveFeed({
  searchTerm = "",
  onItemClick,
  onItemClick2,
  onMenuClick,
  isMobile = false,
  showAddButton = true,
  isMenuOpen = false,
}: LandlordLiveFeedProps) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userRole = user?.role;
  const { isMobile: isMobileContext } = useMobile();
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);

  const {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading: isPushLoading,
  } = usePushNotifications();

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useFetchPropertyOverview();

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  const observer = useRef<IntersectionObserver | null>(null);
  const preloadTriggerRef = useCallback(
    (node: any) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        {
          // Start loading when the trigger element is 200px away from entering the viewport
          rootMargin: "200px 0px 200px 0px",
        },
      );
      if (node) observer.current.observe(node);
    },
    [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const handleAddProperty = () => {
    if (isMobileContext) {
      router.push(`/${userRole}/add-property`);
    } else {
      setShowAddPropertyModal(true);
    }
  };

  const handleAddTenant = () => {
    if (isMobileContext) {
      router.push(`/${userRole}/add-tenant`);
    } else {
      setShowAddTenantModal(true);
    }
  };

  const handleAddManager = async (managerData: unknown) => {
    try {
      await axios.post("/users/team-members", managerData);
      toast.success("Facility manager added successfully");
      setShowAddManagerModal(false);
    } catch (error) {
      console.error("Error adding manager:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to add facility manager",
      );
    }
  };

  const handleTenantClick = (
    tenantId: string,
    _section: "overview" | "history" | "documents" | "chat",
  ) => {
    if (onItemClick) {
      onItemClick(tenantId, _section);
    } else {
      const kycId = tenantId.replace(/^app-/, "");
      router.push(`/${userRole}/kyc-application-detail/${kycId}`);
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    if (onItemClick2) {
      onItemClick2(propertyId);
    } else {
      router.push(`/${userRole}/property-detail?propertyId=${propertyId}`);
    }
  };

  const [landlordId, setLandlordId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setLandlordId(payload.sub || payload.userId || payload.id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  useWebSocket({
    landlordId: landlordId,
    enabled: !!landlordId,
    onKYCSubmitted: (data) => {
      console.log("New KYC application received via WebSocket:", data);
      toast.success(
        `New KYC application from ${data.kycData?.firstName} ${data.kycData?.lastName}`,
      );
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
    },
    onServiceRequestCreated: (data) => {
      console.log("New maintenance request received via WebSocket:", data);
      toast.info(
        `New maintenance request from ${data.serviceRequestData?.tenantName || "tenant"
        }`,
      );
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
    },
    onOfferLetterSent: (data) => {
      console.log("Offer letter sent via WebSocket:", data);
      toast.success(
        `Offer letter sent to ${data.applicantName} for ${data.propertyName}`,
      );
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
    },
    onOfferLetterAccepted: (data) => {
      console.log("Offer letter accepted via WebSocket:", data);
      toast.success(
        `🎉 ${data.applicantName} accepted the offer for ${data.propertyName}!`,
      );
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
    },
    onOfferLetterRejected: (data) => {
      console.log("Offer letter rejected via WebSocket:", data);
      toast.warning(
        `${data.applicantName} declined the offer for ${data.propertyName}`,
      );
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
    },
    onHistoryAdded: (data) => {
      console.log("History entry added via WebSocket:", data);
      toast.info(
        `History added: ${data.displayType} — ${data.tenantName || data.propertyName}`,
      );
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
    },
    onWhatsAppNotification: (data) => {
      const retryLabel = data.isRetry ? ` (retry #${data.attempts})` : "";
      if (data.success) {
        toast.success(
          `Message sent to ${data.recipientName} successfully${retryLabel}`,
        );
      } else {
        toast.error(
          `Failed to send message to ${data.recipientName}: ${data.error ?? "Unknown error"}`,
        );
      }
    },
    onReconnect: () => {
      // Refetch live feed data after reconnecting — we likely missed events
      // while the PWA was backgrounded
      queryClient.invalidateQueries({ queryKey: ["fetch-property-overview"] });
    },
  });

  const activities: Activity[] = mapNotificationToActivities(notifications);

  const filteredActivities = activities.filter((activity) => {
    if (!searchTerm) return true;
    return (
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.property.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getSectionedActivities = (): ActivitySection[] => {
    const activitiesByDate = new Map<string, Activity[]>();

    filteredActivities.forEach((activity) => {
      const dateKey = getStartOfDay(activity.date);
      if (!activitiesByDate.has(dateKey)) {
        activitiesByDate.set(dateKey, []);
      }
      activitiesByDate.get(dateKey)!.push(activity);
    });

    const dates = getDates();
    const today = getStartOfDay(dates.today);
    const yesterday = getStartOfDay(dates.yesterday);

    const sortedDates = Array.from(activitiesByDate.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );

    const sections: ActivitySection[] = [];

    sortedDates.forEach((dateKey) => {
      const activities = activitiesByDate.get(dateKey)!;
      const sortedActivities = activities.sort(
        (a, b) => b.date.getTime() - a.date.getTime(),
      );

      let sectionTitle: string;
      if (dateKey === today) {
        sectionTitle = "Today";
      } else if (dateKey === yesterday) {
        sectionTitle = "Yesterday";
      } else {
        sectionTitle = formatDate(sortedActivities[0].date);
      }

      sections.push({
        title: sectionTitle,
        activities: sortedActivities,
      });
    });

    return sections;
  };

  const activitySections = getSectionedActivities();

  return (
    <>
      <LandlordTopNav
        title="Live Feed"
        subtitle="Real-time activity across your properties"
        onAddProperty={handleAddProperty}
        onAddTenant={handleAddTenant}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
        showAddNew={showAddButton}
        isMenuOpen={isMenuOpen}
      />

      <div className="pt-4 lg:pt-28 px-4 lg:px-8 pb-8 space-y-6">
        <div className="mt-4 lg:mt-10">
          <PendingMaintenanceTasks onNavigateToFacility={() => router.push(`/${userRole}/facility`)} />
        </div>
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base lg:text-lg leading-tight">
                Here is what is happening across all your properties
              </CardTitle>
              {isSupported && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 md:hidden"
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  disabled={isPushLoading}
                  title={
                    isSubscribed
                      ? "Disable notifications"
                      : "Enable notifications"
                  }
                >
                  {isSubscribed ? (
                    <Bell className="h-4 w-4 text-orange-500 fill-orange-500" />
                  ) : (
                    <Bell className="h-4 w-4 text-slate-400 hover:text-orange-500" />
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <LiveFeedSkeletonLoader />
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Failed to load LiveFeed
                </h3>
                <p className="text-slate-600 mb-4">
                  {error instanceof Error ? error.message : "An error occurred"}
                </p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No recent activities
                </h3>
              </div>
            ) : (
              <div className="space-y-3">
                {activitySections.map((section, sectionIndex) => (
                  <div
                    key={section.title}
                    className={
                      sectionIndex > 0 ? "border-t-2 border-slate-200" : ""
                    }
                  >
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-500" />
                        <h3 className="font-semibold text-slate-700">
                          {section.title}
                        </h3>
                      </div>
                    </div>

                    <div>
                      {section.activities.map((activity, activityIndex) => {
                        // Calculate total remaining items across all sections
                        const remainingSections = activitySections.slice(
                          sectionIndex + 1,
                        );
                        const remainingItemsInCurrentSection =
                          section.activities.length - activityIndex - 1;
                        const remainingItemsInOtherSections =
                          remainingSections.reduce(
                            (total, sec) => total + sec.activities.length,
                            0,
                          );
                        const totalRemainingItems =
                          remainingItemsInCurrentSection +
                          remainingItemsInOtherSections;

                        // Attach the preload trigger when there are 3 or fewer items remaining
                        const shouldAttachPreloadTrigger =
                          totalRemainingItems <= 3;

                        return (
                          <div
                            ref={
                              shouldAttachPreloadTrigger
                                ? preloadTriggerRef
                                : null
                            }
                            key={activity.id}
                            onClick={() => {
                              if (activity.type === "Property Created") {
                                handlePropertyClick(activity.propertyId!);
                              } else if (activity.tenantId) {
                                handleTenantClick(
                                  activity.tenantId,
                                  activity.section,
                                );
                              } else if (activity.propertyId) {
                                handlePropertyClick(activity.propertyId);
                              }
                            }}
                            className="
                            group relative p-6 cursor-pointer 
                            transition-all duration-300 ease-out
                            hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent
                            hover:border-l-orange-500 hover:border-l-4
                            hover:shadow-sm
                            active:bg-orange-100 active:border-l-orange-600 active:border-l-6 active:shadow-md
                            border-l-4 border-transparent
                            bg-white
                          "
                            style={{
                              borderBottom:
                                activityIndex < section.activities.length - 1
                                  ? "1px solid #E5E7EB"
                                  : "none",
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="space-y-1">
                                    {activity.type ===
                                      NotificationType.SERVICE_REQUEST ? (
                                      <>
                                        {activity.description
                                          .split("\n")
                                          .map((line, index) =>
                                            index === 0 ? (
                                              <div
                                                key={index}
                                                className="text-base font-semibold text-slate-900 group-hover:text-orange-700 transition-colors duration-300"
                                              >
                                                {line}
                                              </div>
                                            ) : (
                                              <p
                                                key={index}
                                                className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors duration-300"
                                              >
                                                {line}
                                              </p>
                                            ),
                                          )}
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-base font-semibold text-slate-900 group-hover:text-orange-700 transition-colors duration-300">
                                          {activity.description}
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                                          {activity.title}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-3 h-3 text-slate-400 group-hover:text-slate-500 transition-colors duration-300" />
                                    <span className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors duration-300">
                                      {formatTime(activity.date)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div>
                  {isFetchingNextPage && (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                  )}
                  {!hasNextPage && !isLoading && (
                    <div className="text-center py-4 text-slate-500">
                      <p>No more notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LandlordAddPropertyModal
        open={showAddPropertyModal}
        onOpenChange={setShowAddPropertyModal}
        onPropertyAdded={() => {
          setShowAddPropertyModal(false);
        }}
      />

      <LandlordAddTenantModal
        open={showAddTenantModal}
        onOpenChange={setShowAddTenantModal}
        onTenantAdded={() => {
          setShowAddTenantModal(false);
        }}
      />

      <AddManagerModal
        isOpen={showAddManagerModal}
        onClose={() => setShowAddManagerModal(false)}
        onAdd={handleAddManager}
      />
    </>
  );
}
