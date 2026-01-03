import { useParams, useNavigate } from 'react-router-dom';
import EditProductForm from '@/views/products/product-detail';

export default function EditProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate('/products');
  };

  const handleAdded = () => {
    navigate('/products');
  };

  if (!slug) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 my-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-(--silver) mb-2">
            تعديل المنتج
          </h1>
          <p className="text-gray-600">
            قم بتعديل البيانات التالية للمنتج المحدد
          </p>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 text-lg">معرف المنتج غير متوفر.</p>
          <p className="text-sm text-gray-500 mt-2">
            يرجى التأكد من صحة رابط المنتج
          </p>
          <p className="text-xs text-gray-400 mt-2">
            للاختبار، انتقل إلى قائمة المنتجات واختر منتج موجود للتعديل
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 my-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--silver) mb-2">
          تعديل المنتج
        </h1>
        <p className="text-gray-600">
          قم بتعديل البيانات التالية للمنتج المحدد
        </p>
      </div>

      <EditProductForm
        slug={slug}
        onClose={handleClose}
        onAdded={handleAdded}
      />
    </div>
  );
}

