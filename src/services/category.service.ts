import axiosInstance from "@/lib/axios";
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginationParams,
  PaginatedCategoriesResponse,
} from "@/types/category.type";
import { API_BASE_URL } from "@/api";
import type { ApiResponse } from "@/types/common.type";

// Get all categories
export const getAllCategories = async (
  params?: PaginationParams & { withChildren?: boolean }
): Promise<Category[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Category[]>>(
    `${API_BASE_URL}/categories`,
    {
      params,
    }
  );
  return data.data;
};

// Get category by ID
export const getCategoryById = async (
  id: number | string
): Promise<Category> => {
  const { data } = await axiosInstance.get<ApiResponse<Category>>(
    `${API_BASE_URL}/categories/${id}`
  );
  return data.data;
};

// Create category
export const createCategory = async (
  categoryData: CreateCategoryRequest
): Promise<Category> => {
  const formData = new FormData();
  formData.append("name", categoryData.name);

  // Add categoryId if provided
  if (categoryData.categoryId) {
    formData.append("categoryId", categoryData.categoryId.toString());
  }

  // Add attributes as array with name and id properties
  categoryData.attributes.forEach((attr, index) => {
    formData.append(`attributes[${index}][name]`, attr);
    formData.append(`attributes[${index}][id]`, "");
  });

  // Add image if provided
  if (categoryData.image) {
    formData.append("Image", categoryData.image);
  }

  const { data } = await axiosInstance.post<ApiResponse<Category>>(
    `${API_BASE_URL}/categories`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data.data;
};

// Update category
export const updateCategory = async (
  id: number | string,
  categoryData: UpdateCategoryRequest
): Promise<Category> => {
  const formData = new FormData();

  if (categoryData.name) {
    formData.append("name", categoryData.name);
  }

  // Add categoryId if provided
  if (categoryData.categoryId !== undefined) {
    formData.append("categoryId", categoryData.categoryId?.toString() || "");
  }

  // Add attributes as array with name and id properties if provided
  if (categoryData.attributes && categoryData.attributes.length > 0) {
    categoryData.attributes.forEach((attr, index) => {
      // Handle both string (name only) and object (with id and name)
      if (typeof attr === "string") {
        formData.append(`attributes[${index}][name]`, attr);
        formData.append(`attributes[${index}][id]`, "");
      } else if (attr && typeof attr === "object" && "name" in attr) {
        formData.append(`attributes[${index}][name]`, attr.name);
        formData.append(`attributes[${index}][id]`, attr.id?.toString() || "");
      }
    });
  }

  // Handle deleteImage flag
  if (categoryData.deleteImage) {
    formData.append("deleteImage", "true");
  }

  // Add image if provided
  if (categoryData.image) {
    formData.append("Image", categoryData.image);
  }

  formData.append("_method", "PUT");

  const { data } = await axiosInstance.post<ApiResponse<Category>>(
    `${API_BASE_URL}/categories/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data.data;
};

// Delete category
export const deleteCategory = async (id: number | string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(
    `${API_BASE_URL}/categories/${id}`
  );
};

// Search categories
export const searchCategories = async (query: string): Promise<Category[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Category[]>>(
    `${API_BASE_URL}/categories/search`,
    {
      params: { q: query },
    }
  );
  return data.data;
};

// Get paginated categories
export const getPaginatedCategories = async (
  params: PaginationParams
): Promise<PaginatedCategoriesResponse> => {
  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedCategoriesResponse>
  >(`${API_BASE_URL}/categories/paginated`, {
    params,
  });
  return data.data;
};
