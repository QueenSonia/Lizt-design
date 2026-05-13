/* eslint-disable */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Building,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { toast } from "sonner";
import { removeFacilityManager } from "@/lib/facilityManagerStore";

// Mock data for facility managers
const mockFacilityManagers = [
  {
    id: "1",
    name: "James Okafor",
    phone: "+234 801 234 5678",
    email: "james.okafor@email.com",
    activeTasks: 3,
    dateAdded: "2024-11-15",
    status: "Active",
  },
  {
    id: "2",
    name: "Sarah Adebayo",
    phone: "+234 802 345 6789",
    email: "sarah.adebayo@email.com",
    activeTasks: 1,
    dateAdded: "2024-11-10",
    status: "Active",
  },
  {
    id: "3",
    name: "David Uche",
    phone: "+234 803 456 7890",
    email: "david.uche@email.com",
    activeTasks: 0,
    dateAdded: "2024-11-05",
    status: "Inactive",
  },
  {
    id: "4",
    name: "Grace Nwosu",
    phone: "+234 804 567 8901",
    email: "grace.nwosu@email.com",
    activeTasks: 2,
    dateAdded: "2024-10-28",
    status: "Active",
  },
];

interface LandlordFacilityManagerDetailProps {
  managerId: string | null;
  onBack: () => void;
}

export default function LandlordFacilityManagerDetail({
  managerId,
  onBack,
}: LandlordFacilityManagerDetailProps) {
  const manager = mockFacilityManagers.find((fm) => fm.id === managerId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleEdit = () => {
    toast.success("Edit facility manager feature coming soon!");
  };

  const handleConfirmDelete = () => {
    if (!manager) return;
    removeFacilityManager(manager.id);
    setConfirmDelete(false);
    toast.success("Facility Manager deleted successfully");
    onBack();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Inactive":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (!manager) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Facility Manager Not Found
          </h3>
          <p className="text-slate-600 mb-4">
            The facility manager you're looking for doesn't exist.
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {manager.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmDelete(true)}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-[#FF5000]" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div>
                <p className="font-medium text-slate-900">Phone Number</p>
                <p className="text-slate-600">{manager.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div>
                <p className="font-medium text-slate-900">Email Address</p>
                <p className="text-slate-600">{manager.email || "——"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-[#FF5000]" />
              <span>Assignment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-slate-900 mb-1">Active Tasks</p>
              <p className="text-slate-600">
                {manager.activeTasks} maintenance request
                {manager.activeTasks === 1 ? "" : "s"} currently assigned
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div>
                <p className="font-medium text-slate-900">Date Added</p>
                <p className="text-slate-600">
                  {formatDate(manager.dateAdded)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-500">No recent activity to display</p>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Facility Manager?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            This will remove <span className="font-medium text-gray-900">{manager.name}</span>. Any maintenance requests currently assigned to them will become unassigned.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
