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
import { getOrderById } from "@/services/order.service";
import { getPaginatedProducts } from "@/services/product.service";
import { quantityTypes } from "@/constant/quantity-types";

const STATUS_CODE_MAP: Array<{ code: string; status: OrderStatus }> = [
  { code: "0", status: "pending" },
  { code: "1", status: "paid" },
  { code: "2", status: "half-paid" },
  { code: "3", status: "unpaid" },
];

export default function Order() {
  const loading = useBoolean(false);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const navigate = useNavigate();
  const { data: doctors = [] } = useDoctors();
  const { users } = useUserManagement();
  const [productOptions, setProductOptions] = useState<Option[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productPagination, setProductPagination] = useState({
    page: 0,
    totalPages: 1,
  });

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

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePrint(row.id)}
            title="طباعة"
            className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 border border-green-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          >
            <Icons.printer className="w-4 h-4" />
          </Button>
        </div>
      ),
      isRendering: true,
    },
  ];

  const handlePrint = async (orderId: number) => {
    try {
      const orderData = await getOrderById(orderId);

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      // Calculate subtotal from products
      const subtotal = orderData.total;

      // Get discount
      const discount = Number(orderData.discount) || 0;

      // Calculate total after discount

      // Get payment information
      const totalPaid =
        Number(orderData.totalPaid) || Number(orderData.paid) || 0;
      const rest = Number(orderData.rest) || 0;

      // Get order status label
      const statusKey = orderData.status as OrderStatus;
      const statusLabel =
        ORDER_STATUS_LABELS[statusKey] || orderData.status || "غير معروف";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>فاتورة طلب #${orderData.id}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Tajawal', 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              direction: rtl;
              text-align: right;
              background-image: 
                linear-gradient(to right, #ce1432 0.5px, transparent 0.5px),
                linear-gradient(to bottom, #ce1432 0.5px, transparent 0.5px);
              background-size: 25px 25px;
              background-position: 0 0, 0 0;
              line-height: 1.4;
            }
            .header {
              margin-bottom: 25px;
              border: 2px solid #ce1432;
              padding: 20px;
              background: white;
              position: relative;
              box-shadow: 0 2px 4px rgba(206, 20, 50, 0.1);
            }
            .header-top {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              gap: 15px;
              margin-bottom: 15px;
              width: 100%;
            }
            .company-section {
              text-align: center;
              flex-shrink: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-img {
              max-width: 150px;
              max-height: 100px;
              height: auto;
              width: auto;
              object-fit: contain;
            }
            .contact-info {
              font-size: 12px;
              color: #333;
              flex-shrink: 0;
              text-align: left;
              width: min-content;
            }
            .contact-info div {
              margin: 3px 0;
              white-space: nowrap;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #ce1432;
            }
            .invoice-number {
              font-size: 18px;
              font-weight: bold;
              color: #ce1432;
            }
            .invoice-date {
              font-size: 14px;
              color: #333;
            }
            .order-status {
              font-size: 14px;
              font-weight: bold;
              color: #ce1432;
              padding: 5px 10px;
              border: 1px solid #ce1432;
              border-radius: 4px;
              display: inline-block;
            }
            .recipient-info {
              display: flex;
              justify-content: space-between;
              margin: 15px 0;
              padding: 10px;
              border: 1px solid #ce1432;
              background: white;
            }
            .recipient-info div {
              flex: 1;
              margin: 0 5px;
            }
            .recipient-info label {
              display: block;
              font-size: 12px;
              color: #333;
              margin-bottom: 5px;
            }
            .recipient-info input {
              width: 100%;
              border: 1px solid #ce1432;
              padding: 5px;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
              background: white;
              border: 2px solid #ce1432;
              box-shadow: 0 2px 4px rgba(206, 20, 50, 0.1);
            }
            th, td {
              border: 1px solid #ce1432;
              padding: 12px 8px;
              text-align: right;
              font-size: 13px;
              vertical-align: middle;
            }
            th {
              background-color: #fef2f2;
              font-weight: bold;
              color: #ce1432;
              font-size: 14px;
            }
            .product-row:nth-child(even) {
              background-color: #fefefe;
            }
            .total-section {
              margin-top: 20px;
              padding: 15px;
              border: 1px solid #ce1432;
              background: white;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 5px;
            }
            .total-label {
              font-size: 14px;
              color: #333;
            }
            .total-amount {
              font-size: 18px;
              font-weight: bold;
              color: #ce1432;
            }
            .no-other {
              font-size: 12px;
              color: #666;
              text-align: left;
              margin-top: 0;
            }
            .signature-section {
              text-align: center;
              margin-top: 30px;
              padding: 20px;
              border: 1px solid #ce1432;
              background: white;
              box-shadow: 0 2px 4px rgba(206, 20, 50, 0.1);
            }
            .signature-text {
              font-size: 14px;
              color: #333;
              margin-bottom: 25px;
              font-weight: 500;
            }
            .signature-line {
              border-top: 1px solid #ce1432;
              height: 40px;
              margin-top: 10px;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body { 
                margin: 0 !important; 
                padding: 20px !important;
                background: white !important;
              }
              .no-print { display: none !important; }
              .header-top {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                gap: 10px !important;
              }
              .logo-img {
                max-width: 120px !important;
                max-height: 80px !important;
              }
              .contact-info {
                font-size: 11px !important;
              }
              @page {
                margin: 0 !important;
                size: A4;
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
          <div class="header" style="direction: ltr;">
            <div class="header-top">
              <div class="contact-info">
                <div>021 222 40 72</div>
                <div>0962 476408</div>
                <div>0933 495867</div>
                <div>e-mail: alsharq@gmail.com</div>
                <div>سوريا - حلب - الجميلية</div>
                <div>أمام الحكم العسكرية</div>
                </div>
              
              <div class="company-section">
                <img src="${
                  window.location.origin
                }/assets/images/top-logo.png" alt="شركة الشرق لطب الأسنان" class="logo-img" />
              </div>
              <div class="company-section">
                <img src="${
                  window.location.origin
                }/assets/images/botton-logo.png" alt="شركة الشرق لطب الأسنان" class="logo-img" />
              </div>
            </div>
            
            <div class="invoice-header">
              <div class="invoice-date">
                التاريخ : ${new Date().toLocaleDateString("en-CA")} 
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                <div class="invoice-number">رقم الطلب: ${orderData.id}</div>
                <div class="order-status">الحالة: ${statusLabel}</div>
              </div>
            </div>
          </div>
          
          <div class="recipient-info">
            <div>
              <label>المطلوب من السيد:</label>
              <input type="text" value="${
                orderData.doctor?.name || orderData.RepName || ""
              }" readonly />
            </div>
            <div>
              <label>المحترم المقيم في:</label>
              <input type="text" value="${
                orderData.doctor?.address || orderData.address || ""
              }" readonly />
            </div>
            <div>
              <label>الهاتف:</label>
              <input type="text" value="${
                orderData.doctor?.phone || orderData.phone || ""
              }" readonly />
            </div>
          </div>
          

          <table>
            <thead>
              <tr>
                <th>القيمة الاجمالية</th>
                <th>نوع البضاعة</th>
                <th>العدد</th>
                <th>نوع الكمية</th>
                <th>السعر الافرادي</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${
                orderData.cartProducts
                  ?.map(
                    (product) => `
                <tr class="product-row">
                  <td>${(product.quantity * product.productPrice).toFixed(
                    2
                  )} $</td>
                  <td>${product.product?.name || "-"}</td>
                  <td>${product.quantity}</td>
                  <td>${
                    quantityTypes.find(
                      (q) => q.value === String(product.product?.quantityType)
                    )?.label
                  }</td>
                  <td>${product.productPrice}</td>
                  <td>${product.notes || "-"}</td>
                </tr>
              `
                  )
                  .join("") ||
                '<tr><td colspan="5" style="text-align: center;">لا توجد منتجات</td></tr>'
              }
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">المجموع الفرعي:</span>
              <span class="total-amount">${subtotal.toFixed(2)} $</span>
            </div>
            ${
              discount > 0
                ? `<div class="total-row">
                    <span class="total-label">الخصم:</span>
                    <span class="total-amount" style="color: #dc2626;">-${discount.toFixed(
                      2
                    )} $</span>
                  </div>`
                : ""
            }
          
            <div class="total-row" style="margin-top: 10px;">
              <span class="total-label">المبلغ المدفوع:</span>
              <span class="total-amount" style="color: #16a34a;">${totalPaid.toFixed(
                2
              )} $</span>
            </div>
            <div class="total-row" style="margin-top: 10px;">
              <span class="total-label">المبلغ المتبقي:</span>
              <span class="total-amount" style="color: #dc2626;">${rest.toFixed(
                2
              )} $</span>
            </div>
            <div class="no-other">لاغير</div>
          </div>

        </body>
        </html>
      `);

      printWindow.document.close();

      // Set the window title
      printWindow.document.title = `فاتورة طلب #${orderData.id}`;

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
                size: A4;
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
                padding: 20px !important;
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
    } catch (error) {
      console.error("Error printing order:", error);
      alert("حدث خطأ في طباعة الفاتورة");
    }
  };

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
  );
}
