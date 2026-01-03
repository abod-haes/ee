import { useNavigate } from 'react-router-dom';
import AddProductForm from '@/views/products/new-product';

export default function AddProductPage() {
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate('/products');
  };

  const handleAdded = () => {
    navigate('/products');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 my-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--silver) mb-2">
          إضافة منتج جديد
        </h1>
        <p className="text-gray-600">
          قم بملء البيانات التالية لإضافة منتج جديد إلى النظام
        </p>
      </div>

      <AddProductForm onClose={handleClose} onAdded={handleAdded} />
    </div>
  );
}

