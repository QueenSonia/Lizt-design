/* eslint-disable */
import axiosInstance from "../axios-instance";

export const sendMail = async (data:any) => {
    try {
      const response = await axiosInstance.post("/chats/send-mail", data, {
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


  export const getChats = async() => {
  try {
      const response = await axiosInstance.get(`chats`, {
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.status !== 200) {
        throw new Error("Error fetcthing service requests chat");
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

  export const getChatByRequestId= async (requestId:string) => {
    try {
      const response = await axiosInstance.get(`chats/request/${requestId}`, {
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.status !== 200) {
        throw new Error("Error fetcthing service requests chat");
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

  export const markAsResolved = async(requestId:string) => {
     try {
      const response = await axiosInstance.post(`chats/mark-as-resolved/${requestId}`, {
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.status !== 200) {
        throw new Error("Error fetcthing service requests chat");
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