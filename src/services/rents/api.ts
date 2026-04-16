/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "../axios-instance";

  export const getDueRents = async () => {
    try {
      const response = await axiosInstance.get("rents/due", {
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.status !== 200) {
        throw new Error("Error Due Rents");
      }
  
      return response.data
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred";
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || null,
      };
    }
  }


  export const getOverDueRents = async () => {
    try {
      const response = await axiosInstance.get("rents/overdue", {
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.status !== 200) {
        throw new Error("Error Due Rents");
      }
  
      return response.data
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred";
      return {
        success: false,
        message: errorMessage,
        error: error.response?.data || null,
      };
    }
  }


export const removeTenant = async (id: string, data:any) => {
  try {
    const response = await axiosInstance.put(`/rents/remove/${id}`, data);
    return response.data;
  } catch (error: any) {
    // Throw to ensure React Query triggers onError
    throw new Error(error?.response?.data?.message || "Failed to remove tenant");
  }
};
