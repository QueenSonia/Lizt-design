import React, { useState } from "react";
import { FileText, Upload, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CloudinaryUploadService } from "@/components/kyc/services/cloudinary.service";

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  url?: string;
  uploadDate: string;
  size?: number;
  publicId?: string;
}

interface UploadProgress {
  [key: string]: {
    progress: number;
    status: "uploading" | "success" | "error" | "complete";
  };
}

interface DocumentUploadProps {
  documents: Document[];
  onDocumentsChange: (documents: Document[]) => void;
  onDocumentsSave?: (documents: Document[]) => Promise<void>;
  isEditing: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  onUploadStatusChange?: (isUploading: boolean) => void;
}

export default function DocumentUpload({
  documents,
  onDocumentsChange,
  onDocumentsSave,
  isEditing,
  maxFiles = 10,
  acceptedTypes = [".pdf", ".jpg", ".jpeg", ".png"],
  maxFileSize = 5,
  onUploadStatusChange,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Check file limits
    if (documents.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    onUploadStatusChange?.(true);
    const newProgress: UploadProgress = {};

    // Initialize progress for each file
    fileArray.forEach((file, index) => {
      const fileKey = `${file.name}-${Date.now()}-${index}`;
      newProgress[fileKey] = { progress: 0, status: "uploading" };
    });
    setUploadProgress(newProgress);

    try {
      const config = CloudinaryUploadService.getConfig();
      const uploadedDocuments: Document[] = [];

      // Upload files sequentially to better track progress
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const fileKey = `${file.name}-${Date.now()}-${i}`;

        try {
          // Validate file
          const validation = CloudinaryUploadService.validateFile(file);
          if (!validation.isValid) {
            setUploadProgress((prev) => ({
              ...prev,
              [fileKey]: { progress: 0, status: "error" },
            }));
            toast.error(`${file.name}: ${validation.error}`);
            continue;
          }

          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => ({
              ...prev,
              [fileKey]: {
                ...prev[fileKey],
                progress: Math.min(prev[fileKey]?.progress + 15, 90),
              },
            }));
          }, 300);

          // Upload to Cloudinary
          const result = await CloudinaryUploadService.uploadFile(
            file,
            config,
            "raw"
          );

          clearInterval(progressInterval);

          // Complete progress
          setUploadProgress((prev) => ({
            ...prev,
            [fileKey]: { progress: 100, status: "complete" },
          }));

          // Create document object
          const newDocument: Document = {
            id: `temp-${Date.now()}-${i}`,
            name: file.name,
            type: file.name.split(".").pop()?.toUpperCase() || "Document",
            fileUrl: result.secure_url,
            url: result.secure_url,
            uploadDate: new Date().toISOString(),
            size: file.size,
            publicId: result.public_id,
          };

          uploadedDocuments.push(newDocument);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadProgress((prev) => ({
            ...prev,
            [fileKey]: { progress: 0, status: "error" },
          }));
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (uploadedDocuments.length > 0) {
        const updatedDocuments = [...documents, ...uploadedDocuments];
        onDocumentsChange(updatedDocuments);

        // Auto-save if callback provided
        if (onDocumentsSave) {
          await onDocumentsSave(uploadedDocuments);
        }

        toast.success(
          `${uploadedDocuments.length} document(s) uploaded successfully`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload documents");
    } finally {
      setIsUploading(false);
      onUploadStatusChange?.(false);
      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress({});
      }, 3000);
    }
  };

  const handleDeleteDocument = async (index: number) => {
    const documentToDelete = documents[index];

    try {
      // Delete from Cloudinary if possible
      if (documentToDelete.publicId) {
        try {
          const config = CloudinaryUploadService.getConfig();
          await CloudinaryUploadService.deleteFile(
            documentToDelete.publicId,
            config
          );
        } catch (error) {
          console.warn("Failed to delete from Cloudinary:", error);
        }
      }

      // Remove from local state
      const updatedDocuments = documents.filter((_, i) => i !== index);
      onDocumentsChange(updatedDocuments);

      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {isEditing && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              isUploading
                ? "border-orange-300 bg-orange-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(",")}
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="document-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="document-upload"
              className={`flex flex-col items-center justify-center py-4 ${
                isUploading ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-200 border-t-orange-500 mb-3"></div>
                  <p className="text-sm text-orange-600 font-medium mb-1">
                    Uploading documents...
                  </p>
                  <p className="text-xs text-orange-500">
                    Please wait while files are being uploaded
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Click to upload documents
                  </p>
                  <p className="text-xs text-gray-500">
                    {acceptedTypes.join(", ")} files up to {maxFileSize}MB each
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Maximum {maxFiles} files ({documents.length}/{maxFiles}{" "}
                    used)
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                Upload Progress
              </h4>
              {Object.entries(uploadProgress).map(
                ([fileKey, { progress, status }]) => {
                  const fileName = fileKey.split("-").slice(0, -2).join("-");
                  return (
                    <div
                      key={fileKey}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                            {fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {status === "error" && (
                            <span className="text-xs text-red-600 font-medium">
                              Failed
                            </span>
                          )}
                          {status === "complete" && (
                            <span className="text-xs text-green-600 font-medium">
                              Complete
                            </span>
                          )}
                          {status === "uploading" && (
                            <span className="text-xs text-orange-600 font-medium">
                              {progress}%
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress
                        value={progress}
                        className={`h-2 ${
                          status === "error"
                            ? "[&>div]:bg-red-500"
                            : status === "complete"
                            ? "[&>div]:bg-green-500"
                            : "[&>div]:bg-orange-500"
                        }`}
                      />
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Documents ({documents.length})
          </h4>
          {documents.map((doc, index) => (
            <div
              key={doc.id || index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.name || doc.type || "Document"}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {doc.uploadDate && (
                    <p className="text-xs text-gray-500">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
                  )}
                  {doc.size && (
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{doc.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(doc.url || doc.fileUrl) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(doc.url || doc.fileUrl, "_blank")
                    }
                    className="h-8 px-2"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(index)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isUploading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No documents uploaded</p>
        </div>
      )}
    </div>
  );
}
