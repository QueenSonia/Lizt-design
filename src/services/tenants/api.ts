/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "../axios-instance";

export const getTenantServiceRequest = async (status = "") => {
  try {
    const response = await axiosInstance.get(
      `/service-requests/tenant?status=${status}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Error Fetching Service Requests");
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = error.message || "An error occurred";
    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || null,
    };
  }
};

export const getTenantRentDetails = async (tenant_id: string) => {
  try {
    const response = await axiosInstance.get(`/rents/tenant/${tenant_id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Tenant Rent Details");
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = error.message || "An error occurred";
    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || null,
    };
  }
};

export const getTenantPropertyHistory = async (property_id: string) => {
  try {
    const response = await axiosInstance.get(
      `/property-history/tenant-property/${property_id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Error Fetching Property History");
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = error.message || "An error occurred";
    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || null,
    };
  }
};

export const getTenantProperty = async (property_id: string) => {
  try {
    const response = await axiosInstance.get(`/properties/${property_id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Property Details");
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = error.message || "An error occurred";
    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || null,
    };
  }
};

export const createServiceRequest = async (data: object) => {
  const response = await axiosInstance.post(`/service-requests`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export const getAdminDetails = async (user_id: string, fields: string[]) => {
  try {
    const params = new URLSearchParams();
    fields.forEach((field) => params.append("fields", field));

    const response = await axiosInstance.get(
      `/users/fields/${user_id}?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Alternative solution 2 in case the one up fails.

    // const response = await axiosInstance.get(`/users/fields/${user_id}`, {
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   params: {
    //     fields: fields
    //   }
    // });

    if (response.status !== 200) {
      throw new Error("Error Fetching Admin Details");
    }

    return response.data;
  } catch (error: any) {
    const errorMessage = error.message || "An error occurred";
    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || null,
    };
  }
};

export const getTenantKycByUserId = async (userId: string) => {
  try {
    // Get all tenant KYC records and find the one for this user
    const response = await axiosInstance.get(`/tenant-kyc`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Find the KYC record for this specific user
    const kycRecord = response.data?.data?.find(
      (kyc: any) => kyc.user_id === userId
    );

    return kycRecord;
  } catch (error: any) {
    console.error("Error fetching tenant KYC:", error);
    return null;
  }
};

export const updateTenantKyc = async (
  kycId: string,
  data: any,
  tenantId?: string
) => {
  try {
    // Include tenant_id in the request body if provided
    const requestData = tenantId ? { ...data, tenant_id: tenantId } : data;

    const response = await axiosInstance.patch(
      `/tenant-kyc/${kycId}`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    // Try to extract a useful message
    let errorMessage = "An error occurred";

    if (error?.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        // Validation error from class-validator
        const constraints = error.response.data.message[0]?.constraints;
        errorMessage = constraints
          ? Object.values(constraints)[0] // pick first constraint message
          : error.response.data.message[0];
      } else if (typeof error.response.data.message === "string") {
        errorMessage = error.response.data.message;
      }
    }

    throw new Error(errorMessage);
  }
};

export const attachTenantToProperty = async (
  tenantId: string,
  data: {
    propertyId: string;
    tenancyStartDate: string;
    rentAmount: number;
    rentFrequency: string;
    rentDueDate: string;
    serviceCharge?: number;
  }
) => {
  console.log(data);
  try {
    const response = await axiosInstance.post(
      `/users/${tenantId}/attach-to-property`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    let errorMessage = "An error occurred";

    if (error?.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        const constraints = error.response.data.message[0]?.constraints;
        errorMessage = constraints
          ? Object.values(constraints)[0]
          : error.response.data.message[0];
      } else if (typeof error.response.data.message === "string") {
        errorMessage = error.response.data.message;
      }
    }

    throw new Error(errorMessage);
  }
};
