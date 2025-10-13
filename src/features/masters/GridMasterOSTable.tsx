import { flexRender, type Table } from "@tanstack/react-table";

type GridMasterOSTableProps<T> = {
  table: Table<T>;
};

function GridMasterOSTable<T>({ table }: GridMasterOSTableProps<T>) {
  const columns = table.getAllLeafColumns();

  return (
    <div className="shadow-lg border border-border overflow-x-auto">
      <table className="min-w-[800px] w-full table-auto">
        <thead className="bg-secondary-color rounded-xl">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const colDef = header.column.columnDef as any; // allow custom props like `required`

                return (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(colDef.header, header.getContext())}
                      {colDef.required && (
                        <span className="text-red-600">*</span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y">
          {table.getRowModel().rows.length === 0 ? (
            <tr className="bg-primary-md">
              {columns.map((col) => (
                <td
                  key={col.id}
                  className="px-6 py-4 text-secondary-text-dark whitespace-nowrap text-sm border-b border-border"
                >
                  {/* Empty cell */}
                </td>
              ))}
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={
                  row.index % 2 === 0
                    ? "bg-primary-md"
                    : "bg-secondary-color-lt"
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 text-secondary-text-dark whitespace-nowrap text-sm border-b border-border"
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

export default GridMasterOSTable;
