import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, type OrderSchemaType } from "@/lib/schema";
import { Input } from "@/components/base/input";
import { Button } from "@/components/base/button";
import { BaseSelect, type Option } from "@/components/base/select";
import { useOrder, useUpdateOrder } from "@/hook/useOrder";
import { Icons } from "@/lib/icons";
import Table, { type Column } from "@/components/table/table";
import { quantityTypes } from "@/constant/quantity-types";
import {
  getProductsBrief,
  type ProductBrief,
} from "@/services/product.service";
import toast from "react-hot-toast";

export type EditOrderProp = {
  id: string;
  onClose: () => void;
  onAdded: () => void;
};

type OrderProductEditRow = {
  id: number; // cart_product id (0 for new products)
  productId?: number; // actual product id (for new products)
  quantity: number;
  notes: string;
  price: number;
  productName: string;
  quantityType: number;
};

const EditOrderForm = ({ id, onClose, onAdded }: EditOrderProp) => {
  const [products, setProducts] = useState<OrderProductEditRow[]>([]);
  const [productsBrief, setProductsBrief] = useState<ProductBrief[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedProductOption, setSelectedProductOption] =
    useState<Option | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeValue, setBarcodeValue] = useState("");

  const {
    data: orderData,
    isLoading: isLoadingOrder,
    error: orderError,
    refetch: refetchOrder,
  } = useOrder(Number(id));
  const updateOrderMutation = useUpdateOrder();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<OrderSchemaType>({
    resolver: zodResolver(orderSchema),
  });

  // Load products brief
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const productsData = await getProductsBrief();
        setProductsBrief(productsData);
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("فشل في تحميل المنتجات");
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Reset form when order data is loaded
  useEffect(() => {
    if (orderData) {
      reset({
        discount: orderData.discount || 0,
        paid: orderData.totalPaid || 0,
      });
      // Set cart products
      if (orderData.cartProducts) {
        const formattedProducts: OrderProductEditRow[] =
          orderData.cartProducts.map((cp) => ({
            id: cp.productId,
            quantity: cp.quantity || 0,
            notes: cp.notes || "",
            price: cp.productPrice || 0,
            productName: cp?.product?.name || "",
            quantityType: cp?.product?.quantityType || 0,
          }));
        // Defer state update to avoid synchronous setState inside effect (React Compiler rule)
        setTimeout(() => setProducts(formattedProducts), 0);
      }
    }
  }, [orderData, reset]);

  const onSubmit = async (data: OrderSchemaType) => {
    const updateData = {
      discount: data.discount,
      paid: data.paid,
      products: products.map((p) => ({
        id: p.id === 0 && p.productId ? p.productId : p.id, // Use productId for new products
        quantity: p.quantity,
        notes: p.notes,
        price: p.price,
      })),
    };

    updateOrderMutation.mutate(
      { id: Number(id), orderData: updateData },
      {
        onSuccess: () => {
          // Refetch the order data to get the updated information
          setTimeout(() => {
            refetchOrder();
          }, 500); // Small delay to ensure API has processed the update
          onAdded();
          onClose();
        },
      }
    );
  };

  const focusBarcodeInput = useCallback(() => {
    requestAnimationFrame(() => {
      barcodeInputRef.current?.focus();
      requestAnimationFrame(() => barcodeInputRef.current?.focus());
    });
  }, []);

  const addProductToOrder = useCallback((foundProduct: ProductBrief) => {
    setProducts((prev) => {
      const existingIndex = prev.findIndex(
        (p) => p.productName === foundProduct.name
      );
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        toast.success(`تم زيادة الكمية لـ ${foundProduct.name}`, {
          id: `order-product-${foundProduct.id}-inc`,
        });
        return next;
      }

      // Add new product (id will be 0 for new products, will be set by backend)
      toast.success(`تم إضافة ${foundProduct.name}`, {
        id: `order-product-${foundProduct.id}-add`,
      });
      return [
        ...prev,
        {
          id: 0, // New product, backend will assign proper cart_product id
          productId: foundProduct.id, // Store actual product id for new products
          quantity: 1,
          notes: "",
          price: Number(foundProduct.price),
          productName: foundProduct.name,
          quantityType: 0, // Will be updated from backend after save
        },
      ];
    });
  }, []);

  const searchProductByBarcode = useCallback(() => {
    if (isLoadingProducts || productsBrief.length === 0) {
      toast("جاري تحميل المنتجات...");
      focusBarcodeInput();
      return;
    }
    if (!barcodeValue || !barcodeValue.trim()) {
      return;
    }

    const trimmedBarcode = barcodeValue.trim();
    const foundProduct = productsBrief.find(
      (p) =>
        (p.barcode && p.barcode === trimmedBarcode) ||
        (p?.slug && p.slug === trimmedBarcode)
    );

    if (foundProduct) {
      addProductToOrder(foundProduct);
      setBarcodeValue("");
      focusBarcodeInput();
    } else {
      toast.error("المنتج غير موجود", { id: `order-product-notfound` });
    }
  }, [
    barcodeValue,
    productsBrief,
    addProductToOrder,
    focusBarcodeInput,
    isLoadingProducts,
  ]);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchProductByBarcode();
    }
  };

  const handleProductChange = useCallback(
    <K extends keyof OrderProductEditRow>(
      index: number,
      field: K,
      value: OrderProductEditRow[K]
    ) => {
      setProducts((prev) => {
        const newProducts = [...prev];
        newProducts[index] = {
          ...newProducts[index],
          [field]: value,
        };
        return newProducts;
      });
    },
    []
  );

  // Handle product total change - update price based on total and quantity
  const handleTotalChange = useCallback((index: number, total: number) => {
    if (total < 0) return;
    setProducts((prev) => {
      const newProducts = [...prev];
      const product = newProducts[index];
      if (product.quantity > 0) {
        // Calculate new price: price = total / quantity
        const newPrice = total / product.quantity;
        newProducts[index] = {
          ...product,
          price: newPrice,
        };
      }
      return newProducts;
    });
  }, []);

  const removeProduct = useCallback((index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  type ProductRow = {
    rowIndex: number;
    id: number;
    productName: string;
    quantity: number;
    price: number;
    notes: string;
    quantityType: number;
  };

  const productOptions: Option[] = useMemo(
    () =>
      productsBrief.map((p) => ({
        value: String(p.id),
        label: `${p.name}`,
      })),
    [productsBrief]
  );

  // Totals summary values (live as user edits discount/paid)
  const subtotal = Number(orderData?.total || 0);
  const discountValue = Number(useWatch({ control, name: "discount" }) ?? 0);
  const paidValue = Number(useWatch({ control, name: "paid" }) ?? 0);
  const totalAfterDiscount = Math.max(subtotal - discountValue, 0);
  const remaining = Math.max(totalAfterDiscount - Math.max(paidValue, 0), 0);

  const productsTableData: ProductRow[] = useMemo(
    () =>
      products.map((p, idx) => ({
        ...p,
        rowIndex: idx + 1,
      })),
    [products]
  );

  const productColumns: Column<ProductRow>[] = useMemo(
    () => [
      {
        accessorKey: "rowIndex",
        header: "#",
        isRendering: true,
        cell: ({ row }) => (
          <span className="text-(--base-800)">{row.rowIndex}</span>
        ),
      },
      {
        accessorKey: "productName",
        header: "المنتج",
        isRendering: true,
        cell: ({ row }) => (
          <span className="text-(--base-800)">{row.productName}</span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "الكمية",
        isRendering: true,
        cell: ({ row }) => {
          return (
            <input
              key={`quantity-${row.id}-${row.productName}`}
              type="number"
              min={1}
              step="any"
              className="w-24 px-2 py-1 border rounded"
              defaultValue={row.quantity}
              onBlur={(e) => {
                const index = products.findIndex((p) => p.id === row.id);
                const value = Number(e.target.value);
                if (value >= 1 && value !== row.quantity) {
                  handleProductChange(index, "quantity", value);
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "price",
        header: "السعر",
        isRendering: true,
        cell: ({ row }) => {
          return (
            <input
              key={`price-${row.id}-${row.productName}`}
              type="number"
              min={0}
              step={0.00001}
              className="w-28 px-2 py-1 border rounded"
              defaultValue={row.price}
              onBlur={(e) => {
                const index = products.findIndex((p) => p.id === row.id);
                const value = Number(e.target.value);
                if (value !== row.price) {
                  handleProductChange(index, "price", value);
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "quantityType",
        header: "نوع الكمية",
        isRendering: true,
        cell: ({ row }) => {
          return (
            <span className="text-(--base-800)">
              {
                quantityTypes.find((q) => q.value === String(row.quantityType))
                  ?.label
              }
            </span>
          );
        },
      },
      {
        accessorKey: "notes",
        header: "ملاحظات",
        isRendering: true,
        cell: ({ row }) => {
          return (
            <input
              key={`notes-${row.id}-${row.productName}`}
              type="text"
              className="w-64 px-2 py-1 border rounded"
              defaultValue={row.notes}
              onBlur={(e) => {
                const index = products.findIndex((p) => p.id === row.id);
                const value = e.target.value;
                if (value !== row.notes) {
                  handleProductChange(index, "notes", value);
                }
              }}
              placeholder="ملاحظات إضافية"
            />
          );
        },
      },
      {
        accessorKey: "total",
        header: "الإجمالي",
        isRendering: true,
        cell: ({ row }) => {
          const currentTotal = row.quantity * row.price;
          return (
            <input
              key={`total-${row.id}-${row.productName}-${row.price}-${row.quantity}`}
              type="number"
              min={0}
              step="any"
              className="w-28 px-2 py-1 border rounded font-medium"
              defaultValue={currentTotal.toFixed(2)}
              disabled={updateOrderMutation.isPending}
              onBlur={(e) => {
                const index = products.findIndex(
                  (p) => p.id === row.id && p.productName === row.productName
                );
                const value = Number(e.target.value) || 0;
                if (value >= 0 && value !== currentTotal) {
                  handleTotalChange(index, value);
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "actions",
        header: "أفعال",
        isRendering: true,
        cell: ({ row }) => {
          const index = products.findIndex(
            (p) => p.id === row.id && p.productName === row.productName
          );
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeProduct(index)}
              disabled={updateOrderMutation.isPending}
              className="text-red-500 hover:text-red-700"
            >
              <Icons.close />
            </Button>
          );
        },
      },
    ],
    [
      products,
      handleProductChange,
      handleTotalChange,
      removeProduct,
      updateOrderMutation.isPending,
    ]
  );

  if (isLoadingOrder) {
    return (
      <div className="w-full mt-4 text-center">جاري تحميل بيانات الطلب...</div>
    );
  }

  if (orderError) {
    return (
      <div className="w-full mt-4 text-center">
        <p className="text-red-500">حدث خطأ في تحميل بيانات الطلب</p>
        <p className="text-xs text-gray-400 mt-1">
          Error: {orderError?.message || "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
      className="w-full mt-4 space-y-4"
    >
      {/* Barcode Scanner Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">إضافة منتجات</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="barcode"
            label="الباركود او QR"
            placeholder="امسح الباركود أو QR"
            value={barcodeValue}
            onChange={handleBarcodeChange}
            onKeyDown={handleBarcodeKeyDown}
            disabled={updateOrderMutation.isPending || isLoadingProducts}
            ref={barcodeInputRef}
          />
          <BaseSelect
            label="اختيار منتج"
            placeholder="اختر منتج أو استخدم الباركود"
            options={productOptions}
            value={selectedProductOption}
            isDisabled={updateOrderMutation.isPending || isLoadingProducts}
            isClearable
            onChange={(opt) => {
              if (!opt || Array.isArray(opt) || !("value" in opt)) {
                setSelectedProductOption(null);
                focusBarcodeInput();
                return;
              }

              setSelectedProductOption(opt);
              const productId = parseInt(opt.value);
              const foundProduct = productsBrief.find(
                (p) => p.id === productId
              );
              if (foundProduct) {
                addProductToOrder(foundProduct);
              } else {
                toast.error("المنتج غير موجود");
              }

              setSelectedProductOption(null);
              focusBarcodeInput();
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="discount"
          label="الخصم"
          type="number"
          step="0.01"
          placeholder="أدخل الخصم"
          {...register("discount", {
            setValueAs: (v) => {
              if (v === "" || v === null || v === undefined) return 0;
              const num = Number(v);
              return Number.isFinite(num) ? num : 0;
            },
          })}
          error={errors.discount?.message}
        />

        <Input
          id="paid"
          label="المبلغ المدفوع "
          type="number"
          step="0.01"
          placeholder="أدخل المبلغ المدفوع"
          {...register("paid", {
            setValueAs: (v) => {
              if (v === "" || v === null || v === undefined) return 0;
              const num = Number(v);
              return Number.isFinite(num) ? num : 0;
            },
          })}
          error={errors.paid?.message}
        />
      </div>

      {/* Products Section */}
      {products.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">منتجات الطلب</h3>
          <Table<ProductRow>
            data={productsTableData}
            columns={productColumns}
          />
          <div className="mt-4 ml-auto w-full max-w-md">
            <div className="rounded-lg border border-(--base-200) bg-white shadow-sm p-4">
              <div className="text-sm text-(--base-500) mb-2">
                ملخص الفاتورة
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-(--base-600)">المجموع الفرعي</span>
                  <span className="font-semibold text-(--base-900)">
                    {subtotal.toFixed(2)} $
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-(--base-200) pt-2">
                  <span className="text-(--base-600)">الخصم</span>
                  <span className="font-semibold text-red-600">
                    -{discountValue.toFixed(2)} $
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-(--base-200) pt-2">
                  <span className="text-(--base-600)">الإجمالي بعد الخصم</span>
                  <span className="font-semibold text-(--base-900)">
                    {totalAfterDiscount.toFixed(2)} $
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-(--base-200) pt-2">
                  <span className="text-(--base-600)">المدفوع</span>
                  <span className="font-semibold text-green-600">
                    {paidValue.toFixed(2)} $
                  </span>
                </div>
                <div className="flex items-center justify-between text-xl border-t border-(--base-200) pt-2">
                  <span className="text-(--base-600)">المتبقي</span>
                  <span className="font-semibold text-red-600">
                    {remaining.toFixed(2)} $
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={updateOrderMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateOrderMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري التحديث...
            </>
          ) : (
            <>
              <Icons.edit className="w-4 h-4" />
              تحديث الطلب
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={updateOrderMutation.isPending}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default EditOrderForm;
