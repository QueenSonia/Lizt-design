import { useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Edit3,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { toast } from "sonner";

interface CalendarEvent {
  id: number;
  title: string;
  type: "rent-expiry" | "maintenance" | "custom";
  date: Date;
  time: string;
  notes: string;
  tenantName?: string;
  propertyName?: string;
}

type ViewMode = "month" | "week" | "day";

export default function LandlordCalendar() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 2, 1)); // March 2025
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "custom" as CalendarEvent["type"],
    date: "",
    time: "",
    notes: "",
  });

  // Sample events data
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 1,
      title: "John Doe - Apartment 2B",
      type: "rent-expiry",
      date: new Date(2025, 2, 5), // March 5
      time: "09:00",
      notes: "Monthly rent payment due",
      tenantName: "John Doe",
      propertyName: "Apartment 2B",
    },
    {
      id: 2,
      title: "AC Repair - Property 14",
      type: "maintenance",
      date: new Date(2025, 2, 10), // March 10
      time: "14:00",
      notes: "Air conditioning unit repair and maintenance",
      propertyName: "Property 14",
    },
    {
      id: 3,
      title: "Meeting with Lawyer",
      type: "custom",
      date: new Date(2025, 2, 12), // March 12
      time: "10:30",
      notes: "Legal consultation regarding property matters",
      tenantName: "",
      propertyName: "",
    },
    {
      id: 4,
      title: "Mary Johnson - Duplex A",
      type: "rent-expiry",
      date: new Date(2025, 2, 15), // March 15
      time: "09:00",
      notes: "Monthly rent payment due",
      tenantName: "Mary Johnson",
      propertyName: "Duplex A",
    },
    {
      id: 5,
      title: "Pest Control - Block C",
      type: "maintenance",
      date: new Date(2025, 2, 22), // March 22
      time: "11:00",
      notes: "Quarterly pest control treatment for entire block",
      propertyName: "Block C",
    },
    {
      id: 6,
      title: "David Smith - Penthouse",
      type: "rent-expiry",
      date: new Date(2025, 2, 28), // March 28
      time: "09:00",
      notes: "Monthly rent payment due",
      tenantName: "David Smith",
      propertyName: "Penthouse",
    },
  ]);

  const getEventColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "rent-expiry":
        return "bg-orange-500 text-white border-orange-500";
      case "maintenance":
        return "bg-blue-500 text-white border-blue-500";
      case "custom":
        return "bg-gray-500 text-white border-gray-500";
      default:
        return "bg-gray-500 text-white border-gray-500";
    }
  };

  const getEventBadgeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "rent-expiry":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "maintenance":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "custom":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatEventType = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "rent-expiry":
        return "Rent Expiry";
      case "maintenance":
        return "Maintenance/Inspection";
      case "custom":
        return "Custom Event";
      default:
        return "Event";
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Start from Sunday of the week containing the first day
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on Saturday of the week containing the last day
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) => event.date.toDateString() === date.toDateString()
    );
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter((event) => event.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventPanel(true);
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    const event: CalendarEvent = {
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      date: new Date(newEvent.date),
      time: newEvent.time,
      notes: newEvent.notes,
    };

    setEvents([...events, event]);
    setNewEvent({ title: "", type: "custom", date: "", time: "", notes: "" });
    setShowAddEventModal(false);
    toast.success("Event added successfully!");
  };

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter((e) => e.id !== eventId));
    setShowEventPanel(false);
    toast.success("Event deleted successfully!");
  };

  const calendarDays = generateCalendarDays();
  const upcomingEvents = getUpcomingEvents();

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>

            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <h2 className="text-lg font-semibold text-slate-700 min-w-[160px] text-center">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-white rounded-lg p-1 border border-slate-200">
            {(["month", "week", "day"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className={`capitalize ${
                  viewMode === mode
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mode}
              </Button>
            ))}
          </div>

          {/* Add Event Button */}
          <Dialog open={showAddEventModal} onOpenChange={setShowAddEventModal}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>
                  Create a new calendar event for rent payments, maintenance, or
                  custom activities.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event-title">Event Title *</Label>
                  <Input
                    id="event-title"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    placeholder="Enter event title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-type">Event Type *</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value: CalendarEvent["type"]) =>
                      setNewEvent({ ...newEvent, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rent-expiry">Rent Expiry</SelectItem>
                      <SelectItem value="maintenance">
                        Maintenance/Inspection
                      </SelectItem>
                      <SelectItem value="custom">Custom Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Date *</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-time">Time *</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-notes">Notes</Label>
                  <Textarea
                    id="event-notes"
                    value={newEvent.notes}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, notes: e.target.value })
                    }
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddEventModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEvent}
                  className="gradient-primary text-white"
                >
                  Save Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Calendar Grid */}
          <div className="xl:col-span-3">
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-6">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center py-2 text-sm font-semibold text-slate-600"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar Body */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, index) => {
                    const dayEvents = getEventsForDate(date);

                    return (
                      <div
                        key={index}
                        className={`
                            min-h-[120px] p-2 border border-slate-100 rounded-lg transition-colors hover:bg-slate-50
                            ${
                              isToday(date)
                                ? "bg-orange-50 border-orange-200"
                                : ""
                            }
                            ${!isCurrentMonth(date) ? "opacity-40" : ""}
                          `}
                      >
                        <div
                          className={`
                            text-sm font-medium mb-2
                            ${
                              isToday(date)
                                ? "text-orange-600"
                                : isCurrentMonth(date)
                                ? "text-slate-900"
                                : "text-slate-500"
                            }
                          `}
                        >
                          {date.getDate()}
                        </div>

                        <div className="space-y-1">
                          {dayEvents.map((event) => (
                            <Tooltip key={event.id} delayDuration={300}>
                              <TooltipTrigger asChild>
                                <div
                                  onClick={() => handleEventClick(event)}
                                  className={`
                                      text-xs px-2 py-1 rounded-md cursor-pointer transition-all hover:scale-105
                                      ${getEventColor(event.type)}
                                      truncate
                                    `}
                                >
                                  {event.title}
                                </div>
                              </TooltipTrigger>
                              {event.type === "rent-expiry" && (
                                <TooltipContent
                                  side="top"
                                  className="bg-white border border-slate-200 shadow-lg"
                                >
                                  <div className="text-xs">
                                    <p className="font-semibold">
                                      {event.tenantName}
                                    </p>
                                    <p className="text-slate-600">
                                      {event.propertyName}
                                    </p>
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Upcoming Events */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="p-3 border border-slate-200 rounded-lg hover:border-orange-200 hover:bg-orange-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900 text-sm truncate">
                          {event.title}
                        </h4>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEventBadgeColor(
                            event.type
                          )}`}
                        >
                          {formatEventType(event.type).split("/")[0]}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-slate-600">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {event.date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>

                        <div className="flex items-center text-xs text-slate-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {event.time}
                        </div>

                        {event.propertyName && (
                          <div className="flex items-center text-xs text-slate-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span className="truncate">
                              {event.propertyName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming events</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details Panel */}
            {showEventPanel && selectedEvent && (
              <Card className="bg-white shadow-sm border border-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Event Details
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEventPanel(false)}
                      className="p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {selectedEvent.title}
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEventBadgeColor(
                        selectedEvent.type
                      )}`}
                    >
                      {formatEventType(selectedEvent.type)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-slate-600">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {selectedEvent.date.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>

                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {selectedEvent.time}
                    </div>

                    {selectedEvent.tenantName && (
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {selectedEvent.tenantName}
                      </div>
                    )}

                    {selectedEvent.propertyName && (
                      <div className="flex items-center text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {selectedEvent.propertyName}
                      </div>
                    )}
                  </div>

                  {selectedEvent.notes && (
                    <div>
                      <h4 className="font-medium text-slate-900 mb-1">Notes</h4>
                      <p className="text-sm text-slate-600">
                        {selectedEvent.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
