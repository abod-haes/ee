import { type JSX, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  type ColumnSort,
} from "@tanstack/react-table";
import type { Order } from "@/types/order.type";
// import { cn } from "@/lib/utils";

export interface Column<T> {
  accessorKey: keyof T | string;
  header: string;
  cell?: ({
    row,
    cell,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cell: any;
  }) => Element | string | number | JSX.Element;
  isRendering: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
}

const Table = <T,>({ data, columns }: TableProps<T>) => {
  const [sorting, setSorting] = useState<ColumnSort[]>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="overflow-x-auto flex flex-col gap-4">
      <table className="min-w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className=" ">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  // onClick={header.column.getToggleSortingHandler()}
                  className="py-3 px-2 text-md text-(--silver) font-semibold border-b border-gray-200"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-gray-200 group text-sm hover:bg-(--primary-300) transition-all ${
                (row.original as Order).status === "pending"
                  ? "bg-(--primary-300)"
                  : "even:bg-slate-50"
              }`}
            >
              {row.getVisibleCells().map((cell) => {
                const cellValue = row.original[
                  // @ts-expect-error temp
                  cell.column.columnDef.accessorKey as keyof T
                ] as string;
                return (
                  <td
                    key={cell.id}
                    className={`text-md py-3 px-2 text-center group-hover:text-white transition-colors ${
                      (row.original as Order).status === "pending"
                        ? "text-white"
                        : "text-(--silver)"
                    }`}
                  >
                    {
                      // @ts-expect-error temp
                      cell.column.columnDef.isRendering
                        ? flexRender(cell.column.columnDef.cell, {
                            // @ts-expect-error temp
                            row: row.original,
                            cell,
                          })
                        : cellValue
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* <div className="flex items-center justify-between mt-6">
        <div className="text-sm font-medium text-[var(--silver)]">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {pagesSize.map((pageSize) => (
              <option
                className="text-sm font-medium text-[var(--silver)]"
                key={pageSize}
                value={pageSize}
              >
                العرض {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <Button
            size={"sm"}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            السابق
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: table.getPageCount() }).map((e, i) => (
              <Button
                size={"sm"}
                variant={"outline"}
                className=""
                key={i}
                onClick={moveToPage(i)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            size={"sm"}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            التالي
          </Button>
        </div>
        <p className="text-sm font-medium text-[var(--silver)]">
          يعرض الصفحة {table.getState().pagination.pageIndex + 1} من 
          {table.getPageCount()} صفحات 
        </p>
      </div> */}
    </div>
  );
};

export default Table;
