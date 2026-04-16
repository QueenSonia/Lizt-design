/* eslint-disable */
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import AddressAutocomplete from "./AddressAutoComplete";

interface AddLandlordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLandlordAdded?: () => void;
}

interface Property {
  id: number;
  name: string;
  location: string;
  rentAmount?: number;
}

interface NewPropertyData {
  name: string;
  location: string;
  rentAmount: string;
}

export function AddLandlordModal({
  open,
  onOpenChange,
  onLandlordAdded,
}: AddLandlordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createNewProperty, setCreateNewProperty] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  // New property form state
  const [newPropertyData, setNewPropertyData] = useState<NewPropertyData>({
    name: "",
    location: "",
    rentAmount: "",
  });

  // Mock existing properties
  const existingProperties: Property[] = [
    {
      id: 1,
      name: "Sunset Apartments",
      location: "Victoria Island, Lagos",
      rentAmount: 850000,
    },
    {
      id: 2,
      name: "Ocean View Towers",
      location: "Ikoyi, Lagos",
      rentAmount: 1200000,
    },
    {
      id: 3,
      name: "Downtown Lofts",
      location: "Lekki Phase 1, Lagos",
      rentAmount: 950000,
    },
    {
      id: 4,
      name: "Garden Heights",
      location: "Ikeja, Lagos",
      rentAmount: 750000,
    },
    {
      id: 5,
      name: "Marina Suites",
      location: "Victoria Island, Lagos",
      rentAmount: 1100000,
    },
  ];

  const handleCloseModal = () => {
    onOpenChange(false);
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
    });
    setNewPropertyData({
      name: "",
      location: "",
      rentAmount: "",
    });
    setCreateNewProperty(false);
    setSelectedProperties([]);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePropertySelection = (propertyId: number, checked: boolean) => {
    if (checked) {
      setSelectedProperties((prev) => [...prev, propertyId]);
    } else {
      setSelectedProperties((prev) => prev.filter((id) => id !== propertyId));
    }
  };

  const handleNewPropertyChange = (
    field: keyof NewPropertyData,
    value: string
  ) => {
    setNewPropertyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone Number is required");
      return false;
    }
    if (!formData.address.trim()) {
      toast.error("Address is required");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Check if properties are selected or new property is being created
    if (!createNewProperty && selectedProperties.length === 0) {
      toast.error(
        "Please select at least one property or create a new property"
      );
      return false;
    }

    // Validate new property if creating one
    if (createNewProperty) {
      if (!newPropertyData.name.trim()) {
        toast.error("Property Name is required");
        return false;
      }
      if (!newPropertyData.location.trim()) {
        toast.error("Property Location is required");
        return false;
      }
      if (!newPropertyData.rentAmount.trim()) {
        toast.error("Rent Amount is required");
        return false;
      }
      const rentAmount = parseFloat(newPropertyData.rentAmount);
      if (isNaN(rentAmount) || rentAmount <= 0) {
        toast.error("Please enter a valid rent amount");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, you would send this data to your backend
      const landlordData = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phoneNumber,
        address: formData.address,
        properties: createNewProperty ? [newPropertyData] : selectedProperties,
      };

      toast.success("Landlord added successfully!");
      handleCloseModal();

      // Callback to refresh landlord list or perform other actions
      onLandlordAdded?.();
    } catch (error) {
      toast.error("Failed to add landlord. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Landlord</DialogTitle>
          <DialogDescription className="sr-only">
            Form to add a new landlord to the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="+234 803 123 4567"
                />
              </div>
            </div>

            <AddressAutocomplete
              id="address"
              label="Address"
              required={true}
              value={formData.address}
              onChange={(value) => handleInputChange("address", value)}
              placeholder="Enter full address"
              useTextarea={true}
              rows={3}
            />
          </div>

          {/* Property Assignment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-2">
              Property Assignment
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createNewProperty"
                  checked={createNewProperty}
                  onCheckedChange={(checked) =>
                    setCreateNewProperty(checked === true)
                  }
                />
                <Label htmlFor="createNewProperty">Create New Property</Label>
              </div>

              {createNewProperty ? (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-900">
                    New Property Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="propertyName">Property Name *</Label>
                      <Input
                        id="propertyName"
                        value={newPropertyData.name}
                        onChange={(e) =>
                          handleNewPropertyChange("name", e.target.value)
                        }
                        placeholder="Enter property name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="propertyLocation">Location *</Label>
                      <Input
                        id="propertyLocation"
                        value={newPropertyData.location}
                        onChange={(e) =>
                          handleNewPropertyChange("location", e.target.value)
                        }
                        placeholder="Enter property location"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rentAmount">Rent Amount (₦) *</Label>
                    <Input
                      id="rentAmount"
                      type="number"
                      value={newPropertyData.rentAmount}
                      onChange={(e) =>
                        handleNewPropertyChange("rentAmount", e.target.value)
                      }
                      placeholder="Enter rent amount"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Select Existing Properties</Label>
                  <div className="max-h-40 overflow-y-auto space-y-3 p-4 border border-slate-200 rounded-lg">
                    {existingProperties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-start space-x-3"
                      >
                        <Checkbox
                          id={`property-${property.id}`}
                          checked={selectedProperties.includes(property.id)}
                          onCheckedChange={(checked) =>
                            handlePropertySelection(
                              property.id,
                              checked as boolean
                            )
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`property-${property.id}`}
                            className="cursor-pointer block"
                          >
                            <div className="font-medium text-slate-900">
                              {property.name}
                            </div>
                            <div className="text-sm text-slate-600">
                              {property.location}
                            </div>
                            {property.rentAmount && (
                              <div className="text-sm text-slate-500">
                                ₦{property.rentAmount.toLocaleString()}/month
                              </div>
                            )}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedProperties.length > 0 && (
                    <div className="text-sm text-slate-600">
                      {selectedProperties.length} property(ies) selected
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCloseModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gradient-primary text-white"
          >
            {isSubmitting ? "Adding Landlord..." : "Add Landlord"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
