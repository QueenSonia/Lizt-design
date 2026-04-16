/**
 * Modern File Upload Component with Cloudinary Integration
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  FileText,
  ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/components/ui/utils";
import { CloudinaryUploadService } from "../services/cloudinary.service";
import {
  ModernFileUploadProps,
  FileUploadState,
} from "../types/cloudinary.types";
import { BRAND_COLOR } from "../constants/theme";
import Image from "next/image";

export const ModernFileUpload: React.FC<ModernFileUploadProps> = ({
  label,
  accept,
  preview = true,
  value,
  file,
  onChange,
  required = false,
  hint,
  description,
  cloudinaryConfig,
  onUploadComplete,
  onUploadError,
  onUploadingChange,
}) => {
  // Support both 'file' and 'value' props for backwards compatibility
  const currentFile = file ?? value;
  const displayText = description ?? hint;
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrl: null,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle preview URL creation and cleanup
  React.useEffect(() => {
    if (currentFile && currentFile.type?.startsWith("image/")) {
      const url = URL.createObjectURL(currentFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [currentFile]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file first
      const validation = CloudinaryUploadService.validateFile(file);
      if (!validation.isValid) {
        setUploadState((prev) => ({
          ...prev,
          error: validation.error || "Invalid file",
        }));
        onUploadError?.({
          message: validation.error || "Invalid file",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      // Clear previous errors
      setUploadState((prev) => ({ ...prev, error: null }));

      // Update local state immediately
      onChange(file);

      // Start upload to Cloudinary (only if config is provided)
      if (cloudinaryConfig) {
        setUploadState((prev) => ({ ...prev, isUploading: true, progress: 0 }));
        onUploadingChange?.(true);

        try {
          // Simulate progress for better UX
          const progressInterval = setInterval(() => {
            setUploadState((prev) => ({
              ...prev,
              progress: Math.min(prev.progress + 10, 90),
            }));
          }, 200);

          const uploadResponse = await CloudinaryUploadService.uploadFile(
            file,
            cloudinaryConfig,
            file.type?.startsWith("image/") ? "image" : "raw"
          );

          clearInterval(progressInterval);

          setUploadState({
            isUploading: false,
            progress: 100,
            error: null,
            uploadedUrl: uploadResponse.secure_url,
          });
          onUploadingChange?.(false);

          onUploadComplete?.(uploadResponse.secure_url);
        } catch (error) {
          // Clear the file so the user doesn't see a "selected" file with no URL
          onChange(null);

          setUploadState({
            isUploading: false,
            progress: 0,
            error: error instanceof Error ? error.message : "Upload failed. Please try again.",
            uploadedUrl: null,
          });
          onUploadingChange?.(false);

          onUploadError?.(
            error instanceof Error
              ? { message: error.message, code: "UPLOAD_ERROR" }
              : { message: "Upload failed", code: "UNKNOWN_ERROR" }
          );
        }
      }
    },
    [onChange, cloudinaryConfig, onUploadComplete, onUploadError, onUploadingChange]
  );

  // Handle drag and drop events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Handle file removal
  const handleRemoveFile = useCallback(() => {
    onChange(null);
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrl: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onChange]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type?.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span style={{ color: BRAND_COLOR }} className="ml-1">
            *
          </span>
        )}
      </label>

      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragOver
            ? "border-orange-500 bg-orange-50"
            : uploadState.error
              ? "border-red-300 bg-red-50"
              : currentFile
                ? "border-green-300 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100",
          "cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Upload Content */}
        <div className="text-center">
          {uploadState.isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Uploading...</p>
                <Progress value={uploadState.progress} className="w-full" />
                <p className="text-xs text-gray-500">{uploadState.progress}%</p>
              </div>
            </div>
          ) : currentFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                {getFileIcon(currentFile)}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {currentFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(currentFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {uploadState.uploadedUrl && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs">Uploaded successfully</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-orange-600">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {displayText || "Supported formats: JPEG, PNG, PDF (Max 5MB)"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{uploadState.error}</span>
        </div>
      )}

      {/* File Preview */}
      {preview && previewUrl && (
        <div className="mt-4">
          <Image
            src={previewUrl}
            alt={`Preview of ${currentFile?.name}`}
            width={128}
            height={128}
            className="max-w-full h-32 object-cover rounded-lg border"
            unoptimized // Add unoptimized to avoid Next.js image optimization issues with blob URLs if needed
          />
        </div>
      )}
    </div>
  );
};
