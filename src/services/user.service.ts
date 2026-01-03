import axiosInstance from "@/lib/axios";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  PaginationParams,
  PaginatedUsersResponse,
} from "@/types/user.type";
import { API_BASE_URL } from "@/api";
import type { ApiResponse } from "@/types/common.type";

// Get all users
export const getAllUsers = async (
  params?: PaginationParams
): Promise<User[]> => {
  const { data } = await axiosInstance.get<ApiResponse<User[]>>(
    `${API_BASE_URL}/users`,
    {
      params,
    }
  );
  return data.data;
};

// Get current user
export const getMe = async (): Promise<User> => {
  try {
    const { data } = await axiosInstance.get<ApiResponse<User>>(
      `${API_BASE_URL}/users/self`
    );
    return data.data;
  } catch (error) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 401) {
      // ensure any residual auth is cleared and redirect replaced
      try {
        const { tokenUtils } = await import("@/lib/token-utils");
        tokenUtils.clearAuth();
      } catch {}
      if (typeof window !== "undefined") {
        window.location.replace("/sign-in");
      }
    }
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: number | string): Promise<User> => {
  const { data } = await axiosInstance.get<ApiResponse<User>>(
    `${API_BASE_URL}/users/${id}`
  );
  return data.data;
};

// Create new user
export const createUser = async (
  userData: CreateUserRequest
): Promise<User> => {
  const { data } = await axiosInstance.post<User>(
    `${API_BASE_URL}/users`,
    userData
  );
  return data;
};

// Update user
export const updateUser = async (
  id: number | string,
  userData: UpdateUserRequest
): Promise<User> => {
  const { data } = await axiosInstance.put<User>(
    `${API_BASE_URL}/users/${id}`,
    userData
  );
  return data;
};

// Delete user
export const deleteUser = async (id: number | string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(
    `${API_BASE_URL}/users/${id}`
  );
};

// Get paginated users
export const getPaginatedUsers = async (
  params: PaginationParams
): Promise<PaginatedUsersResponse> => {
  const { data } = await axiosInstance.get<PaginatedUsersResponse>(
    `${API_BASE_URL}/Users/paginated`,
    {
      params,
    }
  );
  return data;
};

// Change user status
export const changeUserStatus = async (
  id: number | string
): Promise<string> => {
  const { data } = await axiosInstance.post<string>(
    `${API_BASE_URL}/users/${id}/change-status`
  );
  return data;
};
