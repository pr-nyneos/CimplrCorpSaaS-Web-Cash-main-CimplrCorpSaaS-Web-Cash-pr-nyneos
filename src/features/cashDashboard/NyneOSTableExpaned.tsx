import React, { useState, useEffect } from "react";
import {
  flexRender,
  // type Table,
  type ColumnDef,
  getCoreRowModel,
  getExpandedRowModel,
  type ExpandedState,
  useReactTable,
} from "@tanstack/react-table";

type SimpleTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  isExpanded?: boolean; // enable expansion
  expandLevel?: number; // max expand depth
  getSubRows?: (row: T) => T[] | undefined; // for nested rows
  children?: React.ReactNode;
};

function  NyneOSTableExpanded<T>({
  data,
  columns,
  isExpanded = false,
  expandLevel = 1,
  getSubRows,
  children,
}: SimpleTableProps<T>) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  // Auto expand rows up to expandLevel if isExpanded = true
  useEffect(() => {
    if (isExpanded && expandLevel > 0) {
      const expandAll = (rows: any[], depth = 0): ExpandedState => {
        if (depth >= expandLevel) return {};
        return rows.reduce((acc, row) => {
          acc[row.id] = true;
          if (row.subRows?.length) {
            Object.assign(acc, expandAll(row.subRows, depth + 1));
          }
          return acc;
        }, {} as ExpandedState);
      };
      setExpanded(expandAll(table.getRowModel().rows));
    }
  }, [isExpanded, expandLevel, table.getRowModel().rows]);

  return (
    <div className="shadow-lg border border-border lg:overflow-x-auto md:overflow-x-auto">
      <table className="w-full table-auto">
        {/* Table Head */}
        <thead className="bg-secondary-color rounded-xl">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
                  style={{ width: header.getSize() }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* Table Body */}
        <tbody className="divide-y">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-primary"
              >
                {/* Empty state */}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row, idx) => (
              <tr
                key={row.id}
                className={
                  idx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4 text-secondary-text-dark text-sm border-b border-border ${
                      row.depth === 0 ? "font-bold" : "font-normal"
                    }`}
                    style={{
                      paddingLeft:
                        row.depth > 0 ? `${1.5 + row.depth * 1.5}rem` : "",
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

        {children}
      </table>
    </div>
  );
}

export default NyneOSTableExpanded;
