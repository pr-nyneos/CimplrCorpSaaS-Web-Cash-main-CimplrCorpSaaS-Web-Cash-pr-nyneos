import React, { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { Search, Trash2, Eye, ChevronUp, ChevronDown } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

import Pagination from "../../../components/table/Pagination.tsx";
// import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { defaultColumnVisibility, COLUMNS , sections} from "./config";
import type { BankSummary } from "../../../types/masterType";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import NyneOSTable2 from "../../cashDashboard/NyneOSTable2.tsx";
import Button from "../../../components/ui/Button.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type APIResponse = {
  success: boolean;
  data?: BankSummary[];
  error?: string | null;
};

const AllBankAccounts: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [selectedRowIds, setSelectedRowIds] = useState({});

  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMNS);
  const [, setLoading] = useState(false);
  // const [refresh, setRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  // const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [data, setData] = useState<BankSummary[]>([]);
  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({});

  const { notify, confirm } = useNotification();
  const navigate = useNavigate();

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

  useEffect(() => {
    setLoading(true);
    nos
      .post<APIResponse>(`${apiBaseUrl}/master/bankaccount/all`)
      .then((response) => {
        if (response.data.success && response.data.data) {
          setData(response.data.data);
        } else {
          notify(
            response.data.error ? response.data.error : "Failed Loading Data",
            "error"
          );
        }
        setLoading(false);
      })
      .catch(() => {
        notify("Network error. Please try again.", "error");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (account_id: string, account_nickname: string) => {
    const result = await confirm(
      `Are you sure you want to delete ${account_nickname}?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      account_ids: [account_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/bankaccount/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) => prev.filter((row) => row.account_id !== account_id));
        notify(`${account_nickname} Account deleted.`, "success");
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
      notify("Please select at least one Bank Account to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this bank account"
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
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/bankaccount/bulk-reject`,
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
        notify("Bank account(s) rejected successfully.", "success");
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
      notify("Please select at least one Bank Account to approve.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this bank account"
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
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/bankaccount/bulk-approve`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.action_id)) {
              if (
                typeof row.processing_status === "string" &&
                row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
              ) {
                return false;
              }
              row.processing_status = "APPROVED";
            }
            return true;
          })
        );
        notify("Bank account(s) approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const columns = useMemo<ColumnDef<BankSummary>[]>(
    () => [
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
      },
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
      { accessorKey: "account_id", header: "Account ID" },
      { accessorKey: "account_nickname", header: "Nickname" },
      { accessorKey: "account_number", header: "Account Number" },
      { accessorKey: "bank_name", header: "Bank Name" },
      { accessorKey: "entity_id", header: "Entity ID" },
      { accessorKey: "entity_name", header: "Entity Name" },
      {
        accessorKey: "action_id",
        header: "Action ID",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        accessorKey: "action_type",
        header: "Action Type",
        cell: ({ getValue }) => {
          const val = (getValue() as string) || "";
          return val
            ? val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
            : "—";
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
        accessorKey: "reason",
        header: "Reason",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        accessorKey: "requested_at",
        header: "Requested At",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "—",
      },
      {
        accessorKey: "requested_by",
        header: "Requested By",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        accessorKey: "checker_at",
        header: "Checker At",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "—",
      },
      {
        accessorKey: "checker_by",
        header: "Checker By",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        accessorKey: "checker_comment",
        header: "Checker Comment",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "—",
      },
      {
        accessorKey: "created_by",
        header: "Created By",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        accessorKey: "edited_at",
        header: "Edited At",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "—",
      },
      {
        accessorKey: "edited_by",
        header: "Edited By",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        accessorKey: "deleted_at",
        header: "Deleted At",
        cell: ({ getValue }) =>
          getValue() ? new Date(getValue() as string).toLocaleString() : "—",
      },
      {
        accessorKey: "deleted_by",
        header: "Deleted By",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        id: "action",
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigate(`/bank-account-detail`, {
                  state: {
                    account_id: row.original.account_id,
                    edit: true,
                  },
                });
              }}
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-primary hover:bg-primary-xl transition-colors"
              title="View Details"
            >
              <Eye color="blue" className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                handleDelete(
                  row.original.account_id,
                  row.original.account_nickname
                )
              }
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
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

      <NyneOSTable2<BankSummary>
        table={table}
        columns={columns}
        nonDraggableColumns={["action", "select", "expand"]}
        nonSortingColumns={["action", "expand", "select"]}
        // loading={loading}
        sections={sections}
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

export default AllBankAccounts;
