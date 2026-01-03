import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LoginRequest, LoginResponse } from "@/types/auth.type";
import { tokenUtils } from "@/lib/token-utils";
import { apiLogin } from "@/services/auth.service";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => apiLogin(credentials),
    onSuccess: (data: LoginResponse) => {
      const allowedRoles = new Set(["Admin", "DataEntry", "Rep_DataEntry"]);

      // Check user role before granting access
      if (!allowedRoles.has(data.user.UserType)) {
        toast.error("لا تملك صلاحية الدخول للوحة التحكم");
        return; // Do not store auth or navigate
      }

      // Store auth data using custom token utils
      tokenUtils.setAuthState(data.token, data.user);
      // Show success message
      toast.success("تم تسجيل الدخول بنجاح");
      // Navigate to home page
      navigate("/");
    },
    onError: (error: unknown) => {
      // Type guard to check if error has response property
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      // Try to get error message from API response first
      const apiErrorMessage = axiosError.response?.data?.message;

      // Show specific error messages based on error type
      if (axiosError.response?.status === 401) {
        toast.error(apiErrorMessage || "اسم المستخدم أو كلمة المرور غير صحيحة");
      } else if (axiosError.response?.status === 403) {
        toast.error(apiErrorMessage || "حسابك غير مفعل، يرجى التواصل مع الإدارة");
      } else if (axiosError.response?.status === 429) {
        toast.error(apiErrorMessage || "تم تجاوز عدد المحاولات المسموح، يرجى المحاولة لاحقاً");
      } else if (axiosError.response?.status) {
        // Other HTTP errors - show API message if available, otherwise generic message
        toast.error(apiErrorMessage || `حدث خطأ (${axiosError.response.status})، يرجى المحاولة مرة أخرى`);
      } else if (axiosError.message) {
        // Network or other errors
        toast.error(axiosError.message || "فشل في تسجيل الدخول، يرجى التحقق من الاتصال بالإنترنت");
      } else {
        toast.error("فشل في تسجيل الدخول، يرجى المحاولة مرة أخرى");
      }
    },
  });

  // Login function
  const login = (credentials: LoginRequest) => {
    loginMutation.mutate(credentials);
  };

  // Logout function - just clear local data and redirect
  const logout = async () => {
    tokenUtils.clearAuth();
    // Clear all queries
    queryClient.clear();
    // Show success message
    toast.success("تم تسجيل الخروج بنجاح");
    // Navigate to sign-in page
    navigate("/sign-in", { replace: true });
    return true;
  };

  return {
    // Actions
    login,
    logout,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: false,

    // Success states
    isLoginSuccess: loginMutation.isSuccess,
    isLogoutSuccess: false,

    // Error states
    loginError: loginMutation.error,
    logoutError: null,

    // Reset functions
    resetLoginError: loginMutation.reset,
    resetLogoutError: () => {},
  };
};
