/* eslint-disable */
import { useState } from "react";
import { FileText, ArrowUpDown, Search, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { DocumentDetail } from "./DocumentDetail";
import { useFetchNoticeAgreements } from "@/services/notice-agreement/query";

// Mock document data - focused on tenant documents with required columns
const mockDocuments = [
  {
    id: 1,
    documentName: "Lease_Agreement_Johnson.pdf",
    tenantName: "Sarah Johnson",
    tenantId: 1,
    documentType: "Tenancy Agreement",
    dateUploaded: "Dec 1, 2024",
    downloadUrl: "#",
  },
  {
    id: 2,
    documentName: "ID_Card_Michael_Chen.pdf",
    tenantName: "Michael Chen",
    tenantId: 2,
    documentType: "ID Card",
    dateUploaded: "Nov 28, 2024",
    downloadUrl: "#",
  },
  {
    id: 3,
    documentName: "Proof_of_Income_Rodriguez.pdf",
    tenantName: "Emily Rodriguez",
    tenantId: 3,
    documentType: "Proof of Income",
    dateUploaded: "Nov 25, 2024",
    downloadUrl: "#",
  },
  {
    id: 4,
    documentName: "Passport_Copy_James_Wilson.pdf",
    tenantName: "James Wilson",
    tenantId: 4,
    documentType: "ID Card",
    dateUploaded: "Nov 22, 2024",
    downloadUrl: "#",
  },
  {
    id: 5,
    documentName: "Bank_Statement_Chen.pdf",
    tenantName: "Michael Chen",
    tenantId: 2,
    documentType: "Proof of Payment",
    dateUploaded: "Nov 20, 2024",
    downloadUrl: "#",
  },
  {
    id: 6,
    documentName: "Utility_Bill_Johnson.pdf",
    tenantName: "Sarah Johnson",
    tenantId: 1,
    documentType: "Utility Bill",
    dateUploaded: "Nov 18, 2024",
    downloadUrl: "#",
  },
  {
    id: 7,
    documentName: "Reference_Letter_Rodriguez.pdf",
    tenantName: "Emily Rodriguez",
    tenantId: 3,
    documentType: "Reference Letter",
    dateUploaded: "Nov 15, 2024",
    downloadUrl: "#",
  },
  {
    id: 8,
    documentName: "Employment_Letter_Wilson.pdf",
    tenantName: "James Wilson",
    tenantId: 4,
    documentType: "Proof of Income",
    dateUploaded: "Nov 12, 2024",
    downloadUrl: "#",
  },
];

// Document type options for filter
const documentTypes = [
  "All",
  "ID Card",
  "Tenancy Agreement",
  "Proof of Income",
  "Proof of Payment",
  "Utility Bill",
  "Reference Letter",
];

interface DocumentsProps {
  onUploadDocument: () => void;
  onTenantClick: (tenantId: string) => void;
  searchTerm?: string;
}

export function Documents({
  onUploadDocument,
  onTenantClick,
  searchTerm = "",
}: DocumentsProps) {
  const [sortField, setSortField] = useState<string>("dateUploaded");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  );
  const [isDocumentDetailOpen, setIsDocumentDetailOpen] = useState(false);
  const itemsPerPage = 10;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleTenantNameClick = (tenantId: string) => {
    onTenantClick(tenantId);
  };

  const handleDocumentClick = (documentId: number) => {
    setSelectedDocumentId(documentId);
    setIsDocumentDetailOpen(true);
  };

  const handleCloseDocumentDetail = () => {
    setIsDocumentDetailOpen(false);
    setSelectedDocumentId(null);
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case "ID Card":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Tenancy Agreement":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Proof of Income":
        return "bg-green-100 text-green-800 border-green-200";
      case "Proof of Payment":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Utility Bill":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Reference Letter":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSortIcon = (field: string) => {
    // Return null to make arrows invisible while keeping functionality
    return null;
  };

  // Use local search term if provided, otherwise use global search term
  const effectiveSearchTerm = localSearchTerm || searchTerm;

  const { data: documents } = useFetchNoticeAgreements();

  const filteredAndSortedDocuments = documents
    ?.filter((document: any) => {
      const matchesSearch =
        effectiveSearchTerm === "" ||
        (document.documentName &&
          document.documentName
            .toLowerCase()
            .includes(effectiveSearchTerm.toLowerCase())) ||
        (document.tenantName &&
          document.tenantName
            .toLowerCase()
            .includes(effectiveSearchTerm.toLowerCase())) ||
        (document.documentType &&
          document.documentType
            .toLowerCase()
            .includes(effectiveSearchTerm.toLowerCase()));

      const matchesType =
        documentTypeFilter === "All" ||
        document.documentType === documentTypeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a: any, b: any) => {
      let aValue: any = "";
      let bValue: any = "";

      switch (sortField) {
        case "documentName":
          aValue = a.documentName;
          bValue = b.documentName;
          break;
        case "tenantName":
          aValue = a.tenantName;
          bValue = b.tenantName;
          break;
        case "documentType":
          aValue = a.documentType;
          bValue = b.documentType;
          break;
        case "dateUploaded":
          aValue = new Date(a.dateUploaded).getTime();
          bValue = new Date(b.dateUploaded).getTime();
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        default:
          aValue = a.documentName;
          bValue = b.documentName;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedDocuments?.length / itemsPerPage
  );
  const paginatedDocuments = filteredAndSortedDocuments?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="page-container">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search and Filters */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl text-slate-900 mb-1">Documents</h2>
              <p className="text-slate-600">
                View all uploaded documents across tenants
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by document name or tenant name..."
                value={localSearchTerm}
                onChange={(e) => {
                  setLocalSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
              />
            </div>

            {/* Document Type Filter */}
            <Select
              value={documentTypeFilter}
              onValueChange={(value) => {
                setDocumentTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-auto border-slate-200 px-3 py-2 hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4 text-slate-500" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50/30">
                <TableHead className="h-14 px-6 min-w-[280px]">
                  <button
                    onClick={() => handleSort("documentName")}
                    className="flex items-center text-slate-700 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                  >
                    Document Name
                    {getSortIcon("documentName")}
                  </button>
                </TableHead>
                <TableHead className="h-14 px-6 min-w-[180px]">
                  <button
                    onClick={() => handleSort("tenantName")}
                    className="flex items-center text-slate-700 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                  >
                    Tenant Name
                    {getSortIcon("tenantName")}
                  </button>
                </TableHead>
                <TableHead className="h-14 px-6 min-w-[160px]">
                  <button
                    onClick={() => handleSort("documentType")}
                    className="flex items-center text-slate-700 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                  >
                    Document Type
                    {getSortIcon("documentType")}
                  </button>
                </TableHead>
                <TableHead className="h-14 px-6 min-w-[140px]">
                  <button
                    onClick={() => handleSort("dateUploaded")}
                    className="flex items-center text-slate-700 hover:text-slate-900 transition-colors duration-200 cursor-pointer"
                  >
                    Date Uploaded
                    {getSortIcon("dateUploaded")}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocuments?.map((document: any, index: number) => (
                <TableRow
                  key={document.id}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => handleDocumentClick(document.id)}
                          className="text-slate-900 hover:text-indigo-600 transition-colors truncate block text-left"
                        >
                          {document.documentName}
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <button
                      onClick={() => handleTenantNameClick(document.tenantId)}
                      className="text-slate-700 hover:text-indigo-600 hover:underline transition-colors"
                    >
                      {document.tenantName}
                    </button>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      className={`${getDocumentTypeColor(
                        document.documentType
                      )} border text-xs`}
                    >
                      {document.documentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="text-slate-700">
                      {document.dateUploaded}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedDocuments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-16 text-center">
                    <div className="text-center space-y-3">
                      <div className="text-4xl">📄</div>
                      <div className="text-slate-500">
                        {effectiveSearchTerm || documentTypeFilter !== "All"
                          ? "No documents found matching your criteria."
                          : "No documents uploaded yet"}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAndSortedDocuments?.length
                )}{" "}
                of {filteredAndSortedDocuments?.length} documents
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[32px] h-8 ${
                            currentPage === page
                              ? "gradient-primary text-white border-0"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      <DocumentDetail
        documentId={selectedDocumentId}
        isOpen={isDocumentDetailOpen}
        onClose={handleCloseDocumentDetail}
        onTenantClick={onTenantClick}
      />
    </div>
  );
}
