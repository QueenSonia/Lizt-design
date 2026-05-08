/* eslint-disable */

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Briefcase,
  FileText,
  Send,
  Mail,
  ArrowLeft,
  Download,
  Plus,
  Trash2,
  Receipt,
  Pencil,
  Wallet,
  X,
} from "lucide-react";
import {
  addWalletFee,
  getWalletBalance,
  getWalletFees,
  subscribeToWalletFees,
  type WalletFee,
} from "@/lib/applicantWalletStore";
import { Input } from "@/components/ui/input";
import {
  OutstandingBalanceBreakdownCard,
  DUMMY_OUTSTANDING_BREAKDOWN,
} from "@/components/OutstandingBalanceBreakdownCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  LandlordKYCApplicationDetailHistory,
  HistoryEvent,
} from "./LandlordKYCApplicationDetailHistory";
import { IKycApplication } from "@/types/kyc-application";
import {
  OutstandingBalanceBreakdown,
  OutstandingBalanceTransaction,
} from "@/types/tenant";
import { useResendKYCCompletionLinkMutation } from "@/services/property/mutation";
import { useProfile } from "@/services/users/query";
import {
  OfferLetterViewModal,
  OfferLetterData,
} from "./modals/OfferLetterViewModal";
import { InvoiceViewModal, InvoiceData } from "./InvoiceViewModal";
import { ReceiptViewModal, ReceiptData } from "./ReceiptViewModal";
import { TenantChatHistory } from "@/components/TenantChatHistory";
import { addRecurringCharge } from "@/lib/recurringChargesStore";
import { ReceiptReviewModal } from "@/components/ReceiptReviewModal";
import { toast } from "sonner";

type KYCApplication = IKycApplication;

interface LandlordKYCApplicationDetailProps {
  application: KYCApplication | null;
  propertyName: string;
  propertyAddress?: string;
  propertyStatus: "Occupied" | "Vacant" | "Inactive";
  showTenancyInfo?: boolean;
  outstandingBalance?: number;
  creditBalance?: number;
  outstandingBalanceBreakdown?: OutstandingBalanceBreakdown[];
  paymentTransactions?: OutstandingBalanceTransaction[];
  onBack: () => void;
  onAttachTenant?: () => void;
  onDownloadPDF?: () => void;
  onViewOfferLetter?: () => void;
}

export function LandlordKYCApplicationDetail({
  application,
  propertyName,
  propertyAddress = "",
  showTenancyInfo = false,
  outstandingBalance = 0,
  creditBalance = 0,
  outstandingBalanceBreakdown = [],
  paymentTransactions = [],
  onBack,
  onAttachTenant,
  onDownloadPDF,
  onViewOfferLetter,
}: LandlordKYCApplicationDetailProps) {
  const router = useRouter();
  const params = useParams();
  const userRole = Array.isArray(params?.role) ? params.role[0] : params?.role || "landlord";

  const handlePropertyClick = () => {
    if (application?.propertyId && application.propertyId !== "0") {
      router.push(`/${userRole}/property-detail?propertyId=${application.propertyId}`);
    }
  };

  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "whatsapp" | "history"
  >("overview");

  // Balance breakdown modal
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Breakdown edit mode
  interface BreakdownRow { id: string; date: string; description: string; amount: string; }
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);
  const [breakdownRows, setBreakdownRows] = useState<BreakdownRow[]>([]);
  const [breakdownDraft, setBreakdownDraft] = useState<BreakdownRow[]>([]);

  // Document modals
  const [showOfferLetterModal, setShowOfferLetterModal] = useState(false);
  const [selectedOfferLetterData, setSelectedOfferLetterData] =
    useState<OfferLetterData | null>(null);
  const [offerLetterStampType, setOfferLetterStampType] = useState<
    "accepted" | "rejected" | undefined
  >(undefined);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] =
    useState<InvoiceData | null>(null);
  const [invoiceIsPaid, setInvoiceIsPaid] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptData, setSelectedReceiptData] =
    useState<ReceiptData | null>(null);

  // Generate Invoice modal
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState<"form" | "preview">("form");
  const [invoiceForm, setInvoiceForm] = useState<{
    items: { feeName: string; amount: string }[];
    dueDate: Date | null;
    frequency: "one_time" | "weekly" | "monthly" | "quarterly" | "annually";
  }>({ items: [{ feeName: "", amount: "" }], dueDate: null, frequency: "one_time" });
  const [invoiceItemErrors, setInvoiceItemErrors] = useState<{ feeName: string; amount: string }[]>([{ feeName: "", amount: "" }]);
  const [invoiceDueDateError, setInvoiceDueDateError] = useState("");

  const tenantName = application
    ? `${(application as any).name || (application as any).firstName || ""}`.trim()
    : "";

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

  // Fetch current landlord profile for branding
  const { data: profileData } = useProfile();

  // WhatsApp chat
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [isLoadingChatLogs, setIsLoadingChatLogs] = useState(false);

  // ─── Wallet (applicant fee tracker) ──────────────────────────────────────
  const [walletFees, setWalletFees] = useState<WalletFee[]>(() =>
    getWalletFees(application.id),
  );
  useEffect(() => {
    setWalletFees(getWalletFees(application.id));
    return subscribeToWalletFees(() => {
      setWalletFees(getWalletFees(application.id));
    });
  }, [application.id]);
  const walletBalance = walletFees.reduce((sum, f) => sum + f.amount, 0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState<{
    feeName: string;
    amount: string;
    paymentDate: Date | null;
  }>({ feeName: "", amount: "", paymentDate: null });
  const [feeFormErrors, setFeeFormErrors] = useState<{
    feeName: string;
    amount: string;
    paymentDate: string;
  }>({ feeName: "", amount: "", paymentDate: "" });
  const resetFeeForm = () => {
    setFeeForm({ feeName: "", amount: "", paymentDate: null });
    setFeeFormErrors({ feeName: "", amount: "", paymentDate: "" });
  };
  const handleSaveFee = () => {
    const errs = { feeName: "", amount: "", paymentDate: "" };
    if (!feeForm.feeName.trim()) errs.feeName = "Fee name is required";
    const amountNum = parseFloat(feeForm.amount.replace(/,/g, ""));
    if (!feeForm.amount.trim() || !Number.isFinite(amountNum) || amountNum <= 0)
      errs.amount = "Enter a valid amount";
    if (!feeForm.paymentDate) errs.paymentDate = "Payment date is required";
    setFeeFormErrors(errs);
    if (errs.feeName || errs.amount || errs.paymentDate) return;
    addWalletFee(application.id, {
      id: `fee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      feeName: feeForm.feeName.trim(),
      amount: amountNum,
      paymentDate: feeForm.paymentDate!.toISOString(),
    });
    setShowAddFeeModal(false);
    resetFeeForm();
  };

  const resendKYCMutation = useResendKYCCompletionLinkMutation();

  // ─── Add History ─────────────────────────────────────────────────────────
  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
  const [manualHistoryEvents, setManualHistoryEvents] = useState<HistoryEvent[]>([]);
  const [historyForm, setHistoryForm] = useState<{
    type: "" | "Tenancy" | "Payment" | "Fee";
    property: string;
    tenancyStartDate: Date | null;
    tenancyEndDate: Date | null;
    rentAmount: string;
    serviceChargeAmount: string;
    otherFees: { name: string; amount: string }[];
    paymentAmount: string;
    paymentDate: Date | null;
    paymentDescription: string;
    feeAmount: string;
    feeDescription: string;
    feeDate: Date | null;
  }>({
    type: "",
    property: "",
    tenancyStartDate: null,
    tenancyEndDate: null,
    rentAmount: "",
    serviceChargeAmount: "",
    otherFees: [],
    paymentAmount: "",
    paymentDate: null,
    paymentDescription: "",
    feeAmount: "",
    feeDescription: "",
    feeDate: null,
  });

  const parseCurrency = (val: string) =>
    parseInt(val.replace(/[^0-9]/g, "") || "0", 10);

  const resetHistoryForm = () =>
    setHistoryForm({
      type: "",
      property: application?.name ? "" : "",
      tenancyStartDate: null,
      tenancyEndDate: null,
      rentAmount: "",
      serviceChargeAmount: "",
      otherFees: [],
      paymentAmount: "",
      paymentDate: null,
      paymentDescription: "",
      feeAmount: "",
      feeDescription: "",
      feeDate: null,
    });

  // ─── Receipt Review (for manual payment entries) ─────────────────
  const [showReceiptReview, setShowReceiptReview] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState<{
    amount: number;
    date: Date | null;
    description: string;
    reference: string;
  } | null>(null);

  const commitPaymentReceipt = (sendViaWhatsApp: boolean) => {
    if (!pendingReceipt) return;
    const event: HistoryEvent = {
      id: `manual-${Date.now()}`,
      title: sendViaWhatsApp ? "Receipt sent" : "Payment receipt saved",
      context: `₦${pendingReceipt.amount.toLocaleString()} · ${pendingReceipt.reference}`,
      date: pendingReceipt.date ?? new Date(),
      description: `${pendingReceipt.description} — ₦${pendingReceipt.amount.toLocaleString()}${
        sendViaWhatsApp ? " (sent to tenant via WhatsApp)" : ""
      }`,
      actionType: "inline",
      nodeColor: "green",
    };
    setManualHistoryEvents((prev) => [event, ...prev]);
    toast.success(
      sendViaWhatsApp
        ? "Receipt sent to tenant on WhatsApp and saved to History & Documents"
        : "Receipt saved to History & Documents",
    );
    setShowReceiptReview(false);
    setPendingReceipt(null);
    setShowAddHistoryModal(false);
    resetHistoryForm();
  };

  const handleSaveHistoryEntry = () => {
    const now = new Date();

    if (historyForm.type === "Payment") {
      const amount = parseCurrency(historyForm.paymentAmount);
      if (!historyForm.paymentDescription.trim()) {
        toast.error("Description is required");
        return;
      }
      if (amount <= 0) {
        toast.error("Enter a valid payment amount");
        return;
      }
      setPendingReceipt({
        amount,
        date: historyForm.paymentDate ?? now,
        description: historyForm.paymentDescription.trim(),
        reference: `RCT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`,
      });
      setShowReceiptReview(true);
      return;
    }

    let event: HistoryEvent | null = null;

    if (historyForm.type === "Tenancy") {
      const rent = parseCurrency(historyForm.rentAmount);
      const sc = parseCurrency(historyForm.serviceChargeAmount);
      const fees = historyForm.otherFees.reduce(
        (s, f) => s + parseCurrency(f.amount),
        0,
      );
      const total = rent + sc + fees;
      const prop = historyForm.property || propertyName;
      const start = historyForm.tenancyStartDate?.toLocaleDateString("en-GB") ?? "—";
      const end = historyForm.tenancyEndDate?.toLocaleDateString("en-GB") ?? "—";
      event = {
        id: `manual-${Date.now()}`,
        title: "Tenancy recorded",
        context: prop,
        date: historyForm.tenancyStartDate ?? now,
        description: `Tenancy at ${prop} from ${start} to ${end}${total > 0 ? ` — ₦${total.toLocaleString()}` : ""}`,
        actionType: "inline",
        nodeColor: "orange",
      };
    } else if (historyForm.type === "Fee") {
      const amount = parseCurrency(historyForm.feeAmount);
      event = {
        id: `manual-${Date.now()}`,
        title: "Fee recorded",
        context: historyForm.feeDescription,
        date: historyForm.feeDate ?? now,
        description: `Fee: ${historyForm.feeDescription} — ₦${amount.toLocaleString()}`,
        actionType: "inline",
        nodeColor: "red",
      };
    }

    if (event) {
      setManualHistoryEvents((prev) => [event!, ...prev]);
      setShowAddHistoryModal(false);
      resetHistoryForm();
    }
  };

  const tenancyTotal =
    parseCurrency(historyForm.rentAmount) +
    parseCurrency(historyForm.serviceChargeAmount) +
    historyForm.otherFees.reduce((s, f) => s + parseCurrency(f.amount), 0);

  const fetchChatHistory = useCallback(async () => {
    if (!application?.phone) return;
    setIsLoadingChatLogs(true);
    try {
      let phoneNumber = application.phone.replace(/[^\d+]/g, "");
      if (phoneNumber.startsWith("0") && phoneNumber.length === 11)
        phoneNumber = "+234" + phoneNumber.substring(1);
      else if (phoneNumber.startsWith("234") && phoneNumber.length === 13)
        phoneNumber = "+" + phoneNumber;
      else if (!phoneNumber.startsWith("+") && phoneNumber.length === 10)
        phoneNumber = "+234" + phoneNumber;

      const response = await fetch(
        `/api/proxy/chat-history/${encodeURIComponent(phoneNumber)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setChatLogs(data.messages || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingChatLogs(false);
    }
  }, [application?.phone]);

  useEffect(() => {
    if (activeTab === "whatsapp" && application?.phone) fetchChatHistory();
  }, [activeTab, application?.phone, fetchChatHistory]);

  // Seed breakdown rows when modal opens or source data changes
  useEffect(() => {
    if (!showBreakdownModal) return;

    const allRows: { id: string; date: Date; description: string; amount: number }[] = [
      ...(outstandingBalanceBreakdown).flatMap((breakdown) =>
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
      ...(paymentTransactions).map((t) => ({
        id: t.id,
        date: new Date(t.date),
        description: t.type || "Payment received",
        amount: t.amount,
      })),
    ];

    const MOCK_ROWS = [
      { id: "m-1", date: new Date("2025-05-01"), description: `Rent due on ${propertyName} (1 May 2025 – 30 Apr 2026)`, amount: 1800000 },
      { id: "m-2", date: new Date("2025-05-01"), description: `Service Charge due on ${propertyName}`, amount: 150000 },
      { id: "m-3", date: new Date("2025-05-14"), description: "Payment received", amount: -1800000 },
      { id: "m-4", date: new Date("2025-05-20"), description: "Payment received", amount: -100000 },
      { id: "m-5", date: new Date("2026-02-01"), description: `Rent due on ${propertyName} (1 Feb 2026 – 31 Jan 2027)`, amount: 1800000 },
      { id: "m-6", date: new Date("2026-02-01"), description: `Service Charge due on ${propertyName}`, amount: 150000 },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBreakdownModal]);

  const handleBreakdownDownload = () => {
    setDownloading(true);
    try {
      const tenantName = application?.name || "tenant";
      const allRows: { id: string; date: Date; description: string; amount: number }[] = [
        ...(outstandingBalanceBreakdown).flatMap((breakdown) =>
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
        ...(paymentTransactions).map((t) => ({
          id: t.id,
          date: new Date(t.date),
          description: t.type || "Payment received",
          amount: t.amount,
        })),
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      const header = ["Date", "Description", "Amount (₦)", "Running Balance (₦)"].join(",");
      let running = 0;
      const rows = allRows.map((row) => {
        running += row.amount;
        return [
          row.date.toLocaleDateString("en-GB"),
          `"${row.description}"`,
          row.amount,
          running,
        ].join(",");
      });
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `balance-breakdown-${tenantName.replace(/\s+/g, "-").toLowerCase()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (!application) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-gray-500">Application not found</p>
      </div>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const isEmptyValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return (
        trimmed === "" ||
        trimmed === "-" ||
        trimmed === "——" ||
        trimmed === "—" ||
        trimmed === "₦NaN"
      );
    }
    if (typeof value === "number") return Number.isNaN(value);
    return false;
  };

  const InfoRow = ({ label, value }: { label: string; value: any }) => (
    <div className="space-y-1">
      <label className="text-sm text-gray-500">{label}</label>
      <p className="text-gray-900">{isEmptyValue(value) ? "Not provided" : value}</p>
    </div>
  );

  const formatNaira = (raw: unknown): string => {
    if (isEmptyValue(raw)) return "Not provided";
    const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(n)) return "Not provided";
    return `₦${n.toLocaleString()}`;
  };

  // ==================== DOCUMENTS LOGIC ====================
  const allDocuments: Array<{
    id: string;
    name: string;
    typeBadge: string;
    date: string;
    status: string;
    onClick: () => void;
  }> = [];

  if (application.offerLetterStatus || application.offerStatus) {
    const offerData: OfferLetterData = {
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
    const status = (
      application.offerLetterStatus ||
      application.offerStatus ||
      ""
    ).toLowerCase();
    const displayStatus =
      status === "accepted"
        ? "Accepted"
        : status === "rejected"
          ? "Rejected"
          : "Sent";

    console.log("=== OFFER LETTER DOCUMENT SETUP DEBUG ===");
    console.log("Application ID:", application.id);
    console.log("Offer Letter Token:", application.offerLetter?.token);
    console.log("Offer Letter Status:", status);
    console.log("Display Status:", displayStatus);
    console.log("Offer Data:", offerData);

    allDocuments.push({
      id: "offer",
      name: `Offer Letter — ${propertyName}`,
      typeBadge: "Offer Letter",
      date: application.offerLetterCreatedAt || application.submittedDate,
      status: displayStatus,
      onClick: () => {
        console.log("=== OFFER LETTER CLICKED ===");
        console.log("Setting offer letter data:", offerData);
        console.log("Token to be passed:", application.offerLetter?.token);

        setSelectedOfferLetterData(offerData);
        // Set stamp type based on status
        if (status === "accepted") {
          setOfferLetterStampType("accepted");
        } else if (status === "rejected") {
          setOfferLetterStampType("rejected");
        } else {
          setOfferLetterStampType(undefined);
        }
        setShowOfferLetterModal(true);

        console.log("Modal should now be opening...");
      },
    });
  }

  if (application.invoiceCreatedAt) {
    const rentAmount =
      application.offerLetter?.rentAmount ||
      application.tenantOffer?.proposedRentAmount ||
      0;
    const isAccepted =
      !!application.paymentDate || application.status === "Attached";
    const invoiceData: InvoiceData = {
      invoiceNumber: "INV-" + application.id.toString().slice(-6).toUpperCase(),
      invoiceDate: new Date().toLocaleDateString("en-GB"),
      status: isAccepted ? "Paid" : "Pending",
      tenantName: application.name,
      tenantEmail: application.email,
      tenantPhone: application.phone,
      propertyName,
      propertyAddress: propertyAddress || "",
      lineItems: [
        {
          description: `Rent — ${application.tenantOffer?.rentPaymentFrequency || "Annual"}`,
          amount: rentAmount,
        },
      ],
      subtotal: rentAmount,
      total: rentAmount,
      amountPaid: isAccepted ? rentAmount : 0,
      amountDue: isAccepted ? 0 : rentAmount,
      notes: "Payment due within 14 days of invoice date.",
      backendInvoiceId: application.invoiceId,
      branding: profileData?.user?.branding as any,
    };
    allDocuments.push({
      id: "invoice",
      name: `Invoice — ₦${rentAmount.toLocaleString()} (${propertyName})`,
      typeBadge: "Invoice",
      date: application.invoiceCreatedAt,
      status: isAccepted ? "Paid" : "Pending",
      onClick: () => {
        setSelectedInvoiceData(invoiceData);
        setInvoiceIsPaid(isAccepted);
        setShowInvoiceModal(true);
      },
    });
  }

  if (application.paymentDate) {
    const receiptData: ReceiptData = {
      receiptNumber: "RCT-" + application.id.toString().slice(-6).toUpperCase(),
      receiptDate: new Date().toLocaleDateString("en-GB"),
      paymentReference:
        "TXN" + application.id.toString().slice(-8).toUpperCase(),
      tenantName: application.name,
      tenantEmail: application.email,
      tenantPhone: application.phone,
      propertyName,
      propertyAddress: propertyAddress || "",
      invoiceNumber: "INV-" + application.id.toString().slice(-6).toUpperCase(),
      amountPaid: application.offerLetter?.rentAmount || 0,
      paymentMethod: "Bank Transfer",
      notes: "Payment received.",
    };
    allDocuments.push({
      id: "receipt",
      name: `Receipt — ₦${(application.offerLetter?.rentAmount || 0).toLocaleString()} (${propertyName})`,
      typeBadge: "Receipt",
      date: application.paymentDate,
      status: "Paid",
      onClick: () => {
        setSelectedReceiptData(receiptData);
        setShowReceiptModal(true);
      },
    });
  }

  const sortedDocuments = allDocuments.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const formatDateShort = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gray-50" style={{ isolation: "isolate" }}>
      {/* ==================== COMPACT STICKY HEADER ==================== */}
      <div className="sticky top-0 z-50 bg-white">
        {/* Row 1: Back, Avatar + Name + Date */}
        <div className="px-4 sm:px-6 py-5 flex items-center gap-3 border-b border-gray-200">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0 relative">
              <User className="w-5 h-5 text-gray-400" />
              {application.passportPhoto && (
                <img
                  src={application.passportPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            {/* Name + date */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold text-gray-900 truncate">
                {application.name}
              </h1>
              <p className="text-xs text-gray-500">
                Submitted {formatDateShort(application.submittedDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Outstanding pill, Offer Status Badge, Download PDF, Attach Tenant */}
        <div className="px-4 sm:px-6 py-2 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-3">
            <OutstandingBalanceBreakdownCard
              items={
                walletFees.length > 0
                  ? walletFees.map((f) => ({
                      id: f.id,
                      label: f.feeName,
                      amount: f.amount,
                      date: f.paymentDate,
                    }))
                  : DUMMY_OUTSTANDING_BREAKDOWN
              }
            />
            {application.offerStatus === "pending" && (
              <button onClick={onViewOfferLetter} className="cursor-pointer">
                <Badge
                  className={`${
                    application.offerLetter?.sentAt
                      ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  } border px-3 py-1 text-xs cursor-pointer transition-colors`}
                >
                  {application.offerLetter?.sentAt
                    ? "Offer Sent - Awaiting Response"
                    : "Offer Saved - Not Sent"}
                </Badge>
              </button>
            )}
            {application.offerStatus === "rejected" && (
              <Badge className="bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 text-xs">
                Offer Declined
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onDownloadPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 h-8 text-xs hover:bg-[#FFF3EB] hover:border-[#FF5000] hover:text-[#FF5000]"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <Button
              onClick={onAttachTenant}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              Attach tenant
            </Button>
          </div>
        </div>

        {/* Row 3: Tab Navigation */}
        <div className="px-4 sm:px-6 flex gap-8 overflow-x-auto scrollbar-hide border-b border-gray-200">
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "documents", label: "Documents" },
              { key: "whatsapp", label: "WhatsApp" },
              { key: "history", label: "History" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[#FF5000] text-[#FF5000]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== SCROLLABLE CONTENT ==================== */}
      <div className="px-4 sm:px-6 pt-6 pb-16 space-y-6">
        {activeTab === "overview" && (
          <>
            {/* Offer banner (no duplicate badge) */}
            {/* {(application.offerLetterStatus === "pending" ||
              application.offerStatus === "pending") && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-[#FF5000]" />
                  <h3 className="text-gray-900 font-medium">
                    Offer Letter Sent
                  </h3>
                </div>
                <p className="text-sm text-gray-700">
                  An offer letter was sent to{" "}
                  <strong>{application.email}</strong>
                </p>
              </div>
            )} */}

            {/* Personal Details */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="mb-4">
                <h3 className="text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#FF5000]" />
                  Personal Details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  label="First Name"
                  value={
                    application.otherNames || application.name.split(" ")[0]
                  }
                />
                <InfoRow
                  label="Surname"
                  value={
                    application.surname ||
                    application.name.split(" ").slice(1).join(" ")
                  }
                />
                <InfoRow label="Email Address" value={application.email} />
                <InfoRow label="Phone Number" value={application.phone} />
                {application.status === "Attached" ? (
                  <>
                    <InfoRow
                      label="Previous Address"
                      value={application.contactAddress}
                    />
                    {propertyName && (
                      <div className="space-y-1">
                        <label className="text-sm text-gray-500">Current Address</label>
                        <button
                          onClick={handlePropertyClick}
                          className="flex items-center gap-1 text-[#FF5000] hover:text-[#e04800] cursor-pointer transition-colors text-left"
                        >
                          <span>{propertyName}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <InfoRow
                    label="Contact Address"
                    value={application.contactAddress}
                  />
                )}
                <InfoRow label="Nationality" value={application.nationality} />
                <InfoRow
                  label="State of Origin"
                  value={application.stateOfOrigin}
                />
                <InfoRow
                  label="Date of Birth"
                  value={application.dateOfBirth}
                />
                <InfoRow label="Gender" value={application.sex} />
                <InfoRow
                  label="Marital Status"
                  value={application.maritalStatus}
                />
                <InfoRow label="Religion" value={application.religion} />

                {application.nextOfKin && (
                  <>
                    <div className="md:col-span-2 mt-6 mb-2">
                      <h4 className="text-gray-900 font-medium">Next of Kin</h4>
                    </div>
                    <InfoRow
                      label="Name"
                      value={application.nextOfKin.fullName}
                    />
                    <InfoRow
                      label="Relationship"
                      value={application.nextOfKin.relationship}
                    />
                    <InfoRow
                      label="Phone"
                      value={application.nextOfKin.phone}
                    />
                    <InfoRow
                      label="Email"
                      value={application.nextOfKin.email}
                    />
                    <InfoRow
                      label="Address"
                      value={application.nextOfKin.address}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#FF5000]" />
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  label="Employment Status"
                  value={application.employmentStatus}
                />
                {application.employmentStatus?.toLowerCase() === "employed" && (
                  <>
                    <InfoRow
                      label="Occupation"
                      value={application.occupation}
                    />
                    <InfoRow label="Job Title" value={application.jobTitle} />
                    <InfoRow
                      label="Employer Name"
                      value={application.employerName}
                    />
                    <InfoRow
                      label="Office Address"
                      value={application.officeAddress}
                    />
                    <InfoRow label="Work Phone" value={application.workPhone} />
                    <InfoRow
                      label="Monthly Income"
                      value={formatNaira(application.monthlyIncome)}
                    />
                    <InfoRow
                      label="Years at Employer"
                      value={application.yearsAtEmployer}
                    />
                  </>
                )}
                {application.employmentStatus?.toLowerCase() ===
                  "self-employed" && (
                  <>
                    <InfoRow
                      label="Nature of Business"
                      value={application.natureOfBusiness}
                    />
                    <InfoRow
                      label="Business Name"
                      value={application.businessName}
                    />
                    <InfoRow
                      label="Business Address"
                      value={application.businessAddress}
                    />
                    <InfoRow
                      label="Business Duration"
                      value={application.businessDuration}
                    />
                    <InfoRow
                      label="Monthly Income"
                      value={formatNaira(application.monthlyIncome)}
                    />
                  </>
                )}
                {!application.employmentStatus ||
                  (application.employmentStatus.toLowerCase() !== "employed" &&
                    application.employmentStatus.toLowerCase() !==
                      "self-employed" && (
                      <>
                        <InfoRow
                          label="Occupation"
                          value={application.occupation}
                        />
                        <InfoRow
                          label="Monthly Income"
                          value={
                            application.monthlyIncome
                              ? `₦${Number(application.monthlyIncome).toLocaleString()}`
                              : undefined
                          }
                        />
                      </>
                    ))}
              </div>
            </div>

            {/* Tenancy Application Information - shown everywhere except from tenant detail */}
            {showTenancyInfo && (() => {
              const flat = application as IKycApplication & {
                proposedRentAmount?: string | number;
                rentPaymentFrequency?: string;
                intendedUseOfProperty?: string;
                numberOfOccupants?: string;
                parkingNeeds?: string;
                numberOfCarsOwned?: string;
                additionalNotes?: string;
              };
              const offer = application.tenantOffer;
              const intendedUse = offer?.intendedUse ?? flat.intendedUseOfProperty;
              const numberOfOccupants = offer?.numberOfOccupants ?? flat.numberOfOccupants;
              const numberOfCarsOwned =
                offer?.numberOfCarsOwned ?? flat.numberOfCarsOwned ?? flat.parkingNeeds;
              const proposedRentRaw = offer?.proposedRentAmount ?? flat.proposedRentAmount;
              const proposedRentAmount = formatNaira(proposedRentRaw);
              const rentPaymentFrequency =
                offer?.rentPaymentFrequency ?? flat.rentPaymentFrequency;
              const additionalNotes = offer?.additionalNotes ?? flat.additionalNotes;
              return (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#FF5000]" />
                    Tenancy Application Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="Intended Use of Property" value={intendedUse} />
                    <InfoRow label="Number of Occupants" value={numberOfOccupants} />
                    <InfoRow label="Vehicle / Parking Requirements" value={numberOfCarsOwned} />
                    <InfoRow label="Proposed Rent Amount" value={proposedRentAmount} />
                    <InfoRow label="Proposed Rent Payment Frequency" value={rentPaymentFrequency} />
                    <InfoRow label="Additional Notes" value={additionalNotes} />
                  </div>
                </div>
              );
            })()}

            {/* Referral Agent - shown everywhere except from tenant detail */}
            {showTenancyInfo && application.referralAgent && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#FF5000]" />
                  Referral Agent
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow
                    label="Full Name"
                    value={application.referralAgent.fullName}
                  />
                  <InfoRow
                    label="Phone Number"
                    value={application.referralAgent.phoneNumber}
                  />
                </div>
              </div>
            )}

            {/* Identification & Declaration */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FF5000]" />
                Identification & Declaration
              </h3>
              {application.documents && application.documents.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    Uploaded Documents
                  </h4>
                  {application.documents.map(
                    (doc: { name: string; url: string }, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <FileText className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-900 flex-1">
                          {doc.name}
                        </span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </a>
                      </div>
                    ),
                  )}
                </div>
              )}
              {application.declaration && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Declaration
                  </h4>
                  <p className="text-sm text-gray-600">
                    {application.declaration}
                  </p>
                </div>
              )}
            </div>

            {application.status === "Pending Completion" && (
              <ResendKYCSection
                applicationId={application.id}
                tenantPhone={application.phone}
                tenantName={application.name}
              />
            )}
          </>
        )}

        {activeTab === "documents" && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FF5000]" />
                Generated Documents
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {sortedDocuments.length} document
                {sortedDocuments.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-4 space-y-3">
              {sortedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={doc.onClick}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.name}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      <span>{formatDate(doc.date)}</span>
                      <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                        {doc.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-[#FF5000]" />
              WhatsApp Chat
            </h3>
            {isLoadingChatLogs ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-orange-200 border-t-orange-500 rounded-full" />
              </div>
            ) : (
              <TenantChatHistory logs={chatLogs} />
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <div className="flex justify-end px-4 pt-4 pb-2">
              <button
                onClick={() => setShowAddHistoryModal(true)}
                className="flex items-center gap-1.5 bg-[#FF5000] text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-[#e04500] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add History
              </button>
            </div>
            <LandlordKYCApplicationDetailHistory
              application={application}
              propertyName={propertyName}
              propertyAddress={propertyAddress}
              additionalEvents={manualHistoryEvents}
              onNavigateToTab={setActiveTab}
            onOpenDocument={(type, data) => {
              if (type === "offer_letter") {
                const offerData = data as unknown as OfferLetterData;
                setSelectedOfferLetterData(offerData);
                // Determine stamp type from application status
                const status = (
                  application.offerLetterStatus ||
                  application.offerStatus ||
                  ""
                ).toLowerCase();
                if (status === "accepted") {
                  setOfferLetterStampType("accepted");
                } else if (status === "rejected") {
                  setOfferLetterStampType("rejected");
                } else {
                  setOfferLetterStampType(undefined);
                }
                setShowOfferLetterModal(true);
              }
              if (type === "invoice") {
                const invoiceData = data as unknown as InvoiceData;
                setSelectedInvoiceData(invoiceData);
                // Determine if paid based on invoice status or amountDue
                const isPaid =
                  invoiceData.status === "Paid" || invoiceData.amountDue === 0;
                setInvoiceIsPaid(isPaid);
                setShowInvoiceModal(true);
              }
              if (type === "receipt") {
                setSelectedReceiptData(data as unknown as ReceiptData);
                setShowReceiptModal(true);
              }
            }}
          />
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedOfferLetterData && (
        <OfferLetterViewModal
          isOpen={showOfferLetterModal}
          onClose={() => {
            setShowOfferLetterModal(false);
            setSelectedOfferLetterData(null);
            setOfferLetterStampType(undefined);
          }}
          data={selectedOfferLetterData}
          token={application.offerLetter?.token}
          stampType={offerLetterStampType}
        />
      )}
      {selectedInvoiceData && (
        <InvoiceViewModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoiceData(null);
            setInvoiceIsPaid(false);
          }}
          data={selectedInvoiceData}
          isPaid={invoiceIsPaid}
        />
      )}
      {selectedReceiptData && (
        <ReceiptViewModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceiptData(null);
          }}
          data={selectedReceiptData}
        />
      )}

      {/* Add History Modal */}
      <Dialog
        open={showAddHistoryModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddHistoryModal(false);
            resetHistoryForm();
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add History Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Event type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
              <Select
                value={historyForm.type}
                onValueChange={(v) =>
                  setHistoryForm((prev) => ({ ...prev, type: v as typeof prev.type }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tenancy">Tenancy</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="Fee">Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tenancy fields */}
            {historyForm.type === "Tenancy" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Property</label>
                  <Input
                    value={historyForm.property}
                    onChange={(e) =>
                      setHistoryForm((prev) => ({ ...prev, property: e.target.value }))
                    }
                    placeholder={propertyName || "Property name"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <DatePickerInput
                      value={historyForm.tenancyStartDate ?? undefined}
                      onChange={(d) =>
                        setHistoryForm((prev) => ({ ...prev, tenancyStartDate: d ?? null }))
                      }
                      placeholder="Start date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <DatePickerInput
                      value={historyForm.tenancyEndDate ?? undefined}
                      onChange={(d) =>
                        setHistoryForm((prev) => ({ ...prev, tenancyEndDate: d ?? null }))
                      }
                      placeholder="End date"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rent Amount (₦)</label>
                  <Input
                    value={historyForm.rentAmount}
                    onChange={(e) =>
                      setHistoryForm((prev) => ({ ...prev, rentAmount: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service Charge (₦)</label>
                  <Input
                    value={historyForm.serviceChargeAmount}
                    onChange={(e) =>
                      setHistoryForm((prev) => ({ ...prev, serviceChargeAmount: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                {/* Other fees */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">Other Fees</label>
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryForm((prev) => ({
                          ...prev,
                          otherFees: [...prev.otherFees, { name: "", amount: "" }],
                        }))
                      }
                      className="text-xs text-[#FF5000] hover:underline"
                    >
                      + Add fee
                    </button>
                  </div>
                  {historyForm.otherFees.map((fee, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Input
                        value={fee.name}
                        onChange={(e) => {
                          const updated = [...historyForm.otherFees];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setHistoryForm((prev) => ({ ...prev, otherFees: updated }));
                        }}
                        placeholder="Fee name"
                        className="flex-1"
                      />
                      <Input
                        value={fee.amount}
                        onChange={(e) => {
                          const updated = [...historyForm.otherFees];
                          updated[i] = { ...updated[i], amount: e.target.value };
                          setHistoryForm((prev) => ({ ...prev, otherFees: updated }));
                        }}
                        placeholder="₦0"
                        className="w-28"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = historyForm.otherFees.filter((_, idx) => idx !== i);
                          setHistoryForm((prev) => ({ ...prev, otherFees: updated }));
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {tenancyTotal > 0 && (
                  <p className="text-sm font-semibold text-slate-700">
                    Total: ₦{tenancyTotal.toLocaleString()}
                  </p>
                )}
              </>
            )}

            {/* Payment fields */}
            {historyForm.type === "Payment" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={historyForm.paymentDescription}
                    onChange={(e) =>
                      setHistoryForm((prev) => ({
                        ...prev,
                        paymentDescription: e.target.value,
                      }))
                    }
                    placeholder="e.g., January Rent Payment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₦)</label>
                  <Input
                    value={historyForm.paymentAmount}
                    onChange={(e) =>
                      setHistoryForm((prev) => ({ ...prev, paymentAmount: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                  <DatePickerInput
                    value={historyForm.paymentDate ?? undefined}
                    onChange={(d) =>
                      setHistoryForm((prev) => ({ ...prev, paymentDate: d ?? null }))
                    }
                    placeholder="Select date"
                  />
                </div>
              </>
            )}

            {/* Fee fields */}
            {historyForm.type === "Fee" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <Input
                    value={historyForm.feeDescription}
                    onChange={(e) =>
                      setHistoryForm((prev) => ({ ...prev, feeDescription: e.target.value }))
                    }
                    placeholder="e.g. Late payment fee"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₦)</label>
                  <Input
                    value={historyForm.feeAmount}
                    onChange={(e) =>
                      setHistoryForm((prev) => ({ ...prev, feeAmount: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <DatePickerInput
                    value={historyForm.feeDate ?? undefined}
                    onChange={(d) =>
                      setHistoryForm((prev) => ({ ...prev, feeDate: d ?? null }))
                    }
                    placeholder="Select date"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddHistoryModal(false);
                  resetHistoryForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#FF5000] hover:bg-[#e04500] text-white"
                disabled={!historyForm.type}
                onClick={handleSaveHistoryEntry}
              >
                Save Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Review Modal */}
      {pendingReceipt && (
        <ReceiptReviewModal
          open={showReceiptReview}
          onOpenChange={(open) => {
            setShowReceiptReview(open);
            if (!open) setPendingReceipt(null);
          }}
          data={{
            tenantName: application?.name ?? "Tenant",
            amount: pendingReceipt.amount,
            date: pendingReceipt.date,
            description: pendingReceipt.description,
            reference: pendingReceipt.reference,
            property: propertyName,
          }}
          onSave={() => commitPaymentReceipt(false)}
          onSend={() => commitPaymentReceipt(true)}
        />
      )}

      {/* Add Fee Modal */}
      <Dialog
        open={showAddFeeModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddFeeModal(false);
            resetFeeForm();
          }
        }}
      >
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fee</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-700">
                Fee Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Legal Fee, Inspection Fee"
                value={feeForm.feeName}
                onChange={(e) => {
                  setFeeForm((f) => ({ ...f, feeName: e.target.value }));
                  if (feeFormErrors.feeName)
                    setFeeFormErrors((errs) => ({ ...errs, feeName: "" }));
                }}
                className={feeFormErrors.feeName ? "border-red-500" : ""}
              />
              {feeFormErrors.feeName && (
                <p className="text-xs text-red-500">{feeFormErrors.feeName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-700">
                Amount <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="₦ Amount"
                value={feeForm.amount}
                onChange={(e) => {
                  setFeeForm((f) => ({ ...f, amount: e.target.value }));
                  if (feeFormErrors.amount)
                    setFeeFormErrors((errs) => ({ ...errs, amount: "" }));
                }}
                className={feeFormErrors.amount ? "border-red-500" : ""}
              />
              {feeFormErrors.amount && (
                <p className="text-xs text-red-500">{feeFormErrors.amount}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-700">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <DatePickerInput
                value={feeForm.paymentDate}
                onChange={(date) => {
                  setFeeForm((f) => ({ ...f, paymentDate: date }));
                  if (feeFormErrors.paymentDate)
                    setFeeFormErrors((errs) => ({ ...errs, paymentDate: "" }));
                }}
                placeholder="Select payment date"
                className={feeFormErrors.paymentDate ? "border-red-500" : ""}
              />
              {feeFormErrors.paymentDate && (
                <p className="text-xs text-red-500">{feeFormErrors.paymentDate}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFeeModal(false);
                resetFeeForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#FF5000] hover:bg-[#E64500] text-white"
              onClick={handleSaveFee}
            >
              Save Fee
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Breakdown Modal */}
      <Dialog
        open={showWalletModal}
        onOpenChange={(open) => {
          if (!open) setShowWalletModal(false);
        }}
      >
        <DialogContent className="bg-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wallet Breakdown</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Wallet Balance</p>
                <p className="text-2xl font-semibold text-[#FF5000]">
                  {formatNaira(walletBalance)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowWalletModal(false);
                  resetFeeForm();
                  setShowAddFeeModal(true);
                }}
                className="shrink-0 hover:bg-[#FFF3EB] hover:border-[#FF5000] hover:text-[#FF5000]"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Fee
              </Button>
            </div>

            <Separator />

            {walletFees.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                No fees recorded yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-3 text-slate-500 font-medium">
                        Fee Name
                      </th>
                      <th className="text-right py-3 px-3 text-slate-500 font-medium whitespace-nowrap w-[160px]">
                        Amount
                      </th>
                      <th className="text-right py-3 px-3 text-slate-500 font-medium whitespace-nowrap w-[160px]">
                        Date Paid
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletFees.map((fee) => (
                      <tr
                        key={fee.id}
                        className="border-b last:border-b-0 border-slate-100"
                      >
                        <td className="py-3 px-3 text-slate-700">
                          {fee.feeName}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-medium text-slate-900">
                          {formatNaira(fee.amount)}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap text-slate-500">
                          {new Date(fee.paymentDate).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ResendKYCSection & TenancyInfoModal (unchanged - paste yours here)
function ResendKYCSection({
  applicationId,
  tenantPhone,
  tenantName,
}: {
  applicationId: string | number;
  tenantPhone: string;
  tenantName: string;
}) {
  const resendMutation = useResendKYCCompletionLinkMutation();
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Resend KYC completion link to <strong>{tenantName}</strong>
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => resendMutation.mutate(String(applicationId))}
        disabled={resendMutation.isPending}
      >
        {resendMutation.isPending ? "Sending..." : "Resend Link"}
      </Button>
    </div>
  );
}

// TenancyInfoModal - paste your full version here
