/* eslint-disable */
import { createPropertySchema } from "@/schemas/property.schemas";
import axiosInstance from "../axios-instance";
import { z } from "zod";
import { PropertyFilter } from "../interface/filter";
import { PropertyDetail } from "@/types/property";

export const getProperties = async (params?: PropertyFilter) => {
  try {
    const response = await axiosInstance.get("/properties", {
      headers: {
        "Content-Type": "application/json",
      },
      params, // ✅ pass query params
    });

    if (response.status !== 200) {
      throw new Error("error fetching properties");
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

export const getMarketingReadyProperties = async () => {
  try {
    const response = await axiosInstance.get(`/properties/marketing-ready`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("error fetching properties");
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

export const fetchAllVacantProperties = async () => {
  try {
    const response = await axiosInstance.get(`/properties/vacant`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("error fetching properties");
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

export const getPropertiesById = async (
  id: string
): Promise<PropertyDetail> => {
  try {
    const response = await axiosInstance.get<PropertyDetail>(
      `/properties/${id}`
    );
    return response.data;
  } catch (error: any) {
    // 🚀 Throw an error so TanStack Query can catch it
    const errorMessage =
      error?.response?.data?.message || "Error fetching property details.";
    throw new Error(errorMessage);
  }
};

export const getPropertyDetails = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/properties/${id}/details`);
    return response.data;
  } catch (error: any) {
    // Enhanced error handling with specific error types
    if (error?.code === "NETWORK_ERROR" || error?.code === "ERR_NETWORK") {
      throw new Error(
        "Property API is currently unavailable. Please check your internet connection and try again."
      );
    }

    if (error?.response?.status === 404) {
      throw new Error(
        "Property not found or you don't have permission to view it."
      );
    }

    if (error?.response?.status === 403) {
      throw new Error("You don't have permission to access this property.");
    }

    if (error?.response?.status >= 500) {
      throw new Error(
        "Property API is currently experiencing issues. Please try again later."
      );
    }

    if (error?.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const errorMessage =
      error?.response?.data?.message || "Error fetching property details.";
    throw new Error(errorMessage);
  }
};

export const getPropertyRent = async (id: string) => {
  try {
    const response = await axiosInstance.get(`properties/rent/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("Error getting Rents");
    }

    return response.data;
  } catch (error: any) {
    let errorMessage = error.message || "An error occurred";
    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || null,
    };
  }
};

export const getPropertyServiceRequests = async (id: string) => {
  try {
    const response = await axiosInstance.get(
      `properties/service-request/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Error getting Rents");
    }

    return response.data;
  } catch (error: any) {
    let errorMessage = error.message || "An error occurred";
    return {
      success: false,
      message: errorMessage,
      error: error.response?.data || null,
    };
  }
};

export const createProperty = async (data: any) => {
  try {
    const response = await axiosInstance.post("/properties", data, {
      // headers: {
      //   "Content-Type": "multipart/form-data",
      // }
    });

    return response.data;
  } catch (error: any) {
    ``;
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

export const updateProperty = async (data: any, id: string) => {
  try {
    const response = await axiosInstance.put(`/properties/${id}`, data);
    console.log("Put response:", response.data);
    return response.data;
  } catch (error: any) {
    // Enhanced error handling with specific error types
    if (error?.code === "NETWORK_ERROR" || error?.code === "ERR_NETWORK") {
      throw new Error(
        "Unable to update property. Please check your internet connection and try again."
      );
    }

    if (error?.response?.status === 404) {
      throw new Error(
        "Property not found or you don't have permission to update it."
      );
    }

    if (error?.response?.status === 403) {
      throw new Error("You don't have permission to update this property.");
    }

    if (error?.response?.status >= 500) {
      throw new Error(
        "Property API is currently experiencing issues. Please try again later."
      );
    }

    if (error?.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    // Try to extract a useful message
    let errorMessage = "An error occurred while updating property";

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

export const getHistoryByPropertyId = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/notifications/property/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("error fetching properties history");
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

export const deletePropertyById = async (
  propertyId: string
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete(`/properties/${propertyId}`);
    return response.data;
  } catch (error: any) {
    // Enhanced error handling with specific error types
    if (error?.code === "NETWORK_ERROR" || error?.code === "ERR_NETWORK") {
      throw new Error(
        "Unable to delete property. Please check your internet connection and try again."
      );
    }

    if (error?.response?.status === 404) {
      throw new Error(
        "Property not found or you don't have permission to delete it."
      );
    }

    if (error?.response?.status === 403) {
      throw new Error("You don't have permission to delete this property.");
    }

    if (error?.response?.status === 400) {
      // Backend validation errors for delete restrictions
      const message = error?.response?.data?.message;
      if (message?.includes("occupied")) {
        throw new Error(
          "Cannot delete property that is currently occupied. Please end the tenancy first."
        );
      }
      if (message?.includes("history")) {
        throw new Error(
          "Cannot delete property with existing tenancy history. Properties that have been inhabited cannot be deleted."
        );
      }
      if (message?.includes("deactivated")) {
        throw new Error(
          "Cannot delete property that is deactivated. Please reactivate the property first."
        );
      }
      throw new Error(
        message ||
          "Cannot delete property due to current state or restrictions."
      );
    }

    if (error?.response?.status >= 500) {
      throw new Error(
        "Property API is currently experiencing issues. Please try again later."
      );
    }

    if (error?.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    // Throw to ensure React Query triggers onError
    throw new Error(
      error?.response?.data?.message || "Failed to delete property"
    );
  }
};

export const AttachTenantToProperty = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.post(
      `/properties/assign-tenant/${id}`,
      data,
      {
        // headers: {
        //   "Content-Type": "multipart/form-data",
        // }
      }
    );
    //
    return response.data;
  } catch (error: any) {
    ``;
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
export const syncPropertyStatuses = async () => {
  try {
    const response = await axiosInstance.post(
      "/properties/sync-statuses",
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    let errorMessage = "An error occurred while syncing property statuses";

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

export const moveTenantOut = async (data: {
  property_id: string;
  tenant_id: string;
  move_out_date: string;
  move_out_reason?: string;
  owner_comment?: string;
}) => {
  try {
    const response = await axiosInstance.post("/properties/move-out", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    // Enhanced error handling with specific error types
    if (error?.code === "NETWORK_ERROR" || error?.code === "ERR_NETWORK") {
      throw new Error(
        "Unable to end tenancy. Please check your internet connection and try again."
      );
    }

    if (error?.response?.status === 404) {
      throw new Error(
        "Property or tenant not found. The tenancy may have already been ended."
      );
    }

    if (error?.response?.status === 403) {
      throw new Error("You don't have permission to end this tenancy.");
    }

    if (error?.response?.status === 400) {
      const message = error?.response?.data?.message;
      if (message?.includes("not currently assigned")) {
        throw new Error("Tenant is not currently assigned to this property.");
      }
      throw new Error(
        message || "Cannot end tenancy due to current state or restrictions."
      );
    }

    if (error?.response?.status >= 500) {
      throw new Error(
        "Tenancy API is currently experiencing issues. Please try again later."
      );
    }

    if (error?.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    let errorMessage = "An error occurred while ending tenancy";

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
export const getScheduledMoveOuts = async () => {
  try {
    const response = await axiosInstance.get(
      "/properties/scheduled-move-outs",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    let errorMessage = "An error occurred while fetching scheduled move-outs";
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    throw new Error(errorMessage);
  }
};

export const cancelScheduledMoveOut = async (scheduleId: string) => {
  try {
    const response = await axiosInstance.delete(
      `/properties/scheduled-move-outs/${scheduleId}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      throw new Error("Scheduled move-out not found or already processed.");
    }

    if (error?.response?.status === 403) {
      throw new Error(
        "You don't have permission to cancel this scheduled move-out."
      );
    }

    if (error?.response?.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    let errorMessage =
      "An error occurred while cancelling the scheduled move-out";
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    throw new Error(errorMessage);
  }
};

export const checkDuplicatePhone = async (phone: string) => {
  try {
    const response = await axiosInstance.get(
      `/properties/check-duplicate-phone`,
      {
        params: { phone },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    // Return null if no duplicate found (404 is expected)
    if (error?.response?.status === 404) {
      return null;
    }

    let errorMessage = "An error occurred while checking phone number";
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    throw new Error(errorMessage);
  }
};

export const createPropertyWithTenant = async (data: any) => {
  try {
    const response = await axiosInstance.post(
      "/properties/create-with-tenant",
      data
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
