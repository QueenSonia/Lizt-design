/* eslint-disable */
import { useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { toast } from "sonner";

interface Document {
  id: number;
  fileName: string;
  documentType: string;
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
  tenant?: string | null;
  property: string;
  status: string;
  expiryDate?: string | null;
  category: string;
}

interface DocumentPreviewModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  const [imageLoadError, setImageLoadError] = useState(false);

  if (!document) return null;

  const getFileExtension = (fileName: string) => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  };

  const getFileType = (fileName: string) => {
    const extension = getFileExtension(fileName);

    if (["pdf"].includes(extension)) return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension))
      return "image";
    if (["txt", "md", "csv"].includes(extension)) return "text";
    if (["doc", "docx"].includes(extension)) return "document";
    if (["xls", "xlsx"].includes(extension)) return "spreadsheet";

    return "other";
  };

  const generateMockFileUrl = (fileName: string) => {
    // In a real application, this would be the actual file URL from your storage
    const fileType = getFileType(fileName);

    switch (fileType) {
      case "pdf":
        return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
      case "image":
        return `https://picsum.photos/800/600?random=${document.id}`;
      case "text":
        return `data:text/plain,This is a sample ${fileName} document content.\\n\\nDocument ID: ${document.id}\\nProperty: ${document.property}\\nUploaded by: ${document.uploadedBy}\\nUpload Date: ${document.uploadDate}`;
      default:
        return null;
    }
  };

  const handleDownload = () => {
    // In a real application, this would trigger the actual file download
    toast.success(`Downloaded ${document.fileName}`);
  };

  const handleOpenInNewTab = () => {
    const fileUrl = generateMockFileUrl(document.fileName);
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    } else {
      toast.error("Cannot preview this file type");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
      case "Valid":
      case "Verified":
        return "bg-green-100 text-green-800 border-green-200";
      case "Completed":
      case "Processed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Tenant Documents":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Property Documents":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Maintenance":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Financial":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderFileIcon = () => {
    const fileType = getFileType(document.fileName);

    switch (fileType) {
      case "pdf":
        return <FileText className="w-6 h-6 text-red-500" />;
      case "image":
        return <ImageIcon className="w-6 h-6 text-blue-500" />;
      default:
        return <File className="w-6 h-6 text-slate-500" />;
    }
  };

  const renderPreview = () => {
    const fileType = getFileType(document.fileName);
    const fileUrl = generateMockFileUrl(document.fileName);

    switch (fileType) {
      case "pdf":
        return (
          <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {fileUrl ? (
              <iframe
                src={fileUrl}
                className="w-full h-[500px] md:h-[600px]"
                title={document.fileName}
              />
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    PDF preview not available
                  </p>
                  <Button
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {!imageLoadError && fileUrl ? (
              <div className="flex items-center justify-center p-6">
                <img
                  src={fileUrl}
                  alt={document.fileName}
                  className="max-w-full max-h-[500px] md:max-h-[600px] object-contain rounded-lg shadow-sm"
                  onError={() => setImageLoadError(true)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    Image preview not available
                  </p>
                  <Button
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case "text":
        return (
          <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {fileUrl ? (
              <iframe
                src={fileUrl}
                className="w-full h-[500px] md:h-[600px] border-0"
                title={document.fileName}
              />
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Text preview not available</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="w-full bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center p-6">
                <File className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-slate-900 mb-2">Preview not available</h3>
                <p className="text-slate-600 mb-2">
                  This file type cannot be previewed directly
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  File: {document.fileName}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="gradient-primary text-white border-0"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          Document Preview: {document.fileName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Preview and manage document {document.fileName} -{" "}
          {document.documentType} for {document.tenant || document.property}
        </DialogDescription>

        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 min-w-0 flex-1">
                <div className="flex-shrink-0 mt-1">{renderFileIcon()}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl text-slate-900 truncate mb-2">
                    {document.fileName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`${getCategoryColor(
                        document.category
                      )} text-xs`}
                    >
                      {document.category}
                    </Badge>
                    <Badge
                      className={`${getStatusColor(
                        document.status
                      )} text-xs border`}
                    >
                      {document.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  New Tab
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Document Metadata */}
          <div className="flex-shrink-0 px-6 py-4 bg-slate-50/80 border-b border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Document Type</div>
                <div className="text-slate-900">{document.documentType}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Property</div>
                <div className="text-slate-900 truncate">
                  {document.property}
                </div>
              </div>
              {document.tenant && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Tenant</div>
                  <div className="text-slate-900 truncate">
                    {document.tenant}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-slate-500 mb-1">File Size</div>
                <div className="text-slate-900">{document.fileSize}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Upload Date</div>
                <div className="text-slate-900">{document.uploadDate}</div>
                <div className="text-xs text-slate-500">
                  by {document.uploadedBy}
                </div>
              </div>
              {document.expiryDate && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Expires</div>
                  <div className="text-slate-900">{document.expiryDate}</div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-6 overflow-auto bg-white">
            <div className="w-full h-full">{renderPreview()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
