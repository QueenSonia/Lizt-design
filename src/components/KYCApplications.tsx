/* eslint-disable */
import { useState } from "react";
import {
  Search,
  Filter,
  Copy,
  ExternalLink,
  FileText,
  Eye,
  Check,
  X,
  Building2,
  Calendar,
  Phone,
  Mail,
  User,
  ChevronUp,
  ChevronDown,
  Download,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";
import { AttachToPropertyModal } from "./AttachToPropertyModal";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { useFilterModal } from "./FilterModal";

// Mock KYC applications data
const mockApplications = [
  {
    id: 1,
    applicantName: "Jennifer Williams",
    phone: "+234 803 456 7890",
    email: "jennifer.williams@email.com",
    submissionDate: "2024-08-01T14:30:00",
    status: "pending" as const,
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
    submissionDate: "2024-07-28T09:15:00",
    status: "approved" as const,
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
    submissionDate: "2024-07-25T16:45:00",
    status: "rejected" as const,
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
    submissionDate: "2024-07-20T11:20:00",
    status: "pending" as const,
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

// Mock properties data for assignment
const mockProperties = [
  {
    id: 1,
    name: "Flat 2B, Maple Court",
    address: "15 Maple Street, Victoria Island, Lagos",
    status: "Available",
    rent: "₦800,000",
  },
  {
    id: 2,
    name: "Studio 1A, Urban Residences",
    address: "22 Urban Drive, Lekki Phase 1, Lagos",
    status: "Available",
    rent: "₦650,000",
  },
  {
    id: 3,
    name: "Apartment 3C, Garden View Complex",
    address: "8 Garden Avenue, Ikeja GRA, Lagos",
    status: "Available",
    rent: "₦1,200,000",
  },
];

interface KYCApplicationsProps {
  onViewKYC: (applicationId: number) => void;
}

export function KYCApplications({ onViewKYC }: KYCApplicationsProps) {
  const [sortField, setSortField] = useState<string>("submissionDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    number | null
  >(null);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [confirmActionId, setConfirmActionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const kycFormLink = "https://propertykraft.africa/apply";

  // Use the proper filter modal hook
  const {
    isOpen,
    filters,
    activeFiltersCount,
    openModal,
    closeModal,
    handleSubmit,
    handleReset,
    FilterModal,
  } = useFilterModal("kyc");

  // Get filter values
  const statusFilter = filters.status || "";

  // Filter and sort applications
  const filteredApplications = mockApplications
    .filter((app) => {
      const matchesSearch =
        app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase());

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
      className="h-auto p-0 justify-start hover:bg-transparent font-medium text-gray-900 hover:text-primary transition-colors group"
    >
      <div className="flex items-center space-x-2">
        {icon && (
          <span className="text-gray-500 group-hover:text-primary transition-colors">
            {icon}
          </span>
        )}
        <span>{children}</span>
        <div className="flex flex-col ml-1">
          <ChevronUp
            className={`w-3 h-3 transition-colors ${
              sortField === field && sortDirection === "asc"
                ? "text-primary"
                : "text-gray-300"
            }`}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1 transition-colors ${
              sortField === field && sortDirection === "desc"
                ? "text-primary"
                : "text-gray-300"
            }`}
          />
        </div>
      </div>
    </Button>
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(kycFormLink);
    toast.success("KYC form link copied to clipboard!");
  };

  const handleOpenForm = () => {
    window.open(kycFormLink, "_blank");
  };

  const handleApplicantClick = (applicationId: number) => {
    setSelectedApplicationId(applicationId);
    setShowApplicantModal(true);
  };

  const handleViewKYCDetails = () => {
    if (selectedApplicationId) {
      onViewKYC(selectedApplicationId);
      setShowApplicantModal(false);
    }
  };

  const handleApprove = () => {
    if (selectedApplicationId) {
      setActionType("approve");
      setConfirmActionId(selectedApplicationId);
      setShowApplicantModal(false);
    }
  };

  const handleReject = () => {
    if (selectedApplicationId) {
      setActionType("reject");
      setConfirmActionId(selectedApplicationId);
      setShowApplicantModal(false);
    }
  };

  const handleConfirmAction = () => {
    const application = mockApplications.find(
      (app) => app.id === confirmActionId
    );
    if (application && actionType) {
      toast.success(
        `Application ${
          actionType === "approve" ? "approved" : "rejected"
        } successfully!`
      );
      // TODO: Update application status in backend
    }
    setActionType(null);
    setConfirmActionId(null);
  };

  const handleAttachToProperty = () => {
    setShowApplicantModal(false);
    setShowAttachModal(true);
  };

  const handleConfirmAttachment = (data: any) => {
    const application = mockApplications.find(
      (app) => app.id === selectedApplicationId
    );

    setShowAttachModal(false);
    setSelectedApplicationId(null);
  };

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
      default:
        return status;
    }
  };

  const selectedApplication = mockApplications.find(
    (app) => app.id === selectedApplicationId
  );
  const confirmApplication = mockApplications.find(
    (app) => app.id === confirmActionId
  );

  const hasActiveFilters = searchQuery || statusFilter;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                  KYC Applications
                </h1>
                <p className="text-gray-600 mt-1">
                  Review and process tenant applications
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 border-gray-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {/* KYC Form Link Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">KYC Form Link</Label>
              <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:gap-3 mt-2">
                <Input
                  value={kycFormLink}
                  readOnly
                  className="flex-1 bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed text-sm"
                />
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    className="hover:bg-blue-50 text-blue-600 border-blue-200 flex-1 md:flex-none"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenForm}
                    className="hover:bg-green-50 text-green-600 border-green-200 flex-1 md:flex-none"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Form
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Share this link with people who want to apply as tenants.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Filter Applications
              </h3>
              <Badge
                variant="outline"
                className="text-gray-600 border-gray-300 self-start md:self-center"
              >
                Showing {filteredApplications.length} applications
              </Badge>
            </div>

            <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200 focus:border-primary/50"
                />
              </div>

              {/* Filter Button */}
              <Button
                variant="outline"
                onClick={openModal}
                className="h-10 border-gray-200 relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center bg-primary text-primary-foreground"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <>
                <Separator />
                <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-3">
                  <p className="text-sm font-medium text-gray-700">
                    Active filters:
                  </p>
                  <div className="flex items-center space-x-2 flex-wrap">
                    {searchQuery && (
                      <Badge
                        variant="outline"
                        className="text-xs border-gray-300"
                      >
                        Search: "{searchQuery}"
                      </Badge>
                    )}
                    {statusFilter && (
                      <Badge
                        variant="outline"
                        className="text-xs border-gray-300"
                      >
                        Status: {statusFilter}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Applications Table */}
        {filteredApplications.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Mobile Card View */}
            <div className="md:hidden">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleApplicantClick(application.id)}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {application.applicantName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {application.email}
                        </p>
                      </div>
                      <Badge
                        variant={getStatusBadgeVariant(application.status)}
                      >
                        {getStatusText(application.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{application.phone}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(application.submissionDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="py-4 px-6">
                      <SortButton
                        field="applicantName"
                        icon={<User className="w-4 h-4" />}
                      >
                        Applicant Name
                      </SortButton>
                    </TableHead>
                    <TableHead className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          Phone Number
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="py-4 px-6">
                      <SortButton
                        field="email"
                        icon={<Mail className="w-4 h-4" />}
                      >
                        Email
                      </SortButton>
                    </TableHead>
                    <TableHead className="py-4 px-6">
                      <SortButton
                        field="submissionDate"
                        icon={<Calendar className="w-4 h-4" />}
                      >
                        Submission Date
                      </SortButton>
                    </TableHead>
                    <TableHead className="py-4 px-6">
                      <SortButton field="status">Status</SortButton>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application, index) => (
                    <TableRow
                      key={application.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      onClick={() => handleApplicantClick(application.id)}
                    >
                      <TableCell className="py-4 px-6">
                        <span className="text-gray-900 group-hover:text-primary transition-colors font-medium">
                          {application.applicantName}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600">
                        {application.phone}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600">
                        {application.email}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600">
                        <div className="flex flex-col">
                          <span>{formatDate(application.submissionDate)}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              application.submissionDate
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge
                          variant={getStatusBadgeVariant(application.status)}
                        >
                          {getStatusText(application.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-12 text-center">
            <FileText className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">No KYC applications found</h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more applications.
            </p>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {FilterModal}

      {/* Applicant Actions Modal */}
      <Dialog open={showApplicantModal} onOpenChange={setShowApplicantModal}>
        <DialogContent className="max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Applicant Actions</DialogTitle>
            <DialogDescription>
              Choose an action for {selectedApplication?.applicantName}'s KYC
              application.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-gray-900">
                    {selectedApplication.applicantName}
                  </h4>
                  <Badge
                    variant={getStatusBadgeVariant(selectedApplication.status)}
                  >
                    {getStatusText(selectedApplication.status)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{selectedApplication.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{selectedApplication.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Submitted {formatDate(selectedApplication.submissionDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleViewKYCDetails}
                  className="w-full justify-start hover:bg-blue-50 text-blue-600 border-blue-200"
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-3" />
                  View Application
                </Button>

                {selectedApplication.status === "pending" && (
                  <>
                    <Button
                      onClick={handleApprove}
                      className="w-full justify-start hover:bg-green-50 text-green-600 border-green-200"
                      variant="outline"
                    >
                      <Check className="w-4 h-4 mr-3" />
                      Approve Application
                    </Button>
                    <Button
                      onClick={handleReject}
                      className="w-full justify-start hover:bg-red-50 text-red-600 border-red-200"
                      variant="outline"
                    >
                      <X className="w-4 h-4 mr-3" />
                      Reject Application
                    </Button>
                  </>
                )}

                {selectedApplication.status === "approved" && (
                  <Button
                    onClick={handleAttachToProperty}
                    className="w-full justify-start hover:bg-purple-50 text-purple-600 border-purple-200"
                    variant="outline"
                  >
                    <Building2 className="w-4 h-4 mr-3" />
                    Attach to Property
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApplicantModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach to Property Modal */}
      {selectedApplication && (
        <AttachToPropertyModal
          isOpen={showAttachModal}
          onClose={() => setShowAttachModal(false)}
          tenantId={selectedApplication.id.toString()}
          tenantName={selectedApplication.applicantName}
          onAttachSuccess={() => {
            setShowAttachModal(false);
            toast.success("Application attached to property successfully");
          }}
          vacantProperties={[]}
        />
      )}

      {/* Confirm Action Dialog */}
      <AlertDialog
        open={confirmActionId !== null}
        onOpenChange={() => setConfirmActionId(null)}
      >
        <AlertDialogContent className="mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Application
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {actionType === "approve" ? "approve" : "reject"} the KYC
              application from "{confirmApplication?.applicantName}"?
              {actionType === "approve"
                ? " This will allow them to be assigned to a property."
                : " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {actionType === "approve" ? "Approve" : "Reject"} Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
