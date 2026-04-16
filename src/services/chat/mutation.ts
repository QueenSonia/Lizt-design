/* eslint-disable */
import { useMutation } from "@tanstack/react-query";
import { markAsResolved, sendMail } from "./api";
import { toast } from "sonner";

export function useSendMail() {
    return useMutation({
      mutationFn: async (formPayload: any) => {
        return await sendMail(formPayload);
      },
      onMutate: () => {
        console.log("🔐 sending email...");
      },
      onError: (error: any) => {
        console.error(error.message);
        return error.message || "An error occurred while sending email.";
      },
      onSuccess: async (data) => {
        return data;
      },
    });
  }


 
export function useMarkAsResolved(requestId: string) {
  return useMutation({
    mutationFn: () => markAsResolved(requestId),
    onMutate: () => {
      console.log("🔐 resolving service request...");
    },
    onError: (error: any) => {
      const message = error.message || "An error occurred while resolving service.";
      toast.error(message); // show toast
    },
    onSuccess: (data) => {
      console.log("✅ Ticket resolved:", data);
      toast.success('service request is resolved')
      window.location.reload(); // reload page
    },
  });
}