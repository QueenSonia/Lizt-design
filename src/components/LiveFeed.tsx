/* eslint-disable */
import { useState } from "react";
import { Clock, Calendar as CalendarIcon, Bell, BellOff } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useFetchPropertyOverview } from "@/services/notification/query";
import { Notification, NotificationType } from "@/types/notification";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// Format a full date (for "older" activity sections)
export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

// Format time (for each activity row)
export const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleTimeString("en-US", options);
};

// Normalize date to start of day (used for grouping)
export const getStartOfDay = (date: Date): string => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.toDateString();
};

// Instead of fixed demo dates, always compute fresh ones
export const dates = {
  today: new Date(),
  yesterday: new Date(new Date().setDate(new Date().getDate() - 1)),
};

interface LiveFeedProps {
  onActivityClick: (
    activityId: string,
    actionType: string,
    relatedId: string
  ) => void;
  searchTerm: string;
}

interface ActivitySection {
  title: string;
  activities: Notification[];
}

// Helper to generate a title from notification type
const getNotificationTitle = (notification: Notification): string => {
  switch (notification.type) {
    case NotificationType.RENT_REMINDER:
      return "Rent reminder sent";
    case NotificationType.RENT_PAYMENT:
      return "Rent payment received";
    case NotificationType.RENT_OVERDUE:
      return "Rent overdue";
    case NotificationType.SERVICE_REQUEST:
      return "Maintenance request";
    case NotificationType.MAINTENANCE_COMPLETED:
      return "Maintenance completed";
    case NotificationType.GENERAL:
    default:
      return "Notification";
  }
};

export function LiveFeed({ onActivityClick, searchTerm }: LiveFeedProps) {
  const { data, isLoading } = useFetchPropertyOverview();
  const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading: isPushLoading } = usePushNotifications();

  // Extract all notifications from all pages
  const allActivities: Notification[] =
    data?.pages?.flatMap((page) => page.notifications) || [];

  // Filter activities based on search term
  const filteredActivities = allActivities.filter((activity: Notification) => {
    if (!searchTerm) return true;
    const title = getNotificationTitle(activity);
    return (
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.property?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Section activities by actual dates
  const getSectionedActivities = (): ActivitySection[] => {
    const activitiesByDate = new Map<string, Notification[]>();

    filteredActivities.forEach((activity: Notification) => {
      const dateKey = getStartOfDay(activity.date);
      if (!activitiesByDate.has(dateKey)) {
        activitiesByDate.set(dateKey, []);
      }
      activitiesByDate.get(dateKey)!.push(activity);
    });

    const today = getStartOfDay(dates.today);
    const yesterday = getStartOfDay(dates.yesterday);

    const sortedDates = Array.from(activitiesByDate.keys()).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const sections: ActivitySection[] = [];

    sortedDates.forEach((dateKey) => {
      const activities = activitiesByDate.get(dateKey)!;
      const sortedActivities = activities.sort(
        (a: Notification, b: Notification) =>
          b.date.getTime() - a.date.getTime()
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
    <div className="page-container space-y-8">
      <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center">Loading...</div>
          ) : activitySections.length > 0 ? (
            <div>
              {activitySections.map((section, sectionIndex) => (
                <div
                  key={section.title}
                  className={
                    sectionIndex > 0 ? "border-t-2 border-slate-200" : ""
                  }
                >
                  {/* Section Header */}
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-slate-500" />
                      <h3 className="font-semibold text-slate-700">
                        {section.title}
                      </h3>
                    </div>
                    {sectionIndex === 0 && isSupported && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-auto md:hidden"
                        onClick={isSubscribed ? unsubscribe : subscribe}
                        disabled={isPushLoading}
                        title={isSubscribed ? "Disable notifications" : "Enable notifications"}
                      >
                        {isSubscribed ? (
                          <Bell className="h-4 w-4 text-orange-500 fill-orange-500" />
                        ) : (
                          <Bell className="h-4 w-4 text-slate-400 hover:text-orange-500" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Section Activities */}
                  <div>
                    {section.activities.map(
                      (activity: Notification, activityIndex) => {
                        const title = getNotificationTitle(activity);
                        return (
                          <div
                            key={activity.id}
                            className="group relative p-6 cursor-pointer transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent border-l-4 border-transparent hover:border-orange-500 hover:shadow-sm"
                            style={{
                              borderBottom:
                                activityIndex < section.activities.length - 1
                                  ? "1px solid #E5E7EB"
                                  : "none",
                            }}
                            onClick={() =>
                              onActivityClick(
                                activity.id,
                                activity.type,
                                activity.service_request_id ||
                                activity.property_id
                              )
                            }
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="space-y-1">
                                    <h4 className="text-base font-semibold text-slate-900 group-hover:text-orange-700 transition-all duration-300 relative inline-block">
                                      {title}
                                      <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300 group-hover:w-full"></span>
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                                      {activity.description}
                                    </p>
                                    {activity.property && (
                                      <p className="text-xs text-slate-500 mt-1">
                                        {activity.property.name}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`ml-4 px-2 py-1 text-xs font-medium rounded-full ${activity.status === "Completed"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                      }`}
                                  >
                                    {activity.status}
                                  </span>
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
                            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                No activities found
              </h3>
              <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                {searchTerm
                  ? "Try adjusting your search terms to see more activities."
                  : "Activity will appear here as things happen with your properties."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
