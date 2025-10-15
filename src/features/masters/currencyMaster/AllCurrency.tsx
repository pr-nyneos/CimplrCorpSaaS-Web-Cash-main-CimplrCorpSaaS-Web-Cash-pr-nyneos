import React, { useRef, useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type Row,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { sections } from "./config";
import type { CurrencyMaster } from "../../../types/masterType";
import type { Update } from "../../../types/type.ts";
import NyneOSTable from "../../../components/table/NyneOSTable";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Pagination from "../../../components/table/Pagination";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type CurrencyMasterResponse = {
  success: boolean;
  data?: CurrencyMaster[];
  error: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  expand: true,
  currency_id: true,
  currency_code: true,
  currency_name: true,
  country: true,
  symbol: true,
  decimal_places: false,
  old_decimal_places: false,
  status: true,
  old_status: false,
  processing_status: true,
  action_type: false,
  action_id: false,
  checker_at: false,
  checker_by: false,
  checker_comment: false,
  reason: false,
  created_by: false,
  created_at: false,
  edited_by: false,
  edited_at: false,
  deleted_by: false,
  deleted_at: false,
  action: true,
};

// Mock data for all columns
const COLUMNS = [
  "select",
  "currency_id",
  "currency_code",
  "currency_name",
  "country",
  "symbol",
  "status",
  "old_status",
  "decimal_places",
  "old_decimal_places",
  "processing_status",
  "action_type",
  "action_id",
  "checker_by",
  "checker_at",
  "checker_comment",
  "reason",
  "created_by",
  "created_at",
  "edited_by",
  "edited_at",
  "deleted_by",
  "deleted_at",
  "action",
  "expand",
];
type AllCurrencyProps = {
  onDataLoaded?: () => void; // ✅ parent callback
};
const AllCurrency: React.FC<AllCurrencyProps> = ({ onDataLoaded }) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMNS);
  const [refresh, setRefresh] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<CurrencyMaster>(
    {} as CurrencyMaster
  );
  const [data, setData] = useState<CurrencyMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };
  const visibility = useAllTabPermissions("currency-master");

  const handleEditChange = (
    field: keyof CurrencyMaster,
    value: CurrencyMaster[keyof CurrencyMaster]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { notify, confirm } = useNotification();

  useEffect(() => {
    setLoading(true);
    nos
      .post<CurrencyMasterResponse>(`${apiBaseUrl}/master/currency/all`)
      .then((response) => {
        if (response.data.success && response.data.data) {
          setData(response.data.data);
          
            onDataLoaded?.();
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
  }, [ refresh]);

  // Add handleDelete function
  const handleDelete = async (currency_id: string, currency_code: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.currency_id);

    const selectRowCurency = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.currency_code);

    const selectedCurrencyObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedCurrencyObjs
        : [data.find((item) => item.currency_id === currency_id)].filter(
            Boolean
          );

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a currency that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectRowCurency.join(", ") : currency_code
      } selected transaction(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      currency_ids: selectedRows.length > 0 ? selectedRows : [currency_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<CurrencyMasterResponse>(
        `${apiBaseUrl}/master/currency/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.currency_ids.includes(row.currency_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${currency_code} Currency deleted.`, "success");
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
      .rows.map((row) => row.original.action_id);
    if (selectedRows.length === 0) {
      notify("Please select at least one Currency to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this currency"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      action_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<CurrencyMasterResponse>(
        `${apiBaseUrl}/master/currency/bulk-reject`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.action_id)
              ? { ...row, processing_status: "REJECTED" }
              : row
          )
        );
        setRefresh(!refresh);
        notify("Currency rejected successfully.", "success");
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
      .rows.map((row) => row.original.action_id);
    if (selectedRows.length === 0) {
      notify("Please select at least one Currency to approve.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this currency"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      action_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<CurrencyMasterResponse>(
        `${apiBaseUrl}/master/currency/bulk-approve`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.action_id)) {
              if (
                typeof row.processing_status === "string" &&
                row.processing_status.toUpperCase() ===
                  "PENDING_DELETE_APPROVAL"
              ) {
                return false;
              }
              row.processing_status = "APPROVED";
            }
            return true;
          })
        );
        setRefresh(!refresh);
        notify("Currency approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as CurrencyMaster);
  };

  const handleForwardEditToggle = async (row: Row<CurrencyMaster>) => {
    if (isEditing) {
      const changedFields = (row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve ${row.original.currency_code}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      const payload = {
        currency: [
          {
            currency_id: row.original.currency_id,
            fields: { ...editValues },
            reason: result.inputValue || "",
          },
        ],
      };

      try {
        setIsSaving(true);
        const response = await nos.post<Update>(
          `${apiBaseUrl}/master/currency/update`,
          payload
        );

        if (response.data.results[0].success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...editValues } : item
            )
          );
          setIsEditing(false);
          notify("Currency updated successfully!", "success");
        } else {
          notify(
            response.data?.results?.[0]?.error || "Update failed",
            "error"
          );
        }
      } catch (error) {
        notify("An error occurred while updating the currency.", "error");
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as CurrencyMaster);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<CurrencyMaster>[]>(
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

      { accessorKey: "currency_id", header: "Currency ID" },
      { accessorKey: "currency_code", header: "Currency Code" },
      { accessorKey: "currency_name", header: "Currency Name" },
      { accessorKey: "country", header: "Country" },
      { accessorKey: "symbol", header: "Symbol" },

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
      { accessorKey: "old_status", header: "Old Status" },
      { accessorKey: "decimal_places", header: "Decimal Places" },
      { accessorKey: "old_decimal_places", header: "Old Decimal Places" },

      {
        accessorKey: "processing_status",
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
      { accessorKey: "action_type", header: "Action Type" },
      { accessorKey: "action_id", header: "Action ID" },

      { accessorKey: "checker_by", header: "Checker By" },
      { accessorKey: "checker_at", header: "Checker At" },
      { accessorKey: "checker_comment", header: "Checker Comment" },
      { accessorKey: "reason", header: "Reason" },

      { accessorKey: "created_by", header: "Created By" },
      { accessorKey: "created_at", header: "Created At" },
      { accessorKey: "edited_by", header: "Edited By" },
      { accessorKey: "edited_at", header: "Edited At" },
      { accessorKey: "deleted_by", header: "Deleted By" },
      { accessorKey: "deleted_at", header: "Deleted At" },

      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
              onClick={() =>
                handleDelete(
                  row.original.currency_id,
                  row.original.currency_code
                )
              }
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [isEditing, editValues]
  );

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
    autoResetPageIndex: false,
    enableMultiSort: true,
  });

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      action: !!visibility.delete, // show if true, hide if false
    }));
  }, [visibility.delete]);

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
              {visibility.delete && (
                <Button onClick={handleReject} color="Green">
                  Reject
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <NyneOSTable<CurrencyMaster>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "symbol", "select"]}
        sections={sections}
        isEditing={isEditing}
        isSaving={isSaving}
        editValues={editValues}
        loading={loading}
        handleCancelEdit={handleCancelEdit}
        onChange={handleEditChange}
        handleForwardEditToggle={handleForwardEditToggle}
        column={`grid grid-cols-6`}
        Visibility={visibility.edit}
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

export default AllCurrency;
