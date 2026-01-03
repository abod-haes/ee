import BreadCums from '@/components/bread-cums/bread-cums';
import Doctors from '@/views/doctors/doctors';

export default function DoctorsPage() {
  return (
    <div className="w-full h-full bg-(--white) p-3 rounded-lg">
      <BreadCums head="إدارة الأطباء" />
      <Doctors />
    </div>
  );
}

