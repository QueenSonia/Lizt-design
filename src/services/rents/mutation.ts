/* eslint-disable */
import { useMutation } from "@tanstack/react-query";
import { removeTenant } from "./api";
import { toast } from "sonner";

type RemoveTenantPayload = {
  tenant_id: string;
  property_id: string;
};

export function useRemoveTenantMutation() {
  return useMutation({
    mutationFn: async ({ tenant_id, property_id }: RemoveTenantPayload) => {
      return await removeTenant(tenant_id, { property_id });
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error);
      toast.error(error?.message || "An error occurred during tenant removal.");
    },
    onSuccess: () => {
      toast.success("Tenant Removed successfully");
    },
  });
}
