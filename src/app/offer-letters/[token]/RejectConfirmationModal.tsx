"use client";

import { useCallback } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useRejectOfferMutation } from "@/services/offer-letters/mutation";
import { offerLetterApi } from "@/services/offer-letters/api";

interface RejectConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onConfirm: () => void;
}

/**
 * Reject Confirmation Modal Component
 * Requirements: 9.6
 */
export function RejectConfirmationModal({
  isOpen,
  onClose,
  token,
  onConfirm,
}: RejectConfirmationModalProps) {
  const rejectMutation = useRejectOfferMutation();

  // Handle rejection confirmation - Requirements: 9.6
  const handleConfirm = useCallback(async () => {
    try {
      // Get user's IP address for tracking
      const ipAddress = await offerLetterApi.getUserIP();
      await rejectMutation.mutateAsync({ token, ipAddress });
      onConfirm();
    } catch (err) {
      console.error("Failed to reject offer:", err);
    }
  }, [token, rejectMutation, onConfirm]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Offer Letter?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reject this offer? This action cannot be
            undone. The landlord will be notified of your decision.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={rejectMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={rejectMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {rejectMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Rejecting...
              </>
            ) : (
              "Yes, Reject Offer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
