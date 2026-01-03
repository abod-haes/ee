import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { useUser, useUpdateUser } from "@/hook/useUser";
import { Button } from "@/components/base/button";
import type { UpdateUserRequest } from "@/types/user.type";
import { BaseSelect, type Option } from "@/components/base/select";
import { normalizeUserTypeToCode } from "../../utils/helper";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/hook/useUser";

const userSchema = z.object({
  fullName: z.string().min(1, { message: "الاسم مطلوب" }),
  email: z
    .union([
      z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  userName: z.string().min(1, { message: "اسم المستخدم مطلوب" }),
  userType: z.string().min(1, { message: "نوع المستخدم مطلوب" }),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    }),
  withPrice: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export type EditUserProp = {
  id: string;
  onClose: () => void;
  onAdded: () => void;
};

const EditUserForm = ({ id, onClose, onAdded }: EditUserProp) => {
  const queryClient = useQueryClient();
  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
    refetch,
  } = useUser(id);
  const updateUserMutation = useUpdateUser();

  // Invalidate cache and refetch when dialog opens (component mounts)
  useEffect(() => {
    if (id) {
      // Remove cached data for this user
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
      // Refetch fresh data
      refetch();
    }
  }, [id, queryClient, refetch]);

  // Debug logging
  console.log(
    "EditUserForm - ID:",
    id,
    "UserData:",
    userData,
    "Loading:",
    isLoadingUser,
    "Error:",
    userError
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: "",
      email: "",
      userName: "",
      userType: "0",
      password: "",
      withPrice: false,
    },
  });

  const roleOptions: Option[] = [
    { value: "0", label: "مدير" },
    { value: "1", label: "مدخل بيانات" },
    { value: "2", label: "مندوب" },
    { value: "3", label: "طبيب" },
    { value: "4", label: "مندوب ومدخل بيانات" },
    { value: "5", label: "مندوبB" },
  ];

  // Use shared normalizer to map API UserType to form code value
  const mapUserTypeToFormValue = (
    userType: unknown
  ): "0" | "1" | "2" | "3" | "4" | "5" => {
    return normalizeUserTypeToCode(userType);
  };

  // Reset form when user data is loaded
  useEffect(() => {
    if (userData) {
      console.log("Resetting form with userData:", userData);
      reset({
        fullName: userData.fullName,
        email: userData.email || "", // Convert null/undefined to empty string
        userName: userData.userName,
        userType: mapUserTypeToFormValue(userData.UserType),
        password: "",
        withPrice: userData.withPrice === 1,
      });
    }
  }, [userData, reset]);

  const onSubmit = async (data: UserFormData) => {
    const updateData: UpdateUserRequest = {
      fullName: data.fullName,
      userName: data.userName,
      userType: Number(data.userType),
    };

    // Only include email if it's provided and not empty
    if (data.email && data.email.trim()) {
      updateData.email = data.email.trim();
    }

    // Only include password if it's provided
    if (data.password && data.password.trim()) {
      updateData.password = data.password;
    }

    // Include withPrice always
    updateData.withPrice = data.withPrice ? 1 : 0;

    updateUserMutation.mutate(
      { id, userData: updateData },
      {
        onSuccess: () => {
          onAdded();
          onClose();
        },
      }
    );
  };

  const handleGeneratePassword = () => {
    const length = 10; // numeric password for easier use
    const digits = "0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      password += digits[randomIndex];
    }
    setValue("password", password, { shouldValidate: true });
  };

  if (isLoadingUser) {
    return (
      <div className="w-full mt-4 text-center">
        جاري تحميل بيانات المستخدم...
      </div>
    );
  }

  if (userError) {
    return (
      <div className="w-full mt-4 text-center">
        <p className="text-red-500">حدث خطأ في تحميل بيانات المستخدم</p>
        <p className="text-sm text-gray-500 mt-2">ID: {id}</p>
        <p className="text-xs text-gray-400 mt-1">
          Error: {userError?.message || "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full mt-4 space-y-4">
      <Input
        id="fullName"
        label="الاسم الكامل"
        disabled={true}
        placeholder="أدخل الاسم الكامل"
        {...register("fullName")}
        error={errors.fullName?.message}
      />
      <Input
        id="email"
        label="البريد الإلكتروني "
        disabled={true}
        type="email"
        className="!cursor-not-allowed hover:border-border"
        {...register("email")}
        error={errors.email?.message}
      />
      <Input
        id="userName"
        label="اسم المستخدم"
        placeholder="أدخل اسم المستخدم"
        {...register("userName")}
        error={errors.userName?.message}
      />
      <BaseSelect
        label="نوع المستخدم"
        placeholder="اختر نوع المستخدم"
        options={roleOptions}
        value={
          roleOptions.find((opt) => opt.value === watch("userType")) || null
        }
        onChange={(opt) => {
          const value = (opt as Option | null)?.value ?? "";
          setValue("userType", value);
        }}
        error={errors.userType?.message}
      />
      <div className="flex items-center gap-2">
        <input
          id="withPrice"
          type="checkbox"
          className="h-4 w-4"
          {...register("withPrice")}
          disabled={updateUserMutation.isPending}
        />
        <label htmlFor="withPrice" className="text-sm">
          عرض السعر
        </label>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            id="password"
            label="كلمة المرور (اختياري)"
            type="password"
            placeholder="أدخل كلمة المرور الجديدة"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mb-1 "
          onClick={handleGeneratePassword}
          disabled={updateUserMutation.isPending}
        >
          توليد كلمة مرور
        </Button>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button
          className="capitalize"
          type="submit"
          disabled={updateUserMutation.isPending}
        >
          تحديث المستخدم
        </Button>
        <Button
          className="capitalize"
          variant={"ghost"}
          type="button"
          onClick={onClose}
          disabled={updateUserMutation.isPending}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default EditUserForm;
