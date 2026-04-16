"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LandlordTopNav } from "./LandlordTopNav";
import { GenerateKYCLinkModal } from "./GenerateKYCLinkModal";
import {
  OfferLetterViewModal,
  OfferLetterData,
} from "./modals/OfferLetterViewModal";
import { useQuery } from "@tanstack/react-query";
import { KYCService, KYCApplication } from "@/services/kyc/kyc.service";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Extended type to handle flat tenancy fields and offer letter status from backend API
interface KYCApplicationWithFlatFields extends KYCApplication {
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
    sentAt?: string;
  };
}

const mockKYCApplications: KYCApplicationWithFlatFields[] = [
  {
    id: "mock-1",
    propertyId: "prop-1",
    status: "pending",
    firstName: "Jennifer",
    lastName: "Williams",
    email: "jennifer.williams@email.com",
    phoneNumber: "+234 803 456 7890",
    contactAddress: "14 Bode Thomas Street, Surulere, Lagos",
    dateOfBirth: "1995-03-15",
    gender: "Female",
    nationality: "Nigerian",
    stateOfOrigin: "Lagos",
    localGovernmentArea: "Surulere",
    maritalStatus: "Single",
    employmentStatus: "Employed",
    occupation: "Software Engineer",
    jobTitle: "Senior Developer",
    employerName: "TechCorp Lagos",
    monthlyNetIncome: "500000",
    reference1: { name: "Adaeze Okonkwo", relationship: "Colleague", phoneNumber: "+234 801 234 5678" },
    tenantOffer: { proposedRentAmount: "450000", rentPaymentFrequency: "Annually" },
    property: { name: "Sunset View Apartments", address: "12 Admiralty Way, Lekki Phase 1, Lagos" },
    submissionDate: "2024-12-01T14:30:00",
    createdAt: "2024-12-01T14:30:00",
    updatedAt: "2024-12-01T14:30:00",
    proposedRentAmount: "450000",
    rentPaymentFrequency: "Annually",
  },
  {
    id: "mock-2",
    propertyId: "prop-2",
    status: "pending",
    firstName: "David",
    lastName: "Okafor",
    email: "david.okafor@email.com",
    phoneNumber: "+234 806 123 4567",
    contactAddress: "22 Allen Avenue, Ikeja, Lagos",
    dateOfBirth: "1988-11-22",
    gender: "Male",
    nationality: "Nigerian",
    stateOfOrigin: "Anambra",
    localGovernmentArea: "Awka",
    maritalStatus: "Married",
    employmentStatus: "Employed",
    occupation: "Marketing Manager",
    jobTitle: "Head of Marketing",
    employerName: "Brand Solutions Ltd",
    monthlyNetIncome: "400000",
    reference1: { name: "Emeka Chukwu", relationship: "Friend", phoneNumber: "+234 807 654 3210" },
    tenantOffer: { proposedRentAmount: "600000", rentPaymentFrequency: "Annually" },
    property: { name: "Garden View Complex", address: "5 Adeola Odeku Street, Victoria Island, Lagos" },
    submissionDate: "2024-11-28T09:15:00",
    createdAt: "2024-11-28T09:15:00",
    updatedAt: "2024-11-28T09:15:00",
    proposedRentAmount: "600000",
    rentPaymentFrequency: "Annually",
    offerLetterStatus: "pending",
    offerLetter: {
      id: "ol-1",
      token: "mock-token-1",
      status: "pending",
      rentAmount: 600000,
      rentFrequency: "Annually",
      tenancyStartDate: "2025-01-01",
      tenancyEndDate: "2026-01-01",
      cautionDeposit: 300000,
      totalAmount: 900000,
      amountPaid: 0,
      sentAt: "2024-11-30T10:00:00",
    },
  },
  {
    id: "mock-3",
    propertyId: "prop-1",
    status: "pending_completion",
    firstName: "Grace",
    lastName: "Adebayo",
    email: "grace.adebayo@email.com",
    phoneNumber: "+234 701 987 6543",
    contactAddress: "8 Olumide Close, Yaba, Lagos",
    dateOfBirth: "1992-06-08",
    gender: "Female",
    nationality: "Nigerian",
    stateOfOrigin: "Ogun",
    localGovernmentArea: "Abeokuta South",
    maritalStatus: "Single",
    employmentStatus: "Self-Employed",
    occupation: "Designer",
    jobTitle: "Creative Director",
    businessDuration: "3 years",
    monthlyNetIncome: "250000",
    reference1: { name: "Tunde Bello", relationship: "Business Partner", phoneNumber: "+234 802 111 2222" },
    tenantOffer: { proposedRentAmount: "350000", rentPaymentFrequency: "Annually" },
    property: { name: "Sunset View Apartments", address: "12 Admiralty Way, Lekki Phase 1, Lagos" },
    submissionDate: "2024-11-25T16:45:00",
    createdAt: "2024-11-25T16:45:00",
    updatedAt: "2024-11-25T16:45:00",
    proposedRentAmount: "350000",
    rentPaymentFrequency: "Annually",
  },
];

interface LandlordKYCListProps {
  onBack?: () => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function LandlordKYCList({
  onBack,
  onMenuClick,
  isMobile = false,
}: LandlordKYCListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showGenerateKYCModal, setShowGenerateKYCModal] = useState(false);
  const [showOfferLetterPreview, setShowOfferLetterPreview] = useState(false);
  const [offerLetterData, setOfferLetterData] =
    useState<OfferLetterData | null>(null);
  const [offerLetterToken, setOfferLetterToken] = useState<string | undefined>(
    undefined,
  );
  const router = useRouter();
  const { user } = useAuth();
  const userRole = user?.role;

  const {
    data: kycApplicationsRaw = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["kycApplications"],
    queryFn: KYCService.getAllKycApplications,
    staleTime: 30000,
  });

  const kycApplications =
    kycApplicationsRaw.length > 0 ? kycApplicationsRaw : mockKYCApplications;

  const filteredApplications = kycApplications.filter((app) => {
    // Exclude applicants who have already been attached as tenants (approved status)
    if (app.status === "approved") return false;

    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      app.firstName?.toLowerCase().includes(searchLower) ||
      app.lastName?.toLowerCase().includes(searchLower) ||
      app.email?.toLowerCase().includes(searchLower) ||
      app.phoneNumber?.toLowerCase().includes(searchLower) ||
      app.property?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleApplicationClick = (application: KYCApplication) => {
    router.push(`/${userRole}/kyc-application-detail/${application.id}`);
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

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return "₦-";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === 0) return "₦-";
    return `₦${numAmount.toLocaleString()}`;
  };

  const formatPaymentFrequency = (frequency: string | null | undefined) => {
    if (!frequency || frequency === "N/A") return "-";
    return frequency;
  };

  // Helper to get offer status from application
  const getOfferStatus = (
    application: KYCApplicationWithFlatFields,
  ): "Sent" | "Saved" | "Accepted" | "Declined" | undefined => {
    const status =
      application.offerLetterStatus || application.offerLetter?.status;
    if (status === "pending") {
      // Check if offer was actually sent or just saved
      return application.offerLetter?.sentAt ? "Sent" : "Saved";
    }
    if (status === "accepted") return "Accepted";
    if (status === "rejected") return "Declined";
    return undefined;
  };

  // Helper to get payment status badge
  const getPaymentStatusBadge = (
    application: KYCApplicationWithFlatFields,
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
    application: KYCApplicationWithFlatFields,
  ): number => {
    if (!application.offerLetter) return 0;

    const amountPaid = application.offerLetter.amountPaid || 0;
    const totalAmount = application.offerLetter.totalAmount || 0;

    if (totalAmount === 0) return 0;

    return Math.min(100, Math.round((amountPaid / totalAmount) * 100));
  };

  // Helper to build offer letter data from application
  const buildOfferLetterData = (
    application: KYCApplicationWithFlatFields,
  ): OfferLetterData | null => {
    if (!application.offerLetter) return null;
    return {
      applicantName: `${application.firstName || "Unknown"} ${application.lastName || "User"}`,
      applicantEmail: application.email || "",
      applicantGender: application.gender, // Pass gender from KYC application
      propertyName: application.property?.name || "Property",
      rentAmount: application.offerLetter.rentAmount,
      rentFrequency: application.offerLetter.rentFrequency,
      serviceCharge: application.offerLetter.serviceCharge,
      tenancyStartDate: application.offerLetter.tenancyStartDate,
      tenancyEndDate: application.offerLetter.tenancyEndDate,
      cautionDeposit: application.offerLetter.cautionDeposit,
      legalFee: application.offerLetter.legalFee,
      agencyFee: application.offerLetter.agencyFee,
      tenantAddress: application.contactAddress,
    };
  };

  // Handle offer letter badge click
  const handleOfferBadgeClick = (
    e: React.MouseEvent,
    application: KYCApplicationWithFlatFields,
  ) => {
    e.stopPropagation();
    const data = buildOfferLetterData(application);
    if (data) {
      setOfferLetterData(data);
      setOfferLetterToken(application.offerLetter?.token);
      setShowOfferLetterPreview(true);
    }
  };

  if (error) {
    toast.error("Failed to load KYC applications");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <LandlordTopNav
        title="Tenant Applicants"
        onBack={onBack}
        onGenerateKYC={() => setShowGenerateKYCModal(true)}
        onMenuClick={onMenuClick}
        isMobile={isMobile}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:pt-24">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, phone, email, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-[#FF5000]/20 focus:border-[#FF5000] w-96"
              />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5000] mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">
              Loading KYC applications...
            </p>
          </div>
        )}

        {!isLoading && filteredApplications.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Applications
              </h2>
              <span className="text-sm text-slate-500">
                {filteredApplications.length} application
                {filteredApplications.length !== 1 ? "s" : ""}
              </span>
            </div>
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                onClick={() => handleApplicationClick(application)}
                className="
                  bg-white border border-gray-200 rounded-xl p-4 shadow-sm
                  hover:bg-[#FF5000]/2 hover:shadow-md hover:border-[#FF5000]/30
                  active:scale-[0.98] active:duration-100
                  transition-all duration-200 cursor-pointer
                "
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {application.firstName} {application.lastName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {application.phoneNumber}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {formatCurrency(
                          (application as KYCApplicationWithFlatFields)
                            .proposedRentAmount,
                        )}
                        /
                        {formatPaymentFrequency(
                          (application as KYCApplicationWithFlatFields)
                            .rentPaymentFrequency,
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {application.property?.name || "No property assigned"}
                      </p>
                    </div>
                  </div>

                  {/* Payment Progress Section - Only show if offer letter exists */}
                  {(() => {
                    const extApp = application as KYCApplicationWithFlatFields;
                    if (extApp.offerLetter && extApp.offerLetter.totalAmount) {
                      const amountPaid = extApp.offerLetter.amountPaid || 0;
                      const totalAmount = extApp.offerLetter.totalAmount || 0;
                      const percentage = getPaymentPercentage(extApp);

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
                  })()}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      {formatKYCDate(
                        application.submissionDate || application.createdAt,
                      )}{" "}
                      •{" "}
                      {formatKYCTime(
                        application.submissionDate || application.createdAt,
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      {/* Payment Status Badge */}
                      {(() => {
                        const extApp =
                          application as KYCApplicationWithFlatFields;
                        const paymentBadge = getPaymentStatusBadge(extApp);
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
                      })()}

                      {/* Offer Status Badges */}
                      {(() => {
                        const extApp =
                          application as KYCApplicationWithFlatFields;
                        const offerStatus = getOfferStatus(extApp);

                        if (offerStatus === "Sent" && extApp.offerLetter) {
                          return (
                            <button
                              onClick={(e) => handleOfferBadgeClick(e, extApp)}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200 hover:bg-blue-100 active:scale-95 active:opacity-80 transition-all duration-150 cursor-pointer"
                            >
                              Offer Sent
                            </button>
                          );
                        }
                        if (offerStatus === "Sent" && !extApp.offerLetter) {
                          return (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                              Offer Sent
                            </span>
                          );
                        }
                        if (offerStatus === "Saved" && extApp.offerLetter) {
                          return (
                            <button
                              onClick={(e) => handleOfferBadgeClick(e, extApp)}
                              className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-100 active:scale-95 active:opacity-80 transition-all duration-150 cursor-pointer"
                            >
                              Offer Saved
                            </button>
                          );
                        }
                        if (offerStatus === "Saved" && !extApp.offerLetter) {
                          return (
                            <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-200">
                              Offer Saved
                            </span>
                          );
                        }
                        if (offerStatus === "Accepted") {
                          return (
                            <button
                              onClick={(e) => handleOfferBadgeClick(e, extApp)}
                              className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200 hover:bg-green-100 active:scale-95 active:opacity-80 transition-all duration-150 cursor-pointer"
                            >
                              Offer Accepted
                            </button>
                          );
                        }
                        if (offerStatus === "Declined") {
                          return (
                            <button
                              onClick={(e) => handleOfferBadgeClick(e, extApp)}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-200 active:scale-95 active:opacity-80 transition-all duration-150 cursor-pointer"
                            >
                              Offer Declined
                            </button>
                          );
                        }
                        return null;
                      })()}

                      {/* Application Status Badges */}
                      {application.status === "approved" && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Attached
                        </span>
                      )}
                      {/* {application.status === "rejected" && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          Rejected
                        </span>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredApplications.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg text-slate-900 mb-2">
                {searchTerm
                  ? "No matching submissions found"
                  : kycApplications.length === 0
                    ? "No KYC submissions yet"
                    : "No KYC applications found"}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {searchTerm
                  ? "Try adjusting your search to find what you're looking for."
                  : kycApplications.length === 0
                    ? "Generate and share a KYC link with potential tenants to get started."
                    : "No KYC applications are available at the moment."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowGenerateKYCModal(true)}
                  className="bg-[#FF5000] hover:bg-[#E64800] text-white rounded-xl px-6 h-11 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Generate KYC Link
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <GenerateKYCLinkModal
        isOpen={showGenerateKYCModal}
        onClose={() => setShowGenerateKYCModal(false)}
      />

      {offerLetterData && (
        <OfferLetterViewModal
          isOpen={showOfferLetterPreview}
          onClose={() => {
            setShowOfferLetterPreview(false);
            setOfferLetterData(null);
          }}
          data={offerLetterData}
          token={offerLetterToken}
        />
      )}
    </div>
  );
}
