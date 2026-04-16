/* eslint-disable */

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import {
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Users,
} from "lucide-react";
import { useFetchKYCApplications } from "@/services/kyc/query";
import {
  useAttachTenantMutation,
  AttachTenantData,
} from "@/services/kyc/mutation";
import { toast } from "sonner";

interface KYCApplicationsListProps {
  propertyId: string;
  propertyName: string;
}

export function KYCApplicationsList({
  propertyId,
  propertyName,
}: KYCApplicationsListProps) {
  const [selectedApplication, setSelectedApplication] = useState<string | null>(
    null
  );
  const [attachmentData, setAttachmentData] = useState<AttachTenantData>({
    rentAmount: 0,
    rentDueDate: 1,
    rentFrequency: "monthly",
    tenancyStartDate: new Date().toISOString().split("T")[0],
    securityDeposit: 0,
    serviceCharge: 0,
  });

  const {
    data: applicationsData,
    isLoading,
    error,
  } = useFetchKYCApplications(propertyId);
  const attachTenantMutation = useAttachTenantMutation();

  const handleAttachTenant = async (applicationId: string) => {
    try {
      await attachTenantMutation.mutateAsync({
        applicationId,
        attachmentData,
      });
      toast.success("Tenant attached successfully!");
      setSelectedApplication(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to attach tenant");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">
          Error loading KYC applications: {error.message}
        </p>
      </div>
    );
  }

  const applications = applicationsData?.applications || [];
  const statistics = applicationsData?.statistics || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header with Application Count */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          KYC Applications for {propertyName}
        </h2>

        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">
            {statistics.total}
          </div>
          <div className="text-sm text-slate-600">Total Applications</div>
        </div>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-600">
            No KYC applications found for this property.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {application.firstName} {application.lastName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(application.status)}
                    {application.status === "pending" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="gradient-primary text-white"
                            onClick={() =>
                              setSelectedApplication(application.id)
                            }
                          >
                            Attach Tenant
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Attach Tenant to Property</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-slate-600 mb-2">
                                Attaching:{" "}
                                <span className="font-medium">
                                  {application.firstName} {application.lastName}
                                </span>
                              </p>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="rentAmount">
                                    Rent Amount (₦)
                                  </Label>
                                  <Input
                                    id="rentAmount"
                                    type="number"
                                    value={attachmentData.rentAmount}
                                    onChange={(e) =>
                                      setAttachmentData((prev) => ({
                                        ...prev,
                                        rentAmount: Number(e.target.value),
                                      }))
                                    }
                                    placeholder="500000"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="rentDueDate">
                                    Rent Due Date
                                  </Label>
                                  <Input
                                    id="rentDueDate"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={attachmentData.rentDueDate}
                                    onChange={(e) =>
                                      setAttachmentData((prev) => ({
                                        ...prev,
                                        rentDueDate: Number(e.target.value),
                                      }))
                                    }
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="rentFrequency">
                                  Payment Frequency
                                </Label>
                                <Select
                                  value={attachmentData.rentFrequency}
                                  onValueChange={(value: any) =>
                                    setAttachmentData((prev) => ({
                                      ...prev,
                                      rentFrequency: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="monthly">
                                      Monthly
                                    </SelectItem>
                                    <SelectItem value="quarterly">
                                      Quarterly
                                    </SelectItem>
                                    <SelectItem value="bi-annually">
                                      Bi-annually
                                    </SelectItem>
                                    <SelectItem value="annually">
                                      Annually
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="tenancyStartDate">
                                  Tenancy Start Date
                                </Label>
                                <Input
                                  id="tenancyStartDate"
                                  type="date"
                                  value={attachmentData.tenancyStartDate}
                                  onChange={(e) =>
                                    setAttachmentData((prev) => ({
                                      ...prev,
                                      tenancyStartDate: e.target.value,
                                    }))
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="securityDeposit">
                                    Security Deposit (₦)
                                  </Label>
                                  <Input
                                    id="securityDeposit"
                                    type="number"
                                    value={attachmentData.securityDeposit}
                                    onChange={(e) =>
                                      setAttachmentData((prev) => ({
                                        ...prev,
                                        securityDeposit: Number(e.target.value),
                                      }))
                                    }
                                    placeholder="100000"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="serviceCharge">
                                    Service Charge (₦)
                                  </Label>
                                  <Input
                                    id="serviceCharge"
                                    type="number"
                                    value={attachmentData.serviceCharge}
                                    onChange={(e) =>
                                      setAttachmentData((prev) => ({
                                        ...prev,
                                        serviceCharge: Number(e.target.value),
                                      }))
                                    }
                                    placeholder="50000"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedApplication(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() =>
                                  handleAttachTenant(application.id)
                                }
                                disabled={attachTenantMutation.isPending}
                                className="gradient-primary text-white"
                              >
                                {attachTenantMutation.isPending
                                  ? "Attaching..."
                                  : "Attach Tenant"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{application.email || "No email provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{application.phoneNumber}</span>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {application.dateOfBirth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>
                        {new Date(application.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {application.gender && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>{application.gender}</span>
                    </div>
                  )}
                  {application.maritalStatus && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>{application.maritalStatus}</span>
                    </div>
                  )}
                </div>

                {/* Location Information */}
                {(application.stateOfOrigin || application.nationality) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {application.stateOfOrigin && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>
                          {application.stateOfOrigin},{" "}
                          {application.localGovernmentArea}
                        </span>
                      </div>
                    )}
                    {application.nationality && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Nationality:</span>
                        <span>{application.nationality}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Employment Information */}
                {(application.occupation || application.employerName) && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {application.occupation && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-500" />
                          <span>{application.occupation}</span>
                        </div>
                      )}
                      {application.employerName && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Employer:</span>
                          <span>{application.employerName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submission Date */}
                <div className="text-xs text-slate-500 pt-2 border-t">
                  Submitted:{" "}
                  {new Date(application.submissionDate).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
