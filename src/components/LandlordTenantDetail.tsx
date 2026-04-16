/* eslint-disable */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Home,
  Phone,
  Mail,
  User,
  FileText,
  Wrench,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  UserMinus,
  Share2,
  Download,
  Send,
  CreditCard,
  Eye,
  Receipt,
  Plus,
  Search,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useReceiptsByPropertyId } from "@/services/receipts/query";
import { receiptsApi, ReceiptResponse } from "@/services/receipts/api";
import { ReceiptDocument } from "@/components/ReceiptDocument";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LandlordTopNav from "@/components/LandlordTopNav";
import { useFetchSingleTenantDetail, useProfile } from "@/services/users/query";
import {
  useFetchKYCApplicationById,
  useFetchAllProperties,
} from "@/services/property/query";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AttachTenantFromKycModal } from "@/components/modals/AttachTenantFromKycModal";
import { IKycApplication } from "@/types/kyc-application";
import { TenantChatHistory } from "@/components/TenantChatHistory";
import {
  OfferLetterViewModal,
  type OfferLetterData as OfferLetterModalData,
} from "@/components/modals/OfferLetterViewModal";
import {
  InvoiceViewModal,
  type InvoiceData,
} from "@/components/InvoiceViewModal";
import { invoiceApi } from "@/services/invoices/api";
import { offerLetterApi } from "@/services/offer-letters/api";
import { ReceiptViewModal } from "@/components/ReceiptViewModal";
import {
  ServiceRequestInfoModal,
  type ServiceRequestData,
} from "@/components/modals/ServiceRequestInfoModal";
import { RenewalInvoiceViewModal } from "@/components/RenewalInvoiceViewModal";
import { renewalInvoiceApi } from "@/services/renewal-invoice/api";
import type { RenewalInvoiceResponse } from "@/services/renewal-invoice/api";
import axiosInstance from "@/services/axios-instance";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { formatLocalDate } from "@/utils/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addRecurringCharge } from "@/lib/recurringChargesStore";

interface LandlordTenantDetailProps {
  tenantId?: number | string | null;
  onBack?: () => void;
  onAddProperty?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
  isMenuOpen?: boolean;
}

// Types for offer letter and receipt data (matching backend DTO)
interface OfferLetterData {
  id: string;
  token: string;
  propertyName: string;
  propertyId: string;
  rentAmount: number;
  rentFrequency: string;
  serviceCharge: number;
  cautionDeposit: number;
  legalFee: number;
  agencyFee: number;
  totalAmount: number;
  tenancyStartDate: Date;
  tenancyEndDate: Date;
  status: string;
  paymentStatus: string;
  amountPaid: number;
  outstandingBalance: number;
  // Acceptance tracking fields
  acceptedAt?: string;
  acceptanceOtp?: string;
  acceptedByPhone?: string;
}

interface ReceiptData {
  id: string;
  propertyName: string;
  propertyId?: string;
  amountPaid: number;
  paymentMethod: string | null;
  reference: string;
  paidAt?: string;
  isPartPayment: boolean;
  apiReceipt?: ReceiptResponse; // Full API receipt with branding
}

interface TimelineEvent {
  id: string;
  type:
    | "payment"
    | "maintenance"
    | "notice"
    | "general"
    | "offer_letter"
    | "invoice"
    | "receipt";
  date: string;
  description: string;
  time: string;
  title: string;
  details?: string; // Additional details like property name or amount
  offerLetterData?: OfferLetterData;
  receiptData?: ReceiptData;
  amount?: string | null;
  relatedEntityId?: string;
  relatedEntityType?: string;
  tenancyInfo?: {
    property: string;
    submittedDate: string;
    intendedUse: string;
    occupants: string;
    vehicle: string;
    proposedRent: number;
    frequency: string;
    notes: string;
  };
}

// Derived document type for the Documents tab
interface TenantDocument {
  id: string;
  type: "offer_letter" | "invoice" | "receipt";
  title: string;
  propertyName: string;
  amount: number | null;
  date: string;
  // Original data for modal display
  offerLetterData?: OfferLetterData;
  receiptData?: ReceiptData;
  // Full receipt data from API for enhanced display
  apiReceipt?: ReceiptResponse;
  // Invoice ID for download/share (fetched from backend)
  invoiceId?: string;
}

/**
 * Extracts documents from the tenant's history array and merges API receipts.
 * Filters for offer_letter and receipt events, creating TenantDocument objects.
 * For each offer letter, creates both an offer letter document AND a derived invoice document.
 * API receipts are merged in, replacing history-based receipts when matching.
 * Maintains sort order by date (newest first).
 *
 * @param history - Array of timeline events from the tenant data
 * @param apiReceipts - Optional array of receipts from the API
 * @returns Array of TenantDocument objects
 */
function extractDocuments(
  history: TimelineEvent[],
  apiReceipts?: ReceiptResponse[],
  invoiceIdMap?: Record<string, string>,
): TenantDocument[] {
  const documents: TenantDocument[] = [];
  const apiReceiptIds = new Set<string>();

  // Index API receipts by their payment reference for deduplication
  if (apiReceipts) {
    for (const receipt of apiReceipts) {
      apiReceiptIds.add(receipt.id);
      documents.push({
        id: `receipt-api-${receipt.id}`,
        type: "receipt",
        title: "Payment Receipt",
        propertyName: receipt.property_name,
        amount: Number(receipt.amount_paid),
        date: receipt.receipt_date,
        apiReceipt: receipt,
      });
    }
  }

  for (const event of history) {
    if (event.type === "offer_letter" && event.offerLetterData) {
      // Add offer letter document
      documents.push({
        id: `offer-${event.offerLetterData.id}`,
        type: "offer_letter",
        title: "Offer Letter",
        propertyName: event.offerLetterData.propertyName,
        amount: event.offerLetterData.totalAmount,
        date: event.date,
        offerLetterData: event.offerLetterData,
      });

      // Add derived invoice document
      documents.push({
        id: `invoice-${event.offerLetterData.id}`,
        type: "invoice",
        title: "Invoice",
        propertyName: event.offerLetterData.propertyName,
        amount: event.offerLetterData.totalAmount,
        date: event.date,
        offerLetterData: event.offerLetterData,
        invoiceId: invoiceIdMap?.[event.offerLetterData.id],
      });
    }

    // Only add history-based receipts if we don't have API receipts
    if (event.type === "receipt" && event.receiptData && !apiReceipts?.length) {
      documents.push({
        id: `receipt-${event.receiptData.id}`,
        type: "receipt",
        title: event.receiptData.isPartPayment
          ? "Part Payment Receipt"
          : "Payment Receipt",
        propertyName: event.receiptData.propertyName,
        amount: event.receiptData.amountPaid,
        date: event.date,
        receiptData: event.receiptData,
      });
    }
  }

  // Sort by date descending (newest first)
  documents.sort((a, b) => {
    const dateA = new Date(a.date).getTime() || 0;
    const dateB = new Date(b.date).getTime() || 0;
    return dateB - dateA;
  });

  return documents;
}

export default function LandlordTenantDetail({
  tenantId,
  onBack,
  onAddProperty,
  onMenuClick,
  isMobile = false,
  isMenuOpen = false,
}: LandlordTenantDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusSection = searchParams.get("focusSection");
  const [activeTab, setActiveTab] = useState(focusSection || "overview");

  // Attach to Property modal state
  const [showAttachToPropertyModal, setShowAttachToPropertyModal] =
    useState(false);

  // Chat history state
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [isLoadingChatLogs, setIsLoadingChatLogs] = useState(false);

  // Send WhatsApp message state
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Document preview modal state
  const [selectedDocument, setSelectedDocument] =
    useState<TenantDocument | null>(null);
  const [modalType, setModalType] = useState<
    "offer_letter" | "invoice" | "receipt" | null
  >(null);

  // Offer letter modal with stamp (timeline events)
  const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);
  const [offerLetterModalData, setOfferLetterModalData] = useState<{
    data: OfferLetterModalData;
    stampType?: "accepted" | "rejected";
    stampMetadata?: {
      acceptedAt?: string;
      rejectedAt?: string;
      signedByPhone?: string;
    };
  } | null>(null);

  // Invoice modal with stamp (timeline events)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceModalData, setInvoiceModalData] = useState<{
    data: InvoiceData;
    isPaid?: boolean;
    paymentDate?: string;
  } | null>(null);

  // Receipt modal (timeline events)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState<ReceiptData | null>(
    null,
  );

  // Tenancy info modal (KYC application submitted events)
  const [showTenancyInfoModal, setShowTenancyInfoModal] = useState(false);
  const [tenancyInfoModalData, setTenancyInfoModalData] = useState<
    TimelineEvent["tenancyInfo"] | null
  >(null);

  // Service request modal (timeline events)
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [serviceRequestData, setServiceRequestData] =
    useState<ServiceRequestData | null>(null);

  // Renewal invoice modal (timeline events)
  const [showRenewalInvoiceModal, setShowRenewalInvoiceModal] = useState(false);
  const [renewalInvoiceModalData, setRenewalInvoiceModalData] =
    useState<RenewalInvoiceResponse | null>(null);

  // Outstanding balance modal (timeline events)
  const [showOutstandingBalanceModal, setShowOutstandingBalanceModal] =
    useState(false);
  const [outstandingBalanceModalData, setOutstandingBalanceModalData] =
    useState<{ amount: string; details: string | null; date: string } | null>(
      null,
    );

  // Outstanding balance breakdown modal
  const [showOutstandingBreakdownModal, setShowOutstandingBreakdownModal] =
    useState(false);
  const [downloading, setDownloading] = useState(false);

  // Breakdown edit mode
  interface BreakdownRow { id: string; date: string; description: string; amount: string; }
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [breakdownDraft, setBreakdownDraft] = useState<BreakdownRow[]>([]);

  // Generate Invoice modal state
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState<"form" | "preview">("form");
  const [invoiceForm, setInvoiceForm] = useState<{
    items: { feeName: string; amount: string }[];
    dueDate: Date | null;
    frequency: "one_time" | "weekly" | "monthly" | "quarterly" | "annually";
  }>({
    items: [{ feeName: "", amount: "" }],
    dueDate: null,
    frequency: "one_time",
  });
  const [invoiceItemErrors, setInvoiceItemErrors] = useState<{ feeName: string; amount: string }[]>([{ feeName: "", amount: "" }]);
  const [invoiceDueDateError, setInvoiceDueDateError] = useState("");

  const resetInvoiceModal = () => {
    setInvoiceStep("form");
    setInvoiceForm({ items: [{ feeName: "", amount: "" }], dueDate: null, frequency: "one_time" });
    setInvoiceItemErrors([{ feeName: "", amount: "" }]);
    setInvoiceDueDateError("");
  };

  const invoiceTotal = invoiceForm.items.reduce((sum, item) => {
    const n = parseFloat(item.amount.replace(/,/g, ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const validateInvoiceForm = () => {
    let valid = true;
    const errs = invoiceForm.items.map((item) => {
      const e = { feeName: "", amount: "" };
      if (!item.feeName.trim()) { e.feeName = "Fee name is required"; valid = false; }
      const n = parseFloat(item.amount.replace(/,/g, ""));
      if (!item.amount.trim()) { e.amount = "Amount is required"; valid = false; }
      else if (isNaN(n) || n <= 0) { e.amount = "Enter a valid amount"; valid = false; }
      return e;
    });
    setInvoiceItemErrors(errs);
    if (!invoiceForm.dueDate) { setInvoiceDueDateError("Due date is required"); valid = false; }
    else setInvoiceDueDateError("");
    return valid;
  };

  // View History Detail modal state
  const [showHistoryDetailModal, setShowHistoryDetailModal] = useState(false);
  const [historyDetailData, setHistoryDetailData] = useState<{
    id: string;
    type: string;
    description: string;
    amount: string | null;
    propertyName: string;
    propertyId?: string;
    tenantName: string;
    date: string;
    // Tenancy-specific fields
    rentAmount?: number;
    serviceCharge?: number;
    otherFees?: { name: string; amount: number }[];
    totalAmount?: number;
    startDate?: string;
    endDate?: string;
    rawMoveInDate?: string | null;
    rawMoveOutDate?: string | null;
    // Payment-specific fields
    paymentAmount?: number;
    paymentDate?: string;
    rawPaymentDate?: string | null;
    // Fee-specific fields
    feeAmount?: number;
    feeDescription?: string;
    feeDate?: string;
    rawFeeDate?: string | null;
  } | null>(null);
  const [editingHistoryEntryId, setEditingHistoryEntryId] = useState<
    string | null
  >(null);

  // Add History modal state
  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
  const [historyForm, setHistoryForm] = useState<{
    type: "" | "Tenancy" | "Payment" | "Fee";
    property: string;
    propertyId: string;
    tenancyStartDate: Date | null;
    tenancyEndDate: Date | null;
    rentAmount: string;
    serviceChargeAmount: string;
    otherFees: { name: string; amount: string }[];
    paymentAmount: string;
    paymentDate: Date | null;
    feeAmount: string;
    feeDescription: string;
    feeDate: Date | null;
  }>({
    type: "",
    property: "",
    propertyId: "",
    tenancyStartDate: null,
    tenancyEndDate: null,
    rentAmount: "",
    serviceChargeAmount: "",
    otherFees: [],
    paymentAmount: "",
    paymentDate: null,
    feeAmount: "",
    feeDescription: "",
    feeDate: null,
  });
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");
  const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);
  const submittingHistoryRef = useRef(false);

  const resetHistoryForm = () => {
    setHistoryForm({
      type: "",
      property: "",
      propertyId: "",
      tenancyStartDate: null,
      tenancyEndDate: null,
      rentAmount: "",
      serviceChargeAmount: "",
      otherFees: [],
      paymentAmount: "",
      paymentDate: null,
      feeAmount: "",
      feeDescription: "",
      feeDate: null,
    });
    setPropertySearch("");
    setEditingHistoryEntryId(null);
  };

  // Fetch all properties for the Add History property dropdown
  const { data: allProperties } = useFetchAllProperties();

  const filteredPropertyOptions = (allProperties || []).filter(
    (p: any) =>
      !propertySearch ||
      p.name?.toLowerCase().includes(propertySearch.toLowerCase()) ||
      p.location?.toLowerCase().includes(propertySearch.toLowerCase()),
  );

  // Compute total outstanding for tenancy form
  const parseCurrencyToNumber = (val: string) => {
    const num = parseInt(val.replace(/,/g, ""), 10);
    return isNaN(num) ? 0 : num;
  };

  const tenancyTotal =
    parseCurrencyToNumber(historyForm.rentAmount) +
    parseCurrencyToNumber(historyForm.serviceChargeAmount) +
    historyForm.otherFees.reduce(
      (sum, fee) => sum + parseCurrencyToNumber(fee.amount),
      0,
    );

  // Helper to convert a Date to YYYY-MM-DD string (local time, no UTC shift)
  const dateToISO = (date: Date | null): string | null => {
    if (!date || isNaN(date.getTime())) return null;
    return formatLocalDate(date);
  };

  const handleSaveHistoryEntry = async () => {
    if (!historyForm.type) return;

    if (submittingHistoryRef.current) return;
    submittingHistoryRef.current = true;

    const propertyId = historyForm.propertyId || tenant?.propertyId;
    const tenantId = effectiveTenantId?.toString();

    if (!tenantId) {
      toast.error("No tenant associated with this entry");
      submittingHistoryRef.current = false;
      return;
    }

    if (!propertyId || propertyId.trim() === "") {
      toast.error("Please select a property");
      submittingHistoryRef.current = false;
      return;
    }

    setIsSubmittingHistory(true);
    try {
      const tenantName =
        `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim();
      const propertyName = historyForm.property || tenant?.property || "";

      if (historyForm.type === "Tenancy") {
        const startISO = dateToISO(historyForm.tenancyStartDate);
        const endISO = dateToISO(historyForm.tenancyEndDate);
        if (!startISO || !endISO) {
          toast.error("Invalid tenancy dates");
          setIsSubmittingHistory(false);
          submittingHistoryRef.current = false;
          return;
        }

        const payload = {
          property_id: propertyId,
          tenant_id: tenantId,
          event_type: "user_added_tenancy",
          event_description: JSON.stringify({
            rentAmount: parseCurrencyToNumber(historyForm.rentAmount),
            serviceChargeAmount: parseCurrencyToNumber(
              historyForm.serviceChargeAmount,
            ),
            otherFees: historyForm.otherFees.map((f) => ({
              name: f.name,
              amount: parseCurrencyToNumber(f.amount),
            })),
            totalAmount: tenancyTotal,
            propertyName,
            tenantName,
          }),
          move_in_date: startISO,
          move_out_date: endISO,
        };

        if (editingHistoryEntryId) {
          await axiosInstance.put(
            `/property-history/${editingHistoryEntryId}`,
            payload,
          );
          toast.success("Tenancy history updated successfully");
        } else {
          await axiosInstance.post("/property-history", payload);
          toast.success("Tenancy history recorded successfully");
        }
      } else if (historyForm.type === "Payment") {
        const paymentDateISO = dateToISO(historyForm.paymentDate);
        if (!paymentDateISO) {
          toast.error("Invalid payment date");
          setIsSubmittingHistory(false);
          submittingHistoryRef.current = false;
          return;
        }

        const paymentAmount = parseCurrencyToNumber(historyForm.paymentAmount);

        const payload = {
          property_id: propertyId,
          tenant_id: tenantId,
          event_type: "user_added_payment",
          event_description: JSON.stringify({
            paymentAmount,
            paymentDate: paymentDateISO,
            propertyName,
            tenantName,
          }),
          move_in_date: paymentDateISO,
        };

        if (editingHistoryEntryId) {
          await axiosInstance.put(
            `/property-history/${editingHistoryEntryId}`,
            payload,
          );
          toast.success("Payment history updated successfully");
        } else {
          await axiosInstance.post("/property-history", payload);
          toast.success("Payment history recorded successfully");
        }
      } else if (historyForm.type === "Fee") {
        const feeAmount = parseCurrencyToNumber(historyForm.feeAmount);

        // Use fee date if provided, otherwise use current date
        const feeDateISO = historyForm.feeDate
          ? dateToISO(historyForm.feeDate)
          : new Date().toISOString().split("T")[0];

        const payload = {
          property_id: propertyId,
          tenant_id: tenantId,
          event_type: "user_added_fee",
          event_description: JSON.stringify({
            feeAmount,
            feeDescription: historyForm.feeDescription,
            feeDate: feeDateISO,
            propertyName,
            tenantName,
          }),
          move_in_date: feeDateISO,
        };

        if (editingHistoryEntryId) {
          await axiosInstance.put(
            `/property-history/${editingHistoryEntryId}`,
            payload,
          );
          toast.success("Fee history updated successfully");
        } else {
          await axiosInstance.post("/property-history", payload);
          toast.success("Fee history recorded successfully");
        }
      }

      setShowAddHistoryModal(false);
      resetHistoryForm();
      refetchTenantData();
    } catch (error: any) {
      console.error("Failed to add history entry:", error);
      const message =
        error?.response?.data?.message || "Failed to add history entry";
      toast.error(message);
    } finally {
      setIsSubmittingHistory(false);
      submittingHistoryRef.current = false;
    }
  };

  // Handler for document click
  const handleDocumentClick = (doc: TenantDocument) => {
    setSelectedDocument(doc);
    setModalType(doc.type);
  };

  // Handler for modal close
  const handleCloseModal = () => {
    setSelectedDocument(null);
    setModalType(null);
  };

  // Get tenant ID from props or URL parameters
  const effectiveTenantId = tenantId || searchParams.get("tenantId");

  // Fetch tenant data from API
  const {
    data: tenantData,
    isLoading,
    isError,
    error,
    refetch: refetchTenantData,
  } = useFetchSingleTenantDetail(effectiveTenantId?.toString() || "");

  // Fetch vacant properties for the attach modal
  const kycAppId = tenantData?.kycApplicationId || "";
  const { data: kycApplicationRaw } = useFetchKYCApplicationById(
    kycAppId,
    !!kycAppId,
  );

  // Extract tenant data for easier access
  const tenant = tenantData;

  // Fetch receipts from API for the document hub
  const { data: apiReceipts } = useReceiptsByPropertyId(
    tenant?.propertyId || "",
    { enabled: !!tenant?.propertyId && tenant.propertyId !== "——" },
  );

  // Map of offer letter ID -> invoice ID for download/share buttons
  const [invoiceIdMap, setInvoiceIdMap] = useState<Record<string, string>>({});

  // Fetch invoice IDs for all offer letters in the documents tab
  useEffect(() => {
    const history = tenant?.history || [];
    const offerLetterIds = history
      .filter(
        (e: TimelineEvent) =>
          e.type === "offer_letter" && e.offerLetterData?.id,
      )
      .map((e: TimelineEvent) => e.offerLetterData!.id);

    if (offerLetterIds.length === 0) return;

    const fetchInvoiceIds = async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        offerLetterIds.map(async (olId: string) => {
          try {
            const invoice = await invoiceApi.getInvoiceByOfferLetterId(olId);
            if (invoice?.id) {
              map[olId] = invoice.id;
            }
          } catch {
            // Invoice may not exist for this offer letter
          }
        }),
      );
      setInvoiceIdMap(map);
    };

    fetchInvoiceIds();
  }, [tenant?.history]);

  // Fetch current landlord profile for branding fallback
  const { data: profileData } = useProfile();

  // Debug: Log tenant data
  console.log("🔍 Frontend Tenant Data:", {
    tenantId: effectiveTenantId,
    employmentStatus: tenantData?.employmentStatus,
    natureOfBusiness: tenantData?.natureOfBusiness,
    businessName: tenantData?.businessName,
    businessAddress: tenantData?.businessAddress,
    businessDuration: tenantData?.businessDuration,
    guarantorName: tenantData?.guarantorName,
    guarantorPhone: tenantData?.guarantorPhone,
    guarantorAddress: tenantData?.guarantorAddress,
  });

  // Sync URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("focusSection", activeTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [activeTab, searchParams, router]);

  // Seed breakdown rows when modal opens or source data changes
  useEffect(() => {
    if (!showOutstandingBreakdownModal) return;

    const allRows: { id: string; date: Date; description: string; amount: number }[] = [
      ...(tenant?.outstandingBalanceBreakdown || []).flatMap((breakdown) =>
        breakdown.transactions
          .filter((t) => t.amount > 0)
          .map((t) => {
            const baseType = t.type.includes("(") ? t.type.split("(")[0].trim() : t.type;
            const label = baseType === "Rent Due" ? "Rent" : baseType === "Service Charge Due" ? "Service Charge" : baseType;
            return {
              id: `charge-${breakdown.rentId}-${t.id}`,
              date: new Date(t.date),
              description: `${label} due on ${breakdown.propertyName}${t.type.includes("(") ? ` - ${t.type.match(/\((.*?)\)/)?.[1] || ""}` : ""}`,
              amount: t.amount,
            };
          })
      ),
      ...(tenant?.paymentTransactions || []).map((t) => ({
        id: t.id,
        date: new Date(t.date),
        description: t.type || "Payment received",
        amount: t.amount,
      })),
    ];

    const propertyLabel = tenant?.property || "Property";
    const MOCK_ROWS = [
      { id: "m-1", date: new Date("2025-05-01"), description: `Rent due on ${propertyLabel} (1 May 2025 – 30 Apr 2026)`, amount: 1800000 },
      { id: "m-2", date: new Date("2025-05-01"), description: `Service Charge due on ${propertyLabel}`, amount: 150000 },
      { id: "m-3", date: new Date("2025-05-14"), description: "Payment received", amount: -1800000 },
      { id: "m-4", date: new Date("2025-05-20"), description: "Payment received", amount: -100000 },
      { id: "m-5", date: new Date("2026-02-01"), description: `Rent due on ${propertyLabel} (1 Feb 2026 – 31 Jan 2027)`, amount: 1800000 },
      { id: "m-6", date: new Date("2026-02-01"), description: `Service Charge due on ${propertyLabel}`, amount: 150000 },
      { id: "m-7", date: new Date("2026-03-10"), description: "Payment received", amount: -900000 },
    ];

    const source = allRows.length > 0 ? allRows : MOCK_ROWS;
    const sorted = [...source].sort((a, b) => a.date.getTime() - b.date.getTime());
    const rows: BreakdownRow[] = sorted.map((r) => ({
      id: r.id,
      date: r.date.toISOString().split("T")[0],
      description: r.description,
      amount: String(r.amount),
    }));
    setBreakdownRows(rows);
    setBreakdownDraft(rows);
    setIsAdjustingBalance(false);
  }, [showOutstandingBreakdownModal, tenant?.outstandingBalanceBreakdown, tenant?.paymentTransactions]);

  // WebSocket for real-time updates
  useWebSocket({
    propertyId: tenant?.propertyId,
    enabled: !!tenant?.propertyId && tenant.propertyId !== "——",
    onServiceRequestCreated: (data) => {
      console.log("Service request created, refetching tenant data:", data);
      // Refetch tenant data to get updated history
      refetchTenantData();
    },
  });

  // Memoize formatting functions
  const formatCurrency = useCallback(
    (amount: number | string | null | undefined) => {
      if (amount === null || amount === undefined) return "₦0";
      const numAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;
      if (isNaN(numAmount)) return "₦0";
      return `₦${numAmount.toLocaleString()}`;
    },
    [],
  );

  // Helper to parse various date formats
  const parseDate = useCallback(
    (dateString: string | null | undefined): Date | null => {
      if (!dateString) return null;

      // Try standard Date constructor first
      let date = new Date(dateString);
      if (!isNaN(date.getTime())) return date;

      // Try parsing DD/MM/YYYY or DD-MM-YYYY
      const parts = dateString.split(/[-/]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
        const year = parseInt(parts[2], 10);

        // Check if it might be MM/DD/YYYY instead (if day > 12 it's definitely day first, but if not it's ambiguous)
        // Given the locale is likely Nigeria (based on currency), DD/MM/YYYY is standard.

        date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
      }

      return null;
    },
    [],
  );

  const formatDate = useCallback(
    (dateString: string) => {
      const date = parseDate(dateString);
      if (!date) return "——";

      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [parseDate],
  );

  // Format Naira with commas
  const formatNaira = useCallback((amount: number) => {
    return `₦${amount.toLocaleString()}`;
  }, []);

  // Format signed Naira (positive/negative)
  const formatSignedNaira = useCallback((amount: number) => {
    const sign = amount >= 0 ? "" : "-";
    const absAmount = Math.abs(amount);
    return `${sign}₦${absAmount.toLocaleString()}`;
  }, []);

  const formatTimelineDateTime = (dateString: string | null) => {
    if (!dateString) return "——";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Calculate days left until rent expiry
  const calculateDaysLeft = useCallback(
    (expiryDate: string | null): number => {
      const expiry = parseDate(expiryDate);
      if (!expiry) return 0;

      const today = new Date();
      // Reset time part for accurate day calculation
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);

      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    [parseDate],
  );

  // Get color for days left
  const getDaysLeftColor = useCallback((days: number): string => {
    if (days < 0) return "text-[#D32F2F]"; // Expired - Red
    if (days < 30) return "text-[#FF9800]"; // Less than 30 days - Orange
    return "text-[#28A745]"; // More than 30 days - Green
  }, []);

  // Fetch chat history for the tenant
  const fetchChatHistory = useCallback(async () => {
    if (!tenant?.phone) return;

    setIsLoadingChatLogs(true);
    try {
      // Extract phone number and format it for the API
      let phoneNumber = tenant.phone.replace(/[^\d+]/g, "");

      // Normalize formatting to international format
      if (phoneNumber.startsWith("0") && phoneNumber.length === 11) {
        // Nigerian local format (080...) -> +23480...
        phoneNumber = "+234" + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith("234") && phoneNumber.length === 13) {
        // International format without + (23480...) -> +23480...
        phoneNumber = "+" + phoneNumber;
      } else if (!phoneNumber.startsWith("+")) {
        // Fallback: if no prefix, check if it looks like a local number without 0
        if (phoneNumber.length === 10) {
          phoneNumber = "+234" + phoneNumber;
        }
      }

      const response = await fetch(
        `/api/proxy/chat-history/${encodeURIComponent(phoneNumber)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setChatLogs(data.messages || []);

        // Mark messages as read after fetching
        await markMessagesAsRead(phoneNumber);
      } else {
        console.error("Failed to fetch chat history:", response.statusText);
        setChatLogs([]);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setChatLogs([]);
    } finally {
      setIsLoadingChatLogs(false);
    }
  }, [tenant?.phone]);

  // Mark messages as read when landlord views chat
  const markMessagesAsRead = useCallback(async (phoneNumber: string) => {
    try {
      await fetch(
        `/api/proxy/chat-history/${encodeURIComponent(phoneNumber)}/mark-read`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, []);

  // Fetch chat history when tenant data is available and chat tab is active
  useEffect(() => {
    if (activeTab === "chat" && tenant?.phone) {
      fetchChatHistory();
    }
  }, [activeTab, tenant?.phone, fetchChatHistory]);

  // Send a custom WhatsApp message to the tenant
  const handleSendCustomMessage = async () => {
    if (!tenant?.phone || !customMessage.trim()) return;
    setIsSendingMessage(true);
    const toastId = toast.loading("Sending message...");
    try {
      let phoneNumber = tenant.phone.replace(/[^\d+]/g, "");
      if (phoneNumber.startsWith("0") && phoneNumber.length === 11) {
        phoneNumber = "+234" + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith("234") && phoneNumber.length === 13) {
        phoneNumber = "+" + phoneNumber;
      } else if (!phoneNumber.startsWith("+") && phoneNumber.length === 10) {
        phoneNumber = "+234" + phoneNumber;
      }
      const response = await fetch("/api/proxy/whatsapp/send-custom-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: customMessage.trim(),
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to send message");
      }
      setCustomMessage("");
      setShowSendMessageModal(false);
      setIsSendingMessage(false);

      // Wait for WhatsApp delivery status webhook to arrive, then check actual status
      await new Promise((r) => setTimeout(r, 2500));

      const historyRes = await fetch(
        `/api/proxy/chat-history/${encodeURIComponent(phoneNumber)}`,
        { headers: { "Content-Type": "application/json" } },
      );
      const data = historyRes.ok ? await historyRes.json() : null;
      const messages: any[] = data?.messages || [];
      const lastOutbound = [...messages]
        .reverse()
        .find((m) => m.direction === "OUTBOUND");

      if (lastOutbound?.status?.toLowerCase() === "failed") {
        toast.error(lastOutbound.error_reason || "Message delivery failed", {
          id: toastId,
        });
      } else {
        toast.success("Message sent", { id: toastId });
      }

      setChatLogs(messages);
    } catch (error: any) {
      toast.error(error.message || "Failed to send message", { id: toastId });
      setIsSendingMessage(false);
    }
  };

  const { user } = useAuth();
  const userRole = user?.role;

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    router.push(`/${userRole}/property-detail?propertyId=${propertyId}`);
  };

  // Handle outstanding balance breakdown download
  const handleDownload = () => {
    setDownloading(true);
    try {
      const tenantName =
        `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim() ||
        "tenant";

      // Build flat sorted rows using unified ledger data from backend
      const allRows: {
        id: string;
        date: Date;
        description: string;
        amount: number;
      }[] = [
        // Charge rows from outstandingBalanceBreakdown (positive amounts)
        ...(tenant?.outstandingBalanceBreakdown || []).flatMap((breakdown) => {
          return breakdown.transactions
            .filter((t) => t.amount > 0)
            .map((t) => {
              // Backend now provides proper date resolution and period descriptions
              // Extract the base type from the description (e.g., "Rent Due (12 Feb 2026 - 11 Mar 2026)" -> "Rent")
              const baseType = t.type.includes("(")
                ? t.type.split("(")[0].trim()
                : t.type;
              const label =
                baseType === "Rent Due"
                  ? "Rent"
                  : baseType === "Service Charge Due"
                    ? "Service Charge"
                    : baseType;

              return {
                id: `charge-${breakdown.rentId}-${t.id}`,
                date: new Date(t.date),
                description: `${label} due on ${breakdown.propertyName}${t.type.includes("(") ? ` - ${t.type.match(/\((.*?)\)/)?.[1] || ""}` : ""}`,
                amount: t.amount,
              };
            });
        }),
        // Payment rows from paymentTransactions (negative amounts, already unified from ledger)
        ...(tenant?.paymentTransactions || []).map((t) => ({
          id: t.id,
          date: new Date(t.date),
          description: t.type || "Payment received",
          amount: t.amount, // Backend provides negative amounts for payments
        })),
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      const totalOutstanding = tenant?.totalOutstandingBalance || 0;
      // No need for reconciliation logic since backend now provides unified ledger data
      // that eliminates the "Prior payments" gap

      const fmtDate = (d: Date) =>
        d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      const fmtAmt = (n: number) =>
        n < 0 ? `-₦${Math.abs(n).toLocaleString()}` : `+₦${n.toLocaleString()}`;
      const fmtNaira = (n: number) => `₦${n.toLocaleString()}`;

      const rows = allRows
        .map((row, i) => {
          const running = allRows
            .slice(0, i + 1)
            .reduce((s, r) => s + r.amount, 0);
          const amtColor = row.amount < 0 ? "#059669" : "#0f172a";
          const balColor =
            running > 0 ? "#ea580c" : running < 0 ? "#059669" : "#0f172a";
          const balDisplay =
            running < 0
              ? `Credit ₦${Math.abs(running).toLocaleString()}`
              : fmtNaira(running);
          return `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:14px 16px;color:#64748b;white-space:nowrap;">${fmtDate(row.date)}</td>
              <td style="padding:14px 16px;color:#334155;">${row.description}</td>
              <td style="padding:14px 16px;text-align:right;color:${amtColor};font-weight:500;white-space:nowrap;">${fmtAmt(row.amount)}</td>
              <td style="padding:14px 16px;text-align:right;color:${balColor};font-weight:500;white-space:nowrap;">${balDisplay}</td>
            </tr>`;
        })
        .join("");

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Outstanding Balance — ${tenantName}</title>
  <style>
    body { font-family: sans-serif; padding: 32px; color: #0f172a; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .total-label { font-size: 13px; color: #64748b; margin-bottom: 4px; }
    .total-amount { font-size: 28px; font-weight: 700; color: #ea580c; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 14px; }
    thead tr { border-bottom: 2px solid #e2e8f0; }
    th { padding: 10px 16px; text-align: left; color: #64748b; font-weight: 500; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
  </style>
</head>
<body>
  <h1>Outstanding Balance Breakdown</h1>
  <p class="meta">${tenantName} · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
  <p class="total-label">Total Outstanding Balance</p>
  <p class="total-amount">${fmtNaira(totalOutstanding)}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Description</th><th>Amount</th><th>Balance</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `outstanding-balance-${tenantName}-${new Date().toISOString().split("T")[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Breakdown downloaded successfully");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download breakdown");
    } finally {
      setDownloading(false);
    }
  };

  // Handle timeline event click - maps event types to actions
  const handleTimelineEventClick = (event: any) => {
    const eventType = event.type as string;
    const title = (event.title || "").toLowerCase();

    // Handle outstanding balance events
    if (event.relatedEntityType === "outstanding_balance") {
      setOutstandingBalanceModalData({
        amount: event.description || "",
        details: event.details || null,
        date: event.date,
      });
      setShowOutstandingBalanceModal(true);
      return;
    }

    // Handle all renewal-related events
    if (
      event.relatedEntityType === "renewal_invoice" &&
      event.relatedEntityId
    ) {
      (async () => {
        try {
          const invoice = await renewalInvoiceApi.getRenewalInvoiceById(
            event.relatedEntityId,
          );
          setRenewalInvoiceModalData(invoice);
          setShowRenewalInvoiceModal(true);
        } catch (error) {
          console.error("Failed to fetch renewal invoice:", error);
          toast.error("Failed to load renewal invoice details");
        }
      })();
      return;
    }

    switch (eventType) {
      case "offer_letter": {
        let offerData = event.offerLetterData;

        // For offer_letter_accepted/viewed/sent/rejected events from property history,
        // offerLetterData is missing. Look up the matching offer letter from history by relatedEntityId.
        if (!offerData && event.relatedEntityId) {
          const matchingEvent = history.find(
            (h: any) =>
              h.offerLetterData &&
              h.offerLetterData.id === event.relatedEntityId,
          );
          if (matchingEvent) {
            offerData = matchingEvent.offerLetterData;
          }
        }

        if (!offerData) {
          console.warn("offer_letter event missing offerLetterData", event);
          return;
        }
        // Build OfferLetterData shape for the modal
        const modalData: any = {
          applicantName: name,
          applicantEmail: tenant?.email || "",
          propertyName: offerData.propertyName || "",
          rentAmount: offerData.rentAmount || 0,
          rentFrequency: offerData.rentFrequency || "Annually",
          serviceCharge: offerData.serviceCharge || 0,
          cautionDeposit: offerData.cautionDeposit || 0,
          legalFee: offerData.legalFee || 0,
          agencyFee: offerData.agencyFee || 0,
          tenancyStartDate: offerData.tenancyStartDate
            ? new Date(offerData.tenancyStartDate).toLocaleDateString("en-GB")
            : "",
          tenancyEndDate: offerData.tenancyEndDate
            ? new Date(offerData.tenancyEndDate).toLocaleDateString("en-GB")
            : "",
          status: (offerData.status || "").toLowerCase(),
          signedAt: offerData.acceptedAt,
          otp: offerData.acceptanceOtp,
          signedByPhone: offerData.acceptedByPhone,
        };

        const status = (offerData.status || "").toLowerCase();
        if (status === "accepted" || status === "selected") {
          setOfferLetterModalData({
            data: modalData,
            stampType: "accepted",
            stampMetadata: undefined,
          });
        } else if (status === "rejected" || status === "declined") {
          setOfferLetterModalData({
            data: modalData,
            stampType: "rejected",
          });
        } else {
          setOfferLetterModalData({ data: modalData });
        }
        setShowOfferLetterModal(true);
        break;
      }
      case "invoice": {
        const invoiceId = event.relatedEntityId;
        if (!invoiceId) {
          console.warn("invoice event missing relatedEntityId", event);
          return;
        }
        // payment_initiated events store a payment ID, not an invoice ID
        if (event.relatedEntityType === "payment") {
          toast.info(
            "Invoice details not directly available for this payment event",
          );
          return;
        }
        // Show loading state while fetching
        setInvoiceLoading(true);
        (async () => {
          try {
            const invoice = await invoiceApi.getInvoice(invoiceId);
            const invoiceData: InvoiceData = {
              invoiceNumber: invoice.invoiceNumber,
              invoiceDate: invoice.invoiceDate,
              status: invoice.status,
              tenantName: invoice.tenantName,
              tenantEmail: invoice.tenantEmail,
              tenantPhone: invoice.tenantPhone,
              propertyName: invoice.propertyName,
              propertyAddress: invoice.propertyAddress || "",
              lineItems: invoice.lineItems,
              subtotal: invoice.totalAmount,
              total: invoice.totalAmount,
              amountPaid: invoice.amountPaid,
              amountDue: invoice.outstandingBalance,
              notes: invoice.notes,
              backendInvoiceId: invoice.id,
              paidDate: invoice.lastPaymentDate || undefined,
            };
            const isPaid = invoice.status === "paid";
            setInvoiceModalData({
              data: invoiceData,
              isPaid,
              paymentDate: invoice.lastPaymentDate || undefined,
            });
            setShowInvoiceModal(true);
          } catch (error) {
            console.error("Failed to fetch invoice:", error);
            toast.error("Failed to load invoice details");
          } finally {
            setInvoiceLoading(false);
          }
        })();
        break;
      }
      case "receipt": {
        const receiptData = event.receiptData;

        // For receipt_issued/receipt_sent/receipt_viewed events that don't carry
        // receiptData, look up the API receipt by relatedEntityId (the receipt ID)
        if (!receiptData) {
          const apiReceipt = apiReceipts?.find(
            (r) => r.id === event.relatedEntityId,
          );
          if (apiReceipt) {
            setReceiptModalData({
              id: apiReceipt.payment_id,
              propertyName: apiReceipt.property_name,
              propertyId: apiReceipt.property_id,
              amountPaid: Number(apiReceipt.amount_paid),
              paymentMethod: apiReceipt.payment_method,
              reference: apiReceipt.payment_reference,
              paidAt: apiReceipt.receipt_date,
              isPartPayment: false,
              apiReceipt,
            });
            setShowReceiptModal(true);
          } else {
            console.warn(
              "receipt event: no receiptData and no matching API receipt",
              event,
            );
          }
          break;
        }

        // Try to find matching API receipt with full data including branding
        const matchingApiReceipt = apiReceipts?.find(
          (r) => r.payment_reference === receiptData.reference,
        );

        if (matchingApiReceipt) {
          setReceiptModalData({
            ...receiptData,
            apiReceipt: matchingApiReceipt,
          });
        } else {
          setReceiptModalData(receiptData);
        }

        setShowReceiptModal(true);
        break;
      }
      case "maintenance": {
        const serviceRequestId = event.relatedEntityId;
        if (!serviceRequestId) {
          toast.error("Service request details not available");
          break;
        }
        (async () => {
          try {
            const response = await axiosInstance.get(
              `/service-requests/${serviceRequestId}`,
            );
            const sr = response.data;
            setServiceRequestData({
              id: sr.id,
              issue: sr.description || event.title || "Service Request",
              description: sr.description || "",
              status: sr.status || "pending",
              property:
                sr.property?.name || event.details || tenant?.property || "",
              reportedBy:
                sr.tenant_name || sr.tenant?.profile_name || "Unknown",
              assignedTo:
                sr.facilityManager?.account?.profile_name || "Unassigned",
              submittedDate: sr.date_reported || sr.created_at,
              resolvedDate: sr.resolution_date || sr.resolvedAt || undefined,
              activityLog: (sr.statusHistory || []).map((h: any) => ({
                action: h.previous_status
                  ? `${h.previous_status} \u2192 ${h.new_status}${h.changedBy ? ` (${h.changedBy.first_name} ${h.changedBy.last_name})` : ""}`
                  : `Created as ${h.new_status}`,
                date: h.changed_at,
              })),
            });
            setShowServiceRequestModal(true);
          } catch (error) {
            console.error("Failed to fetch service request:", error);
            toast.error("Failed to load service request details");
          }
        })();
        break;
      }
      case "general": {
        // User-added tenancy history events → show detail modal
        if (event.id?.startsWith("user-added-tenancy-")) {
          let detailData: any = {};
          try {
            detailData = JSON.parse(event.details || "{}");
          } catch {
            detailData = {};
          }
          setHistoryDetailData({
            id: event.id.replace("user-added-tenancy-", ""),
            type: "Historical Tenancy",
            description: event.description || "",
            amount: event.amount || null,
            propertyName: detailData.propertyName || tenant?.property || "",
            propertyId: detailData.propertyId || tenant?.propertyId || "",
            tenantName:
              detailData.tenantName ||
              `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim(),
            date: event.date,
            rentAmount: detailData.rentAmount,
            serviceCharge: detailData.serviceCharge,
            otherFees: detailData.otherFees,
            totalAmount: detailData.totalAmount,
            startDate: detailData.startDate,
            endDate: detailData.endDate,
            rawMoveInDate: detailData.rawMoveInDate || null,
            rawMoveOutDate: detailData.rawMoveOutDate || null,
          });
          setShowHistoryDetailModal(true);
          break;
        }
        // User-added payment history events → show detail modal
        if (event.id?.startsWith("user-added-payment-")) {
          let detailData: any = {};
          try {
            detailData = JSON.parse(event.details || "{}");
          } catch {
            detailData = {};
          }
          setHistoryDetailData({
            id: event.id.replace("user-added-payment-", ""),
            type: "Historical Payment",
            description: event.description || "",
            amount: event.amount || null,
            propertyName: detailData.propertyName || tenant?.property || "",
            propertyId: detailData.propertyId || tenant?.propertyId || "",
            tenantName:
              detailData.tenantName ||
              `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim(),
            date: event.date,
            paymentAmount: detailData.paymentAmount,
            paymentDate: detailData.paymentDate,
            rawPaymentDate: detailData.rawPaymentDate || null,
          });
          setShowHistoryDetailModal(true);
          break;
        }
        // User-added fee history events → show detail modal
        if (event.id?.startsWith("user-added-fee-")) {
          let detailData: any = {};
          try {
            detailData = JSON.parse(event.details || "{}");
          } catch {
            detailData = {};
          }
          setHistoryDetailData({
            id: event.id.replace("user-added-fee-", ""),
            type: "Historical Fee",
            description: event.description || "",
            amount: event.amount || null,
            propertyName: detailData.propertyName || tenant?.property || "",
            propertyId: detailData.propertyId || tenant?.propertyId || "",
            tenantName:
              detailData.tenantName ||
              `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim(),
            date: event.date,
            feeAmount: detailData.feeAmount,
            feeDescription: detailData.feeDescription,
            feeDate: detailData.feeDate,
            rawFeeDate: detailData.rawFeeDate || null,
          });
          setShowHistoryDetailModal(true);
          break;
        }
        // Legacy user-added history events → show detail modal
        if (event.id?.startsWith("user-added-")) {
          const titleParts = event.title?.split(" — ") || [];
          const displayType = titleParts[0] || "Custom Event";
          const propName =
            titleParts[1] || event.details || tenant?.property || "";
          const desc =
            titleParts.slice(2).join(" — ") || event.description || "";

          setHistoryDetailData({
            id: event.id.replace(/^user-added-/, ""),
            type: displayType,
            description: desc,
            amount: event.amount || null,
            propertyName: propName,
            tenantName:
              `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim(),
            date: event.date,
          });
          setShowHistoryDetailModal(true);
          break;
        }
        // KYC-related events → navigate to KYC application detail page
        if (
          title.includes("kyc") ||
          title.includes("application submitted") ||
          title.includes("application approved") ||
          title.includes("application rejected")
        ) {
          // For kyc_form_viewed, relatedEntityId may be a KYC link ID (not an application ID),
          // so prefer the tenant's known kycApplicationId as primary, with relatedEntityId as fallback
          const isFormViewed = title.includes("form viewed");
          const kycAppId = isFormViewed
            ? tenant?.kycApplicationId || event.relatedEntityId
            : event.relatedEntityId || tenant?.kycApplicationId;
          if (kycAppId) {
            router.push(`/${userRole}/kyc-application-detail/${kycAppId}`);
          } else {
            setActiveTab("overview");
          }
          break;
        }
        // General events like tenancy_started / tenancy_ended
        if (title.includes("tenant attached") || title.includes("tenancy")) {
          setActiveTab("overview");
        }
        break;
      }
      default:
        break;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-200 border-t-orange-500 mx-auto"></div>
          <p className="text-gray-600">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  // Error state or no data
  if (isError || !tenantData) {
    // Check if it's a 404 error (tenant no longer accessible)
    const is404Error =
      (error as any)?.message?.includes("not found") ||
      (error as any)?.message?.includes("404");

    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-gray-900 mb-2">
            {is404Error ? "Tenant No Longer Accessible" : "Tenant Not Found"}
          </h2>
          <p className="text-gray-600 mb-4">
            {is404Error
              ? "This tenant is no longer associated with your properties. This usually happens when a tenancy has been ended."
              : isError
                ? (error as Error)?.message ||
                  "An error occurred while fetching the tenant."
                : "The requested tenant could not be found."}
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  const name =
    `${tenant?.firstName || ""} ${tenant?.lastName || ""}`.trim() ||
    "Unknown Tenant";
  const status = tenant?.tenancyStatus === "active" ? "Active" : "Inactive";
  const property = tenant?.property || "No Property Assigned";
  const propertyId = tenant?.propertyId;
  const rentAmount = tenant?.rentAmount || 0;
  const rentFrequency = tenant?.rentPaymentFrequency || "——"; // Get from API response
  const rentDueDate = tenant?.nextRentDue;
  const tenancyStartDate = tenant?.leaseStartDate;
  const pendingInvoiceTotalAmount =
    (tenant as any)?.pendingInvoiceTotalAmount ?? null;

  // Build IKycApplication from fetched KYC data for the attach modal
  const kycAppData = kycApplicationRaw
    ? (kycApplicationRaw as { application?: any }).application ||
      kycApplicationRaw
    : null;

  const kycApplication: IKycApplication | null = kycAppData
    ? {
        id: kycAppData.id,
        propertyId: kycAppData.propertyId || "0",
        name:
          `${kycAppData.firstName || tenant?.firstName || ""} ${kycAppData.lastName || tenant?.lastName || ""}`.trim() ||
          name,
        email: kycAppData.email || tenant?.email || "",
        phone: kycAppData.phoneNumber || tenant?.phone || "",
        occupation: kycAppData.occupation || "——",
        idType: "National ID",
        submittedDate: kycAppData.submissionDate || "",
        status:
          kycAppData.status === "pending"
            ? "Pending"
            : kycAppData.status === "pending_completion"
              ? "Pending Completion"
              : kycAppData.status === "approved"
                ? "Attached"
                : "Rejected",
        sex: kycAppData.gender || undefined,
        passportPhoto:
          kycAppData.passportPhotoUrl ||
          kycAppData.documents?.passportPhoto ||
          tenant?.passportPhotoUrl ||
          undefined,
        contactAddress: kycAppData.contactAddress || undefined,
        tenantOffer: kycAppData.tenantOffer
          ? {
              proposedRentAmount: kycAppData.tenantOffer.proposedRentAmount
                ? typeof kycAppData.tenantOffer.proposedRentAmount === "number"
                  ? kycAppData.tenantOffer.proposedRentAmount
                  : parseFloat(kycAppData.tenantOffer.proposedRentAmount)
                : 0,
              rentPaymentFrequency: (kycAppData.tenantOffer
                .rentPaymentFrequency || "Monthly") as any,
            }
          : kycAppData.proposedRentAmount
            ? {
                proposedRentAmount:
                  typeof kycAppData.proposedRentAmount === "number"
                    ? kycAppData.proposedRentAmount
                    : parseFloat(kycAppData.proposedRentAmount),
                rentPaymentFrequency: (kycAppData.rentPaymentFrequency ||
                  "Monthly") as any,
              }
            : undefined,
        offerLetterStatus:
          kycAppData.offerLetterStatus || kycAppData.offerLetter?.status,
        offerLetter: kycAppData.offerLetter,
      }
    : null;

  // Use the history from the API response, sorted in reverse chronological order (newest first)
  const history = [...(tenant?.history || [])]
    .map((event: any) => {
      // Enrich KYC Application Submitted events with tenancy info from tenant data
      if (
        event.id?.startsWith("kyc-submitted-") &&
        (tenant?.proposedRentAmount || tenant?.intendedUseOfProperty)
      ) {
        return {
          ...event,
          tenancyInfo: {
            property: event.details || tenant?.property || "",
            submittedDate: new Date(event.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            intendedUse:
              tenant?.intendedUseOfProperty ||
              kycAppData?.tenantOffer?.intendedUse ||
              "Residential",
            occupants:
              tenant?.numberOfOccupants ||
              kycAppData?.tenantOffer?.numberOfOccupants ||
              "1",
            vehicle:
              tenant?.numberOfCarsOwned ||
              kycAppData?.tenantOffer?.numberOfCarsOwned ||
              kycAppData?.tenantOffer?.parkingRequirements ||
              kycAppData?.parkingNeeds ||
              "N/A",
            proposedRent:
              Number(tenant?.proposedRentAmount) ||
              Number(kycAppData?.tenantOffer?.proposedRentAmount) ||
              0,
            frequency:
              tenant?.rentPaymentFrequency ||
              kycAppData?.tenantOffer?.rentPaymentFrequency ||
              "Annually",
            notes:
              tenant?.additionalNotes ||
              kycAppData?.tenantOffer?.additionalNotes ||
              "",
          },
        };
      }
      return event;
    })
    .sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  // Debug: Log the history data
  console.log("🔍 Frontend Tenant History Debug:", {
    tenantId: effectiveTenantId,
    historyLength: history.length,
    history: history.map((h: any) => ({
      id: h.id,
      eventType: h.eventType,
      title: h.title,
      description: h.description,
      date: h.date,
    })),
  });

  const daysLeft = rentDueDate ? calculateDaysLeft(rentDueDate) : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top Navigation */}
      <LandlordTopNav
        title="Tenant Details"
        onBack={handleBack}
        onAddProperty={onAddProperty}
        showAddButton={true}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        showAddNew={true}
      />

      {/* Content with top padding to account for fixed nav */}
      <div className="pt-[73px] lg:pt-[81px]">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* 1. Tenant Overview Section */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-[#FF5000] flex items-center justify-center shrink-0 overflow-hidden relative">
                    <span className="text-white text-xl">
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    {tenant?.passportPhotoUrl && (
                      <img
                        src={tenant.passportPhotoUrl}
                        alt={name}
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  {/* Tenant Info */}
                  <div className="flex-1 flex items-stretch justify-between min-h-[64px]">
                    {/* Left Side - Personal Info */}
                    <div>
                      {(() => {
                        const applicationId = tenant?.id?.startsWith("app-")
                          ? tenant.id.replace("app-", "")
                          : tenant?.kycApplicationId;
                        return applicationId ? (
                          <button
                            onClick={() =>
                              router.push(
                                `/${userRole}/kyc-application-detail/${applicationId}?fromTenantDetail=true`,
                              )
                            }
                            className="text-[#222222] mb-2 text-left hover:text-[#FF5000] transition-colors cursor-pointer"
                          >
                            {name}
                          </button>
                        ) : (
                          <h1 className="text-[#222222] mb-2">{name}</h1>
                        );
                      })()}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">
                            {tenant?.phone || "——"}
                          </span>
                        </div>
                        {tenant?.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{tenant.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side - Credit Balance + Outstanding Balance */}
                    <div className="flex flex-col justify-between text-right">
                      {tenant?.totalCreditBalance &&
                      tenant.totalCreditBalance > 0 ? (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Credit Balance
                          </div>
                          <button
                            onClick={() =>
                              setShowOutstandingBreakdownModal(true)
                            }
                            className="cursor-pointer group"
                          >
                            <span className="text-lg font-semibold text-green-600 group-hover:underline">
                              {formatNaira(tenant.totalCreditBalance)}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div />
                      )}
                      <div className="border-t border-gray-100 pt-2">
                        <label className="text-xs text-gray-400 block mb-0.5">
                          Outstanding Balance
                        </label>
                        {(tenant?.totalOutstandingBalance ?? 0) > 0 ? (
                          <button
                            onClick={() =>
                              setShowOutstandingBreakdownModal(true)
                            }
                            className="cursor-pointer group"
                          >
                            <span className="text-sm font-medium text-[#FF5000] group-hover:underline">
                              {formatNaira(tenant!.totalOutstandingBalance)}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setShowOutstandingBreakdownModal(true)
                            }
                            className="cursor-pointer group"
                          >
                            <span className="text-sm text-gray-900 group-hover:underline">
                              {formatNaira(0)}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-4 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="history">Tenant History</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="chat">Whatsapp</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* 2. Tenancy Information (Multiple Tenancy Records) */}
                {tenant?.activeTenancies &&
                tenant.activeTenancies.length > 0 &&
                tenant.activeTenancies.some(
                  (t: any) =>
                    t.status === "Active" && t.property && t.rentAmount,
                ) ? (
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[#222222]">Tenancy Information</h2>
                        <Button
                          onClick={() => setShowAttachToPropertyModal(true)}
                          className="bg-transparent hover:bg-gray-50 border border-black text-black"
                          size="sm"
                        >
                          Attach to Property
                        </Button>
                      </div>
                      <Separator className="mb-4" />

                      <div className="space-y-6">
                        {tenant.activeTenancies
                          .filter((t: any) => t.status === "Active")
                          .map((tenancy: any, index: number) => {
                            const tenancyDaysLeft = tenancy.rentDueDate
                              ? Math.ceil(
                                  (new Date(tenancy.rentDueDate).getTime() -
                                    new Date().getTime()) /
                                    (1000 * 60 * 60 * 24),
                                )
                              : 0;

                            return (
                              <div key={tenancy.id}>
                                {index > 0 && <Separator className="mb-6" />}

                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-4">
                                    {/* Tenancy Number Pointer */}
                                    {tenant.activeTenancies.filter(
                                      (t: any) => t.status === "Active",
                                    ).length > 1 && (
                                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0a1929] text-white flex items-center justify-center font-semibold text-sm">
                                        {index + 1}
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                      {/* Property Name */}
                                      <div>
                                        <label className="text-sm text-gray-500 mb-1 block">
                                          Property Name
                                        </label>
                                        {tenancy.propertyId ? (
                                          <button
                                            onClick={() =>
                                              handlePropertyClick(
                                                tenancy.propertyId,
                                              )
                                            }
                                            className="text-[#FF5000] hover:underline flex items-center gap-1"
                                          >
                                            {tenancy.property}
                                            <ExternalLink className="w-4 h-4" />
                                          </button>
                                        ) : (
                                          <p className="text-gray-900">
                                            {tenancy.property}
                                          </p>
                                        )}
                                      </div>
                                      {/* Rent Amount */}
                                      <div>
                                        <label className="text-sm text-gray-500 mb-1 block">
                                          Rent Amount
                                        </label>
                                        <p className="text-gray-900">
                                          {formatCurrency(
                                            tenancy.rentAmount || 0,
                                          )}
                                        </p>
                                      </div>
                                      {/* Service Charge */}
                                      <div>
                                        <label className="text-sm text-gray-500 mb-1 block">
                                          Service Charge
                                        </label>
                                        <p className="text-gray-900">
                                          {formatCurrency(
                                            tenancy.serviceCharge || 0,
                                          )}
                                        </p>
                                      </div>
                                      {/* Rent Frequency */}{" "}
                                      <div>
                                        <label className="text-sm text-gray-500 mb-1 block">
                                          Rent Frequency
                                        </label>
                                        <p className="text-gray-900">
                                          {tenancy.rentFrequency}
                                        </p>
                                      </div>
                                      {/* Rent Due Date */}
                                      <div>
                                        <label className="text-sm text-gray-500 mb-1 block">
                                          Rent Due Date
                                        </label>
                                        <p className="text-gray-900">
                                          {formatDate(tenancy.rentDueDate)}
                                        </p>
                                      </div>
                                      {/* Days Left */}
                                      <div>
                                        <label className="text-sm text-gray-500 mb-1 block">
                                          Days Left
                                        </label>
                                        <p
                                          className={getDaysLeftColor(
                                            tenancyDaysLeft,
                                          )}
                                        >
                                          {tenancyDaysLeft < 0
                                            ? `Expired (${Math.abs(
                                                tenancyDaysLeft,
                                              )} days overdue)`
                                            : `${tenancyDaysLeft} days left`}
                                        </p>
                                      </div>
                                      {/* Tenancy Start Date */}
                                      {tenancy.tenancyStartDate && (
                                        <div>
                                          <label className="text-sm text-gray-500 mb-1 block">
                                            Tenancy Start Date
                                          </label>
                                          <p className="text-gray-900">
                                            {formatDate(
                                              tenancy.tenancyStartDate,
                                            )}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Billing Summary */}
                                  {tenancy.rentDueDate &&
                                    (tenancy.pendingInvoiceTotalAmount ??
                                      tenancy.rentAmount) && (
                                      <div className="ml-10 pt-3 mt-3 border-t border-gray-100">
                                        <p className="text-xs text-gray-400 mb-1.5">
                                          Billing Summary
                                        </p>
                                        <p className="text-sm sm:text-base text-gray-900">
                                          The tenant is expected to pay{" "}
                                          {formatCurrency(
                                            tenancy.pendingInvoiceTotalAmount !=
                                              null
                                              ? tenancy.pendingInvoiceTotalAmount
                                              : tenancy.rentAmount +
                                                  (tenancy.serviceCharge || 0),
                                          )}{" "}
                                          by {formatDate(tenancy.rentDueDate)}.
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                ) : status === "Active" && property ? (
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[#222222]">Tenancy Information</h2>
                        <Button
                          onClick={() => setShowAttachToPropertyModal(true)}
                          className="bg-transparent hover:bg-gray-50 border border-black text-black"
                          size="sm"
                        >
                          Attach to Property
                        </Button>
                      </div>
                      <Separator className="mb-4" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Property Name */}
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">
                            Property Name
                          </label>
                          {propertyId ? (
                            <button
                              onClick={() => handlePropertyClick(propertyId!)}
                              className="text-[#FF5000] hover:underline flex items-center gap-1"
                            >
                              {property}
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          ) : (
                            <p className="text-gray-900">{property}</p>
                          )}
                        </div>

                        {/* Rent Amount */}
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">
                            Rent Amount
                          </label>
                          <p className="text-gray-900">
                            {formatCurrency(rentAmount!)}
                          </p>
                        </div>

                        {/* Service Charge */}
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">
                            Service Charge
                          </label>
                          <p className="text-gray-900">
                            {formatCurrency(tenant?.serviceCharge || 0)}
                          </p>
                        </div>

                        {/* Rent Frequency */}
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">
                            Rent Frequency
                          </label>
                          <p className="text-gray-900">{rentFrequency}</p>
                        </div>

                        {/* Rent Due Date */}
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">
                            Rent Due Date
                          </label>
                          <p className="text-gray-900">
                            {formatDate(rentDueDate!)}
                          </p>
                        </div>

                        {/* Days Left */}
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">
                            Days Left
                          </label>
                          <p className={getDaysLeftColor(daysLeft)}>
                            {daysLeft < 0
                              ? `Expired (${Math.abs(daysLeft)} days overdue)`
                              : `${daysLeft} days left`}
                          </p>
                        </div>

                        {/* Tenancy Start Date */}
                        {tenancyStartDate && (
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">
                              Tenancy Start Date
                            </label>
                            <p className="text-gray-900">
                              {formatDate(tenancyStartDate)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Billing Summary */}
                      {rentDueDate &&
                        (pendingInvoiceTotalAmount ?? rentAmount) && (
                          <div className="pt-3 mt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mb-1.5">
                              Billing Summary
                            </p>
                            <p className="text-sm sm:text-base text-gray-900">
                              The tenant is expected to pay{" "}
                              {formatCurrency(
                                pendingInvoiceTotalAmount != null
                                  ? pendingInvoiceTotalAmount
                                  : rentAmount + (tenant?.serviceCharge || 0),
                              )}{" "}
                              by {formatDate(rentDueDate)}.
                            </p>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[#222222]">Tenancy Information</h2>
                        <Button
                          onClick={() => setShowAttachToPropertyModal(true)}
                          className="bg-transparent hover:bg-gray-50 border border-black text-black"
                          size="sm"
                        >
                          Attach to Property
                        </Button>
                      </div>
                      <Separator className="mb-4" />
                      <p className="text-center text-[#9E9E9E] italic py-8">
                        No active tenancy linked to this tenant.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* KYC Information section removed - now accessible via tenant name link */}
              </TabsContent>

              {/* Tenant History Tab */}
              <TabsContent value="history">
                {/* Add History Button */}
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() => {
                      // Pre-fill property from tenant's current property
                      if (tenant?.propertyId && tenant?.property) {
                        setHistoryForm((prev) => ({
                          ...prev,
                          property: tenant.property,
                          propertyId: tenant.propertyId,
                        }));
                        setPropertySearch(tenant.property);
                      }
                      setShowAddHistoryModal(true);
                    }}
                    className="bg-[#FF5000] hover:bg-[#E64800] text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add History
                  </Button>
                </div>
                {history.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                    {(() => {
                      // Group events by month/year (your original logic - untouched)
                      const getMonthYear = (dateStr: string) => {
                        const d = new Date(dateStr);
                        return d.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        });
                      };
                      const grouped: Array<{ label: string; events: any[] }> =
                        [];
                      let curMonth = "";
                      let curGroup: any[] = [];
                      history.forEach((event: any, idx: number) => {
                        const my = getMonthYear(event.date);
                        if (my !== curMonth) {
                          if (curGroup.length > 0)
                            grouped.push({ label: curMonth, events: curGroup });
                          curMonth = my;
                          curGroup = [event];
                        } else {
                          curGroup.push(event);
                        }
                        if (idx === history.length - 1)
                          grouped.push({ label: curMonth, events: curGroup });
                      });

                      return grouped.map((group, groupIndex) => (
                        <div key={group.label}>
                          {/* Month/Year Label */}
                          <div className="mb-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              {group.label}
                            </h3>
                            <div className="mt-2 border-t border-gray-200" />
                          </div>

                          {/* Timeline Container - EXACT styling from design reference */}
                          <div className="relative pl-8">
                            {/* Vertical timeline line - exact positioning */}
                            {group.events.length > 1 && (
                              <div
                                className="absolute left-[7px] top-[20px] bottom-[20px] w-[1px] bg-neutral-200"
                                style={{ height: `calc(100% - 40px)` }}
                              />
                            )}

                            {group.events.map((event: any) => (
                              <div
                                key={event.id}
                                className="relative pb-6 last:pb-0"
                              >
                                {/* Timeline dot - EXACT 6px size + alignment from design reference */}
                                <div className="absolute left-[-24px] top-[16px] w-[6px] h-[6px] rounded-full bg-neutral-400" />

                                {/* User added history event label */}
                                {event.id?.startsWith("user-added-") && (
                                  <p className="relative z-10 text-xs font-semibold text-blue-600 mb-1 ml-3">
                                    User added history event
                                  </p>
                                )}

                                {/* Tenancy application details link - shown above KYC Application Submitted events */}
                                {event.id?.startsWith("kyc-submitted-") &&
                                  event.tenancyInfo && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTenancyInfoModalData(
                                          event.tenancyInfo,
                                        );
                                        setShowTenancyInfoModal(true);
                                      }}
                                      className="relative z-10 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline mb-2 ml-3 cursor-pointer transition-colors"
                                    >
                                      Tenancy application details →
                                    </button>
                                  )}

                                <button
                                  onClick={() =>
                                    handleTimelineEventClick(event)
                                  }
                                  className="relative flex items-start gap-4 w-full text-left group cursor-pointer hover:bg-neutral-50 rounded-lg p-3 -m-3 transition-all duration-200"
                                >
                                  {/* Event content */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {event.title}
                                      {event.details && (
                                        <span className="text-gray-500 font-normal">
                                          {" "}
                                          —{" "}
                                          {(() => {
                                            if (
                                              event.id?.startsWith(
                                                "user-added-",
                                              )
                                            ) {
                                              try {
                                                const d = JSON.parse(
                                                  event.details,
                                                );
                                                const prop =
                                                  d.propertyName || "";
                                                return prop;
                                              } catch {
                                                /* fall through */
                                              }
                                            }
                                            return event.details;
                                          })()}
                                        </span>
                                      )}
                                    </p>
                                    {event.type === "maintenance" &&
                                      event.description && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {event.description}
                                        </p>
                                      )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {formatTimelineDateTime(event.date)}
                                    </p>
                                  </div>
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Spacing between month groups */}
                          {groupIndex < grouped.length - 1 && (
                            <div className="mt-8" />
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="py-12 text-center px-6">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        No history available for this tenant.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents">
                {(() => {
                  const documents = extractDocuments(
                    tenant?.history || [],
                    apiReceipts,
                    invoiceIdMap,
                  );

                  if (documents.length === 0) {
                    return (
                      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          No documents available for this tenant
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-white rounded-xl shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-medium flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#FF5000]" />
                          Generated Documents
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {documents.length} document
                          {documents.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="p-4 space-y-3">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                            onClick={() => handleDocumentClick(doc)}
                          >
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{doc.title}</p>
                              <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                <span>{formatDate(doc.date)}</span>
                              </div>
                            </div>
                            {/* Action buttons for all document types */}
                            {/* Receipts */}
                            {doc.type === "receipt" && doc.apiReceipt && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Share receipt link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = `${window.location.origin}/receipt/${doc.apiReceipt!.token}`;
                                    navigator.clipboard.writeText(link).then(
                                      () =>
                                        toast.success(
                                          "Receipt link copied to clipboard",
                                        ),
                                      () => toast.error("Failed to copy link"),
                                    );
                                  }}
                                >
                                  <Share2 className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Download PDF"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = receiptsApi.getDownloadUrl(
                                      doc.apiReceipt!.id,
                                    );
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `receipt-${doc.apiReceipt!.receipt_number}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }}
                                >
                                  <Download className="h-4 w-4 text-gray-500" />
                                </Button>
                              </div>
                            )}
                            {/* Offer Letters */}
                            {doc.type === "offer_letter" &&
                              doc.offerLetterData?.token && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Share offer letter link"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const link = `${window.location.origin}/offer-letters/${doc.offerLetterData!.token}`;
                                      navigator.clipboard.writeText(link).then(
                                        () =>
                                          toast.success(
                                            "Offer letter link copied to clipboard",
                                          ),
                                        () =>
                                          toast.error("Failed to copy link"),
                                      );
                                    }}
                                  >
                                    <Share2 className="h-4 w-4 text-gray-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Download PDF"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const url =
                                        offerLetterApi.getOfferLetterPdfUrl(
                                          doc.offerLetterData!.token,
                                        );
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = `offer-letter-${doc.offerLetterData!.token}.pdf`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                    }}
                                  >
                                    <Download className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </div>
                              )}
                            {/* Invoices */}
                            {doc.type === "invoice" && doc.invoiceId && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Share invoice link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = `${window.location.origin}/offer-letters/${doc.offerLetterData!.token}/invoice`;
                                    navigator.clipboard.writeText(link).then(
                                      () =>
                                        toast.success(
                                          "Invoice link copied to clipboard",
                                        ),
                                      () => toast.error("Failed to copy link"),
                                    );
                                  }}
                                >
                                  <Share2 className="h-4 w-4 text-gray-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Download PDF"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = invoiceApi.getInvoicePdfUrl(
                                      doc.invoiceId!,
                                    );
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `invoice-${doc.invoiceId!.substring(0, 8)}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }}
                                >
                                  <Download className="h-4 w-4 text-gray-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </TabsContent>

              {/* Whatsapp Tab */}
              <TabsContent value="chat" className="mt-6">
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() => setShowSendMessageModal(true)}
                    className="bg-[#FF5000] hover:bg-[#E64800] text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    {isLoadingChatLogs ? (
                      <div className="flex items-center justify-center py-12 bg-gray-100 rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-200 border-t-orange-500"></div>
                        <span className="ml-3 text-slate-600">
                          Loading chat history...
                        </span>
                      </div>
                    ) : (
                      <TenantChatHistory logs={chatLogs} />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {kycApplication && (
        <AttachTenantFromKycModal
          isOpen={showAttachToPropertyModal}
          onClose={() => {
            setShowAttachToPropertyModal(false);
            refetchTenantData();
          }}
          application={kycApplication}
        />
      )}

      {/* Offer Letter Preview Modal - Use OfferLetterViewModal for consistency */}
      {modalType === "offer_letter" && selectedDocument?.offerLetterData && (
        <OfferLetterViewModal
          isOpen={true}
          onClose={handleCloseModal}
          data={{
            applicantName: name,
            applicantEmail: tenant?.email || "",
            propertyName: selectedDocument.offerLetterData.propertyName || "",
            rentAmount: selectedDocument.offerLetterData.rentAmount || 0,
            rentFrequency:
              selectedDocument.offerLetterData.rentFrequency || "Annually",
            serviceCharge: selectedDocument.offerLetterData.serviceCharge || 0,
            cautionDeposit:
              selectedDocument.offerLetterData.cautionDeposit || 0,
            legalFee: selectedDocument.offerLetterData.legalFee || 0,
            agencyFee: selectedDocument.offerLetterData.agencyFee || 0,
            tenancyStartDate: selectedDocument.offerLetterData.tenancyStartDate
              ? new Date(
                  selectedDocument.offerLetterData.tenancyStartDate,
                ).toLocaleDateString("en-GB")
              : "",
            tenancyEndDate: selectedDocument.offerLetterData.tenancyEndDate
              ? new Date(
                  selectedDocument.offerLetterData.tenancyEndDate,
                ).toLocaleDateString("en-GB")
              : "",
            status: (
              selectedDocument.offerLetterData.status || ""
            ).toLowerCase() as "pending" | "accepted" | "rejected",
            signedAt: selectedDocument.offerLetterData.acceptedAt,
            otp: selectedDocument.offerLetterData.acceptanceOtp,
            signedByPhone: selectedDocument.offerLetterData.acceptedByPhone,
          }}
          stampType={
            selectedDocument.offerLetterData.status === "accepted" ||
            selectedDocument.offerLetterData.status === "selected"
              ? "accepted"
              : selectedDocument.offerLetterData.status === "rejected" ||
                  selectedDocument.offerLetterData.status === "declined"
                ? "rejected"
                : undefined
          }
        />
      )}

      {/* Invoice Preview Modal - Use InvoiceViewModal for consistency */}
      {modalType === "invoice" &&
        selectedDocument?.offerLetterData &&
        (() => {
          const offerData = selectedDocument.offerLetterData;
          const isPaid = offerData.paymentStatus === "fully_paid";

          // Build line items from offer letter data
          const lineItems = [];
          if (offerData.rentAmount) {
            lineItems.push({
              description: `Rent — ${offerData.rentFrequency || "Annual"}`,
              amount: offerData.rentAmount,
            });
          }
          if (offerData.serviceCharge) {
            lineItems.push({
              description: "Service Charge",
              amount: offerData.serviceCharge,
            });
          }
          if (offerData.cautionDeposit) {
            lineItems.push({
              description: "Caution Deposit",
              amount: offerData.cautionDeposit,
            });
          }
          if (offerData.legalFee) {
            lineItems.push({
              description: "Legal Fee",
              amount: offerData.legalFee,
            });
          }
          if (offerData.agencyFee) {
            lineItems.push({
              description: "Agency Fee",
              amount: offerData.agencyFee,
            });
          }

          const subtotal = lineItems.reduce(
            (sum, item) => sum + item.amount,
            0,
          );
          const total = subtotal;

          const invoiceData = {
            invoiceNumber:
              "INV-" +
              (selectedDocument.id || "").toString().slice(-6).toUpperCase(),
            invoiceDate:
              selectedDocument.date || new Date().toLocaleDateString("en-GB"),
            status: isPaid ? "Paid" : "Pending",
            tenantName: name,
            tenantEmail: tenant?.email || "",
            tenantPhone: tenant?.phone || "",
            propertyName: offerData.propertyName || "",
            propertyAddress: "",
            lineItems,
            subtotal,
            total,
            amountPaid: isPaid ? total : 0,
            amountDue: isPaid ? 0 : total,
            notes: "Payment due within 14 days of invoice date.",
            branding: profileData?.user?.branding as any,
          };

          return (
            <InvoiceViewModal
              isOpen={true}
              onClose={handleCloseModal}
              data={invoiceData}
              isPaid={isPaid}
              paymentDate={isPaid ? selectedDocument.date : undefined}
            />
          );
        })()}

      {/* Receipt Preview Modal - Use ReceiptViewModal for consistency */}
      {modalType === "receipt" && selectedDocument && (
        <ReceiptViewModal
          isOpen={true}
          onClose={handleCloseModal}
          data={{
            receiptNumber:
              selectedDocument.apiReceipt?.receipt_number ||
              selectedDocument.receiptData?.reference ||
              selectedDocument.receiptData?.id ||
              "",
            receiptDate: selectedDocument.apiReceipt?.receipt_date
              ? (() => {
                  const d = new Date(selectedDocument.apiReceipt!.receipt_date);
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
                })()
              : selectedDocument.receiptData?.paidAt || selectedDocument.date,
            paymentReference:
              selectedDocument.apiReceipt?.payment_reference ||
              selectedDocument.receiptData?.reference ||
              "",
            tenantName: selectedDocument.apiReceipt?.tenant_name || name,
            tenantEmail:
              selectedDocument.apiReceipt?.tenant_email || tenant?.email || "",
            tenantPhone:
              selectedDocument.apiReceipt?.tenant_phone ||
              tenant?.phone ||
              undefined,
            propertyName:
              selectedDocument.apiReceipt?.property_name ||
              selectedDocument.receiptData?.propertyName ||
              "",
            propertyAddress:
              selectedDocument.apiReceipt?.property_address || undefined,
            invoiceNumber: selectedDocument.apiReceipt?.invoice_number || "",
            amountPaid: selectedDocument.apiReceipt?.amount_paid
              ? Number(selectedDocument.apiReceipt.amount_paid)
              : selectedDocument.receiptData?.amountPaid || 0,
            paymentMethod:
              selectedDocument.apiReceipt?.payment_method ||
              selectedDocument.receiptData?.paymentMethod ||
              undefined,
            notes: selectedDocument.apiReceipt?.notes || undefined,
            branding: (selectedDocument.apiReceipt?.branding ||
              profileData?.user?.branding) as any,
          }}
          receiptId={selectedDocument.apiReceipt?.id}
          receiptToken={selectedDocument.apiReceipt?.token}
        />
      )}

      {/* Timeline event modals */}
      {showOfferLetterModal && offerLetterModalData && (
        <OfferLetterViewModal
          isOpen={showOfferLetterModal}
          onClose={() => {
            setShowOfferLetterModal(false);
            setOfferLetterModalData(null);
          }}
          data={offerLetterModalData.data}
          stampType={offerLetterModalData.stampType}
          stampMetadata={offerLetterModalData.stampMetadata}
        />
      )}

      {/* Invoice loading overlay */}
      {invoiceLoading && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-200 border-t-orange-500" />
            <p className="text-sm text-gray-600">Loading invoice...</p>
          </div>
        </div>
      )}

      {showInvoiceModal && invoiceModalData && (
        <InvoiceViewModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setInvoiceModalData(null);
          }}
          data={invoiceModalData.data}
          isPaid={invoiceModalData.isPaid}
          paymentDate={invoiceModalData.paymentDate}
        />
      )}

      {showReceiptModal && receiptModalData && (
        <ReceiptViewModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setReceiptModalData(null);
          }}
          data={{
            receiptNumber:
              receiptModalData.apiReceipt?.receipt_number ||
              receiptModalData.reference ||
              receiptModalData.id,
            receiptDate: receiptModalData.apiReceipt?.receipt_date
              ? (() => {
                  const d = new Date(receiptModalData.apiReceipt.receipt_date);
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
                })()
              : receiptModalData.paidAt || "",
            paymentReference:
              receiptModalData.apiReceipt?.payment_reference ||
              receiptModalData.reference,
            tenantName: receiptModalData.apiReceipt?.tenant_name || name,
            tenantEmail:
              receiptModalData.apiReceipt?.tenant_email || tenant?.email || "",
            tenantPhone:
              receiptModalData.apiReceipt?.tenant_phone || tenant?.phone || "",
            propertyName:
              receiptModalData.apiReceipt?.property_name ||
              receiptModalData.propertyName,
            propertyAddress:
              receiptModalData.apiReceipt?.property_address || "",
            invoiceNumber: receiptModalData.apiReceipt?.invoice_number || "",
            amountPaid: receiptModalData.apiReceipt?.amount_paid
              ? Number(receiptModalData.apiReceipt.amount_paid)
              : receiptModalData.amountPaid,
            paymentMethod:
              receiptModalData.apiReceipt?.payment_method ||
              receiptModalData.paymentMethod ||
              undefined,
            notes: receiptModalData.apiReceipt?.notes || undefined,
            branding: (receiptModalData.apiReceipt?.branding ||
              profileData?.user?.branding) as any,
          }}
        />
      )}

      {showServiceRequestModal && serviceRequestData && (
        <ServiceRequestInfoModal
          isOpen={showServiceRequestModal}
          onClose={() => {
            setShowServiceRequestModal(false);
            setServiceRequestData(null);
          }}
          data={serviceRequestData}
        />
      )}

      {/* Renewal Invoice Modal */}
      {showRenewalInvoiceModal && renewalInvoiceModalData && (
        <RenewalInvoiceViewModal
          isOpen={showRenewalInvoiceModal}
          onClose={() => {
            setShowRenewalInvoiceModal(false);
            setRenewalInvoiceModalData(null);
          }}
          data={renewalInvoiceModalData}
        />
      )}

      {/* Tenancy Info Modal */}
      <Dialog
        open={showTenancyInfoModal}
        onOpenChange={() => {
          setShowTenancyInfoModal(false);
          setTenancyInfoModalData(null);
        }}
      >
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Tenancy Information</DialogTitle>
            {tenancyInfoModalData && (
              <p className="text-sm text-gray-500 mt-1">
                {tenancyInfoModalData.property} · Submitted{" "}
                {tenancyInfoModalData.submittedDate}
              </p>
            )}
          </DialogHeader>

          {tenancyInfoModalData && (
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
                      {tenancyInfoModalData.intendedUse}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Number of Occupants:</span>
                    <span className="text-gray-900 font-medium">
                      {tenancyInfoModalData.occupants}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Vehicle / Parking:</span>
                    <span className="text-gray-900 font-medium">
                      {tenancyInfoModalData.vehicle}
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
                      ₦{tenancyInfoModalData.proposedRent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Frequency:</span>
                    <span className="text-gray-900 font-medium">
                      {tenancyInfoModalData.frequency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              {tenancyInfoModalData.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3">
                    Additional Notes
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {tenancyInfoModalData.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Outstanding Balance Modal */}
      <Dialog
        open={showOutstandingBalanceModal}
        onOpenChange={() => {
          setShowOutstandingBalanceModal(false);
          setOutstandingBalanceModalData(null);
        }}
      >
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Outstanding Balance Recorded</DialogTitle>
          </DialogHeader>
          {outstandingBalanceModalData && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Description
                </label>
                <p className="text-sm text-gray-900">
                  {outstandingBalanceModalData.amount}
                </p>
              </div>
              {outstandingBalanceModalData.details && (
                <div>
                  <label className="text-sm text-gray-500 block mb-1">
                    Reason
                  </label>
                  <p className="text-sm text-gray-900">
                    {outstandingBalanceModalData.details}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Date Recorded
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(
                    outstandingBalanceModalData.date,
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Outstanding Balance Breakdown Modal */}
      <Dialog
        open={showOutstandingBreakdownModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowOutstandingBreakdownModal(false);
            setIsAdjustingBalance(false);
          }
        }}
      >
        <DialogContent
          className="w-[98vw] !max-w-[98vw] max-h-[90vh] overflow-y-auto"
          data-modal="outstanding-balance"
        >
          <DialogHeader>
            <DialogTitle>Outstanding Balance Breakdown</DialogTitle>
          </DialogHeader>

          {/* Download button (hidden in edit mode) */}
          {!isAdjustingBalance && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="absolute right-10 top-4 rounded-sm opacity-70 hover:opacity-100 p-0.5 text-gray-500 hover:text-gray-700 transition-opacity disabled:opacity-50"
              title="Download breakdown"
            >
              <Download className={`w-4 h-4 ${downloading ? "animate-bounce" : ""}`} />
            </button>
          )}

          {(() => {
            // Derive displayed balance from current committed rows
            const displayedBalance = breakdownRows.reduce(
              (sum, r) => sum + (parseFloat(r.amount) || 0),
              0,
            );
            // Draft balance (live while editing)
            const draftBalance = breakdownDraft.reduce(
              (sum, r) => sum + (parseFloat(r.amount) || 0),
              0,
            );
            const activeBalance = isAdjustingBalance ? draftBalance : displayedBalance;

            const formatRowDate = (iso: string) => {
              const d = new Date(iso);
              return isNaN(d.getTime())
                ? iso
                : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            };

            return (
              <div className="space-y-5 mt-4">
                {/* Balance header + Adjust Balance button */}
                <div className="flex items-end justify-between gap-4">
                  <div>
                    {activeBalance < 0 ? (
                      <>
                        <p className="text-sm text-slate-500 mb-1">Credit Balance</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {formatNaira(Math.abs(activeBalance))}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Automatically applied to the next rent cycle
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-500 mb-1">Outstanding Balance</p>
                        <p className="text-2xl font-semibold text-orange-600">
                          {formatNaira(activeBalance)}
                        </p>
                      </>
                    )}
                  </div>

                  {!isAdjustingBalance ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-slate-300 text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setBreakdownDraft(breakdownRows.map((r) => ({ ...r })));
                        setIsAdjustingBalance(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Adjust Balance
                    </Button>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-300 text-slate-600"
                        onClick={() => {
                          setBreakdownDraft(breakdownRows.map((r) => ({ ...r })));
                          setIsAdjustingBalance(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#FF5000] hover:bg-[#E64500] text-white"
                        onClick={() => {
                          setBreakdownRows(breakdownDraft.map((r) => ({ ...r })));
                          setIsAdjustingBalance(false);
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Edit mode notice */}
                {isAdjustingBalance && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    Edit mode — modify amounts, descriptions, or dates. Delete rows with ×. Changes apply when you save.
                  </p>
                )}

                {breakdownDraft.length === 0 && !isAdjustingBalance ? (
                  <p className="text-sm text-slate-400 text-center py-4">No transactions yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${isAdjustingBalance ? "border-amber-200 bg-amber-50/50" : "border-slate-200"}`}>
                          <th className="text-left py-3 px-3 text-slate-500 font-medium whitespace-nowrap w-[120px]">Date</th>
                          <th className="text-left py-3 px-3 text-slate-500 font-medium">Description</th>
                          <th className="text-right py-3 px-3 text-slate-500 font-medium whitespace-nowrap w-[140px]">Amount</th>
                          <th className="text-right py-3 px-3 text-slate-500 font-medium whitespace-nowrap w-[140px]">Balance</th>
                          {isAdjustingBalance && <th className="w-8" />}
                        </tr>
                      </thead>
                      <tbody>
                        {(isAdjustingBalance ? breakdownDraft : breakdownRows).map((row, index) => {
                          const rows = isAdjustingBalance ? breakdownDraft : breakdownRows;
                          const runningBalance = rows
                            .slice(0, index + 1)
                            .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
                          const amt = parseFloat(row.amount) || 0;

                          return (
                            <tr
                              key={row.id}
                              className={`border-b last:border-b-0 ${
                                isAdjustingBalance
                                  ? "border-amber-100 bg-amber-50/30 hover:bg-amber-50/60"
                                  : "border-slate-100"
                              }`}
                            >
                              {/* Date */}
                              <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                                {isAdjustingBalance ? (
                                  <input
                                    type="date"
                                    value={row.date}
                                    onChange={(e) => {
                                      setBreakdownDraft((prev) =>
                                        prev.map((r) => r.id === row.id ? { ...r, date: e.target.value } : r)
                                      );
                                    }}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF5000] focus:border-[#FF5000]"
                                  />
                                ) : (
                                  formatRowDate(row.date)
                                )}
                              </td>

                              {/* Description */}
                              <td className="py-3 px-3 text-slate-700">
                                {isAdjustingBalance ? (
                                  <input
                                    type="text"
                                    value={row.description}
                                    onChange={(e) => {
                                      setBreakdownDraft((prev) =>
                                        prev.map((r) => r.id === row.id ? { ...r, description: e.target.value } : r)
                                      );
                                    }}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF5000] focus:border-[#FF5000]"
                                  />
                                ) : (
                                  row.description
                                )}
                              </td>

                              {/* Amount */}
                              <td className={`py-3 px-3 text-right whitespace-nowrap font-medium ${amt < 0 ? "text-emerald-600" : "text-slate-900"}`}>
                                {isAdjustingBalance ? (
                                  <input
                                    type="number"
                                    value={row.amount}
                                    onChange={(e) => {
                                      setBreakdownDraft((prev) =>
                                        prev.map((r) => r.id === row.id ? { ...r, amount: e.target.value } : r)
                                      );
                                    }}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#FF5000] focus:border-[#FF5000]"
                                  />
                                ) : (
                                  amt < 0
                                    ? `-₦${Math.abs(amt).toLocaleString()}`
                                    : `+₦${amt.toLocaleString()}`
                                )}
                              </td>

                              {/* Running balance */}
                              <td className={`py-3 px-3 text-right whitespace-nowrap font-medium ${
                                runningBalance > 0 ? "text-orange-600" : runningBalance < 0 ? "text-emerald-600" : "text-slate-900"
                              }`}>
                                {runningBalance < 0
                                  ? `Credit ₦${Math.abs(runningBalance).toLocaleString()}`
                                  : formatNaira(runningBalance)}
                              </td>

                              {/* Delete button (edit mode only) */}
                              {isAdjustingBalance && (
                                <td className="py-3 px-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setBreakdownDraft((prev) => prev.filter((r) => r.id !== row.id))
                                    }
                                    className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded"
                                    title="Delete row"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* History Detail Modal */}
      <Dialog
        open={showHistoryDetailModal}
        onOpenChange={() => {
          setShowHistoryDetailModal(false);
          setHistoryDetailData(null);
        }}
      >
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>History Event Details</DialogTitle>
          </DialogHeader>
          {historyDetailData && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Event Type
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {historyDetailData.type}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Property
                </label>
                <p className="text-sm text-gray-900">
                  {historyDetailData.propertyName}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Tenant
                </label>
                <p className="text-sm text-gray-900">
                  {historyDetailData.tenantName}
                </p>
              </div>

              {/* Tenancy-specific details */}
              {historyDetailData.type === "Historical Tenancy" && (
                <>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">
                      Tenancy Period
                    </label>
                    <p className="text-sm text-gray-900">
                      {historyDetailData.startDate} –{" "}
                      {historyDetailData.endDate}
                    </p>
                  </div>
                  {(historyDetailData.rentAmount ?? 0) > 0 && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">
                        Rent
                      </label>
                      <p className="text-sm text-gray-900">
                        ₦{(historyDetailData.rentAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {(historyDetailData.serviceCharge ?? 0) > 0 && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">
                        Service Charge
                      </label>
                      <p className="text-sm text-gray-900">
                        ₦
                        {(
                          historyDetailData.serviceCharge || 0
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">
                      Outstanding Balance
                    </label>
                    <p className="text-sm text-orange-600 font-medium">
                      ₦{(historyDetailData.totalAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </>
              )}

              {/* Payment-specific details */}
              {historyDetailData.type === "Historical Payment" && (
                <>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">
                      Amount Paid
                    </label>
                    <p className="text-sm text-green-700 font-medium">
                      ₦{(historyDetailData.paymentAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  {historyDetailData.paymentDate && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">
                        Payment Date
                      </label>
                      <p className="text-sm text-gray-900">
                        {historyDetailData.paymentDate}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Fee-specific details */}
              {historyDetailData.type === "Historical Fee" && (
                <>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">
                      Fee Description
                    </label>
                    <p className="text-sm text-gray-900">
                      {historyDetailData.feeDescription}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">
                      Fee Amount
                    </label>
                    <p className="text-sm text-red-700 font-medium">
                      ₦{(historyDetailData.feeAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  {historyDetailData.feeDate && (
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">
                        Fee Date
                      </label>
                      <p className="text-sm text-gray-900">
                        {historyDetailData.feeDate}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Generic details for legacy user-added events */}
              {historyDetailData.type !== "Historical Tenancy" &&
                historyDetailData.type !== "Historical Payment" &&
                historyDetailData.type !== "Historical Fee" && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">
                        Description
                      </label>
                      <p className="text-sm text-gray-900">
                        {historyDetailData.description}
                      </p>
                    </div>
                    {historyDetailData.amount && (
                      <div>
                        <label className="text-sm text-gray-500 block mb-1">
                          Amount
                        </label>
                        <p className="text-sm text-gray-900">
                          ₦{Number(historyDetailData.amount).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                )}

              <div>
                <label className="text-sm text-gray-500 block mb-1">
                  Recorded
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(historyDetailData.date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                  {" at "}
                  {new Date(historyDetailData.date).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    },
                  )}
                </p>
              </div>

              {/* Actions footer — only for editable user-added event types */}
              {(historyDetailData.type === "Historical Tenancy" ||
                historyDetailData.type === "Historical Payment" ||
                historyDetailData.type === "Historical Fee") && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-green-600">Manually added</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const d = historyDetailData;
                        setShowHistoryDetailModal(false);
                        setHistoryDetailData(null);
                        setEditingHistoryEntryId(d.id);

                        if (d.type === "Historical Tenancy") {
                          setHistoryForm({
                            type: "Tenancy",
                            property: d.propertyName,
                            propertyId: d.propertyId || "",
                            tenancyStartDate: d.rawMoveInDate
                              ? new Date(d.rawMoveInDate)
                              : null,
                            tenancyEndDate: d.rawMoveOutDate
                              ? new Date(d.rawMoveOutDate)
                              : null,
                            rentAmount: d.rentAmount
                              ? d.rentAmount.toLocaleString()
                              : "",
                            serviceChargeAmount: d.serviceCharge
                              ? d.serviceCharge.toLocaleString()
                              : "",
                            otherFees: (d.otherFees || []).map((f) => ({
                              name: f.name,
                              amount: f.amount ? f.amount.toLocaleString() : "",
                            })),
                            paymentAmount: "",
                            paymentDate: null,
                            feeAmount: "",
                            feeDescription: "",
                            feeDate: null,
                          });
                          setPropertySearch(d.propertyName);
                        } else if (d.type === "Historical Payment") {
                          setHistoryForm({
                            type: "Payment",
                            property: d.propertyName,
                            propertyId: d.propertyId || "",
                            tenancyStartDate: null,
                            tenancyEndDate: null,
                            rentAmount: "",
                            serviceChargeAmount: "",
                            otherFees: [],
                            paymentAmount: d.paymentAmount
                              ? d.paymentAmount.toLocaleString()
                              : "",
                            paymentDate: d.rawPaymentDate
                              ? new Date(d.rawPaymentDate)
                              : null,
                            feeAmount: "",
                            feeDescription: "",
                            feeDate: null,
                          });
                          setPropertySearch(d.propertyName);
                        } else if (d.type === "Historical Fee") {
                          setHistoryForm({
                            type: "Fee",
                            property: d.propertyName,
                            propertyId: d.propertyId || "",
                            tenancyStartDate: null,
                            tenancyEndDate: null,
                            rentAmount: "",
                            serviceChargeAmount: "",
                            otherFees: [],
                            paymentAmount: "",
                            paymentDate: null,
                            feeAmount: d.feeAmount
                              ? d.feeAmount.toLocaleString()
                              : "",
                            feeDescription: d.feeDescription || "",
                            feeDate: d.rawFeeDate
                              ? new Date(d.rawFeeDate)
                              : null,
                          });
                          setPropertySearch(d.propertyName);
                        }

                        setShowAddHistoryModal(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        const d = historyDetailData;
                        try {
                          await axiosInstance.delete(
                            `/property-history/${d.id}`,
                          );
                          toast.success("History entry deleted");
                          setShowHistoryDetailModal(false);
                          setHistoryDetailData(null);
                          refetchTenantData();
                        } catch (error: any) {
                          toast.error(
                            error?.response?.data?.message ||
                              "Failed to delete history entry",
                          );
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add History Entry Modal */}
      <Dialog
        open={showAddHistoryModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddHistoryModal(false);
            resetHistoryForm();
          } else {
            setShowAddHistoryModal(true);
          }
        }}
      >
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHistoryEntryId
                ? "Edit History Entry"
                : "Add History Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Event Type */}
            <div>
              <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                Event Type
              </label>
              <Select
                value={historyForm.type}
                onValueChange={(value) =>
                  setHistoryForm((prev) => ({
                    ...prev,
                    type: value as "Tenancy" | "Payment",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tenancy">Tenancy</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="Fee">Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tenancy Flow */}
            {historyForm.type === "Tenancy" && (
              <>
                {/* Property Name */}
                <div>
                  <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                    Property Name
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Select property"
                        value={propertySearch}
                        onChange={(e) => {
                          setPropertySearch(e.target.value);
                          setShowPropertyDropdown(true);
                        }}
                        onFocus={() => setShowPropertyDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowPropertyDropdown(false), 200)
                        }
                        className="pl-9"
                      />
                    </div>
                    {showPropertyDropdown &&
                      filteredPropertyOptions.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                          {filteredPropertyOptions.map((option: any) => (
                            <div
                              key={option.id}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setHistoryForm((prev) => ({
                                  ...prev,
                                  property: option.name,
                                  propertyId: option.id,
                                }));
                                setPropertySearch(option.name);
                                setShowPropertyDropdown(false);
                              }}
                            >
                              {option.name}
                              {option.location ? ` — ${option.location}` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Tenancy Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                      Tenancy Start Date
                    </label>
                    <DatePickerInput
                      value={historyForm.tenancyStartDate ?? undefined}
                      onChange={(date) =>
                        setHistoryForm((prev) => ({
                          ...prev,
                          tenancyStartDate: date ?? null,
                        }))
                      }
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                      Tenancy End Date
                    </label>
                    <DatePickerInput
                      value={historyForm.tenancyEndDate ?? undefined}
                      onChange={(date) =>
                        setHistoryForm((prev) => ({
                          ...prev,
                          tenancyEndDate: date ?? null,
                        }))
                      }
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                {/* Financial Fields */}
                <div>
                  <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                    Rent Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ₦
                    </span>
                    <Input
                      type="text"
                      placeholder="0"
                      value={historyForm.rentAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setHistoryForm((prev) => ({
                          ...prev,
                          rentAmount: raw ? parseInt(raw).toLocaleString() : "",
                        }));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                    Service Charge Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ₦
                    </span>
                    <Input
                      type="text"
                      placeholder="0"
                      value={historyForm.serviceChargeAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setHistoryForm((prev) => ({
                          ...prev,
                          serviceChargeAmount: raw
                            ? parseInt(raw).toLocaleString()
                            : "",
                        }));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>

                {/* Other Fees */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs sm:text-sm text-gray-500">
                      Other Fees
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryForm((prev) => ({
                          ...prev,
                          otherFees: [
                            ...prev.otherFees,
                            { name: "", amount: "" },
                          ],
                        }))
                      }
                      className="flex items-center gap-1 text-xs text-[#FF5000] hover:text-[#E64800] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Fee
                    </button>
                  </div>
                  {historyForm.otherFees.length > 0 && (
                    <div className="space-y-2">
                      {historyForm.otherFees.map((fee, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Fee name"
                            value={fee.name}
                            onChange={(e) => {
                              const updated = [...historyForm.otherFees];
                              updated[index] = {
                                ...updated[index],
                                name: e.target.value,
                              };
                              setHistoryForm((prev) => ({
                                ...prev,
                                otherFees: updated,
                              }));
                            }}
                            className="flex-1"
                          />
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                              ₦
                            </span>
                            <Input
                              type="text"
                              placeholder="0"
                              value={fee.amount}
                              onChange={(e) => {
                                const raw = e.target.value.replace(
                                  /[^0-9]/g,
                                  "",
                                );
                                const updated = [...historyForm.otherFees];
                                updated[index] = {
                                  ...updated[index],
                                  amount: raw
                                    ? parseInt(raw).toLocaleString()
                                    : "",
                                };
                                setHistoryForm((prev) => ({
                                  ...prev,
                                  otherFees: updated,
                                }));
                              }}
                              className="pl-7"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = historyForm.otherFees.filter(
                                (_, i) => i !== index,
                              );
                              setHistoryForm((prev) => ({
                                ...prev,
                                otherFees: updated,
                              }));
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Outstanding */}
                {tenancyTotal > 0 && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Outstanding Balance
                    </span>
                    <span className="text-sm text-orange-600 font-medium">
                      ₦{tenancyTotal.toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Payment Flow */}
            {historyForm.type === "Payment" && (
              <>
                <div>
                  <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ₦
                    </span>
                    <Input
                      type="text"
                      placeholder="0"
                      value={historyForm.paymentAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setHistoryForm((prev) => ({
                          ...prev,
                          paymentAmount: raw
                            ? parseInt(raw).toLocaleString()
                            : "",
                        }));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                    Payment Date
                  </label>
                  <DatePickerInput
                    value={historyForm.paymentDate ?? undefined}
                    onChange={(date) =>
                      setHistoryForm((prev) => ({
                        ...prev,
                        paymentDate: date ?? null,
                      }))
                    }
                    placeholder="Select payment date"
                  />
                </div>
              </>
            )}

            {/* Fee Flow */}
            {historyForm.type === "Fee" && (
              <>
                <div>
                  <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                    Fee Description
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., charge for broken window"
                    value={historyForm.feeDescription}
                    onChange={(e) =>
                      setHistoryForm((prev) => ({
                        ...prev,
                        feeDescription: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                    Fee Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ₦
                    </span>
                    <Input
                      type="text"
                      placeholder="0"
                      value={historyForm.feeAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setHistoryForm((prev) => ({
                          ...prev,
                          feeAmount: raw ? parseInt(raw).toLocaleString() : "",
                        }));
                      }}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                    Fee Date (Optional)
                  </label>
                  <DatePickerInput
                    value={historyForm.feeDate ?? undefined}
                    onChange={(date) =>
                      setHistoryForm((prev) => ({
                        ...prev,
                        feeDate: date ?? null,
                      }))
                    }
                    placeholder="Select fee date (optional)"
                  />
                </div>
              </>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSaveHistoryEntry}
              className="w-full bg-[#FF5000] hover:bg-[#E64800] text-white"
              disabled={
                !historyForm.type ||
                (historyForm.type === "Tenancy" &&
                  (!historyForm.property ||
                    !historyForm.tenancyStartDate ||
                    !historyForm.tenancyEndDate ||
                    !historyForm.rentAmount)) ||
                (historyForm.type === "Payment" &&
                  (!historyForm.paymentAmount || !historyForm.paymentDate)) ||
                (historyForm.type === "Fee" &&
                  (!historyForm.feeAmount || !historyForm.feeDescription)) ||
                isSubmittingHistory
              }
            >
              {isSubmittingHistory
                ? "Saving..."
                : editingHistoryEntryId
                  ? "Save Changes"
                  : "Save Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generate Invoice Modal */}
      <Dialog
        open={showGenerateInvoiceModal}
        onOpenChange={(open) => { if (!open) { setShowGenerateInvoiceModal(false); resetInvoiceModal(); } }}
      >
        <DialogContent className="bg-white max-w-lg max-h-[90vh] overflow-y-auto">
          {invoiceStep === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle>Generate Invoice</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Tenant (read-only) */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Tenant</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900">
                    {name || "—"}
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Invoice Items <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {invoiceForm.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Fee name (e.g. Diesel Fee)"
                            value={item.feeName}
                            onChange={(e) => {
                              const items = [...invoiceForm.items];
                              items[idx] = { ...items[idx], feeName: e.target.value };
                              setInvoiceForm((f) => ({ ...f, items }));
                              const errs = [...invoiceItemErrors];
                              errs[idx] = { ...errs[idx], feeName: "" };
                              setInvoiceItemErrors(errs);
                            }}
                            className={invoiceItemErrors[idx]?.feeName ? "border-red-500" : ""}
                          />
                          {invoiceItemErrors[idx]?.feeName && (
                            <p className="text-xs text-red-500">{invoiceItemErrors[idx].feeName}</p>
                          )}
                        </div>
                        <div className="w-36 space-y-1">
                          <Input
                            placeholder="Amount"
                            value={item.amount}
                            onChange={(e) => {
                              const items = [...invoiceForm.items];
                              items[idx] = { ...items[idx], amount: e.target.value };
                              setInvoiceForm((f) => ({ ...f, items }));
                              const errs = [...invoiceItemErrors];
                              errs[idx] = { ...errs[idx], amount: "" };
                              setInvoiceItemErrors(errs);
                            }}
                            className={invoiceItemErrors[idx]?.amount ? "border-red-500" : ""}
                          />
                          {invoiceItemErrors[idx]?.amount && (
                            <p className="text-xs text-red-500">{invoiceItemErrors[idx].amount}</p>
                          )}
                        </div>
                        {invoiceForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
                              setInvoiceItemErrors((e) => e.filter((_, i) => i !== idx));
                            }}
                            className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceForm((f) => ({ ...f, items: [...f.items, { feeName: "", amount: "" }] }));
                      setInvoiceItemErrors((e) => [...e, { feeName: "", amount: "" }]);
                    }}
                    className="mt-3 flex items-center gap-1.5 text-sm text-[#FF5000] hover:text-[#E64500] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>

                  {/* Total */}
                  <div className="mt-4 flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-md border border-gray-200">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₦{invoiceTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <DatePickerInput
                    value={invoiceForm.dueDate}
                    onChange={(date) => {
                      setInvoiceForm((f) => ({ ...f, dueDate: date }));
                      setInvoiceDueDateError("");
                    }}
                    placeholder="Select due date"
                    className={invoiceDueDateError ? "border-red-500" : ""}
                  />
                  {invoiceDueDateError && (
                    <p className="text-xs text-red-500 mt-1">{invoiceDueDateError}</p>
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Frequency</label>
                  <Select
                    value={invoiceForm.frequency}
                    onValueChange={(v) => setInvoiceForm((f) => ({ ...f, frequency: v as typeof f.frequency }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => { setShowGenerateInvoiceModal(false); resetInvoiceModal(); }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#FF5000] hover:bg-[#E64500] text-white"
                  onClick={() => { if (validateInvoiceForm()) setInvoiceStep("preview"); }}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Invoice Preview</DialogTitle>
              </DialogHeader>

              {/* Preview layout */}
              <div className="py-2">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Invoice header */}
                  <div className="bg-[#FF5000] px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-xs uppercase tracking-wide mb-1">Invoice</p>
                        <p className="text-white font-semibold text-lg">#{String(Date.now()).slice(-6)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-xs mb-0.5">Date Issued</p>
                        <p className="text-white text-sm">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Billed to / Due date row */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Billed To</p>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      {tenant?.phone && <p className="text-xs text-gray-500 mt-0.5">{tenant.phone}</p>}
                      {tenant?.email && <p className="text-xs text-gray-500">{tenant.email}</p>}
                    </div>
                    <div className="sm:text-right">
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Due Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {invoiceForm.dueDate
                            ? invoiceForm.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Frequency</p>
                        <p className="text-sm text-gray-900 capitalize">{invoiceForm.frequency.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="px-6 py-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 text-xs text-gray-500 font-medium uppercase tracking-wide">Description</th>
                          <th className="text-right py-2 text-xs text-gray-500 font-medium uppercase tracking-wide">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceForm.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-50 last:border-0">
                            <td className="py-3 text-gray-900">{item.feeName}</td>
                            <td className="py-3 text-right text-gray-900">
                              ₦{(parseFloat(item.amount.replace(/,/g, "")) || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total row */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Due</span>
                    <span className="text-lg font-bold text-[#FF5000]">₦{invoiceTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setInvoiceStep("form")}
                >
                  Back / Edit
                </Button>
                <Button
                  className="bg-[#FF5000] hover:bg-[#E64500] text-white"
                  onClick={() => {
                    // Push recurring items into the shared store so Property Detail reflects them
                    if (invoiceForm.frequency !== "one_time" && tenant?.property) {
                      invoiceForm.items.forEach((item) => {
                        const amount = parseFloat(item.amount.replace(/,/g, ""));
                        if (item.feeName.trim() && !isNaN(amount) && amount > 0) {
                          addRecurringCharge(tenant.property!, {
                            id: `rc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            feeName: item.feeName.trim(),
                            amount,
                            frequency: invoiceForm.frequency,
                            nextDueDate: invoiceForm.dueDate
                              ? formatLocalDate(invoiceForm.dueDate)
                              : new Date().toISOString().split("T")[0],
                          });
                        }
                      });
                    }
                    setShowGenerateInvoiceModal(false);
                    resetInvoiceModal();
                    toast.success("Invoice generated successfully");
                  }}
                >
                  Confirm &amp; Generate Invoice
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send WhatsApp Message Modal */}
      <Dialog
        open={showSendMessageModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowSendMessageModal(false);
            setCustomMessage("");
          }
        }}
      >
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs sm:text-sm text-gray-500 mb-1 block">
                Message
              </label>
              <Textarea
                placeholder="Type your message here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleSendCustomMessage}
              className="w-full bg-[#FF5000] hover:bg-[#E64800] text-white"
              disabled={!customMessage.trim() || isSendingMessage}
            >
              {isSendingMessage ? "Sending..." : "Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
