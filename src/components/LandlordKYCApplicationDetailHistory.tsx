// src/components/LandlordKYCApplicationDetailHistory.tsx
// Full file - copy-paste ready

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { KYCService } from "@/services/kyc/kyc.service";
import { useProfile } from "@/services/users/query";

interface KYCApplication {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  status: "Pending" | "Attached" | "Rejected" | string;
  offerStatus?:
    | "Draft"
    | "Sent"
    | "Accepted"
    | "Declined"
    | "pending"
    | "accepted"
    | "rejected";
  offerLetterStatus?: string;
  submittedDate: string;
  documents?: Array<{ name: string; url: string }>;
  tenantOffer?: {
    proposedRentAmount?: number;
    rentPaymentFrequency?: string;
    intendedUse?: string;
    numberOfOccupants?: string;
    parkingRequirements?: string;
    additionalNotes?: string;
  };
  // Extra fields from your IKycApplication that we use
  offerLetter?: {
    id?: string;
    token?: string;
    status?: string;
    rentAmount?: number;
    rentFrequency?: string;
    serviceCharge?: number;
    tenancyStartDate?: string;
    tenancyEndDate?: string;
    cautionDeposit?: number;
    legalFee?: number;
    agencyFee?: number;
    acceptedAt?: string;
    acceptanceOtp?: string;
    acceptedByPhone?: string;
    sentAt?: string;
  };
  offerLetterCreatedAt?: string;
  offerLetterUpdatedAt?: string;
  invoiceCreatedAt?: string;
  invoiceId?: string;
  paymentDate?: string;
  referralAgent?: {
    fullName: string;
    phoneNumber: string;
  };
}

export interface HistoryEvent {
  id: string;
  title: string;
  context?: string;
  date: Date;
  description: string;
  metadata?: Record<string, unknown>;
  actionType: "navigate" | "modal" | "inline";
  nodeColor: "green" | "blue" | "purple" | "orange" | "red" | "gray";
  navigateTo?: "overview" | "documents" | "whatsapp" | "history";
  documentType?: "offer_letter" | "invoice" | "receipt";
  documentData?: Record<string, unknown>;
  offerStatus?: string;
  tenancyInfo?: {
    property: string;
    submittedDate: string;
    intendedUse: string;
    occupants: string;
    vehicle: string;
    proposedRent: number;
    frequency: string;
    notes: string;
    referralAgentName?: string;
    referralAgentPhone?: string;
  };
}

interface Props {
  application: KYCApplication;
  propertyName: string;
  propertyAddress?: string;
  additionalEvents?: HistoryEvent[];
  onNavigateToTab: (
    tab: "overview" | "documents" | "whatsapp" | "history",
  ) => void;
  onOpenDocument: (
    type: "offer_letter" | "invoice" | "receipt",
    data: Record<string, unknown>,
    offerStatus?: string,
  ) => void;
}

export function LandlordKYCApplicationDetailHistory({
  application,
  propertyName,
  propertyAddress = "",
  additionalEvents = [],
  onNavigateToTab,
  onOpenDocument,
}: Props) {
  const [modalEvent, setModalEvent] = useState<HistoryEvent | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<
    Array<{
      id: string;
      eventType: string;
      eventDescription: string;
      createdAt: string;
    }>
  >([]);

  // Fetch current landlord profile for branding
  const { data: profileData } = useProfile();

  // Fetch tracking events from backend
  useEffect(() => {
    const fetchTrackingEvents = async () => {
      if (application?.id) {
        const events = await KYCService.getApplicationHistory(
          String(application.id),
        );
        setTrackingEvents(events);
      }
    };

    fetchTrackingEvents();
  }, [application?.id]);

  const buildHistoryEvents = (): HistoryEvent[] => {
    const events: HistoryEvent[] = [];
    const isDemoAccepted =
      application.id === 2 &&
      (application.offerStatus === "Accepted" ||
        application.offerLetterStatus === "accepted");

    // Build reusable document data for clickable events
    const offerLetterDocData: Record<string, unknown> = {
      applicantName: application.name,
      applicantEmail: application.email,
      propertyName,
      rentAmount:
        application.offerLetter?.rentAmount ||
        application.tenantOffer?.proposedRentAmount ||
        0,
      rentFrequency:
        application.offerLetter?.rentFrequency ||
        application.tenantOffer?.rentPaymentFrequency ||
        "Annually",
      serviceCharge: application.offerLetter?.serviceCharge,
      cautionDeposit: application.offerLetter?.cautionDeposit,
      legalFee: application.offerLetter?.legalFee,
      agencyFee: application.offerLetter?.agencyFee,
      tenancyStartDate: application.offerLetter?.tenancyStartDate || "",
      tenancyEndDate: application.offerLetter?.tenancyEndDate,
      signedAt: application.offerLetter?.acceptedAt,
      otp: application.offerLetter?.acceptanceOtp,
      signedByPhone: application.offerLetter?.acceptedByPhone,
    };

    const invoiceTotal =
      Number(application.offerLetter?.rentAmount) ||
      Number(application.tenantOffer?.proposedRentAmount) ||
      0;
    const isPaid =
      !!application.paymentDate || application.status === "Attached";

    const invoiceDocData: Record<string, unknown> = {
      invoiceNumber: `INV-${String(application.id).padStart(6, "0")}`,
      invoiceDate: application.invoiceCreatedAt
        ? new Date(application.invoiceCreatedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      status: isPaid ? "Paid" : "Pending",
      tenantName: application.name,
      tenantEmail: application.email,
      tenantPhone: application.phone,
      propertyName,
      propertyAddress,
      lineItems: [
        {
          description: `Rent — ${application.tenantOffer?.rentPaymentFrequency || "Annual"}`,
          amount: invoiceTotal,
        },
      ],
      subtotal: invoiceTotal,
      total: invoiceTotal,
      amountPaid: isPaid ? invoiceTotal : 0,
      amountDue: isPaid ? 0 : invoiceTotal,
      notes: "Payment due within 14 days of invoice date.",
      backendInvoiceId: application.invoiceId,
      branding: profileData?.user?.branding,
    };

    const receiptDocData: Record<string, unknown> = {
      receiptNumber: `RCT-${String(application.id).padStart(6, "0")}`,
      receiptDate: application.paymentDate
        ? new Date(application.paymentDate).toLocaleDateString("en-GB")
        : new Date().toLocaleDateString("en-GB"),
      paymentReference: `TXN${String(application.id).padStart(8, "0")}`,
      tenantName: application.name,
      tenantEmail: application.email,
      tenantPhone: application.phone,
      propertyName,
      propertyAddress,
      invoiceNumber: `INV-${String(application.id).padStart(6, "0")}`,
      amountPaid: invoiceTotal,
      paymentMethod: "Bank Transfer",
      notes: "Payment received.",
    };

    // Add tracking events from backend (form views and offer letter events)
    trackingEvents.forEach((trackingEvent) => {
      const eventDate = new Date(trackingEvent.createdAt);

      if (trackingEvent.eventType === "kyc_form_viewed") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "KYC form viewed",
          context: trackingEvent.eventDescription.split(" — ")[1] || "", // Extract IP
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "inline",
          nodeColor: "gray",
        });
      } else if (trackingEvent.eventType === "kyc_application_approved") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Application approved",
          context: trackingEvent.eventDescription.split(" — ")[1] || "", // Extract date/time
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "inline",
          nodeColor: "green",
        });
      } else if (trackingEvent.eventType === "kyc_application_rejected") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Application rejected",
          context: trackingEvent.eventDescription.split(" — ")[1] || "", // Extract date/time
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "inline",
          nodeColor: "red",
        });
      } else if (trackingEvent.eventType === "offer_letter_sent") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Offer letter sent",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "offer_letter",
          documentData: offerLetterDocData,
          offerStatus: "Sent",
          nodeColor: "blue",
        });
      } else if (trackingEvent.eventType === "offer_letter_saved") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Offer letter saved",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "offer_letter",
          documentData: offerLetterDocData,
          nodeColor: "gray",
        });
      } else if (trackingEvent.eventType === "offer_letter_viewed") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Offer letter viewed",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "offer_letter",
          documentData: offerLetterDocData,
          nodeColor: "gray",
        });
      } else if (trackingEvent.eventType === "offer_letter_accepted") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Offer letter accepted",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "offer_letter",
          documentData: offerLetterDocData,
          offerStatus: "Accepted",
          nodeColor: "purple",
        });
      } else if (trackingEvent.eventType === "offer_letter_rejected") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Offer letter rejected",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "offer_letter",
          documentData: offerLetterDocData,
          offerStatus: "Rejected",
          nodeColor: "red",
        });
      } else if (trackingEvent.eventType === "invoice_generated") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Invoice generated",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "invoice",
          documentData: invoiceDocData,
          nodeColor: "gray",
        });
      } else if (trackingEvent.eventType === "invoice_sent") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Invoice sent",
          context: propertyName,
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "invoice",
          documentData: invoiceDocData,
          nodeColor: "blue",
        });
      } else if (trackingEvent.eventType === "invoice_viewed") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Invoice viewed",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "invoice",
          documentData: invoiceDocData,
          nodeColor: "gray",
        });
      } else if (trackingEvent.eventType === "payment_initiated") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Payment initiated",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "invoice",
          documentData: invoiceDocData,
          nodeColor: "orange",
        });
      } else if (trackingEvent.eventType === "payment_cancelled") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Payment cancelled",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "invoice",
          documentData: invoiceDocData,
          nodeColor: "red",
        });
      } else if (
        trackingEvent.eventType === "payment_completed_full" ||
        trackingEvent.eventType === "payment_completed_partial"
      ) {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Payment received",
          context: trackingEvent.eventDescription.split(" — ")[1] || "", // Extract amount
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "inline",
          nodeColor: "green",
        });
      } else if (trackingEvent.eventType === "receipt_issued") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Receipt issued",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "receipt",
          documentData: receiptDocData,
          nodeColor: "green",
        });
      } else if (trackingEvent.eventType === "receipt_sent") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Receipt sent",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "receipt",
          documentData: receiptDocData,
          nodeColor: "blue",
        });
      } else if (trackingEvent.eventType === "receipt_viewed") {
        events.push({
          id: `tracking-${trackingEvent.id}`,
          title: "Receipt viewed",
          context: trackingEvent.eventDescription.split(" — ")[1] || "",
          date: eventDate,
          description: trackingEvent.eventDescription,
          actionType: "navigate",
          documentType: "receipt",
          documentData: receiptDocData,
          nodeColor: "gray",
        });
      }
      // Note: kyc_application_submitted is not shown here as it's redundant with "Application submitted" event below
    });

    // 1. Application submitted — navigates to overview tab
    events.push({
      id: "app-submitted",
      title: "Application submitted",
      context: propertyName,
      date: isDemoAccepted
        ? new Date("2026-01-28T10:15:00")
        : new Date(application.submittedDate),
      description: `${application.name} submitted their KYC application for ${propertyName}`,
      actionType: "navigate",
      navigateTo: "overview",
      nodeColor: "orange",
      tenancyInfo: application.tenantOffer
        ? {
            property: propertyName,
            submittedDate: isDemoAccepted
              ? "Jan 28, 2026"
              : new Date(application.submittedDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                ),
            intendedUse: application.tenantOffer.intendedUse || "Residential",
            occupants: application.tenantOffer.numberOfOccupants || "1",
            vehicle: application.tenantOffer.parkingRequirements || "1 Car",
            proposedRent: application.tenantOffer.proposedRentAmount || 0,
            frequency:
              application.tenantOffer.rentPaymentFrequency || "Annually",
            notes: application.tenantOffer.additionalNotes || "",
            referralAgentName: application.referralAgent?.fullName,
            referralAgentPhone: application.referralAgent?.phoneNumber,
          }
        : undefined,
    });

    // 4. Offer letter sent — only add if no tracked event exists from backend
    const hasTrackedOfferSent = trackingEvents.some(
      (e) => e.eventType === "offer_letter_sent",
    );
    const hasTrackedOfferAccepted = trackingEvents.some(
      (e) => e.eventType === "offer_letter_accepted",
    );

    if (
      !hasTrackedOfferSent &&
      (application.offerLetterStatus === "pending" ||
        application.offerLetterStatus === "accepted" ||
        application.offerStatus === "Sent" ||
        application.offerStatus === "Accepted")
    ) {
      const offerData = {
        applicantName: application.name,
        applicantEmail: application.email,
        propertyName,
        rentAmount: application.tenantOffer?.proposedRentAmount || 0,
        rentFrequency:
          application.tenantOffer?.rentPaymentFrequency || "Annually",
        serviceCharge: 100000,
        cautionDeposit: 200000,
        legalFee: 50000,
        tenancyStartDate: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString("en-GB"),
        tenancyEndDate: new Date(
          Date.now() + 379 * 24 * 60 * 60 * 1000,
        ).toLocaleDateString("en-GB"),
      };

      // Use actual offer letter creation/sent date, fallback to demo dates
      const offerLetterDate = application.offerLetter?.sentAt
        ? new Date(application.offerLetter.sentAt)
        : application.offerLetterCreatedAt
          ? new Date(application.offerLetterCreatedAt)
          : isDemoAccepted
            ? new Date("2026-01-30T14:20:00")
            : new Date();

      events.push({
        id: "offer-sent",
        title: "Offer letter sent",
        context: propertyName,
        date: offerLetterDate,
        description: `Tenancy offer sent to ${application.email} for ${propertyName}`,
        metadata: { amount: `₦${offerData.rentAmount.toLocaleString()}` },
        actionType: "navigate",
        documentType: "offer_letter",
        documentData: offerData,
        offerStatus: "Sent",
        nodeColor: "blue",
      });

      // 5. Offer accepted — only add if no tracked event exists from backend
      if (
        !hasTrackedOfferAccepted &&
        (application.offerStatus === "Accepted" ||
          application.offerLetterStatus === "accepted")
      ) {
        // Use actual acceptance date from offer letter, fallback to current date
        const acceptedDate = application.offerLetter?.acceptedAt
          ? new Date(application.offerLetter.acceptedAt)
          : isDemoAccepted
            ? new Date("2026-02-02T09:45:00")
            : new Date();

        events.push({
          id: "offer-accepted",
          title: "Offer letter accepted",
          context: propertyName,
          date: acceptedDate,
          description: `${application.name} accepted the tenancy offer for ${propertyName}`,
          metadata: { amount: `₦${offerData.rentAmount.toLocaleString()}` },
          actionType: "navigate",
          documentType: "offer_letter",
          documentData: offerData,
          offerStatus: "Accepted",
          nodeColor: "purple",
        });
      }
    }

    // 6. Invoice generated — only add if no tracked event exists from backend
    const hasTrackedInvoice = trackingEvents.some(
      (e) => e.eventType === "invoice_generated" || e.eventType === "invoice_sent",
    );

    if (
      !hasTrackedInvoice &&
      (application.invoiceCreatedAt || application.invoiceId)
    ) {
      const invoiceTotal =
        application.tenantOffer?.proposedRentAmount || 1200000;
      const isPaid =
        !!application.paymentDate || application.status === "Attached";

      const invoiceData = {
        invoiceNumber: `INV-${String(application.id).padStart(6, "0")}`,
        invoiceDate: application.invoiceCreatedAt
          ? new Date(application.invoiceCreatedAt).toLocaleDateString("en-GB")
          : new Date().toLocaleDateString("en-GB"),
        status: isPaid ? "Paid" : "Pending",
        tenantName: application.name,
        tenantEmail: application.email,
        tenantPhone: application.phone,
        propertyName,
        propertyAddress,
        lineItems: [
          {
            description: `Rent — ${application.tenantOffer?.rentPaymentFrequency || "Annual"}`,
            amount: invoiceTotal,
          },
        ],
        subtotal: invoiceTotal,
        total: invoiceTotal,
        amountPaid: isPaid ? invoiceTotal : 0,
        amountDue: isPaid ? 0 : invoiceTotal,
        notes: "Payment due within 14 days of invoice date.",
        backendInvoiceId: application.invoiceId,
        branding: profileData?.user?.branding,
      };

      const invoiceDate = application.invoiceCreatedAt
        ? new Date(application.invoiceCreatedAt)
        : isDemoAccepted
          ? new Date("2026-02-02T10:00:00")
          : new Date();

      events.push({
        id: "invoice-generated",
        title: "Invoice generated",
        context: `₦${invoiceTotal.toLocaleString()}`,
        date: invoiceDate,
        description: `Invoice for ₦${invoiceTotal.toLocaleString()} generated for ${application.name}`,
        metadata: { amount: `₦${invoiceTotal.toLocaleString()}` },
        actionType: "navigate",
        documentType: "invoice",
        documentData: invoiceData,
        nodeColor: "blue",
      });
    }

    // 7. Payment received + Receipt — only add if no tracked event exists from backend
    const hasTrackedPayment = trackingEvents.some(
      (e) =>
        e.eventType === "payment_completed_full" ||
        e.eventType === "payment_completed_partial",
    );

    if (
      !hasTrackedPayment &&
      (application.paymentDate || application.status === "Attached")
    ) {
      const amount = application.tenantOffer?.proposedRentAmount || 1200000;

      const receiptData = {
        receiptNumber: `RCT-${String(application.id).padStart(6, "0")}`,
        receiptDate: new Date().toLocaleDateString("en-GB"),
        paymentReference: `TXN${String(application.id).padStart(8, "0")}`,
        tenantName: application.name,
        tenantEmail: application.email,
        tenantPhone: application.phone,
        propertyName,
        propertyAddress,
        invoiceNumber: `INV-${String(application.id).padStart(6, "0")}`,
        amountPaid: amount,
        paymentMethod: "Bank Transfer",
        notes: "Payment received.",
      };

      const paymentEventDate = application.paymentDate
        ? new Date(application.paymentDate)
        : isDemoAccepted
          ? new Date("2026-02-03T11:30:00")
          : new Date();

      events.push({
        id: "payment-received",
        title: "Payment received",
        context: `₦${amount.toLocaleString()}`,
        date: paymentEventDate,
        description: `Payment of ₦${amount.toLocaleString()} received from ${application.name}`,
        metadata: { amount: `₦${amount.toLocaleString()}` },
        actionType: "navigate",
        documentType: "receipt",
        documentData: receiptData,
        nodeColor: "green",
      });
    }

    // Sort newest first
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const events = [...buildHistoryEvents(), ...additionalEvents].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const getMonthYear = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Group by month/year
  const groupedEvents: Array<{ label: string; events: HistoryEvent[] }> = [];
  let currentMonth = "";
  let currentGroup: HistoryEvent[] = [];

  events.forEach((event, index) => {
    const monthYear = getMonthYear(event.date);
    if (monthYear !== currentMonth) {
      if (currentGroup.length > 0)
        groupedEvents.push({ label: currentMonth, events: currentGroup });
      currentMonth = monthYear;
      currentGroup = [event];
    } else {
      currentGroup.push(event);
    }
    if (index === events.length - 1) {
      groupedEvents.push({ label: currentMonth, events: currentGroup });
    }
  });

  const handleEventClick = (event: HistoryEvent) => {
    if (event.actionType === "navigate") {
      if (event.navigateTo) {
        onNavigateToTab(event.navigateTo);
      } else if (event.documentType && event.documentData) {
        onOpenDocument(
          event.documentType,
          event.documentData,
          event.offerStatus,
        );
      }
    } else if (event.actionType === "modal") {
      setModalEvent(event);
    }
  };

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="py-12 text-center px-6">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No activity recorded yet</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
        {groupedEvents.map((group, groupIndex) => (
          <div key={group.label}>
            {/* Month/Year Label */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.label}
              </h3>
              <div className="mt-2 border-t border-gray-200" />
            </div>

            {/* Timeline Events */}
            <div className="relative pl-8">
              {/* Vertical timeline line - exact positioning & height */}
              {group.events.length > 1 && (
                <div
                  className="absolute left-[7px] top-[20px] bottom-[20px] w-[1px] bg-neutral-200"
                  style={{ height: `calc(100% - 40px)` }}
                />
              )}

              {group.events.map((event) => (
                <div key={event.id} className="relative pb-6 last:pb-0">
                  {/* Timeline dot - EXACT size + alignment from design reference */}
                  <div className="absolute left-[-24px] top-[16px] w-[6px] h-[6px] rounded-full bg-neutral-400" />

                  {/* Tenancy application details link - shown above the Application submitted event */}
                  {event.id === "app-submitted" && event.tenancyInfo && (
                    <button
                      onClick={() => setModalEvent(event)}
                      className="relative z-10 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline mb-2 ml-3 cursor-pointer transition-colors"
                    >
                      Tenancy application details →
                    </button>
                  )}

                  <button
                    onClick={() => handleEventClick(event)}
                    className="relative flex items-start gap-4 w-full text-left group cursor-pointer hover:bg-neutral-50 rounded-lg p-3 -m-3 transition-all duration-200"
                  >
                    {/* Event content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                        {event.context && (
                          <span className="text-gray-500 font-normal">
                            {" "}
                            — {event.context}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Spacing between month groups */}
            {groupIndex < groupedEvents.length - 1 && <div className="mt-8" />}
          </div>
        ))}
      </div>

      {/* Tenancy Info Modal */}
      <Dialog open={!!modalEvent} onOpenChange={() => setModalEvent(null)}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalEvent?.tenancyInfo
                ? "Tenancy Information"
                : modalEvent?.title}
            </DialogTitle>
            {modalEvent?.tenancyInfo && (
              <p className="text-sm text-gray-500 mt-1">
                {modalEvent.tenancyInfo.property} · Submitted{" "}
                {modalEvent.tenancyInfo.submittedDate}
              </p>
            )}
          </DialogHeader>

          {modalEvent?.tenancyInfo ? (
            <div className="space-y-5 py-4">
              {/* Property Use Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Property Use
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Intended Use:</span>
                    <span className="text-gray-900 font-medium">
                      {modalEvent.tenancyInfo.intendedUse}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Number of Occupants:</span>
                    <span className="text-gray-900 font-medium">
                      {modalEvent.tenancyInfo.occupants}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Vehicle / Parking:</span>
                    <span className="text-gray-900 font-medium">
                      {modalEvent.tenancyInfo.vehicle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Details Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Financial Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Proposed Rent Amount:</span>
                    <span className="text-gray-900 font-medium">
                      ₦{modalEvent.tenancyInfo.proposedRent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Frequency:</span>
                    <span className="text-gray-900 font-medium">
                      {modalEvent.tenancyInfo.frequency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              {modalEvent.tenancyInfo.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Additional Notes
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {modalEvent.tenancyInfo.notes}
                  </p>
                </div>
              )}

              {/* Referral Agent Section */}
              {(modalEvent.tenancyInfo.referralAgentName ||
                modalEvent.tenancyInfo.referralAgentPhone) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Referral Agent
                  </h4>
                  <div className="space-y-3">
                    {modalEvent.tenancyInfo.referralAgentName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Full Name:</span>
                        <span className="text-gray-900 font-medium">
                          {modalEvent.tenancyInfo.referralAgentName}
                        </span>
                      </div>
                    )}
                    {modalEvent.tenancyInfo.referralAgentPhone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Phone Number:</span>
                        <span className="text-gray-900 font-medium">
                          {modalEvent.tenancyInfo.referralAgentPhone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-gray-600">
                  {modalEvent?.description}
                </p>
              </div>
              {modalEvent?.metadata && (
                <div className="space-y-2">
                  {Object.entries(modalEvent.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500 capitalize">{key}</span>
                      <span className="text-gray-900 font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-400">
                  {modalEvent && formatDate(modalEvent.date)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
