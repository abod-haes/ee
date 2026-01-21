import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/base/input";
import { Button } from "@/components/base/button";
import { BaseSelect, type Option } from "@/components/base/select";
import { useDoctors } from "@/hook/useDoctor";
import {
  getProductsBrief,
  type ProductBrief,
} from "@/services/product.service";
import { getMe } from "@/services/user.service";
import Table, { type Column } from "@/components/table/table";
import toast from "react-hot-toast";
import { Icons } from "@/lib/icons";
import axiosInstance from "@/lib/axios";
import { API_BASE_URL } from "@/api";
import { useNavigate } from "react-router-dom";

const orderSchema = z.object({
  doctorId: z.number().min(1, { message: "الطبيب مطلوب" }),
  email: z.string().optional(),
  discount: z.number().min(0, { message: "الخصم يجب أن يكون 0 أو أكثر" }),
  paid: z.number().min(0, { message: "المبلغ المدفوع يجب أن يكون 0 أو أكثر" }),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderProduct {
  rowIndex?: number;
  id: number;
  name: string;
  price: string;
  quantity: number;
  notes: string;
  quantityType?: number;
}

export type AddNewOrderProp = {
  onClose: () => void;
  onAdded: () => void;
};

const AddOrderForm = ({ onClose, onAdded }: AddNewOrderProp) => {
  const { data: doctors = [] } = useDoctors();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [productsBrief, setProductsBrief] = useState<ProductBrief[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [selectedProductOption, setSelectedProductOption] =
    useState<Option | null>(null);
  const [user, setUser] = useState<{
    fullName: string;
    email?: string;
    phone?: string;
    address?: string;
  } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeValue, setBarcodeValue] = useState("");

  const {
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    watch,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      doctorId: 0,
      email: "",
      discount: 0,
      paid: 0,
    },
  });

  const doctorId = watch("doctorId");
  const discountValue = Number(watch("discount") ?? 0);
  const paidValue = Number(watch("paid") ?? 0);
  const selectedDoctor = useMemo(() => {
    if (!doctorId) return undefined;
    return doctors.find((d) => d.id === doctorId);
  }, [doctors, doctorId]);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const userData = await getMe();
        setUser({
          fullName: userData.fullName,
          email: userData.email,
          phone: "-",
          address: userData?.address || "-",
        });
        setValue("email", userData.email || "");
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, [setValue]);

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

  // Auto-focus on barcode input
  useEffect(() => {
    // Use setTimeout to ensure the input is rendered
    const timer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const focusBarcodeInput = useCallback(() => {
    // A tiny retry loop makes focusing resilient to rerenders/layout
    requestAnimationFrame(() => {
      barcodeInputRef.current?.focus();
      requestAnimationFrame(() => barcodeInputRef.current?.focus());
    });
  }, []);

  // Re-focus after products finish loading (input used to be disabled during load)
  useEffect(() => {
    if (!isLoadingProducts) {
      focusBarcodeInput();
    }
  }, [isLoadingProducts, focusBarcodeInput]);

  const addProductToOrder = useCallback(
    (foundProduct: ProductBrief) => {
      setProducts((prev) => {
        const existingIndex = prev.findIndex((p) => p.id === foundProduct.id);
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

        toast.success(`تم إضافة ${foundProduct.name}`, {
          id: `order-product-${foundProduct.id}-add`,
        });
        return [
          ...prev,
          {
            id: foundProduct.id,
            name: foundProduct.name,
            price: foundProduct.price,
            quantity: 1,
            notes: "",
          },
        ];
      });
    },
    [setProducts]
  );

  // Search for product by barcode (called on Enter key)
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

      // Clear barcode input and refocus
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

  // Handle barcode input change
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };

  // Handle Enter key press
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchProductByBarcode();
    }
  };

  // Handle product quantity change
  const handleQuantityChange = useCallback(
    (index: number, quantity: number) => {
      if (quantity < 1) return;
      setProducts((prev) => {
        const newProducts = [...prev];
        newProducts[index] = { ...newProducts[index], quantity };
        return newProducts;
      });
    },
    []
  );

  // Handle product price change
  const handlePriceChange = useCallback((index: number, price: string) => {
    setProducts((prev) => {
      const newProducts = [...prev];
      newProducts[index] = { ...newProducts[index], price };
      return newProducts;
    });
  }, []);

  // Handle product notes change
  const handleNotesChange = useCallback((index: number, notes: string) => {
    setProducts((prev) => {
      const newProducts = [...prev];
      newProducts[index] = { ...newProducts[index], notes };
      return newProducts;
    });
  }, []);

  // Handle product total change - update price based on total and quantity
  const handleTotalChange = useCallback((index: number, total: number) => {
    if (total < 0) return;
    setProducts((prev) => {
      const newProducts = [...prev];
      const product = newProducts[index];
      if (product.quantity > 0) {
        // Calculate new price: price = total / quantity
        const newPrice = (total / product.quantity).toFixed(2);
        newProducts[index] = {
          ...product,
          price: newPrice,
        };
      }
      return newProducts;
    });
  }, []);

  // Remove product
  const removeProduct = useCallback((index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const doctorOptions: Option[] = doctors.map((d) => ({
    value: String(d.id),
    label: d.name,
  }));

  const productOptions: Option[] = useMemo(
    () =>
      productsBrief.map((p) => ({
        value: String(p.id),
        label: `${p.name}`,
      })),
    [productsBrief]
  );
    const navigate = useNavigate();

  const onSubmit = async (data: OrderFormData) => {
    if (products.length === 0) {
      toast.error("يجب إضافة منتج واحد على الأقل");
      return;
    }
    if (!user) {
      toast.error("جاري تحميل بيانات المستخدم...");
      return;
    }

    // Create form data with products
    const formData = new FormData();
    formData.append("phone", selectedDoctor?.phone?.trim() || "-");
    formData.append("address", selectedDoctor?.address?.trim() || "-");
    formData.append("fullName", user.fullName);
    formData.append("RepName", user.fullName);
    formData.append("doctorId", data.doctorId.toString());
    const discountNumber = Number(data.discount ?? 0) || 0;
    const paidNumber = Number(data.paid ?? 0) || 0;
    formData.append("discount", String(discountNumber));
    formData.append("totalPaid", String(paidNumber));
    if (user.email || data.email) {
      formData.append("email", user.email || data.email || "");
    }
    // Add products
    products.forEach((product, index) => {
      formData.append(`products[${index}][id]`, product.id.toString());
      formData.append(
        `products[${index}][quantity]`,
        product.quantity.toString()
      );
      formData.append(`products[${index}][price]`, product.price);
      formData.append(`products[${index}][notes]`, product.notes || "");
    });

    try {
      setIsSubmitting(true);

    const res =   await axiosInstance.post<{id: number}>(`${API_BASE_URL}/orders`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("تم إنشاء الطلب بنجاح");
      onAdded();
      onClose();
      navigate(`/orders/${res.data.id}`);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error("فشل في إنشاء الطلب، يرجى المحاولة مرة أخرى");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table columns for products
  const productColumns: Column<OrderProduct>[] = useMemo(
    () => [
      {
        accessorKey: "rowIndex",
        header: "#",
        cell: ({ row }) => (
          <span className="text-(--base-800)">{row.rowIndex}</span>
        ),
        isRendering: true,
      },
      {
        accessorKey: "name",
        header: "اسم المنتج",
        cell: ({ row }) => (
          <span className="text-(--base-800)">{row.name}</span>
        ),
        isRendering: true,
      },
      {
        accessorKey: "quantity",
        header: "الكمية",
        cell: ({ row }) => {
          return (
            <input
              key={`quantity-${row.id}`}
              type="number"
              min={1}
              step="any"
              className="w-24 px-2 py-1 border rounded"
              defaultValue={row.quantity}
              disabled={isSubmitting || isLoadingProducts || isLoadingUser}
              onBlur={(e) => {
                const index = products.findIndex((p) => p.id === row.id);
                const value = parseFloat(e.target.value) || 1;
                if (value >= 1 && value !== row.quantity) {
                  handleQuantityChange(index, value);
                }
              }}
            />
          );
        },
        isRendering: true,
      },
      {
        accessorKey: "price",
        header: "السعر",
        cell: ({ row }) => {
          return (
            <input
              key={`price-${row.id}`}
              type="number"
              min={0}
              step="any"
              className="w-28 px-2 py-1 border rounded"
              defaultValue={row.price}
              disabled={isSubmitting || isLoadingProducts || isLoadingUser}
              onBlur={(e) => {
                const index = products.findIndex((p) => p.id === row.id);
                const value = e.target.value;
                if (value !== row.price) {
                  handlePriceChange(index, value);
                }
              }}
            />
          );
        },
        isRendering: true,
      },
      {
        accessorKey: "notes",
        header: "ملاحظات",
        cell: ({ row }) => {
          return (
            <input
              key={`notes-${row.id}`}
              type="text"
              className="w-64 px-2 py-1 border rounded"
              defaultValue={row.notes}
              disabled={isSubmitting || isLoadingProducts || isLoadingUser}
              onBlur={(e) => {
                const index = products.findIndex((p) => p.id === row.id);
                const value = e.target.value;
                if (value !== row.notes) {
                  handleNotesChange(index, value);
                }
              }}
              placeholder="ملاحظات"
            />
          );
        },
        isRendering: true,
      },
      {
        accessorKey: "total",
        header: "الإجمالي",
        cell: ({ row }) => {
          const currentTotal = parseFloat(row.price) * row.quantity;
          return (
            <input
              key={`total-${row.id}-${row.price}-${row.quantity}`}
              type="number"
              min={0}
              step="any"
              className="w-28 px-2 py-1 border rounded text-sm font-medium"
              defaultValue={currentTotal.toFixed(2)}
              disabled={isSubmitting || isLoadingProducts || isLoadingUser}
              onBlur={(e) => {
                const index = products.findIndex((p) => p.id === row.id);
                const value = parseFloat(e.target.value) || 0;
                if (value >= 0 && value !== currentTotal) {
                  handleTotalChange(index, value);
                }
              }}
            />
          );
        },
        isRendering: true,
      },
      {
        accessorKey: "actions",
        header: "أفعال",
        cell: ({ row }) => {
          const index = products.findIndex((p) => p.id === row.id);
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeProduct(index)}
              disabled={isSubmitting || isLoadingProducts || isLoadingUser}
              className="text-red-500 hover:text-red-700"
            >
              <Icons.close />
            </Button>
          );
        },
        isRendering: true,
      },
    ],
    [
      products,
      handleQuantityChange,
      handlePriceChange,
      handleNotesChange,
      handleTotalChange,
      removeProduct,
      isSubmitting,
      isLoadingProducts,
      isLoadingUser,
    ]
  );

  const productsTableData: OrderProduct[] = useMemo(
    () => products.map((p, idx) => ({ ...p, rowIndex: idx + 1 })),
    [products]
  );

  // Totals summary values (live)
  const subtotal = useMemo(() => {
    return products.reduce((sum, p) => {
      const price = Number.parseFloat(String(p.price ?? "0"));
      const safePrice = Number.isFinite(price) ? price : 0;
      const qty = Number(p.quantity ?? 0);
      const safeQty = Number.isFinite(qty) ? qty : 0;
      return sum + safePrice * safeQty;
    }, 0);
  }, [products]);
  const totalAfterDiscount = Math.max(subtotal - discountValue, 0);
  const remaining = Math.max(totalAfterDiscount - Math.max(paidValue, 0), 0);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
      className="w-full mt-4 space-y-4"
      suppressHydrationWarning
    >
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">
          المعلومات الأساسية
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseSelect
            label="الطبيب"
            placeholder="اختر الطبيب"
            options={doctorOptions}
            value={
              doctorId
                ? doctorOptions.find((o) => o.value === String(doctorId))
                : null
            }
            isDisabled={isSubmitting || isLoadingUser}
            onChange={(opt) => {
              if (opt && !Array.isArray(opt) && "value" in opt) {
                setValue("doctorId", parseInt(opt.value), {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });
              } else {
                setValue("doctorId", 0, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }
            }}
            error={
              errors.doctorId?.message ||
              (errors.doctorId?.type === "invalid_type"
                ? "الطبيب مطلوب"
                : undefined)
            }
          />
        </div>
      </div>

      {/* Barcode Scanner Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">مسح الباركود</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="barcode"
            label="الباركود او QR"
            placeholder="امسح الباركود أو QR"
            value={barcodeValue}
            onChange={handleBarcodeChange}
            onKeyDown={handleBarcodeKeyDown}
            disabled={isSubmitting || isLoadingProducts || isLoadingUser}
            ref={barcodeInputRef}
            autoFocus
          />
          <BaseSelect
            label="اختيار منتج"
            placeholder="اختر منتج أو استخدم الباركود"
            options={productOptions}
            value={selectedProductOption}
            isDisabled={isSubmitting || isLoadingProducts || isLoadingUser}
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

              // Clear selection and refocus barcode input
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
          placeholder="0"
          type="number"
          min="0"
          step="0.01"
          defaultValue={0}
          disabled={isSubmitting || isLoadingUser}
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
          placeholder="0"
          type="number"
          min="0"
          step="0.01"
          defaultValue={0}
          disabled={isSubmitting || isLoadingUser}
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
      {/* Products Table Section */}
      {products.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">منتجات الطلب</h3>

          <Table data={productsTableData} columns={productColumns} />

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
                    {Math.max(paidValue, 0).toFixed(2)} $
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
          disabled={isSubmitting || isLoadingProducts || isLoadingUser}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Icons.add className="w-4 h-4" />
              إنشاء طلب
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting || isLoadingProducts || isLoadingUser}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default AddOrderForm;
