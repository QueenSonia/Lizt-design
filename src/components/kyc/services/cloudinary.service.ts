/**
 * Cloudinary upload service for KYC file uploads
 * Requirements: 2.1, 2.2, 2.3
 */

import { CloudinaryConfig, UploadResponse, UploadError } from "../types";

export class CloudinaryUploadService {
  /**
   * Upload a file to Cloudinary
   */
  static async uploadFile(
    file: File,
    config: CloudinaryConfig,
    resourceType: "image" | "raw" = "image"
  ): Promise<UploadResponse> {
    // Validate configuration first
    if (!this.validateConfig(config)) {
      throw new Error(
        "Cloudinary configuration is missing. Please check your environment variables."
      );
    }

    // Validate file before upload
    const fileValidation = this.validateFile(file);
    if (!fileValidation.isValid) {
      throw new Error(fileValidation.error);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", config.uploadPreset);
      formData.append("cloud_name", config.cloudName);

      // Add security measures
      formData.append("folder", "kyc-documents");
      formData.append("resource_type", resourceType);

      // Add timestamp for tracking
      formData.append("timestamp", Math.round(Date.now() / 1000).toString());

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await response.json();

      return {
        public_id: data.public_id,
        secure_url: data.secure_url,
        format: data.format,
        bytes: data.bytes,
        width: data.width,
        height: data.height,
      };
    } catch (error) {
      const uploadError: UploadError = {
        message: error instanceof Error ? error.message : "Upload failed",
        code: "UPLOAD_ERROR",
        details: error,
      };
      throw uploadError;
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  static async deleteFile(
    publicId: string,
    config: CloudinaryConfig
  ): Promise<void> {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = await this.generateSignature(
        publicId,
        timestamp,
        config.apiSecret
      );

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("signature", signature);
      formData.append("api_key", config.apiKey);
      formData.append("timestamp", timestamp.toString());

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Delete failed");
      }
    } catch (error) {
      console.error("Failed to delete file from Cloudinary:", error);
      // Don't throw error for delete operations to avoid blocking user flow
    }
  }

  /**
   * Generate signature for authenticated requests
   */
  private static async generateSignature(
    publicId: string,
    timestamp: number,
    apiSecret: string
  ): Promise<string> {
    const params = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

    // In a real implementation, this should be done on the server side
    // For now, we'll use a simple hash (this is not secure for production)
    const encoder = new TextEncoder();
    const data = encoder.encode(params);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex;
  }

  /**
   * Get Cloudinary configuration from environment variables
   */
  static getConfig(): CloudinaryConfig {
    return {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "",
      apiSecret: process.env.CLOUDINARY_API_SECRET || "",
      uploadPreset:
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "kyc_uploads",
    };
  }

  /**
   * Validate Cloudinary configuration
   */
  static validateConfig(config: CloudinaryConfig): boolean {
    return !!(config.cloudName && config.uploadPreset);
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { isValid: false, error: "File size must be less than 5MB" };
    }

    // File type validation
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Invalid file type. Please upload JPEG, PNG, or PDF files only.",
      };
    }

    return { isValid: true };
  }

  /**
   * Get optimized upload URL for different file types
   */
  static getUploadUrl(
    cloudName: string,
    resourceType: "image" | "raw"
  ): string {
    return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  }
}
