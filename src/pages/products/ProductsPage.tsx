import BreadCums from '@/components/bread-cums/bread-cums';
import Products from '@/views/products/products';

export default function ProductsPage() {
  return (
    <div className="w-full h-full bg-(--white) p-3 rounded-lg">
      <BreadCums head="إدارة المنتجات" />
      <Products />
    </div>
  );
}

