import React, { useRef, useEffect, useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Draggable } from "../../components/table/Draggable";
import { Droppable } from "../../components/table/Droppable";
import { FileText } from "lucide-react";
import type {FieldConfig} from "../../types/type";
import {
  flexRender,
  type Table,
  type ColumnDef,
} from "@tanstack/react-table";
import LoadingSpinner from "../../components/layout/LoadingSpinner";
export type Section<T> = {
  title: string;
  // fields: FieldConfig<T>[];
  fields: FieldConfig<T>[] | ((data: T) => FieldConfig<T>[]);
  editableKeys?: (keyof T)[];
};

type NyneOSTableProps<T> = {
  table: Table<T>;
  columns: ColumnDef<T>[];
  nonDraggableColumns: string[];
  nonSortingColumns: string[];
  sections?: Section<T>[];
  children?: React.ReactNode; // only <tfoot>
  loading?: boolean; // <-- add this
};

function NyneOSTable2<T>({
  table,
  columns,
  nonDraggableColumns,
  nonSortingColumns,
  sections,
  children,
  loading, // <-- add this
}: NyneOSTableProps<T>) {
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>(
    table.getAllLeafColumns().map((col) => col.id)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (
      nonDraggableColumns.includes(active.id as string) ||
      nonDraggableColumns.includes(over.id as string)
    ) {
      return;
    }
    if (active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  useEffect(() => {
    table.setColumnOrder(columnOrder);
  }, [columnOrder]);

  return (
    <div className="border border-border overflow-x-auto">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <table className="min-w-full table-auto">
            <thead className="bg-secondary-color rounded-xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isDraggable = !nonDraggableColumns.includes(
                      header.column.id
                    );
                    const canSort = !nonSortingColumns.includes(header.column.id);
                    const isSorted = header.column.getIsSorted?.() as
                      | false
                      | "asc"
                      | "desc";
                    return (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border select-none group "
                        style={{ width: header.getSize() }}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={canSort ? "cursor-pointer" : ""}
                            onClick={
                              canSort
                                ? (e) =>
                                    header.column.toggleSorting?.(
                                      undefined,
                                      (e as React.MouseEvent).shiftKey
                                    )
                                : undefined
                            }
                            tabIndex={canSort ? 0 : undefined}
                            onKeyDown={
                              canSort
                                ? (e) => {
                                    if (
                                      (e as React.KeyboardEvent).key ===
                                        "Enter" ||
                                      (e as React.KeyboardEvent).key === " "
                                    ) {
                                      header.column.toggleSorting?.(
                                        undefined,
                                        (e as React.KeyboardEvent).shiftKey
                                      );
                                    }
                                  }
                                : undefined
                            }
                            role={canSort ? "button" : undefined}
                            aria-label={canSort ? "Sort column" : undefined}
                          >
                            {isDraggable ? (
                              <Droppable id={header.column.id}>
                                <Draggable id={header.column.id}>
                                  <div className="cursor-move rounded p-1 transition duration-150 ease-in-out hover:bg-primary-lg">
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                  </div>
                                </Draggable>
                              </Droppable>
                            ) : (
                              <div className="px-1">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </div>
                            )}
                            {canSort && (
                              <span className="ml-1 text-xs">
                                {isSorted === "asc" ? (
                                  "▲"
                                ) : isSorted === "desc" ? (
                                  "▼"
                                ) : (
                                  <span className="opacity-30">▲▼</span>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      </th>
                    );
                  })}
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
                  <React.Fragment key={row.id}>
                    <tr
                      className={
                        idx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-secondary-text-dark font-normal whitespace-nowrap text-sm border-b border-border"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && (
                      <tr
                        key={`${row.id}-expanded`}
                        ref={(el) => {
                          rowRefs.current[row.id] = el;
                        }}
                      >
                        <td
                          colSpan={table.getVisibleLeafColumns().length}
                          className="px-6 py-4 bg-primary-md"
                        >
                          <div className="bg-secondary-color-lt rounded-lg p-4 border border-border">
                            {/* Render sections and fields */}
                            {sections &&
                              sections.map(({ title, fields }) => (
                                <div key={title} className="mb-6">
                                  <div className="text-md font-medium text-primary mb-3 pb-2">
                                    {title}
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    {(typeof fields === "function"
                                      ? fields(row.original)
                                      : fields
                                    ).map((field) => {
                                      const key = field.key;
                                      const value = row.original[key as keyof T];
                                      return (
                                        <div
                                          className="flex flex-col space-y-1"
                                          key={String(key)}
                                        >
                                          <label className="font-bold text-secondary-text capitalize">
                                            {field.label || String(key).replace(/([A-Z])/g, " $1").trim()}
                                          </label>
                                          <span className="font-medium text-primary-lt">
                                            {typeof value === "number"
                                              ? value.toLocaleString()
                                              : value
                                              ? String(value)
                                              : "—"}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {children}
          </table>
        </DndContext>
      )}
    </div>
  );
}

export default NyneOSTable2;
