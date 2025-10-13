import { flexRender, type Table, type ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";

type SimpleTableProps<T> = {
  table: Table<T>;
  columns: ColumnDef<T>[];
};

function SimpleTable<T>({ table, columns }: Readonly<SimpleTableProps<T>>) {
  return (
    <div className="shadow-lg border border-border lg:overflow-x-auto md:overflow-x-auto">
      <table className="w-full table-auto">
        <thead className="bg-secondary-color rounded-xl">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
                  style={{ width: header.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-primary"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <FileText />
                  </div>
                  <p className="text-lg font-medium text-primary">
                    No Data Available
                  </p>
                  <p className="text-sm font-medium text-primary">
                    There are no data to display at the moment.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, idx: number) => (
              <tr
                key={row.id}
                className={
                  idx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 text-secondary-text-dark font-normal whitespace-nowrap text-sm border-b border-border"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SimpleTable;