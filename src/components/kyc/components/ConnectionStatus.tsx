/**
 * Connection Status Component
 * Displays online/offline status and handles connection issues
 * Requirements: 7.4, 7.5
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

export interface ConnectionStatusProps {
  onConnectionChange?: (isOnline: boolean) => void;
  showWhenOnline?: boolean;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  onConnectionChange,
  showWhenOnline = false,
  className = "",
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onConnectionChange?.(true);

      // Show "back online" message briefly
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      onConnectionChange?.(false);
      setShowStatus(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Show status initially if offline or if showWhenOnline is true
    if (!isOnline || showWhenOnline) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onConnectionChange, showWhenOnline, isOnline]);

  if (!showStatus && isOnline && !showWhenOnline) {
    return null;
  }

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
        >
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg ${
              isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? "Back online" : "No internet connection"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for using connection status in components
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};

// Offline indicator component for forms
export const OfflineIndicator: React.FC<{
  message?: string;
  className?: string;
}> = ({
  message = "You're currently offline. Your progress is being saved locally.",
  className = "",
}) => {
  const isOnline = useConnectionStatus();

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}
    >
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        <p className="text-sm text-yellow-800">{message}</p>
      </div>
    </motion.div>
  );
};

export default ConnectionStatus;
