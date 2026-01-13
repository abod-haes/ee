import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { BaseSelect } from "@/components/base/select";
import { DatePicker } from "@/components/base/date-picker";
import { useCreateProduct } from "@/hook/useProduct";
import { useCategories } from "@/hook/useCategory";
import { Button } from "@/components/base/button";
import { Icons } from "@/lib/icons";
import type { Category } from "@/types/category.type";
import { quantityTypes } from "@/constant/quantity-types";
import { cn } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(1, { message: "الاسم مطلوب" }),
  price: z.string().min(1, { message: "السعر مطلوب" }),
  netPrice: z.string().min(1, { message: "السعر الصافي مطلوب" }),
  priceType: z.number().optional(),
  note: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  store: z.string().optional(),
  manufacturer: z.string().optional(),
  quantity: z.number().optional(),
  quantityType: z.number().optional(),
  storagePlace: z.string().optional(),
  storageLocation: z.string().optional(),
  minimum: z.number().optional(),
  productionDate: z.string().optional(),
  medicalNecessity: z.string().optional(),
  categoryId: z.number().optional(),
  barcode: z.string().optional(),
});

export type AddNewProductProp = {
  onClose: () => void;
  onAdded: () => void;
};

type ProductFormData = z.infer<typeof productSchema>;

const AddProductForm = ({ onClose, onAdded }: AddNewProductProp) => {
  const createProductMutation = useCreateProduct();
  const { data: categoriesData } = useCategories({ withChildren: true });
  const categories: Category[] = categoriesData ?? [];

  // Filter parent categories (those with categoryId === null)
  const parentCategories = categories.filter(
    (cat) => cat.categoryId === null || cat.categoryId === undefined
  );

  const [attributes, setAttributes] = useState<
    Array<{
      value: string;
      categoryAttributeId: number;
    }>
  >([{ value: "", categoryAttributeId: 0 }]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<
    number | undefined
  >(undefined);
  const selectedCategoryId = watch("categoryId");

  // Get the selected parent category
  const selectedParentCategory = parentCategories.find(
    (cat) => cat.id === selectedParentCategoryId
  );

  // Get children of selected parent category
  const childCategories = selectedParentCategory?.children || [];

  // Get the final selected category (child if selected, otherwise parent)
  const selectedCategory = selectedCategoryId
    ? categories.find((cat) => cat.id === selectedCategoryId)
    : selectedParentCategory;

  // Auto-focus on barcode input
  useEffect(() => {
    const barcodeInput = document.getElementById("barcode") as HTMLInputElement;
    if (barcodeInput) {
      barcodeInput.focus();
    }
  }, []);

  // When category changes, reset to a single empty row (manual selection, no auto-fill).
  useEffect(() => {
    if (selectedCategory && (selectedCategory.attributes?.length ?? 0) > 0) {
      setAttributes([{ value: "", categoryAttributeId: 0 }]);
    } else {
      setAttributes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, selectedParentCategoryId, selectedCategory]);

  const addAttribute = () => {
    setAttributes((prev) => [...prev, { value: "", categoryAttributeId: 0 }]);
  };

  const removeAttribute = (index: number) => {
    if (attributes.length > 1) {
      setAttributes(attributes.filter((_, i) => i !== index));
    }
  };

  const updateAttribute = (
    index: number,
    field: "value" | "categoryAttributeId",
    value: string | number
  ) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setAttributes(newAttributes);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages([...selectedImages, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    const validAttributes = attributes.filter(
      (attr) => attr.value.trim() !== "" && attr.categoryAttributeId > 0
    );

    // Use child category if selected, otherwise use parent category
    const finalCategoryId = data.categoryId || selectedParentCategoryId;

    createProductMutation.mutate(
      {
        name: data.name,
        price: data.price,
        netPrice: data.netPrice,
        priceType: data.priceType ?? 0,
        note: data.note,
        description: data.description,
        source: data.source || "",
        store: data.store || "",
        manufacturer: data.manufacturer || "",
        quantity: data.quantity ?? 0,
        quantityType: data.quantityType ?? 0,
        storagePlace: data.storagePlace || "",
        storageLocation: data.storageLocation || "",
        minimum: data.minimum ?? 0,
        productionDate: data.productionDate || "",
        medicalNecessity: data.medicalNecessity || "",
        categoryId: finalCategoryId,
        attributes: validAttributes,
        images: selectedImages,
        barcode: data.barcode || "",
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full mt-4 space-y-6"
      suppressHydrationWarning
    >
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--silver)] border-b pb-2">
          المعلومات الأساسية
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="barcode"
            label="الباركود"
            placeholder="أدخل الباركود"
            {...register("barcode")}
            error={errors.barcode?.message}
          />

          <Input
            id="name"
            label="اسم المنتج"
            placeholder="أدخل اسم المنتج"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            selectedParentCategoryId && childCategories.length > 0
              ? "md:grid-cols-2 "
              : ""
          )}
        >
          <BaseSelect
            label="الصنف"
            placeholder="اختر الصنف"
            options={parentCategories.map((category) => ({
              label: category.name,
              value: category.id.toString(),
            }))}
            value={
              selectedParentCategoryId !== undefined
                ? {
                    label: selectedParentCategory?.name || "",
                    value: selectedParentCategoryId.toString(),
                  }
                : null
            }
            onChange={(selectedOption) => {
              if (
                selectedOption &&
                !Array.isArray(selectedOption) &&
                "value" in selectedOption
              ) {
                const parentId = parseInt(selectedOption.value);
                setSelectedParentCategoryId(parentId);
                // If parent has no children, set it as categoryId
                const parent = parentCategories.find(
                  (cat) => cat.id === parentId
                );
                if (
                  parent &&
                  (!parent.children || parent.children.length === 0)
                ) {
                  setValue("categoryId", parentId);
                } else {
                  // Reset categoryId if parent has children (will be set when child is selected)
                  setValue("categoryId", undefined as unknown as number);
                }
              } else {
                setSelectedParentCategoryId(undefined);
                setValue("categoryId", undefined as unknown as number);
              }
            }}
            error={errors.categoryId?.message}
          />

          {/* Child Categories Select */}
          {selectedParentCategoryId && childCategories.length > 0 && (
            <BaseSelect
              label="الصنف الفرعي"
              placeholder="اختر الصنف الفرعي"
              options={childCategories.map((child: Category) => ({
                label: child.name,
                value: child.id.toString(),
              }))}
              value={
                selectedCategoryId !== undefined &&
                childCategories.some(
                  (cat: Category) => cat.id === selectedCategoryId
                )
                  ? {
                      label:
                        childCategories.find(
                          (cat: Category) => cat.id === selectedCategoryId
                        )?.name || "",
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
                  // If no child selected, use parent category
                  if (selectedParentCategoryId) {
                    setValue("categoryId", selectedParentCategoryId);
                  }
                }
              }}
              error={errors.categoryId?.message}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="description"
            label="الوصف"
            placeholder="أدخل وصف المنتج"
            {...register("description")}
            error={errors.description?.message}
          />

          <Input
            id="note"
            label="ملاحظات"
            placeholder="أدخل أي ملاحظات"
            {...register("note")}
            error={errors.note?.message}
          />
        </div>
      </div>

      {/* Attributes Section */}
      {selectedCategory &&
        selectedCategory.attributes &&
        selectedCategory.attributes.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--silver)] border-b pb-2">
              خصائص المنتج
            </h3>

            <div className="space-y-3">
              {attributes.map((attr, index) => (
                <div key={index} className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    {(() => {
                      const attributeOptions =
                        selectedCategory?.attributes?.map((categoryAttr) => ({
                          label: categoryAttr.name,
                          value: categoryAttr.id.toString(),
                        })) ?? [];
                      const selectedAttributeOption =
                        (attr.categoryAttributeId ?? 0) > 0
                          ? attributeOptions.find(
                              (o) =>
                                o.value === String(attr.categoryAttributeId)
                            ) || null
                          : null;

                      return (
                        <BaseSelect
                          placeholder="اختر الخاصية"
                          options={attributeOptions}
                          value={selectedAttributeOption}
                          onChange={(selectedOption) => {
                            if (
                              selectedOption &&
                              !Array.isArray(selectedOption) &&
                              "value" in selectedOption
                            ) {
                              const categoryAttributeId = parseInt(
                                selectedOption.value
                              );
                              updateAttribute(
                                index,
                                "categoryAttributeId",
                                categoryAttributeId
                              );
                            }
                          }}
                        />
                      );
                    })()}
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(index, "value", e.target.value)
                      }
                      placeholder="أدخل القيمة"
                      className="flex-1"
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
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAttribute}
                className="w-full"
              >
                إضافة خاصية
              </Button>
            </div>
          </div>
        )}

      {/* Pricing Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--silver)] border-b pb-2">
          معلومات التسعير
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            id="price"
            label="السعر"
            placeholder="أدخل السعر"
            type="number"
            step="any"
            {...register("price")}
            error={errors.price?.message}
          />

          <Input
            id="netPrice"
            label="السعر الصافي"
            placeholder="أدخل السعر الصافي"
            type="number"
            step="any"
            {...register("netPrice")}
            error={errors.netPrice?.message}
          />

          <BaseSelect
            label="نوع السعر"
            placeholder="اختر نوع السعر"
            options={[
              { label: "سعر عادي", value: "0" },
              { label: "سعر مخفض", value: "1" },
              { label: "سعر خاص", value: "2" },
            ]}
            value={
              watch("priceType") !== undefined
                ? {
                    label:
                      watch("priceType") === 0
                        ? "سعر عادي"
                        : watch("priceType") === 1
                        ? "سعر مخفض"
                        : "سعر خاص",
                    value: (watch("priceType") ?? 0).toString(),
                  }
                : null
            }
            onChange={(selectedOption) => {
              if (
                selectedOption &&
                !Array.isArray(selectedOption) &&
                "value" in selectedOption
              ) {
                setValue("priceType", parseInt(selectedOption.value));
              }
            }}
            error={errors.priceType?.message}
          />
        </div>
      </div>

      {/* Inventory Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--silver)] border-b pb-2">
          معلومات المخزون
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            id="quantity"
            label="الكمية"
            placeholder="أدخل الكمية"
            type="number"
            step="any"
            {...register("quantity", {
              setValueAs: (v) => {
                if (v === "" || v === null || v === undefined) return undefined;
                const num = Number(v);
                return isNaN(num) ? undefined : num;
              },
            })}
            error={errors.quantity?.message}
          />

          <BaseSelect
            label="نوع الكمية"
            placeholder="اختر نوع الكمية"
            options={quantityTypes}
            value={
              watch("quantityType") !== undefined
                ? {
                    label:
                      watch("quantityType") === 0
                        ? "قطعة"
                        : watch("quantityType") === 1
                        ? "عبوة"
                        : watch("quantityType") === 2
                        ? "ليتر"
                        : watch("quantityType") === 3
                        ? "صندوق"
                        : "قطعة",
                    value: (watch("quantityType") ?? 0).toString(),
                  }
                : null
            }
            onChange={(selectedOption) => {
              if (
                selectedOption &&
                !Array.isArray(selectedOption) &&
                "value" in selectedOption
              ) {
                setValue("quantityType", parseInt(selectedOption.value));
              }
            }}
            error={errors.quantityType?.message}
          />

          <Input
            id="minimum"
            label="الحد الأدنى"
            placeholder="أدخل الحد الأدنى"
            type="number"
            step="any"
            {...register("minimum", {
              setValueAs: (v) => {
                if (v === "" || v === null || v === undefined) return undefined;
                const num = Number(v);
                return isNaN(num) ? undefined : num;
              },
            })}
            error={errors.minimum?.message}
          />
        </div>
      </div>

      {/* Production Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--silver)] border-b pb-2">
          معلومات الإنتاج
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            id="productionDate"
            label="تاريخ الإنتاج"
            placeholder="اختر تاريخ الإنتاج"
            value={watch("productionDate")}
            onChange={(value) => setValue("productionDate", value)}
            error={errors.productionDate?.message}
          />

          <Input
            id="manufacturer"
            label="الشركة المصنعة"
            placeholder="أدخل اسم الشركة المصنعة"
            {...register("manufacturer")}
            error={errors.manufacturer?.message}
          />
        </div>
      </div>

      {/* Supplier Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--silver)] border-b pb-2">
          معلومات المورد
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="source"
            label="المصدر"
            placeholder="أدخل المصدر"
            {...register("source")}
            error={errors.source?.message}
          />

          <Input
            id="store"
            label="المتجر"
            placeholder="أدخل اسم المتجر"
            {...register("store")}
            error={errors.store?.message}
          />
        </div>
      </div>

      {/* Storage Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--silver)] border-b pb-2">
          معلومات التخزين
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="storagePlace"
            label="مكان التخزين"
            placeholder="أدخل مكان التخزين"
            {...register("storagePlace")}
            error={errors.storagePlace?.message}
          />

          <Input
            id="storageLocation"
            label="موقع التخزين"
            placeholder="أدخل موقع التخزين"
            {...register("storageLocation")}
            error={errors.storageLocation?.message}
          />
        </div>

        <Input
          id="medicalNecessity"
          label="الضرورة الطبية"
          placeholder="أدخل الضرورة الطبية"
          {...register("medicalNecessity")}
          error={errors.medicalNecessity?.message}
        />
      </div>

      {/* Images Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          صور المنتج
        </label>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <Icons.upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">اضغط لاختيار الصور</p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF حتى 10MB لكل صورة
              </p>
            </div>
          </div>
        </div>

        {selectedImages.length > 0 && (
          <div className="space-y-2">
            {selectedImages.map((image, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg"
              >
                <Icons.image className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium flex-1">
                  {image.name}
                </span>
                <span className="text-xs text-green-600">
                  ({(image.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Icons.close />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          className="capitalize"
          type="submit"
          disabled={createProductMutation.isPending}
        >
          إضافة منتج
        </Button>
        <Button
          className="capitalize"
          variant={"ghost"}
          onClick={onClose}
          disabled={createProductMutation.isPending}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default AddProductForm;
