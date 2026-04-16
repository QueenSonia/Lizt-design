import axiosInstance from "../axios-instance";

export const getServiceRequest = async () => {
  const response = await axiosInstance.get("service-requests", {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export const getServiceRequestByTenant = async () => {
  const response = await axiosInstance.get("service-requests/tenant", {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export const getActiveMaintenanceIssues = async () => {
  const response = await axiosInstance.get("service-requests/pending-urgent", {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};
