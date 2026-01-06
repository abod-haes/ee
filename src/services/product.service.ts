import { API_BASE_URL } from "@/api";
import axiosInstance from "@/lib/axios";
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  PaginationParams,
} from "@/types/product.type";

// Get all products
export const getAllProducts = async (
  params?: PaginationParams
): Promise<Product[]> => {
  const response = await axiosInstance.get(API_BASE_URL + "/products", {
    params,
  });
  return response.data.data || [];
};

// Get products brief (id, name, price, barcode)
export interface ProductBrief {
  id: number;
  name: string;
  price: string;
  slug: string | null;
  barcode: string | null;
}

export const getProductsBrief = async (): Promise<ProductBrief[]> => {
  const response = await axiosInstance.get<ProductBrief[]>(
    API_BASE_URL + "/products/all/brief"
  );
  return response.data || [];
};

// Get product by ID
export const getProductById = async (id: number | string): Promise<Product> => {
  const response = await axiosInstance.get(API_BASE_URL + `/products/${id}`);
  return response.data.data;
};

// Get product by slug
export const getProductBySlug = async (slug: string): Promise<Product> => {
  const response = await axiosInstance.get(API_BASE_URL + `/products/${slug}`);
  return response.data.data;
};

// Get paginated products
export const getPaginatedProducts = async (
  params: PaginationParams & { text?: string; categoryId?: number | string }
): Promise<{
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const response = await axiosInstance.get(API_BASE_URL + "/products/search", {
    params,
  });
  const payload = response.data;
  // Support both simple and Laravel-like meta responses
  const data = payload?.data ?? [];
  const meta = payload?.meta ?? {};
  const total = meta?.total ?? payload?.total ?? data.length ?? 0;
  const currentPage = meta?.current_page ?? payload?.page ?? 1;
  const perPage = meta?.per_page ?? payload?.limit ?? params?.limit ?? 10;
  const totalPages =
    meta?.last_page ??
    payload?.totalPages ??
    Math.max(1, Math.ceil(total / perPage));

  return {
    products: data,
    total: total,
    page: currentPage,
    limit: perPage,
    totalPages,
  };
};

// Search products
export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await axiosInstance.get(API_BASE_URL + "/products", {
    params: { search: query },
  });
  return response.data.data || [];
};

// Create product
export const createProduct = async (
  productData: CreateProductRequest
): Promise<Product> => {
  const formData = new FormData();

  // Add basic fields (matching the API payload structure)
  formData.append("name", productData.name);
  formData.append("categoryId", productData?.categoryId?.toString() || "");
  formData.append("description", productData.description || "");
  formData.append("note", productData.note || "");
  formData.append("price", productData.price);
  formData.append("netPrice", productData.netPrice);
  formData.append("priceType", productData.priceType.toString());
  formData.append("source", productData.source || "");
  formData.append("store", productData.store || "");
  formData.append("manufacturer", productData.manufacturer || "");
  formData.append("quantity", productData.quantity.toString());
  formData.append("quantityType", productData.quantityType.toString());
  formData.append("storagePlace", productData.storagePlace || "");
  formData.append("storageLocation", productData.storageLocation || "");
  formData.append("minimum", productData.minimum?.toString() || "0");
  formData.append("productionDate", productData.productionDate);
  formData.append("medicalNecessity", productData.medicalNecessity || "");
  if (productData.barcode) {
    formData.append("barcode", productData.barcode);
  }

  // Add attributes in the correct format: attributes[0][value] and attributes[0][categoryAttributeId]
  if (productData.attributes && productData.attributes.length > 0) {
    productData.attributes.forEach((attr, index) => {
      formData.append(`attributes[${index}][value]`, attr.value);
      formData.append(
        `attributes[${index}][categoryAttributeId]`,
        attr.categoryAttributeId.toString()
      );
    });
  }

  // Add images in the correct format: images[0], images[1], etc.
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });
  }

  const response = await axiosInstance.post(
    API_BASE_URL + "/products",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data;
};

// Update product
export const updateProduct = async (
  id: number | string,
  productData: UpdateProductRequest
): Promise<Product> => {
  const formData = new FormData();

  // Add fields that are provided (matching the API payload structure)
  if (productData.name) formData.append("name", productData.name);
  if (productData.price) formData.append("price", productData.price);
  if (productData.netPrice) formData.append("netPrice", productData.netPrice);
  if (productData.priceType !== undefined)
    formData.append("priceType", productData.priceType.toString());
  if (productData.note) formData.append("note", productData.note);
  if (productData.description)
    formData.append("description", productData.description);
  if (productData.source) formData.append("source", productData.source);
  if (productData.store) formData.append("store", productData.store);
  if (productData.manufacturer)
    formData.append("manufacturer", productData.manufacturer);
  if (productData.quantity !== undefined)
    formData.append("quantity", productData.quantity.toString());
  if (productData.quantityType !== undefined)
    formData.append("quantityType", productData.quantityType.toString());
  if (productData.storagePlace)
    formData.append("storagePlace", productData.storagePlace);
  if (productData.storageLocation)
    formData.append("storageLocation", productData.storageLocation);
  if (productData.minimum !== undefined)
    formData.append("minimum", productData.minimum.toString());
  if (productData.productionDate)
    formData.append("productionDate", productData.productionDate);
  if (productData.medicalNecessity)
    formData.append("medicalNecessity", productData.medicalNecessity);
  if (productData.categoryId)
    formData.append("categoryId", productData.categoryId.toString());
  if (productData.barcode) {
    formData.append("barcode", productData.barcode);
  }

  // Add attributes in the correct format: attributes[0][value] and attributes[0][categoryAttributeId]
  if (productData.attributes && productData.attributes.length > 0) {
    productData.attributes.forEach((attr, index) => {
      formData.append(`attributes[${index}][value]`, attr.value);
      formData.append(
        `attributes[${index}][categoryAttributeId]`,
        attr.categoryAttributeId.toString()
      );
    });
  }

  // Add images in the correct format: images[0], images[1], etc.
  if (productData.images && productData.images.length > 0) {
    productData.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });
  }

  const response = await axiosInstance.post(
    API_BASE_URL + `/products/${id}`,
    {
      ...productData,
      _method: "PUT",
    },
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data;
};

// Delete product
export const deleteProduct = async (id: number | string): Promise<void> => {
  await axiosInstance.delete(API_BASE_URL + `/products/${id}`);
};
