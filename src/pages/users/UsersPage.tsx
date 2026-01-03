import BreadCums from '@/components/bread-cums/bread-cums';
import User from '@/views/users/users';

export default function UsersPage() {
  return (
    <div className="w-full h-full bg-(--white) p-3 rounded-lg">
      <BreadCums head="إدارة المستخدمين" />
      <User />
    </div>
  );
}
