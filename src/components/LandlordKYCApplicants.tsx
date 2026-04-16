/* eslint-disable */
import { useState } from "react";
import { useQueryState } from "@/hooks/useQueryState";
import React from "react";
import {
  Search,
  Filter,
  Copy,
  FileText,
  Eye,
  UserPlus,
  Building2,
  Calendar,
  Phone,
  Mail,
  User,
  ChevronUp,
  ChevronDown,
  Link,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { toast } from "sonner";
import { ConvertToTenantModal } from "./ConvertToTenantModal";
import { GenerateKYCLinkModal } from "./GenerateKYCLinkModal";
import { KYCApplication } from "@/types/kyc";

// Mock KYC applications data for landlord
const mockKYCApplications: KYCApplication[] = [
  {
    id: 1,
    applicantName: "Jennifer Williams",
    phone: "+234 803 456 7890",
    email: "jennifer.williams@email.com",
    linkedPropertyId: "1",
    linkedPropertyName: "Sunset View Apartments",
    submissionDate: "2024-12-01T14:30:00",
    status: "pending",
    kycFormLink: "https://propertykraft.africa/apply/prop-1",
    kycData: {
      personalInfo: {
        fullName: "Jennifer Williams",
        dateOfBirth: "1995-03-15",
        nationality: "Nigerian",
        occupation: "Software Engineer",
      },
      employment: {
        employer: "TechCorp Lagos",
        monthlyIncome: "₦500,000",
        employmentType: "Full-time",
      },
      documents: ["ID Card", "Employment Letter", "Bank Statement"],
    },
  },
  {
    id: 2,
    applicantName: "David Okafor",
    phone: "+234 806 123 4567",
    email: "david.okafor@email.com",
    linkedPropertyId: "2",
    linkedPropertyName: "Garden View Complex",
    submissionDate: "2024-11-28T09:15:00",
    status: "approved",
    kycFormLink: "https://propertykraft.africa/apply/prop-2",
    kycData: {
      personalInfo: {
        fullName: "David Okafor",
        dateOfBirth: "1988-11-22",
        nationality: "Nigerian",
        occupation: "Marketing Manager",
      },
      employment: {
        employer: "Brand Solutions Ltd",
        monthlyIncome: "₦400,000",
        employmentType: "Full-time",
      },
      documents: ["Driver's License", "Employment Contract", "Salary Slip"],
    },
  },
  {
    id: 3,
    applicantName: "Grace Adebayo",
    phone: "+234 701 987 6543",
    email: "grace.adebayo@email.com",
    linkedPropertyId: "1",
    linkedPropertyName: "Sunset View Apartments",
    submissionDate: "2024-11-25T16:45:00",
    status: "rejected",
    kycFormLink: "https://propertykraft.africa/apply/prop-1",
    kycData: {
      personalInfo: {
        fullName: "Grace Adebayo",
        dateOfBirth: "1992-06-08",
        nationality: "Nigerian",
        occupation: "Freelance Designer",
      },
      employment: {
        employer: "Self-employed",
        monthlyIncome: "₦150,000",
        employmentType: "Freelance",
      },
      documents: ["National ID", "Bank Statement"],
    },
  },
  {
    id: 4,
    applicantName: "Samuel Kemi",
    phone: "+234 809 555 1234",
    email: "samuel.kemi@email.com",
    submissionDate: "2024-11-20T11:20:00",
    status: "approved",
    kycData: {
      personalInfo: {
        fullName: "Samuel Kemi",
        dateOfBirth: "1990-09-12",
        nationality: "Nigerian",
        occupation: "Financial Analyst",
      },
      employment: {
        employer: "Lagos Investment Bank",
        monthlyIncome: "₦600,000",
        employmentType: "Full-time",
      },
      documents: [
        "International Passport",
        "Employment Letter",
        "Tax Certificate",
      ],
    },
  },
];

interface LandlordKYCApplicantsProps {
  searchTerm?: string;
  onBack?: () => void;
}

export default function LandlordKYCApplicants({
  searchTerm = "",
  onBack,
}: LandlordKYCApplicantsProps) {
  const [sortField, setSortField] = useQueryState("sort", {
    defaultValue: "submissionDate",
  });
  const [sortDirection, setSortDirection] = useQueryState<"asc" | "desc">(
    "dir",
    {
      defaultValue: "desc",
      parse: (v) => (v as "asc" | "desc") || "desc",
    },
  );
  const [localSearchQuery, setLocalSearchQuery] = useQueryState("search", {
    defaultValue: "",
    debounce: 300,
  });
  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "",
  });
  const [selectedApplicant, setSelectedApplicant] =
    useState<KYCApplication | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showGenerateKYCLinkModal, setShowGenerateKYCLinkModal] =
    useState(false);
  const [applications, setApplications] =
    useState<KYCApplication[]>(mockKYCApplications);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Use either prop searchTerm or local search
  const effectiveSearchQuery = searchTerm || localSearchQuery;

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filter and sort applications
  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        app.applicantName
          .toLowerCase()
          .includes(effectiveSearchQuery.toLowerCase()) ||
        app.phone.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
        (app.linkedPropertyName &&
          app.linkedPropertyName
            .toLowerCase()
            .includes(effectiveSearchQuery.toLowerCase()));

      const matchesStatus =
        !statusFilter || statusFilter === "" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "applicantName":
          aValue = a.applicantName.toLowerCase();
          bValue = b.applicantName.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "submissionDate":
          aValue = new Date(a.submissionDate).getTime();
          bValue = new Date(b.submissionDate).getTime();
          break;
        case "status":
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case "linkedPropertyName":
          aValue = (a.linkedPropertyName || "").toLowerCase();
          bValue = (b.linkedPropertyName || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortButton = ({
    field,
    children,
    icon,
  }: {
    field: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 justify-start hover:bg-transparent font-medium text-gray-900 hover:text-[#FF5000] transition-colors group"
    >
      <div className="flex items-center space-x-2">
        {icon && (
          <span className="text-gray-500 group-hover:text-[#FF5000] transition-colors">
            {icon}
          </span>
        )}
        <span>{children}</span>
        <div className="flex flex-col ml-1 invisible">
          <ChevronUp
            className={`w-3 h-3 transition-colors ${
              sortField === field && sortDirection === "asc"
                ? "text-[#FF5000]"
                : "text-gray-300"
            }`}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1 transition-colors ${
              sortField === field && sortDirection === "desc"
                ? "text-[#FF5000]"
                : "text-gray-300"
            }`}
          />
        </div>
      </div>
    </Button>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "converted":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "converted":
        return "Converted";
      default:
        return status;
    }
  };

  const handleConvertToTenant = (applicant: KYCApplication) => {
    setSelectedApplicant(applicant);
    setShowConvertModal(true);
  };

  const handleConvertConfirm = (data: any) => {
    if (selectedApplicant) {
      // Update the application status to converted
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApplicant.id
            ? { ...app, status: "converted" as const }
            : app,
        ),
      );

      toast.success(
        `${selectedApplicant.applicantName} has been converted to a tenant!`,
      );
      setShowConvertModal(false);
      setSelectedApplicant(null);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("KYC form link copied to clipboard!");
  };

  const canConvertToTenant = (application: KYCApplication) => {
    return application.status === "approved";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* ... remove this code ... */}
      </div>

      {/* KYC Applicants Table with integrated search & filters */}
      {filteredApplications.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                {/* Search */}
                {!searchTerm && (
                  <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search applicants..."
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-slate-200 focus:border-[#FF5000]/50 min-w-[500px]"
                    />
                  </div>
                )}

                {/* Status Filter */}
                <div className="sm:w-40">{/* ... remove this code ... */}</div>
              </div>

              {/* Action buttons moved from header */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setShowGenerateKYCLinkModal(true)}
                  className="bg-[#FF5000] hover:bg-[#FF5000]/90 text-white"
                >
                  Generate KYC Link
                </Button>
                <Badge
                  variant="outline"
                  className="text-slate-600 border-slate-300"
                >
                  {filteredApplications.length} application
                  {filteredApplications.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>

            {/* Active Filters */}
            {(effectiveSearchQuery || statusFilter) && (
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700">
                  Active filters:
                </p>
                <div className="flex items-center space-x-2 flex-wrap">
                  {effectiveSearchQuery && (
                    <Badge
                      variant="outline"
                      className="text-xs border-slate-300"
                    >
                      Search: "{effectiveSearchQuery}"
                    </Badge>
                  )}
                  {statusFilter && (
                    <Badge
                      variant="outline"
                      className="text-xs border-slate-300"
                    >
                      Status: {statusFilter}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="sm:hidden">
              {filteredApplications.map((application) => (
                <Collapsible key={application.id}>
                  <div className="p-4 border-b border-slate-100 last:border-b-0">
                    {/* Basic Info Row - ABSOLUTELY NO BADGES */}
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between w-full text-left">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">
                            {application.applicantName}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {application.linkedPropertyName || (
                              <span className="text-slate-400 italic">
                                Not linked to any property
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </CollapsibleTrigger>

                    {/* Expanded KYC Details */}
                    <CollapsibleContent className="mt-4 space-y-4">
                      <Separator />

                      {/* Contact Information */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-slate-900">
                          Contact Information
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">
                              {application.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">
                              {application.phone}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">
                              Applied on{" "}
                              {formatDate(application.submissionDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* KYC Details */}
                      {application.kycData && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-slate-900">
                            KYC Information
                          </h5>
                          <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                            {/* Personal Info */}
                            <div>
                              <h6 className="font-medium text-slate-700 mb-1">
                                Personal Information
                              </h6>
                              <div className="text-sm text-slate-600 space-y-1">
                                <div>
                                  <span className="font-medium">
                                    Date of Birth:
                                  </span>{" "}
                                  {application.kycData.personalInfo.dateOfBirth}
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Nationality:
                                  </span>{" "}
                                  {application.kycData.personalInfo.nationality}
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Occupation:
                                  </span>{" "}
                                  {application.kycData.personalInfo.occupation}
                                </div>
                              </div>
                            </div>

                            {/* Employment Info */}
                            <div>
                              <h6 className="font-medium text-slate-700 mb-1">
                                Employment Information
                              </h6>
                              <div className="text-sm text-slate-600 space-y-1">
                                <div>
                                  <span className="font-medium">Employer:</span>{" "}
                                  {application.kycData.employment.employer}
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Employment Type:
                                  </span>{" "}
                                  {
                                    application.kycData.employment
                                      .employmentType
                                  }
                                </div>
                                <div>
                                  <span className="font-medium">
                                    Monthly Income:
                                  </span>{" "}
                                  {application.kycData.employment.monthlyIncome}
                                </div>
                              </div>
                            </div>

                            {/* Documents */}
                            <div>
                              <h6 className="font-medium text-slate-700 mb-1">
                                Submitted Documents
                              </h6>
                              <div className="flex flex-wrap gap-1">
                                {application.kycData.documents.map(
                                  (doc, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {doc}
                                    </Badge>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        {canConvertToTenant(application) && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertToTenant(application)}
                            className="bg-[#FF5000] hover:bg-[#FF5000]/90 text-white"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Convert to Tenant
                          </Button>
                        )}
                        {application.kycFormLink && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCopyLink(application.kycFormLink!)
                            }
                            className="text-xs"
                          >
                            <Link className="w-3 h-3 mr-1" />
                            Copy Link
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="py-4 px-6 w-8"></TableHead>
                    <TableHead className="py-4 px-6">
                      <SortButton
                        field="applicantName"
                        icon={<User className="w-4 h-4" />}
                      >
                        Applicant Name
                      </SortButton>
                    </TableHead>
                    <TableHead className="py-4 px-6">
                      <SortButton
                        field="linkedPropertyName"
                        icon={<Building2 className="w-4 h-4" />}
                      >
                        Linked Property
                      </SortButton>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => {
                    const isExpanded = expandedRows.has(application.id);
                    return (
                      <React.Fragment key={application.id}>
                        {/* Main Row */}
                        <TableRow
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() => toggleRowExpansion(application.id)}
                        >
                          <TableCell className="py-4 px-6">
                            <ChevronRight
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <span className="text-slate-900 font-medium">
                                {application.applicantName}
                              </span>
                              <Badge
                                variant={getStatusBadgeVariant(
                                  application.status,
                                )}
                              >
                                {getStatusText(application.status)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-slate-600">
                            {application.linkedPropertyName || (
                              <span className="text-slate-400 italic">
                                Not linked to any property
                              </span>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={3} className="py-0 px-6">
                              <div className="pb-6 pt-2">
                                <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                                  {/* Contact Information */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h5 className="font-medium text-slate-900 mb-2">
                                        Contact Information
                                      </h5>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2">
                                          <Mail className="w-3 h-3 text-slate-400" />
                                          <span className="text-slate-600">
                                            {application.email}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Phone className="w-3 h-3 text-slate-400" />
                                          <span className="text-slate-600">
                                            {application.phone}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Calendar className="w-3 h-3 text-slate-400" />
                                          <span className="text-slate-600">
                                            Applied on{" "}
                                            {formatDate(
                                              application.submissionDate,
                                            )}{" "}
                                            at{" "}
                                            {new Date(
                                              application.submissionDate,
                                            ).toLocaleTimeString("en-US", {
                                              hour: "numeric",
                                              minute: "2-digit",
                                              hour12: true,
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                      <h5 className="font-medium text-slate-900 mb-2">
                                        Actions
                                      </h5>
                                      <div className="flex space-x-2">
                                        {canConvertToTenant(application) && (
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleConvertToTenant(
                                                application,
                                              );
                                            }}
                                            className="bg-[#FF5000] hover:bg-[#FF5000]/90 text-white"
                                          >
                                            <UserPlus className="w-3 h-3 mr-1" />
                                            Convert to Tenant
                                          </Button>
                                        )}
                                        {application.kycFormLink && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopyLink(
                                                application.kycFormLink!,
                                              );
                                            }}
                                            className="hover:bg-slate-50"
                                          >
                                            <Link className="w-3 h-3 mr-1" />
                                            Copy Link
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* KYC Details */}
                                  {application.kycData && (
                                    <div>
                                      <h5 className="font-medium text-slate-900 mb-3">
                                        KYC Information
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Personal Info */}
                                        <div className="bg-white rounded-lg p-3">
                                          <h6 className="font-medium text-slate-700 mb-2">
                                            Personal Information
                                          </h6>
                                          <div className="text-sm text-slate-600 space-y-1">
                                            <div>
                                              <span className="font-medium">
                                                Date of Birth:
                                              </span>{" "}
                                              {
                                                application.kycData.personalInfo
                                                  .dateOfBirth
                                              }
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Nationality:
                                              </span>{" "}
                                              {
                                                application.kycData.personalInfo
                                                  .nationality
                                              }
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Occupation:
                                              </span>{" "}
                                              {
                                                application.kycData.personalInfo
                                                  .occupation
                                              }
                                            </div>
                                          </div>
                                        </div>

                                        {/* Employment Info */}
                                        <div className="bg-white rounded-lg p-3">
                                          <h6 className="font-medium text-slate-700 mb-2">
                                            Employment Information
                                          </h6>
                                          <div className="text-sm text-slate-600 space-y-1">
                                            <div>
                                              <span className="font-medium">
                                                Employer:
                                              </span>{" "}
                                              {
                                                application.kycData.employment
                                                  .employer
                                              }
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Type:
                                              </span>{" "}
                                              {
                                                application.kycData.employment
                                                  .employmentType
                                              }
                                            </div>
                                            <div>
                                              <span className="font-medium">
                                                Monthly Income:
                                              </span>{" "}
                                              {
                                                application.kycData.employment
                                                  .monthlyIncome
                                              }
                                            </div>
                                          </div>
                                        </div>

                                        {/* Documents */}
                                        <div className="bg-white rounded-lg p-3">
                                          <h6 className="font-medium text-slate-700 mb-2">
                                            Submitted Documents
                                          </h6>
                                          <div className="flex flex-wrap gap-1">
                                            {application.kycData.documents.map(
                                              (doc, index) => (
                                                <Badge
                                                  key={index}
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {doc}
                                                </Badge>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-slate-900 mb-2">No KYC applications found</h3>
            <p className="text-slate-600">
              {effectiveSearchQuery || statusFilter
                ? "Try adjusting your filters to see more applications."
                : "KYC applications will appear here when people apply through your property links."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Convert to Tenant Modal */}
      {selectedApplicant && (
        <ConvertToTenantModal
          open={showConvertModal}
          onOpenChange={setShowConvertModal}
          applicant={selectedApplicant}
          onConfirm={handleConvertConfirm}
        />
      )}

      {/* Generate KYC Link Modal */}
      <GenerateKYCLinkModal
        isOpen={showGenerateKYCLinkModal}
        onClose={() => setShowGenerateKYCLinkModal(false)}
      />
    </div>
  );
}
