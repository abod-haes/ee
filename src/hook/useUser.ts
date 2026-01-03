import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPaginatedUsers,
  changeUserStatus,
  getMe,
} from "@/services/user.service";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  PaginationParams,
} from "@/types/user.type";
import toast from "react-hot-toast";
import { tokenUtils } from "@/lib/token-utils";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  search: (query: string) => [...userKeys.all, "search", query] as const,
  paginated: (params: PaginationParams) =>
    [...userKeys.all, "paginated", params] as const,
};

// Get all users hook
export const useUsers = (params?: PaginationParams) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getAllUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
export const useMe = () => {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async () => {
      try {
        return await getMe();
      } catch (error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          tokenUtils.clearAuth();
          if (typeof window !== "undefined") {
            window.location.replace("/sign-in");
          }
        }
        throw error;
      }
    },
    enabled: tokenUtils.getBearerToken() !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
// Get user by ID hook
export const useUser = (id: number | string) => {
  return useQuery({
    queryKey: userKeys.detail(id.toString()),
    queryFn: () => getUserById(id),
    enabled: !!id,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchOnMount: "always", // Always refetch when component mounts
  });
};

// Get paginated users hook
export const usePaginatedUsers = (params: PaginationParams) => {
  return useQuery({
    queryKey: userKeys.paginated(params),
    queryFn: () => getPaginatedUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserRequest) => createUser(userData),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("تم إنشاء المستخدم بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 409) {
        toast.error("اسم المستخدم أو البريد الإلكتروني موجود بالفعل");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في إنشاء المستخدم، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      userData,
    }: {
      id: number | string;
      userData: UpdateUserRequest;
    }) => updateUser(id, userData),
    onSuccess: (data: User, variables) => {
      // Update the specific user in cache
      queryClient.setQueryData(userKeys.detail(variables.id.toString()), data);
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("تم تحديث المستخدم بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 409) {
        toast.error("اسم المستخدم أو البريد الإلكتروني موجود بالفعل");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في تحديث المستخدم، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(id.toString()) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("تم حذف المستخدم بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 403) {
        toast.error("لا يمكن حذف هذا المستخدم");
      } else if (axiosError.response?.status === 405) {
        toast.error("طريقة الحذف غير مسموحة لهذا المستخدم");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في حذف المستخدم، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Change user status mutation
export const useChangeUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => changeUserStatus(id),
    onSuccess: () => {
      // Invalidate and refetch users list to get updated data
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.refetchQueries({ queryKey: userKeys.lists() });
      toast.success("تم تغيير حالة المستخدم بنجاح");
    },
    onError: (error: unknown) => {
      console.error("Change status error:", error);

      // Handle actual errors
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError?.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else if (axiosError?.message) {
        toast.error(axiosError.message);
      } else {
        toast.error("فشل في تغيير حالة المستخدم، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Main useUser hook that combines all functionality
export const useUserManagement = () => {
  const usersQuery = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const changeStatusMutation = useChangeUserStatus();

  return {
    // Queries
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,

    // Mutations
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    changeUserStatus: changeStatusMutation.mutate,

    // Loading states
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isChangingStatus: changeStatusMutation.isPending,

    // Error states
    createError: createUserMutation.error,
    updateError: updateUserMutation.error,
    deleteError: deleteUserMutation.error,
    changeStatusError: changeStatusMutation.error,

    // Reset functions
    resetCreateError: createUserMutation.reset,
    resetUpdateError: updateUserMutation.reset,
    resetDeleteError: deleteUserMutation.reset,
  };
};
