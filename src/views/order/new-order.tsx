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

const orderSchema = z.object({
  doctorId: z.number().min(1, { message: "الطبيب مطلوب" }),
  email: z.string().email().optional().or(z.literal("")),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderProduct {
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
    setValue,
    watch,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      doctorId: undefined,
      email: "",
    },
  });

  const doctorId = watch("doctorId");
  const selectedDoctor = useMemo(() => {
    if (!doctorId) return undefined;
    return doctors.find((d) => d.id === doctorId);
  }, [doctors, doctorId]);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
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
      (p) => p.barcode && p.barcode === trimmedBarcode
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

  // Handle product notes change
  const handleNotesChange = useCallback((index: number, notes: string) => {
    setProducts((prev) => {
      const newProducts = [...prev];
      newProducts[index] = { ...newProducts[index], notes };
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
        label: `${p.name} - ${p.price} $`,
      })),
    [productsBrief]
  );

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

      await axiosInstance.post(`${API_BASE_URL}/orders`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("تم إنشاء الطلب بنجاح");
      onAdded();
      onClose();
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
        accessorKey: "name",
        header: "اسم المنتج",
        cell: ({ row }) => <div className="text-sm">{row.name}</div>,
        isRendering: true,
      },
      {
        accessorKey: "quantity",
        header: "الكمية",
        cell: ({ row }) => {
          const index = products.findIndex((p) => p.id === row.id);
          return (
            <Input
              key={`quantity-${row.id}`}
              type="number"
              min="1"
              defaultValue={row.quantity}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 1;
                if (value !== row.quantity) {
                  handleQuantityChange(index, value);
                }
              }}
              className="w-20"
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
            <Input
              type="number"
              step="0.01"
              value={row.price}
              disabled
              className="w-24"
            />
          );
        },
        isRendering: true,
      },
      {
        accessorKey: "notes",
        header: "ملاحظات",
        cell: ({ row }) => {
          const index = products.findIndex((p) => p.id === row.id);
          return (
            <Input
              key={`notes-${row.id}`}
              defaultValue={row.notes}
              onBlur={(e) => {
                const value = e.target.value;
                if (value !== row.notes) {
                  handleNotesChange(index, value);
                }
              }}
              placeholder="ملاحظات"
              className="w-40"
            />
          );
        },
        isRendering: true,
      },
      {
        accessorKey: "total",
        header: "الإجمالي",
        cell: ({ row }) => (
          <div className="text-sm font-medium">
            {(parseFloat(row.price) * row.quantity).toFixed(2)} $
          </div>
        ),
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
              className="text-red-500 hover:text-red-700"
            >
              <Icons.close />
            </Button>
          );
        },
        isRendering: true,
      },
    ],
    [products, handleQuantityChange, handleNotesChange, removeProduct]
  );

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

        {user && (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm text-gray-600 mb-1">اسم المستخدم</div>
            <div className="text-lg font-semibold text-gray-900">
              {user.fullName}
            </div>
          </div>
        )}

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
            onChange={(opt) => {
              if (opt && !Array.isArray(opt) && "value" in opt) {
                setValue("doctorId", parseInt(opt.value));
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
      <div className="space-y-4 ">
        <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
          مسح الباركود
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="barcode"
            label="الباركود"
            placeholder="امسح الباركود أو أدخله يدوياً ثم اضغط Enter"
            value={barcodeValue}
            onChange={handleBarcodeChange}
            onKeyDown={handleBarcodeKeyDown}
            disabled={isSubmitting}
            ref={barcodeInputRef}
            autoFocus
          />
          <BaseSelect
            label="اختيار منتج"
            placeholder="اختر منتج أو استخدم الباركود"
            options={productOptions}
            value={selectedProductOption}
            isDisabled={isLoadingProducts}
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

      {/* Products Table Section */}
      {products.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-(--silver) border-b pb-2">
            المنتجات
          </h3>

          <Table data={products} columns={productColumns} />
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button className="capitalize" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "جاري الإنشاء..." : "إنشاء طلب"}
        </Button>
        <Button
          className="capitalize"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
};

export default AddOrderForm;
