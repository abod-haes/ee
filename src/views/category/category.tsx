import { useState } from "react";
import { Button } from "@/components/base/button";
import Dialog from "@/components/base/dialog";
import Table, { type Column } from "@/components/table/table";
import useBoolean from "@/hook/use-boolean";
import { Icons } from "@/lib/icons";
import AddCategoryForm from "./new-category";
import EditCategoryForm from "./category-detail";
import { useCategoryManagement } from "@/hook/useCategory";
import type { Category, CategoryAttribute } from "@/types/category.type";

export default function CategorySection() {
  const del = useBoolean(false);
  const edit = useBoolean(false);
  const add = useBoolean(false);
  // const date = useBoolean(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  // Use the new category management hook
  const { categories, isLoading, error, deleteCategory, isDeleting, refetch } =
    useCategoryManagement({ withChildren: true });

  const columns: Column<Category>[] = [
    {
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {/* Image */}
          <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
            {row.image && row.image.trim() !== "" ? (
              <img
                src={
                  row.image.startsWith("http")
                    ? row.image
                    : `https://alsharq-api.phoenix-blog.net${row.image}`
                }
                alt={row.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide the image and show fallback
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
            ) : null}
            <div
              className={`w-full h-full flex items-center justify-center text-gray-400 text-xs ${
                row.image && row.image.trim() !== "" ? "hidden" : ""
              }`}
            >
              <Icons.image className="w-5 h-5" />
            </div>
          </div>
          {/* Name */}
          <div className="font-medium text-(--silver)">{row.name}</div>
        </div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "attributes",
      header: "الخصائص",
      cell: ({ row }) => {
        const attributes = row.attributes || [];
        if (attributes.length === 0) return "-";

        const displayAttributes = attributes.slice(0, 4);
        const hasMore = attributes.length > 4;

        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {displayAttributes.map((attr: CategoryAttribute, index: number) => (
              <span
                key={attr.id || index}
                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {attr.name}
              </span>
            ))}
            {hasMore && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{attributes.length - 4} أكثر
              </span>
            )}
          </div>
        );
      },
      isRendering: true,
    },
    {
      accessorKey: "actions",
      header: "أفعال",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedCategorySlug(row.slug.toString());
                setSelectedCategory(row.id.toString());
                edit.onTrue();
              }}
              title="تعديل"
            >
              <Icons.edit />
            </Button>
            <Button
              variant="contained"
              size="icon"
              onClick={() => {
                setSelectedCategorySlug(row.slug.toString());
                setSelectedCategory(row.id.toString());
                del.onTrue();
              }}
              title="حذف"
            >
              <Icons.delete />
            </Button>
          </div>
        );
      },
      isRendering: true,
    },
  ];

  const handleDeleteCategory = async () => {
    deleteCategory(selectedCategorySlug);
    del.onFalse();
  };
  return (
    <>
      <div className="p-3.5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-(--silver) capitalize">
            قائمة الأقسام
          </h3>

          <Button size="contained" variant="contained" onClick={add.onTrue}>
            إضافة صنف <Icons.add />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 mt-8">جاري التحميل...</p>
        ) : error ? (
          <p className="text-center text-red-500 mt-8">
            حدث خطأ في تحميل الأقسام
          </p>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            لا يوجد أقسام حالياً لعرضها
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table data={categories} columns={columns} />
          </div>
        )}
      </div>
      <Dialog
        isOpen={del.value}
        onClose={del.onFalse}
        title="حذف الصنف"
        onSubmit={handleDeleteCategory}
        loading={isDeleting}
        subtitle="هل انت متأكد من حذف الصنف"
      />
      <Dialog
        isOpen={add.value}
        onClose={add.onFalse}
        title="إضافة صنف جديد"
        cta="إضافة صنف"
      >
        <AddCategoryForm onAdded={refetch} onClose={add.onFalse} />
      </Dialog>

      <Dialog
        isOpen={edit.value}
        onClose={edit.onFalse}
        title="تعديل الصنف"
        cta="تعديل الصنف"
      >
        <EditCategoryForm
          onAdded={refetch}
          onClose={edit.onFalse}
          id={selectedCategory}
          slug={selectedCategorySlug}
        />
      </Dialog>
    </>
  );
}
