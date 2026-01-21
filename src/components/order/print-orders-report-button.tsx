import { useCallback, useState } from "react";
import { Button, type ButtonProps } from "@/components/base/button";
import { Icons } from "@/lib/icons";
import { getAllOrders } from "@/services/order.service";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from "@/types/order.type";

export type PrintOrdersReportButtonProps = {
  date?: string;
  label?: string;
  withIcon?: boolean;
} & Omit<ButtonProps, "type" | "onClick">;

export default function PrintOrdersReportButton({
  date,
  label,
  withIcon = true,
  disabled,
  children,
  ...buttonProps
}: PrintOrdersReportButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // Get today's date in YYYY-MM-DD format without timezone issues
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const handlePrint = useCallback(async () => {
    try {
      setIsPrinting(true);
      const targetDate = date || getTodayDate();
      const orders = await getAllOrders({ date: targetDate });

      if (orders.length === 0) {
        alert("لا توجد طلبات للطباعة");
        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const ordersCount = orders.length;
      const ordersTotal = orders.reduce((sum, order) => {
        const total = Number(order.total) || 0;
        return sum + total;
      }, 0);

      const renderOrderRow = (order: typeof orders[0], index: number) => {
        const statusKey = order.status as OrderStatus;
        const statusLabel =
          ORDER_STATUS_LABELS[statusKey] || order.status || "غير معروف";

        const totalPaid = Number(order.totalPaid) || Number(order.paid) || 0;
        const discount = Number(order.discount) || 0;
        const rest = Number(order.rest) || 0;
        const total = Number(order.total) || 0;

        return `
          <tr class="order-row">
            <td>${index + 1}</td>
            <td>#${order.id}</td>
            <td>${order.RepName || "-"}</td>
            <td>${order.doctor?.name || "-"}</td>
            <td>${order.phone || "-"}</td>
            <td>${order.address || "-"}</td>
            <td><span class="status-badge status-${statusKey}">${statusLabel}</span></td>
            <td>${totalPaid.toFixed(2)} $</td>
            <td>${discount}</td>
            <td>${rest.toFixed(2)} $</td>
            <td>${total.toFixed(2)} $</td>
          </tr>
        `;
      };

      const ordersTableHtml = `
        <table class="orders-table">
          <thead>
            <tr>
              <th>#</th>
              <th>رقم الطلب</th>
              <th>اسم المندوب</th>
              <th>الطبيب</th>
              <th>رقم الهاتف</th>
              <th>العنوان</th>
              <th>الحالة</th>
              <th>المبلغ المدفوع</th>
              <th>الخصم</th>
              <th>المبلغ المتبقي</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(renderOrderRow).join("")}
          </tbody>
        </table>
      `;

      const summaryHtml = `
        <div class="summary-section">
          <div class="summary-row">
            <span class="summary-label">عدد الطلبات:</span>
            <span class="summary-value">${ordersCount}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">إجمالي المبلغ:</span>
            <span class="summary-value total-amount">${ordersTotal.toFixed(2)} $</span>
          </div>
        </div>
      `;

      const headerHtml = `
        <div class="header" style="direction: ltr;">
          <div class="header-top">
            <div class="company-section">
              <img src="${window.location.origin}/assets/images/botton-logo.png"
                   alt="شركة الشرق لطب الأسنان" class="logo-img" />
            </div>
          </div>

          <div class="report-header">
            <div class="report-title">تقرير طلبات اليوم</div>
            <div class="report-date">التاريخ: ${new Date(targetDate).toLocaleDateString("ar-SA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</div>
          </div>
        </div>
      `;

      const footerHtml = `
        <div class="footer">
          <div class="footer-content">
            <div class="footer-section" style="direction: ltr;">
              <div>021 222 40 72</div>
              <div>0962 476408</div>
              <div>0933 495867</div>
             </div>
            <div class="footer-section">
              <div>
                <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                </svg>
                <span>الشرق لطب الأسنان</span>
              </div>
              <div style="direction: rtl;">
                <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#E4405F"/>
                </svg>
                <span>the_east_for_dental_supplies</span>
              </div>
            </div>
            <div class="footer-section">
            <div>حلب -جسر الميرديان(جسر كعكة)- جانب مشاوي الهدى<div>
            </div>
          </div>
        </div>
      `;

      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير طلبات اليوم</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">

          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />

          <style>
            body {
              font-family: 'Tajawal', 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: transparent;
              direction: rtl;
              text-align: right;
              background-image: 
                linear-gradient(to right, #ce1432 0.5px, transparent 0.5px),
                linear-gradient(to bottom, #ce1432 0.5px, transparent 0.5px);
              background-size: 25px 25px;
              background-position: 0 0, 0 0;
              line-height: 1.4;
              position: relative;
            }

            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              opacity: 0.08;
              z-index: 0;
              pointer-events: none;
              width: 60%;
              max-width: 500px;
              height: auto;
            }

            .content-wrapper { position: relative; z-index: 1; }

            .header {
              margin-bottom: 15px;
              border: 2px solid #ce1432;
              padding: 20px;
              background: transparent;
              position: relative;
              box-shadow: 0 2px 4px rgba(206, 20, 50, 0.1);
            }

            .header-top {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
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
              margin: 0 auto;
            }

            .logo-img {
              max-width: 150px;
              max-height: 100px;
              height: auto;
              width: auto;
              object-fit: contain;
            }

            .report-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 10px;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #ce1432;
            }

            .report-title {
              font-size: 24px;
              font-weight: bold;
              color: #ce1432;
            }

            .report-date {
              font-size: 16px;
              color: #333;
            }

            .orders-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              background: transparent;
              border: 2px solid #ce1432;
              box-shadow: 0 2px 4px rgba(206, 20, 50, 0.1);
              font-size: 12px;
            }

            .orders-table th, .orders-table td {
              border: 1px solid #ce1432;
              padding: 8px 6px;
              text-align: right;
              vertical-align: middle;
            }

            .orders-table th {
              background-color: #fef2f2;
              font-weight: bold;
              color: #ce1432;
              font-size: 13px;
            }

            .order-row:nth-child(even) { background-color: #fefefe; }

            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
            }

            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-paid { background-color: #d1fae5; color: #065f46; }
            .status-half-paid { background-color: #dbeafe; color: #1e40af; }
            .status-unpaid { background-color: #fee2e2; color: #991b1b; }

            .summary-section {
              margin-top: 15px;
              padding: 15px;
              border: 2px solid #ce1432;
              background: transparent;
              text-align: right;
            }

            .summary-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
              font-size: 16px;
            }

            .summary-label { 
              font-size: 16px; 
              color: #333; 
              font-weight: 500;
            }
            .summary-value { 
              font-size: 18px; 
              font-weight: bold; 
              color: #ce1432; 
            }
            .summary-value.total-amount {
              font-size: 20px;
              color: #16a34a;
            }

            .footer {
              margin-top: 20px;
              padding: 15px 20px;
              border: 2px solid #ce1432;
              background: transparent;
              box-shadow: 0 2px 4px rgba(206, 20, 50, 0.1);
              text-align: center;
            }

            .footer-content {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-around;
              align-items: flex-start;
              gap: 20px;
              font-size: 12px;
              color: #333;
            }

            .footer-section { text-align: center; flex: 1;  }
            .footer-section div { 
              margin: 3px 0; 
              line-height: 1.4; 
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 5px;
            }
            .social-icon {
              width: 14px;
              height: 14px;
              fill: currentColor;
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
              .watermark {
                opacity: 0.08 !important;
                width: 60% !important;
                max-width: 500px !important;
              }
              .social-icon {
                width: 12px !important;
                height: 12px !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              .footer-section div {
                margin: 2px 0 !important;
              }
              .orders-table {
                font-size: 11px !important;
              }
              .orders-table th, .orders-table td {
                padding: 6px 4px !important;
              }
              @page {
                margin: 0 !important;
                size: A4 landscape;
              }
            }
          </style>
        </head>

        <body>
          <img src="${window.location.origin}/assets/images/top-logo.png" alt="Watermark" class="watermark" />
          <div class="content-wrapper">
            ${headerHtml}
            ${ordersTableHtml}
            ${summaryHtml}
            ${footerHtml}
          </div>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.document.title = `تقرير طلبات اليوم - ${targetDate}`;

      printWindow.onload = () => {
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch {
            printWindow.print();
          }
        }, 300);
      };

      printWindow.addEventListener("afterprint", () => {
        setTimeout(() => {
          printWindow.close();
        }, 100);
      });

      setTimeout(() => {
        if (!printWindow.closed) printWindow.close();
      }, 30000);
    } catch (error) {
      console.error("Error printing orders report:", error);
      alert("حدث خطأ في طباعة التقرير");
    } finally {
      setIsPrinting(false);
    }
  }, [date]);

  return (
    <Button
      type="button"
      onClick={handlePrint}
      disabled={disabled || isPrinting}
      {...buttonProps}
    >
      {children ? (
        children
      ) : (
        <>
          {withIcon && <Icons.printer className="w-4 h-4" />}
          {label ?? "طباعة التقرير"}
        </>
      )}
    </Button>
  );
}
