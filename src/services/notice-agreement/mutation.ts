/* eslint-disable */
import { useMutation } from "@tanstack/react-query";
import { createNoticeAgreement, uploadDocument } from "./api";
import { toast } from "sonner";

export function useCreateNoticeAgreement() {
  return useMutation({
    mutationFn: async (formPayload: any) => {
      return await createNoticeAgreement(formPayload);
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error.message);
      return (
        error.message || "An error occurred during notice agreement creation."
      );
    },
    onSuccess: async (data) => {
      return data;
    },
  });
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: async ({
      id,
      formPayload,
    }: {
      id: string;
      formPayload: { document_url: string[] };
    }) => {
      return await uploadDocument(id, formPayload);
    },
    onMutate: () => {},
    onError: (error: any) => {
      console.error(error.message);
      return toast.error(
        error.message || "An error occurred during notice agreement creation."
      );
    },
    onSuccess: async (data) => {
      console.log({ data });
      return toast.success(data.message || "upload successful");
    },
  });
}
