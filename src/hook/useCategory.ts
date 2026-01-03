import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getPaginatedCategories,
  searchCategories,
} from "@/services/category.service";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginationParams,
} from "@/types/category.type";
import toast from "react-hot-toast";

// Query keys
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params?: PaginationParams) =>
    [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  search: (query: string) => [...categoryKeys.all, "search", query] as const,
  paginated: (params: PaginationParams) =>
    [...categoryKeys.all, "paginated", params] as const,
};

// Get all categories hook
export const useCategories = (
  params?: PaginationParams & { withChildren?: boolean }
) => {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () =>
      getAllCategories({
        ...params,
        withChildren: params?.withChildren ?? false,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get category by ID hook
export const useCategory = (id: number | string) => {
  return useQuery({
    queryKey: categoryKeys.detail(id.toString()),
    queryFn: () => getCategoryById(id),
    enabled: !!id,
  });
};

// Get paginated categories hook
export const usePaginatedCategories = (params: PaginationParams) => {
  return useQuery({
    queryKey: categoryKeys.paginated(params),
    queryFn: () => getPaginatedCategories(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Search categories hook
export const useSearchCategories = (query: string) => {
  return useQuery({
    queryKey: categoryKeys.search(query),
    queryFn: () => searchCategories(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create category mutation
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryData: CreateCategoryRequest) =>
      createCategory(categoryData),
    onSuccess: () => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success("تم إنشاء الصنف بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 409) {
        toast.error("الصنف موجود بالفعل");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في إنشاء الصنف، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Update category mutation
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      categoryData,
    }: {
      id: number | string;
      categoryData: UpdateCategoryRequest;
    }) => updateCategory(id, categoryData),
    onSuccess: (data: Category, variables) => {
      // Update the specific category in cache
      queryClient.setQueryData(
        categoryKeys.detail(variables.id.toString()),
        data
      );
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success("تم تحديث الصنف بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 409) {
        toast.error("الصنف موجود بالفعل");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في تحديث الصنف، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Delete category mutation
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteCategory(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({
        queryKey: categoryKeys.detail(id.toString()),
      });
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success("تم حذف الصنف بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 403) {
        toast.error("لا يمكن حذف هذا الصنف");
      } else if (axiosError.response?.status === 405) {
        toast.error("طريقة الحذف غير مسموحة لهذا الصنف");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في حذف الصنف، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Main useCategory hook that combines all functionality
export const useCategoryManagement = ({
  withChildren = false,
}: {
  withChildren?: boolean;
}) => {
  const categoriesQuery = useCategories({ withChildren });
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  return {
    // Queries
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    refetch: categoriesQuery.refetch,

    // Mutations
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,

    // Loading states
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,

    // Error states
    createError: createCategoryMutation.error,
    updateError: updateCategoryMutation.error,
    deleteError: deleteCategoryMutation.error,

    // Reset functions
    resetCreateError: createCategoryMutation.reset,
    resetUpdateError: updateCategoryMutation.reset,
    resetDeleteError: deleteCategoryMutation.reset,
  };
};
