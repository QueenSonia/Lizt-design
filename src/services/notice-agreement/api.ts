/* eslint-disable */
import axiosInstance from "../axios-instance";
import { NoticeAgreementFilter } from "../interface/filter";

  
export const createNoticeAgreement = async (data:any) => {
    try {
      const response = await axiosInstance.post("/notice-agreement", data, {
        // headers: {
        //   "Content-Type": "multipart/form-data",
        // }
      });
//
      return response.data
    } catch (error: any) {``
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


  export const getNoticeAgreements = async (params?:NoticeAgreementFilter) => {
    try {
      const response = await axiosInstance.get("/notice-agreement", {
        headers: {
          "Content-Type": "application/json",
        },
         params,
      });

      if (response.status !== 200) {
        throw new Error("error fetching notice agreement");
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

  export const NoticeAnalytics = async () => {
    try {
      const response = await axiosInstance.get("/notice-agreement/analytics", {
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.status !== 200) {
        throw new Error("error fetching notice agreement");
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

  export const getNoticeAgreementByTenant = async () => {
    try {
      const response = await axiosInstance.get("/notice-agreement/tenant", {
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.status !== 200) {
        throw new Error("error fetching notice agreement");
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

  export const uploadDocument = async (id:string, data:any) => {
    try {
      const response = await axiosInstance.post(`/notice-agreement/upload-document/${id}`, data, {
        // headers: {
        //   "Content-Type": "multipart/form-data",
        // }
      });
//
      return response.data
    } catch (error: any) {``
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