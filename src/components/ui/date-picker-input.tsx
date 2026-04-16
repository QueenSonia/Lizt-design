"use client";
import * as React from "react";
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface CalendarDay {
  day: number;
  currentMonth: boolean;
  date: Date;
}

interface CustomCalendarProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date) => void;
  fromYear: number;
  toYear: number;
  disabledDates?: (date: Date) => boolean;
}

function CustomCalendar({
  selectedDate,
  onSelect,
  fromYear,
  toYear,
  disabledDates,
}: CustomCalendarProps) {
  const [viewDate, setViewDate] = React.useState(selectedDate || new Date());
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => fromYear + i,
  ).reverse();

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: CalendarDay[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      currentMonth: false,
      date: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      currentMonth: true,
      date: new Date(viewYear, viewMonth, i),
    });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      day: i,
      currentMonth: false,
      date: new Date(viewYear, viewMonth + 1, i),
    });
  }

  const isSelected = (date: Date) =>
    !!selectedDate &&
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  return (
    <div className="p-3 bg-white select-none w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-1 flex-1">
          <select
            value={viewMonth}
            onChange={(e) =>
              setViewDate(new Date(viewYear, parseInt(e.target.value), 1))
            }
            className="text-sm font-medium bg-transparent border-none focus:outline-none cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={(e) =>
              setViewDate(new Date(parseInt(e.target.value), viewMonth, 1))
            }
            className="text-sm font-medium bg-transparent border-none focus:outline-none cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] uppercase font-bold text-slate-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((item, i) => {
          const isDisabled = !!(disabledDates && disabledDates(item.date));

          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(item.date)}
              className={cn(
                "h-9 w-full flex items-center justify-center text-sm rounded-md transition-all",
                !item.currentMonth && "text-slate-300 opacity-50",
                item.currentMonth &&
                  !isDisabled &&
                  "hover:bg-indigo-50 text-slate-700",
                isDisabled && "cursor-not-allowed opacity-40",
                isSelected(item.date) &&
                  "bg-indigo-600 !text-white hover:bg-indigo-700 font-semibold shadow-sm",
              )}
            >
              {item.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DatePickerInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Renders the trigger with a red border when true */
  error?: boolean;
  /** Callback to determine if a given day should be disabled in the calendar */
  disabledDates?: (date: Date) => boolean;
  className?: string;
  /** Earliest year shown in the year dropdown. Default: 2000 */
  fromYear?: number;
  /** Latest year shown in the year dropdown. Default: current year + 20 */
  toYear?: number;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  error = false,
  disabledDates,
  className,
  fromYear,
  toYear,
}: DatePickerInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const resolvedFromYear = fromYear ?? 2000;
  const resolvedToYear = toYear ?? currentYear + 20;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center w-full h-10 px-3 text-left transition-all bg-white border rounded-lg outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-500",
          error ? "border-red-500" : "border-slate-200 hover:border-slate-300",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          !value && "text-slate-400",
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 opacity-50 shrink-0" />
        <span className="flex-1 truncate text-sm">
          {value ? formatDate(value) : placeholder}
        </span>
        {value && !disabled && (
          <X
            size={14}
            className="ml-2 opacity-30 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onChange(undefined);
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <CustomCalendar
            selectedDate={value}
            fromYear={resolvedFromYear}
            toYear={resolvedToYear}
            disabledDates={disabledDates}
            onSelect={(date) => {
              onChange(date);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
