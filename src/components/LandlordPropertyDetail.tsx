/* eslint-disable */

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  MoreVertical,
  Home,
  Power,
  PowerOff,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  UserMinus,
  AlertCircle,
  Wrench,
  CheckCircle,
  Clock,
  User,
  FileText,
  ExternalLink,
  RefreshCw,
  ClipboardCheck,
  Send,
  CreditCard,
  Eye,
  Receipt,
  Info,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { EndTenancyModal } from "./EndTenancyModal";
import {
  RenewTenancyModal,
  RenewTenancyData,
  calculateEndDate,
} from "./RenewTenancyModal";
import { EditTenancyModal, EditTenancyData } from "./EditTenancyModal";
import { LandlordTopNav } from "./LandlordTopNav";
import { SetRentPriceRangeModal } from "./SetRentPriceRangeModal";
import { useFetchPropertyDetailsWithHistory } from "@/services/property/query";
import { getAssignedManager, setAssignedManager, subscribeToFMStore, MOCK_FM_LIST } from "@/lib/facilityManagerStore";
import { getRecurringCharges, subscribeToRecurringCharges, type RecurringCharge } from "@/lib/recurringChargesStore";
import { CreatePaymentPlanModal, type ChargeOption } from "./CreatePaymentPlanModal";
import { PlanScopePickerModal, type PlanScope } from "./PlanScopePickerModal";
import {
  PropertyDetailWithHistory,
  KYCApplicationSummary,
} from "@/types/property";
import {
  useDeletePropertyMutation,
  useMoveTenantOutMutation,
  useUpdatePropertyMutation,
  useSyncPropertyStatuses,
  useRenewTenancyMutation,
} from "@/services/property/mutation";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMobile } from "@/contexts/MobileContext";
import { LandlordAddPropertyModal } from "@/components/LandlordAddPropertyModal";
import { LandlordAddTenantModal } from "@/components/LandlordAddTenantModal";
import { LandlordEditPropertyModal } from "@/components/LandlordEditPropertyModal";
import { GenerateKYCLinkModal } from "@/components/GenerateKYCLinkModal";

import { AttachTenantModal } from "@/components/AttachTenantModal";
import { getAvailableActions } from "@/utilities/propertyStateLogic";
import {
  getErrorDisplayInfo,
  handleApiErrorWithRetry,
  checkNetworkConnectivity,
} from "@/utilities/errorHandling";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  KYCService,
  KYCApplication,
  TenancyDetails,
} from "@/services/kyc/kyc.service";
import {
  useFetchKYCApplicationsByProperty,
  useFetchKYCApplicationStatistics,
} from "@/services/property/query";
import { useAttachTenantFromKYCMutation } from "@/services/property/mutation";
import axiosInstance from "@/services/axios-instance";
import { useWebSocket } from "@/hooks/useWebSocket";

// Extended type to handle offer letter with payment fields and flat tenancy fields
interface KYCApplicationWithPayment extends KYCApplication {
  proposedRentAmount?: string | number;
  rentPaymentFrequency?: string;
  offerLetterStatus?: string;
  offerLetter?: {
    id: string;
    token: string;
    status: string;
    rentAmount: number;
    rentFrequency: string;
    serviceCharge?: number;
    tenancyStartDate: string;
    tenancyEndDate: string;
    cautionDeposit?: number;
    legalFee?: number;
    agencyFee?: number;
    totalAmount?: number;
    amountPaid?: number;
    outstandingBalance?: number;
    paymentStatus?: string;
    acceptedAt?: string;
    acceptanceOtp?: string;
    acceptedByPhone?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

interface LandlordPropertyDetailProps {
  propertyId?: string | null;
  onBack?: () => void;
  isMobile?: boolean;
  isMenuOpen?: boolean;
  onEditProperty?: () => void;
}

export default function LandlordPropertyDetail({
  propertyId: propPropertyId,
  onBack,
  isMobile = false,
  isMenuOpen = false,
  onEditProperty,
}: LandlordPropertyDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userRole = user?.role;
  const { isMobile: isMobileContext } = useMobile();

  // Get property ID
  const effectivePropertyId = propPropertyId || searchParams.get("propertyId");

  const deletePropertyMutation = useDeletePropertyMutation();
  const moveTenantOutMutation = useMoveTenantOutMutation();
  const updatePropertyMutation = useUpdatePropertyMutation(
    effectivePropertyId || "",
  );
  const syncPropertyStatusesMutation = useSyncPropertyStatuses();
  const renewTenancyMutation = useRenewTenancyMutation();
  const [isRenewing, setIsRenewing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">(
    "overview",
  );
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showEndTenancyModal, setShowEndTenancyModal] = useState(false);
  const [showRenewTenancyModal, setShowRenewTenancyModal] = useState(false);
  const [editTenancyMode, setEditTenancyMode] = useState<"current" | "next-period" | null>(null);
  const [isEditingTenancy, setIsEditingTenancy] = useState(false);
  const [showBillingBreakdown, setShowBillingBreakdown] = useState(false);
  const [expandedChargeGroups, setExpandedChargeGroups] = useState<Record<string, boolean>>({ annual: true, monthly: true });
  const [landlordId, setLandlordId] = useState<string | undefined>(undefined);
  const [showFMModal, setShowFMModal] = useState(false);
  const [, fmTick] = useState(0); // forces re-render when store updates
  const [, rcTick] = useState(0); // forces re-render when recurring charges change
  const [showScopePicker, setShowScopePicker] = useState(false);
  const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(false);
  const [paymentPlanScope, setPaymentPlanScope] = useState<PlanScope>("tenancy");

  useEffect(() => {
    return subscribeToFMStore(() => fmTick((n) => n + 1));
  }, []);

  useEffect(() => {
    return subscribeToRecurringCharges(() => rcTick((n) => n + 1));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setLandlordId(payload.sub || payload.userId || payload.id);
      } catch {
        // ignore
      }
    }
  }, []);
  const [showGenerateKYCModal, setShowGenerateKYCModal] = useState(false);
  const [showAttachTenantModal, setShowAttachTenantModal] = useState(false);
  const [showSetRentPriceModal, setShowSetRentPriceModal] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<KYCApplication | null>(null);

  // Fetch comprehensive property data with history
  const { data, isLoading, isError, error, refetch } =
    useFetchPropertyDetailsWithHistory(effectivePropertyId || "");

  // Local state for property data to allow updates like in design
  const [propertyData, setPropertyData] = useState<
    PropertyDetailWithHistory | undefined
  >(data);

  // Update local state when data changes
  useEffect(() => {
    setPropertyData(data);
  }, [data]);

  // Fetch KYC applications with enhanced error handling
  // Requirements: 2.5, 4.1, 6.4 - Use property data for count/status, but fetch full details separately
  const {
    data: kycApplicationsData = [],
    isLoading: isLoadingApplications,
    error: kycApplicationsError,
    refetch: refetchKYCApplications,
  } = useFetchKYCApplicationsByProperty(
    effectivePropertyId || "",
    !!effectivePropertyId &&
      !!propertyData &&
      propertyData.status?.toUpperCase() === "VACANT",
  );

  // Ensure kycApplications is always an array to prevent .map() errors
  const kycApplications = Array.isArray(kycApplicationsData)
    ? kycApplicationsData
    : [];

  // Fetch KYC application statistics
  // Requirements: 4.1 - Show application count and status
  const { data: kycStatistics, isLoading: isLoadingStatistics } =
    useFetchKYCApplicationStatistics(
      effectivePropertyId || "",
      !!effectivePropertyId &&
        !!propertyData &&
        propertyData.status?.toUpperCase() === "VACANT",
    );

  // WebSocket connection for real-time notifications
  useWebSocket({
    propertyId: effectivePropertyId || undefined,
    landlordId: landlordId,
    enabled: !!effectivePropertyId,
    onWhatsAppNotification: (data) => {
      const retryLabel = data.isRetry ? ` (retry #${data.attempts})` : "";
      if (data.success) {
        toast.success(
          `Message sent to ${data.recipientName} successfully${retryLabel}`,
        );
      } else {
        toast.error(
          `Failed to send message to ${data.recipientName}: ${data.error ?? "Unknown error"}`,
        );
      }
    },
    onKYCSubmitted: (data) => {
      console.log("New KYC submission received via WebSocket:", data);
      toast.success(
        `New KYC application from ${data.kycData?.firstName} ${data.kycData?.lastName}`,
      );

      // Refresh KYC applications and property data
      refetchKYCApplications();
      refetch();
    },
    onServiceRequestCreated: (data) => {
      console.log("New service request received via WebSocket:", data);
      toast.info(
        `New service request from ${
          data.serviceRequestData?.tenantName || "tenant"
        }`,
      );

      // Refresh property data to update history
      refetch();
    },
    onTenancyRenewed: (data) => {
      console.log("Tenancy renewed via WebSocket:", data);
      toast.success(
        `Tenancy renewed for ${data.tenantName} at ${data.propertyName}`,
      );

      // Refresh property data to update history and rent details
      refetch();
    },
  });

  // KYC-related mutations with enhanced error handling
  // Requirements: 5.1 - Attach tenant to property with tenancy details
  const attachTenantFromKYCMutation = useAttachTenantFromKYCMutation();

  // console.log("propertyData:", propertyData);
  // console.log(
  //   "kycApplicationsData:",
  //   kycApplicationsData,
  //   "type:",
  //   typeof kycApplicationsData,
  //   "isArray:",
  //   Array.isArray(kycApplicationsData)
  // );

  // Debug data inconsistency - only log once when detected
  useEffect(() => {
    if (propertyData) {
      const hasInconsistency =
        propertyData.status === "Occupied" &&
        !propertyData.rent &&
        !propertyData.currentTenant;
      if (hasInconsistency) {
        console.warn("🚨 Data inconsistency detected:", {
          status: propertyData.status,
          hasRent: !!propertyData.rent,
          hasCurrentTenant: !!propertyData.currentTenant,
          propertyId: effectivePropertyId,
        });
      }
    }
  }, [
    propertyData?.status,
    propertyData?.rent,
    propertyData?.currentTenant,
    effectivePropertyId,
  ]);

  // Handle API errors with toast notifications
  useEffect(() => {
    if (isError && error) {
      const errorMessage = error?.message || "Failed to load property details";
      console.error("Property details loading error:", errorMessage);

      // Don't show toast for errors that are already handled in the UI
      // The error state component will display the appropriate message
    }
  }, [isError, error]);

  // Handle attachTenant query parameter from KYC application detail page
  useEffect(() => {
    const attachTenantId = searchParams.get("attachTenant");
    if (attachTenantId && kycApplications.length > 0) {
      const application = kycApplications.find(
        (app) => app.id === attachTenantId,
      );
      if (application) {
        setSelectedApplication(application);
        setShowAttachTenantModal(true);
        // Remove the query parameter to prevent re-triggering
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("attachTenant");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  }, [searchParams, kycApplications]);

  // Get property history directly from the API response
  // Backend now handles all event types including KYC and offer letter events
  const propertyHistory = (propertyData?.history || []).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Debug: Log the property history data
  console.log("🔍 Frontend Property History Debug:", {
    propertyId: effectivePropertyId,
    historyLength: propertyHistory.length,
    history: propertyHistory.map((h) => ({
      id: h.id,
      eventType: h.eventType,
      title: h.title,
      description: h.description,
      date: h.date,
    })),
  });

  // Derive hasHistory from history length
  const hasHistory = propertyHistory.length > 0;

  // Handler functions (defined early to avoid hoisting issues)
  const handleAddProperty = () => {
    if (isMobileContext) {
      router.push(`/${userRole}/add-property`);
    } else {
      setShowAddPropertyModal(true);
    }
  };

  const handleAddTenant = () => {
    if (isMobileContext) {
      router.push(`/${userRole}/add-tenant`);
    } else {
      setShowAddTenantModal(true);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const handleTenantClick = (tenantId: string) => {
    const kycId = tenantId.replace(/^app-/, "");
    router.push(`/${userRole}/kyc-application-detail/${kycId}`);
  };

  // Get available actions based on property state and history
  const availableActions = propertyData
    ? getAvailableActions(propertyData)
    : {
        canEdit: false,
        canDelete: false,
        canDeactivate: false,
        canReactivate: false,
        canEndTenancy: false,
        canAssignTenant: false,
      };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="pt-[73px] lg:pt-[81px]">
          <div className="flex items-center justify-center h-96 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5000] mx-auto mb-6"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading Property Details
              </h3>
              <p className="text-gray-500">
                Please wait while we fetch the property information...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !propertyData) {
    const errorInfo = getErrorDisplayInfo(error);

    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="pt-[73px] lg:pt-[81px]">
          <div className="flex items-center justify-center h-96 p-8">
            <div className="text-center max-w-md">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${errorInfo.bgColor}`}
              >
                <Home className={`w-8 h-8 ${errorInfo.iconColor}`} />
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {errorInfo.title}
              </h3>

              <p className="text-gray-500 mb-6 leading-relaxed">
                {errorInfo.message}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="bg-[#FF5000] hover:bg-[#E64500] text-white w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Retrying...
                    </>
                  ) : (
                    "Try Again"
                  )}
                </Button>

                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                >
                  Go Back
                </Button>
              </div>

              {errorInfo.isNetworkError && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    Troubleshooting Tips:
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Check your internet connection</li>
                    <li>• Try refreshing the page</li>
                    <li>• Contact support if the issue persists</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handlers (adapted from design)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "——";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  const formatTimelineDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getMonthYearLabel = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const groupHistoryByMonth = (history: typeof propertyHistory) => {
    const grouped: { [key: string]: typeof propertyHistory } = {};
    history.forEach((event: any) => {
      const monthYear = getMonthYearLabel(event.date);
      if (!grouped[monthYear]) grouped[monthYear] = [];
      grouped[monthYear].push(event);
    });
    return grouped;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "——";
    return `₦${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "OCCUPIED":
        return (
          <Badge className="bg-[#E6F4EA] text-[#137333] hover:bg-[#E6F4EA] border-0 rounded-full px-3 py-1">
            Occupied
          </Badge>
        );
      case "VACANT":
        return (
          <Badge className="bg-[#F3F4F6] text-[#555] hover:bg-[#F3F4F6] border-0 rounded-full px-3 py-1">
            Vacant
          </Badge>
        );
      case "INACTIVE":
        return (
          <Badge className="bg-[#E0E0E0] text-[#444] hover:bg-[#E0E0E0] border-0 rounded-full px-3 py-1">
            Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleEditProperty = () => {
    if (!effectivePropertyId || !propertyData) {
      toast.error("Property data not available");
      return;
    }

    if (onEditProperty) {
      onEditProperty();
    } else {
      // Show modal on desktop, navigate to page on mobile
      if (isMobileContext) {
        router.replace(
          `/${userRole}/edit-property?propertyId=${effectivePropertyId}`,
        );
      } else {
        setShowEditPropertyModal(true);
      }
    }
  };

  const handlePropertyUpdated = (updatedData: any) => {
    // Update local state with the new property data
    setPropertyData((prev: any) => ({
      ...prev,
      name: updatedData.name,
      address: updatedData.location, // Map location to address for display
      type: updatedData.type,
      bedrooms: updatedData.bedrooms,
      bathrooms: updatedData.bathrooms,
      // Update description immediately based on the new data
      description: `Property is a ${
        updatedData.bedrooms
      }-bedroom ${updatedData.type.toLowerCase()} located in ${
        updatedData.location
      }`,
    }));
    setShowEditPropertyModal(false);

    // Trigger a data refresh to ensure consistency
    // The mutation already invalidates queries, but this ensures immediate UI update
    refetch();
  };

  const handleDeactivateOpenChange = (open: boolean) => {
    setShowDeactivateModal(open);
    if (!open) {
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);
    }
  };

  const handleReactivateOpenChange = (open: boolean) => {
    setShowReactivateModal(open);
    if (!open) {
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);
    }
  };

  const handleDeactivateProperty = () => {
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = async () => {
    if (!effectivePropertyId) {
      toast.error("Property ID is missing");
      return;
    }

    try {
      await updatePropertyMutation.mutateAsync({
        property_status: "inactive",
        rental_price: null, // Clear rental price when deactivating
      });

      setShowDeactivateModal(false);
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);

      // Refresh the data - the mutation handles invalidation
      refetch();
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error deactivating property:", error);
    }
  };

  const handleReactivateProperty = async () => {
    // Close reactivate modal and directly reactivate to vacant status
    setShowReactivateModal(false);

    if (!effectivePropertyId) {
      toast.error("Property ID is missing");
      return;
    }

    try {
      await updatePropertyMutation.mutateAsync({
        property_status: "vacant",
      });

      toast.success("Property reactivated");
      refetch();
    } catch (error) {
      console.error("Error reactivating property:", error);
    }
  };

  const handleSaveRentPrice = async (price: number) => {
    if (!effectivePropertyId) {
      toast.error("Property ID is missing");
      return;
    }

    try {
      await updatePropertyMutation.mutateAsync({
        is_marketing_ready: true,
        rental_price: price,
      });

      setShowSetRentPriceModal(false);
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);

      toast.success("Property is now ready for marketing");

      // Refresh the data - the mutation handles invalidation
      refetch();
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error updating property:", error);
    }
  };

  const handleCancelRentPrice = () => {
    // Just close the modal without reactivating
    setShowSetRentPriceModal(false);
  };

  const handleSetReadyForMarketing = () => {
    // Open the rent price modal to set marketing price
    setShowSetRentPriceModal(true);
  };

  const handleRemoveFromMarketing = async () => {
    if (!effectivePropertyId) {
      toast.error("Property ID is missing");
      return;
    }

    try {
      await updatePropertyMutation.mutateAsync({
        is_marketing_ready: false,
        rental_price: null,
      });

      toast.success("Property removed from marketing");
      refetch();
    } catch (error) {
      console.error("Error removing property from marketing:", error);
    }
  };

  const confirmReactivate = async () => {
    // This is now just a confirmation step before showing the price modal
    setShowReactivateModal(false);
    setShowSetRentPriceModal(true);
  };

  const cancelReactivate = () => {
    setShowReactivateModal(false);
    setTimeout(() => {
      document.body.style.pointerEvents = "auto";
    }, 0);
  };

  // Keep old confirmReactivate logic as backup (not used anymore)
  const confirmReactivateOld = async () => {
    if (!effectivePropertyId) {
      toast.error("Property ID is missing");
      return;
    }

    try {
      await updatePropertyMutation.mutateAsync({
        property_status: "vacant",
      });

      setShowReactivateModal(false);
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);

      // Refresh the data - the mutation handles invalidation
      refetch();
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error reactivating property:", error);
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    setShowDeleteModal(open);
    if (!open) {
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);
    }
  };

  const handleDeleteProperty = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!effectivePropertyId) {
      toast.error("Property ID is missing");
      return;
    }

    try {
      await deletePropertyMutation.mutateAsync(effectivePropertyId);
      setShowDeleteModal(false);
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);
      // Navigate back to properties list after successful deletion
      router.push(`/${userRole}/properties`);
    } catch (err) {
      console.error("Error deleting property:", err);
      setShowDeleteModal(false);
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);
      // Error handling is done in the mutation
    }
  };

  const handleEndTenancy = () => {
    setShowEndTenancyModal(true);
  };

  const handleRenewTenancy = () => {
    setShowRenewTenancyModal(true);
  };

  const confirmEditTenancy = async (data: EditTenancyData) => {
    setIsEditingTenancy(true);
    try {
      const propertyTenantId = await getPropertyTenantId(
        effectivePropertyId!,
        propertyData?.currentTenant?.id ?? '',
      );
      if (!propertyTenantId) {
        toast.error("Could not find tenancy relationship. Please refresh and try again.");
        return;
      }

      if (editTenancyMode === "current") {
        await axiosInstance.patch(`/tenancies/${propertyTenantId}/active-rent`, {
          rentAmount: data.rentAmount,
          serviceCharge: data.serviceCharge,
          paymentFrequency: data.paymentFrequency,
        });
        toast.success("Tenancy details updated.");
      } else {
        const invoiceId = propertyData?.pendingRenewalInvoice?.id;
        if (invoiceId) {
          await axiosInstance.patch(`/tenancies/renewal-invoice/by-id/${invoiceId}`, {
            rentAmount: data.rentAmount,
            serviceCharge: data.serviceCharge,
            paymentFrequency: data.paymentFrequency,
            ...(data.endDate ? { endDate: data.endDate } : {}),
          });
        } else {
          await axiosInstance.post(`/tenancies/${propertyTenantId}/initiate-renewal`, {
            rentAmount: data.rentAmount,
            serviceCharge: data.serviceCharge,
            paymentFrequency: data.paymentFrequency,
            silent: true,
            ...(data.endDate ? { endDate: data.endDate } : {}),
          });
        }
        toast.success("Next period details saved.");
      }
      setEditTenancyMode(null);
      refetch();
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsEditingTenancy(false);
    }
  };

  const confirmEndTenancy = async (data: {
    reason: string;
    notes: string;
    effectiveDate: string;
  }) => {
    if (!propertyData?.currentTenant || !effectivePropertyId) {
      toast.error("Missing tenant or property information");
      return;
    }

    // Validate effective date
    const effectiveDate = new Date(data.effectiveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (effectiveDate < today) {
      toast.error("Effective date cannot be in the past.");
      return;
    }

    // Map frontend reason values to backend enum values
    const reasonMapping: Record<string, string> = {
      "Rent expired": "lease_ended",
      "Tenant requested": "early_termination",
      Eviction: "eviction",
      Other: "other",
    };

    const mappedReason = reasonMapping[data.reason] || "other";

    try {
      // Log end tenancy attempt for debugging
      console.log("Attempting to end tenancy:", {
        propertyId: effectivePropertyId,
        tenantId: propertyData.currentTenant.id,
        reason: mappedReason,
        effectiveDate: data.effectiveDate,
        notes: data.notes,
        timestamp: new Date().toISOString(),
      });

      await moveTenantOutMutation.mutateAsync({
        property_id: effectivePropertyId,
        tenant_id: propertyData.currentTenant?.id,
        move_out_date: data.effectiveDate,
        move_out_reason: mappedReason,
        owner_comment: data.notes || `Tenancy ended: ${data.reason}`,
      });

      setShowEndTenancyModal(false);
      // The mutation handles success toast and data refresh
    } catch (error) {
      console.error("Error in confirmEndTenancy:", {
        error: error instanceof Error ? error.message : String(error),
        propertyId: effectivePropertyId,
        tenantId: propertyData.currentTenant.id,
        formData: data,
        timestamp: new Date().toISOString(),
      });

      // Don't close modal on error to allow user to retry
      // The mutation handles error toast messages

      // If it's a validation error, keep the modal open
      if (error instanceof Error && error.message.includes("validation")) {
        // Modal stays open for user to fix validation issues
        return;
      }

      // For other errors, close modal after a delay to show error message
      setTimeout(() => {
        setShowEndTenancyModal(false);
      }, 2000);
    }
  };

  // Helper function to get the PropertyTenant ID (tenancy relationship ID)
  const getPropertyTenantId = async (
    propertyId: string,
    tenantId: string,
  ): Promise<string | null> => {
    try {
      // The PropertyTenant ID should be available in the property details
      // as currentTenant.tenancyId
      if (propertyData?.currentTenant?.tenancyId) {
        console.log(
          "Found PropertyTenant ID from property data:",
          propertyData.currentTenant.tenancyId,
        );
        return propertyData.currentTenant.tenancyId;
      }

      console.warn("PropertyTenant ID not found in property data");
      return null;
    } catch (error) {
      console.error("Error getting PropertyTenant ID:", error);
      return null;
    }
  };

  const confirmRenewTenancy = async (data: RenewTenancyData) => {
    if (!propertyData?.currentTenant || !effectivePropertyId) {
      toast.error(
        "Missing tenant or property information. Please refresh the page and try again.",
      );
      return;
    }

    // Set loading state immediately
    setIsRenewing(true);

    // Check network connectivity before proceeding
    const isOnline = await checkNetworkConnectivity();
    if (!isOnline) {
      toast.error(
        "No internet connection. Please check your network and try again.",
      );
      setIsRenewing(false);
      return;
    }

    // Get the PropertyTenant ID for renewal operations
    const propertyTenantId = await getPropertyTenantId(
      effectivePropertyId,
      propertyData.currentTenant?.id,
    );

    if (!propertyTenantId) {
      toast.error(
        "Could not find tenancy relationship. Please refresh the page and try again.",
      );
      console.error("PropertyTenant ID not found:", {
        propertyId: effectivePropertyId,
        tenantId: propertyData.currentTenant?.id,
        currentTenant: propertyData.currentTenant,
      });
      setIsRenewing(false);
      return;
    }

    // Validate form data before processing
    const rentAmount = parseFloat(data.rentAmount.replace(/,/g, ""));
    if (isNaN(rentAmount) || rentAmount <= 0) {
      toast.error("Invalid rent amount. Please enter a valid number.");
      setIsRenewing(false);
      return;
    }

    // Parse service charge
    const serviceChargeAmount = data.serviceCharge
      ? parseFloat(data.serviceCharge.replace(/,/g, ""))
      : 0;

    // Transform form data to API format
    const renewalData = {
      rentAmount,
      paymentFrequency: data.paymentFrequency,
      serviceCharge: isNaN(serviceChargeAmount) ? 0 : serviceChargeAmount,
      ...(data.endDate ? { endDate: data.endDate } : {}),
    };

    try {
      // Call the new renewal invoice initiation API
      // The loading state is shown on the modal button via isLoading prop
      const response = await axiosInstance.post(
        `/tenancies/${propertyTenantId}/initiate-renewal`,
        renewalData,
      );

      // Refresh property data to show updated history
      refetch();

      // Close the modal after success
      setShowRenewTenancyModal(false);
    } catch (error) {
      // Dismiss any loading toasts
      toast.dismiss();

      console.error("Error in confirmRenewTenancy:", {
        error: error instanceof Error ? error.message : String(error),
        propertyTenantId,
        propertyId: effectivePropertyId,
        formData: data,
        renewalData: renewalData,
        timestamp: new Date().toISOString(),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Provide user-friendly error messages based on error type
      if (error instanceof Error) {
        if (
          error.message.includes("404") ||
          error.message.includes("not found")
        ) {
          toast.error(
            "Tenancy not found. Please refresh the page and try again.",
          );
        } else if (
          error.message.includes("400") ||
          error.message.includes("validation")
        ) {
          toast.error(
            "Invalid data provided. Please check your input and try again.",
          );
          // Keep modal open for validation errors
          return;
        } else if (
          error.message.includes("403") ||
          error.message.includes("permission")
        ) {
          toast.error("You don't have permission to renew this tenancy.");
        } else if (
          error.message.includes("network") ||
          error.message.includes("connection")
        ) {
          toast.error(
            "Network error. Please check your connection and try again.",
          );
        } else {
          toast.error(
            error.message || "Failed to renew tenancy. Please try again.",
          );
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }

      // For non-validation errors, close modal after a delay
      if (!error || !error.toString().includes("validation")) {
        setTimeout(() => {
          setShowRenewTenancyModal(false);
        }, 2000);
      }
    } finally {
      setIsRenewing(false);
    }
  };

  const handleSyncPropertyStatuses = async () => {
    try {
      await syncPropertyStatusesMutation.mutateAsync();
      // Refresh the property data after sync
      refetch();
    } catch (error) {
      console.error("Error syncing property statuses:", error);
      // Error handling is done in the mutation
    }
  };

  const handleViewTenantKYC = async () => {
    if (!propertyData?.currentTenant?.id) {
      toast.error("Tenant information not available");
      return;
    }

    try {
      // Fetch KYC applications for this tenant
      const applications = await KYCService.getApplicationsByTenant(
        propertyData.currentTenant?.id,
      );

      if (applications.length === 0) {
        toast.error("No KYC application found for this tenant");
        return;
      }

      // Get the most recent application (or the approved one if available)
      const approvedApp = applications.find((app) => app.status === "approved");
      const targetApp = approvedApp || applications[0];

      // Navigate to KYC application detail page
      router.push(
        `/${userRole}/kyc-application-detail/${
          targetApp.id
        }?propertyName=${encodeURIComponent(
          propertyData.name,
        )}&propertyStatus=${
          propertyData.status
        }&propertyId=${effectivePropertyId}`,
      );
    } catch (error) {
      console.error("Error fetching tenant KYC:", error);
      toast.error("Failed to load tenant KYC information");
    }
  };

  const handleGenerateKYCLink = () => {
    setShowGenerateKYCModal(true);
  };

  const handleAttachTenant = (applicationId: string) => {
    const application = kycApplications.find((app) => app.id === applicationId);
    if (application) {
      setSelectedApplication(application);
      setShowAttachTenantModal(true);
    }
  };

  const handleOpenKYCDetail = (application: KYCApplication) => {
    const url = `/${userRole}/kyc-application-detail/${
      application.id
    }?propertyName=${encodeURIComponent(
      propertyData?.name || "",
    )}&propertyStatus=${
      propertyData?.status
    }&propertyId=${effectivePropertyId}`;

    router.push(url);
  };

  const formatKYCDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatKYCTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper to get payment status badge
  const getPaymentStatusBadge = (
    application: KYCApplicationWithPayment,
  ): { label: string; color: string } | null => {
    if (!application.offerLetter) return null;

    const amountPaid = application.offerLetter.amountPaid || 0;
    const totalAmount = application.offerLetter.totalAmount || 0;

    if (totalAmount === 0) return null;

    if (amountPaid === 0) {
      return {
        label: "Not Started",
        color: "bg-gray-100 text-gray-700 border-gray-200",
      };
    } else if (amountPaid >= totalAmount) {
      return {
        label: "Fully Paid",
        color: "bg-green-100 text-green-700 border-green-200",
      };
    } else {
      return {
        label: "In Progress",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      };
    }
  };

  // Helper to calculate payment percentage
  const getPaymentPercentage = (
    application: KYCApplicationWithPayment,
  ): number => {
    if (!application.offerLetter) return 0;

    const amountPaid = application.offerLetter.amountPaid || 0;
    const totalAmount = application.offerLetter.totalAmount || 0;

    if (totalAmount === 0) return 0;

    return Math.min(100, Math.round((amountPaid / totalAmount) * 100));
  };

  const handleTenantAttachment = async (tenancyDetails: TenancyDetails) => {
    if (!selectedApplication) return;

    try {
      await attachTenantFromKYCMutation.mutateAsync({
        applicationId: selectedApplication.id,
        tenancyDetails,
      });

      // Close modal and reset state on success
      setShowAttachTenantModal(false);
      setSelectedApplication(null);

      // Add a small delay to ensure backend processing is complete
      // then refresh property data (includes updated KYC applications and status)
      // Requirements: 6.4 - Ensure proper data refresh after tenant attachment
      setTimeout(() => {
        refetch();
        refetchKYCApplications();
      }, 1000);
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error in handleTenantAttachment:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <LandlordTopNav
        title={propertyData?.name || ""}
        subtitle={propertyData?.address || ""}
        onBack={handleBack}
        onAddProperty={handleAddProperty}
        onAddTenant={handleAddTenant}
        isMobile={isMobile}
      />

      {/* Main Content Container with padding for fixed nav */}
      <div className="pt-[73px] lg:pt-[81px]">
        <div className="bg-white border-b border-gray-200">
          <div>
            <div className="flex items-center border-b border-gray-200 -mb-[1px] px-[52px] py-[0px]">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-3 border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-[#FF5000] text-[#FF5000]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`py-3 border-b-2 transition-colors ${
                    activeTab === "history"
                      ? "border-[#FF5000] text-[#FF5000]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Property History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ready for Marketing Banner */}
      {propertyData?.isMarketingReady && propertyData.rentalPrice && (
        <div className="bg-[#FFF4E6] border-l-4 border-[#FF5000] py-4">
          <div className="px-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Marketing Price:{" "}
                <span className="font-semibold text-[#FF5000]">
                  {formatCurrency(propertyData.rentalPrice)} per year
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Deactivated Banner */}
      {propertyData?.status?.toUpperCase() === "INACTIVE" && (
        <div className="bg-gray-50 border-l-4 border-[#FF5000] py-4">
          <div className="px-6">
            <p className="text-sm text-gray-700">
              This property is currently deactivated. Tenants cannot be assigned
              to inactive properties.
            </p>
          </div>
        </div>
      )}

      {/* Show warning for data inconsistency */}
      {propertyData?.status === "Occupied" &&
        !propertyData?.rent &&
        !propertyData?.currentTenant && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 py-4">
            <div className="px-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Data Inconsistency Detected
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    This property shows as occupied but has no active tenant or
                    rent record. This inconsistency will be automatically fixed,
                    or you can manually sync using the "Fix Status" option in
                    the menu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Tab Content */}
      <div className="px-6 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Property Description Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                {/* Property Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center justify-center transition-all duration-200 hover:opacity-70"
                      aria-label="Property actions menu"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56 bg-white rounded-xl shadow-lg border border-gray-200/50 p-1.5"
                  >
                    {availableActions.canEdit && (
                      <DropdownMenuItem
                        onClick={handleEditProperty}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Property</span>
                      </DropdownMenuItem>
                    )}

                    {/* Ready for Marketing / Remove from Marketing */}
                    {propertyData?.status !== "Occupied" &&
                      propertyData?.status !== "Inactive" &&
                      !propertyData?.isMarketingReady && (
                        <DropdownMenuItem
                          onClick={handleSetReadyForMarketing}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Ready for Marketing</span>
                        </DropdownMenuItem>
                      )}

                    {propertyData?.isMarketingReady && (
                      <DropdownMenuItem
                        onClick={handleRemoveFromMarketing}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150"
                      >
                        <UserMinus className="w-4 h-4" />
                        <span>Remove from Marketing</span>
                      </DropdownMenuItem>
                    )}

                    {availableActions.canDeactivate && (
                      <DropdownMenuItem
                        onClick={handleDeactivateProperty}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150"
                      >
                        <PowerOff className="w-4 h-4" />
                        <span>Deactivate Property</span>
                      </DropdownMenuItem>
                    )}

                    {availableActions.canReactivate && (
                      <DropdownMenuItem
                        onClick={handleReactivateProperty}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reactivate Property</span>
                      </DropdownMenuItem>
                    )}

                    {/* Show sync option if there's a data inconsistency */}
                    {propertyData?.status === "Occupied" &&
                      !propertyData?.rent &&
                      !propertyData?.currentTenant && (
                        <DropdownMenuItem
                          onClick={handleSyncPropertyStatuses}
                          disabled={syncPropertyStatusesMutation.isPending}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150"
                        >
                          <Settings className="w-4 h-4" />
                          <span>
                            {syncPropertyStatusesMutation.isPending
                              ? "Syncing..."
                              : "Fix Status"}
                          </span>
                        </DropdownMenuItem>
                      )}

                    {availableActions.canDelete && (
                      <>
                        <DropdownMenuSeparator className="my-1.5 bg-gray-100" />
                        <DropdownMenuItem
                          onClick={handleDeleteProperty}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Property</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <h2 className="text-gray-900">Property Description</h2>
              </div>
              <p className="text-sm text-gray-500 px-[28px] py-0">
                {propertyData.description}
              </p>

              {/* Facility Manager line */}
              {(() => {
                const fm = getAssignedManager(propertyData.name || "");
                return (
                  <p className="text-sm text-gray-500 px-[28px] pt-2 pb-0">
                    Facility Manager:{" "}
                    <button
                      onClick={() => setShowFMModal(true)}
                      className="text-[#FF5000] hover:text-[#E64800] hover:underline font-medium transition-colors"
                    >
                      {fm ? fm.name : "None"}
                    </button>
                  </p>
                );
              })()}
            </div>

            {/* Tenancy Details Section - Only for Occupied Properties */}
            {propertyData?.status?.toUpperCase() === "OCCUPIED" &&
              propertyData.currentTenant && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    {/* Tenancy Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex items-center justify-center transition-all duration-200 hover:opacity-70"
                          aria-label="Tenancy actions menu"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-56 bg-white rounded-xl shadow-lg border border-gray-200/50 p-1.5"
                      >
                        <DropdownMenuItem
                          onClick={handleRenewTenancy}
                          disabled={
                            renewTenancyMutation.isPending ||
                            moveTenantOutMutation.isPending ||
                            updatePropertyMutation.isPending
                          }
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors duration-150"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>
                            {renewTenancyMutation.isPending
                              ? "Renewing..."
                              : "Renew Tenancy"}
                          </span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1.5 bg-gray-100" />

                        <DropdownMenuItem
                          onClick={() => setEditTenancyMode("current")}
                          disabled={
                            renewTenancyMutation.isPending ||
                            moveTenantOutMutation.isPending ||
                            updatePropertyMutation.isPending ||
                            isEditingTenancy
                          }
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors duration-150"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit Tenancy</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1.5 bg-gray-100" />

                        {/* <DropdownMenuItem
                          onClick={handleViewTenantKYC}
                          disabled={
                            renewTenancyMutation.isPending ||
                            moveTenantOutMutation.isPending ||
                            updatePropertyMutation.isPending
                          }
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#FFF3EB] transition-colors duration-150"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Tenant KYC</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1.5 bg-gray-100" /> */}

                        <DropdownMenuItem
                          onClick={handleEndTenancy}
                          disabled={
                            moveTenantOutMutation.isPending ||
                            renewTenancyMutation.isPending ||
                            updatePropertyMutation.isPending
                          }
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>
                            {moveTenantOutMutation.isPending
                              ? "Ending..."
                              : "End Tenancy"}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex-1">
                      <h2 className="text-gray-900">Tenancy Details</h2>
                      {propertyData.currentTenant?.renewalStatus ===
                        "pending" && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 rounded-full px-3 py-1 mt-2">
                          Renewal Sent · Awaiting Payment
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Tenant Information Block */}
                  <div className="flex items-start gap-4 mb-[21px] pb-[21px] border-b border-gray-100 pt-[0px] pr-[0px] pl-[0px] mt-[0px] mr-[0px] ml-[28px]">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={propertyData.currentTenant.passportPhoto}
                        alt={propertyData.currentTenant.name}
                      />
                      <AvatarFallback className="bg-[#FFF3EB]">
                        <User className="w-6 h-6 text-[#FF5000]" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <button
                        onClick={() =>
                          handleTenantClick(propertyData.currentTenant!.id)
                        }
                        className="flex items-center gap-1 text-[#FF5000] font-semibold mb-1 hover:underline transition-all cursor-pointer text-left"
                      >
                        <span>{propertyData.currentTenant.name}</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{propertyData.currentTenant.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tenancy Info */}
                  <div className="ml-[28px] mb-5 grid grid-cols-2 gap-x-8 gap-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Tenancy Type</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {propertyData.currentTenant.paymentCycle ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Tenancy Start Date</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {propertyData.currentTenant.tenancyStartDate
                          ? formatDate(propertyData.currentTenant.tenancyStartDate)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Outstanding Balance */}
                  {(propertyData.currentTenant?.outstandingBalance ?? 0) > 0 && (
                    <div className="ml-[28px] mb-6">
                      <p className="text-xs text-gray-400 mb-1">Outstanding Balance</p>
                      <p className="text-lg font-bold text-red-500">
                        ₦{propertyData.currentTenant!.outstandingBalance!.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* ── Charges ─────────────────────────────────────── */}
                  {(() => {
                    const FREQ_LABELS: Record<string, string> = {
                      weekly: "Weekly",
                      monthly: "Monthly",
                      quarterly: "Quarterly",
                      annually: "Annually",
                    };
                    const formatNextDue = (iso: string) => {
                      const d = new Date(iso);
                      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                    };
                    const paymentCycle = (propertyData.currentTenant.paymentCycle ?? "").toLowerCase();
                    const rentDue = propertyData.rentExpiryDate ?? "";

                    type ChargeEntry =
                      | { kind: "recurring"; name: string; amount: number; frequency: string; nextDueDate: string }
                      | { kind: "one-time"; name: string; amount: number; dueDate: string };

                    const entries: ChargeEntry[] = [];

                    if (propertyData.rent) {
                      entries.push({ kind: "recurring", name: "Rent", amount: propertyData.rent, frequency: paymentCycle, nextDueDate: rentDue });
                    }
                    if ((propertyData.serviceCharge ?? 0) > 0) {
                      entries.push({ kind: "recurring", name: "Service Charge", amount: propertyData.serviceCharge!, frequency: paymentCycle, nextDueDate: rentDue });
                    }
                    if ((propertyData.legalFee ?? 0) > 0) {
                      entries.push({ kind: "one-time", name: "Legal Fee", amount: propertyData.legalFee!, dueDate: rentDue });
                    }
                    if ((propertyData.agencyFee ?? 0) > 0) {
                      entries.push({ kind: "one-time", name: "Agency Fee", amount: propertyData.agencyFee!, dueDate: rentDue });
                    }
                    propertyData.additionalFees?.forEach((fee) => {
                      entries.push({ kind: "one-time", name: fee.name, amount: fee.amount, dueDate: rentDue });
                    });
                    const recurringCharges: RecurringCharge[] = getRecurringCharges(propertyData.name || "");
                    recurringCharges.forEach((charge) => {
                      entries.push({ kind: "recurring", name: charge.feeName, amount: charge.amount, frequency: charge.frequency, nextDueDate: charge.nextDueDate });
                    });

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 my-8 ml-[28px]">
                        {entries.map((entry, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-gray-900 font-medium">{entry.name}</span>
                              <span className="text-sm font-semibold text-gray-900">— ₦{entry.amount.toLocaleString()}</span>
                            </div>
                            {entry.kind === "recurring" ? (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {FREQ_LABELS[entry.frequency] ?? entry.frequency}
                                {entry.nextDueDate ? ` · Next due: ${formatNextDue(entry.nextDueDate)}` : ""}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 mt-0.5">
                                One-time{entry.dueDate ? ` · Due: ${formatNextDue(entry.dueDate)}` : ""}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Payment Plans row */}
                  <button
                    type="button"
                    onClick={() => {
                      const seen = new Set<string>();
                      const charges = [
                        ...(propertyData.rent ? [{ name: "Rent", amount: propertyData.rent }] : []),
                        ...((propertyData.serviceCharge ?? 0) > 0 ? [{ name: "Service Charge", amount: propertyData.serviceCharge! }] : []),
                        ...((propertyData.legalFee ?? 0) > 0 ? [{ name: "Legal Fee", amount: propertyData.legalFee! }] : []),
                        ...((propertyData.agencyFee ?? 0) > 0 ? [{ name: "Agency Fee", amount: propertyData.agencyFee! }] : []),
                        ...(propertyData.additionalFees?.map((f) => ({ name: f.name, amount: f.amount })) ?? []),
                        ...getRecurringCharges(propertyData.name || "").map((c) => ({ name: c.feeName, amount: c.amount })),
                      ].filter((c) => { if (seen.has(c.name)) return false; seen.add(c.name); return true; });
                      const params = new URLSearchParams({
                        property: propertyData?.name || "",
                        tenant: propertyData?.currentTenant?.id || "",
                        charges: JSON.stringify(charges),
                      });
                      router.push(`/landlord/payment-plans?${params.toString()}`);
                    }}
                    className="flex items-center gap-1 ml-[28px] mb-4 text-left group cursor-pointer"
                  >
                    <span className="text-sm font-medium text-[#FF5000] underline-offset-2 group-hover:underline transition-all">
                      Payment Plans
                    </span>
                    <svg className="w-3.5 h-3.5 text-[#FF5000] opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* ── Billing ──────────────────────────────────────── */}
                  {propertyData.rentExpiryDate && (propertyData.pendingRenewalInvoice || propertyData.rent) && (() => {
                    const paymentCycle = (propertyData.currentTenant.paymentCycle ?? "annually").toLowerCase();
                    const rentDue = propertyData.rentExpiryDate ?? "";

                    const formatDueLabel = (iso: string) =>
                      iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

                    type ChargeItem = { name: string; amount: number; frequency: string; dueDate: string };
                    const allCharges: ChargeItem[] = [];
                    if (propertyData.rent) allCharges.push({ name: "Rent", amount: propertyData.rent, frequency: paymentCycle, dueDate: rentDue });
                    if ((propertyData.serviceCharge ?? 0) > 0) allCharges.push({ name: "Service Charge", amount: propertyData.serviceCharge!, frequency: paymentCycle, dueDate: rentDue });
                    if ((propertyData.legalFee ?? 0) > 0) allCharges.push({ name: "Legal Fee", amount: propertyData.legalFee!, frequency: "one-time", dueDate: rentDue });
                    if ((propertyData.agencyFee ?? 0) > 0) allCharges.push({ name: "Agency Fee", amount: propertyData.agencyFee!, frequency: "one-time", dueDate: rentDue });
                    propertyData.additionalFees?.forEach((fee) => allCharges.push({ name: fee.name, amount: fee.amount, frequency: "one-time", dueDate: rentDue }));
                    getRecurringCharges(propertyData.name || "").forEach((charge) => allCharges.push({ name: charge.feeName, amount: charge.amount, frequency: charge.frequency, dueDate: charge.nextDueDate }));

                    const annualGroup = allCharges.filter(c => ["annually", "annual", "yearly"].includes(c.frequency));
                    const monthlyGroup = allCharges.filter(c => c.frequency === "monthly");
                    const quarterlyGroup = allCharges.filter(c => c.frequency === "quarterly");
                    const weeklyGroup = allCharges.filter(c => c.frequency === "weekly");
                    const oneTimeGroup = allCharges.filter(c => c.frequency === "one-time");

                    const billingGroups: { key: string; label: string; items: ChargeItem[] }[] = [
                      { key: "billing-annual", label: "Annual Charges", items: annualGroup },
                      { key: "billing-monthly", label: "Monthly Charges", items: monthlyGroup },
                      { key: "billing-quarterly", label: "Quarterly Charges", items: quarterlyGroup },
                      { key: "billing-weekly", label: "Weekly Charges", items: weeklyGroup },
                      { key: "billing-onetime", label: "One-time Charges", items: oneTimeGroup },
                    ].filter(g => g.items.length > 0);

                    const annualTotal = annualGroup.reduce((s, c) => s + c.amount, 0);
                    const monthlyTotal = monthlyGroup.reduce((s, c) => s + c.amount, 0);
                    const nextPaymentAmount = annualTotal > 0 ? annualTotal : monthlyTotal > 0 ? monthlyTotal : allCharges.reduce((s, c) => s + c.amount, 0);

                    const recurringRent = propertyData.pendingRenewalInvoice?.rentAmount ?? propertyData.rent ?? 0;
                    const recurringServiceCharge = propertyData.pendingRenewalInvoice?.serviceCharge ?? propertyData.serviceCharge ?? 0;
                    const breakdownTotal = propertyData.pendingRenewalInvoice
                      ? propertyData.pendingRenewalInvoice.totalAmount
                      : recurringRent + recurringServiceCharge;

                    const nextDueLabel = rentDue
                      ? new Date(rentDue).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—";

                    return (
                      <div className="pt-4 mt-2 border-t border-gray-100 ml-[28px] max-w-2xl">
                        {/* Billing header */}
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <p className="text-xl font-bold text-gray-900">Billing</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => setEditTenancyMode("next-period")}
                              className="font-medium text-[#FF5000] hover:underline transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">
                          The tenant is expected to pay{" "}
                          <span className="font-semibold">{formatCurrency(nextPaymentAmount)}</span>
                          {" "}by {nextDueLabel}
                          <button
                            type="button"
                            onClick={() => setShowBillingBreakdown(v => !v)}
                            className="inline-flex items-center ml-1 text-gray-400 hover:text-gray-600 transition-colors align-middle"
                            aria-label="View billing breakdown"
                          >
                            <Info className="w-4 h-4" />
                          </button>.
                        </p>

                        {/* Breakdown panel — anchored below summary sentence */}
                        {showBillingBreakdown && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-1.5">
                            <div className="flex justify-between text-gray-700">
                              <span>Rent</span>
                              <span className="font-medium">{formatCurrency(recurringRent)}</span>
                            </div>
                            {recurringServiceCharge > 0 && (
                              <div className="flex justify-between text-gray-700">
                                <span>Service Charge</span>
                                <span className="font-medium">{formatCurrency(recurringServiceCharge)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5">
                              <span>Total</span>
                              <span>{formatCurrency(breakdownTotal)}</span>
                            </div>
                          </div>
                        )}

                        {/* Two-card layout */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">

                          {/* LEFT — collapsible charge groups */}
                          <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
                            <div className="divide-y divide-gray-100">
                              {billingGroups.map((group) => {
                                const isOpen = expandedChargeGroups[group.key] === true;
                                return (
                                  <div key={group.key}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedChargeGroups(prev => ({ ...prev, [group.key]: !isOpen }))}
                                      className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                                    >
                                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{group.label}</span>
                                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </button>
                                    {isOpen && (
                                      <div className="px-4 pb-3 space-y-2">
                                        {group.items.map((item, ii) => (
                                          <div key={ii} className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                              <span className="text-sm text-gray-700">{item.name}</span>
                                              {item.dueDate && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                  {group.key === "billing-onetime" ? "Due" : "Next due"}: {formatDueLabel(item.dueDate)}
                                                </p>
                                              )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 shrink-0">₦{item.amount.toLocaleString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* RIGHT — invoice summary card */}
                          <div className="sm:w-[220px] border border-gray-200 rounded-xl bg-white p-5 flex flex-col gap-4">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Next Invoice Amount</p>
                              <p className="text-2xl font-bold text-gray-900">₦600,000</p>
                              {rentDue && (
                                <p className="text-sm text-gray-500 mt-1">Next invoice is due {nextDueLabel}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowBillingBreakdown(v => !v)}
                              className="w-full border border-gray-200 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              View all invoices
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                </div>
              )}

            {/* Error state for OCCUPIED property without tenant data */}
            {propertyData?.status?.toUpperCase() === "OCCUPIED" &&
              !propertyData.currentTenant && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Tenant Information Unavailable
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        Unable to load tenant information. The property appears
                        to be occupied but tenant details could not be
                        retrieved. Tenancy actions are not available.
                      </p>
                      <div className="mt-3">
                        <Button
                          onClick={() => refetch()}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                          className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-2"></div>
                              Retrying...
                            </>
                          ) : (
                            "Retry Loading"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {propertyData?.status?.toUpperCase() === "VACANT" && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm flex flex-col items-start justify-start text-left px-[18px] py-[14px]">
                  <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Home className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 mb-2">
                    This property is vacant
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Generate a KYC link to start receiving tenant applications.
                  </p>
                  <Button
                    onClick={handleGenerateKYCLink}
                    className="bg-[#FF5000] hover:bg-[#E64500] text-white rounded-xl"
                  >
                    Generate KYC Link
                  </Button>
                </div>

                {/* KYC Applications List for Vacant Properties */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gray-900">KYC Applications</h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {isLoadingStatistics ? (
                        <span>Loading statistics...</span>
                      ) : kycStatistics ? (
                        <span>{kycStatistics.total} applications</span>
                      ) : (
                        <span>0 applications</span>
                      )}
                    </div>
                  </div>

                  {kycApplicationsError ? (
                    <div className="text-center py-8 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-red-800 mb-2">
                        Failed to Load Applications
                      </h3>
                      <p className="text-red-600 mb-4 text-sm">
                        {(kycApplicationsError as any)?.message ||
                          "Unable to fetch KYC applications for this property."}
                      </p>
                      <Button
                        onClick={() => refetchKYCApplications()}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Retry Loading
                      </Button>
                    </div>
                  ) : isLoadingApplications ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5000]"></div>
                      <span className="ml-2 text-gray-600">
                        Loading applications...
                      </span>
                    </div>
                  ) : kycApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        No KYC applications yet
                      </p>
                      <p className="text-sm text-gray-500">
                        Applications will appear here when prospective tenants
                        submit KYC forms for this property.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {kycApplications.map((application) => {
                        // Cast to extended type for payment fields
                        const app = application as KYCApplicationWithPayment;

                        // Get offer status from application
                        const getOfferStatus = (
                          app: any,
                        ):
                          | "Sent"
                          | "Saved"
                          | "Accepted"
                          | "Declined"
                          | undefined => {
                          const status =
                            app.offerLetterStatus || app.offerLetter?.status;
                          if (status === "pending") {
                            // Check if offer was actually sent or just saved
                            return app.offerLetter?.sentAt ? "Sent" : "Saved";
                          }
                          if (status === "accepted") return "Accepted";
                          if (status === "rejected") return "Declined";
                          return undefined;
                        };

                        const offerStatus = getOfferStatus(app);

                        return (
                          <div
                            key={app.id}
                            onClick={() => handleOpenKYCDetail(app)}
                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#FF5000]/30 hover:bg-[#FF5000]/[0.02] transition-all cursor-pointer"
                          >
                            <div className="flex flex-col gap-3">
                              {/* Top row: Name and Rent Amount */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-sm text-gray-900 mb-1">
                                    {app.firstName} {app.lastName}
                                  </h3>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-sm text-gray-500">
                                    <span className="text-gray-900">
                                      {formatCurrency(
                                        (app as KYCApplicationWithPayment)
                                          .proposedRentAmount
                                          ? typeof (
                                              app as KYCApplicationWithPayment
                                            ).proposedRentAmount === "string"
                                            ? parseFloat(
                                                (
                                                  app as KYCApplicationWithPayment
                                                ).proposedRentAmount as string,
                                              )
                                            : ((
                                                app as KYCApplicationWithPayment
                                              ).proposedRentAmount as number)
                                          : null,
                                      )}
                                      /
                                      {(app as KYCApplicationWithPayment)
                                        .rentPaymentFrequency || "month"}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              {/* Payment Progress Section - Only show if offer letter exists */}
                              {/* {(() => {
                                if (
                                  app.offerLetter &&
                                  app.offerLetter.totalAmount
                                ) {
                                  const amountPaid =
                                    app.offerLetter.amountPaid || 0;
                                  const totalAmount =
                                    app.offerLetter.totalAmount || 0;
                                  const percentage = getPaymentPercentage(app);

                                  return (
                                    <div className="pt-2 border-t border-gray-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs text-gray-500">
                                          Payment Progress
                                        </p>
                                        <p className="text-xs font-medium text-gray-900">
                                          {formatCurrency(amountPaid)} /{" "}
                                          {formatCurrency(totalAmount)}
                                        </p>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div
                                          className="bg-[#FF5000] h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {percentage}% paid
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              })()} */}

                              {/* Date/Time and Badges */}
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-gray-400">
                                  {formatKYCDate(app.submissionDate)} •{" "}
                                  {formatKYCTime(app.submissionDate)}
                                </p>
                                <div className="flex items-center gap-2">
                                  {/* Payment Status Badge */}
                                  {/* {(() => {
                                    const paymentBadge =
                                      getPaymentStatusBadge(app);
                                    if (paymentBadge) {
                                      return (
                                        <span
                                          className={`text-xs px-2 py-1 rounded-full border ${paymentBadge.color}`}
                                        >
                                          {paymentBadge.label}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()} */}

                                  {/* Offer Status Badge */}
                                  {offerStatus && (
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full border ${
                                        offerStatus === "Sent"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : offerStatus === "Saved"
                                            ? "bg-gray-50 text-gray-700 border-gray-200"
                                            : offerStatus === "Accepted"
                                              ? "bg-green-50 text-green-700 border-green-200"
                                              : "bg-gray-100 text-gray-700 border-gray-200"
                                      }`}
                                    >
                                      Offer {offerStatus}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "history" && (
          <div className="space-y-6">
            {propertyHistory.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
                {(() => {
                  const grouped = groupHistoryByMonth(propertyHistory);
                  const monthKeys = Object.keys(grouped);
                  return monthKeys.map((monthLabel, groupIndex) => (
                    <div key={monthLabel}>
                      {/* Month/Year Label */}
                      <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {monthLabel}
                        </h3>
                        <div className="mt-2 border-t border-gray-200" />
                      </div>

                      {/* Timeline Container - exact match to design reference */}
                      <div className="relative pl-8">
                        {/* Vertical timeline line - exact positioning + height */}
                        {grouped[monthLabel].length > 1 && (
                          <div
                            className="absolute left-[7px] top-[20px] bottom-[20px] w-[1px] bg-neutral-200"
                            style={{ height: `calc(100% - 40px)` }}
                          />
                        )}

                        {grouped[monthLabel].map((event: any) => {
                          const isClickable =
                            event.eventType === "kyc_submitted";

                          return (
                            <div
                              key={event.id}
                              className="relative pb-6 last:pb-0"
                            >
                              {/* Timeline dot - EXACT 6px size + alignment from design reference */}
                              <div className="absolute left-[-24px] top-[16px] w-[6px] h-[6px] rounded-full bg-neutral-400" />

                              {/* User added history event label */}
                              {(event.eventType === "user_added_tenancy" ||
                                event.eventType === "user_added_payment") && (
                                <p className="relative z-10 text-xs font-semibold text-blue-600 mb-1 ml-3">
                                  User added history event
                                </p>
                              )}

                              {/* Event wrapper - exact hover layout from design reference */}
                              <div
                                className={`relative flex items-start gap-4 w-full text-left group rounded-lg p-3 -m-3 transition-all duration-200 ${
                                  isClickable
                                    ? "cursor-pointer hover:bg-neutral-50"
                                    : event.eventType ===
                                          "user_added_tenancy" ||
                                        event.eventType === "user_added_payment"
                                      ? "cursor-default hover:bg-neutral-50"
                                      : ""
                                }`}
                                onClick={() => {
                                  if (isClickable) {
                                    const appId = event.id.replace("kyc-", "");
                                    router.push(
                                      `/${userRole}/kyc-application-detail/${appId}?propertyName=${encodeURIComponent(
                                        propertyData?.name || "",
                                      )}&propertyStatus=${propertyData?.status}&propertyId=${effectivePropertyId}`,
                                    );
                                  }
                                }}
                              >
                                {/* Event content */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium truncate ${
                                      isClickable
                                        ? "text-[#FF5000]"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {event.title}
                                    {event.details && (
                                      <span className="text-gray-500 font-normal">
                                        {" "}
                                        —{" "}
                                        {(() => {
                                          if (
                                            event.eventType ===
                                              "user_added_tenancy" ||
                                            event.eventType ===
                                              "user_added_payment"
                                          ) {
                                            try {
                                              const d = JSON.parse(
                                                event.details,
                                              );
                                              const tenantName =
                                                d.tenantName || "";
                                              return tenantName;
                                            } catch {
                                              /* fall through */
                                            }
                                          }
                                          return event.details;
                                        })()}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatTimelineDateTime(event.date)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Spacing between month groups - exact match */}
                      {groupIndex < monthKeys.length - 1 && (
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
                    No history available for this property
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{propertyData?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={confirmDelete}
              disabled={deletePropertyMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePropertyMutation.isPending
                ? "Deleting..."
                : "Delete Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Modal */}
      <Dialog
        open={showDeactivateModal}
        onOpenChange={handleDeactivateOpenChange}
      >
        <DialogContent className="bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle>Deactivate Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate "{propertyData?.name}"? You
              can reactivate it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={confirmDeactivate}
              disabled={updatePropertyMutation.isPending}
              className="bg-[#FF5000] hover:bg-[#E64500] text-white"
            >
              {updatePropertyMutation.isPending
                ? "Deactivating..."
                : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Modal */}
      <Dialog
        open={showReactivateModal}
        onOpenChange={handleReactivateOpenChange}
      >
        <DialogContent className="bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle>Reactivate Property</DialogTitle>
            <DialogDescription>
              Reactivating "{propertyData?.name}" will make it available for
              tenant applications. You'll need to set a rental price.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={cancelReactivate}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={confirmReactivate}
              className="bg-[#FF5000] hover:bg-[#E64500] text-white"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Rent Price Modal */}
      <SetRentPriceRangeModal
        isOpen={showSetRentPriceModal}
        onClose={() => setShowSetRentPriceModal(false)}
        onSave={handleSaveRentPrice}
        onCancel={handleCancelRentPrice}
        propertyName={propertyData?.name || ""}
      />

      {/* Facility Manager selection modal */}
      {showFMModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Assign Facility Manager</h2>
              <button onClick={() => setShowFMModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="py-2 max-h-72 overflow-y-auto">
              {/* None option */}
              <li>
                <button
                  onClick={() => { setAssignedManager(propertyData?.name || "", null); setShowFMModal(false); }}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${
                    !getAssignedManager(propertyData?.name || "") ? "font-medium text-[#FF5000]" : "text-gray-500"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    !getAssignedManager(propertyData?.name || "") ? "border-[#FF5000]" : "border-gray-300"
                  }`}>
                    {!getAssignedManager(propertyData?.name || "") && <span className="w-2 h-2 rounded-full bg-[#FF5000]" />}
                  </span>
                  None
                </button>
              </li>
              {MOCK_FM_LIST.map((fm) => {
                const isSelected = getAssignedManager(propertyData?.name || "")?.id === fm.id;
                return (
                  <li key={fm.id}>
                    <button
                      onClick={() => { setAssignedManager(propertyData?.name || "", fm.id); setShowFMModal(false); }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "border-[#FF5000]" : "border-gray-300"
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#FF5000]" />}
                      </span>
                      <span className={isSelected ? "font-medium text-gray-900" : "text-gray-700"}>{fm.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* End Tenancy Modal */}
      {showEndTenancyModal && propertyData?.currentTenant && (
        <EndTenancyModal
          isOpen={showEndTenancyModal}
          onClose={() => setShowEndTenancyModal(false)}
          onConfirm={confirmEndTenancy}
          tenantName={propertyData.currentTenant.name}
          propertyName={propertyData.name}
        />
      )}

      {/* Renew Tenancy Modal */}
      {showRenewTenancyModal && propertyData?.currentTenant && (
        <RenewTenancyModal
          isOpen={showRenewTenancyModal}
          onClose={() => setShowRenewTenancyModal(false)}
          onConfirm={confirmRenewTenancy}
          tenantName={propertyData.currentTenant.name}
          propertyName={propertyData.name}
          currentExpiryDate={propertyData.rentExpiryDate || ""}
          currentRentAmount={
            propertyData.pendingRenewalInvoice?.rentAmount ??
            propertyData.rent ??
            0
          }
          currentPaymentFrequency={
            propertyData.pendingRenewalInvoice?.paymentFrequency ??
            propertyData.currentTenant?.paymentCycle ??
            "Annually"
          }
          currentServiceCharge={
            propertyData.pendingRenewalInvoice?.serviceCharge ??
            propertyData.serviceCharge ??
            0
          }
          isLoading={isRenewing}
        />
      )}

      {/* Edit Tenancy Modal (current or next-period) */}
      {editTenancyMode && propertyData?.currentTenant && (
        <EditTenancyModal
          isOpen={!!editTenancyMode}
          onClose={() => setEditTenancyMode(null)}
          onConfirm={confirmEditTenancy}
          mode={editTenancyMode}
          currentRentAmount={
            editTenancyMode === "next-period"
              ? (propertyData.pendingRenewalInvoice?.rentAmount ?? propertyData.rent ?? 0)
              : (propertyData.rent ?? 0)
          }
          currentServiceCharge={
            editTenancyMode === "next-period"
              ? (propertyData.pendingRenewalInvoice?.serviceCharge ?? propertyData.serviceCharge ?? 0)
              : (propertyData.serviceCharge ?? 0)
          }
          currentPaymentFrequency={
            editTenancyMode === "next-period"
              ? (propertyData.pendingRenewalInvoice?.paymentFrequency ?? propertyData.currentTenant.paymentCycle ?? "Annually")
              : (propertyData.currentTenant.paymentCycle ?? "Annually")
          }
          currentExpiryDate={propertyData.rentExpiryDate || ""}
          initialEndDate={
            editTenancyMode === "next-period"
              ? (propertyData.pendingRenewalInvoice?.endDate ?? undefined)
              : undefined
          }
          isLoading={isEditingTenancy}
        />
      )}

      {/* Step 1 — Scope Picker */}
      <PlanScopePickerModal
        open={showScopePicker}
        onClose={() => setShowScopePicker(false)}
        onSelect={(scope) => {
          setPaymentPlanScope(scope);
          setShowScopePicker(false);
          setShowPaymentPlanModal(true);
        }}
      />

      {/* Step 2 — Create Payment Plan Modal */}
      {propertyData?.currentTenant && (
        <CreatePaymentPlanModal
          open={showPaymentPlanModal}
          onClose={() => setShowPaymentPlanModal(false)}
          onBack={() => {
            setShowPaymentPlanModal(false);
            setShowScopePicker(true);
          }}
          propertyName={propertyData.name || ""}
          tenantId={propertyData.currentTenant.id}
          scope={paymentPlanScope}
          charges={(() => {
            const seen = new Set<string>();
            return [
              ...(propertyData.rent ? [{ name: "Rent", amount: propertyData.rent }] : []),
              ...((propertyData.serviceCharge ?? 0) > 0 ? [{ name: "Service Charge", amount: propertyData.serviceCharge! }] : []),
              ...((propertyData.legalFee ?? 0) > 0 ? [{ name: "Legal Fee", amount: propertyData.legalFee! }] : []),
              ...((propertyData.agencyFee ?? 0) > 0 ? [{ name: "Agency Fee", amount: propertyData.agencyFee! }] : []),
              ...(propertyData.additionalFees?.map((f) => ({ name: f.name, amount: f.amount })) ?? []),
              ...getRecurringCharges(propertyData.name || "").map((c) => ({ name: c.feeName, amount: c.amount })),
            ].filter((c) => { if (seen.has(c.name)) return false; seen.add(c.name); return true; });
          })()}
        />
      )}

      {/* Edit Property Modal */}
      <LandlordEditPropertyModal
        open={showEditPropertyModal}
        onOpenChange={setShowEditPropertyModal}
        propertyData={{
          id: effectivePropertyId!,
          name: propertyData?.name || "",
          location: propertyData?.address || "",
          type: propertyData?.type || "",
          bedrooms: propertyData?.bedrooms || 0,
          bathrooms: propertyData?.bathrooms || 0,
        }}
        onPropertyUpdated={handlePropertyUpdated}
      />

      <LandlordAddPropertyModal
        open={showAddPropertyModal}
        onOpenChange={setShowAddPropertyModal}
        onPropertyAdded={() => {
          setShowAddPropertyModal(false);
          toast.success("Property added successfully");
        }}
      />

      <LandlordAddTenantModal
        open={showAddTenantModal}
        onOpenChange={setShowAddTenantModal}
        onTenantAdded={() => {
          setShowAddTenantModal(false);
          toast.success("Tenant added successfully");
        }}
      />

      <GenerateKYCLinkModal
        isOpen={showGenerateKYCModal}
        onClose={() => setShowGenerateKYCModal(false)}
      />

      {selectedApplication && (
        <AttachTenantModal
          isOpen={showAttachTenantModal}
          onClose={() => setShowAttachTenantModal(false)}
          application={selectedApplication}
          onAttach={handleTenantAttachment}
          isLoading={attachTenantFromKYCMutation.isPending}
        />
      )}
    </div>
  );
}
