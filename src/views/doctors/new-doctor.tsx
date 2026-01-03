import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { useCreateDoctor } from "@/hook/useDoctor";
import { Button } from "@/components/base/button";

const doctorSchema = z.object({
  name: z.string().min(1, { message: "الاسم مطلوب" }),
  address: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?\d{8,15}$/.test(val), {
      message: "رقم هاتف غير صالح",
    }),
  userName: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 8, {
      message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    }),
  withPrice: z.boolean(),
});

export type AddNewDoctorProp = {
  onClose: () => void;
  onAdded: () => void;
};

type DoctorFromData = z.infer<typeof doctorSchema>;

const AddDoctorForm = ({ onClose, onAdded }: AddNewDoctorProp) => {
  const createDoctorMutation = useCreateDoctor();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DoctorFromData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      withPrice: false,
    },
  });

  const onSubmit = async (data: DoctorFromData) => {
    createDoctorMutation.mutate(
      {
        name: data.name,
        address: data.address || "",
        phone: data.phone || "",
        userName: data.userName || "",
        password: data.password || "",
        withPrice: data.withPrice ? 1 : 0,
      },
      {
        onSuccess: () => {
          onAdded();
          onClose();
        },
      }
    );
  };

  const handleGeneratePassword = () => {
    const length = 10;
    const digits = "0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      password += digits[randomIndex];
    }
    setValue("password", password, { shouldValidate: true });
  };

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
        id="address"
        label="العنوان"
        placeholder="أدخل العنوان"
        {...register("address")}
        error={errors.address?.message}
      />
      <Input
        id="phone"
        label="رقم الهاتف"
        placeholder="أدخل رقم الهاتف"
        {...register("phone")}
        error={errors.phone?.message}
      />
      <Input
        id="userName"
        label="اسم المستخدم"
        placeholder="أدخل اسم المستخدم"
        {...register("userName")}
        error={errors.userName?.message}
      />
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            id="password"
            label="كلمة المرور"
            type="password"
            placeholder="أدخل كلمة المرور"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mb-1 "
          onClick={handleGeneratePassword}
          disabled={createDoctorMutation.isPending}
        >
          توليد كلمة مرور
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="withPrice"
          type="checkbox"
          className="h-4 w-4"
          {...register("withPrice")}
          disabled={createDoctorMutation.isPending}
        />
        <label htmlFor="withPrice" className="text-sm">
          عرض السعر
        </label>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button
          className="capitalize"
          type="submit"
          disabled={createDoctorMutation.isPending}
        >
          إضافة طبيب
        </Button>
        <Button
          type="button"
          className="capitalize"
          variant={"ghost"}
          onClick={onClose}
          disabled={createDoctorMutation.isPending}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default AddDoctorForm;
