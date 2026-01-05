import BreadCums from "@/components/bread-cums/bread-cums";
import AddOrderForm from "@/views/order/new-order";
import { useNavigate } from "react-router-dom";

export default function AddOrderPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/orders");
  };

  const handleAdded = () => {
    navigate("/orders");
  };

  return (
    <div className="w-full h-full bg-(--white) p-3 rounded-lg">
      <BreadCums head="إضافة طلب جديد" />
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-4">
        <AddOrderForm onClose={handleClose} onAdded={handleAdded} />
      </div>
    </div>
  );
}

