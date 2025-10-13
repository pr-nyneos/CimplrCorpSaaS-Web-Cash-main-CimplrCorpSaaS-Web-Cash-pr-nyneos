import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type Row,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import { ChevronDown, ChevronUp, Search, Trash2, Eye } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import type { UpdateRow } from "../../../types/type.ts";

import { sections } from "./config";
import type { CounterpartyRow } from "../../../types/masterType";
import NyneOSTable from "../../../components/table/NyneOSTable";
import nos from "../../../utils/nos.tsx";
import Button from "../../../components/ui/Button.tsx";
import Pagination from "../../../components/table/Pagination.tsx";
import { useNavigate } from "react-router-dom";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const defaultColumnVisibility: Record<string, boolean> = {
  counterparty_id: true,
  input_method: false,
  counterparty_name: true,
  old_counterparty_name: false,
  counterparty_code: true,
  old_counterparty_code: false,
  counterparty_type: true,
  old_counterparty_type: false,
  address: false,
  old_address: false,
  status: true,
  old_status: false,
  country: true,
  old_country: false,
  contact: false,
  old_contact: false,
  email: false,
  old_email: false,
  eff_from: false,
  old_eff_from: false,
  eff_to: false,
  old_eff_to: false,
  tags: false,
  old_tags: false,
  processing_status: true,
  requested_by: false,
  requested_at: false,
  action_type: false,
  action_id: false,
  checker_by: false,
  checker_at: false,
  checker_comment: false,
  reason: false,
  created_by: false,
  created_at: false,
  edited_by: false,
  edited_at: false,
  deleted_by: false,
  deleted_at: false,

  // UI-only columns
  action: true,
  select: true,
  expand: true,
};

type CounterpartyResponse = {
  success: boolean;
  rows?: CounterpartyRow[];
  error: string;
};
// Mock data for demonstration

const AllCounterpartyRow: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select", // UI
    "counterparty_id",
    "counterparty_name",
    "counterparty_code",
    "country",
    "counterparty_type",
    "status",
    "processing_status",
    "action", // UI
    "expand",
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editValues, setEditValues] = useState<CounterpartyRow>(
    {} as CounterpartyRow
  );
  const [data, setData] = useState<CounterpartyRow[]>([]);

  const navigate = useNavigate();
  const visibility = useAllTabPermissions("counterparty-master");
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.processing_status) options.add(item.processing_status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

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
      result = result.filter((item) => item.processing_status === statusFilter);
    }

    return result;
  }, [data, searchTerm, statusFilter]);

  const { notify, confirm } = useNotification();

  useEffect(() => {
    setLoading(true);
    nos
      .post<CounterpartyResponse>(`${apiBaseUrl}/master/v2/counterparty/names`)
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setData(response.data.rows);
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

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      action: !!visibility.delete, // show if true, hide if false
    }));
  }, [visibility.delete]);

  const handleReject = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.counterparty_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one Counterparty to reject.", "warning");
      return;
    }
    const selectedCategoryObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);
    if (
      selectedCategoryObjs.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot approve a Payable/Receivable that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this counterparty"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      counterparty_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<CounterpartyResponse>(
        `${apiBaseUrl}/master/counterparty/bulk-reject`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.counterparty_id)
              ? { ...row, processing_status: "REJECTED" }
              : row
          )
        );
        notify("Counterparty rejected successfully.", "success");
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.counterparty_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one Counterparty to approve.", "warning");
      return;
    }
    const selectedCategoryObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);
    if (
      selectedCategoryObjs.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot approve a Payable/Receivable that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this counterparty"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      counterparty_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<CounterpartyResponse>(
        `${apiBaseUrl}/master/v2/counterparty/bulk-approve`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.counterparty_id)) {
              if (
                typeof row.processing_status === "string" &&
                row.processing_status.toUpperCase() ===
                  "PENDING_DELETE_APPROVAL"
              ) {
                return false; // drop rows marked for deletion
              }
              row.processing_status = "APPROVED";
            }
            return true;
          })
        );
        // setRefresh(!refresh);
        notify("Counterparty approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleDelete = async (
    counterparty_id: string,
    counterparty_name: string
  ) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.counterparty_id);

    const selectedRowNames = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.counterparty_name);

    const selectedObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedObjs
        : [
            data.find((item) => item.counterparty_id === counterparty_id),
          ].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a Counterparty that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0
          ? selectedRowNames.join(", ")
          : counterparty_name
      } counterparty(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      counterparty_ids:
        selectedRows.length > 0 ? selectedRows : [counterparty_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<CounterpartyResponse>(
        `${apiBaseUrl}/master/counterparty/delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.counterparty_ids.includes(row.counterparty_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${counterparty_name} deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as CounterpartyRow);
  };

  const handleEditChange = (
    field: keyof CounterpartyRow,
    value: CounterpartyRow[keyof CounterpartyRow]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleForwardEditToggle = async (row: Row<CounterpartyRow>) => {
    if (isEditing) {
      const changedFields = editValues; // compare row.original vs editValues if needed
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve ${row.original.counterparty_name}?`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      const payload = {
        rows: [
          {
            counterparty_id: row.original.counterparty_id,
            fields: { ...editValues },
            reason: result.inputValue || "",
          },
        ],
      };

      try {
        setIsSaving(true);
        const response = await nos.post<UpdateRow>(
          `${apiBaseUrl}/master/v2counterparty/updatebulk`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.rows[0].success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...editValues } : item
            )
          );
          setIsEditing(false);
          notify("Counterparty updated successfully!", "success");
        } else {
          notify(response.data?.rows[0].error || "Update failed", "error");
        }
      } catch (error) {
        notify("An error occurred while updating the Counterparty.", "error");
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as CounterpartyRow);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<CounterpartyRow>[]>(
    () => [
      // Select
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

      // Core identifiers
      { accessorKey: "counterparty_id", header: "Counterparty ID" },
      { accessorKey: "counterparty_code", header: "Counterparty Code" },
      { accessorKey: "counterparty_name", header: "Counterparty Name" },
      { accessorKey: "counterparty_type", header: "Type" },

      // Details
      { accessorKey: "input_method", header: "Input Method" },
      { accessorKey: "address", header: "Address" },
      { accessorKey: "contact", header: "Contact" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "country", header: "Country" },
      { accessorKey: "tags", header: "Tags" },

      // Audit Info
      { accessorKey: "created_at", header: "Created At" },
      { accessorKey: "created_by", header: "Created By" },
      { accessorKey: "edited_at", header: "Edited At" },
      { accessorKey: "edited_by", header: "Edited By" },
      { accessorKey: "deleted_at", header: "Deleted At" },
      { accessorKey: "deleted_by", header: "Deleted By" },
      { accessorKey: "requested_at", header: "Requested At" },
      { accessorKey: "requested_by", header: "Requested By" },
      { accessorKey: "checker_at", header: "Checker At" },
      { accessorKey: "checker_by", header: "Checker By" },
      { accessorKey: "checker_comment", header: "Checker Comment" },

      // Statuses
      {
        accessorKey: "status",
        header: "Active Status",
        cell: ({ getValue }) => {
          const status = (getValue() as string)?.toLowerCase();
          const statusColors: Record<string, string> = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-red-100 text-red-800",
          };
          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {(getValue() as string) || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "processing_status",
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          if (!value) return "—";
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
      { accessorKey: "reason", header: "Reason" },

      // Old Values
      { accessorKey: "old_counterparty_name", header: "Old Counterparty Name" },
      { accessorKey: "old_counterparty_code", header: "Old Counterparty Code" },
      { accessorKey: "old_counterparty_type", header: "Old Type" },
      { accessorKey: "old_address", header: "Old Address" },
      { accessorKey: "old_contact", header: "Old Contact" },
      { accessorKey: "old_email", header: "Old Email" },
      { accessorKey: "old_country", header: "Old Country" },
      { accessorKey: "old_tags", header: "Old Tags" },
      { accessorKey: "old_status", header: "Old Status" },
      { accessorKey: "old_eff_from", header: "Old Effective From" },
      { accessorKey: "old_eff_to", header: "Old Effective To" },

      // Action (UI-only)
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <button
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-blue-600 hover:bg-primary-xl transition-colors"
              onClick={() =>
                navigate(`/counterparty/counterparty-bank`, {
                  state: {
                    counterparty_id: row.original.counterparty_id,
                    edit: true,
                  },
                })
              }
              title="View"
            >
              <Eye color="blue" className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                handleDelete(
                  row.original.counterparty_id,
                  row.original.counterparty_name
                )
              }
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },

      // Expand (UI-only)
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
    ],
    [navigate]
  );

  const table = useReactTable({
    data: filteredData, // <-- use your stateful data here
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
    autoResetPageIndex: false,
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
              {visibility.approve && (
                <Button onClick={handleApprove}>Approve</Button>
              )}

              {visibility.reject && (
                <Button onClick={handleReject} color="Green">
                  Reject
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <NyneOSTable<CounterpartyRow>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
        sections={sections} // Pass your sections if needed
        isEditing={isEditing}
        isSaving={isSaving}
        editValues={editValues}
        handleCancelEdit={handleCancelEdit}
        Visibility={visibility.edit}
        onChange={handleEditChange}
        handleForwardEditToggle={handleForwardEditToggle}
        column={`grid grid-cols-6`}
        loading={loading}
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

export default AllCounterpartyRow;
