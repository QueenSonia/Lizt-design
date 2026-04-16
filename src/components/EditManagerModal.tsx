import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DeleteManagerModal from "./DeleteManagerModal";

interface FacilityManager {
  id: string;
  name: string;
  phone_number: string;
  role: string;
  date: string;
}

interface EditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: FacilityManager;
  onEdit: (id: string, name: string, phone: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function EditManagerModal({
  isOpen,
  onClose,
  manager,
  onEdit,
  onDelete,
}: EditManagerModalProps) {
  const [name, setName] = useState(manager.name);
  const [phone, setPhone] = useState(manager.phone_number);
  const [errors, setErrors] = useState({ name: "", phone: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(manager.name);
    setPhone(manager.phone_number);
    setErrors({ name: "", phone: "" });
  }, [manager]);

  const handleClose = () => {
    setErrors({ name: "", phone: "" });
    onClose();
  };

  const validateForm = () => {
    const newErrors = { name: "", phone: "" };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onEdit(manager.id, name.trim(), phone.trim());
      handleClose();
    } catch (error) {
      console.error("Error in modal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      await onDelete(manager.id);
      setShowDeleteModal(false);
      handleClose();
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Facility Manager</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Enter full name"
                className={errors.name ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: "" });
                }}
                placeholder="Enter phone number"
                className={errors.phone ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-[#FF5000] hover:bg-[#E64500] text-white"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={handleDeleteClick}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={loading}
              >
                Delete Manager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteManagerModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        managerName={manager.name}
      />
    </>
  );
}
