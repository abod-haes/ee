import { API_BASE_URL } from "@/api";
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from "@/types/auth.type";
import axiosInstance from "@/lib/axios";

export async function apiLogin(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>(
    `${API_BASE_URL}/users/auth`,
    credentials
  );
  return data;
}

export async function apiLogout(): Promise<LogoutResponse> {
  const { data } = await axiosInstance.post<LogoutResponse>(
    `${API_BASE_URL}/Users/logout`
  );
  return data;
}

// export const apiCurrentUser = async () => {
//   try {
//     const user = (await cookies()).get("token");

//     return user?.value;
//   } catch (error) {
//     if (error instanceof AuthError) {
//       throw error;
//     }
//     throw new AuthError("An error occurred during login");
//   }
// };
