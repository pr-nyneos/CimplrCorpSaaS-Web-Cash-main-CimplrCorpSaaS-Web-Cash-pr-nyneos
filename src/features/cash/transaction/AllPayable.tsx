import React, { useRef, useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Search, Trash2 } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";

import nos from "../../../utils/nos.tsx";
import { sections } from "./config";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import NyneOSTable from "../../../components/table/NyneOSTable";
import Button from "../../../components/ui/Button";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import type { Update } from "../../../types/type.ts";
import Pagination from "../../../components/table/Pagination.tsx";
import { is } from "date-fns/locale";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export interface Payable {
  payable_id: string;
  entity_name: string;
  counterparty_name: string;
  invoice_number: string;
  invoice_date: string; // ISO date string
  due_date: string; // ISO date string
  amount: number;
  currency_code: string;

  old_entity_name: string;
  old_counterparty_name: string;
  old_invoice_number: string;
  old_invoice_date: string;
  old_due_date: string;
  old_amount: number;
  old_currency_code: string;

  status: string;
  created_by: string;
  created_at: string;
  edited_by: string;
  edited_at: string;
  deleted_by: string;
  deleted_at: string;
}

type BankMasterResponse = {
  success: boolean;
  data?: {
    payables: Payable[];
  };
  error: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  expand: true,
  action: true,

  payable_id: false,
  entity_name: true,
  counterparty_name: true,
  invoice_number: true,
  invoice_date: true,
  due_date: true,
  amount: true,
  currency_code: true,

  old_entity_name: false,
  old_counterparty_name: false,
  old_invoice_number: false,
  old_invoice_date: false,
  old_due_date: false,
  old_amount: false,
  old_currency_code: false,

  status: true,
  created_by: false,
  created_at: false,
  edited_by: false,
  edited_at: false,
  deleted_by: false,
  deleted_at: false,
};

const AllPayable: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "payable_id",
    "entity_name",
    "counterparty_name",
    "invoice_number",
    "invoice_date",
    "due_date",
    "amount",
    "currency_code",

    "old_entity_name",
    "old_counterparty_name",
    "old_invoice_number",
    "old_invoice_date",
    "old_due_date",
    "old_amount",
    "old_currency_code",

    "status",
    "created_by",
    "created_at",
    "edited_by",
    "edited_at",
    "deleted_by",
    "deleted_at",
    "action",
    "expand",
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editValues, setEditValues] = useState<Payable>({} as Payable);
  const [data, setData] = useState<Payable[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const { notify, confirm } = useNotification();

  useEffect(() => {
    setLoading(true);
    nos
      .post<BankMasterResponse>(`${apiBaseUrl}/cash/transactions/all`)
      .then((response) => {
        if (response.data.success && response.data.data) {
          setData(response.data.data.payables);
          setLoading(false);
        } else {
          notify(response.data.error, "error");
          setLoading(false);
        }
      })
      .catch(() => {
        notify("Network error. Please try again.", "error");
        setLoading(false);
      });
  }, []);

  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.payable_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one Payable to approve.", "warning");
      return;
    }
    const selectedCategoryObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);
    if (
      selectedCategoryObjs.some(
        (row) =>
          row &&
          typeof row.status === "string" &&
          row.status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot approve a Payable that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this payable"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      transaction_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/cash/transactions/bulk-approve`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.payable_id)) {
              if (
                typeof row.status === "string" &&
                row.status.toUpperCase() === "PENDING_DELETE_APPROVAL"
              ) {
                return false; // drop rows marked for deletion
              }
              row.status = "APPROVED";
            }
            return true;
          })
        );
        notify("Payable approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleDelete = async (payable_id: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.payable_id);

    const selectedRowNames = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.payable_id);

    const selectedObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedObjs
        : [data.find((item) => item.payable_id === payable_id)].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.status === "string" &&
          row.status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a Payable that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectedRowNames.join(", ") : payable_id
      } payable(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      transaction_ids: selectedRows.length > 0 ? selectedRows : [payable_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/cash/transactions/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.transaction_ids.includes(row.payable_id)
              ? { ...row, status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${payable_id} deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleReject = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.payable_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one Payable to reject.", "warning");
      return;
    }
    const selectedCategoryObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);
    if (
      selectedCategoryObjs.some(
        (row) =>
          row &&
          typeof row.status === "string" &&
          row.status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot approve a Payable that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this payable"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      transaction_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/cash/transactions/bulk-reject`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.payable_id)
              ? { ...row, status: "REJECTED" }
              : row
          )
        );
        notify("Payable rejected successfully.", "success");
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleEditChange = (
    field: keyof Payable,
    value: Payable[keyof Payable]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as Payable);
  };

  const handleForwardEditToggle = async (row: Row<Payable>) => {
    if (isEditing) {
      const changedFields = (row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve ${row.original.counterparty_name}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      const payload = {
        id: row.original.payable_id,
        fields: { ...changedFields },
        reason: result.inputValue || "",
      };

      try {
        setIsSaving(true);
        const response = await nos.post<Update>(
          `${apiBaseUrl}/cash/transactions/update`,
          payload
        );

        if (response.data.success) {
          setData((prev) =>
            prev.map((row) =>
              row.payable_id.includes(row.payable_id)
                ? { ...row, status: "PENDING_EDIT_APPROVAL" }
                : row
            )
          );
          setIsEditing(false);
          notify("Payable updated successfully!", "success");
        } else {
          notify(
            response.data?.results?.[0]?.error || "Update failed",
            "error"
          );
        }
      } catch (error) {
        notify("An error occurred while updating the payable.", "error");
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as Payable);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<Payable>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-primary-lt focus:ring-2"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-primary-lt focus:ring-2"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: "payable_id",
        header: "Payable ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "entity_name",
        header: "Entity Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "counterparty_name",
        header: "Counterparty Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "invoice_number",
        header: "Invoice Number",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "invoice_date",
        header: "Invoice Date",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue }) => (
          <span className="font-semibold">
            {(getValue() as number)?.toLocaleString() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "currency_code",
        header: "Currency",
        cell: ({ getValue }) => (
          <span className="uppercase">{(getValue() as string) || "—"}</span>
        ),
      },
      // Old fields
      {
        accessorKey: "old_entity_name",
        header: "Old Entity Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_counterparty_name",
        header: "Old Counterparty Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_invoice_number",
        header: "Old Invoice Number",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_invoice_date",
        header: "Old Invoice Date",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "old_due_date",
        header: "Old Due Date",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "old_amount",
        header: "Old Amount",
        cell: ({ getValue }) => (
          <span className="font-semibold">
            {(getValue() as number)?.toLocaleString() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "old_currency_code",
        header: "Old Currency",
        cell: ({ getValue }) => (
          <span className="uppercase">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return "—";
          // Format status name
          const formatted = value
            .toLowerCase()
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getProcessingStatusColor(
                value
              )}`}
            >
              {formatted}
            </span>
          );
        },
      },
      {
        accessorKey: "created_by",
        header: "Created By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "edited_by",
        header: "Edited By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "edited_at",
        header: "Edited At",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "deleted_by",
        header: "Deleted By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "deleted_at",
        header: "Deleted At",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        id: "expand",
        header: ({ table }) => (
          <button
            type="button"
            className="p-2 flex items-center justify-start"
            onClick={() => table.toggleAllRowsExpanded()}
            title={table.getIsAllRowsExpanded() ? "Collapse All" : "Expand All"}
          >
            {table.getIsAllRowsExpanded() ? (
              <ChevronUp className="w-4 h-4 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-primary" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <button
            onClick={() => {
              row.toggleExpanded();
              if (!row.getIsExpanded()) {
                setTimeout(() => scrollExpandedRowIntoView(row.id), 100);
              }
            }}
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
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDelete(row.original.payable_id)}
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [isEditing, editValues]
  );

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item)
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(lowerSearch));
      });
    }

    if (statusFilter !== "All") {
      result = result.filter((item) => item.status === statusFilter);
    }

    return result;
  }, [data, searchTerm, statusFilter]);

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.status) options.add(item.status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

  const table = useReactTable({
    data: filteredData,
    columns,
    enableRowSelection: true,
    onRowSelectionChange: setSelectedRowIds,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnOrder,
      rowSelection: selectedRowIds,
      columnVisibility,
      sorting,
    },
    onSortingChange: setSorting,
    enableMultiSort: true,
  });

  return (
    <div className="w-full space-y-4">
      <div className="-mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text">
            Status
          </label>
          <select
            className="text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
        <div className="col-span-1 md:col-span-4 flex items-center justify-end gap-4">
          {/* Search Form */}
          <form
            className="relative flex items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              placeholder="Search"
              className="w-full text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none hover:border hover:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
              tabIndex={-1}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2 justify-end">
              <Button onClick={handleApprove}>Approve</Button>
              <Button onClick={handleReject} color="Green">
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>

      <NyneOSTable<Payable>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
        sections={sections}
        isEditing={isEditing}
        isSaving={isSaving}
        loading={loading}
        editValues={editValues}
        onChange={handleEditChange}
        column={`grid grid-cols-6`}
        handleCancelEdit={handleCancelEdit}
        handleForwardEditToggle={handleForwardEditToggle}
        Visibility={true}
      />

      <Pagination
        table={table}
        totalItems={filteredData.length}
        startIndex={
          filteredData.length === 0
            ? 0
            : table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
              1
        }
        endIndex={Math.min(
          (table.getState().pagination.pageIndex + 1) *
            table.getState().pagination.pageSize,
          filteredData.length
        )}
      />
    </div>
  );
};

export default AllPayable;
