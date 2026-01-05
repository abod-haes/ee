export interface User {
  id: number;
  fullName: string;
  email: string;
  userName: string;
  UserType: string;
  isActive: number;
  withPrice?: number;
  password?: string;
  createdAt?: string;
  address?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  fullName: string;
  email?: string;
  userName: string;
  password: string;
  userType?: number;
  isActive?: number;
  doctorId?: number;
  withPrice?: number;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  userName?: string;
  password?: string;
  UserType?: string;
  isActive?: number;
  userType?: number;
  withPrice?: number;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data?: User | User[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
