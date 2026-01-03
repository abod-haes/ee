export interface Doctor {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  specialization?: string;
  isActive?: number;
  withPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDoctorRequest {
  name: string;
  address: string;
  phone: string;
  email?: string;
  specialization?: string;
  isActive?: number;
  withPrice?: number;
  userName?: string;
  password?: string;
}

export interface UpdateDoctorRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  specialization?: string;
  isActive?: number;
  withPrice?: number;
}

export interface DoctorResponse {
  success: boolean;
  message: string;
  data?: Doctor | Doctor[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedDoctorsResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
