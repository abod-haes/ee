import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Table, { type Column } from "@/components/table/table";
import { Button } from "@/components/base/button";
import useBoolean from "@/hook/use-boolean";
import { getAllOrders } from "@/services/order.service";
import { BaseSelect, type Option } from "@/components/base/select";
import { DatePicker } from "@/components/base/date-picker";
import { useDoctors } from "@/hook/useDoctor";
import { useUserManagement } from "@/hook/useUser";
import {
  type Order as OrderType,
  type OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/types/order.type";
import { Icons } from "@/lib/icons";
import { getPaginatedProducts } from "@/services/product.service";
import PrintOrderButton from "@/components/order/print-order-button";
import Dialog from "@/components/base/dialog";
import { useDeleteOrder } from "@/hook/useOrder";

const STATUS_CODE_MAP: Array<{ code: string; status: OrderStatus }> = [
  { code: "0", status: "pending" },
  { code: "1", status: "paid" },
  { code: "2", status: "half-paid" },
  { code: "3", status: "unpaid" },
];

export default function Order() {
  const loading = useBoolean(false);
  const del = useBoolean(false);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const navigate = useNavigate();
  const { data: doctors = [] } = useDoctors();
  const { users } = useUserManagement();
  const [productOptions, setProductOptions] = useState<Option[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productPagination, setProductPagination] = useState({
    page: 0,
    totalPages: 1,
  });
  const deleteOrderMutation = useDeleteOrder();

  const doctorOptions: Option[] = useMemo(
    () => doctors.map((d) => ({ value: String(d.id), label: d.name })),
    [doctors]
  );

  const repOptions: Option[] = useMemo(() => {
    return users
      .filter((u) => {
        const t = String(u.UserType || "").toLowerCase();
        return (
          t.includes("Rep") ||
          t.includes("Rep_DataEntry") ||
          t.includes("rep") ||
          t.includes("rep_dataEntry") ||
          t.includes("rep_b") ||
          t.includes("Rep_B") ||
          t === "2" ||
          t === "5"
        );
      })
      .map((u) => ({ value: String(u.id), label: u.fullName }));
  }, [users]);

  const statusOptions: Option[] = useMemo(() => {
    return STATUS_CODE_MAP.map(({ code, status }) => ({
      value: code,
      label: ORDER_STATUS_LABELS[status],
    }));
  }, []);

  const fetchProducts = useCallback(async (page: number) => {
    try {
      setIsLoadingProducts(true);
      const {
        products,
        page: currentPage,
        totalPages,
      } = await getPaginatedProducts({
        page,
        limit: 20,
      });

      setProductOptions((prev) => {
        const mapped = products.map((product) => ({
          value: String(product.id),
          label: product.name,
        }));

        if (page === 1) {
          return mapped;
        }

        const existingIds = new Set(prev.map((opt) => opt.value));
        const filtered = mapped.filter((opt) => !existingIds.has(opt.value));
        return [...prev, ...filtered];
      });

      setProductPagination({
        page: currentPage,
        totalPages,
      });
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleLoadMoreProducts = useCallback(() => {
    if (productPagination.page >= productPagination.totalPages) return;
    if (isLoadingProducts) return;
    fetchProducts(productPagination.page + 1);
  }, [
    fetchProducts,
    isLoadingProducts,
    productPagination.page,
    productPagination.totalPages,
  ]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [filters, setFilters] = useState<{
    doctorId: string;
    userId: string;
    productId: string;
    status: string;
    date: string;
  }>({
    doctorId: "",
    userId: "",
    productId: "",
    status: "",
    date: getTodayDate(),
  });

  const applyFilters = useCallback(async () => {
    const params: Record<string, string | number | undefined> = {};
    if (filters.doctorId) params.doctorId = Number(filters.doctorId);
    if (filters.userId) params.userId = Number(filters.userId);
    if (filters.productId) params.productId = Number(filters.productId);
    if (filters.status) params.status = Number(filters.status);
    if (filters.date) params.date = filters.date;

    try {
      loading.onTrue();
      const data = await getAllOrders(params);
      setOrders(data);
    } finally {
      loading.onFalse();
    }
  }, [filters, loading]);

  const resetFilters = async () => {
    setFilters({
      doctorId: "",
      userId: "",
      productId: "",
      status: "",
      date: "",
    });
    // Apply filters with today's date
    const params: Record<string, string | number | undefined> = {
      date: getTodayDate(),
    };
    try {
      loading.onTrue();
      const data = await getAllOrders(params);
      setOrders(data);
    } finally {
      loading.onFalse();
    }
  };

  // Listen for live orders updates dispatched from layout and refetch using current filters
  useEffect(() => {
    const onOrdersUpdated = () => {
      applyFilters();
    };
    window.addEventListener("orders-updated", onOrdersUpdated);
    return () => window.removeEventListener("orders-updated", onOrdersUpdated);
  }, [applyFilters]);

  const handleDeleteOrder = async () => {
    deleteOrderMutation.mutate(selectedOrderId, {
      onSuccess: () => {
        del.onFalse();
        applyFilters(); // Refresh the list after deletion
      },
    });
  };

  const columns: Column<OrderType>[] = [
    {
      accessorKey: "id",
      header: "رقم الطلب",
      cell: ({ row }) => <div className="text-sm font-medium ">#{row.id}</div>,
      isRendering: true,
    },
    {
      accessorKey: "RepName",
      header: "اسم المندوب",
      cell: ({ row }) => <div className="text-sm ">{row.RepName}</div>,
      isRendering: true,
    },
    {
      accessorKey: "doctor",
      header: "الطبيب",
      cell: ({ row }) => (
        <div className="text-sm ">{row.doctor?.name || "-"}</div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "phone",
      header: "رقم الهاتف",
      cell: ({ row }) => <div className="text-sm ">{row.phone}</div>,
      isRendering: true,
    },
    {
      accessorKey: "address",
      header: "العنوان",
      cell: ({ row }) => (
        <div className="text-sm  max-w-xs truncate" title={row.address}>
          {row.address}
        </div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const statusKey = row.status as OrderStatus;
        const label =
          ORDER_STATUS_LABELS[statusKey] || row.status || "غير معروف";
        const colorClass =
          ORDER_STATUS_COLORS[statusKey] || "bg-gray-100 text-gray-800";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
          >
            {label}
          </span>
        );
      },
      isRendering: true,
    },
    {
      accessorKey: "paid",
      header: "المبلغ المدفوع",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-green-600">
          {row.totalPaid} $
        </div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "discount",
      header: "الخصم",
      cell: ({ row }) => <div className="text-sm ">{row.discount}</div>,
      isRendering: true,
    },
    {
      accessorKey: "rest",
      header: "المبلغ المتبقي",
      cell: ({ row }) => <div className="text-sm ">${row.rest}</div>,
      isRendering: true,
    },
    {
      accessorKey: "actions",
      header: "أفعال",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigate(`/orders/${row.id}`);
            }}
            title="تعديل"
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          >
            <Icons.edit className="w-4 h-4" />
          </Button>

          <PrintOrderButton
            orderId={row.id}
            variant="outline"
            size="icon"
            title="طباعة"
            aria-label="طباعة"
            className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 border border-green-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          >
            <Icons.printer className="w-4 h-4" />
          </PrintOrderButton>

          <Button
            variant="contained"
            size="icon"
            onClick={() => {
              setSelectedOrderId(row.id.toString());
              del.onTrue();
            }}
            title="حذف"
            className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          >
            <Icons.delete className="w-4 h-4" />
          </Button>
        </div>
      ),
      isRendering: true,
    },
  ];

  useEffect(() => {
    // Apply filters with today's date on initial load
    const params: Record<string, string | number | undefined> = {
      date: getTodayDate(),
    };
    const loadInitialOrders = async () => {
      try {
        loading.onTrue();
        const data = await getAllOrders(params);
        setOrders(data);
      } finally {
        loading.onFalse();
      }
    };
    loadInitialOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Dialog
        isOpen={del.value}
        onClose={del.onFalse}
        title="حذف الطلب"
        head="هل أنت متأكد من حذف هذا الطلب؟"
        subtitle="لا يمكن التراجع عن هذا الإجراء"
        onSubmit={handleDeleteOrder}
        cta="حذف"
      />

      <div className="p-3.5">
        <h3 className="text-lg font-semibold text-gray-700 capitalize mb-6">
          قائمة الطلبات
        </h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
          <BaseSelect
            label="الطبيب"
            placeholder="اختر طبيب"
            options={doctorOptions}
            value={
              doctorOptions.find((o) => o.value === filters.doctorId) || null
            }
            onChange={(opt) =>
              setFilters((f) => ({
                ...f,
                doctorId: (opt as Option | null)?.value ?? "",
              }))
            }
          />
          <BaseSelect
            label="المندوب"
            placeholder="اختر مندوب"
            options={repOptions}
            value={repOptions.find((o) => o.value === filters.userId) || null}
            onChange={(opt) =>
              setFilters((f) => ({
                ...f,
                userId: (opt as Option | null)?.value ?? "",
              }))
            }
          />
          <BaseSelect
            label="الحالة"
            placeholder="اختر الحالة"
            options={statusOptions}
            value={
              filters.status
                ? statusOptions.find((o) => o.value === filters.status) || null
                : null
            }
            onChange={(opt) =>
              setFilters((f) => ({
                ...f,
                status: (opt as Option | null)?.value ?? "",
              }))
            }
          />
          <BaseSelect
            label="المنتج"
            placeholder="اختر منتج"
            options={productOptions}
            value={
              filters.productId
                ? productOptions.find((o) => o.value === filters.productId) ||
                  null
                : null
            }
            onChange={(opt) =>
              setFilters((f) => ({
                ...f,
                productId: (opt as Option | null)?.value ?? "",
              }))
            }
            isLoading={isLoadingProducts}
            onMenuScrollToBottom={handleLoadMoreProducts}
            onMenuOpen={() => {
              if (productOptions.length === 0 && !isLoadingProducts) {
                fetchProducts(1);
              }
            }}
          />
          <DatePicker
            label="التاريخ"
            placeholder="اختر التاريخ"
            value={filters.date}
            onChange={(value) =>
              setFilters((f) => ({
                ...f,
                date: value || getTodayDate(),
              }))
            }
          />
          <div className="flex items-end gap-2">
            <div className="ml-auto flex gap-2">
              <Button type="button" onClick={applyFilters}>
                تطبيق
              </Button>
              <Button type="button" variant="ghost" onClick={resetFilters}>
                إعادة تعيين
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end mb-4">
          <Button type="button" onClick={() => navigate("/orders/add")}>
            اضافة طلب جديد
          </Button>
        </div>
        {loading.value ? (
          <p className="text-center text-gray-500 mt-8">جاري التحميل...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            لا يوجد طلبات حالياً لعرضها
          </p>
        ) : (
          <Table data={orders} columns={columns} />
        )}
      </div>
    </>
  );
}
