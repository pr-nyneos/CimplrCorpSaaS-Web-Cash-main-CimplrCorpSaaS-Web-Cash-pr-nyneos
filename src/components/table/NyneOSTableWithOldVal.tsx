import React, { useEffect, useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import {
  flexRender,
  type Row,
  type Table,
  type ColumnDef,
} from "@tanstack/react-table";
import { FileText } from "lucide-react";

import { Draggable } from "./Draggable";
import { Droppable } from "./Droppable";
import LoadingSpinner from "../layout/LoadingSpinner";

type NyneOSTableProps<T> = {
  table: Table<T>;
  columns: ColumnDef<T>[];
  nonDraggableColumns: string[];
  nonSortingColumns: string[];
  loading?: boolean;
  // Props for inline editing
  handleUpdate?: (rowId: any, updates: Partial<T>) => void;
  children?: React.ReactNode;
};

// Helper function to get sort indicator
const getSortIndicator = (isSorted: false | "asc" | "desc") => {
  if (isSorted === "asc") return "▲";
  if (isSorted === "desc") return "▼";
  return <span className="opacity-30">▲▼</span>;
};

const createSortHandlers = (header: any, canSort: boolean) => {
  if (!canSort) {
    return {
      onClick: undefined,
      onKeyDown: undefined,
      tabIndex: undefined,
      role: undefined,
      "aria-label": undefined,
    };
  }

  const handleSort = (shiftKey: boolean) => {
    header.column.toggleSorting?.(undefined, shiftKey);
  };

  return {
    onClick: (e: React.MouseEvent) => handleSort(e.shiftKey),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleSort(e.shiftKey);
      }
    },
    tabIndex: 0,
    role: "button" as const,
    "aria-label": "Sort column",
  };
};

// Helper function to render header content
const renderHeaderContent = (header: any, isDraggable: boolean) => {
  const content = flexRender(
    header.column.columnDef.header,
    header.getContext()
  );

  if (isDraggable) {
    return (
      <Droppable id={header.column.id}>
        <Draggable id={header.column.id}>
          <div className="cursor-move rounded p-1 transition duration-150 ease-in-out hover:bg-primary-lg">
            {content}
          </div>
        </Draggable>
      </Droppable>
    );
  }

  return <div className="px-1">{content}</div>;
};

// Helper function to find option label
// const findOptionLabel = (options: any[] | undefined, value: any) => {
//   return (
//     options?.find((opt) => String(opt.value) === String(value))?.label ??
//     String(value ?? "—")
//   );
// };

// Component for inline editable cell
export const InlineEditableCell = <T,>({
  row,
  fieldKey,
  oldFieldKey,
  handleUpdate,
  type = "number",
  className = "w-24 px-2 py-1 rounded text-sm text-secondary-text bg-secondary-color border border-border outline-none",
}: {
  row: Row<T>;
  fieldKey: keyof T;
  oldFieldKey?: keyof T;
  handleUpdate: (rowId: any, updates: Partial<T>) => void;
  type?: string;
  className?: string;
}) => {
  const rowId = (row.original as any).id;
  const value = row.original[fieldKey];
  const oldValue = oldFieldKey ? row.original[oldFieldKey] : undefined;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    let newValue: any;

    if (type === "number") {
      newValue = Number(inputValue);
    } else {
      newValue = inputValue;
    }

    if (newValue !== value) {
      const updates = {} as Partial<T>;
      updates[fieldKey] = newValue;

      // If old field key is provided, store the current value as old value
      if (oldFieldKey) {
        updates[oldFieldKey] = value;
      }

      handleUpdate(rowId, updates);
    }
  };

  return (
    <div>
      <input
        type={type}
        defaultValue={String(value ?? "")}
        className={className}
        onBlur={handleBlur}
      />
      {oldValue !== undefined && (
        <span className="block text-xs text-secondary-text-dark mt-1">
          Old: {String(oldValue ?? "—")}
        </span>
      )}
    </div>
  );
};

// Component for rendering table header
const TableHeader = ({
  header,
  nonDraggableColumns,
  nonSortingColumns,
}: {
  header: any;
  nonDraggableColumns: string[];
  nonSortingColumns: string[];
}) => {
  const isDraggable = !nonDraggableColumns.includes(header.column.id);
  const canSort = !nonSortingColumns.includes(header.column.id);
  const isSorted = header.column.getIsSorted?.() as false | "asc" | "desc";
  const sortHandlers = createSortHandlers(header, canSort);

  return (
    <th
      key={header.id}
      className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border select-none group"
      style={{ width: header.getSize() }}
    >
      <div className="flex items-center gap-1">
        <span className={canSort ? "cursor-pointer" : ""} {...sortHandlers}>
          {renderHeaderContent(header, isDraggable)}
          {canSort && (
            <span className="ml-1 text-xs">{getSortIndicator(isSorted)}</span>
          )}
        </span>
      </div>
    </th>
  );
};

function NyneOSTableWithOldVal<T>({
  table,
  columns,
  nonDraggableColumns,
  nonSortingColumns,
  loading,
  // handleUpdate,
  children,
}: Readonly<NyneOSTableProps<T>>) {
  // const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
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
    <div className="shadow-lg border border-border overflow-x-auto">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <table className="min-w-full table-auto">
            <thead className="bg-secondary-color rounded-xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHeader
                      key={header.id}
                      header={header}
                      nonDraggableColumns={nonDraggableColumns}
                      nonSortingColumns={nonSortingColumns}
                    />
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
                      idx % 2 === 0
                        ? "bg-primary-md"
                        : "bg-secondary-color-lt"
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

export default NyneOSTableWithOldVal;
