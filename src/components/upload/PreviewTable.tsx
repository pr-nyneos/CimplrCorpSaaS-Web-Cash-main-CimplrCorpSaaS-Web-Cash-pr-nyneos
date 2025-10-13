import React, { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getExpandedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";
import Pagination from "../table/Pagination.tsx";
import { useNotification } from "../../app/providers/NotificationProvider/Notification.tsx";
import Button from "../ui/Button";

interface PreviewTableProps {
  headers: string[];
  rows: string[][];
  onRemoveRow: (index: number) => void;
  onUpdateRow?: (rowIndex: number, updatedData: Record<string, string>, fileId?: string) => void;
  fileId?: string; // <-- add this
}

interface PreviewRowData {
  id: string;
  originalIndex: number;
  [key: string]: string | number | boolean;
}

const PreviewTable: React.FC<PreviewTableProps> = ({
  headers,
  rows,
  onRemoveRow,
  onUpdateRow,
  fileId,
}) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { notify } = useNotification();

  // Transform rows data into format expected by table
  const data: PreviewRowData[] = useMemo(() => {
    return rows.map((row, index) => {
      const obj: PreviewRowData = {
        id: `row_${index}`,
        originalIndex: index,
      };
      row.forEach((value, colIndex) => {
        obj[`col_${colIndex}`] = value || "";
      });
      return obj;
    });
  }, [rows]);

  // Determine which columns should be visible by default (first 6 columns)
  const defaultVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    headers.forEach((_, index) => {
      visibility[`col_${index}`] = index < 6;
    });
    visibility["remove"] = true;
    visibility["expand"] = true;
    return visibility;
  }, [headers]);

  const expandedRowConfig = useMemo(() => {
    if (headers.length === 0) return undefined;
    const capitalize = (str: string) =>
      str
        .trim()
        .split(/\s+/)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    const allColumns = headers.map((header, index) => ({ header, index }));
    return {
      sections: [
        {
          title: "All Columns",
          fields: allColumns.map(({ index }) => `col_${index}`),
        },
      ],
      fieldLabels: allColumns.reduce((acc, { header, index }) => {
        acc[`col_${index}`] = capitalize(header) || `Column ${index + 1}`;
        return acc;
      }, {} as Record<string, string>),
      editableFields: allColumns.map(({ index }) => `col_${index}`),
    };
  }, [headers]);

  // Handle row updates from the table
  const handleRowUpdate = useCallback(
    async (
      rowId: string,
      updatedFields: Record<string, string | number | boolean>
    ) => {
      if (!onUpdateRow) return true;
      const rowIndex = parseInt(rowId.replace("row_", ""));
      if (isNaN(rowIndex)) return false;
      try {
        const stringFields: Record<string, string> = {};
        Object.keys(updatedFields).forEach((key) => {
          stringFields[key] = String(updatedFields[key]);
        });
        console.log("Updated row values:", stringFields);
        onUpdateRow(rowIndex, stringFields, fileId); // <-- pass fileId
        return true;
      } catch (error) {
        console.error("Error updating row:", error);
        return false;
      }
    },
    [onUpdateRow, fileId]
  );

  // Generate base columns based on headers
  const baseColumns: ColumnDef<PreviewRowData>[] = useMemo(() => {
    return headers.map((header, index) => ({
      id: `col_${index}`,
      accessorKey: `col_${index}`,
      header: () => (
        <span
          className={`font-semibold ${
            !header.trim() ? "text-red-500" : "text-gray-700"
          }`}
        >
          {header.trim() || `Missing Header (${index + 1})`}
        </span>
      ),
      cell: (ctx) => {
        const value = ctx.getValue();
        const strValue = String(value ?? "");
        const isMissing =
          !strValue || strValue.trim() === "" || strValue.trim() === '""';
        return (
          <span
            className={`text-sm ${
              isMissing
                ? "bg-red-100 text-red-800 px-2 py-1 rounded italic"
                : "text-gray-900"
            }`}
          >
            {isMissing ? "Missing" : strValue}
          </span>
        );
      },
      enableSorting: false,
    }));
  }, [headers]);

  // Handle delete functionality
  const handleDelete = useCallback((rowId?: string) => {
    const selectedIds = rowId
      ? [rowId]
      : table.getSelectedRowModel().rows.map((row) => row.original.id);

    if (selectedIds.length === 0) {
      notify("No rows selected", "warning");
      return;
    }

    selectedIds.forEach(id => {
      const rowIndex = parseInt(id.replace("row_", ""));
      if (!isNaN(rowIndex)) {
        onRemoveRow(rowIndex);
      }
    });

    setRowSelection({});
    notify(`${selectedIds.length} row(s) removed`, "success");
  }, [onRemoveRow, notify]);

  // Add actions and expand columns
  const finalColumns: ColumnDef<PreviewRowData>[] = useMemo(() => {
    const actionColumn: ColumnDef<PreviewRowData> = {
      id: "remove",
      header: () => (
        <div className="flex items-center justify-center">
          <span className="text-gray-700 font-semibold">Actions</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors duration-150"
            onClick={() => handleDelete(row.original.id)}
            aria-label="Remove row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    };

    const expandColumn: ColumnDef<PreviewRowData> = {
      id: "expand",
      header: () => (
        <div className="p-2 flex items-center justify-start">
          <ChevronDown className="w-4 h-4 text-primary" />
        </div>
      ),
      cell: ({ row }) => (
        <button
          onClick={() => row.getToggleExpandedHandler()()}
          className="p-2 hover:bg-primary-xl text-primary rounded-md transition-colors"
          aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
        >
          {row.getIsExpanded() ? (
            <ChevronUp className="w-4 h-4 text-primary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-primary" />
          )}
        </button>
      ),
    };

    return expandedRowConfig
      ? [...baseColumns, actionColumn, expandColumn]
      : [...baseColumns, actionColumn];
  }, [baseColumns, expandedRowConfig, handleDelete]);

  const [columnVisibility, setColumnVisibility] = useState(defaultVisibility);

  const table = useReactTable({
    data: data || [],
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: expandedRowConfig ? getExpandedRowModel() : undefined,
    getRowCanExpand: expandedRowConfig ? () => true : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  // Expanded Row Component
  const ExpandedRow = useCallback(({ row }: { row: Row<PreviewRowData> }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState<Record<string, string | number | boolean>>({});

    const handleChange = useCallback((key: string, value: string | number | boolean) => {
      setEditValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    }, []);

    const handleEditToggle = useCallback(async () => {
      if (isEditing) {
        const changedFields = Object.keys(editValues).reduce((acc: Record<string, string | number | boolean>, key) => {
          if (editValues[key] !== row.original[key]) {
            acc[key] = editValues[key];
          }
          return acc;
        }, {});

        if (Object.keys(changedFields).length === 0) {
          setIsEditing(false);
          return;
        }

        if (onUpdateRow) {
          const success = await handleRowUpdate(row.original.id, changedFields);
          if (success) {
            // Log updated row as CSV
            const updatedRow = { ...row.original, ...changedFields };
            // Only include data columns (col_0, col_1, ...)
            const csvValues = Object.keys(updatedRow)
              .filter((key) => key.startsWith("col_"))
              .sort((a, b) => {
                // Sort by column index
                const aIdx = parseInt(a.replace("col_", ""));
                const bIdx = parseInt(b.replace("col_", ""));
                return aIdx - bIdx;
              })
              .map((key) => `"${String(updatedRow[key]).replace(/"/g, '""')}"`);
            console.log("CSV row:", csvValues.join(","));
            setIsEditing(false);
            setEditValues({});
          }
        } else {
          setIsEditing(false);
        }
      } else {
        setEditValues({ ...row.original });
        setIsEditing(true);
      }
    }, [isEditing, editValues, row.original, onUpdateRow, handleRowUpdate]);

    const renderField = useCallback((key: string) => {
      const label = expandedRowConfig?.fieldLabels?.[key] ?? key;
      const isEditable = expandedRowConfig?.editableFields?.includes(key) ?? false;
      let value: string | number | boolean = isEditing ? editValues[key] ?? "" : row.original[key] ?? "";

      if (!isEditing && key.toLowerCase().includes("date")) {
        const date = new Date(String(value));
        value = isNaN(date.getTime()) ? value : date.toLocaleDateString();
      }

      if (!isEditing && typeof value === "boolean") {
        value = value ? "Yes" : "No";
      }

      return (
        <div key={key} className="flex flex-col space-y-1">
          <label className="font-bold text-secondary-text">{label}</label>
          {isEditing && isEditable ? (
            typeof row.original[key] === "boolean" ? (
              <select
                className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
                value={String(editValues[key])}
                onChange={(e) => handleChange(key, e.target.value === "true")}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
                value={String(value || "")}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            )
          ) : (
            <span className="font-medium text-primary-lt">
              {String(value ?? "—")}
            </span>
          )}
        </div>
      );
    }, [isEditing, editValues, row.original, expandedRowConfig, handleChange]);

    if (!expandedRowConfig) return null;

    return (
      <tr key={`${row.id}-expanded`}>
        <td colSpan={table.getVisibleLeafColumns().length} className="px-6 py-4 bg-primary-md">
          <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-secondary-text">
                Additional Information
              </h4>
              {onUpdateRow && (
                <div>
                  <Button onClick={handleEditToggle}>
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                </div>
              )}
            </div>
            {expandedRowConfig.sections.map((section) => (
              <div key={section.title} className="mb-6">
                <h5 className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
                  {section.title}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {section.fields.map(renderField)}
                </div>
              </div>
            ))}
          </div>
        </td>
      </tr>
    );
  }, [expandedRowConfig, onUpdateRow, handleRowUpdate, table]);

  // Calculate pagination values
  const totalItems = table.getFilteredRowModel().rows.length;
  const currentPageItems = table.getRowModel().rows.length;
  const startIndex = pagination.pageIndex * pagination.pageSize + 1;
  const endIndex = Math.min(startIndex + currentPageItems - 1, totalItems);

  // Show empty state if no data
  if (!headers.length || !rows.length) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="text-center py-12 text-primary">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xl font-medium text-primary mb-1">
                No data to preview
              </p>
              <p className="text-md font-medium text-primary">
                Upload a file or add data to see the preview.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto">
        <div className="shadow-lg border border-border">
          <table className="min-w-full">
            <colgroup>
              {table.getVisibleLeafColumns().map((col) => (
                <col key={col.id} className="font-medium" />
              ))}
            </colgroup>
            <thead className="bg-secondary-color rounded-xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border select-none"
                      style={{ width: header.getSize() }}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getPaginationRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={finalColumns.length}
                    className="px-6 py-12 text-center text-primary"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-xl font-medium text-primary mb-1">
                        No data found
                      </p>
                      <p className="text-md font-medium text-gray-500">
                        There is no data to display at the moment.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getPaginationRowModel().rows.map((row, idx) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className={
                        idx % 2 === 0
                          ? "bg-primary-md"
                          : "bg-secondary-color-lt"
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && expandedRowConfig && (
                      <ExpandedRow row={row} />
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Pagination Component */}
        <Pagination
          table={table}
          totalItems={totalItems}
          // currentPageItems={currentPageItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>
    </div>
  );
};

export default PreviewTable;