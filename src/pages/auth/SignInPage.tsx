import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { loginSchema, type LoginSchemaType } from "@/lib/schema";
import { useAuth } from "@/hook/use-auth";
import { Button } from "@/components/base/button";

export default function SignInPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });
  const { login, isLoggingIn } = useAuth();
  const onSubmit = (data: LoginSchemaType) => {
    login(data);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="w-full flex flex-col items-center mb-6">
          <h1 className="mt-4 text-xl font-bold text-(--silver)">
            تسجيل الدخول
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            مرحباً بك في نظام إدارة الشرق
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 text-right"
        >
          <Input
            label="اسم المستخدم"
            type="text"
            placeholder="أدخل اسم المستخدم"
            {...register("userName")}
            error={errors.userName?.message}
          />

          <Input
            label="كلمة المرور"
            type="password"
            placeholder="أدخل كلمة المرور"
            {...register("password")}
            error={errors.password?.message}
          />

          <Button type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? "جاري التسجيل..." : "تسجيل الدخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
