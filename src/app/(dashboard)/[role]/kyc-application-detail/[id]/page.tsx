"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LandlordKYCApplicationDetail } from "@/components/LandlordKYCApplicationDetail";
import { LoadingFallback } from "@/components/LoadingFallback";
import { useFetchKYCApplicationById } from "@/services/property/query";
import { AttachTenantFromKycModal } from "@/components/modals/AttachTenantFromKycModal";
import {
  OfferLetterViewModal,
  OfferLetterData,
} from "@/components/modals/OfferLetterViewModal";
import { IKycApplication, OfferStatus } from "@/types/kyc-application";
import { generateKYCApplicationPDF } from "@/utils/pdfGenerator";

interface KYCApplicationAPIResponse {
  id: string;
  propertyId?: string;
  status: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactAddress?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  stateOfOrigin?: string;
  maritalStatus?: string;
  religion?: string;
  employmentStatus?: string;
  occupation?: string;
  jobTitle?: string;
  employerName?: string;
  employerAddress?: string;
  employerPhoneNumber?: string;
  lengthOfEmployment?: string;
  monthlyNetIncome?: string;
  // Flat employment fields from backend
  workAddress?: string;
  workPhoneNumber?: string;
  // Self-employed specific fields
  natureOfBusiness?: string;
  businessName?: string;
  businessAddress?: string;
  businessDuration?: string;
  // Flat next of kin fields from backend
  nextOfKinFullName?: string;
  nextOfKinAddress?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhoneNumber?: string;
  nextOfKinEmail?: string;
  // Nested reference1 (legacy/alternative format)
  reference1?: {
    name?: string;
    address?: string;
    relationship?: string;
    phoneNumber?: string;
    email?: string;
  };
  // Flat tenancy fields (from backend transformApplicationForFrontend)
  intendedUseOfProperty?: string;
  numberOfOccupants?: string;
  parkingNeeds?: string;
  proposedRentAmount?: string | number;
  rentPaymentFrequency?: string;
  additionalNotes?: string;
  // Flat referral agent fields from backend
  referralAgentFullName?: string;
  referralAgentPhoneNumber?: string;
  // Nested tenantOffer (legacy/alternative format)
  tenantOffer?: {
    proposedRentAmount?: string | number;
    rentPaymentFrequency?: string;
    intendedUse?: string;
    numberOfOccupants?: string;
    numberOfCarsOwned?: string;
    additionalNotes?: string;
  };
  // Flat document URLs from backend
  passportPhotoUrl?: string;
  idDocumentUrl?: string;
  employmentProofUrl?: string;
  businessProofUrl?: string;
  // Nested documents (legacy/alternative format)
  documents?: {
    passportPhoto?: string;
    idDocument?: string;
    employmentProof?: string;
    businessProof?: string;
  };
  property?: {
    name: string;
    address: string;
    status?: string;
  };
  submissionDate?: string;
  // Offer letter fields
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
    cautionDeposit: number;
    legalFee: number;
    agencyFee: string;
    createdAt?: string;
    updatedAt?: string;
    tenantAddress?: string;
    sentAt?: string;
  };
  invoice?: {
    id: string;
    createdAt: string;
    status: string;
  };
  paymentDate?: string;
  outstandingBalance?: number;
  creditBalance?: number;
  outstandingBalanceBreakdown?: Array<{
    rentId: string;
    propertyName: string;
    propertyId: string;
    outstandingAmount: number;
    tenancyStartDate: string | null;
    tenancyEndDate: string | null;
    transactions: Array<{ id: string; type: string; amount: number; date: string }>;
  }>;
  paymentTransactions?: Array<{ id: string; type: string; amount: number; date: string }>;
}

function KYCApplicationDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showAttachTenantModal, setShowAttachTenantModal] = useState(false);
  const [showOfferLetterPreview, setShowOfferLetterPreview] = useState(false);
  const [offerLetterData, setOfferLetterData] =
    useState<OfferLetterData | null>(null);

  const applicationId = Array.isArray(id) ? id[0] : id;

  const {
    data: application,
    isLoading,
    error,
  } = useFetchKYCApplicationById(applicationId || "");

  const appData = application
    ? (application as { application?: KYCApplicationAPIResponse })
        .application || (application as unknown as KYCApplicationAPIResponse)
    : null;

  const propertyName =
    searchParams.get("propertyName") || appData?.property?.name || "Property";

  // Get property status from API response, fallback to URL param, then default to "Vacant"
  const apiPropertyStatus = appData?.property?.status;
  const urlPropertyStatus = searchParams.get("propertyStatus");

  // Map backend status to frontend format
  const mapPropertyStatus = (
    status: string | null | undefined,
  ): "Occupied" | "Vacant" | "Inactive" => {
    if (!status) return "Vacant";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "occupied") return "Occupied";
    if (lowerStatus === "inactive") return "Inactive";
    return "Vacant";
  };

  const propertyStatus = apiPropertyStatus
    ? mapPropertyStatus(apiPropertyStatus)
    : mapPropertyStatus(urlPropertyStatus);

  // Show tenancy info everywhere EXCEPT when opened from tenant detail page
  const fromTenantDetail = searchParams.get("fromTenantDetail") === "true";
  const showTenancyInfo = !fromTenantDetail;

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  // Handle authentication errors - redirect to sign-in
  if (error) {
    const errorMessage = error?.message || "Unknown error";
    const isAuthError =
      errorMessage.includes("session") ||
      errorMessage.includes("authentication") ||
      errorMessage.includes("Session expired") ||
      errorMessage.includes("UNAUTHORIZED");

    if (isAuthError && typeof window !== "undefined") {
      return <LoadingFallback />;
    }

    const isPermissionError =
      errorMessage.includes("permission") ||
      errorMessage.includes("authorized");

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {isPermissionError ? "Access Denied" : "KYC Application Not Found"}
          </h2>
          <p className="text-gray-500 mb-4">
            {isPermissionError
              ? "You don't have permission to view this application. Make sure you're logged in as the property owner."
              : "The requested KYC application could not be found."}
          </p>

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    const userRole = window.location.pathname.split("/")[1];
                    window.location.href = `/${userRole}/dashboard`;
                  }
                }
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            KYC Application Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            The requested KYC application could not be found.
          </p>
          <button
            onClick={handleBack}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!appData) {
    return null;
  }

  const formattedApplication: IKycApplication = {
    id: appData.id,
    propertyId: appData.propertyId || "0",
    name: `${appData.firstName || "Unknown"} ${appData.lastName || "User"}`,
    email: appData.email || "No email provided",
    phone: appData.phoneNumber || "No phone provided",
    occupation: appData.occupation || "——",
    idType: "National ID", // Default since it's not in the API response
    submittedDate: appData.submissionDate || new Date().toISOString(),
    status:
      appData.status === "pending"
        ? ("Pending" as const)
        : appData.status === "pending_completion"
          ? ("Pending Completion" as const)
          : appData.status === "approved"
            ? ("Attached" as const)
            : ("Rejected" as const),

    // Personal Details
    surname: appData.lastName || "——",
    otherNames: appData.firstName || "——",
    contactAddress: appData.contactAddress || "——",
    nationality: appData.nationality || "——",
    stateOfOrigin: appData.stateOfOrigin || "——",
    sex: appData.gender || "——",
    dateOfBirth: appData.dateOfBirth || "——",
    passportPhoto:
      appData.passportPhotoUrl || appData.documents?.passportPhoto || undefined,
    religion: appData.religion || "——",

    // Professional
    profession: appData.occupation || "——",
    positionInWorkplace: appData.jobTitle || "——",
    jobTitle: appData.jobTitle || "——",
    placeOfWork: appData.employerName || "——",

    // Marital Status
    maritalStatus: appData.maritalStatus || "——",

    // Employment Details
    employmentStatus: appData.employmentStatus || "——",
    levelOfEducation: appData.employmentStatus || "——",
    employerName: appData.employerName || "——",
    workPhone: appData.workPhoneNumber || appData.employerPhoneNumber || "——",
    monthlyIncome: appData.monthlyNetIncome || "——",
    officeAddress: appData.workAddress || appData.employerAddress || "——",
    yearsAtEmployer:
      appData.lengthOfEmployment || appData.businessDuration || "——",

    // Self-employed specific fields
    natureOfBusiness: appData.natureOfBusiness || "——",
    businessName: appData.businessName || "——",
    businessAddress: appData.businessAddress || "——",
    businessDuration: appData.businessDuration || "——",

    // Next of Kin - handle both flat fields and nested reference1
    nextOfKin: (() => {
      // Check for flat next of kin fields first (from backend transformApplicationForFrontend)
      if (appData.nextOfKinFullName || appData.nextOfKinPhoneNumber) {
        return {
          fullName: appData.nextOfKinFullName || "——",
          address: appData.nextOfKinAddress || "——",
          relationship: appData.nextOfKinRelationship || "——",
          phone: appData.nextOfKinPhoneNumber || "——",
          email: appData.nextOfKinEmail || "——",
        };
      }
      // Fallback to nested reference1 structure
      if (appData.reference1) {
        return {
          fullName: appData.reference1.name || "——",
          address: appData.reference1.address || "——",
          relationship: appData.reference1.relationship || "——",
          phone: appData.reference1.phoneNumber || "——",
          email: appData.reference1.email || "——",
        };
      }
      return undefined;
    })(),

    // Tenancy Information - handle both nested tenantOffer and flat structure from API
    tenantOffer: (() => {
      // Check for flat structure first (direct API response)
      // The backend returns these fields at the top level, not nested
      // Use 'in' operator to check if properties exist, regardless of their value
      const hasFlat =
        "proposedRentAmount" in appData ||
        "rentPaymentFrequency" in appData ||
        "intendedUseOfProperty" in appData ||
        "numberOfOccupants" in appData ||
        "parkingNeeds" in appData ||
        "additionalNotes" in appData;

      if (hasFlat) {
        return {
          proposedRentAmount: appData.proposedRentAmount
            ? typeof appData.proposedRentAmount === "number"
              ? appData.proposedRentAmount
              : parseFloat(appData.proposedRentAmount)
            : 0,
          rentPaymentFrequency: (appData.rentPaymentFrequency || "Monthly") as
            | "Monthly"
            | "Quarterly"
            | "Bi-annually"
            | "Annually",
          intendedUse: appData.intendedUseOfProperty,
          numberOfOccupants: appData.numberOfOccupants,
          numberOfCarsOwned: appData.parkingNeeds,
          additionalNotes: appData.additionalNotes,
        };
      }

      // Fallback to nested tenantOffer structure
      if (appData.tenantOffer) {
        return {
          proposedRentAmount: appData.tenantOffer.proposedRentAmount
            ? typeof appData.tenantOffer.proposedRentAmount === "number"
              ? appData.tenantOffer.proposedRentAmount
              : parseFloat(appData.tenantOffer.proposedRentAmount)
            : 0,
          rentPaymentFrequency: (appData.tenantOffer.rentPaymentFrequency ||
            "Monthly") as "Monthly" | "Quarterly" | "Bi-annually" | "Annually",
          intendedUse: appData.tenantOffer.intendedUse,
          numberOfOccupants: appData.tenantOffer.numberOfOccupants,
          numberOfCarsOwned: appData.tenantOffer.numberOfCarsOwned,
          additionalNotes: appData.tenantOffer.additionalNotes,
        };
      }

      return undefined;
    })(),

    // Referral Agent - handle flat fields from backend
    referralAgent:
      appData.referralAgentFullName || appData.referralAgentPhoneNumber
        ? {
            fullName: appData.referralAgentFullName || "——",
            phoneNumber: appData.referralAgentPhoneNumber || "——",
          }
        : undefined,

    documents: [
      (appData.passportPhotoUrl || appData.documents?.passportPhoto) && {
        name: "Passport Photograph",
        url: appData.passportPhotoUrl || appData.documents?.passportPhoto,
      },
      (appData.idDocumentUrl || appData.documents?.idDocument) && {
        name: "Means of Identification",
        url: appData.idDocumentUrl || appData.documents?.idDocument,
      },
      appData.employmentStatus?.toLowerCase() === "employed" &&
        (appData.employmentProofUrl || appData.documents?.employmentProof) && {
          name: "Proof of Employment",
          url: appData.employmentProofUrl || appData.documents?.employmentProof,
        },
      appData.employmentStatus?.toLowerCase() === "self-employed" &&
        (appData.businessProofUrl || appData.documents?.businessProof) && {
          name: "Proof of Business",
          url: appData.businessProofUrl || appData.documents?.businessProof,
        },
    ].filter(Boolean) as Array<{ name: string; url: string }>,

    employmentProof:
      appData.employmentProofUrl || appData.documents?.employmentProof
        ? {
            type: "Employment Proof",
            url:
              appData.employmentProofUrl ||
              appData.documents?.employmentProof ||
              "",
          }
        : undefined,

    businessProof:
      appData.businessProofUrl || appData.documents?.businessProof
        ? {
            type: "Business Proof",
            url:
              appData.businessProofUrl ||
              appData.documents?.businessProof ||
              "",
          }
        : undefined,

    declaration:
      "I hereby declare that all information provided in this application is true and accurate to the best of my knowledge.",

    // Offer Letter Status - use backend status directly
    offerLetterStatus: (appData.offerLetterStatus ||
      appData.offerLetter?.status) as OfferStatus,
    offerLetter: appData.offerLetter
      ? {
          ...appData.offerLetter,
          status: appData.offerLetter.status as OfferStatus,
          agencyFee: appData.offerLetter.agencyFee
            ? Number(appData.offerLetter.agencyFee)
            : undefined,
        }
      : undefined,

    // Legacy offerStatus field for backward compatibility
    offerStatus: (() => {
      if (!appData.offerLetterStatus && !appData.offerLetter) return undefined;
      const status = appData.offerLetterStatus || appData.offerLetter?.status;
      if (status === "pending") return "pending" as OfferStatus;
      if (status === "accepted") return "accepted" as OfferStatus;
      if (status === "rejected") return "rejected" as OfferStatus;
      return undefined;
    })(),
    offerLetterToken: appData.offerLetter?.token,
    offerLetterData: appData.offerLetter
      ? {
          applicantName: `${appData.firstName || "Unknown"} ${appData.lastName || "User"}`,
          applicantEmail: appData.email || "",
          applicantGender: appData.gender, // Pass gender from KYC application
          propertyName: appData.property?.name || propertyName,
          rentAmount: appData.offerLetter.rentAmount,
          rentFrequency: appData.offerLetter.rentFrequency,
          serviceCharge: appData.offerLetter.serviceCharge,
          tenancyStartDate: appData.offerLetter.tenancyStartDate,
          tenancyEndDate: appData.offerLetter.tenancyEndDate,
          cautionDeposit: appData.offerLetter.cautionDeposit,
          legalFee: appData.offerLetter.legalFee,
          agencyFee: appData.offerLetter.agencyFee,
          createdAt: appData.offerLetter.createdAt || appData.submissionDate,
          tenantAddress:
            appData.offerLetter.tenantAddress || appData.contactAddress,
        }
      : undefined,

    // Timestamp fields for timeline and document dates
    offerLetterCreatedAt: appData.offerLetter?.createdAt,
    offerLetterUpdatedAt: appData.offerLetter?.updatedAt,
    invoiceCreatedAt: appData.invoice?.createdAt,
    invoiceId: appData.invoice?.id,
    paymentDate: appData.paymentDate,
  };

  const propertyAddress = appData?.property?.address || "";

  return (
    <>
      <LandlordKYCApplicationDetail
        application={formattedApplication}
        propertyName={propertyName}
        propertyAddress={propertyAddress}
        propertyStatus={propertyStatus}
        showTenancyInfo={showTenancyInfo}
        outstandingBalance={appData.outstandingBalance ?? 0}
        creditBalance={appData.creditBalance ?? 0}
        outstandingBalanceBreakdown={appData.outstandingBalanceBreakdown as unknown[]}
        paymentTransactions={appData.paymentTransactions as unknown[]}
        onBack={handleBack}
        onAttachTenant={() => setShowAttachTenantModal(true)}
        onDownloadPDF={async () => {
          try {
            await generateKYCApplicationPDF(formattedApplication, propertyName);
          } catch (error) {
            console.error("Error generating PDF:", error);
          }
        }}
        onViewOfferLetter={() => {
          if (formattedApplication.offerLetterData) {
            setOfferLetterData(formattedApplication.offerLetterData);
            setShowOfferLetterPreview(true);
          }
        }}
      />

      {/* Attach Tenant Modal */}
      {showAttachTenantModal && (
        <AttachTenantFromKycModal
          isOpen={showAttachTenantModal}
          onClose={() => setShowAttachTenantModal(false)}
          application={formattedApplication}
        />
      )}

      {/* Offer Letter Preview Modal */}
      {showOfferLetterPreview && offerLetterData && (
        <OfferLetterViewModal
          isOpen={showOfferLetterPreview}
          onClose={() => {
            setShowOfferLetterPreview(false);
            setOfferLetterData(null);
          }}
          data={offerLetterData}
          token={formattedApplication.offerLetterToken}
          stampType={
            formattedApplication.offerLetterStatus === "accepted" ||
            formattedApplication.offerStatus === "accepted"
              ? "accepted"
              : formattedApplication.offerLetterStatus === "rejected" ||
                  formattedApplication.offerStatus === "rejected"
                ? "rejected"
                : undefined
          }
        />
      )}
    </>
  );
}

export default function KYCApplicationDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <KYCApplicationDetailContent />
    </Suspense>
  );
}
