"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardTitle } from "@/components/ui/card";
import { Plus, Send, MessageSquare, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  safeFormatTime,
  getChatDateLabel,
  getDateKey,
} from "@/utils/date-utils";

/**
 * Normalize phone to backend format (234XXXXXXXXXX, digits only).
 * The simulator uses this as the key for messages and socket matching,
 * so it must match what the backend produces.
 */
function toBackendPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("234")) return cleaned;
  if (cleaned.startsWith("0")) return "234" + cleaned.slice(1);
  if (/^[7-9]\d{9}$/.test(cleaned)) return "234" + cleaned;
  return "234" + cleaned;
}

interface Message {
  id: string;
  from: string;
  to?: string;
  text?: { body: string };
  type: string;
  interactive?: {
    type?: string;
    header?: { text?: string };
    body?: { text?: string };
    footer?: { text?: string };
    action?: {
      buttons?: Array<{
        type: string;
        reply: { id: string; title: string };
      }>;
      sections?: Array<{
        rows?: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
  template?: {
    name?: string;
    components?: Array<{
      type: string;
      format?: string;
      text?: string;
      buttons?: Array<{
        type: string;
        reply?: { id: string; title: string };
        text?: string;
        url?: string;
        phone_number?: string;
      }>;
    }>;
  };
  timestamp: Date;
  direction: "inbound" | "outbound";
}

export default function WhatsappSimulator() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [testUsers, setTestUsers] = useState<string[]>([]);
  const [existingUsers, setExistingUsers] = useState<
    { id: string; name: string; phone: string; properties?: string[] }[]
  >([]);
  const [kycApplicants, setKycApplicants] = useState<
    { id: string; name: string; phone: string; properties?: string[] }[]
  >([]);
  const [landlords, setLandlords] = useState<
    { id: string; name: string; phone: string; properties?: string[] }[]
  >([]);
  const [facilityManagers, setFacilityManagers] = useState<
    { id: string; name: string; phone: string; properties?: string[] }[]
  >([]);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [tempMessages, setTempMessages] = useState<Record<string, Message[]>>(
    {},
  ); // Separate state for temporary messages
  const [inputText, setInputText] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [isSimulatorLoading, setIsSimulatorLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fetchedHistoryRef = useRef<Set<string>>(new Set()); // Track users we've fetched history for

  // Helper function to get all messages for a user (permanent + temporary)
  const getAllMessages = (userPhone: string): Message[] => {
    const permanent = messages[userPhone] || [];
    const temporary = tempMessages[userPhone] || [];
    return [...permanent, ...temporary].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  };

  // Helper function to add messages - defined early to avoid hoisting issues
  const addMessage = useCallback(
    (userPhone: string, message: Message) => {
      if (message.direction === "inbound" && message.id.startsWith("local_")) {
        // Add user messages with temporary IDs to tempMessages
        console.log(
          `[DEBUG] 🟡 Adding TEMP message:`,
          JSON.stringify(message, null, 2),
        );
        setTempMessages((prev) => ({
          ...prev,
          [userPhone]: [...(prev[userPhone] || []), message],
        }));
      } else {
        // Add bot messages and permanent messages to messages
        // Check for duplicates BEFORE updating state
        const existingMessages = messages[userPhone] || [];

        const isDuplicate = existingMessages.some(
          (existingMsg) =>
            existingMsg.text?.body === message.text?.body &&
            existingMsg.direction === message.direction &&
            Math.abs(
              new Date(existingMsg.timestamp).getTime() -
                new Date(message.timestamp).getTime(),
            ) < 5000, // 5-second window
        );

        if (isDuplicate) {
          console.log(
            "🚫 DUPLICATE SKIPPED: A similar message already exists.",
            message,
          );
          return; // Don't add the message
        }

        console.log(
          `[DEBUG] 🟢 Adding PERMANENT message:`,
          JSON.stringify(message, null, 2),
        );

        setMessages((prev) => ({
          ...prev,
          [userPhone]: [...(prev[userPhone] || []), message],
        }));

        // Auto-add new phone numbers to test users when they receive outbound messages
        if (message.direction === "outbound") {
          // Check if this phone number is already known
          const isKnownUser =
            testUsers.includes(userPhone) ||
            existingUsers.some((u) => u.phone === userPhone) ||
            landlords.some((u) => u.phone === userPhone) ||
            facilityManagers.some((u) => u.phone === userPhone) ||
            kycApplicants.some((u) => u.phone === userPhone);

          if (!isKnownUser) {
            console.log(`🆕 Auto-adding new number ${userPhone} to test users`);
            setTestUsers((prev) => [...prev, userPhone]);
            // Auto-select the new user so they can see the message immediately
            setCurrentUser(userPhone);
          }
        }
      }
    },
    [
      existingUsers,
      facilityManagers,
      landlords,
      kycApplicants,
      messages,
      testUsers,
      setMessages,
      setTempMessages,
      setTestUsers,
      setCurrentUser,
    ],
  );

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current URL for redirect after signin
      sessionStorage.setItem("returnUrl", window.location.href);
      router.push("/signin");
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // Use a ref to store the latest addMessage function to avoid socket reconnection
  const addMessageRef = useRef(addMessage);
  useEffect(() => {
    addMessageRef.current = addMessage;
  }, [addMessage]);

  useEffect(() => {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3150";
    const normalizedUrl = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const newSocket = io(`${normalizedUrl}/simulator`);

    newSocket.on("connect", () => {
      console.log("Connected to simulator socket");
      toast.success("Connected to whatsapp simulator");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from simulator socket");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Failed to connect to simulator");
    });

    newSocket.on(
      "message",
      (payload: {
        to?: string;
        recipient_id?: string;
        type?: string;
        text?: { body: string };
        interactive?: Message["interactive"];
        template?: Message["template"];
      }) => {
        console.log("🔥 Received outbound message:", payload);
        console.log("🔍 Payload keys:", Object.keys(payload));
        console.log("🎯 To field:", payload.to);
        console.log("🎯 Recipient ID field:", payload.recipient_id);

        // Normalize to backend format (234...) to match currentUser keys
        const to = toBackendPhone(payload.to || payload.recipient_id || "");
        console.log("📱 Final recipient:", to);

        if (to) {
          console.log("✅ Adding message to UI for:", to);
          setIsBotTyping(false); // Hide typing indicator when bot responds
          // Use ref to get the latest addMessage function without causing reconnection
          addMessageRef.current(to, {
            id: `msg_${Date.now()}`,
            from: "bot",
            to: to,
            type: payload.type || "text",
            text: payload.text,
            interactive: payload.interactive,
            template: payload.template,
            timestamp: new Date(),
            direction: "outbound",
          });
        } else {
          console.log("❌ No recipient found in payload");
        }
      },
    );

    return () => {
      newSocket.disconnect();
    };
  }, []); // Empty dependency array - socket should only connect once

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.id) {
        console.log("❌ No user ID available for fetching users");
        return;
      }
      setIsFetchingUsers(true);
      console.log("🔍 Fetching users for landlord:", {
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
      });

      try {
        // Fetch users associated with the current landlord
        const response = await fetch(
          `/api/proxy/whatsapp/simulator/landlord-users/${user.id}`,
        );

        console.log("📡 API Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ API Error:", errorText);
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();
        console.log("📦 API Response:", {
          status: data.status,
          userCount: data.users?.length || 0,
          tenantCount:
            data.users?.filter(
              (u: { userType?: string }) => u.userType === "tenant",
            ).length || 0,
          facilityManagerCount:
            data.users?.filter(
              (u: { userType?: string }) => u.userType === "facility_manager",
            ).length || 0,
        });

        if (data.status === "success") {
          // Separate users by type based on backend roles
          const users: {
            id: string;
            name: string;
            phone: string;
            properties?: string[];
            userType?: string;
          }[] = data.users || [];

          const regularUsers = users.filter(
            (u) => !u.userType || u.userType === "tenant",
          );
          const landlordUsers = users.filter((u) => u.userType === "landlord");
          const facilityManagerUsers = users.filter(
            (u) => u.userType === "facility_manager",
          );
          const kycApplicantUsers = users.filter(
            (u) => u.userType === "kyc_applicant",
          );

          console.log("👥 Users categorized:", {
            tenants: regularUsers.length,
            landlords: landlordUsers.length,
            facilityManagers: facilityManagerUsers.length,
            kycApplicants: kycApplicantUsers.length,
          });

          // Debug: Log landlord data to see what we're getting
          if (landlordUsers.length > 0) {
            console.log("🏠 Landlord data received:", {
              count: landlordUsers.length,
              landlords: landlordUsers.map((l) => ({
                id: l.id,
                name: l.name,
                phone: l.phone,
                userType: l.userType,
              })),
            });
          }

          setExistingUsers(regularUsers);
          setLandlords(landlordUsers);
          setFacilityManagers(facilityManagerUsers);
          setKycApplicants(kycApplicantUsers);

          // Debug: Log the counts
          console.log("✅ Users loaded successfully:", {
            landlordId: user.id,
            tenants: regularUsers.length,
            landlords: landlordUsers.length,
            facilityManagers: facilityManagerUsers.length,
            kycApplicants: kycApplicantUsers.length,
          });
        } else {
          console.error("❌ API returned error status:", data);
        }
      } catch (error) {
        console.error("💥 Failed to fetch users", error);
        toast.error("Failed to load users for your properties");
      } finally {
        setIsFetchingUsers(false);
      }
    };

    if (user?.id) {
      fetchUsers();
    }
  }, [user?.id, user?.email, user?.role]);

  // Fetch chat history when user switches
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!currentUser) return;

      // Skip if we already fetched history for this user
      if (fetchedHistoryRef.current.has(currentUser)) {
        console.log(`📚 SKIP: Already fetched history for ${currentUser}`);
        return;
      }

      try {
        console.log(`🔍 Fetching simulated chat history for ${currentUser}`);
        console.log(`📱 Current user phone format: ${currentUser}`);

        // The backend normalizes phone numbers, so we pass it as-is
        // The backend will handle normalization consistently
        const response = await fetch(
          `/api/proxy/chat-history/${encodeURIComponent(
            currentUser,
          )}?simulatedOnly=true`,
        );

        if (!response.ok) {
          console.warn(
            `No chat history found for ${currentUser} (status: ${response.status})`,
          );
          // For landlords, this is expected if they haven't sent any messages yet
          const userType = landlords.some((l) => l.phone === currentUser)
            ? "landlord"
            : facilityManagers.some((f) => f.phone === currentUser)
              ? "facility_manager"
              : existingUsers.some((u) => u.phone === currentUser)
                ? "tenant"
                : "test";
          console.log(
            `ℹ️ User type: ${userType} - Empty chat is normal for new conversations`,
          );

          // Mark as fetched even if empty to avoid repeated requests
          fetchedHistoryRef.current.add(currentUser);
          return;
        }

        const data = await response.json();
        console.log(`📚 Loading chat history for ${currentUser}...`);

        if (data.messages && data.messages.length > 0) {
          // Convert backend messages to frontend format
          const historicalMessages: Message[] = data.messages.map(
            (msg: {
              id: string;
              direction: "INBOUND" | "OUTBOUND"; // Backend uses uppercase
              message_type?: string;
              content: string;
              created_at: string;
              metadata?: Record<string, unknown>;
            }) => {
              // Safely parse the timestamp, fallback to current time if invalid
              let timestamp = new Date();
              if (msg.created_at) {
                const parsedDate = new Date(msg.created_at);
                if (!isNaN(parsedDate.getTime())) {
                  timestamp = parsedDate;
                }
              }

              const messageType = msg.message_type || "text";

              // Extract template data from metadata if it's a template message
              const metadata = msg.metadata as
                | {
                    template?: Message["template"];
                    interactive?: Message["interactive"];
                    type?: string;
                  }
                | undefined;

              const isTemplate =
                messageType === "template" && metadata?.template;
              const isInteractive =
                messageType === "interactive" && metadata?.interactive;

              return {
                id: msg.id,
                from: msg.direction === "INBOUND" ? currentUser : "bot",
                type: messageType,
                text:
                  isTemplate || isInteractive
                    ? undefined
                    : { body: msg.content || "" },
                template: isTemplate ? metadata.template : undefined,
                interactive: isInteractive ? metadata.interactive : undefined,
                timestamp,
                direction: (msg.direction === "INBOUND"
                  ? "inbound"
                  : "outbound") as "inbound" | "outbound",
              };
            },
          );

          // Set the historical messages (replace any existing messages for this user)
          setMessages((prev) => ({
            ...prev,
            [currentUser]: historicalMessages,
          }));

          // Clear temporary messages for this user since we now have the real history
          const tempCount = tempMessages[currentUser]?.length || 0;
          if (tempCount > 0) {
            console.log(
              `🔄 DUPLICATE PREVENTION: Clearing ${tempCount} temporary messages for ${currentUser} (replaced by ${historicalMessages.length} historical messages)`,
            );
          }

          setTempMessages((prev) => {
            const newTemp = { ...prev };
            delete newTemp[currentUser];
            return newTemp;
          });

          console.log(
            `✅ HISTORY LOADED: ${historicalMessages.length} messages loaded for ${currentUser}, ${tempCount} temporary messages cleared`,
          );

          // Mark this user as having fetched history
          fetchedHistoryRef.current.add(currentUser);
        }
      } catch (error) {
        console.error(
          `Failed to fetch chat history for ${currentUser}:`,
          error,
        );
        // Don't show error to user - just log it
      }
    };

    fetchChatHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Only depend on currentUser to avoid infinite loops

  // Auto-scroll to bottom instantly when messages change or user switches
  useEffect(() => {
    if (chatScrollRef.current && currentUser) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, tempMessages, currentUser, isBotTyping]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-200 border-t-orange-500 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleAddUser = () => {
    const raw = newUserPhone.trim();
    if (!raw) {
      toast.error("Please enter a phone number");
      return;
    }
    const phone = toBackendPhone(raw);
    if (
      testUsers.includes(phone) ||
      existingUsers.some((u) => u.phone === phone) ||
      landlords.some((u) => u.phone === phone) ||
      facilityManagers.some((u) => u.phone === phone) ||
      kycApplicants.some((u) => u.phone === phone)
    ) {
      toast.error("User already exists");
      return;
    }

    // Always add as test user
    setTestUsers((prev) => [...prev, phone]);
    setCurrentUser(phone);
    setNewUserPhone("");
    toast.success(`Test user ${phone} added`);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser || isSimulatorLoading) return;

    const messageText = inputText.trim();
    const tempId = `local_${Date.now()}`;

    console.log(
      `📤 SENDING NEW MESSAGE: "${messageText}" - will be stored as temporary with ID ${tempId}`,
    );

    // Clear input and set loading state immediately to prevent double submissions
    setInputText("");
    setIsSimulatorLoading(true);
    setIsBotTyping(true);

    // Immediately add message to UI for instant feedback
    addMessage(currentUser, {
      id: tempId,
      from: currentUser,
      type: "text",
      text: { body: messageText },
      timestamp: new Date(),
      direction: "inbound",
    });
    setIsBotTyping(true);

    try {
      // Send to the same webhook endpoint that WhatsApp Cloud API uses
      const webhookPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "simulator_entry",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: "15550000000",
                    phone_number_id: "simulator_phone_id",
                  },
                  messages: [
                    {
                      from: currentUser,
                      id: `sim_msg_${Date.now()}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: "text",
                      text: {
                        body: messageText,
                      },
                      is_simulated: true,
                    },
                  ],
                },
                field: "messages",
              },
            ],
          },
        ],
      };

      const response = await fetch("/api/proxy/whatsapp/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) throw new Error("Failed to send");

      // Message already added to UI, just show success
      //   toast.success("Message sent");
    } catch (error) {
      // Remove the optimistic message on error from tempMessages (not messages)
      setTempMessages((prev) => ({
        ...prev,
        [currentUser]:
          prev[currentUser]?.filter((msg) => msg.id !== tempId) || [],
      }));

      toast.error("Failed to send message");
      console.error(error);

      // Restore the input text on error
      setInputText(messageText);
    } finally {
      setIsSimulatorLoading(false);
      setIsBotTyping(false);
    }
  };

  const handleInteractiveClick = async (
    type: string,
    id: string,
    title: string,
  ) => {
    if (buttonLoading) return;

    const buttonKey = `${type}_${id}`;
    setButtonLoading(buttonKey);
    setIsBotTyping(true);

    // Immediately add the user's response to UI
    const tempId = `local_int_${Date.now()}`;
    addMessage(currentUser, {
      id: tempId,
      from: currentUser,
      type: "text",
      text: { body: `Replied: ${title}` },
      timestamp: new Date(),
      direction: "inbound",
    });

    try {
      // Send to the same webhook endpoint that WhatsApp Cloud API uses
      const webhookPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "simulator_entry",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: "15550000000",
                    phone_number_id: "simulator_phone_id",
                  },
                  messages: [
                    {
                      from: currentUser,
                      id: `sim_msg_${Date.now()}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: "interactive",
                      interactive: {
                        type: type === "button" ? "button_reply" : "list_reply",
                        [type === "button" ? "button_reply" : "list_reply"]: {
                          id,
                          title,
                        },
                      },
                      is_simulated: true,
                    },
                  ],
                },
                field: "messages",
              },
            ],
          },
        ],
      };

      const response = await fetch("/api/proxy/whatsapp/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) throw new Error("Failed to send interactive response");

      toast.success("Response sent");
    } catch (error) {
      // Remove the optimistic message on error
      setMessages((prev) => ({
        ...prev,
        [currentUser]:
          prev[currentUser]?.filter((msg) => msg.id !== tempId) || [],
      }));

      toast.error("Failed to send interaction");
      console.error(error);
    } finally {
      setButtonLoading(null);
      setIsBotTyping(false);
    }
  };

  const getUserName = (phone: string) => {
    const existing = existingUsers.find((u) => u.phone === phone);
    const landlord = landlords.find((u) => u.phone === phone);
    const facilityManager = facilityManagers.find((u) => u.phone === phone);
    const kycApplicant = kycApplicants.find((u) => u.phone === phone);

    if (existing) return existing.name;
    if (landlord) return landlord.name;
    if (facilityManager) return facilityManager.name;
    if (kycApplicant) return kycApplicant.name;
    return phone;
  };

  const getLastMessage = (phone: string): Message | null => {
    const msgs = getAllMessages(phone);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  const getSnippet = (msg: Message | null, phone: string): string => {
    // Show the last message content if available
    if (msg?.text?.body) {
      return msg.text.body.length > 50
        ? `${msg.text.body.substring(0, 50)}...`
        : msg.text.body;
    }

    // Fallback to showing properties for users without recent messages
    const user =
      existingUsers.find((u) => u.phone === phone) ||
      landlords.find((u) => u.phone === phone) ||
      facilityManagers.find((u) => u.phone === phone) ||
      kycApplicants.find((u) => u.phone === phone);
    if (user?.properties && user.properties.length > 0) {
      return user.properties.length === 1
        ? user.properties[0]
        : `${user.properties[0]} +${user.properties.length - 1} more`;
    }
    return "No recent messages";
  };

  const getTime = (msg: Message | null): string => {
    if (!msg) return "";
    const date = new Date(msg.timestamp);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return safeFormatTime(msg.timestamp);
    }
    return date.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  // WhatsApp-style typing indicator component
  const TypingIndicator = () => (
    <div className="flex justify-start">
      <div className="max-w-[70%] px-4 py-2.5 rounded-2xl bg-white rounded-bl-md shadow-sm">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessageContent = (msg: Message) => {
    // Debug logging to see message structure
    if (msg.direction === "outbound") {
      const templateName = (msg.template as { name?: string })?.name;
      console.log("🔍 Rendering outbound message:", {
        type: msg.type,
        hasText: !!msg.text,
        textBody: msg.text?.body,
        hasInteractive: !!msg.interactive,
        hasTemplate: !!msg.template,
        templateName,
        fullMessage: msg,
      });
    }

    if (msg.text?.body) {
      return (
        <p className="wrap-break-word whitespace-pre-line">{msg.text.body}</p>
      );
    }

    // Handle empty text messages
    if (msg.type === "text") {
      return <p className="italic text-sm opacity-70">[ empty message ]</p>;
    }

    if (
      msg.type === "interactive" &&
      msg.interactive &&
      msg.direction === "outbound"
    ) {
      const int = msg.interactive;
      const buttons: { id: string; title: string; description?: string }[] = [];
      let isList = false;

      if (int.type === "list_message" || int.action?.sections) {
        isList = true;
        int.action?.sections?.forEach(
          (section: {
            rows?: Array<{ id: string; title: string; description?: string }>;
          }) => {
            section.rows?.forEach(
              (row: { id: string; title: string; description?: string }) => {
                buttons.push({
                  id: row.id,
                  title: row.title,
                  description: row.description,
                });
              },
            );
          },
        );
      } else if (int.action?.buttons) {
        int.action.buttons.forEach(
          (btn: { type: string; reply?: { id: string; title: string } }) => {
            if (btn.type === "reply" && btn.reply) {
              buttons.push({ id: btn.reply.id, title: btn.reply.title });
            }
          },
        );
      }

      return (
        <div>
          {int.header?.text && (
            <p className="font-bold mb-1">{int.header.text}</p>
          )}
          {int.body?.text && (
            <p className="mb-3 whitespace-pre-line">{int.body.text}</p>
          )}
          <div className="flex flex-col gap-2">
            {buttons.map((btn) => (
              <Button
                key={btn.id}
                variant={isList ? "outline" : "secondary"}
                size="sm"
                className="w-full justify-start text-left"
                disabled={buttonLoading !== null}
                onClick={() =>
                  handleInteractiveClick(
                    isList ? "list" : "button",
                    btn.id,
                    btn.title,
                  )
                }
              >
                {buttonLoading === `${isList ? "list" : "button"}_${btn.id}` ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-medium">{btn.title}</span>
                    {btn.description && (
                      <p className="text-xs opacity-70">{btn.description}</p>
                    )}
                  </div>
                )}
              </Button>
            ))}
          </div>
          {int.footer?.text && (
            <p className="text-xs mt-3 opacity-70">{int.footer.text}</p>
          )}
        </div>
      );
    }

    if (
      msg.type === "template" &&
      msg.template &&
      msg.direction === "outbound"
    ) {
      const template = msg.template;
      const templateName = template.name || "Unknown Template";
      const comps = template.components || [];

      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="font-semibold text-blue-700 mb-2">
            📨{" "}
            {templateName
              .replace(/_/g, " ")
              .replace(/\b\w/g, (letter: string) => letter.toUpperCase())}
          </div>

          {comps.map(
            (
              comp: {
                type: string;
                format?: string;
                text?: string;
                parameters?: Array<{
                  type: string;
                  text?: string;
                  payload?: string;
                }>;
                buttons?: Array<{
                  type: string;
                  reply?: { id: string; title: string };
                  text?: string;
                  url?: string;
                  phone_number?: string;
                }>;
              },
              i: number,
            ) => (
              <div key={i} className="mb-3 last:mb-0">
                {/* Handle HEADER/header components */}
                {(comp.type === "HEADER" || comp.type === "header") && (
                  <div>
                    {comp.format === "TEXT" || comp.text ? (
                      <p className="font-bold text-lg">{comp.text}</p>
                    ) : (
                      <p className="italic opacity-70">
                        [ {comp.format || "Header"} ]
                      </p>
                    )}
                  </div>
                )}

                {/* Handle BODY/body components */}
                {(comp.type === "BODY" || comp.type === "body") && (
                  <div>
                    {comp.text ? (
                      <p className="whitespace-pre-line">{comp.text}</p>
                    ) : comp.parameters ? (
                      <div>
                        {/* Render template based on name and parameters */}
                        {templateName === "landlord_main_menu" && (
                          <p>
                            Hello{" "}
                            {comp.parameters.find(
                              (p: { type: string; text?: string }) =>
                                p.type === "text",
                            )?.text || "there"}
                            , What do you want to do today?
                          </p>
                        )}
                        {templateName === "welcome_tenant" && (
                          <div>
                            <p>Hi {comp.parameters[0]?.text || "Tenant"},</p>
                            <p className="mt-2">
                              {comp.parameters[1]?.text || "Your landlord"} has
                              added you as a tenant for{" "}
                              {comp.parameters[2]?.text || "your property"} on
                              Lizt.
                            </p>
                            <p className="mt-2">
                              Please confirm your tenancy details to continue
                              setup.
                            </p>
                          </div>
                        )}
                        {templateName === "kyc_submission_confirmation" && (
                          <p>
                            Hello {comp.parameters[0]?.text || "there"}, Your
                            KYC form has been submitted. Your landlord is
                            reviewing your details, and we&apos;ll keep you
                            updated.
                          </p>
                        )}
                        {templateName === "tenant_application_notification" && (
                          <div>
                            <p>
                              A KYC application was submitted by{" "}
                              {comp.parameters[1]?.text || "a tenant"} for the
                              property{" "}
                              {comp.parameters[2]?.text || "your property"},
                              assigned to{" "}
                              {comp.parameters[0]?.text || "Landlord"}.
                            </p>
                            <p className="mt-2">
                              Use the link below to view the application.
                            </p>
                          </div>
                        )}
                        {templateName === "kyc_completion_link" && (
                          <div>
                            <p>Hello {comp.parameters[0]?.text || "Tenant"},</p>
                            <p className="mt-2">
                              {comp.parameters[1]?.text || "Landlord"} has added
                              you as a tenant for{" "}
                              {comp.parameters[2]?.text || "a property"} using
                              Lizt by Property Kraft — a tenancy management app
                              designed to make your rental experience simple and
                              stress-free.
                            </p>
                            <p className="mt-2">
                              With Lizt, you can receive important updates,
                              track rent, and manage everything about your
                              tenancy in one place.
                            </p>
                            <p className="mt-2">
                              Please {comp.parameters[3]?.text || "complete"}{" "}
                              your KYC information using the link below to get
                              started:
                            </p>
                          </div>
                        )}
                        {templateName === "kyc_completion_notification" && (
                          <div>
                            <p>
                              Hello {comp.parameters[0]?.text || "Landlord"},{" "}
                              {comp.parameters[1]?.text || "Tenant"} has
                              completed their KYC information for{" "}
                              {comp.parameters[2]?.text || "a property"}.
                            </p>
                            <p className="mt-2">
                              You can now view their full tenant details.
                            </p>
                          </div>
                        )}
                        {templateName ===
                          "landlord_service_request_notification" && (
                          <div>
                            <p className="font-medium">
                              Service Request Notification
                            </p>
                            <p className="mt-2">
                              A new service request has been created.
                            </p>
                            <p className="mt-1">
                              Issue: {comp.parameters[2]?.text || "N/A"}
                            </p>
                            <p>Tenant: {comp.parameters[0]?.text || "N/A"}</p>
                            <p>Property: {comp.parameters[1]?.text || "N/A"}</p>
                            <p>
                              Reported: {comp.parameters[3]?.text || "N/A"} on
                              record.
                            </p>
                          </div>
                        )}
                        {templateName === "fm_service_request_notification" && (
                          <div>
                            <p>A new service request has been created.</p>
                            <p className="mt-1">
                              Issue: {comp.parameters[2]?.text || "N/A"}
                            </p>
                            <p>Tenant: {comp.parameters[0]?.text || "N/A"}</p>
                            <p>Phone: {comp.parameters[4]?.text || "N/A"}</p>
                            <p>Property: {comp.parameters[1]?.text || "N/A"}</p>
                            <p>
                              Reported: {comp.parameters[3]?.text || "N/A"} on
                              record.
                            </p>
                          </div>
                        )}
                        {templateName === "agent_kyc_notification" && (
                          <div className="space-y-2">
                            <p>
                              Hi{" "}
                              <strong>
                                {comp.parameters[0]?.text || "Agent"}
                              </strong>
                              ,
                            </p>
                            <p>
                              <strong>
                                {comp.parameters[1]?.text || "Tenant"}
                              </strong>{" "}
                              has listed you as their agent and has just
                              completed their KYC form for{" "}
                              <strong>
                                {comp.parameters[2]?.text || "a property"}
                              </strong>
                            </p>
                            <p>Thank you</p>
                          </div>
                        )}
                        {templateName === "kyc_otp_verification" && (
                          <div>
                            <p className="font-medium">
                              <span className="font-bold text-lg">
                                {comp.parameters[0]?.text || "------"}
                              </span>{" "}
                              is your verification code. For your security, do
                              not share this code.
                            </p>
                            <p className="text-sm mt-1">
                              Expires in 10 minutes.
                            </p>
                          </div>
                        )}
                        {templateName === "offer_letter_notification" && (
                          <div>
                            <p>
                              Hello {comp.parameters[0]?.text || "Tenant"}, you
                              have received an offer letter for{" "}
                              {comp.parameters[1]?.text || "a property"}.
                            </p>
                            <p className="mt-2">Please review and respond.</p>
                          </div>
                        )}
                        {templateName === "payment_invoice_link" && (
                          <div>
                            <p>
                              Hi {comp.parameters[0]?.text || "Tenant"}, your
                              offer for{" "}
                              {comp.parameters[1]?.text || "a property"} has
                              been accepted successfully.
                            </p>
                            <p className="mt-2">
                              An invoice has been prepared for you. Please
                              complete your payment to secure the property and
                              proceed with your tenancy.
                            </p>
                          </div>
                        )}
                        {templateName === "tenant_payment_success" && (
                          <div>
                            <p>Hi {comp.parameters[0]?.text || "Tenant"},</p>
                            <p className="mt-2">
                              Congratulations! Your payment of{" "}
                              {comp.parameters[1]?.text || "₦0"} for{" "}
                              {comp.parameters[2]?.text || "a property"} has
                              been confirmed.
                            </p>
                            <p className="mt-2">
                              You can view your receipt below:
                            </p>
                            <p className="mt-2">
                              Your landlord,{" "}
                              {comp.parameters[3]?.text || "Your Landlord"},
                              uses Lizt by Property Kraft — a simple app
                              designed to make your rental experience smooth and
                              stress-free.
                            </p>
                            <p className="mt-2">
                              With Lizt, you can receive important updates,
                              track rent, report issues easily, and stay
                              connected throughout your tenancy — all in one
                              place.
                            </p>
                            <p className="mt-2">Reply Hi to get started.</p>
                            <p className="mt-2">— The Lizt Team</p>
                          </div>
                        )}
                        {templateName === "main_menu" && (
                          <div className="whitespace-pre-line">
                            <p>Hi {comp.parameters[0]?.text || "there"},</p>
                            <p className="mt-2">
                              Your landlord Panda Homes is now managing your
                              apartment with Lizt by Property Kraft — a platform
                              designed to make renting smooth and stress-free.
                            </p>
                            <p className="mt-2">With Lizt, you can:</p>
                            <ul className="list-disc ml-4 mt-1 space-y-0.5">
                              <li>Get timely rent reminders</li>
                              <li>View tenancy details</li>
                              <li>Request maintenance</li>
                              <li>Access important documents</li>
                              <li>Reach support anytime</li>
                            </ul>
                            <p className="mt-2">
                              More features coming soon: flexible rent payments,
                              loans, and access to a vetted artisan network.
                            </p>
                            <p className="mt-2">
                              Reply &quot;Hi&quot; to get started.
                            </p>
                            <p className="mt-2">— The Lizt team</p>
                          </div>
                        )}
                        {templateName === "agent_welcome" && (
                          <div>
                            <p>
                              Hi, thanks for connecting with Property Kraft!
                            </p>
                            <p className="mt-2">
                              You&apos;re now plugged in to receive the latest
                              property updates, sweet deals, and housing
                              opportunities directly on WhatsApp. ✨
                            </p>
                            <p className="mt-2">
                              In the meantime, you can also visit our website
                              here: https://propertykraft.africa 🌍
                            </p>
                            <p className="mt-2">
                              Stay ahead with Property Kraft! 🚀
                            </p>
                          </div>
                        )}
                        {templateName === "facility_manager" && (
                          <div>
                            <p>Hello {comp.parameters[0]?.text || "there"},</p>
                            <p className="mt-2">
                              You have been added to the{" "}
                              {comp.parameters[1]?.text || "N/A"} team as a{" "}
                              {comp.parameters[2]?.text || "N/A"}.
                            </p>
                            <p>Welcome aboard!</p>
                          </div>
                        )}
                        {templateName === "properties_created" && (
                          <div>
                            <p>Hello {comp.parameters[0]?.text || "there"}</p>
                            <p className="mt-2">
                              A new property with name{" "}
                              {comp.parameters[1]?.text || "N/A"} was created.
                            </p>
                            <p className="mt-2">
                              Thank you.
                              <br />
                              -The Lizt Team
                            </p>
                          </div>
                        )}
                        {templateName === "user_added" && (
                          <div>
                            <p>Hello {comp.parameters[0]?.text || "there"}</p>
                            <p className="mt-2">
                              {comp.parameters[1]?.text || "A user"} was added
                              to your {comp.parameters[2]?.text || "N/A"}{" "}
                              property.
                            </p>
                            <p className="mt-2">
                              Thank you.
                              <br />- The Lizt Team
                            </p>
                          </div>
                        )}
                        {templateName === "service_request_confirmation" && (
                          <div>
                            <p>Hi {comp.parameters[0]?.text || "Tenant"} 👋🏽</p>
                            <p className="mt-2">
                              Your service request about &quot;
                              {comp.parameters[1]?.text || "N/A"}&quot; has been
                              marked as resolved.
                            </p>
                            <p className="mt-2">
                              Can you confirm if everything is fixed?
                            </p>
                          </div>
                        )}
                        {templateName === "offer_letter_otp" && (
                          <div>
                            <p className="font-medium">
                              <span className="font-bold text-lg">
                                {comp.parameters[0]?.text || "------"}
                              </span>{" "}
                              is your verification code.
                            </p>
                            <p className="text-sm mt-1">
                              Expires in 10 minutes.
                            </p>
                          </div>
                        )}
                        {templateName ===
                          "offer_letter_status_notification" && (
                          <div>
                            <p>
                              Hi {comp.parameters[0]?.text || "Landlord"},{" "}
                              {comp.parameters[1]?.text || "Tenant"} has{" "}
                              {comp.parameters[3]?.text || "responded to"} your
                              offer letter for{" "}
                              {comp.parameters[2]?.text || "a property"}.
                            </p>
                            <p className="mt-2">
                              Log in to your dashboard to view details and take
                              next steps.
                            </p>
                          </div>
                        )}
                        {templateName === "landlord_partial_payment" && (
                          <div>
                            <p>
                              Hello {comp.parameters[0]?.text || "Landlord"},{" "}
                              {comp.parameters[1]?.text || "Tenant"} has made a
                              payment of {comp.parameters[2]?.text || "₦0"} for{" "}
                              {comp.parameters[3]?.text || "a property"}.
                            </p>
                            <p className="mt-2">
                              Outstanding balance:{" "}
                              {comp.parameters[4]?.text || "₦0"}. View details
                              in your dashboard.
                            </p>
                          </div>
                        )}
                        {templateName === "ll_payment_complete" && (
                          <div>
                            <p>
                              Hello {comp.parameters[0]?.text || "Landlord"},{" "}
                              {comp.parameters[1]?.text || "Tenant"} has
                              completed their full payment of{" "}
                              {comp.parameters[2]?.text || "₦0"} for{" "}
                              {comp.parameters[3]?.text || "a property"}.
                            </p>
                            <p className="mt-2">Thank you</p>
                          </div>
                        )}
                        {templateName === "ll_payment_race" && (
                          <div>
                            <p>
                              Hello {comp.parameters[0]?.text || "Landlord"},{" "}
                              {comp.parameters[1]?.text || "Tenant"} completed
                              payment of {comp.parameters[2]?.text || "₦0"} for{" "}
                              {comp.parameters[3]?.text || "a property"}, but
                              the property was already secured by another
                              tenant.
                            </p>
                            <p className="mt-2">
                              The payment is being held. Please process a refund
                              through your dashboard.
                            </p>
                          </div>
                        )}
                        {templateName === "tenant_payment_race" && (
                          <div>
                            <p>
                              Hello {comp.parameters[0]?.text || "Tenant"}, your
                              payment of {comp.parameters[1]?.text || "₦0"} for{" "}
                              {comp.parameters[2]?.text || "a property"} was
                              received, but the property was secured by another
                              applicant.
                            </p>
                            <p className="mt-2">
                              Your payment is being held and the landlord will
                              process your refund shortly.
                            </p>
                            <p className="mt-1">
                              We apologize for this situation.
                            </p>
                          </div>
                        )}
                        {templateName === "invoice_reminder" && (
                          <div>
                            <p>
                              Hi {comp.parameters[0]?.text || "Tenant"}, this is
                              a reminder from{" "}
                              {comp.parameters[1]?.text || "your landlord"}{" "}
                              regarding invoice{" "}
                              {comp.parameters[2]?.text || "N/A"}.
                            </p>
                            <p className="mt-1">
                              Outstanding balance:{" "}
                              {comp.parameters[3]?.text || "₦0"} for{" "}
                              {comp.parameters[4]?.text || "a property"}.
                            </p>
                          </div>
                        )}
                        {templateName === "renewal_link" && (
                          <div>
                            <p>
                              Hi {comp.parameters[0]?.text || "Tenant"}, your
                              landlord has initiated a tenancy renewal.
                            </p>
                            <p className="mt-2">
                              Please use the link below to view your renewal
                              invoice and complete payment.
                            </p>
                          </div>
                        )}
                        {templateName === "outstanding_balance_link" && (
                          <div>
                            <p>Hi {comp.parameters[0]?.text || "Tenant"},</p>
                            <p className="mt-2">
                              Please click the button below to view your invoice
                              and make payment for your outstanding balance.
                            </p>
                          </div>
                        )}
                        {templateName === "renewal_payment_tenant" && (
                          <div>
                            <p>
                              Congratulations{" "}
                              {comp.parameters[0]?.text || "Tenant"}!
                            </p>
                            <p className="mt-2">
                              Your renewal payment of{" "}
                              {comp.parameters[1]?.text || "₦0"} for{" "}
                              {comp.parameters[2]?.text || "a property"} has
                              been confirmed.
                            </p>
                            <p className="mt-2">
                              Click the button below to view your receipt.
                            </p>
                          </div>
                        )}
                        {templateName === "renewal_payment_landlord" && (
                          <div>
                            <p>
                              Hello {comp.parameters[0]?.text || "Landlord"},{" "}
                              {comp.parameters[1]?.text || "Tenant"} has
                              completed their renewal payment of{" "}
                              {comp.parameters[2]?.text || "₦0"} for{" "}
                              {comp.parameters[3]?.text || "a property"}.
                            </p>
                            <p className="mt-2">Thank you.</p>
                          </div>
                        )}
                        {templateName === "renewal_receipt" && (
                          <div>
                            <p>
                              Hi {comp.parameters[0]?.text || "Tenant"}, your
                              payment of {comp.parameters[1]?.text || "₦0"} for{" "}
                              {comp.parameters[2]?.text || "a property"} has
                              been received successfully.
                            </p>
                            <p className="mt-2">
                              Your receipt is ready:{" "}
                              {comp.parameters[3]?.text || ""}
                            </p>
                            <p className="mt-2">Thank you for your payment!</p>
                          </div>
                        )}
                        {templateName === "rent_reminder_with_renewal" && (
                          <div className="space-y-2">
                            <p>
                              Hi <strong>{comp.parameters[0]?.text}</strong>,
                            </p>
                            <p>
                              This is a friendly reminder that your next{" "}
                              <strong>{comp.parameters[1]?.text}</strong> rent
                              for <strong>{comp.parameters[2]?.text}</strong> is
                              due on <strong>{comp.parameters[3]?.text}</strong>
                              .
                            </p>
                            <p>
                              Amount due:{" "}
                              <strong>{comp.parameters[4]?.text}</strong>
                            </p>
                            <p>
                              Please use the link below to view your invoice and
                              complete your payment.
                            </p>
                          </div>
                        )}
                        {/* Rent Reminders Template */}
                        {templateName === "rent_reminders" && (
                          <div className="space-y-2">
                            <p>
                              Hi <strong>{comp.parameters[0]?.text}</strong>,
                            </p>
                            <p>
                              This is a friendly reminder that your rent for{" "}
                              <strong>{comp.parameters[1]?.text}</strong> is due
                              on <strong>{comp.parameters[2]?.text}</strong>.
                            </p>
                            <p>
                              Amount due:{" "}
                              <strong>{comp.parameters[3]?.text}</strong>
                            </p>
                            <p>Thank you.</p>
                          </div>
                        )}
                        {/* Rent Overdue Template */}
                        {templateName === "rent_overdue" && (
                          <div className="space-y-2">
                            <p>
                              Hi <strong>{comp.parameters[0]?.text}</strong>,
                            </p>
                            <p>
                              Your rent for{" "}
                              <strong>{comp.parameters[1]?.text}</strong> was
                              due on <strong>{comp.parameters[2]?.text}</strong>{" "}
                              and is now overdue.
                            </p>
                            <p>
                              Amount due:{" "}
                              <strong>{comp.parameters[3]?.text}</strong>
                            </p>
                            <p>
                              Please make payment as soon as possible to avoid
                              additional charges.
                            </p>
                            <p className="mt-2">
                              Thank you for your prompt attention to this
                              matter.
                            </p>
                          </div>
                        )}
                        {/* Default parameter rendering for unknown templates */}
                        {![
                          "landlord_main_menu",
                          "main_menu",
                          "agent_welcome",
                          "facility_manager",
                          "properties_created",
                          "user_added",
                          "welcome_tenant",
                          "service_request_confirmation",
                          "kyc_submission_confirmation",
                          "tenant_application_notification",
                          "kyc_completion_link",
                          "kyc_completion_notification",
                          "landlord_service_request_notification",
                          "fm_service_request_notification",
                          "agent_kyc_notification",
                          "kyc_otp_verification",
                          "offer_letter_notification",
                          "offer_letter_otp",
                          "offer_letter_status_notification",
                          "payment_invoice_link",
                          "tenant_payment_success",
                          "landlord_partial_payment",
                          "ll_payment_complete",
                          "ll_payment_race",
                          "tenant_payment_race",
                          "invoice_reminder",
                          "renewal_link",
                          "renewal_payment_tenant",
                          "renewal_payment_landlord",
                          "renewal_receipt",
                          "rent_reminder_with_renewal",
                          "rent_reminders",
                          "rent_overdue",
                        ].includes(templateName) && (
                          <div className="space-y-1">
                            {comp.parameters.map(
                              (
                                param: {
                                  type: string;
                                  text?: string;
                                  payload?: string;
                                },
                                j: number,
                              ) => (
                                <p key={j} className="text-sm">
                                  {param.text ||
                                    param.payload ||
                                    JSON.stringify(param)}
                                </p>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="italic opacity-70">[ Body content ]</p>
                    )}
                  </div>
                )}

                {/* Handle FOOTER/footer components */}
                {(comp.type === "FOOTER" || comp.type === "footer") && (
                  <p className="text-sm italic opacity-70 mt-2">{comp.text}</p>
                )}

                {/* Handle BUTTONS/buttons/button components */}
                {(comp.type === "BUTTONS" ||
                  comp.type === "buttons" ||
                  comp.type === "button") && (
                  <div className="flex flex-col gap-2 mt-3">
                    {/* Handle template button parameters */}
                    {comp.parameters && (
                      <div>
                        {templateName === "landlord_main_menu" && (
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() =>
                                handleInteractiveClick(
                                  "button",
                                  "generate_kyc_link",
                                  "Generate KYC Link",
                                )
                              }
                              disabled={buttonLoading !== null}
                            >
                              {buttonLoading === "button_generate_kyc_link" ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  <span>Sending...</span>
                                </div>
                              ) : (
                                "🔗 Generate KYC Link"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() =>
                                handleInteractiveClick(
                                  "button",
                                  "view_tenancies",
                                  "View Tenancies",
                                )
                              }
                              disabled={buttonLoading !== null}
                            >
                              {buttonLoading === "button_view_tenancies" ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  <span>Sending...</span>
                                </div>
                              ) : (
                                "🏘️ View Tenancies"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() =>
                                handleInteractiveClick(
                                  "button",
                                  "view_maintenance",
                                  "View Maintenance",
                                )
                              }
                              disabled={buttonLoading !== null}
                            >
                              {buttonLoading === "button_view_maintenance" ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  <span>Sending...</span>
                                </div>
                              ) : (
                                "🔧 View Maintenance"
                              )}
                            </Button>
                          </div>
                        )}
                        {/* Handle quick_reply template buttons with payload */}
                        {"sub_type" in comp &&
                          comp.sub_type === "quick_reply" &&
                          comp.parameters?.[0]?.payload && (() => {
                            const payload = comp.parameters![0].payload!;
                            const action = payload.includes(":")
                              ? payload.split(":")[0]
                              : payload;
                            const labelMap: Record<string, string> = {
                              confirm_tenancy_details: "Confirm Details",
                              confirm_resolution_yes: "Yes, it's fixed",
                              confirm_resolution_no: "No, not yet",
                            };
                            const label =
                              labelMap[action] ||
                              action
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase());
                            const btnKey = `button_${payload}`;
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                disabled={buttonLoading !== null}
                                onClick={() =>
                                  handleInteractiveClick(
                                    "button",
                                    payload,
                                    label,
                                  )
                                }
                              >
                                {buttonLoading === btnKey ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Sending...</span>
                                  </div>
                                ) : (
                                  label
                                )}
                              </Button>
                            );
                          })()}
                        {/* Handle URL button parameters for templates */}
                        {"sub_type" in comp &&
                          comp.sub_type === "url" &&
                          comp.parameters?.[0]?.text && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => {
                                const rawParam = comp.parameters?.[0]?.text;
                                const targetUrl =
                                  templateName === "kyc_completion_link" &&
                                  rawParam
                                    ? `${window.location.origin}/kyc/${rawParam}`
                                    : templateName === "renewal_link" &&
                                        rawParam
                                      ? `${window.location.origin}/renewal-invoice/${rawParam}`
                                      : templateName ===
                                            "rent_reminder_with_renewal" &&
                                          rawParam
                                        ? `${window.location.origin}/renewal-invoice/${rawParam}`
                                        : templateName ===
                                              "payment_invoice_link" && rawParam
                                          ? `${window.location.origin}/offer-letters/invoice/${rawParam}`
                                          : templateName ===
                                                "tenant_payment_success" &&
                                              rawParam
                                            ? `${window.location.origin}/receipt/${rawParam}`
                                            : (templateName ===
                                                  "renewal_payment_tenant" ||
                                                  templateName ===
                                                    "full_renewal_payment_tenant") &&
                                                rawParam
                                              ? `${window.location.origin}/renewal-receipt/${rawParam}`
                                              : templateName ===
                                                    "ll_payment_complete" &&
                                                  rawParam
                                                ? `${window.location.origin}/landlord/property-detail?propertyId=${rawParam}`
                                                : templateName ===
                                                      "offer_letter_status_notification" &&
                                                    rawParam
                                                  ? `${window.location.origin}/landlord/property-detail?propertyId=${rawParam}`
                                                  : templateName ===
                                                        "outstanding_balance_link" &&
                                                      rawParam
                                                    ? `${window.location.origin}/renewal-invoice/${rawParam}`
                                                    : rawParam;
                                if (targetUrl) {
                                  window.open(targetUrl, "_blank");
                                }
                              }}
                            >
                              {templateName === "offer_letter_notification"
                                ? "📄 View Offer Letter"
                                : templateName ===
                                    "tenant_application_notification"
                                  ? "🔍 View Application"
                                  : templateName === "kyc_completion_link"
                                    ? "📝 Complete KYC"
                                    : templateName ===
                                        "kyc_completion_notification"
                                      ? "👤 View Tenant Details"
                                      : templateName ===
                                          "offer_letter_status_notification"
                                        ? "🏘️ View Property"
                                        : templateName ===
                                            "payment_invoice_link"
                                          ? "💳 View Invoice & Pay"
                                          : templateName ===
                                              "tenant_payment_success"
                                            ? "🧾 View Receipt"
                                            : templateName ===
                                                "ll_payment_complete"
                                              ? "🏘️ View Property"
                                              : templateName ===
                                                  "outstanding_balance_link"
                                                ? "🧾 View Invoice"
                                                : templateName ===
                                                    "renewal_link"
                                                  ? "📋 View Renewal Invoice"
                                                  : templateName ===
                                                      "rent_reminder_with_renewal"
                                                    ? "📋 View Invoice"
                                                    : templateName ===
                                                        "renewal_payment_tenant"
                                                      ? "🧾 View Receipt"
                                                      : "🔗 Open Link"}
                            </Button>
                          )}
                      </div>
                    )}

                    {/* Handle regular button arrays */}
                    {comp.buttons?.map(
                      (
                        btn: {
                          type: string;
                          reply?: { id: string; title: string };
                          text?: string;
                          url?: string;
                          phone_number?: string;
                        },
                        j: number,
                      ) => {
                        if (btn.type === "QUICK_REPLY" && btn.reply) {
                          return (
                            <Button
                              key={j}
                              variant="secondary"
                              size="sm"
                              className="w-full"
                              disabled={buttonLoading !== null}
                              onClick={() =>
                                handleInteractiveClick(
                                  "button",
                                  btn.reply!.id,
                                  btn.reply!.title,
                                )
                              }
                            >
                              {buttonLoading === `button_${btn.reply!.id}` ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  <span>Sending...</span>
                                </div>
                              ) : (
                                btn.reply.title
                              )}
                            </Button>
                          );
                        }

                        // Handle URL buttons in templates
                        if (
                          (btn.type === "url" || btn.type === "URL") &&
                          (btn.url || comp.parameters?.[0]?.text)
                        ) {
                          // The URL is often in the first parameter for template URL buttons
                          const rawParam =
                            btn.url || comp.parameters?.[0]?.text;
                          const targetUrl =
                            templateName === "kyc_completion_link" &&
                            !btn.url &&
                            rawParam
                              ? `${window.location.origin}/kyc/${rawParam}`
                              : templateName === "renewal_link" &&
                                  !btn.url &&
                                  rawParam
                                ? `${window.location.origin}/renewal-invoice/${rawParam}`
                                : templateName ===
                                      "rent_reminder_with_renewal" &&
                                    !btn.url &&
                                    rawParam
                                  ? `${window.location.origin}/renewal-invoice/${rawParam}`
                                  : templateName === "payment_invoice_link" &&
                                      !btn.url &&
                                      rawParam
                                    ? `${window.location.origin}/offer-letters/invoice/${rawParam}`
                                    : templateName ===
                                          "tenant_payment_success" &&
                                        !btn.url &&
                                        rawParam
                                      ? `${window.location.origin}/receipt/${rawParam}`
                                      : (templateName ===
                                            "renewal_payment_tenant" ||
                                            templateName ===
                                              "full_renewal_payment_tenant") &&
                                          !btn.url &&
                                          rawParam
                                        ? `${window.location.origin}/renewal-receipt/${rawParam}`
                                        : templateName ===
                                              "ll_payment_complete" &&
                                            !btn.url &&
                                            rawParam
                                          ? `${window.location.origin}/landlord/property-detail?propertyId=${rawParam}`
                                          : templateName ===
                                                "offer_letter_status_notification" &&
                                              !btn.url &&
                                              rawParam
                                            ? `${window.location.origin}/landlord/property-detail?propertyId=${rawParam}`
                                            : templateName ===
                                                  "outstanding_balance_link" &&
                                                !btn.url &&
                                                rawParam
                                              ? `${window.location.origin}/renewal-invoice/${rawParam}`
                                              : rawParam;
                          const buttonText =
                            btn.text ||
                            (templateName === "offer_letter_notification"
                              ? "📄 View Offer Letter"
                              : templateName ===
                                  "tenant_application_notification"
                                ? "🔍 View Application"
                                : templateName === "kyc_completion_link"
                                  ? "📝 Complete KYC"
                                  : templateName ===
                                      "kyc_completion_notification"
                                    ? "👤 View Tenant Details"
                                    : templateName ===
                                        "offer_letter_status_notification"
                                      ? "🏘️ View Property"
                                      : templateName === "payment_invoice_link"
                                        ? "💳 View Invoice & Pay"
                                        : templateName === "ll_payment_complete"
                                          ? "🏘️ View Property"
                                          : templateName ===
                                              "outstanding_balance_link"
                                            ? "🧾 View Invoice"
                                            : templateName === "renewal_link"
                                              ? "📋 View Renewal Invoice"
                                              : templateName ===
                                                  "rent_reminder_with_renewal"
                                                ? "📋 View Invoice"
                                                : templateName ===
                                                    "renewal_payment_tenant"
                                                  ? "🧾 View Receipt"
                                                  : "🔗 Open Link");

                          return (
                            <Button
                              key={j}
                              variant="outline"
                              size="sm"
                              className="w-full justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => {
                                if (targetUrl) {
                                  window.open(targetUrl, "_blank");
                                }
                              }}
                            >
                              {buttonText}
                            </Button>
                          );
                        }

                        return (
                          <div
                            key={j}
                            className="bg-muted px-3 py-2 rounded text-sm opacity-80 text-center"
                          >
                            {btn.text || btn.url || btn.phone_number} (
                            {btn.type.toLowerCase()})
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            ),
          )}

          <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-blue-200">
            Template: {templateName}
          </div>
        </div>
      );
    }

    return <p className="italic text-sm opacity-70">[ {msg.type} message ]</p>;
  };

  const allChatUsers = [
    ...existingUsers.map((u) => ({
      phone: u.phone,
      name: u.name || u.phone,
      type: "tenant" as const,
    })),
    ...landlords.map((u) => ({
      phone: u.phone,
      name: u.name || u.phone,
      displayName: `Your Chat - ${u.name || "Landlord"}`,
      type: "landlord" as const,
    })),
    ...facilityManagers.map((u) => ({
      phone: u.phone,
      name: u.name || u.phone,
      type: "facility_manager" as const,
    })),
    ...kycApplicants.map((u) => ({
      phone: u.phone,
      name: u.name || u.phone,
      type: "kyc_applicant" as const,
    })),
    ...testUsers.map((p) => ({ phone: p, name: p, type: "test" as const })),
  ];

  // Group users by type and sort each group by last message timestamp
  const getUsersByType = (
    type: "test" | "tenant" | "landlord" | "facility_manager" | "kyc_applicant",
  ) => {
    return allChatUsers
      .filter((user) => user.type === type)
      .sort((a, b) => {
        const msgA = getLastMessage(a.phone);
        const msgB = getLastMessage(b.phone);
        const timeA = msgA ? msgA.timestamp.getTime() : 0;
        const timeB = msgB ? msgB.timestamp.getTime() : 0;
        return timeB - timeA;
      });
  };

  const renderUserList = (
    users: typeof allChatUsers,
    emptyMessage: string,
    isLoading: boolean,
  ) => {
    if (isLoading) {
      return (
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (users.length === 0) {
      return (
        <p className="p-4 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="divide-y divide-gray-200">
        {users.map((user) => {
          const lastMsg = getLastMessage(user.phone);
          // Determine avatar color based on user type
          const avatarColor =
            user.type === "landlord"
              ? "bg-purple-500"
              : user.type === "facility_manager"
                ? "bg-orange-500"
                : user.type === "kyc_applicant"
                  ? "bg-yellow-500"
                  : user.type === "test"
                    ? "bg-blue-500"
                    : "bg-green-500"; // tenant default

          // For landlords, show name and phone separately
          const displayName =
            ("displayName" in user ? user.displayName : user.name) ||
            "Unknown User";
          const showPhoneSubtitle = user.type === "landlord";

          return (
            <button
              key={user.phone}
              onClick={() => {
                console.log("Chat item clicked:", {
                  phone: user.phone,
                  type: user.type,
                  displayName,
                });
                if (user.phone) {
                  setCurrentUser(user.phone);
                } else {
                  toast.error("Invalid phone number for this chat");
                }
              }}
              className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${
                currentUser === user.phone ? "bg-muted" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {showPhoneSubtitle
                      ? user.phone
                      : getSnippet(lastMsg, user.phone)}
                  </p>
                </div>
                {lastMsg && !showPhoneSubtitle && (
                  <p className="text-xs text-muted-foreground">
                    {getTime(lastMsg)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["landlord"]}>
      <div className="h-screen flex bg-gray-100 overflow-hidden">
        {/* Sidebar - Chat List */}
        <div className="w-80 md:w-96 bg-white flex flex-col border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="w-6 h-6 text-green-600" />
                WhatsApp Simulator
              </CardTitle>
            </div>

            {/* Landlord Info */}
            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "L"}
                </div>
                <div>
                  <p className="font-medium text-sm text-purple-900">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-purple-600">Landlord Account</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add a test number (e.g. 234...)"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
              />
              <Button onClick={handleAddUser}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Test Users Section */}
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Test Users ({getUsersByType("test").length})
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Manually added users + auto-discovered from KYC submissions
                </p>
              </div>
              <div>
                {renderUserList(
                  getUsersByType("test"),
                  "No test users added",
                  false,
                )}
              </div>
            </div>
            {/* KYC Applicants Section */}
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  KYC Applicants ({getUsersByType("kyc_applicant").length})
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Users who submitted KYC but not yet converted to tenants
                </p>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {renderUserList(
                  getUsersByType("kyc_applicant"),
                  "No KYC applicants found",
                  isFetchingUsers,
                )}
              </div>
            </div>
            {/* Existing Users (Tenants) Section */}
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Tenants ({getUsersByType("tenant").length})
                </h3>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {renderUserList(
                  getUsersByType("tenant"),
                  "No tenants found",
                  isFetchingUsers,
                )}
              </div>
            </div>
            {/* Landlords Section */}
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Your Chat Simulation ({getUsersByType("landlord").length})
                </h3>
              </div>
              <div>
                {renderUserList(
                  getUsersByType("landlord"),
                  "No landlord phone found",
                  isFetchingUsers,
                )}
              </div>
            </div>
            {/* Facility Managers Section */}
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Facility Managers ({getUsersByType("facility_manager").length}
                  )
                </h3>
              </div>
              <div className="pb-4">
                {renderUserList(
                  getUsersByType("facility_manager"),
                  "No facility managers found",
                  isFetchingUsers,
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#efeae6]">
          {currentUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  {getUserName(currentUser).substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{getUserName(currentUser)}</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto">
                <div className="py-4 px-2 max-w-4xl mx-auto w-full space-y-2 pb-8">
                  {getAllMessages(currentUser).map((msg, index, allMsgs) => {
                    const currentDateKey = getDateKey(msg.timestamp);
                    const prevDateKey =
                      index > 0 ? getDateKey(allMsgs[index - 1].timestamp) : "";
                    const showDateSeparator =
                      currentDateKey && currentDateKey !== prevDateKey;

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-3">
                            <span className="bg-white text-gray-500 text-[11px] px-3 py-1 rounded-lg shadow-sm">
                              {getChatDateLabel(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            msg.direction === "inbound"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                              msg.direction === "inbound"
                                ? "bg-[#dcf8c6] rounded-br-md"
                                : "bg-white rounded-bl-md shadow-sm"
                            }`}
                          >
                            {renderMessageContent(msg)}
                            <div className="text-xs text-gray-600 mt-1 flex items-center justify-end gap-1">
                              {safeFormatTime(msg.timestamp)}
                              {msg.direction === "inbound" && (
                                <span className="text-blue-700">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {/* Show typing indicator when bot is typing */}
                  {isBotTyping && <TypingIndicator />}
                </div>
              </div>

              {/* Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSimulatorLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    variant="default"
                    disabled={isSimulatorLoading || !inputText.trim()}
                  >
                    {isSimulatorLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-32 h-32 text-green-500 mx-auto mb-6 opacity-30" />
                <p className="text-2xl font-medium text-muted-foreground mb-2">
                  WhatsApp Simulator
                </p>
                <p className="text-muted-foreground max-w-md">
                  Select an existing user or add a test user to start simulating
                  conversations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
