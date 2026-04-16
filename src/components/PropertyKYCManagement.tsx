import React from "react";
import { KYCApplicationsList } from "./KYCApplicationsList";
import { Button } from "./ui/button";
import { ArrowLeft, FileText } from "lucide-react";

interface PropertyKYCManagementProps {
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  onBack?: () => void;
}

export function PropertyKYCManagement({
  propertyId,
  propertyName,
  propertyAddress,
  onBack,
}: PropertyKYCManagementProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  KYC Applications
                </h1>
                <p className="text-slate-600">
                  Manage tenant applications for {propertyName}
                </p>
                {propertyAddress && (
                  <p className="text-sm text-slate-500">{propertyAddress}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="w-4 h-4" />
                <span>Applications</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <KYCApplicationsList
          propertyId={propertyId}
          propertyName={propertyName}
        />
      </div>
    </div>
  );
}

export default PropertyKYCManagement;
