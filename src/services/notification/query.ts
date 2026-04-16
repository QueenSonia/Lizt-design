/* eslint-disable */
// useFetchPropertyOverview.ts
import { useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { getPropertyOverview } from "./api";
import { Notification, NotificationType } from "@/types/notification";

export function useFetchPropertyOverview() {
  const ITEMS_PER_PAGE = 20;
  return useInfiniteQuery({
    queryKey: ["fetch-property-overview"],
    queryFn: ({ pageParam = 1 }) =>
      getPropertyOverview({ pageParam, limit: ITEMS_PER_PAGE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / ITEMS_PER_PAGE);
      if (allPages.length < totalPages) {
        return allPages.length + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage, allPages) => {
      return undefined;
    },
    select: (data: InfiniteData<{ notifications: any[]; total: number }>) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        notifications: (page.notifications || []).map((item: any) => {
          const activeTenant = item.property?.property_tenants?.find(
            (tenant: any) => tenant.status === "active"
          );
          return {
            id: item.id,
            date: new Date(item.date),
            type: item.type as NotificationType,
            description: item.description,
            status: item.status ?? "Pending",
            user_id: item.user?.id ?? "",
            property_id: item.property?.id ?? "",
            service_request_id: item.serviceRequest?.request_id ?? null,
            tenant_id: activeTenant ? activeTenant.tenant_id : null,
            property: item.property
              ? {
                  id: item.property.id,
                  name: item.property.name,
                  address: item.property.address ?? "",
                  property_tenants: item.property.property_tenants ?? [],
                }
              : undefined,
            serviceRequest: item.serviceRequest
              ? {
                  id: item.serviceRequest.request_id,
                  title: item.serviceRequest.title ?? "",
                  status: item.serviceRequest.status ?? "pending",
                }
              : null,
          };
        }),
      })),
    }),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
