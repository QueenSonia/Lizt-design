/**
 * TypeScript interfaces for Cloudinary integration
 * Requirements: 2.1, 2.2, 2.3
 */

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
}

export interface UploadResponse {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface UploadError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrl: string | null;
}

export interface ModernFileUploadProps {
  label: string;
  accept: string;
  preview?: boolean;
  value?: File | null;
  file?: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
  hint?: string;
  description?: string;
  cloudinaryConfig?: CloudinaryConfig;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: UploadError) => void;
  onUploadingChange?: (isUploading: boolean) => void;
}
