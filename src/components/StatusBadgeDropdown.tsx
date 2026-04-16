import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface StatusEvent {
  status: string;
  timestamp: string;
  datetime?: string; // ISO string for proper formatting
}

interface StatusBadgeDropdownProps {
  status:
    | "Open"
    | "Resolved"
    | "Reopened"
    | "Closed"
    | "Pending"
    | "In Progress"
    | "Urgent";
  statusHistory?: StatusEvent[];
  className?: string;
}

export function StatusBadgeDropdown({
  status,
  statusHistory = [],
  className = "",
}: StatusBadgeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "Pending":
      case "Open":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Reopened":
      case "Urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    } else if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  };

  // Get the most recent 5 status events (oldest to newest)
  const displayHistory = statusHistory.slice(-5);
  const hasHistory = statusHistory.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Status Badge as Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label="Toggle status history"
        aria-expanded={isOpen}
        aria-controls="status-dropdown-panel"
        disabled={!hasHistory}
        className={`
          inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs
          ${getStatusColor(status)}
          ${
            hasHistory
              ? "cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              : "cursor-default"
          }
        `}
      >
        <span>{status}</span>
        {hasHistory && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && hasHistory && (
          <motion.div
            ref={dropdownRef}
            id="status-dropdown-panel"
            role="region"
            aria-label="Status history"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px] sm:min-w-[240px]"
          >
            <div className="p-3 space-y-2">
              {displayHistory.map((event, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  {/* Bullet point */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  </div>

                  {/* Status and timestamp */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 font-medium">
                      {event.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {event.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile-optimized variant that expands to card width
export function StatusBadgeDropdownMobile({
  status,
  statusHistory = [],
  className = "",
}: StatusBadgeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "Pending":
      case "Open":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Reopened":
      case "Urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    } else if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  };

  const displayHistory = statusHistory.slice(-5);
  const hasHistory = statusHistory.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Status Badge as Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label="Toggle status history"
        aria-expanded={isOpen}
        aria-controls="status-dropdown-panel-mobile"
        disabled={!hasHistory}
        className={`
          inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs
          ${getStatusColor(status)}
          ${
            hasHistory
              ? "cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
              : "cursor-default"
          }
        `}
      >
        <span>{status}</span>
        {hasHistory && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
        )}
      </button>

      {/* Dropdown Panel - Full width on mobile */}
      <AnimatePresence>
        {isOpen && hasHistory && (
          <motion.div
            ref={dropdownRef}
            id="status-dropdown-panel-mobile"
            role="region"
            aria-label="Status history"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-3 space-y-2">
              {displayHistory.map((event, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 font-medium">
                      {event.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {event.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
