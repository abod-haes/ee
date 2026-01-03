import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getPaginatedOrders,
  searchOrders,
  getOrdersByStatus,
} from "@/services/order.service";
import type {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  PaginationParams,
  OrderStatus,
} from "@/types/order.type";
import toast from "react-hot-toast";

// Query keys
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  search: (query: string) => [...orderKeys.all, "search", query] as const,
  paginated: (params: PaginationParams) =>
    [...orderKeys.all, "paginated", params] as const,
  byStatus: (status: OrderStatus, params?: PaginationParams) =>
    [...orderKeys.all, "status", status, params] as const,
};

// Get all orders hook
export const useOrders = (params?: PaginationParams) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getAllOrders(params),
    staleTime: 0,
    gcTime: 0, // Previously cacheTime
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

// Live orders hook (polls every second)
export const useOrdersLive = (params?: PaginationParams) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getAllOrders(params),
    staleTime: 0,
    gcTime: 0, // Previously cacheTime
    refetchInterval: 5000,
    refetchOnWindowFocus: "always",
    refetchOnMount: true,
  });
};

// Get order by ID hook
export const useOrder = (id: number | string) => {
  return useQuery({
    queryKey: orderKeys.detail(id.toString()),
    queryFn: () => getOrderById(id),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0, // Previously cacheTime
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

// Get paginated orders hook
export const usePaginatedOrders = (params: PaginationParams) => {
  return useQuery({
    queryKey: orderKeys.paginated(params),
    queryFn: () => getPaginatedOrders(params),
    staleTime: 0,
    gcTime: 0, // Previously cacheTime
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

// Search orders hook
export const useSearchOrders = (query: string) => {
  return useQuery({
    queryKey: orderKeys.search(query),
    queryFn: () => searchOrders(query),
    enabled: !!query && query.length > 2,
    staleTime: 0,
    gcTime: 0, // Previously cacheTime
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

// Get orders by status hook
export const useOrdersByStatus = (
  status: OrderStatus,
  params?: PaginationParams
) => {
  return useQuery({
    queryKey: orderKeys.byStatus(status, params),
    queryFn: () => getOrdersByStatus(status, params),
    staleTime: 0,
    gcTime: 0, // Previously cacheTime
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => createOrder(orderData),
    onSuccess: () => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success("تم إنشاء الطلب بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في إنشاء الطلب، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Update order mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      orderData,
    }: {
      id: number | string;
      orderData: UpdateOrderRequest;
    }) => updateOrder(id, orderData),
    onSuccess: (_data, variables) => {
      // Invalidate the specific order detail cache to force refetch
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.id.toString()),
      });
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success("تم تحديث الطلب بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في تحديث الطلب، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Update order status mutation
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number | string;
      status: OrderStatus;
    }) => updateOrderStatus(id, status),
    onSuccess: (data: Order, variables) => {
      // Update the specific order in cache
      queryClient.setQueryData(orderKeys.detail(variables.id.toString()), data);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success("تم تحديث حالة الطلب بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في تحديث حالة الطلب، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Delete order mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteOrder(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({
        queryKey: orderKeys.detail(id.toString()),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success("تم حذف الطلب بنجاح");
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.status === 403) {
        toast.error("لا يمكن حذف هذا الطلب");
      } else if (axiosError.response?.status === 405) {
        toast.error("طريقة الحذف غير مسموحة لهذا الطلب");
      } else if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في حذف الطلب، يرجى المحاولة مرة أخرى");
      }
    },
  });
};

// Main useOrder hook that combines all functionality
export const useOrderManagement = () => {
  const ordersQuery = useOrders();
  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const deleteOrderMutation = useDeleteOrder();

  return {
    // Queries
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,

    // Mutations
    createOrder: createOrderMutation.mutate,
    updateOrder: updateOrderMutation.mutate,
    updateOrderStatus: updateOrderStatusMutation.mutate,
    deleteOrder: deleteOrderMutation.mutate,

    // Loading states
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderMutation.isPending,
    isUpdatingStatus: updateOrderStatusMutation.isPending,
    isDeleting: deleteOrderMutation.isPending,

    // Error states
    createError: createOrderMutation.error,
    updateError: updateOrderMutation.error,
    updateStatusError: updateOrderStatusMutation.error,
    deleteError: deleteOrderMutation.error,

    // Reset functions
    resetCreateError: createOrderMutation.reset,
    resetUpdateError: updateOrderMutation.reset,
    resetUpdateStatusError: updateOrderStatusMutation.reset,
    resetDeleteError: deleteOrderMutation.reset,
  };
};
