import { useState } from "react";
import { Button } from "@/components/base/button";
import Dialog from "@/components/base/dialog";
import Table, { type Column } from "@/components/table/table";
import useBoolean from "@/hook/use-boolean";
import { Icons } from "@/lib/icons";
import AddUserForm from "./new-user";
import EditUserForm from "./user-detail";
import { useUserManagement } from "@/hook/useUser";
import type { User as UserType } from "@/types/user.type";
import { getUserTypeArabic } from "../../utils/helper";

export default function User() {
  const edit = useBoolean(false);
  const add = useBoolean(false);
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Use the new user management hook
  const {
    users,
    isLoading,
    error,
    changeUserStatus,
    isChangingStatus,
    refetch,
  } = useUserManagement();

  const handleChangeStatus = async (userId: string) => {
    changeUserStatus(userId);
  };

  // using shared helper getUserTypeArabic

  const columns: Column<UserType>[] = [
    {
      accessorKey: "fullName",
      header: "الاسم الكامل",
      cell: ({ row }) => (
        <div className="font-medium text-(--silver)">{row.fullName}</div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "email",
      header: "البريد الإلكتروني",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.email}</div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "userName",
      header: "اسم المستخدم",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-(--silver)">
          {row.userName}
        </div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "UserType",
      header: "نوع المستخدم",
      cell: ({ row }) =>
        (() => {
          const label = getUserTypeArabic(row.UserType);
          const isAdmin = label === "مدير";
          const cls = isAdmin
            ? "bg-red-100 text-red-800"
            : "bg-blue-100 text-blue-800";
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
            >
              {label}
            </span>
          );
        })(),
      isRendering: true,
    },
    {
      accessorKey: "isActive",
      header: "الحالة",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.isActive === 1
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.isActive === 1 ? "نشط" : "غير نشط"}
        </span>
      ),
      isRendering: true,
    },
    {
      accessorKey: "actions",
      header: "أفعال",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSelectedUser(row.id.toString());
              edit.onTrue();
            }}
            title="تعديل"
            className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
          >
            <Icons.edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleChangeStatus(row.id.toString())}
            disabled={isChangingStatus}
            title={
              row.isActive === 1 ? "إلغاء تفعيل المستخدم" : "تفعيل المستخدم"
            }
            className={`
              w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center
              ${
                row.isActive === 1
                  ? "bg-red-100 text-red-600 hover:bg-red-200 border border-red-200"
                  : "bg-green-100 text-green-600 hover:bg-green-200 border border-green-200"
              }
              ${
                isChangingStatus
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-105"
              }
            `}
          >
            {row.isActive === 1 ? (
              <Icons.ban className="w-4 h-4" />
            ) : (
              <Icons.check className="w-4 h-4" />
            )}
          </Button>
        </div>
      ),
      isRendering: true,
    },
  ];

  return (
    <>
      <div className="p-3.5 max-w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-(--silver) capitalize">
            قائمة المستخدمين
          </h3>
          <Button onClick={add.onTrue}>
            إضافة مستخدم
            <Icons.add />
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500 mt-8">جاري التحميل...</p>
        ) : error ? (
          <p className="text-center text-red-500 mt-8">
            حدث خطأ في تحميل المستخدمين
          </p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            لا يوجد مستخدمون حالياً لعرضهم
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table data={users} columns={columns} />
          </div>
        )}
      </div>

      <Dialog
        isOpen={add.value}
        onClose={add.onFalse}
        title="إضافة مستخدم جديد"
      >
        <AddUserForm onAdded={refetch} onClose={add.onFalse} />
      </Dialog>
      <Dialog isOpen={edit.value} onClose={edit.onFalse} title="تعديل المستخدم">
        <EditUserForm
          onAdded={refetch}
          onClose={edit.onFalse}
          id={selectedUser}
        />
      </Dialog>
    </>
  );
}
