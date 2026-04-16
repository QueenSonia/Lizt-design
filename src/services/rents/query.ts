/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { getDueRents, getOverDueRents } from "./api";

export function useFetchDueRents() {
    return useQuery({
      queryKey: ["due-rents"],
      queryFn: getDueRents,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      select:(data) => 
        data.rents.map((rent: any) => ({
            id: rent.id, 
            tenant: rent.tenant.first_name,
            property: rent.property.name,
            amountDue: rent.amount_paid,
            expiryDate: new Date(rent.expiry_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            status:rent.status
        }))  
    });
  }
  

export function useFetchOverDueRents() {
  return useQuery({
    queryKey: ["due-rents"],
    queryFn: getOverDueRents,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: any) =>
      data?.rents?.map((rent: any) => {
        const dueDate = new Date(rent.expiry_date);
        const today = new Date();
        const diffInMs = today.getTime() - dueDate.getTime();
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)); // convert ms -> days

        return {
          id: rent?.id,
          tenantName: `${rent?.tenant?.first_name ?? ""} ${rent?.tenant?.last_name ?? ""}`,
          property: rent?.property?.name ?? "Unknown Property",
          amountDue: rent?.amount_paid ?? 0,
          dueDate: dueDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          overdueDuration: diffInDays > 0 ? `${diffInDays} day(s)` : "Not overdue",
          status: rent?.rent_status ?? "Unknown",
        };
      }) ?? [],
  });
}

  