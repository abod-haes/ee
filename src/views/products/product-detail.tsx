import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { Button } from "@/components/base/button";
import { BaseSelect } from "@/components/base/select";
import { DatePicker } from "@/components/base/date-picker";
import { useProductBySlug, useUpdateProduct } from "@/hook/useProduct";
import { useCategories } from "@/hook/useCategory";
import { Icons } from "@/lib/icons";
import { quantityTypes } from "@/constant/quantity-types";
import type { Category } from "@/types/category.type";

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
  attributes: z
    .array(
      z.object({
        value: z.string().optional(),
        categoryAttributeId: z.number().optional(),
        id: z.number().optional(),
        // Track original values loaded from server so we can decide whether to send id
        originalCategoryAttributeId: z.number().optional(),
        originalId: z.number().optional(),
      })
    )
    .optional(),
  // Local-only field used to drive parent/child category selects
  parentCategoryId: z.number().optional(),
  categoryId: z.number().optional(),
  barcode: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export type EditProductProp = {
  onClose: () => void;
  onAdded: () => void;
  slug: string;
};

const EditProductForm = ({ onClose, onAdded, slug }: EditProductProp) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the new product hooks
  const {
    data: productData,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProductBySlug(slug);
  const updateProductMutation = useUpdateProduct();
  const { data: categoriesData } = useCategories({ withChildren: true });
  const categories: Category[] = useMemo(
    () => categoriesData ?? [],
    [categoriesData]
  );

  // Filter parent categories (those with categoryId === null)
  const parentCategories = categories.filter(
    (cat) => cat.categoryId === null || cat.categoryId === undefined
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    control,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      attributes: [],
    },
  });

  const {
    fields: attributeFields,
    remove,
    append,
    replace,
  } = useFieldArray({
    control,
    name: "attributes",
  });

  const selectedParentCategoryId = useWatch({
    control,
    name: "parentCategoryId",
  });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const watchedPriceType = useWatch({ control, name: "priceType" });
  const watchedQuantityType = useWatch({ control, name: "quantityType" });
  const watchedProductionDate = useWatch({ control, name: "productionDate" });

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

  const watchedAttributes = useWatch({ control, name: "attributes" });

  // When category changes, clear all attributes
  const initializedCategoryRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!selectedCategoryId) return;
    if (initializedCategoryRef.current === undefined) {
      initializedCategoryRef.current = selectedCategoryId;
      return;
    }
    if (initializedCategoryRef.current !== selectedCategoryId) {
      initializedCategoryRef.current = selectedCategoryId;
      // Clear all attributes when category changes
      replace([]);
    }
  }, [replace, selectedCategoryId]);

  // If there are no saved attributes, show one empty row so user can select.
  useEffect(() => {
    if (!selectedCategory || (selectedCategory.attributes?.length ?? 0) === 0)
      return;
    if (attributeFields.length === 0) {
      append({ value: "", categoryAttributeId: 0 });
    }
  }, [append, attributeFields.length, selectedCategory]);

  // Reset form when product data is loaded
  useEffect(() => {
    if (productData) {
      const productCategoryId = productData.categoryId;
      const productChildCategoryId = productData.childCategoryId ?? undefined;

      // Determine parent/child ids for the form:
      // - If API provides childCategoryId, we should select that as the child
      // - Otherwise fall back to categoryId and infer whether it's child or parent from categories tree
      let parentCategoryId: number | undefined;
      let categoryId: number | undefined;

      if (productChildCategoryId) {
        const childCategory = categories.find(
          (cat) => cat.id === productChildCategoryId
        );
        parentCategoryId = (childCategory?.categoryId ?? productCategoryId) as
          | number
          | undefined;
        categoryId = productChildCategoryId;
      } else {
        const productCategory = categories.find(
          (cat) => cat.id === productCategoryId
        );
        const isChildCategory =
          productCategory?.categoryId !== null &&
          productCategory?.categoryId !== undefined;

        parentCategoryId = isChildCategory
          ? productCategory?.categoryId ?? undefined
          : productCategoryId;
        categoryId = productCategoryId;
      }

      reset({
        name: productData.name,
        price: productData.price,
        netPrice: productData.netPrice,
        priceType: productData.priceType || 0,
        note: productData.note || "",
        description: productData.description || "",
        source: productData.source || "",
        store: productData.store || "",
        manufacturer: productData.manufacturer || "",
        quantity: productData.quantity,
        quantityType: productData.quantityType,
        storagePlace: productData.storagePlace || "",
        storageLocation: productData.storageLocation || "",
        minimum: productData.minimum || 0,
        productionDate: productData.productionDate
          ? productData.productionDate.split("T")[0]
          : "", // Format date for input, handle null
        medicalNecessity: productData.medicalNecessity || "",
        parentCategoryId,
        categoryId,
        barcode: productData.barcode || "",
        attributes: (productData.attributes || []).map((attr) => ({
          id: attr.id,
          value: attr.value,
          categoryAttributeId: attr.categoryAttributeId,
          // Persist original to compare later
          originalCategoryAttributeId: attr.categoryAttributeId,
          originalId: attr.id,
        })),
      });
    }
  }, [productData, reset, categories, getValues]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages([...selectedImages, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const validAttributes = (data.attributes ?? [])
        .filter(
          (attr) =>
            (attr.value ?? "").trim() !== "" &&
            (attr.categoryAttributeId ?? 0) > 0
        )
        .map((attr) => {
          const keepId =
            (attr.id ?? undefined) !== undefined &&
            (attr.originalCategoryAttributeId ?? undefined) !== undefined &&
            Number(attr.originalCategoryAttributeId) ===
              Number(attr.categoryAttributeId);
          return {
            value: (attr.value ?? "").trim(),
            categoryAttributeId: attr.categoryAttributeId as number,
            // Keep id only if categoryAttributeId didn't change; otherwise omit
            id: keepId ? (attr.id as number) : (undefined as unknown as number),
          };
        });

      // Use child category if selected, otherwise use parent category
      const finalCategoryId = data.categoryId || selectedParentCategoryId;

      const updateData = {
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
        categoryId: finalCategoryId!,
        attributes: validAttributes,
        images: selectedImages.length > 0 ? selectedImages : undefined,
        barcode: data.barcode || "",
      };

      await updateProductMutation.mutateAsync({
        id: Number(productData?.id),
        productData: updateData,
      });

      onAdded();
      onClose();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="w-full mt-4 flex items-center justify-center py-8">
        <p className="text-gray-500">جاري تحميل بيانات المنتج...</p>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="w-full mt-4 flex flex-col items-center justify-center py-8">
        <p className="text-red-500 text-lg">حدث خطأ في تحميل بيانات المنتج</p>
        <p className="text-sm text-gray-500 mt-2">Slug: {slug}</p>
        <p className="text-sm text-gray-500 mt-1">
          يرجى التأكد من صحة رابط المنتج أو أن المنتج موجود
        </p>
        <p className="text-xs text-gray-400 mt-2">
          للاختبار، انتقل إلى قائمة المنتجات واختر منتج موجود للتعديل
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          العودة للقائمة
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full mt-4 space-y-6"
      suppressHydrationWarning
    >
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
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
                setValue("parentCategoryId", parentId);
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
                setValue("parentCategoryId", undefined as unknown as number);
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
            <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
              خصائص المنتج
            </h3>

            <div className="space-y-3">
              {attributeFields.map((field, index) => {
                const attributeOptions = selectedCategory.attributes.map(
                  (categoryAttr) => ({
                    label: categoryAttr.name,
                    value: categoryAttr.id.toString(),
                  })
                );

                // Get current attribute value - try watchedAttributes first, then getValues, then field
                const currentAttribute = watchedAttributes?.[index] as
                  | {
                      categoryAttributeId?: number;
                      id?: number;
                      value?: string;
                    }
                  | undefined;

                // Fallback to getValues if watchedAttributes is not available
                const fallbackAttribute =
                  currentAttribute ||
                  (getValues("attributes")?.[index] as
                    | {
                        categoryAttributeId?: number;
                        id?: number;
                        value?: string;
                      }
                    | undefined);

                // Get categoryAttributeId from multiple sources - prioritize form state
                const currentCategoryAttributeId =
                  fallbackAttribute?.categoryAttributeId ??
                  (field as { categoryAttributeId?: number })
                    ?.categoryAttributeId ??
                  0;

                // Find the matching option - ensure proper type comparison
                // Try both string and number comparison to be safe
                const selectedAttributeOption =
                  currentCategoryAttributeId > 0 && attributeOptions.length > 0
                    ? attributeOptions.find(
                        (o) =>
                          Number(o.value) ===
                            Number(currentCategoryAttributeId) ||
                          o.value === String(currentCategoryAttributeId)
                      ) || null
                    : null;

                return (
                  <div
                    key={field.id || index}
                    className="grid grid-cols-4 gap-2"
                  >
                    <div className="col-span-1">
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
                            // Decide whether to keep existing id based on originalCategoryAttributeId
                            const originalCategoryAttributeId = getValues(
                              `attributes.${index}.originalCategoryAttributeId`
                            ) as number | undefined;
                            const existingId = getValues(
                              `attributes.${index}.id`
                            ) as number | undefined;
                            const shouldKeepId =
                              !!existingId &&
                              !!originalCategoryAttributeId &&
                              Number(originalCategoryAttributeId) ===
                                Number(categoryAttributeId);
                            setValue(
                              `attributes.${index}.categoryAttributeId`,
                              categoryAttributeId
                            );
                            // Keep id only if key unchanged; otherwise clear it
                            if (shouldKeepId) {
                              setValue(
                                `attributes.${index}.id`,
                                existingId as number
                              );
                            } else {
                              setValue(
                                `attributes.${index}.id`,
                                undefined as unknown as number
                              );
                            }
                          } else {
                            // Clear the selection
                            setValue(
                              `attributes.${index}.categoryAttributeId`,
                              0
                            );
                            setValue(
                              `attributes.${index}.id`,
                              undefined as unknown as number
                            );
                          }
                        }}
                      />
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <Input
                        {...register(`attributes.${index}.value`)}
                        placeholder="أدخل القيمة"
                        className="flex-1"
                      />
                      {attributeFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "", categoryAttributeId: 0 })}
                className="w-full"
              >
                إضافة خاصية
              </Button>
            </div>
          </div>
        )}

      {/* Pricing Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
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
              watchedPriceType !== undefined
                ? {
                    label:
                      watchedPriceType === 0
                        ? "سعر عادي"
                        : watchedPriceType === 1
                        ? "سعر مخفض"
                        : "سعر خاص",
                    value: watchedPriceType.toString(),
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
        <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
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
              watchedQuantityType !== undefined
                ? {
                    label:
                      watchedQuantityType === 0
                        ? "قطعة"
                        : watchedQuantityType === 1
                        ? "عبوة"
                        : watchedQuantityType === 2
                        ? "ليتر"
                        : watchedQuantityType === 3
                        ? "صندوق"
                        : "قطعة",
                    value: watchedQuantityType.toString(),
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
        <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
          معلومات الإنتاج
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            id="productionDate"
            label="تاريخ الإنتاج"
            placeholder="اختر تاريخ الإنتاج"
            value={watchedProductionDate}
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
        <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
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
        <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
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

      {/* Current Images Display */}
      {productData?.images && productData.images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الصور الحالية
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {productData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={
                    image.startsWith("http")
                      ? image
                      : `https://alsharq-api.phoenix-blog.net${image}`
                  }
                  alt={`Product ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          إضافة صور جديدة
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
              <p className="text-sm text-gray-600">اضغط لاختيار صور جديدة</p>
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
                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <Icons.image className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <span className="text-sm text-green-700 font-medium">
                    {image.name}
                  </span>
                  <span className="text-xs text-green-600 ml-2">
                    ({(image.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
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
          type="submit"
          disabled={updateProductMutation.isPending}
          className="capitalize"
        >
          {updateProductMutation.isPending ? "جاري التحديث..." : "تعديل منتج"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={updateProductMutation.isPending}
          className="capitalize"
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default EditProductForm;
