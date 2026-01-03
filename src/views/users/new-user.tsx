import React, { useState } from "react";
import { Input } from "@/components/base/input";
import { useCreateUser } from "@/hook/useUser";
import { useDoctors } from "@/hook/useDoctor";
import { Button } from "@/components/base/button";
import { BaseSelect, type Option } from "@/components/base/select";
import type { CreateUserRequest } from "@/types/user.type";

export type AddNewUserProp = {
  onClose: () => void;
  onAdded: () => void;
};

interface UserFormData {
  fullName: string;
  email: string;
  userName: string;
  password: string;
  userType: "0" | "1" | "2" | "3" | "4" | "5";
  doctorId: string;
  withPrice?: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  userName?: string;
  password?: string;
  userType?: string;
  doctorId?: string;
  withPrice?: string;
}

const AddUserForm = ({ onClose, onAdded }: AddNewUserProp) => {
  const createUserMutation = useCreateUser();
  const { data: doctors = [] } = useDoctors();

  const [formData, setFormData] = useState<UserFormData>({
    fullName: "",
    email: "",
    userName: "",
    password: "",
    userType: "0",
    doctorId: "",
    withPrice: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const isDoctorType = formData.userType === "3";

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "الاسم الكامل مطلوب";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }

    if (!formData.userName.trim()) {
      newErrors.userName = "اسم المستخدم مطلوب";
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    }

    if (!formData.userType) {
      newErrors.userType = "نوع المستخدم مطلوب";
    }

    if (formData.userType === "3" && !formData.doctorId) {
      newErrors.doctorId = "اختيار الطبيب مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleUserTypeChange = (value: string) => {
    const selectedType = value as "0" | "1" | "2" | "3" | "4" | "5";
    setFormData((prev) => ({
      ...prev,
      userType: selectedType,
      doctorId: selectedType === "3" ? prev.doctorId : "",
    }));
    // Clear doctor error if it exists
    if (errors.doctorId && selectedType !== "3") {
      setErrors((prev) => ({ ...prev, doctorId: undefined }));
    }
    if (errors.userType) {
      setErrors((prev) => ({ ...prev, userType: undefined }));
    }
  };

  const handleDoctorChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      doctorId: value,
    }));
    // Clear userType error if it exists
    if (errors.doctorId) {
      setErrors((prev) => ({ ...prev, doctorId: undefined }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload: CreateUserRequest = {
      fullName: formData.fullName,
      email: formData.email || undefined,
      userName: formData.userName,
      password: formData.password,
      userType: Number(formData.userType),
      doctorId: formData.doctorId ? Number(formData.doctorId) : undefined,
      withPrice: formData.withPrice ? 1 : 0,
    };

    createUserMutation.mutate(payload, {
      onSuccess: () => {
        onAdded();
        onClose();
      },
    });
  };

  const handleGeneratePassword = () => {
    const length = 10; // 10 digits (passes min length 8)
    const digits = "0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      password += digits[randomIndex];
    }
    handleInputChange("password", password);
  };

  const roleOptions: Option[] = [
    { value: "0", label: "مدير" },
    { value: "1", label: "مدخل بيانات" },
    { value: "2", label: "مندوب" },
    { value: "3", label: "طبيب" },
    { value: "4", label: "مندوب ومدخل بيانات" },
    { value: "5", label: "مندوبB" },
  ];

  const doctorOptions: Option[] = [
    ...doctors.map((doctor) => ({
      value: doctor.id.toString(),
      label: doctor.name,
    })),
  ];

  return (
    <form
      onSubmit={onSubmit}
      className="w-full mt-4  grid md:grid-cols-2 grid-cols-1 gap-4 "
    >
      <Input
        id="fullName"
        label="الاسم الكامل"
        placeholder="أدخل الاسم الكامل"
        value={formData.fullName}
        onChange={(e) => handleInputChange("fullName", e.target.value)}
        error={errors.fullName}
      />
      <Input
        id="email"
        label="البريد الإلكتروني (اختياري)"
        placeholder="أدخل البريد الإلكتروني"
        type="email"
        value={formData.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
        error={errors.email}
      />
      <Input
        id="userName"
        label="اسم المستخدم"
        placeholder="أدخل اسم المستخدم"
        value={formData.userName}
        onChange={(e) => handleInputChange("userName", e.target.value)}
        error={errors.userName}
      />
      <BaseSelect
        label="نوع المستخدم"
        placeholder="اختر نوع المستخدم"
        options={roleOptions}
        value={roleOptions.find((opt) => opt.value === formData.userType)}
        onChange={(opt) => {
          const value = (opt as Option | null)?.value ?? "";
          handleUserTypeChange(value);
        }}
        error={errors.userType}
      />
      {isDoctorType && (
        <BaseSelect
          label="الطبيب"
          placeholder="اختر طبيب"
          options={doctorOptions}
          value={
            formData.doctorId
              ? doctorOptions.find((opt) => opt.value === formData.doctorId)
              : null
          }
          onChange={(opt) => {
            const value = (opt as Option | null)?.value ?? "";
            handleDoctorChange(value);
          }}
          error={errors.doctorId}
        />
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            id="password"
            label="كلمة المرور"
            type="password"
            placeholder="أدخل كلمة المرور"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            error={errors.password}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mb-1 "
          onClick={handleGeneratePassword}
          disabled={createUserMutation.isPending}
        >
          توليد كلمة مرور
        </Button>
      </div>

      <div className="flex items-end gap-2 mb-2">
        <input
          id="withPrice"
          type="checkbox"
          className="h-4 w-4"
          checked={!!formData.withPrice}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, withPrice: e.target.checked }))
          }
          disabled={createUserMutation.isPending}
        />
        <label htmlFor="withPrice" className="text-sm">
          عرض السعر
        </label>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          className="capitalize"
          type="submit"
          disabled={createUserMutation.isPending}
        >
          إضافة مستخدم
        </Button>
        <Button
          className="capitalize"
          variant={"ghost"}
          onClick={onClose}
          disabled={createUserMutation.isPending}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default AddUserForm;
