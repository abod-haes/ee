import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getPaginatedDoctors,
  searchDoctors,
  toggleDoctorStatus,
} from "@/services/doctor.service";
import type {
  Doctor,
  CreateDoctorRequest,
  UpdateDoctorRequest,
  PaginationParams,
} from "@/types/doctor.type";
import toast from "react-hot-toast";

// Query keys
export const doctorKeys = {
  all: ["doctors"] as const,
  lists: () => [...doctorKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...doctorKeys.lists(), params] as const,
  details: () => [...doctorKeys.all, "detail"] as const,
  detail: (id: string) => [...doctorKeys.details(), id] as const,
  search: (query: string) => [...doctorKeys.all, "search", query] as const,
  paginated: (params: PaginationParams) =>
    [...doctorKeys.all, "paginated", params] as const,
};

// Get all doctors hook
export const useDoctors = (params?: PaginationParams) => {
  return useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: () => getAllDoctors(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get doctor by ID hook
export const useDoctor = (id: number | string) => {
  return useQuery({
    queryKey: doctorKeys.detail(id.toString()),
    queryFn: () => getDoctorById(id),
    enabled: !!id,
  });
};

// Get paginated doctors hook
export const usePaginatedDoctors = (params: PaginationParams) => {
  return useQuery({
    queryKey: doctorKeys.paginated(params),
    queryFn: () => getPaginatedDoctors(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Search doctors hook
export const useSearchDoctors = (query: string) => {
  return useQuery({
    queryKey: doctorKeys.search(query),
    queryFn: () => searchDoctors(query),
    enabled: !!query,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create doctor mutation
export const useCreateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (doctorData: CreateDoctorRequest) => createDoctor(doctorData),
    onSuccess: () => {
      // Invalidate and refetch doctors list
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
      toast.success("تم إنشاء الطبيب بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 409) {
        toast.error("الطبيب موجود بالفعل");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في إنشاء الطبيب، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Update doctor mutation
export const useUpdateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      doctorData,
    }: {
      id: number | string;
      doctorData: UpdateDoctorRequest;
    }) => updateDoctor(id, doctorData),
    onSuccess: (data: Doctor, variables) => {
      // Update the specific doctor in cache
      queryClient.setQueryData(
        doctorKeys.detail(variables.id.toString()),
        data
      );
      // Invalidate doctors list
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
      toast.success("تم تحديث الطبيب بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 409) {
        toast.error("الطبيب موجود بالفعل");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في تحديث الطبيب، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Delete doctor mutation
export const useDeleteDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteDoctor(id),
    onSuccess: (_, id) => {
      // Remove doctor from cache
      queryClient.removeQueries({ queryKey: doctorKeys.detail(id.toString()) });
      // Invalidate doctors list
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
      toast.success("تم حذف الطبيب بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 403) {
        toast.error("لا يمكن حذف هذا الطبيب");
      } else if (axiosError.response?.status === 405) {
        toast.error("طريقة الحذف غير مسموحة لهذا الطبيب");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في حذف الطبيب، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Toggle doctor status mutation
export const useToggleDoctorStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => toggleDoctorStatus(id),
    onSuccess: (data: Doctor, id) => {
      // Update doctor in cache
      queryClient.setQueryData(doctorKeys.detail(id.toString()), data);
      // Invalidate doctors list
      queryClient.invalidateQueries({ queryKey: doctorKeys.lists() });
      toast.success(
        `تم ${data.isActive ? "تفعيل" : "إلغاء تفعيل"} الطبيب بنجاح`
      );
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في تغيير حالة الطبيب، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Main useDoctor hook that combines all functionality
export const useDoctorManagement = () => {
  const doctorsQuery = useDoctors();
  const createDoctorMutation = useCreateDoctor();
  const updateDoctorMutation = useUpdateDoctor();
  const deleteDoctorMutation = useDeleteDoctor();
  const toggleStatusMutation = useToggleDoctorStatus();

  return {
    // Queries
    doctors: doctorsQuery.data || [],
    isLoading: doctorsQuery.isLoading,
    error: doctorsQuery.error,
    refetch: doctorsQuery.refetch,

    // Mutations
    createDoctor: createDoctorMutation.mutate,
    updateDoctor: updateDoctorMutation.mutate,
    deleteDoctor: deleteDoctorMutation.mutate,
    toggleDoctorStatus: toggleStatusMutation.mutate,

    // Loading states
    isCreating: createDoctorMutation.isPending,
    isUpdating: updateDoctorMutation.isPending,
    isDeleting: deleteDoctorMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,

    // Error states
    createError: createDoctorMutation.error,
    updateError: updateDoctorMutation.error,
    deleteError: deleteDoctorMutation.error,
    toggleStatusError: toggleStatusMutation.error,

    // Reset functions
    resetCreateError: createDoctorMutation.reset,
    resetUpdateError: updateDoctorMutation.reset,
    resetDeleteError: deleteDoctorMutation.reset,
    resetToggleStatusError: toggleStatusMutation.reset,
  };
};
