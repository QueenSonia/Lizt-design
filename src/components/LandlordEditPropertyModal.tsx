import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { useUpdatePropertyMutation } from "@/services/property/mutation";
import { UpdatePropertyPayload } from "@/types/property";
import { useQueryClient } from "@tanstack/react-query";
import AddressAutocomplete from "./AddressAutoComplete";

interface PropertyData {
  id: string; // Changed to string to match UUID
  name: string;
  location: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
}

interface LandlordEditPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyData: PropertyData | null;
  onPropertyUpdated: (updatedData: PropertyData) => void;
}

export function LandlordEditPropertyModal({
  open,
  onOpenChange,
  propertyData,
  onPropertyUpdated,
}: LandlordEditPropertyModalProps) {
  const queryClient = useQueryClient();

  // Use the mutation hook for updating property
  const { mutate: updatePropertyMutation, isPending: isLoading } =
    useUpdatePropertyMutation(propertyData?.id || "");

  // Property form state with validation errors
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    location: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
  });

  // Populate form when property data changes
  useEffect(() => {
    if (propertyData && open) {
      const normalizePropertyType = (type: string) => {
        if (!type) return "studio"; // Default to a valid value

        const normalized = type.toLowerCase().trim().replace(/\s+/g, "-");

        const typeMapping: { [key: string]: string } = {
          studio: "studio",
          "mini flat": "mini-flat",
          "mini-flat": "mini-flat",
          miniflat: "mini-flat",
          apartment: "apartment",
          duplex: "duplex",
          terrace: "terrace",
          bungalow: "bungalow",
          commercial: "commercial",
        };

        const bedroomApartmentPattern = /^\d+-bedroom-apartment$/;
        if (bedroomApartmentPattern.test(normalized)) {
          return "apartment";
        }

        const result =
          typeMapping[normalized] ||
          typeMapping[type] ||
          typeMapping[type.toLowerCase()] ||
          "studio";

        if (
          ![
            "studio",
            "mini-flat",
            "apartment",
            "duplex",
            "terrace",
            "bungalow",
            "commercial",
          ].includes(result)
        ) {
          console.warn(
            `Invalid property type "${type}" normalized to "${result}".`
          );
        }
        return result;
      };

      const bathroomsValue =
        propertyData.bathrooms === undefined ||
        propertyData.bathrooms === null ||
        isNaN(propertyData.bathrooms)
          ? "1" // Default to "1" if undefined, null, or NaN
          : propertyData.bathrooms.toString();

      const formDataToSet = {
        name: propertyData.name || "",
        location: propertyData.location || "",
        propertyType: normalizePropertyType(propertyData.type || ""),
        bedrooms:
          propertyData.bedrooms === -1
            ? "0"
            : typeof propertyData.bedrooms === "number"
            ? propertyData.bedrooms.toString()
            : "0",
        bathrooms: bathroomsValue,
      };

      setFormData(formDataToSet);

      setErrors({
        name: "",
        location: "",
        propertyType: "",
        bedrooms: "",
        bathrooms: "",
      });
    }
  }, [propertyData, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      location: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
    };

    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Property name is required";
      isValid = false;
    }

    if (!formData.location.trim()) {
      newErrors.location = "Address is required";
      isValid = false;
    }

    if (!formData.propertyType) {
      newErrors.propertyType = "Property type is required";
      isValid = false;
    }

    if (!formData.bedrooms) {
      newErrors.bedrooms = "Number of bedrooms is required";
      isValid = false;
    }

    if (!formData.bathrooms) {
      newErrors.bathrooms = "Number of bathrooms is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateForm() || !propertyData) {
      return;
    }

    // Create a clean payload, parsing numbers correctly
    const payload: UpdatePropertyPayload = {
      name: formData.name,
      location: formData.location,
      property_type: formData.propertyType,
      no_of_bedrooms: formData.bedrooms
        ? formData.bedrooms === "0"
          ? -1
          : Number(formData.bedrooms)
        : undefined,
      no_of_bathrooms: formData.bathrooms
        ? Number(formData.bathrooms)
        : undefined,
      description: `Property is a ${
        formData.bedrooms
      }-bedroom ${formData.propertyType.toLowerCase()} located in ${
        formData.location
      }`,
    };

    console.log("payload:", payload);

    // Call the mutate function from our hook
    updatePropertyMutation(payload, {
      onSuccess: () => {
        // Invalidate and refetch property data - use correct query keys
        queryClient.invalidateQueries({
          queryKey: ["get-property-details-with-history", propertyData.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["get-properties-by-id", propertyData.id],
        });
        // Invalidate all variations of the properties list query
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "get-properties",
        });

        // Show success toast
        toast.success("Property updated successfully!");

        // Call the callback with updated data
        onPropertyUpdated({
          ...propertyData,
          name: formData.name,
          location: formData.location,
          type: formData.propertyType,
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
        });

        // Trigger close through handleClose to ensure pointerEvents reset
        handleClose(false);
      },
      onError: (error: Error) => {
        toast.error(
          error.message || "Failed to update property. Please try again."
        );
      },
    });
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset to original property data when closing
      if (propertyData) {
        setFormData({
          name: propertyData.name || "",
          location: propertyData.location || "",
          propertyType: propertyData.type || "",
          bedrooms: propertyData.bedrooms?.toString() || "",
          bathrooms: propertyData.bathrooms?.toString() || "",
        });
      }
      setErrors({
        name: "",
        location: "",
        propertyType: "",
        bedrooms: "",
        bathrooms: "",
      });
    }
    if (!isLoading) {
      onOpenChange(open);

      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-lg shadow-2xl border border-slate-200/50 animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl text-slate-900">
            Edit Property Details
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Update property information to keep it accurate and up to date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Property Name */}
          <div className="space-y-2">
            <Label htmlFor="property-name" className="text-sm text-slate-700">
              Property Name
            </Label>
            <Input
              id="property-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter property name"
              disabled={isLoading}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Address */}
          <AddressAutocomplete
            onPlaceSelected={(place) => {
              if (place?.formatted_address) {
                handleInputChange("location", place.formatted_address);
              }
            }}
            placeholder="Search address or enter manually"
            disabled={isLoading}
            error={errors.location}
            value={formData.location}
          />

          {/* Property Type */}
          <div className="space-y-2">
            <Label htmlFor="property-type" className="text-sm text-slate-700">
              Property Type
            </Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) => {
                handleInputChange("propertyType", value);
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                id="property-type"
                className={errors.propertyType ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="mini-flat">Mini Flat</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="duplex">Duplex</SelectItem>
                <SelectItem value="terrace">Terrace</SelectItem>
                <SelectItem value="bungalow">Bungalow</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            {errors.propertyType && (
              <p className="text-xs text-red-500">{errors.propertyType}</p>
            )}
          </div>

          {/* Bedrooms */}
          <div className="space-y-2">
            <Label htmlFor="bedrooms" className="text-sm text-slate-700">
              Bedrooms
            </Label>
            <Select
              value={formData.bedrooms}
              onValueChange={(value) => {
                handleInputChange("bedrooms", value);
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                id="bedrooms"
                className={errors.bedrooms ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select number of bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Studio (0 Bedrooms)</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "Bedroom" : "Bedrooms"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bedrooms && (
              <p className="text-xs text-red-500">{errors.bedrooms}</p>
            )}
          </div>

          {/* Bathrooms */}
          <div className="space-y-2">
            <Label htmlFor="bathrooms" className="text-sm text-slate-700">
              Bathrooms
            </Label>
            <Select
              value={formData.bathrooms}
              onValueChange={(value) => {
                handleInputChange("bathrooms", value);
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                id="bathrooms"
                className={errors.bathrooms ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select number of bathrooms" />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "Bathroom" : "Bathrooms"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bathrooms && (
              <p className="text-xs text-red-500">{errors.bathrooms}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isLoading}
              className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#FF5000] hover:bg-[#E64800] text-white h-11 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Changes...</span>
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
