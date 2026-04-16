/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import axiosInstance from "../axios-instance";
import { loginSchema } from "@/schemas/user.schemas";
import { UserFilter } from "../interface/filter";
import { TenantDetail } from "@/types/tenant";
import { TeamMember } from "@/types/team";

export const loginUser = async (data: z.infer<typeof loginSchema>) => {
  try {
    const response = await axiosInstance.post("/users/login", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

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

    // ✅ THROW the error so it goes to React Query's onError and your .catch
    throw new Error(errorMessage);
  }
};

export const getUsers = async () => {
  try {
    const response = await axiosInstance.get("/users", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Users");
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

export const getProfile = async () => {
  try {
    const response = await axiosInstance.get(`/users/profile`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Users");
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

export const getTenants = async (params?: UserFilter) => {
  try {
    const response = await axiosInstance.get("/users/tenant-list", {
      headers: {
        "Content-Type": "application/json",
      },
      params, // ✅ pass query params
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Tenants");
    }

    return response.data;
  } catch (error: any) {
    // Re-throw the error so React Query can handle it properly
    const errorMessage =
      error?.response?.data?.message ||
      error.message ||
      "Failed to fetch tenants";
    throw new Error(errorMessage);
  }
};

export const getSingleTenant = async (
  tenant_id: string,
): Promise<TenantDetail> => {
  try {
    const response = await axiosInstance.get(
      `/users/tenant-list/${tenant_id}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200) {
      throw new Error("Error Fetching Users");
    }

    return response.data;
  } catch (error: any) {
    // Re-throw the error so React Query's `isError` and `error` states work correctly.
    throw new Error(
      error.response?.data?.message || "Error Fetching Tenant Details",
    );
  }
};

export const getTenantAndPropertyInfo = async (params?: UserFilter) => {
  try {
    const response = await axiosInstance.get("/users/tenant-property", {
      headers: {
        "Content-Type": "application/json",
      },
      params, // ✅ pass query params
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Tenant Property Info");
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

export const getAdminDashboardAnalytics = async () => {
  try {
    const response = await axiosInstance.get("properties/admin/dashboard", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Dashbaord Analytics");
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

export const forgotPassword = async (data: any) => {
  try {
    const response = await axiosInstance.post("/users/forgot-password", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
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

export const validateOtp = async (data: any) => {
  try {
    const response = await axiosInstance.post("/users/validate-otp", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
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

export const resetPassword = async (data: any) => {
  try {
    const response = await axiosInstance.post("/users/reset-password", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
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

export const createUser = async (data: any) => {
  try {
    const response = await axiosInstance.post("/users", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
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

export const updateUser = async (data: any, userId?: string) => {
  try {
    // If userId is provided, use it; otherwise try to get it from localStorage or data
    let targetUserId = userId || data.id;

    if (!targetUserId) {
      const storedUser = localStorage.getItem("propertyKraftUser");
      if (storedUser) {
        try {
          targetUserId = JSON.parse(storedUser).id;
        } catch (e) {
          console.error("Failed to parse stored user:", e);
        }
      }
    }

    if (!targetUserId) {
      throw new Error("User ID is required for updating user data");
    }

    console.log("Updating user:", targetUserId, "with data:", data);

    const response = await axiosInstance.put(`/users/${targetUserId}`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Update response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Update user error:", error);
    console.error("Error response:", error?.response?.data);

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
    } else if (error?.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
};

export const createUserKyc = async (data: any, user_id: string) => {
  try {
    const response = await axiosInstance.post(
      `/users/complete-kyc/${user_id}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
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

export const assignCollaborator = async (data: any) => {
  try {
    const response = await axiosInstance.post(
      `/users/assign-collaborator`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    //
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

/**
 *
 * @returns list of team members for currently logged-in landlords
 */
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const response = await axiosInstance.get<TeamMember[]>(
      `/users/team-members`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    //    return response.data
    return response.data;
  } catch (error: any) {
    // Try to extract a useful message
    let errorMessage = "Failed to fetch team members";

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

export const deleteTeamMember = async (
  id: string,
): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(
    "/users/team-members/" + id,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
};

export const getWaitlist = async () => {
  try {
    const response = await axiosInstance.get("/users/waitlist", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Waitlist");
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

export const getLandlords = async () => {
  try {
    const response = await axiosInstance.get("/users/landlord", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      throw new Error("Error Fetching Waitlist");
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

export const attachTenantFromKyc = async (data: {
  kycApplicationId: string;
  propertyId: string;
  rentAmount: number;
  rentFrequency: string;
  tenancyStartDate: string;
  rentDueDate: string;
  serviceCharge?: number;
  outstandingBalance?: number;
  outstandingBalanceReason?: string;
}) => {
  try {
    const response = await axiosInstance.post(
      "/users/attach-tenant-from-kyc",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Error attaching tenant from KYC");
    }

    return response.data;
  } catch (error: any) {
    let errorMessage = "An error occurred while attaching tenant";

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

export const uploadBrandingAsset = async (
  file: File,
  assetType: "letterhead" | "signature",
): Promise<{ url: string; assetType: string }> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", assetType);

    const response = await axiosInstance.post(
      "/users/upload-branding-asset",
      formData,
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Error uploading ${assetType}`);
    }

    return response.data;
  } catch (error: any) {
    let errorMessage = `An error occurred while uploading ${assetType}`;

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

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  try {
    const response = await axiosInstance.put("/users/change-password", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    let errorMessage = "An error occurred while changing password";

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
