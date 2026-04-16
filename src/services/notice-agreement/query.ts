/* eslint-disable */
import { useQuery } from "@tanstack/react-query";
import { getNoticeAgreementByTenant, getNoticeAgreements, NoticeAnalytics } from "./api";
import { NoticeAgreementFilter } from "../interface/filter";

export function useFetchNoticeAgreements(params?:NoticeAgreementFilter) {
    return useQuery({
      queryKey: ["notice-agreement", params],   
      queryFn: () => getNoticeAgreements(params),
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      select: (data:any) =>
        data.notice.map((notice: any) => ({
          documentName: notice.notice_type,
          documentType: notice.notice_type,
          tenantName: notice.tenant_name,
          property: notice.property_name,
          dateUploaded:  new Date(notice.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status:notice.status,
          notice_document: notice?.notice_image ? notice?.notice_image : notice?.notice_documents[0]?.url
        })),
    });
  }

  export function useNoticeAnalytics(){
    return useQuery({
      queryKey: ["notice-analytics"],   
      queryFn: NoticeAnalytics,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      // select:data
  })
}

export function useFetchNoticeAgreementByTenant() {
  return useQuery({
    queryKey: ["notice-agreement-by-tenant"],   
    queryFn: getNoticeAgreementByTenant,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data:any) =>
      data.notice_agreements.map((notice: any) => ({
        noticeType: notice.notice_type,
        tenant: notice.tenant_name,
        property: notice.property_name,
        dateSent:  new Date(notice.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status:notice.status,
        notice_document: notice.notice_image
      })),
  });
}
