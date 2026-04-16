import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  formatNumberWithCommas,
  parseFormattedNumber,
} from "@/utils/formatters";

interface SetRentPriceRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (price: number) => void;
  onCancel: () => void;
  propertyName: string;
}

export function SetRentPriceRangeModal({
  isOpen,
  onClose,
  onSave,
  onCancel,
}: SetRentPriceRangeModalProps) {
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<{ price?: string }>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrice("");
      setErrors({});
    }
  }, [isOpen]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, "");
    if (value === "" || /^\d+$/.test(value)) {
      setPrice(value ? formatNumberWithCommas(value) : "");
      if (errors.price) {
        setErrors((prev) => ({ ...prev, price: undefined }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: { price?: string } = {};

    if (!price || price.trim() === "") {
      newErrors.price = "Price is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const value = parseInt(parseFormattedNumber(price));
      onSave(value);
      handleClose();
    }
  };

  const handleCancel = () => {
    onCancel();
    handleClose();
  };

  const handleClose = () => {
    setPrice("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-gray-900">
            Set Annual Rent Price
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <p className="text-sm text-gray-600 mb-6">
            Enter the annual rent price for this property. This will be shown to
            tenants when selecting a property during KYC.
          </p>

          <div className="space-y-4">
            {/* Marketing Price */}
            <div>
              <Label
                htmlFor="price"
                className="text-sm text-gray-700 mb-1.5 block"
              >
                Annual Rent Price
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₦
                </span>
                <Input
                  id="price"
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="0"
                  className={`pl-8 rounded-xl border-gray-200 focus:border-[#FF5000] focus:ring-[#FF5000] ${errors.price ? "border-red-500" : ""
                    }`}
                />
              </div>
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">{errors.price}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6">
          <div className="flex gap-3 justify-end w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#FF5000] hover:bg-[#E64800] text-white rounded-xl"
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
