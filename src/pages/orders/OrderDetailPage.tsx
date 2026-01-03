import { useParams, useNavigate } from 'react-router-dom';
import EditOrderForm from '@/views/order/order-detail';
import { Button } from '@/components/base/button';
import { useOrder } from '@/hook/useOrder';

export default function OrderDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const orderId = params.id as string;
  const { data: order } = useOrder(Number(orderId));
  
  const handleClose = () => {
    navigate('/orders');
  };

  const handleAdded = () => {
    navigate('/orders');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          تعديل الطلب #{orderId} - {order?.doctor?.name || ''}
        </h1>
        <Button
          variant="outline"
          onClick={handleClose}
          className="flex items-center gap-2"
        >
          العودة
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <EditOrderForm
          id={orderId}
          onClose={handleClose}
          onAdded={handleAdded}
        />
      </div>
    </div>
  );
}

