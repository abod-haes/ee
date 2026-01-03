export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    userName: string;
    isActive: number;
    UserType: string;
  };
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  userName: string;
  isActive: number;
  UserType: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// Logout response shape (kept flexible to match API)
export interface LogoutResponse {
  message?: string;
  success?: boolean;
  // allow additional fields without narrowing
  [key: string]: unknown;
}

// Interface for creating/updating users based on API structure
export interface ICreateUser {
  userName: string;
  isAdmin?: boolean;
  isActive?: boolean;
}

export interface IUpdateUser {
  userName?: string;
  isAdmin?: boolean;
  isActive?: boolean;
}
