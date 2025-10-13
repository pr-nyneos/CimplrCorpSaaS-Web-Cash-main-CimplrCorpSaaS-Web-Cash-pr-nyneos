
import React, { useRef, useEffect, useState } from "react";
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
import Button from "../ui/Button";
import LoadingSpinner from "../layout/LoadingSpinner";

type FieldConfig<T> = {
  key: keyof T;
  label?: string;
  type?: string; 
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  options?: { value: string | number; label: string }[];
  oldValue?: keyof T;
  customRender?: (row: any) => React.ReactNode;
};

type Section<T> = {
  title: string;
  fields: FieldConfig<T>[] | ((data: T) => FieldConfig<T>[]);
  editableKeys?: (keyof T)[];
};

type NyneOSTableProps<T> = {
  table: Table<T>;
  columns: ColumnDef<T>[];
  nonDraggableColumns: string[];
  nonSortingColumns: string[];
  sections: Section<T>[];
  isEditing: boolean;
  isSaving: boolean;
  editValues: T;
  column: string;
  loading?: boolean;
  handleCancelEdit?: () => void;
  onChange?: (field: keyof T, value: T[keyof T]) => void;
  handleForwardEditToggle: (row: Row<T>) => void;
  Visibility: boolean;
};

// Helper function to get sort indicator
const getSortIndicator = (isSorted: false | "asc" | "desc") => {
  if (isSorted === "asc") return "▲";
  if (isSorted === "desc") return "▼";
  return <span className="opacity-30">▲▼</span>;
};

// Helper function to handle sorting events
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

// Helper function to determine input type
const getInputType = (
  type: string | undefined,
  originalValue: any,
  key: string | number | symbol
) => {
  if (type) return type;
  if (typeof originalValue === "boolean") return "checkbox";
  if (typeof originalValue === "number") return "number";
  if (String(key).toLowerCase().includes("date")) return "date";
  return "text";
};

// Helper function to format display value
const formatDisplayValue = (key: string | number | symbol, value: any) => {
  if (String(key) === "transactionTimestamp") {
    return new Date(value as string | number | Date).toLocaleString();
  }
  if (
    (String(key).toLowerCase().includes("date") ||
      String(key).toLowerCase().endsWith("at") ||
      String(key) === "effective_from" ||
      String(key) === "effective_to") &&
    value
  ) {
    return formatToDDMMYYYY(value);
  }
  if (typeof value === "number") {
    return String(key) === "totalRate"
      ? Number(value).toFixed(4)
      : value.toLocaleString();
  }
  return String(value ?? "—");
};

// Helper function to find option label
const findOptionLabel = (options: any[] | undefined, value: any) => {
  return (
    options?.find((opt) => String(opt.value) === String(value))?.label ??
    String(value ?? "—")
  );
};

// Helper function to handle input change
const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  originalValue: any,
  key: string | number | symbol,
  onChange: (field: string | number | symbol, value: any) => void
) => {
  let newValue: number | string;
  if (typeof originalValue === "number") {
    newValue = parseFloat(e.target.value) || 0;
  } else {
    newValue = e.target.value;
  }
  onChange(key, newValue);
};

// Component for rendering read-only field
const ReadOnlyField = <T,>({
  type,
  value,
  keyProp,
  options,
}: {
  type: string;
  value: any;
  keyProp: keyof T;
  options?: { value: string | number; label: string }[];
}) => {
  const className =
    type === "select"
      ? "text-sm bg-white"
      : "text-sm bg-white";

  const displayValue =
    type === "select"
      ? findOptionLabel(options, value)
      : formatDisplayValue(keyProp, value);

  return <span className={className}>{displayValue}</span>;
};

// Component for rendering select field
const SelectField = <T,>({
  value,
  readOnlyMode,
  options,
  placeholder,
  label,
  keyProp,
  onChange,
}: {
  value: any;
  readOnlyMode: boolean;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  label?: string;
  keyProp: keyof T;
  onChange: (field: string | number | symbol, value: any) => void;
}) => {
  const selectClassName = `w-full text-sm rounded outline-none transition ${
    readOnlyMode
      ? "border-none bg-transparent"
      : "border border-border bg-white p-2"
  }`;

  return (
    <select
      value={String(value ?? "")}
      onChange={(e) => !readOnlyMode && onChange(keyProp, e.target.value)}
      disabled={readOnlyMode}
      className={selectClassName}
    >
      <option value="" disabled>
        {placeholder || `Select ${label || String(keyProp)}`}
      </option>
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

// Component for rendering input field
const InputField = <T,>({
  type,
  originalValue,
  keyProp,
  value,
  placeholder,
  label,
  maxLength,
  pattern,
  onChange,
}: {
  type?: string;
  originalValue: any;
  keyProp: keyof T;
  value: any;
  placeholder?: string;
  label?: string;
  maxLength?: number;
  pattern?: string;
  onChange: (field: string | number | symbol, value: any) => void;
}) => {
  const inputType = getInputType(type, originalValue, keyProp);
  const step = typeof originalValue === "number" ? "0.0001" : undefined;

  // Convert various date string formats to YYYY-MM-DD for date input
  let inputValue = value;
  if (inputType === "date" && typeof value === "string") {
    // Handle "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      inputValue = value.slice(0, 10);
    }
    // Handle "DD/MM/YYYY"
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split("/");
      inputValue = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    // Handle "DD-MM-YYYY"
    else if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      const [day, month, year] = value.split("-");
      inputValue = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  if (inputType === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(keyProp, e.target.checked)}
        className="w-5 h-5"
      />
    );
  }

  return (
    <input
      type={inputType}
      step={step}
      value={inputValue ?? ""}
      placeholder={placeholder || `Enter ${label || String(keyProp)}`}
      maxLength={maxLength}
      pattern={pattern}
      onChange={(e) => handleInputChange(e, originalValue, keyProp, onChange)}
      className="w-full p-2 text-sm rounded outline-none transition border border-border bg-white"
    />
  );
};

// Component for rendering old value display
const OldValueDisplay = ({
  oldValue,
  displayOldValue,
}: {
  oldValue?: any;
  displayOldValue: any;
}) => {
  if (!oldValue || displayOldValue === undefined) return null;

  return (
    <span className="text-xs text-gray-500">
      Old: {String(displayOldValue ?? "—")}
    </span>
  );
};

// Component for rendering individual field
const FieldRenderer = <T,>({
  fieldConfig,
  row,
  isEditing,
  editValues,
  editableKeys,
  onChange,
}: {
  fieldConfig: FieldConfig<T>;
  row: Row<T>;
  isEditing: boolean;
  editValues: T;
  editableKeys?: (keyof T)[];
  onChange: (field: string | number | symbol, value: any) => void;
}) => {
  const {
    key,
    label,
    type = "text",
    placeholder,
    maxLength,
    pattern,
    options,
    oldValue,
    customRender,
  } = fieldConfig;

  const value = isEditing
    ? editValues[key] ?? row.original[key]
    : row.original[key];
  const originalValue = row.original[key];
  const isEditable = editableKeys?.includes(key);
  const readOnlyMode = !(isEditing && isEditable);
  const displayOldValue =
    oldValue !== undefined ? row.original[oldValue] : originalValue;

  const fieldLabel =
    label ||
    String(key)
      .replace(/([A-Z])/g, " $1")
      .trim();

  if (customRender && readOnlyMode) {
    // Create merged data object with current edit values taking precedence
    const mergedData = {
      original: isEditing ? { ...row.original, ...editValues } : row.original
    };
    
    return (
      <div className="flex flex-col space-y-1">
        <label className="font-bold text-secondary-text capitalize">
          {fieldLabel}
        </label>
        <div className="font-medium text-primary-lt">
          {customRender(mergedData)}
        </div>
      </div>
    );
  }

  let fieldContent: React.ReactNode;
  if (type === "select") {
    if (readOnlyMode) {
      fieldContent = (
        <ReadOnlyField
          type={type}
          value={value}
          keyProp={key}
          options={options}
        />
      );
    } else {
      fieldContent = (
        <>
          <SelectField
            value={value}
            readOnlyMode={readOnlyMode}
            options={options}
            placeholder={placeholder}
            label={label}
            keyProp={key}
            onChange={onChange}
          />
          <OldValueDisplay
            oldValue={oldValue}
            displayOldValue={displayOldValue}
          />
        </>
      );
    }
  } else if (readOnlyMode) {
    fieldContent = <ReadOnlyField type={type} value={value} keyProp={key} />;
  } else {
    fieldContent = (
      <>
        <InputField
          type={type}
          originalValue={originalValue}
          keyProp={key}
          value={value}
          placeholder={placeholder}
          label={label}
          maxLength={maxLength}
          pattern={pattern}
          onChange={onChange}
        />
        <OldValueDisplay
          oldValue={oldValue}
          displayOldValue={displayOldValue}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col space-y-1" key={String(key)}>
      <label className="font-bold text-secondary-text capitalize">
        {fieldLabel}
      </label>
      {fieldContent}
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

// Or define it here if not already present:
const formatToDDMMYYYY = (date: string | number | Date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

function NyneOSTable<T>({
  table,
  columns,
  nonDraggableColumns,
  nonSortingColumns,
  sections,
  isEditing,
  isSaving,
  editValues,
  column,
  onChange,
  loading,
  handleCancelEdit,
  handleForwardEditToggle,
  Visibility,
}: Readonly<NyneOSTableProps<T>>) {
  const safeOnChange = onChange 
    ? (field: string | number | symbol, value: any) => {
        onChange(field as keyof T, value);
      }
    : () => {};
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
                          <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
                            {Visibility && (
                              <div className="flex justify-end mb-4">
                                <div className="flex gap-2">
                                  {(() => {
                                    let buttonText: string;
                                    if (isEditing) {
                                      buttonText = isSaving
                                        ? "Saving..."
                                        : "Save";
                                    } else {
                                      buttonText = "Edit";
                                    }
                                    return (
                                      <Button
                                        onClick={() =>
                                          handleForwardEditToggle(row)
                                        }
                                        color={
                                          isEditing
                                            ? isSaving
                                              ? "Fade"
                                              : "Green"
                                            : "Fade"
                                        }
                                        disabled={isSaving}
                                      >
                                        {buttonText}
                                      </Button>
                                    );
                                  })()}
                                  {isEditing && !isSaving && (
                                    <Button
                                      color="Fade"
                                      onClick={() => {
                                        handleCancelEdit?.();
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {sections.map(({ title, fields, editableKeys }) => (
                              <div key={title} className="mb-6">
                                <div className="text-md font-medium text-primary mb-3 pb-2">
                                  {title}
                                </div>
                                <div className={`grid ${column} gap-4`}>
                                  {(typeof fields === "function"
                                    ? fields(row.original)
                                    : fields
                                  ).map((fieldConfig: FieldConfig<T>) => (
                                    <FieldRenderer
                                      key={String(fieldConfig.key)}
                                      fieldConfig={fieldConfig}
                                      row={row}
                                      isEditing={isEditing}
                                      editValues={editValues}
                                      editableKeys={editableKeys}
                                      onChange={safeOnChange}
                                    />
                                  ))}
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
          </table>
        </DndContext>
      )}
    </div>
  );
}

export default NyneOSTable;