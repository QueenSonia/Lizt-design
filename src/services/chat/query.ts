import { useQuery } from "@tanstack/react-query";
import { getChatByRequestId, getChats } from "./api";

export function useFetchChats() {
    return useQuery({
      queryKey: ["chats"],
      queryFn: getChats,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
    //   select:(data) => 
    //     data.service_requests.map((service: any) => ({
    //         requestid: service.request_id, 
    //         tenant: service.tenant.profile_name,
    //         property: service.property.name,
    //         issue: service.description,
    //         dateReported: new Date(service.created_at).toLocaleDateString("en-US", {
    //             month: "short",
    //             day: "numeric",
    //             year: "numeric",
    //           }),
    //         status:service.status
    //     }))  
    });
  }


export function useFetchChatByRequestId(requestId:string) {
    return useQuery({
      queryKey: ["chat-by-requestId", requestId],
      queryFn: () => getChatByRequestId(requestId),
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    //   select:(data) => 
    //     data.service_requests.map((service: any) => ({
    //         requestid: service.request_id, 
    //         tenant: service.tenant.profile_name,
    //         property: service.property.name,
    //         issue: service.description,
    //         dateReported: new Date(service.created_at).toLocaleDateString("en-US", {
    //             month: "short",
    //             day: "numeric",
    //             year: "numeric",
    //           }),
    //         status:service.status
    //     }))  
    });
  }
