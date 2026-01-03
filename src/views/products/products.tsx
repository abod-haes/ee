import { useState, useRef } from "react";
import { Button } from "@/components/base/button";
import {
  Pagination as Pager,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/base/pagination";
import Dialog from "@/components/base/dialog";
import Table, { type Column } from "@/components/table/table";
import useBoolean from "@/hook/use-boolean";
import { Icons } from "@/lib/icons";
import { usePaginatedProducts, useDeleteProduct } from "@/hook/useProduct";
import { useCategories } from "@/hook/useCategory";
import type { Product } from "@/types/product.type";
import type { Category } from "@/types/category.type";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/base/input";
import { BaseSelect } from "@/components/base/select";
import { QRCodeCanvas } from "qrcode.react";

export default function Products() {
  const del = useBoolean(false);
  const gallery = useBoolean(false);
  const qrDialog = useBoolean(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  // Local pagination state
  const [page, setPage] = useState<number>(1);
  const limit = 10;
  const [search, setSearch] = useState<string>("");
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<
    number | undefined
  >(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(undefined);

  const { data, isLoading, error, refetch } = usePaginatedProducts({
    page,
    limit,
    text: search,
    categoryId: selectedCategoryId,
  });
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useCategories({ withChildren: true });

  // Filter parent categories (those with categoryId === null)
  const parentCategories = (categories || []).filter(
    (cat) => cat.categoryId === null || cat.categoryId === undefined
  );

  // Get children of selected parent category
  const selectedParentCategory = parentCategories.find(
    (cat) => cat.id === selectedParentCategoryId
  );
  const childCategories = selectedParentCategory?.children || [];
  const deleteProductMutation = useDeleteProduct();

  const toUrl = (src?: string) =>
    src && src.startsWith("http")
      ? src
      : src
      ? `https://alsharq-api.phoenix-blog.net${src}`
      : "";

  const openGallery = (images: string[], startIndex = 0) => {
    setGalleryImages(images);
    setCurrentImageIndex(Math.max(0, Math.min(startIndex, images.length - 1)));
    gallery.onTrue();
  };

  const handlePrevImage = () => {
    if (!galleryImages.length) return;
    setCurrentImageIndex(
      (idx) => (idx - 1 + galleryImages.length) % galleryImages.length
    );
  };

  const handleNextImage = () => {
    if (!galleryImages.length) return;
    setCurrentImageIndex((idx) => (idx + 1) % galleryImages.length);
  };

  const columns: Column<Product>[] = [
    {
      accessorKey: "name",
      header: "اسم المنتج",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {/* Image */}
          <div
            className={`w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 ${
              row.images && row.images.length > 0 ? "cursor-pointer" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              const imgs = (row.images || [])
                .map((s: string) => toUrl(s))
                .filter(Boolean);
              if (imgs.length === 0) return;
              openGallery(imgs, 0);
            }}
          >
            {row.images && row.images.length > 0 ? (
              <img
                src={toUrl(row.images[0])}
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
                row.images && row.images.length > 0 ? "hidden" : ""
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
      accessorKey: "category",
      header: "الصنف",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.category?.name || "-"}</div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "price",
      header: "السعر",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-green-600">{row.price} $</div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "netPrice",
      header: "السعر الصافي",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-blue-600">
          {row.netPrice} $
        </div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "quantity",
      header: "الكمية",
      cell: ({ row }) => {
        const quantityTypes = ["قطعة", "كيلوغرام", "ليتر", "متر", "صندوق"];
        return (
          <div className="text-sm text-(--silver)">
            {row.quantity} {quantityTypes[row.quantityType] || "قطعة"}
          </div>
        );
      },
      isRendering: true,
    },

    {
      accessorKey: "productionDate",
      header: "تاريخ الإنتاج",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {new Date(row.productionDate).toLocaleDateString("en-SA")}
        </div>
      ),
      isRendering: true,
    },
    // {
    //   accessorKey: "attributes",
    //   header: "الخصائص",
    //   cell: ({ row }) => {
    //     const attributes = row.attributes || [];
    //     if (attributes.length === 0) return "-";

    //     const displayAttributes = attributes.slice(0, 3);
    //     const hasMore = attributes.length > 3;

    //     return (
    //       <div className="flex flex-wrap gap-1 justify-center">
    //         {displayAttributes.map((attr: ProductAttribute, index: number) => (
    //           <span
    //             key={index}
    //             className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
    //           >
    //             {attr.key}: {attr.value}
    //           </span>
    //         ))}
    //         {hasMore && (
    //           <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
    //             +{attributes.length - 3} أكثر
    //           </span>
    //         )}
    //       </div>
    //     );
    //   },
    //   isRendering: true,
    // },
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
                navigate(`/products/edit/${row.slug}`);
              }}
              title="تعديل"
              className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <Icons.edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedProductSlug(row.slug);
                setSelectedProductName(row.name);
                qrDialog.onTrue();
              }}
              title="إنشاء رمز QR"
              className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 border border-purple-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <Icons.qrCode className="w-4 h-4" />
            </Button>
            <Button
              variant="contained"
              size="icon"
              onClick={() => {
                setSelectedProduct(row.id.toString());
                del.onTrue();
              }}
              title="حذف"
              className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <Icons.delete className="w-4 h-4" />
            </Button>
          </div>
        );
      },
      isRendering: true,
    },
  ];

  const scrollCategories = (direction: "left" | "right") => {
    if (!categoryScrollRef.current) return;

    const scrollAmount = 200; // Adjust scroll distance as needed
    const currentScroll = categoryScrollRef.current.scrollLeft;
    const newScroll =
      direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    categoryScrollRef.current.scrollTo({
      left: newScroll,
      behavior: "smooth",
    });
  };

  const handlePrintQR = () => {
    if (!qrRef.current) return;

    const qrCanvas = qrRef.current.querySelector("canvas");
    if (!qrCanvas) return;

    const qrImageUrl = qrCanvas.toDataURL();

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>طباعة رمز QR - ${selectedProductName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              direction: rtl;
              text-align: right;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .sticker {
              width: 5cm;
              height: 3cm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px solid #ddd;
              padding: 0.2cm;
              box-sizing: border-box;
            }
            h1 {
              margin: 0 0 0.2cm 0;
              color: #333;
              font-size: 10pt;
              text-align: center;
              line-height: 1.2;
              max-width: 100%;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .qr-container {
              width: 2cm;
              height: 2cm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              width: 2cm;
              height: 2cm;
              display: block;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body { 
                margin: 0 !important; 
                padding: 0 !important;
                background: white !important;
              }
              .no-print { display: none !important; }
              @page {
                margin: 0 !important;
                size: 5cm 3cm;
              }
              @page :first {
                margin: 0 !important;
              }
              @page :left {
                margin: 0 !important;
              }
              @page :right {
                margin: 0 !important;
              }
              @page :last {
                margin: 0 !important;
              }
              body::before,
              body::after {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <h1>${selectedProductName}</h1>
            <div class="qr-container">
              <img src="${qrImageUrl}" alt="QR Code" />
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Set the window title
    printWindow.document.title = `طباعة رمز QR - ${selectedProductName}`;

    // Wait for the document to fully load before printing
    printWindow.onload = () => {
      // Ensure the document is ready
      setTimeout(() => {
        printWindow.focus();

        // Create additional styles to force remove browser headers/footers
        const additionalStyle = printWindow.document.createElement("style");
        additionalStyle.textContent = `
          @media print {
            @page {
              margin: 0 !important;
              size: 5cm 3cm;
            }
            @page :first {
              margin: 0 !important;
            }
            @page :left {
              margin: 0 !important;
            }
            @page :right {
              margin: 0 !important;
            }
            @page :last {
              margin: 0 !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `;
        printWindow.document.head.appendChild(additionalStyle);

        // Try to remove browser headers/footers by setting print settings
        try {
          // Focus window and print
          printWindow.focus();
          printWindow.print();
        } catch {
          // Fallback to regular print
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 500);
        }
      }, 300);
    };

    // Add event listeners for better print handling
    printWindow.addEventListener("afterprint", function () {
      setTimeout(() => {
        printWindow.close();
      }, 100);
    });

    printWindow.addEventListener("beforeunload", function () {
      return undefined;
    });

    // Fallback: close window after 30 seconds if still open
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 30000);
  };

  const handleDeleteProduct = async () => {
    deleteProductMutation.mutate(selectedProduct, {
      onSuccess: () => {
        del.onFalse();
        refetch();
      },
      onError: () => {
        del.onFalse();
      },
    });
  };

  return (
    <>
      <div className="p-3.5 max-w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-(--silver) capitalize">
            قائمة المنتجات
          </h3>
        </div>
        {/* Category Tabs */}
        {!isCategoriesLoading && (
          <div className="mb-4 relative">
            <div className="flex items-center gap-2">
              {/* Right Arrow */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollCategories("right")}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all duration-300 hover:scale-105 flex items-center justify-center shrink-0"
              >
                <Icons.chevronRight className="w-4 h-4" />
              </Button>

              {/* Scrollable Categories */}
              <div
                ref={categoryScrollRef}
                className="overflow-x-auto no-scrollbar flex-1"
              >
                <div className="flex items-center gap-2 min-w-max">
                  <button
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      selectedParentCategoryId === undefined
                        ? "bg-(--primary-300) text-white border-(--primary-300)"
                        : "bg-white text-(--silver) border-gray-200 hover:bg-neutral-100"
                    }`}
                    onClick={() => {
                      setSelectedParentCategoryId(undefined);
                      setSelectedCategoryId(undefined);
                      setPage(1);
                    }}
                  >
                    الكل
                  </button>
                  {categoriesError ? (
                    <span className="text-sm text-red-500">
                      تعذر تحميل الأصناف
                    </span>
                  ) : (parentCategories?.length ?? 0) > 0 ? (
                    parentCategories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`px-4 py-2 rounded-md border transition-colors ${
                          selectedParentCategoryId === cat.id
                            ? "bg-(--primary-300) text-white border-(--primary-300)"
                            : "bg-white text-(--silver) border-gray-200 hover:bg-neutral-100"
                        }`}
                        onClick={() => {
                          setSelectedParentCategoryId(cat.id);
                          setSelectedCategoryId(undefined); // Reset child selection
                          setPage(1);
                        }}
                      >
                        {cat.name}
                      </button>
                    ))
                  ) : null}
                </div>
              </div>

              {/* Left Arrow */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollCategories("left")}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all duration-300 hover:scale-105 flex items-center justify-center shrink-0"
              >
                <Icons.chevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Category Loading State */}
        {isCategoriesLoading && (
          <div className="mb-4 flex items-center justify-center py-4">
            <span className="text-sm text-gray-500">جاري تحميل الأصناف...</span>
          </div>
        )}

        {/* Child Categories Select */}
        {selectedParentCategoryId && childCategories.length > 0 && (
          <div className="mb-4 md:max-w-xs">
            <BaseSelect
              label="الأصناف الفرعية"
              placeholder="اختر صنف فرعي (اختياري)"
              options={[
                { label: "الكل", value: "" },
                ...childCategories.map((child: Category) => ({
                  label: child.name,
                  value: child.id.toString(),
                })),
              ]}
              value={
                selectedCategoryId !== undefined
                  ? {
                      label:
                        childCategories.find(
                          (cat: Category) => cat.id === selectedCategoryId
                        )?.name || "الكل",
                      value: selectedCategoryId.toString(),
                    }
                  : { label: "الكل", value: "" }
              }
              onChange={(selectedOption) => {
                if (
                  selectedOption &&
                  !Array.isArray(selectedOption) &&
                  "value" in selectedOption
                ) {
                  const value = selectedOption.value;
                  if (value === "") {
                    setSelectedCategoryId(undefined);
                  } else {
                    setSelectedCategoryId(parseInt(value));
                  }
                  setPage(1);
                } else {
                  setSelectedCategoryId(undefined);
                  setPage(1);
                }
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <Input
            placeholder="ابحث عن منتج"
            value={search}
            className="w-full max-w-xs"
            preIcon={<Icons.search />}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            onClick={() => {
              navigate("/products/add");
            }}
            className="flex items-center gap-2"
          >
            إضافة منتج
            <Icons.add />
          </Button>
        </div>
        {isLoading ? (
          <p className="text-center text-gray-500 mt-8">جاري التحميل...</p>
        ) : error ? (
          <p className="text-center text-red-500 mt-8">
            حدث خطأ في تحميل المنتجات
          </p>
        ) : (data?.products?.length ?? 0) === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            لا يوجد منتجات حالياً لعرضها
          </p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <Table data={data?.products ?? []} columns={columns} />
            <Pager className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isLoading}
                  />
                </PaginationItem>
                {/* Condensed pages with ellipsis when > 4 */}
                {(() => {
                  const totalPages = data?.totalPages ?? 1;
                  const current = page;
                  const items: Array<number | string> = [];
                  if (totalPages <= 4) {
                    for (let i = 1; i <= totalPages; i++) items.push(i);
                  } else {
                    items.push(1);
                    const start = Math.max(2, current - 1);
                    const end = Math.min(totalPages - 1, current + 1);
                    if (start > 2) items.push("...");
                    for (let i = start; i <= end; i++) items.push(i);
                    if (end < totalPages - 1) items.push("...");
                    items.push(totalPages);
                  }
                  return items.map((it, idx) => (
                    <PaginationItem key={`${it}-${idx}`}>
                      {it === "..." ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={page === (it as number)}
                          onClick={() => setPage(it as number)}
                          disabled={isLoading}
                        >
                          {it}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ));
                })()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))
                    }
                    disabled={page >= (data?.totalPages ?? 1) || isLoading}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pager>
          </div>
        )}
      </div>

      <Dialog
        isOpen={del.value}
        onClose={del.onFalse}
        title="حذف المنتج"
        onSubmit={handleDeleteProduct}
        loading={deleteProductMutation.isPending}
        subtitle="هل انت متأكد من حذف المنتج؟"
      />

      {/* Image Gallery Dialog */}
      <Dialog isOpen={gallery.value} onClose={gallery.onFalse}>
        <div className="w-full">
          {galleryImages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              لا توجد صور لهذا المنتج
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full flex items-center justify-center">
                {galleryImages.length > 1 && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-(--silver) rounded-full p-2 shadow"
                    onClick={handlePrevImage}
                    title="السابق"
                  >
                    <Icons.chevronRight className="w-5 h-5" />
                  </button>
                )}
                <img
                  src={toUrl(galleryImages[currentImageIndex])}
                  alt={`image-${currentImageIndex + 1}`}
                  className="max-h-[60vh] w-auto h-auto rounded-md object-contain mx-auto"
                />
                {galleryImages.length > 1 && (
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-(--silver) rounded-full p-2 shadow"
                    onClick={handleNextImage}
                    title="التالي"
                  >
                    <Icons.chevronLeft className="w-5 h-5" />
                  </button>
                )}
              </div>
              {galleryImages.length > 1 && (
                <div className="w-full overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-2 min-w-max py-1">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={`${img}-${idx}`}
                        className={`border rounded-md overflow-hidden ${
                          idx === currentImageIndex
                            ? "border-(--primary-300)"
                            : "border-gray-200"
                        }`}
                        onClick={() => setCurrentImageIndex(idx)}
                        title={`صورة ${idx + 1}`}
                      >
                        <img
                          src={toUrl(img)}
                          alt={`thumb-${idx + 1}`}
                          className="object-cover w-20 h-14"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog isOpen={qrDialog.value} onClose={qrDialog.onFalse}>
        <div className="flex flex-col items-center gap-6 p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-(--silver) mb-2">
              {selectedProductName}
            </h2>
          </div>
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-lg border-2 border-gray-200"
          >
            <QRCodeCanvas
              value={selectedProductSlug}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <Button
            onClick={handlePrintQR}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Icons.printer className="w-4 h-4" />
            طباعة رمز QR
          </Button>
        </div>
      </Dialog>
    </>
  );
}
