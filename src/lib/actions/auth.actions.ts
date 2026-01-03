import { apiLogin } from "@/services/auth.service";
import type { LoginRequest } from "@/types/auth.type";

export async function handleLogin(credentials: LoginRequest) {
  try {
    const response = await apiLogin(credentials);
    if (response.token) {
      return { success: true };
    }

    return {
      success: false,
      error: "Invalid Log-In",
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "An error occurred during login",
    };
  }
}
