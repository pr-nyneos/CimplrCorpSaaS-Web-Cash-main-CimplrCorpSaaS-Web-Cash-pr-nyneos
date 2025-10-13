import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Table } from "@tanstack/react-table";

export const ColumnPicker = <T,>({ table }: { table: Table<T> }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-3 py-2.5 text-sm border border-primary rounded-md transition hover:bg-primary hover:text-white"
      >
        <SlidersHorizontal className="w-5 h-5 text-primary group-hover:text-white" />
        <span className="text-primary font-semibold group-hover:text-white">
          Columns
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <label key={column.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={() => column.toggleVisibility()}
                    className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-primary-lt focus:ring-2"
                  />
                  <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {column.columnDef.header as string}
                  </span>
                </label>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};