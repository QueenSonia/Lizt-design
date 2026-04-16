/* eslint-disable */

import { useState, useEffect } from "react";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { UpdatePropertyPayload } from "@/types/property";
import { useFetchPropertyById } from "@/services/property/query";
import { useUpdatePropertyMutation } from "@/services/property/mutation";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AddressAutocomplete from "./AddressAutoComplete";

interface LandlordEditPropertyProps {
  propertyId?: string | null;
  onBack?: () => void;
  onSubmitSuccess?: () => void;
  submitRef?: React.MutableRefObject<(() => void) | null>;
}

type FormData = {
  name: string;
  location: string;
  type: string;
  bedrooms: string;
  bathrooms: string;
};



type FormErrors = {
  name: string;
  location: string;
  type: string;
  bedrooms: string;
  bathrooms: string;
};

export function LandlordEditProperty({
  propertyId,
  onBack,
  onSubmitSuccess,
  submitRef,
}: LandlordEditPropertyProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userRole = user?.role;
  const queryClient = useQueryClient();

  const effectivePropertyId = propertyId || searchParams.get("propertyId");

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const {
    data: property,
    isLoading,
    isError,
  } = useFetchPropertyById(effectivePropertyId || "");

  const { mutate: updatePropertyMutation, isPending: isSubmitting } =
    useUpdatePropertyMutation(effectivePropertyId || "");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    location: "",
    type: "",
    bedrooms: "",
    bathrooms: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    location: "",
    type: "",
    bedrooms: "",
    bathrooms: "",
  });

  useEffect(() => {
    if (property && effectivePropertyId) {
      const normalizePropertyType = (type: string) => {
        if (!type) return "studio";
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
        return (
          typeMapping[normalized] ||
          typeMapping[type] ||
          typeMapping[type.toLowerCase()] ||
          "studio"
        );
      };

      const newFormData = {
        name: property?.name || "",
        location: property?.location || "",
        type: normalizePropertyType(property?.propertyType || ""),
        bedrooms:
          property?.bedrooms === -1
            ? "0"
            : typeof property.bedrooms === "number"
            ? property.bedrooms.toString()
            : "0",
        bathrooms:
          property.bathrooms === undefined ||
          property.bathrooms === null ||
          isNaN(property.bathrooms)
            ? "1"
            : property.bathrooms.toString(),
      };

      setFormData(newFormData);
      setErrors({
        name: "",
        location: "",
        type: "",
        bedrooms: "",
        bathrooms: "",
      });
    }
  }, [property, effectivePropertyId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && onBack) {
        onBack();
      }
    };

    if (window.innerWidth >= 1024 && onBack) {
      onBack();
      return;
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onBack]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {
      name: "",
      location: "",
      type: "",
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
    if (!formData.type) {
      newErrors.type = "Property type is required";
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
    if (!effectivePropertyId || !validateForm()) return;

    const requiredFields: (keyof FormData)[] = [
      "name",
      "location",
      "type",
      "bedrooms",
      "bathrooms",
    ];

    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    const payload: UpdatePropertyPayload = {
      name: formData.name,
      location: formData.location,
      property_type: formData.type,
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
      }-bedroom ${formData.type.toLowerCase()} located in ${
        formData.location
      }`,
    };

    console.log("payload", payload);
    updatePropertyMutation(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["get-properties-by-id", effectivePropertyId],
        });
        toast.success("Property updated successfully!");

        // Navigate back to the previous page
        if (onBack) {
          onBack();
        } else {
          router.back();
        }
      },
      onError: (error: any) => {
        toast.error(
          error.message || "An error occurred while updating the property."
        );
      },
    });
  };

  if (submitRef) {
    submitRef.current = () => {
      const form = document.getElementById(
        "edit-property-form"
      ) as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    };
  }

  if (isLoading || !property || !formData.type) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-lg text-slate-900 mb-2">Property Not Found</h2>
          <p className="text-sm text-slate-600 mb-4">
            The requested property could not be found.
          </p>
          <Button onClick={handleBack} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Property
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-lg text-slate-900">Edit Property Details</h1>
            <p className="text-xs text-slate-600">
              Update property information to keep it accurate and up to date.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 pt-10">
        <form onSubmit={handleSubmit} className="px-4 pt-8 pb-6 space-y-7">
          <div className="space-y-2">
            <Label htmlFor="property-name" className="text-sm text-slate-700">
              Property Name
            </Label>
            <Input
              id="property-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter property name"
              disabled={isSubmitting}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <AddressAutocomplete
            onPlaceSelected={(place) => {
              if (place?.formatted_address) {
                handleInputChange("location", place.formatted_address);
              }
            }}
            placeholder="Search address or enter manually"
            disabled={isSubmitting}
            error={errors.location}
            value={formData.location}
          />

          <div className="space-y-2">
            <Label htmlFor="property-type" className="text-sm text-slate-700">
              Property Type
            </Label>
            <Select
              value={formData.type || "studio"}
              onValueChange={(value) => {
                handleInputChange("type", value);
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="property-type"
                className={errors.type ? "border-red-500" : ""}
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
            {errors.type && (
              <p className="text-xs text-red-500">{errors.type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedrooms" className="text-sm text-slate-700">
              Bedrooms
            </Label>
            <Select
              value={formData.bedrooms || "0"}
              onValueChange={(value) => {
                handleInputChange("bedrooms", value);
              }}
              disabled={isSubmitting}
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

          <div className="space-y-2">
            <Label htmlFor="bathrooms" className="text-sm text-slate-700">
              Bathrooms
            </Label>
            <Select
              value={formData.bathrooms || "1"}
              onValueChange={(value) => {
                handleInputChange("bathrooms", value);
              }}
              disabled={isSubmitting}
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
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 safe-area-bottom">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-[#FF5000] hover:bg-[#E64800] text-white h-11 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </div>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
