import { useState, useEffect } from "react";
import { Button } from "@/components/base/button";
import Dialog from "@/components/base/dialog";
import Table, { type Column } from "@/components/table/table";
import { Input } from "@/components/base/input";
import useBoolean from "@/hook/use-boolean";
import { Icons } from "@/lib/icons";
import AddDoctorForm from "./new-doctor";
import EditDoctorsForm from "./doctor-detail";
import { useDoctorManagement, useSearchDoctors } from "@/hook/useDoctor";
import type { Doctor } from "@/types/doctor.type";

export default function Doctors() {
  const del = useBoolean(false);
  const edit = useBoolean(false);
  const add = useBoolean(false);
  const [selectedDoctors, setSelectedDoctors] = useState<string>("");
  const [selectedDoctorsSlug, setSelectedDoctorsSlug] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Use the new doctor management hook
  const { doctors, isLoading, error, deleteDoctor, isDeleting, refetch } =
    useDoctorManagement();

  // Use search hook when search query is provided
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useSearchDoctors(debouncedSearch);

  const handleDeleteDoctor = async () => {
    deleteDoctor(selectedDoctors);
    del.onFalse();
  };

  // Determine which data to display
  const displayData =
    debouncedSearch.trim().length > 0 ? searchResults || [] : doctors;
  const displayLoading =
    debouncedSearch.trim().length > 0 ? isSearching : isLoading;
  const displayError = debouncedSearch.trim().length > 0 ? searchError : error;

  const columns: Column<Doctor>[] = [
    {
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) => (
        <div className="font-medium text-(--silver)">{row.name}</div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "address",
      header: "العنوان",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">{row.address}</div>
      ),
      isRendering: true,
    },
    {
      accessorKey: "phone",
      header: "رقم الهاتف",
      cell: ({ row }) => (
        <div className="text-sm font-medium text-(--silver)">{row.phone}</div>
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
              setSelectedDoctorsSlug(row.slug.toString());
              setSelectedDoctors(row.id.toString());
              edit.onTrue();
            }}
            title="تعديل"
          >
            <Icons.edit />
          </Button>
          <Button
            variant="contained"
            size="icon"
            onClick={() => {
              setSelectedDoctorsSlug(row.slug.toString());
              setSelectedDoctors(row.id.toString());
              del.onTrue();
            }}
            title="حذف"
          >
            <Icons.delete />
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
            قائمة الأطباء
          </h3>
          <Button size="contained" variant="contained" onClick={add.onTrue}>
            اضافة طبيب <Icons.add />
          </Button>
        </div>

        {/* Search Input */}
        <div className="flex w-fit items-center gap-4 mb-6">
          <Input
            placeholder="ابحث عن اسم دكتور"
            value={search}
            className="w-full max-w-xs"
            preIcon={<Icons.search />}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search.trim().length > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearch("");
                refetch();
              }}
              title="مسح البحث"
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <Icons.close className="w-4 h-4" />
            </Button>
          )}
        </div>

        {displayLoading ? (
          <p className="text-center text-gray-500 mt-8">جاري التحميل...</p>
        ) : displayError ? (
          <p className="text-center text-red-500 mt-8">
            حدث خطأ في تحميل الأطباء
          </p>
        ) : displayData.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            {debouncedSearch.trim().length > 0
              ? "لا توجد نتائج للبحث"
              : "لا يوجد أطباء حالياً لعرضهم"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table data={displayData} columns={columns} />
          </div>
        )}
      </div>

      <Dialog
        isOpen={del.value}
        onClose={del.onFalse}
        title="حذف الطبيب"
        onSubmit={handleDeleteDoctor}
        loading={isDeleting}
        subtitle="هل انت متأكد من حذف الطبيب"
      />
      <Dialog
        isOpen={add.value}
        onClose={add.onFalse}
        title="إضافة طبيب جديد"
        cta="إضافة طبيب"
      >
        <AddDoctorForm onAdded={refetch} onClose={add.onFalse} />
      </Dialog>
      <Dialog
        isOpen={edit.value}
        onClose={edit.onFalse}
        title="تعديل الطبيب"
        cta="تحديث الطبيب"
      >
        <EditDoctorsForm
          onAdded={refetch}
          onClose={edit.onFalse}
          id={selectedDoctors}
          slug={selectedDoctorsSlug}
        />
      </Dialog>
    </>
  );
}
