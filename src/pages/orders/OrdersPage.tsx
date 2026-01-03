import BreadCums from '@/components/bread-cums/bread-cums';
import Order from '@/views/order/order';

export default function OrdersPage() {
  return (
    <div className="w-full h-full bg-(--white) p-3 rounded-lg">
      <BreadCums head="إدارة الطلبات" />
      <Order />
    </div>
  );
}

