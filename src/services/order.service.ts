import { API_BASE_URL } from "@/api";
import axiosInstance from "@/lib/axios";
import type {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  PaginationParams,
  PaginatedOrdersResponse,
  OrderStatus,
  OrderDetailResponse,
} from "@/types/order.type";
import type { ApiResponse } from "@/types/common.type";

// Get all orders
export const getAllOrders = async (
  params?: PaginationParams
): Promise<Order[]> => {
  const response = await axiosInstance.get<ApiResponse<Order[]>>(
    API_BASE_URL + "/orders",
    {
      params,
    }
  );
  return response.data.data || [];
};

// Get order by ID
export const getOrderById = async (id: number | string): Promise<Order> => {
  const response = await axiosInstance.get<OrderDetailResponse>(
    API_BASE_URL + `/orders/${id}`
  );

  // Transform the response to match our Order interface
  const orderData = response.data;
  const order: Order = {
    ...orderData.order,
    cartProducts: orderData.cartProducts,
    total: orderData.total,
  };

  return order;
};

// Get paginated orders
export const getPaginatedOrders = async (
  params: PaginationParams
): Promise<PaginatedOrdersResponse> => {
  const response = await axiosInstance.get<PaginatedOrdersResponse>(
    API_BASE_URL + "/orders/paginated",
    {
      params,
    }
  );
  return {
    orders: response.data.orders || [],
    total: response.data.total || 0,
    page: response.data.page || 1,
    limit: response.data.limit || 10,
    totalPages: response.data.totalPages || 1,
  };
};

// Search orders
export const searchOrders = async (query: string): Promise<Order[]> => {
  const response = await axiosInstance.get<ApiResponse<Order[]>>(
    API_BASE_URL + "/orders",
    {
      params: { search: query },
    }
  );
  return response.data.data || [];
};

// Create order
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<Order> => {
  const response = await axiosInstance.post<ApiResponse<Order>>(
    API_BASE_URL + "/orders",
    orderData
  );
  return response.data.data;
};

// Update order
export const updateOrder = async (
  id: number | string,
  orderData: UpdateOrderRequest
): Promise<{ [key: string]: string }> => {
  // Create FormData to match the API's expected format
  const formData = new FormData();

  // Add basic order fields (add all fields regardless of value)
  if (orderData.discount !== undefined) {
    const discountNumber = Number(orderData.discount ?? 0);
    formData.append(
      "discount",
      String(Number.isFinite(discountNumber) ? discountNumber : 0)
    );
  }
  if (orderData.paid !== undefined) {
    const paidNumber = Number(orderData.paid ?? 0);
    formData.append(
      "totalPaid",
      String(Number.isFinite(paidNumber) ? paidNumber : 0)
    );
  }
  if (orderData.phone !== undefined) {
    formData.append("phone", orderData.phone || "");
  }
  if (orderData.address !== undefined) {
    formData.append("address", orderData.address || "");
  }
  if (orderData.RepName !== undefined) {
    formData.append("RepName", orderData.RepName || "");
  }
  if (orderData.doctorId !== undefined) {
    formData.append("doctorId", orderData.doctorId?.toString() || "");
  }
  if (orderData.status !== undefined) {
    formData.append("status", orderData.status || "");
  }

  // Add products array in the expected format: products[0][id], products[0][quantity], etc.
  if (orderData.products && orderData.products.length > 0) {
    orderData.products.forEach((product, index) => {
      formData.append(`products[${index}][id]`, product.id.toString());
      formData.append(
        `products[${index}][quantity]`,
        product.quantity?.toString() || ""
      );
      formData.append(`products[${index}][notes]`, product.notes || "");
      formData.append(
        `products[${index}][price]`,
        product.price?.toString() || ""
      );
    });
  }

  // Add the _method parameter for PUT override
  formData.append("_method", "PUT");

  const response = await axiosInstance.post(
    API_BASE_URL + `/orders/${id}/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// Update order status
export const updateOrderStatus = async (
  id: number | string,
  status: OrderStatus
): Promise<Order> => {
  const response = await axiosInstance.patch<ApiResponse<Order>>(
    API_BASE_URL + `/orders/${id}/status`,
    { status }
  );
  return response.data.data;
};

// Delete order
export const deleteOrder = async (id: number | string): Promise<void> => {
  await axiosInstance.delete(API_BASE_URL + `/orders/${id}`);
};

// Get orders by status
export const getOrdersByStatus = async (
  status: OrderStatus,
  params?: PaginationParams
): Promise<Order[]> => {
  const response = await axiosInstance.get<ApiResponse<Order[]>>(
    API_BASE_URL + "/orders",
    {
      params: { ...params, status },
    }
  );
  return response.data.data || [];
};
