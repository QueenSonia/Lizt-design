/* eslint-disable */
import { useState } from "react";
import {
  Home,
  Users,
  Building,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// Helper functions for dates
const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

const getStartOfDay = (date: Date): string => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.toDateString();
};

const generateActivityDates = () => {
  const today = new Date(2025, 8, 5); // September 5, 2025
  const yesterday = new Date(2025, 8, 4); // September 4, 2025
  const dayBefore = new Date(2025, 8, 3); // September 3, 2025
  const threeDaysAgo = new Date(2025, 8, 2); // September 2, 2025

  return {
    today,
    yesterday,
    dayBefore,
    threeDaysAgo,
  };
};

const dates = generateActivityDates();

// Landlord-specific activities
const landlordActivities = [
  {
    id: 1,
    type: "rent_received",
    title: "Rent payment received",
    description: "₦850,000 from David Adebayo - Marina Heights Unit 3A",
    date: new Date(2025, 8, 5, 14, 30), // Today, 2:30 PM
    priority: "normal" as const,
    category: "payment",
  },
  {
    id: 2,
    type: "maintenance_request",
    title: "Service request submitted",
    description: "Kitchen faucet repair needed at City Centre Plaza Unit 8B",
    date: new Date(2025, 8, 5, 11, 45), // Today, 11:45 AM
    priority: "medium" as const,
    category: "maintenance",
  },
  {
    id: 3,
    type: "lease_renewal",
    title: "Lease renewal completed",
    description: "Grace Emenike renewed lease for Marina Heights Unit 2B",
    date: new Date(2025, 8, 5, 9, 15), // Today, 9:15 AM
    priority: "normal" as const,
    category: "lease",
  },
  {
    id: 4,
    type: "maintenance_completed",
    title: "Maintenance completed",
    description: "Air conditioning repair finished at Ocean View Towers",
    date: new Date(2025, 8, 4, 16, 30), // Yesterday, 4:30 PM
    priority: "normal" as const,
    category: "maintenance",
  },
  {
    id: 5,
    type: "tenant_inquiry",
    title: "New tenant inquiry",
    description: "Potential tenant interested in Sunset Apartments Unit 4A",
    date: new Date(2025, 8, 4, 13, 20), // Yesterday, 1:20 PM
    priority: "normal" as const,
    category: "inquiry",
  },
  {
    id: 6,
    type: "rent_reminder_sent",
    title: "Rent reminders sent",
    description: "Monthly rent reminders sent to 8 tenants via WhatsApp",
    date: new Date(2025, 8, 4, 10, 0), // Yesterday, 10:00 AM
    priority: "normal" as const,
    category: "communication",
  },
  {
    id: 7,
    type: "inspection_scheduled",
    title: "Property inspection scheduled",
    description: "Quarterly inspection booked for Downtown Lofts complex",
    date: new Date(2025, 8, 3, 15, 45), // Sept 3, 3:45 PM
    priority: "normal" as const,
    category: "inspection",
  },
  {
    id: 8,
    type: "tenant_moved_in",
    title: "New tenant move-in",
    description: "Sarah Johnson moved into Sunset Apartments Unit 4A",
    date: new Date(2025, 8, 3, 11, 30), // Sept 3, 11:30 AM
    priority: "normal" as const,
    category: "tenant",
  },
];

interface ActivitySection {
  title: string;
  activities: typeof landlordActivities;
}

interface LandlordDashboardProps {
  searchTerm?: string;
}

// Mock data for landlord's portfolio overview
const portfolioStats = [
  {
    title: "Total Properties",
    value: "8",
    change: "+1",
    changeType: "positive" as const,
    icon: Building,
    description: "Active units",
  },
  {
    title: "Monthly Rent",
    value: "₦12.5M",
    change: "+8.3%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "Expected income",
  },
  {
    title: "Occupancy Rate",
    value: "94%",
    change: "+2.1%",
    changeType: "positive" as const,
    icon: TrendingUp,
    description: "Current occupancy",
  },
  {
    title: "Active Tenants",
    value: "22",
    change: "+3",
    changeType: "positive" as const,
    icon: Users,
    description: "Current residents",
  },
];

const upcomingExpiries = [
  {
    tenant: "Sarah Johnson",
    property: "Sunset Apartments Unit 4A",
    expiryDate: "2024-12-15",
    daysLeft: 12,
  },
  {
    tenant: "Michael Chen",
    property: "Ocean View Towers Unit 8B",
    expiryDate: "2024-12-28",
    daysLeft: 25,
  },
  {
    tenant: "Amara Okafor",
    property: "Marina Heights Unit 2B",
    expiryDate: "2025-01-10",
    daysLeft: 38,
  },
];

const recentActivities = [
  {
    id: 1,
    type: "rent_received",
    message: "Rent payment received from David Adebayo - ₦850,000",
    time: "2 hours ago",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    id: 2,
    type: "maintenance_request",
    message: "New service request: Kitchen faucet repair at City Centre Plaza",
    time: "4 hours ago",
    icon: AlertTriangle,
    color: "text-orange-600",
  },
  {
    id: 3,
    type: "lease_signed",
    message: "Lease renewal signed by Grace Emenike - Marina Heights",
    time: "6 hours ago",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    id: 4,
    type: "maintenance_completed",
    message: "Air conditioning repair completed at Ocean View Towers",
    time: "1 day ago",
    icon: CheckCircle,
    color: "text-blue-600",
  },
];

const activeServiceRequests = [
  {
    id: 1,
    property: "Sunset Apartments",
    issue: "Plumbing repair",
    priority: "High",
    status: "In Progress",
  },
  {
    id: 2,
    property: "City Centre Plaza",
    issue: "Kitchen faucet",
    priority: "Medium",
    status: "Pending",
  },
];

export default function LandlordDashboard({
  searchTerm = "",
}: LandlordDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("30d");

  const filteredActivities = recentActivities.filter((activity) =>
    activity.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter landlord activities based on search term
  const filteredLandlordActivities = landlordActivities.filter((activity) => {
    if (!searchTerm) return true;
    return (
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Section activities by actual dates
  const getLandlordActivitySections = (): ActivitySection[] => {
    // Group activities by date
    const activitiesByDate = new Map<string, typeof landlordActivities>();

    filteredLandlordActivities.forEach((activity) => {
      const dateKey = getStartOfDay(activity.date);
      if (!activitiesByDate.has(dateKey)) {
        activitiesByDate.set(dateKey, []);
      }
      activitiesByDate.get(dateKey)!.push(activity);
    });

    // Convert to sections with smart date formatting
    const sections: ActivitySection[] = [];

    // Get reference dates for comparison
    const today = getStartOfDay(dates.today);
    const yesterday = getStartOfDay(dates.yesterday);

    // Sort dates in descending order (most recent first)
    const sortedDates = Array.from(activitiesByDate.keys()).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    sortedDates.forEach((dateKey) => {
      const activities = activitiesByDate.get(dateKey)!;
      // Sort activities within each day by time (most recent first)
      const sortedActivities = activities.sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );

      // Determine section title based on date
      let sectionTitle: string;
      if (dateKey === today) {
        sectionTitle = "Today";
      } else if (dateKey === yesterday) {
        sectionTitle = "Yesterday";
      } else {
        // Use full date format for older dates
        sectionTitle = formatDate(sortedActivities[0].date);
      }

      sections.push({
        title: sectionTitle,
        activities: sortedActivities,
      });
    });

    return sections;
  };

  const landlordActivitySections = getLandlordActivitySections();

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-slate-600">
              Here's your portfolio overview. Most activities are automated via
              WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-3 space-y-6">
          {/* Activity Feed */}
          {/* Live Feed */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {landlordActivitySections.length > 0 ? (
                <div>
                  {landlordActivitySections.map((section, sectionIndex) => (
                    <div
                      key={section.title}
                      className={
                        sectionIndex > 0 ? "border-t-2 border-slate-200" : ""
                      }
                    >
                      {/* Section Header */}
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <h3 className="font-semibold text-slate-700">
                            {section.title}
                          </h3>
                        </div>
                      </div>

                      {/* Section Activities */}
                      <div>
                        {section.activities.map((activity, activityIndex) => (
                          <div
                            key={activity.id}
                            className="group relative p-6 cursor-pointer transition-all duration-300 ease-out hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent border-l-4 border-transparent hover:border-orange-500 hover:shadow-sm"
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
                                    <h4 className="text-base font-semibold text-slate-900 group-hover:text-orange-700 transition-all duration-300 relative inline-block">
                                      {activity.title}
                                      {/* Modern underline effect */}
                                      <span className="absolute left-0 bottom-0 h-0.5 w-0 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300 group-hover:w-full"></span>
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                                      {activity.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-3 h-3 text-slate-400 group-hover:text-slate-500 transition-colors duration-300" />
                                    <span className="text-xs text-slate-500 font-medium group-hover:text-slate-600 transition-colors duration-300">
                                      {(() => {
                                        const date = new Date(activity.date);
                                        return isNaN(date.getTime())
                                          ? ""
                                          : date.toLocaleTimeString("en-US", {
                                              hour: "numeric",
                                              minute: "2-digit",
                                              hour12: true,
                                            });
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Subtle bottom border that appears on hover */}
                            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    No activities found
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                    Activity will appear here as things happen with your
                    properties and tenants.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Lease Expiries */}
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6"></div>
      </div>
    </div>
  );
}
