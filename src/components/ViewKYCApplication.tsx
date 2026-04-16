/* eslint-disable */
import { ArrowLeft, Check, X, Building2, Download, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { AttachToPropertyModal } from "./AttachToPropertyModal";
import { useState } from "react";

interface ViewKYCApplicationProps {
  applicationId: number;
  onBack: () => void;
  onApprove?: (applicationId: number) => void;
  onReject?: (applicationId: number) => void;
  onAttachToProperty?: (
    applicationId: number,
    propertyId: string,
    rentAmount: string,
    startDate: string,
    endDate: string
  ) => void;
}

// Mock data for KYC application details
const mockKYCApplication = {
  id: 1,
  applicantName: "Sarah Johnson",
  phone: "+234 901 234 5678",
  email: "sarah.johnson@email.com",
  status: "pending" as "pending" | "approved" | "rejected",
  submissionDate: "2024-01-15T10:30:00Z",
  personalInfo: {
    fullName: "Sarah Johnson",
    dateOfBirth: "1990-05-15",
    nationality: "Nigerian",
    stateOfOrigin: "Lagos State",
    lga: "Ikeja",
    religion: "Christianity",
    maritalStatus: "Married",
    numberOfChildren: "2",
    spouseName: "Michael Johnson",
    spouseContact: "+234 901 234 5679",
    nextOfKinName: "Grace Johnson",
    nextOfKinAddress: "15 Admiralty Way, Lekki Phase 1, Lagos",
    nextOfKinContact: "+234 901 234 5680",
    idDocument: "NIN_Sarah_Johnson.pdf",
  },
  employment: {
    occupation: "Software Engineer",
    employerName: "TechCorp Nigeria Limited",
    jobTitle: "Senior Software Engineer",
    employerAddress: "Plot 273, Central Business District, Abuja",
    employerPhone: "+234 809 123 4567",
    monthlyNetIncome: "₦850,000",
    otherIncomeSources: "Freelance consulting - ₦200,000/month",
    proofOfIncome: "Salary_Certificate_Sarah_Johnson.pdf",
  },
  residence: {
    currentAddress: "Flat 3B, Golden Gate Estate, Ikoyi, Lagos",
    durationOfStay: "3 years 2 months",
    reasonForLeaving: "Seeking better amenities and security",
    landlordName: "Mr. Adebayo Ogundimu",
    landlordContact: "+234 803 567 8901",
    spaceType: "Residential",
  },
  references: {
    reference1: {
      name: "Dr. Emmanuel Okoro",
      relationship: "Former Colleague",
      address: "12 Victoria Island, Lagos",
      phone: "+234 802 345 6789",
    },
    reference2: {
      name: "Mrs. Funmi Adeleke",
      relationship: "Family Friend",
      address: "8 Allen Avenue, Ikeja, Lagos",
      phone: "+234 807 890 1234",
    },
  },
  declaration: {
    text: "I hereby declare that all information provided in this KYC application is true and accurate to the best of my knowledge. I understand that providing false information may result in the rejection of my tenancy application.",
    signature: "Sarah Johnson",
    dateSubmitted: "January 15, 2024",
  },
};

export function ViewKYCApplication({
  applicationId,
  onBack,
  onApprove,
  onReject,
  onAttachToProperty,
}: ViewKYCApplicationProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);

  const application = mockKYCApplication; // In real app, would fetch by applicationId

  const handleApprove = () => {
    onApprove?.(applicationId);
    setShowApproveDialog(false);
  };

  const handleReject = () => {
    onReject?.(applicationId);
    setShowRejectDialog(false);
  };

  const handleAttachToProperty = (data: any) => {
    onAttachToProperty?.(
      applicationId,
      data.propertyId,
      data.rentAmount,
      data.tenancyStartDate,
      data.tenancyEndDate
    );
    setShowAttachModal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const InfoField = ({
    label,
    value,
    className = "",
  }: {
    label: string;
    value: string | React.ReactNode;
    className?: string;
  }) => (
    <div className={`space-y-1 ${className}`}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="p-2 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl text-gray-900">
                    {application.applicantName}
                  </h1>
                  {getStatusBadge(application.status)}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted on{" "}
                  {new Date(application.submissionDate).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {(application.status === "pending" ||
                application.status === "approved") && (
                <>
                  {application.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectDialog(true)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => setShowApproveDialog(true)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </>
                  )}
                  {application.status === "approved" && (
                    <Button
                      onClick={() => setShowAttachModal(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Attach to Property
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Section 1: Personal Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl text-gray-900 mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField
                label="Full Name"
                value={application.personalInfo.fullName}
              />
              <InfoField label="Phone Number" value={application.phone} />
              <InfoField label="Email Address" value={application.email} />
              <InfoField
                label="Date of Birth"
                value={new Date(
                  application.personalInfo.dateOfBirth
                ).toLocaleDateString()}
              />
              <InfoField
                label="Nationality"
                value={application.personalInfo.nationality}
              />
              <InfoField
                label="State of Origin"
                value={application.personalInfo.stateOfOrigin}
              />
              <InfoField label="LGA" value={application.personalInfo.lga} />
              <InfoField
                label="Religion"
                value={application.personalInfo.religion}
              />
              <InfoField
                label="Marital Status"
                value={application.personalInfo.maritalStatus}
              />
              <InfoField
                label="Number of Children"
                value={application.personalInfo.numberOfChildren}
              />
              <InfoField
                label="Spouse Name"
                value={application.personalInfo.spouseName}
              />
              <InfoField
                label="Spouse Contact"
                value={application.personalInfo.spouseContact}
              />
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-lg text-gray-900">Next of Kin Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoField
                  label="Next of Kin Name"
                  value={application.personalInfo.nextOfKinName}
                />
                <InfoField
                  label="Next of Kin Contact"
                  value={application.personalInfo.nextOfKinContact}
                />
                <InfoField
                  label="Next of Kin Address"
                  value={application.personalInfo.nextOfKinAddress}
                  className="md:col-span-2 lg:col-span-1"
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-lg text-gray-900">Identity Document</h3>
              <InfoField
                label="Uploaded ID Document"
                value={
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" className="h-9">
                      <Download className="w-4 h-4 mr-2" />
                      {application.personalInfo.idDocument}
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                }
              />
            </div>
          </div>

          {/* Section 2: Employment & Income */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl text-gray-900 mb-6">
              Employment &amp; Income
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField
                label="Occupation"
                value={application.employment.occupation}
              />
              <InfoField
                label="Job Title"
                value={application.employment.jobTitle}
              />
              <InfoField
                label="Employer Name"
                value={application.employment.employerName}
              />
              <InfoField
                label="Employer Address"
                value={application.employment.employerAddress}
                className="md:col-span-2 lg:col-span-3"
              />
              <InfoField
                label="Employer Phone"
                value={application.employment.employerPhone}
              />
              <InfoField
                label="Monthly Net Income"
                value={application.employment.monthlyNetIncome}
              />
              <InfoField
                label="Other Income Sources"
                value={application.employment.otherIncomeSources}
                className="lg:col-span-1"
              />
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-lg text-gray-900">Income Documentation</h3>
              <InfoField
                label="Proof of Income/Employment"
                value={
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm" className="h-9">
                      <Download className="w-4 h-4 mr-2" />
                      {application.employment.proofOfIncome}
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                }
              />
            </div>
          </div>

          {/* Section 3: Current & Previous Residence */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl text-gray-900 mb-6">
              Current &amp; Previous Residence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField
                label="Current Address"
                value={application.residence.currentAddress}
                className="md:col-span-2 lg:col-span-2"
              />
              <InfoField
                label="Duration of Stay"
                value={application.residence.durationOfStay}
              />
              <InfoField
                label="Reason for Leaving"
                value={application.residence.reasonForLeaving}
                className="md:col-span-2 lg:col-span-2"
              />
              <InfoField
                label="Type of Space Requested"
                value={
                  <Badge variant="secondary">
                    {application.residence.spaceType}
                  </Badge>
                }
              />
              <InfoField
                label="Landlord Name"
                value={application.residence.landlordName}
              />
              <InfoField
                label="Landlord Contact"
                value={application.residence.landlordContact}
              />
            </div>
          </div>

          {/* Section 4: References */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl text-gray-900 mb-6">References</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Reference 1 */}
              <div className="space-y-4">
                <h3 className="text-lg text-gray-800 pb-2 border-b border-gray-200">
                  Reference 1
                </h3>
                <div className="space-y-4">
                  <InfoField
                    label="Name"
                    value={application.references.reference1.name}
                  />
                  <InfoField
                    label="Relationship"
                    value={application.references.reference1.relationship}
                  />
                  <InfoField
                    label="Phone Number"
                    value={application.references.reference1.phone}
                  />
                  <InfoField
                    label="Address"
                    value={application.references.reference1.address}
                  />
                </div>
              </div>

              {/* Reference 2 */}
              <div className="space-y-4">
                <h3 className="text-lg text-gray-800 pb-2 border-b border-gray-200">
                  Reference 2
                </h3>
                <div className="space-y-4">
                  <InfoField
                    label="Name"
                    value={application.references.reference2.name}
                  />
                  <InfoField
                    label="Relationship"
                    value={application.references.reference2.relationship}
                  />
                  <InfoField
                    label="Phone Number"
                    value={application.references.reference2.phone}
                  />
                  <InfoField
                    label="Address"
                    value={application.references.reference2.address}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Declaration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl text-gray-900 mb-6">Declaration</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  Declaration Statement
                </div>
                <p className="text-gray-900 leading-relaxed">
                  {application.declaration.text}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField
                  label="Digital Signature"
                  value={
                    <span className="italic text-blue-600">
                      {application.declaration.signature}
                    </span>
                  }
                />
                <InfoField
                  label="Date Submitted"
                  value={application.declaration.dateSubmitted}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve KYC Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {application.applicantName}'s KYC
              application? This will change the status to approved and allow you
              to attach them to a property.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject KYC Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {application.applicantName}'s KYC
              application? This action will change the status to rejected and
              cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attach to Property Modal */}
      <AttachToPropertyModal
        isOpen={showAttachModal}
        onClose={() => setShowAttachModal(false)}
        tenantId={applicationId.toString()}
        tenantName={application.applicantName}
        onAttachSuccess={() => {
          setShowAttachModal(false);
        }}
        vacantProperties={[]}
      />
    </div>
  );
}
