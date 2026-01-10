import { useCallback, useState } from "react";
import { Button, type ButtonProps } from "@/components/base/button";
import { Icons } from "@/lib/icons";
import { getOrderById } from "@/services/order.service";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order.type";
import { quantityTypes } from "@/constant/quantity-types";

export type PrintOrderButtonProps = {
  orderId: number | string;
  label?: string;
  withIcon?: boolean;
} & Omit<ButtonProps, "type" | "onClick">;

export default function PrintOrderButton({
  orderId,
  label,
  withIcon = true,
  disabled,
  children,
  ...buttonProps
}: PrintOrderButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(async () => {
    try {
      setIsPrinting(true);
      const orderData = await getOrderById(orderId);

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      // Calculate subtotal from products
      const subtotal = orderData.total;

      // Get discount
      const discount = Number(orderData.discount) || 0;

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
            .footer {
              margin-top: 30px;
              padding: 15px 20px;
              border: 2px solid #ce1432;
              background: white;
              box-shadow: 0 2px 4px rgba(206, 20, 50, 0.1);
              text-align: center;
            }
            .footer-content {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              align-items: center;
              gap: 15px;
              font-size: 13px;
              color: #333;
            }
            .footer-item {
              white-space: nowrap;
            }
            .footer-separator {
              color: #ce1432;
              font-weight: bold;
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
              .footer {
                margin-top: 20px !important;
              }
              .footer-content {
                font-size: 11px !important;
                gap: 10px !important;
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
          </div>

          <div class="footer">
            <div class="footer-content">
              <span class="footer-item">021 222 40 72</span>
              <span class="footer-separator">|</span>
              <span class="footer-item">0962 476408</span>
              <span class="footer-separator">|</span>
              <span class="footer-item">0933 495867</span>
              <span class="footer-separator">|</span>
              <span class="footer-item">سوريا - حلب - الجميلية</span>
              <span class="footer-separator">|</span>
              <span class="footer-item">أمام الحكم العسكرية</span>
            </div>
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
    } finally {
      setIsPrinting(false);
    }
  }, [orderId]);

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
          {label ?? "طباعة"}
        </>
      )}
    </Button>
  );
}
