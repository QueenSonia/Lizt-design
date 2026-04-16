/* eslint-disable */

import { useState, useEffect } from "react";
import { X, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface EditArtisanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artisan: {
    id: number;
    name: string;
    trade: string;
    phone: string;
    email: string;
    status: "active" | "inactive";
    rating: number;
    availability: string;
    responseTime: string;
  };
  onArtisanUpdated: () => void;
}

export function EditArtisanModal({
  open,
  onOpenChange,
  artisan,
  onArtisanUpdated,
}: EditArtisanModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    trade: "",
    phone: "",
    email: "",
    status: true,
    rating: 0,
    availability: "",
    responseTime: "",
    responseUnit: "hours",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);

  const trades = [
    "Plumber",
    "Electrician",
    "Carpenter",
    "Painter",
    "HVAC Technician",
    "Cleaner",
    "Gardener",
    "General Maintenance",
    "Security Guard",
    "Handyman",
  ];

  const availabilityOptions = [
    "Available",
    "On Job",
    "Not Available",
    "Busy",
    "Off Duty",
  ];

  // Initialize form with artisan data when modal opens
  useEffect(() => {
    if (open && artisan) {
      // Parse response time to get number and unit
      const responseTimeMatch = artisan.responseTime.match(
        /(\d+)\s*(hour|minute|hr|min)/
      );
      const responseTimeNumber = responseTimeMatch ? responseTimeMatch[1] : "2";
      const responseTimeUnit =
        responseTimeMatch && responseTimeMatch[2].includes("min")
          ? "minutes"
          : "hours";

      setFormData({
        fullName: artisan.name,
        trade: artisan.trade,
        phone: artisan.phone,
        email: artisan.email,
        status: artisan.status === "active",
        rating: artisan.rating,
        availability: artisan.availability,
        responseTime: responseTimeNumber,
        responseUnit: responseTimeUnit,
      });
    }
  }, [open, artisan]);

  const handleInputChange = (
    field: string,
    value: string | boolean | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({
      ...prev,
      rating: rating,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!formData.trade) {
      toast.error("Trade selection is required");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!formData.availability) {
      toast.error("Availability status is required");
      return;
    }

    if (!formData.responseTime || isNaN(Number(formData.responseTime))) {
      toast.error("Response time must be a valid number");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Format response time for display
      const formattedResponseTime = `${formData.responseTime} ${
        formData.responseUnit === "hours" ? "hours" : "minutes"
      } average`;

      

      toast.success(`${formData.fullName} has been updated successfully`);
      onArtisanUpdated();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update artisan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Edit Artisan
          </DialogTitle>
          <DialogDescription>
            Update personal details and performance information for{" "}
            {artisan?.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-slate-900">
                Personal Information
              </h3>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="font-medium text-slate-700"
                >
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="Enter full name"
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade" className="font-medium text-slate-700">
                  Trade/Specialty *
                </Label>
                <Select
                  value={formData.trade}
                  onValueChange={(value) => handleInputChange("trade", value)}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Select trade" />
                  </SelectTrigger>
                  <SelectContent>
                    {trades.map((trade) => (
                      <SelectItem key={trade} value={trade}>
                        {trade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium text-slate-700">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+234 XXX XXX XXXX"
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium text-slate-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="email@example.com"
                  className="border-slate-300"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-slate-200" />

          {/* Performance & Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-slate-900">
                Performance & Status
              </h3>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-slate-700">Status</Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={formData.status}
                    onCheckedChange={(checked) =>
                      handleInputChange("status", checked)
                    }
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {formData.status ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-slate-700">
                  Availability *
                </Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value) =>
                    handleInputChange("availability", value)
                  }
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-slate-700">Rating</Label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    className="focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= (ratingHover || formData.rating)
                          ? "text-amber-400 fill-current"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-600">
                  {formData.rating > 0 ? `${formData.rating}.0` : "No rating"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-slate-700">
                Average Response Time *
              </Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    value={formData.responseTime}
                    onChange={(e) =>
                      handleInputChange("responseTime", e.target.value)
                    }
                    placeholder="2"
                    type="number"
                    min="1"
                    max="999"
                    className="pl-10 border-slate-300"
                  />
                </div>
                <Select
                  value={formData.responseUnit}
                  onValueChange={(value) =>
                    handleInputChange("responseUnit", value)
                  }
                >
                  <SelectTrigger className="w-32 border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-500">
                Average time it takes for this artisan to respond to service
                requests
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gradient-primary text-white border-0 px-6"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
