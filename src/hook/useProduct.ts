import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getPaginatedProducts,
  searchProducts,
} from "@/services/product.service";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  PaginationParams,
} from "@/types/product.type";
import toast from "react-hot-toast";

// Query keys
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params?: PaginationParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  search: (query: string) => [...productKeys.all, "search", query] as const,
  paginated: (params: PaginationParams) =>
    [...productKeys.all, "paginated", params] as const,
};

// Get all products hook
export const useProducts = (params?: PaginationParams) => {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getAllProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get product by ID hook
export const useProduct = (id: number | string) => {
  return useQuery({
    queryKey: productKeys.detail(id.toString()),
    queryFn: () => getProductById(id),
    enabled: !!id,
  });
};

// Get product by slug hook
export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
  });
};

// Get paginated products hook
export const usePaginatedProducts = (
  params: PaginationParams & { text?: string; categoryId?: number | string }
) => {
  return useQuery({
    queryKey: productKeys.paginated(params),
    queryFn: () => getPaginatedProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Search products hook
export const useSearchProducts = (query: string) => {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: () => searchProducts(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: CreateProductRequest) =>
      createProduct(productData),
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("تم إنشاء المنتج بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 409) {
        toast.error("المنتج موجود بالفعل");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في إنشاء المنتج، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      productData,
    }: {
      id: number | string;
      productData: UpdateProductRequest;
    }) => updateProduct(id, productData),
    onSuccess: (data: Product, variables) => {
      // Update the specific product in cache
      queryClient.setQueryData(
        productKeys.detail(variables.id.toString()),
        data
      );
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("تم تحديث المنتج بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 409) {
        toast.error("المنتج موجود بالفعل");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في تحديث المنتج، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({
        queryKey: productKeys.detail(id.toString()),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 403) {
        toast.error("لا يمكن حذف هذا المنتج");
      } else if (axiosError.response?.status === 405) {
        toast.error("طريقة الحذف غير مسموحة لهذا المنتج");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في حذف المنتج، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Main useProduct hook that combines all functionality
export const useProductManagement = () => {
  const productsQuery = useProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  return {
    // Queries
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    refetch: productsQuery.refetch,

    // Mutations
    createProduct: createProductMutation.mutate,
    updateProduct: updateProductMutation.mutate,
    deleteProduct: deleteProductMutation.mutate,

    // Loading states
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,

    // Error states
    createError: createProductMutation.error,
    updateError: updateProductMutation.error,
    deleteError: deleteProductMutation.error,

    // Reset functions
    resetCreateError: createProductMutation.reset,
    resetUpdateError: updateProductMutation.reset,
    resetDeleteError: deleteProductMutation.reset,
  };
};
