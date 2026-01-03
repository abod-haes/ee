import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { useDoctor, useUpdateDoctor } from "@/hook/useDoctor";
import { Button } from "@/components/base/button";

const doctorSchema = z.object({
  name: z.string().min(1, { message: "الاسم مطلوب" }),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?\d{8,15}$/.test(val), {
      message: "رقم هاتف غير صالح",
    }),
  address: z.string().optional(),
  withPrice: z.boolean(),
});

type DoctorFormData = z.infer<typeof doctorSchema>;

export type EditDoctorProp = {
  id: string;
  onClose: () => void;
  onAdded: () => void;
  slug: string;
};

const EditDoctorForm = ({ id, onClose, onAdded, slug }: EditDoctorProp) => {
  const { data: doctorData, isLoading: isLoadingDoctor } = useDoctor(slug);
  const updateDoctorMutation = useUpdateDoctor();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      withPrice: false,
    },
  });

  // Reset form when doctor data is loaded
  useEffect(() => {
    if (doctorData) {
      reset({
        name: doctorData.name,
        phone: doctorData.phone,
        address: doctorData.address,
        withPrice: doctorData.withPrice === 1,
      });
    }
  }, [doctorData, reset]);

  const onSubmit = async (data: DoctorFormData) => {
    const updateData = {
      name: data.name,
      phone: data.phone || "",
      address: data.address || "",
      withPrice: data.withPrice ? 1 : 0,
    };

    updateDoctorMutation.mutate(
      { id, doctorData: updateData },
      {
        onSuccess: () => {
          onAdded();
          onClose();
        },
      }
    );
  };

  if (isLoadingDoctor) {
    return (
      <div className="w-full mt-4 text-center">جاري تحميل بيانات الطبيب...</div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full mt-4 space-y-4">
      <Input
        id="name"
        label="الاسم"
        placeholder="أدخل الاسم"
        {...register("name")}
        error={errors.name?.message}
      />

      <Input
        id="phone"
        label="رقم الهاتف"
        placeholder="أدخل رقم الهاتف"
        {...register("phone")}
        error={errors.phone?.message}
      />

      <Input
        id="address"
        label="العنوان"
        placeholder="أدخل العنوان"
        {...register("address")}
        error={errors.address?.message}
      />

      <div className="flex items-center gap-2">
        <input
          id="withPrice"
          type="checkbox"
          className="h-4 w-4"
          {...register("withPrice")}
          disabled={updateDoctorMutation.isPending}
        />
        <label htmlFor="withPrice" className="text-sm">
          عرض السعر
        </label>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          className="capitalize"
          type="submit"
          disabled={updateDoctorMutation.isPending}
        >
          تحديث الطبيب
        </Button>
        <Button
          type="button"
          className="capitalize"
          variant="ghost"
          onClick={onClose}
          disabled={updateDoctorMutation.isPending}
        >
          الغاء
        </Button>
      </div>
    </form>
  );
};

export default EditDoctorForm;
