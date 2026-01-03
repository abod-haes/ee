export interface ProductAttribute {
  value: string;
  key: string;
  categoryAttributeId: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  image: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  netPrice: string;
  priceType: number;
  note: string;
  description: string;
  source: string;
  store: string;
  manufacturer: string;
  quantity: number;
  quantityType: number;
  storagePlace: string;
  storageLocation: string;
  minimum: number;
  productionDate: string;
  medicalNecessity: string;
  images: string[];
  categoryId: number;
  category: ProductCategory;
  attributes: ProductAttribute[];
}

export interface CreateProductRequest {
  name: string;
  price: string;
  netPrice: string;
  priceType: number;
  note?: string;
  description?: string;
  source?: string;
  store?: string;
  manufacturer?: string;
  quantity: number;
  quantityType: number;
  storagePlace?: string;
  storageLocation?: string;
  minimum?: number;
  productionDate: string;
  medicalNecessity?: string;
  categoryId?: number;
  attributes?: Array<{
    value: string;
    categoryAttributeId: number;
  }>;
  images?: File[];
}

export interface UpdateProductRequest {
  name?: string;
  price?: string;
  netPrice?: string;
  priceType?: number;
  note?: string;
  description?: string;
  source?: string;
  store?: string;
  manufacturer?: string;
  quantity?: number;
  quantityType?: number;
  storagePlace?: string;
  storageLocation?: string;
  minimum?: number;
  productionDate?: string;
  medicalNecessity?: string;
  categoryId?: number;
  attributes?: Array<{
    value: string;
    categoryAttributeId: number;
  }>;
  images?: File[];
}

export interface ProductResponse {
  data: Product[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
