import { Outlet, useNavigate } from "react-router-dom";
import { useState, useMemo, useRef, useEffect } from "react";
import SideBar from "@/components/side-bar/side-bar";
import Dialog from "@/components/base/dialog";
import { useOrdersLive, useOrder } from "@/hook/useOrder";
import type { Order } from "@/types/order.type";
import { Button } from "@/components/base/button";
import { tokenUtils } from "@/lib/token-utils";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  // Supports: "YYYY-MM-DD HH:mm:ss" and ISO strings.
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return value;

  // en-GB yields: "DD/MM/YYYY, HH:mm" → remove comma and normalize separators.
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(", ", "   ")
    .replaceAll("/", "-");
};

export default function RootLayout() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Check authentication on mount and redirect if not authenticated
  useEffect(() => {
    if (!tokenUtils.isAuthenticated()) {
      navigate("/sign-in", { replace: true });
    }
  }, [navigate]);

  // Poll orders every second
  const { data: liveOrders } = useOrdersLive();
  const orders: Order[] = useMemo(() => {
    if (!liveOrders) return [];
    // Handle both array and object with data property
    if (Array.isArray(liveOrders)) {
      return liveOrders as Order[];
    }
    // Handle case where API returns { data: [...] }
    if (
      typeof liveOrders === "object" &&
      liveOrders !== null &&
      "data" in liveOrders &&
      Array.isArray((liveOrders as { data: unknown }).data)
    ) {
      return (liveOrders as { data: Order[] }).data;
    }
    return [];
  }, [liveOrders]);

  // Keep previous set of order IDs to detect newly added orders
  const previousOrderIdsRef = useRef<Set<number> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!orders.length) {
      // If orders become empty, reset initialization
      if (initializedRef.current && previousOrderIdsRef.current?.size) {
        previousOrderIdsRef.current = null;
        initializedRef.current = false;
      }
      return;
    }

    const currentIds = new Set<number>(orders.map((o) => Number(o.id)));

    if (!initializedRef.current) {
      previousOrderIdsRef.current = currentIds;
      initializedRef.current = true;
      return;
    }

    const prev = previousOrderIdsRef.current || new Set<number>();
    const newlyAddedIds: number[] = [];
    currentIds.forEach((id) => {
      if (!prev.has(id)) newlyAddedIds.push(id);
    });

    if (newlyAddedIds.length > 0) {
      // Open dialog for the most recently added order
      const latestOrderId = newlyAddedIds[newlyAddedIds.length - 1];
      
      // Find the order in the current orders array
      const latestOrder = orders.find((o) => Number(o.id) === latestOrderId);

      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        // Only show dialog if user type is not Admin
        if (latestOrder && latestOrder.userType !== "Admin") {
          setSelectedOrderId(latestOrderId);
          setIsDialogOpen(true);
        }
      }, 0);

      // Notify other pages to refetch orders (e.g., orders list page)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("orders-updated", {
            detail: { newOrderIds: newlyAddedIds },
          })
        );
      }
    }

    // Update previous ids snapshot
    previousOrderIdsRef.current = currentIds;
  }, [orders]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedOrderId(null);
  };

  const { data: selectedOrder } = useOrder(selectedOrderId || 0);

  // Don't render protected content if not authenticated
  if (!tokenUtils.isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen">
      <SideBar />
      <div className="w-full flex flex-col gap-5 bg-gray-50 py-2.5 px-8 overflow-auto">
        <Outlet />
      </div>

      <Dialog
        isOpen={isDialogOpen }
        onClose={handleCloseDialog}
        title={selectedOrderId ? `طلب جديد #${selectedOrderId}` : "طلب جديد"}
        subtitle={
          selectedOrder
            ? `طلب جديد من ${selectedOrder?.doctor?.name || "عميل"}`
            : "جاري التحميل..."
        }
      >
        {selectedOrder && selectedOrder.userType!=="Admin"  ?  (
          <div className="space-y-3">
            <div className="text-start">
              <div className="text-gray-500 text-sm mb-1">التاريخ</div>
              <div className="font-medium text-lg">
                {formatDateTime(
                  selectedOrder?.date || selectedOrder?.createdAt
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  navigate(`/orders/${selectedOrderId}`);
                  handleCloseDialog();
                }}
                variant="contained"
              >
                فتح صفحة الطلب
              </Button>
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>
                إغلاق
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">جاري التحميل...</div>
        )}
      </Dialog>
    </div>
  );
}
