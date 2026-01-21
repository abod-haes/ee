import type { Product } from "./product.type";

export interface Doctor {
  id: number;
  name: string;
  phone: string;
  address: string;
  slug: string;
}

export interface CartProduct {
  id: number;
  quantity: number;
  notes?: string;
  productPrice: number;
  productId: number;
  total: number;
  product: Product | null;
}

export interface Order {
  id: number;
  phone: string;
  address: string | null;
  status: OrderStatus;
  paid: number;
  discount: number;
  products: Product[];
  RepName: string | null;
  userType: string;
  doctorId: number;
  doctor: Doctor | null;
  cartProducts?: CartProduct[];
  createdAt?: string;
  date?: string;
  totalPaid: number;
  updatedAt?: string;
  rest: number;
  total: number;
}

export interface OrderDetailResponse {
  order: Order;
  cartProducts: CartProduct[];
  total: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "paid"
  | "half-paid"
  | "unpaid";

export interface CreateOrderRequest {
  phone: string;
  address: string;
  RepName: string;
  doctorId: number;
  discount?: string;
  paid?: number;
}

export interface UpdateCartProductRequest {
  id: number;
  quantity?: number | null;
  notes?: string | null;
  price?: number | null;
}

export interface UpdateOrderRequest {
  phone?: string | null;
  address?: string | null;
  status?: OrderStatus | null;
  RepName?: string | null;
  doctorId?: number | null;
  discount?: number | null;
  paid?: number | null;
  products?: UpdateCartProductRequest[];
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data?: Order | Order[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: OrderStatus;
  // Extended filters supported by API
  doctorId?: number;
  userId?: number; // Rep/User id
  productId?: number;
  date?: string; // ISO date (YYYY-MM-DD)
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "في الانتظار",
  confirmed: "مؤكد",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  paid: "مدفوع",
  "half-paid": "مدفوع جزئيًا",
  unpaid: "غير مدفوع",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  "half-paid": "bg-amber-100 text-amber-800",
  unpaid: "bg-red-500 text-white",
};
