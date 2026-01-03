export interface CategoryAttribute {
  id: number;
  name: string;
  categoryId: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  attributes: CategoryAttribute[];
  categoryId?: number | null;
  children?: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  attributes: string[];
  image?: File;
  categoryId?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  attributes?: string[] | Array<{ id: string | number; name: string }>;
  categoryId?: number;
  image?: File;
  deleteImage?: boolean;
}

export interface CategoryResponse {
  data: Category[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedCategoriesResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
