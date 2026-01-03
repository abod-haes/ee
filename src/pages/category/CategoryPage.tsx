import BreadCums from '@/components/bread-cums/bread-cums';
import CategorySection from '@/views/category/category';

export default function CategoryPage() {
  return (
    <div className="w-full h-full bg-(--white) p-3 rounded-lg">
      <BreadCums head="إدارة الأصناف" />
      <CategorySection />
    </div>
  );
}

