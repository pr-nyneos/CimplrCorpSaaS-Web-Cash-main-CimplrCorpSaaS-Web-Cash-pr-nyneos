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
import type { BankAccountMaster, ClearingCode } from "../../types/masterType";

type FieldConfig<T> = {
  key: keyof T;
  label?: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  options?: { value: string | number; label: string }[];
  oldValue?: keyof T | string; // <-- allow string for oldValue
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


// For BankAccountMaster fields
export type BankAccountFieldConfig = {
  key: keyof BankAccountMaster;
  label?: string;
  type?: string; // "text" | "number" | "date" | "select"
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  options?: { value: string | number; label: string }[];
  oldValue?: keyof BankAccountMaster;
};

export type BankAccountSection = {
  title: string;
  fields: BankAccountFieldConfig[] | ((data: BankAccountMaster) => BankAccountFieldConfig[]);
  editableKeys?: (keyof BankAccountMaster)[];
};

// For ClearingCode fields
export type ClearingCodeFieldConfig = {
  key: keyof ClearingCode;
  label?: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  options?: { value: string | number; label: string }[];
  oldValue?: keyof ClearingCode;
};

export type ClearingCodeSection = {
  title: string;
  fields: ClearingCodeFieldConfig[] | ((data: ClearingCode) => ClearingCodeFieldConfig[]);
  editableKeys?: (keyof ClearingCode)[];
};


// Update your sections array to include proper Clearing Codes fields
const sections: Section<BankAccountMaster>[] = [
  {
    title: "Basic Information",
    fields: [
      { key: "account_number", label: "Account Number", type: "text", oldValue: "old_account_number" },
      { key: "account_nickname", label: "Account Nickname", type: "text", oldValue: "old_account_nickname" },
      { key: "account_type", label: "Account Type", type: "select", options: [
        { value: "Savings", label: "Savings" },
        { value: "Current", label: "Current" },
        { value: "Credit", label: "Credit" },
        { value: "Others", label: "Others" },
      ], oldValue: "old_account_type" },
      { key: "account_status", label: "Status", type: "select", options: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
        { value: "Pending", label: "Pending" },
      ], oldValue: "old_account_status" },
      { key: "account_currency", label: "Currency", type: "text", oldValue: "old_account_currency" },
      { key: "credit_limit", label: "Credit Limit", type: "text", oldValue: "old_credit_limit" },
      { key: "iban", label: "IBAN", type: "text", oldValue: "old_iban" },
      { key: "branch_name", label: "Branch Name", type: "text", oldValue: "old_branch_name" },
      { key: "branch_address", label: "Branch Address", type: "text", oldValue: "old_branch_address" },
    ],
    editableKeys: [
      "account_number",
      "account_nickname",
      "account_type",
      "account_status",
      "account_currency",
      "credit_limit",
      "iban",
      "branch_name",
      "branch_address",
    ],
  },
  {
    title: "Bank & Entity Info",
    fields: [
      { key: "bank_name", label: "Bank Name", type: "text" },
      { key: "entity_name", label: "Entity Name", type: "text" },
      { key: "account_id", label: "Account ID", type: "text" },
      { key: "old_bank_id", label: "Old Bank ID", type: "text" },
      { key: "old_entity_id", label: "Old Entity ID", type: "text" },
      { key: "bank_id", label: "Bank ID", type: "text" },
      { key: "entity_id", label: "Entity ID", type: "text" },
    ],
    editableKeys: ["bank_name", "entity_name"],
  },
];

function NyneOSTable({
  table,
  columns,
  nonDraggableColumns,
  nonSortingColumns,
  isEditing,
  isSaving,
  editValues,
  column,
  onChange,
  loading,
  handleCancelEdit,
  handleForwardEditToggle,
  Visibility,
}: NyneOSTableProps<BankAccountMaster>) {
  const safeOnChange = onChange ?? (() => {});
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

//   function hasClearingCodes(clearingCodes: any): clearingCodes is ClearingCode[] {
//     return Array.isArray(clearingCodes);
//   }

  return (
    <div className="shadow-lg border border-border lg:overflow-x-auto md:overflow-x-auto">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <table className="w-full table-auto">
            <thead className="bg-secondary-color rounded-xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isDraggable = !nonDraggableColumns.includes(
                      header.column.id
                    );
                    const canSort = !nonSortingColumns.includes(
                      header.column.id
                    );
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
                            {/* Edit/Save Button */}
                            {Visibility && (
                              <div className="flex justify-end mb-4">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleForwardEditToggle(row)}
                                    color={
                                      isEditing
                                        ? isSaving
                                          ? "Fade"
                                          : "Green"
                                        : "Fade"
                                    }
                                    disabled={isSaving}
                                  >
                                    {isEditing
                                      ? isSaving
                                        ? "Saving..."
                                        : "Save"
                                      : "Edit"}
                                  </Button>
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

                            {/* Render sections and fields using RenderField */}
                            {sections.map(({ title, fields, editableKeys }) => (
                              <div key={title} className="mb-6">
                                {/* Section Title */}
                                <div className="text-md font-medium text-primary mb-3 pb-2">
                                  {title}
                                </div>
                                <div className={`grid ${column} gap-4`}>
                                  {typeof fields === "function"
                                    ? fields(row.original).map(
                                        ({
                                          key,
                                          label,
                                          type = "text",
                                          placeholder,
                                          maxLength,
                                          pattern,
                                          options, // for select
                                          // required,
                                          oldValue, // <-- Add this
                                          customRender,
                                        }: FieldConfig<BankAccountMaster>) => {
                                          const value = isEditing
                                            ? editValues[key] ??
                                              row.original[key]
                                            : row.original[key];
                                          const originalValue =
                                            row.original[key];
                                          const isEditable =
                                            editableKeys?.includes(key);
                                          const readOnlyMode = !(
                                            isEditing && isEditable
                                          );

                                          // Use oldValue as a key to get the value from row.original
                                          const displayOldValue =
                                            oldValue !== undefined && oldValue in row.original
                                              ? row.original[oldValue as keyof BankAccountMaster]
                                              : originalValue;

                                          // If custom render function is provided and we're in read-only mode, use it
                                          if (customRender && readOnlyMode) {
                                            return (
                                              <div
                                                className="flex flex-col space-y-1"
                                                key={String(key)}
                                              >
                                                <label className="font-bold text-secondary-text capitalize">
                                                  {label ||
                                                    String(key)
                                                      .replace(/([A-Z])/g, " $1")
                                                      .trim()}
                                                </label>
                                                <div className="font-medium text-primary-lt">
                                                  {customRender(row)}
                                                </div>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div
                                              className="flex flex-col space-y-1"
                                              key={String(key)}
                                            >
                                              {/* Label */}
                                              <label className="font-bold text-secondary-text capitalize">
                                                {label ||
                                                  String(key)
                                                    .replace(/([A-Z])/g, " $1")
                                                    .trim()}
                                                {/* {required && <span className="text-red-500"> *</span>} */}
                                              </label>

                                              {/* Always Input / Select */}
                                              {type === "select" ? (
                                                readOnlyMode ? (
                                                  <span className="p-2 text-sm bg-white text-primary-lt">
                                                    {options?.find(
                                                      (opt) =>
                                                        String(opt.value) ===
                                                        String(value)
                                                    )?.label ??
                                                      String(value ?? "—")}
                                                  </span>
                                                ) : (
                                                  <>
                                                    <select
                                                      value={String(
                                                        value ?? ""
                                                      )}
                                                      onChange={(e) =>
                                                        !readOnlyMode &&
                                                        safeOnChange?.(
                                                          key,
                                                          e.target
                                                            .value as BankAccountMaster[keyof BankAccountMaster]
                                                        )
                                                      }
                                                      disabled={readOnlyMode}
                                                      className={`w-full p-2 text-sm rounded outline-none transition text-primary-lt
                                                        ${
                                                          readOnlyMode
                                                            ? "border-none bg-transparent p-2"
                                                            : "border border-border bg-white"
                                                        }
                                                      `}
                                                    >
                                                      <option value="" disabled>
                                                        {placeholder ||
                                                          `Select ${
                                                            label || String(key)
                                                          }`}
                                                      </option>
                                                      {options?.map((opt) => (
                                                        <option
                                                          key={opt.value}
                                                          value={opt.value}
                                                        >
                                                          {opt.label}
                                                        </option>
                                                      ))}
                                                    </select>
                                                    {/* Old value */}
                                                    {isEditing &&
                                                      isEditable &&
                                                      oldValue &&
                                                      displayOldValue !==
                                                        undefined && (
                                                        <span className="text-xs text-gray-500">
                                                          Old:{" "}
                                                          {String(
                                                            displayOldValue ??
                                                              "—"
                                                          )}
                                                        </span>
                                                      )}
                                                  </>
                                                )
                                              ) : readOnlyMode ? (
                                                <span className="p-2 text-sm bg-white">
                                                  {String(key) ===
                                                  "transactionTimestamp"
                                                    ? new Date(
                                                        value as
                                                          | string
                                                          | number
                                                          | Date
                                                      ).toLocaleString()
                                                    : typeof value === "number"
                                                    ? String(key) ===
                                                      "totalRate"
                                                      ? Number(value).toFixed(4)
                                                      : value.toLocaleString()
                                                    : String(value ?? "—")}
                                                </span>
                                              ) : (
                                                <>
                                                  <input
                                                    type={
                                                      type ||
                                                      (typeof originalValue ===
                                                      "number"
                                                        ? "number"
                                                        : String(key)
                                                            .toLowerCase()
                                                            .includes("date")
                                                        ? "date"
                                                        : "text")
                                                    }
                                                    step={
                                                      typeof originalValue ===
                                                      "number"
                                                        ? "0.0001"
                                                        : undefined
                                                    }
                                                    value={String(value ?? "")}
                                                    placeholder={
                                                      placeholder ||
                                                      `Enter ${
                                                        label || String(key)
                                                      }`
                                                    }
                                                    maxLength={maxLength}
                                                    pattern={pattern}
                                                    onChange={(e) => {
                                                      let newValue:
                                                        | number
                                                        | string;
                                                      if (
                                                        typeof originalValue ===
                                                        "number"
                                                      ) {
                                                        newValue =
                                                          parseFloat(
                                                            e.target.value
                                                          ) || 0;
                                                      } else {
                                                        newValue =
                                                          e.target.value;
                                                      }
                                                      safeOnChange?.(
                                                        key,
                                                        newValue as BankAccountMaster[keyof BankAccountMaster]
                                                      );
                                                    }}
                                                    className="w-full p-2 text-sm rounded outline-none transition border border-border bg-white"
                                                  />
                                                  {/* Old value */}
                                                  {isEditing &&
                                                    isEditable &&
                                                    oldValue &&
                                                    displayOldValue !==
                                                      undefined && (
                                                      <span className="text-xs text-gray-500">
                                                        Old:{" "}
                                                        {String(
                                                          displayOldValue ?? "—"
                                                        )}
                                                      </span>
                                                    )}
                                                </>
                                              )}
                                            </div>
                                          );
                                        }
                                      )
                                    : (fields as FieldConfig<BankAccountMaster>[]).map(
                                        ({
                                          key,
                                          label,
                                          type = "text",
                                          placeholder,
                                          maxLength,
                                          pattern,
                                          options,
                                          oldValue,
                                          customRender,
                                        }: FieldConfig<BankAccountMaster>) => {
                                          const value = isEditing
                                            ? editValues[key] ??
                                              row.original[key]
                                            : row.original[key];
                                          const originalValue =
                                            row.original[key];
                                          const isEditable =
                                            editableKeys?.includes(key);
                                          const readOnlyMode = !(
                                            isEditing && isEditable
                                          );

                                          // Use oldValue as a key to get the value from row.original
                                          const displayOldValue =
                                            oldValue !== undefined && oldValue in row.original
                                              ? row.original[oldValue as keyof BankAccountMaster]
                                              : originalValue;

                                          // If custom render function is provided and we're in read-only mode, use it
                                          if (customRender && readOnlyMode) {
                                            return (
                                              <div
                                                className="flex flex-col space-y-1"
                                                key={String(key)}
                                              >
                                                <label className="font-bold text-secondary-text capitalize">
                                                  {label ||
                                                    String(key)
                                                      .replace(/([A-Z])/g, " $1")
                                                      .trim()}
                                                </label>
                                                <div className="font-medium text-primary-lt">
                                                  {customRender(row)}
                                                </div>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div
                                              className="flex flex-col space-y-1"
                                              key={String(key)}
                                            >
                                              {/* Label */}
                                              <label className="font-bold text-secondary-text capitalize">
                                                {label ||
                                                  String(key)
                                                    .replace(/([A-Z])/g, " $1")
                                                    .trim()}
                                                {/* {required && <span className="text-red-500"> *</span>} */}
                                              </label>

                                              {/* Always Input / Select */}
                                              {type === "select" ? (
                                                readOnlyMode ? (
                                                  <span className="p-2 text-sm bg-white">
                                                    {options?.find(
                                                      (opt) =>
                                                        String(opt.value) ===
                                                        String(value)
                                                    )?.label ??
                                                      String(value ?? "—")}
                                                  </span>
                                                ) : (
                                                  <>
                                                    <select
                                                      value={String(
                                                        value ?? ""
                                                      )}
                                                      onChange={(e) =>
                                                        !readOnlyMode &&
                                                        safeOnChange?.(
                                                          key,
                                                          e.target
                                                            .value as BankAccountMaster[keyof BankAccountMaster]
                                                        )
                                                      }
                                                      disabled={readOnlyMode}
                                                      className={`w-full p-2 text-sm rounded outline-none transition
                                                        ${
                                                          readOnlyMode
                                                            ? "border-none bg-transparent p-2 text-primary-lt"
                                                            : "border border-border bg-white"
                                                        }
                                                      `}
                                                    >
                                                      <option value="" disabled>
                                                        {placeholder ||
                                                          `Select ${
                                                            label || String(key)
                                                          }`}
                                                      </option>
                                                      {options?.map((opt) => (
                                                        <option
                                                          key={opt.value}
                                                          value={opt.value}
                                                        >
                                                          {opt.label}
                                                        </option>
                                                      ))}
                                                    </select>
                                                    {/* Old value */}
                                                    {isEditing &&
                                                      isEditable &&
                                                      oldValue &&
                                                      displayOldValue !==
                                                        undefined && (
                                                        <span className="text-xs text-gray-500">
                                                          Old:{" "}
                                                          {String(
                                                            displayOldValue ??
                                                              "—"
                                                          )}
                                                        </span>
                                                      )}
                                                  </>
                                                )
                                              ) : readOnlyMode ? (
                                                <span className="p-2 text-sm bg-white">
                                                  {String(key) ===
                                                  "transactionTimestamp"
                                                    ? new Date(
                                                        value as
                                                          | string
                                                          | number
                                                          | Date
                                                      ).toLocaleString()
                                                    : typeof value === "number"
                                                    ? String(key) ===
                                                      "totalRate"
                                                      ? Number(value).toFixed(4)
                                                      : value.toLocaleString()
                                                    : String(value ?? "—")}
                                                </span>
                                              ) : (
                                                <>
                                                  <input
                                                    type={
                                                      type ||
                                                      (typeof originalValue ===
                                                      "number"
                                                        ? "number"
                                                        : String(key)
                                                            .toLowerCase()
                                                            .includes("date")
                                                        ? "date"
                                                        : "text")
                                                    }
                                                    step={
                                                      typeof originalValue ===
                                                      "number"
                                                        ? "0.0001"
                                                        : undefined
                                                    }
                                                    value={String(value ?? "")}
                                                    placeholder={
                                                      placeholder ||
                                                      `Enter ${
                                                        label || String(key)
                                                      }`
                                                    }
                                                    maxLength={maxLength}
                                                    pattern={pattern}
                                                    onChange={(e) => {
                                                      let newValue:
                                                        | number
                                                        | string;
                                                      if (
                                                        typeof originalValue ===
                                                        "number"
                                                      ) {
                                                        newValue =
                                                          parseFloat(
                                                            e.target.value
                                                          ) || 0;
                                                      } else {
                                                        newValue =
                                                          e.target.value;
                                                      }
                                                      safeOnChange?.(
                                                        key,
                                                        newValue as BankAccountMaster[keyof BankAccountMaster]
                                                      );
                                                    }}
                                                    className="w-full p-2 text-sm rounded outline-none transition border border-border bg-white"
                                                  />
                                                  {/* Old value */}
                                                  {isEditing &&
                                                    isEditable &&
                                                    oldValue &&
                                                    displayOldValue !==
                                                      undefined && (
                                                      <span className="text-xs text-gray-500">
                                                        Old:{" "}
                                                        {String(
                                                          displayOldValue ?? "—"
                                                        )}
                                                      </span>
                                                    )}
                                                </>
                                              )}
                                            </div>
                                          );
                                        }
                                      )}
                                  </div>
                                </div>
                            //   </div>
                            ))}
                            {/* Clearing Codes Section */}
                            {sections && Array.isArray(row.original.clearing_codes) && row.original.clearing_codes.length > 0 && (
                              <div className="mb-6">
                                <div className="text-md font-medium text-primary mb-3 pb-2">
                                  Clearing Codes
                                </div>
                                <div className={`grid ${column} gap-4`}>
                                  {row.original.clearing_codes?.map((code, idx) => (
                                    <React.Fragment key={idx}>
                                      {/* Code Type */}
                                      <div className="flex flex-col space-y-1">
                                        <label className="font-bold text-secondary-text capitalize">
                                          Clearing Code Type {idx + 1}
                                        </label>
                                        {isEditing ? (
                                          <>
                                            <select
                                              value={
                                                getNestedValue(editValues, `clearing_codes[${idx}].code_type`) ??
                                                code.code_type
                                              }
                                              onChange={(e) => {
                                                const updated = JSON.parse(
                                                  JSON.stringify(editValues.clearing_codes ?? row.original.clearing_codes)
                                                );
                                                updated[idx] = {
                                                  ...updated[idx],
                                                  code_type: e.target.value,
                                                };
                                                safeOnChange("clearing_codes", updated as any);
                                              }}
                                              className="w-full p-2 text-sm rounded outline-none transition border border-border bg-white"
                                            >
                                              <option value="">Select Clearing Code Type</option>
                                              <option value="IFSC">IFSC</option>
                                              <option value="ABA Routing">ABA Routing</option>
                                              <option value="SWIFT/BIC">SWIFT/BIC</option>
                                            </select>
                                            {code.old_code_type && (
                                              <span className="text-xs text-gray-500">
                                                Old: {code.old_code_type}
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <span className="p-2 text-sm bg-white">
                                            {code.code_type || "—"}
                                          </span>
                                        )}
                                      </div>
                                      {/* Code Value */}
                                      <div className="flex flex-col space-y-1">
                                        <label className="font-bold text-secondary-text capitalize">
                                          Clearing Code Value {idx + 1}
                                        </label>
                                        {isEditing ? (
                                          <>
                                            <input
                                              type="text"
                                              value={
                                                getNestedValue(editValues, `clearing_codes[${idx}].code_value`) ??
                                                code.code_value
                                              }
                                              onChange={(e) => {
                                                const updated = JSON.parse(JSON.stringify(editValues.clearing_codes ?? row.original.clearing_codes));
                                                updated[idx] = {
                                                  ...updated[idx],
                                                  code_value: e.target.value,
                                                };
                                                safeOnChange("clearing_codes", updated as any);
                                              }}
                                              className="w-full p-2 text-sm rounded outline-none transition border border-border bg-white"
                                            />
                                            {(
                                              <span className="text-xs text-gray-500">
                                                Old: {code.old_code_value}
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <span className="p-2 text-sm bg-white">
                                            {code.code_value || "—"}
                                          </span>
                                        )}
                                      </div>
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            )}
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

// --- Add below your imports ---

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => {
    if (part.includes('[') && part.includes(']')) {
      const arrayPart = part.split('[');
      const arrayName = arrayPart[0];
      const index = parseInt(arrayPart[1].replace(']', ''), 10);
      return acc && acc[arrayName] && acc[arrayName][index];
    }
    return acc && acc[part];
  }, obj);
};
