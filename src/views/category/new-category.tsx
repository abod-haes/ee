import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { BaseSelect } from "@/components/base/select";
import { useCreateCategory, useCategories } from "@/hook/useCategory";
import { Button } from "@/components/base/button";
import { Icons } from "@/lib/icons";
import type { Category } from "@/types/category.type";

const categorySchema = z.object({
  name: z.string().min(1, { message: "الاسم مطلوب" }),
  attributes: z.array(z.string()).optional(),
  image: z.instanceof(File).optional(),
  categoryId: z.number().optional(),
});

export type AddNewCategoryProp = {
  onClose: () => void;
  onAdded: () => void;
};

type CategoryFormData = z.infer<typeof categorySchema>;

const AddCategoryForm = ({ onClose, onAdded }: AddNewCategoryProp) => {
  const createCategoryMutation = useCreateCategory();
  const { data: categoriesData } = useCategories();
  const categories: Category[] = categoriesData ?? [];
  const [attributes, setAttributes] = useState<string[]>([""]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const selectedCategoryId = watch("categoryId");

  const addAttribute = () => {
    setAttributes([...attributes, ""]);
  };

  const removeAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, i) => i !== index);
    setAttributes(newAttributes.length > 0 ? newAttributes : [""]);
    setValue(
      "attributes",
      newAttributes.filter((attr) => attr.trim() !== "")
    );
  };

  const updateAttribute = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = value;
    setAttributes(newAttributes);
    setValue(
      "attributes",
      newAttributes.filter((attr) => attr.trim() !== "")
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setValue("image", file);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    const validAttributes = attributes.filter((attr) => attr.trim() !== "");

    createCategoryMutation.mutate(
      {
        name: data.name,
        attributes: validAttributes.length > 0 ? validAttributes : [],
        image: selectedImage || undefined,
        categoryId: data.categoryId || undefined,
      },
      {
        onSuccess: () => {
          onAdded();
          onClose();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full mt-4 space-y-4">
      <Input
        id="name"
        label="الاسم"
        placeholder="أدخل اسم الصنف"
        {...register("name")}
        error={errors.name?.message}
      />

      <BaseSelect
        label="صنف أب"
        placeholder="اختر الصنف الأب (اختياري)"
        options={categories.map((category) => ({
          label: category.name,
          value: category.id.toString(),
        }))}
        value={
          selectedCategoryId !== undefined
            ? {
                label:
                  categories.find((cat) => cat.id === selectedCategoryId)
                    ?.name || "",
                value: selectedCategoryId.toString(),
              }
            : null
        }
        onChange={(selectedOption) => {
          if (
            selectedOption &&
            !Array.isArray(selectedOption) &&
            "value" in selectedOption
          ) {
            setValue("categoryId", parseInt(selectedOption.value));
          } else {
            setValue("categoryId", undefined);
          }
        }}
        error={errors.categoryId?.message}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الخصائص
        </label>
        {attributes.map((attr, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <Input
              value={attr}
              onChange={(e) => updateAttribute(index, e.target.value)}
              placeholder="أدخل اسم الخاصية"
              error={errors.attributes?.message}
            />
            {attributes.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeAttribute(index)}
              >
                حذف
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAttribute}
          className="mt-2"
        >
          إضافة خاصية
        </Button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          الصورة
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <Icons.upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {selectedImage ? "تغيير الصورة" : "اضغط لاختيار صورة"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF حتى 10MB
              </p>
            </div>
          </div>
        </div>
        {selectedImage && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <Icons.image className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              {selectedImage.name}
            </span>
            <span className="text-xs text-green-600">
              ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          className="capitalize"
          type="submit"
          disabled={createCategoryMutation.isPending}
        >
          إضافة صنف
        </Button>
        <Button
          className="capitalize"
          variant={"ghost"}
          onClick={onClose}
          disabled={createCategoryMutation.isPending}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default AddCategoryForm;
