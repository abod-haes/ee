import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { BaseSelect } from "@/components/base/select";
import { Button } from "@/components/base/button";
import {
  useCategory,
  useUpdateCategory,
  useCategories,
} from "@/hook/useCategory";
import { Icons } from "@/lib/icons";
import type { Category } from "@/types/category.type";

const categorySchema = z.object({
  name: z.string().min(1, { message: "الاسم مطلوب" }),
  attributes: z.array(z.string()).optional(),
  categoryId: z.number().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export type EditCategoryProp = {
  onClose: () => void;
  onAdded: () => void;
  id: string;
  slug: string;
};

interface AttributeItem {
  id: string | number;
  name: string;
}

const EditCategoryForm = ({ onClose, onAdded, id, slug }: EditCategoryProp) => {
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the new category hooks
  const {
    data: categoryData,
    isLoading: isLoadingCategory,
    error: categoryError,
  } = useCategory(slug);
  const { data: categoriesData } = useCategories();
  const categories: Category[] = categoriesData ?? [];
  const updateCategoryMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const selectedCategoryId = watch("categoryId");

  // Reset form when category data is loaded
  useEffect(() => {
    if (categoryData) {
      const categoryAttributes: AttributeItem[] =
        categoryData.attributes?.map((attr) => ({
          id: attr.id || "",
          name: attr.name || "",
        })) || [];
      reset({
        name: categoryData.name,
        attributes: categoryAttributes.map((attr) => attr.name),
        categoryId: categoryData.categoryId || undefined,
      });
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setAttributes(
          categoryAttributes.length > 0
            ? categoryAttributes
            : [{ id: "", name: "" }]
        );
      }, 0);
    }
  }, [categoryData, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setIsImageDeleted(false);
    }
  };

  const handleDeleteImage = () => {
    setIsImageDeleted(true);
    setSelectedImage(null);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { id: "", name: "" }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], name: value };
    setAttributes(newAttributes);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const validAttributes = attributes.filter(
        (attr) => attr.name.trim() !== ""
      );
      const updateData: {
        name: string;
        attributes: Array<{ id: string | number; name: string }>;
        categoryId?: number;
        image?: File;
        deleteImage?: boolean;
      } = {
        name: data.name,
        attributes:
          validAttributes.map((attr) => ({
            id: attr.id || "",
            name: attr.name,
          })) || [],
        categoryId: data.categoryId || undefined,
      };

      // Handle image based on state
      if (isImageDeleted) {
        // User explicitly deleted the image - set deleteImage flag
        updateData.deleteImage = true;
      } else if (selectedImage) {
        // User selected a new image
        updateData.image = selectedImage;
      } else if (categoryData?.image) {
        // No changes to image - fetch and send existing one
        try {
          const response = await fetch(categoryData.image);
          const blob = await response.blob();
          const file = new File([blob], "existing-image.jpg", {
            type: blob.type,
          });
          updateData.image = file;
        } catch (fetchError) {
          console.error("Error fetching existing image:", fetchError);
        }
      }

      await updateCategoryMutation.mutateAsync({
        id: Number(id),
        categoryData: updateData,
      });

      onAdded();
      onClose();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  if (isLoadingCategory) {
    return (
      <div className="w-full mt-4 flex items-center justify-center py-8">
        <p className="text-gray-500">جاري تحميل بيانات الصنف...</p>
      </div>
    );
  }

  if (categoryError) {
    return (
      <div className="w-full mt-4 flex items-center justify-center py-8">
        <p className="text-red-500">حدث خطأ في تحميل بيانات الصنف</p>
        <p className="text-sm text-gray-500 mt-2">ID: {id}</p>
      </div>
    );
  }

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
        options={categories
          .filter((cat) => cat.id !== Number(id))
          .map((category) => ({
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

      {/* Attributes Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          الخصائص
        </label>
        {attributes.map((attr, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={attr.name}
              onChange={(e) => handleAttributeChange(index, e.target.value)}
              placeholder="أدخل اسم الخاصية"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleRemoveAttribute(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Icons.close />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={handleAddAttribute}
          className="w-full"
        >
          <Icons.add className="ml-2" />
          إضافة خاصية
        </Button>
        {errors.attributes && (
          <p className="text-sm text-red-500">{errors.attributes.message}</p>
        )}
      </div>

      {/* Image Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          الصورة
        </label>

        {/* Current Image Display */}
        {categoryData?.image && !selectedImage && !isImageDeleted && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">الصورة الحالية:</p>
            <div className="relative inline-block">
              <img
                src={
                  categoryData.image.startsWith("http")
                    ? categoryData.image
                    : `https://alsharq-api.phoenix-blog.net${categoryData.image}`
                }
                alt={categoryData.name}
                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Icons.image className="w-3 h-3 text-white" />
              </div>
              <button
                type="button"
                onClick={handleDeleteImage}
                className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                title="حذف الصورة"
              >
                <Icons.close className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Image Deleted State */}
        {isImageDeleted && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.close className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">سيتم حذف الصورة</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImageDeleted(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              تراجع
            </Button>
          </div>
        )}

        {/* File Upload Area */}
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
                {selectedImage ? "تغيير الصورة" : "اضغط لاختيار صورة جديدة"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF حتى 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Selected File Display */}
        {selectedImage && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Icons.image className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <span className="text-sm text-green-700 font-medium">
                {selectedImage.name}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedImage(null);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <Icons.close />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="submit"
          disabled={updateCategoryMutation.isPending}
          className="capitalize"
        >
          {updateCategoryMutation.isPending ? "جاري التحديث..." : "تعديل صنف"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={updateCategoryMutation.isPending}
          className="capitalize"
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default EditCategoryForm;
