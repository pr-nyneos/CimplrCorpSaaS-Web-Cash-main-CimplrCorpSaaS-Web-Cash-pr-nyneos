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

import { sections } from "./config";
import type { PlanRequestSummary } from "../../../types/cashType.ts";
import NyneOSTable2 from "../../cashDashboard/NyneOSTable2.tsx";
import nos from "../../../utils/nos.tsx";
import Button from "../../../components/ui/Button.tsx";
import Pagination from "../../../components/table/Pagination.tsx";
import { useNavigate } from "react-router-dom";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const defaultColumnVisibility: Record<string, boolean> = {
  plan_id: true,
  entity_name: true,
  primary_types: true,
  primary_values: true,
  horizon: true,
  processing_status: true,
  action_type: false,
  reason: false,
  requested_at: false,
  requested_by: false,
  checker_comment: false,
  checker_at: false,
  checker_by: false,
  total_amount: true,
  total_groups: true,

  // UI-only columns
  action: true,
  select: true,
  expand: true,
};

type FundPlanningResponse = {
  success: boolean;
  rows?: PlanRequestSummary[];
  error: string;
};

const AllFundPlanningRow: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select", // UI
    "plan_id",
    "entity_name",
    "primary_types",
    "primary_values",
    "horizon",
    "total_amount",
    "total_groups",
    "processing_status",
    "action", // UI
    "expand",
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<PlanRequestSummary[]>([]);

  const navigate = useNavigate();
  const visibility = useAllTabPermissions("fund-planning");
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
      .post<FundPlanningResponse>(`${apiBaseUrl}/cash/fund-planning/summary`)
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


  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.plan_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one Fund Plan to approve.", "warning");
      return;
    }

    const selectedPlanObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    if (
      selectedPlanObjs.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot approve a Fund Plan that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this fund plan"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    for (const planId of selectedRows) {
      const payload = {
        plan_id: planId,
        comment: result.inputValue || "",
      };

      try {
        const response = await nos.post<FundPlanningResponse>(
          `${apiBaseUrl}/cash/fund-planning/bulk-approve`,
          payload
        );

        if (response.data.success) {
          setData((prev) =>
            prev.filter((row) => {
              if (selectedRows.includes(row.plan_id)) {
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
          notify("Fund Plan approved successfully.", "success");
        } else {
          notify(response.data.error || "Approval failed.", "error");
        }
      } catch (error) {
        notify("Network error. Please try again.", "error");
      }
    }
  };

  const handleReject = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.plan_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one Fund Plan to reject.", "warning");
      return;
    }

    const selectedPlanObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    if (
      selectedPlanObjs.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot reject a Fund Plan that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this fund plan"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    for (const planId of selectedRows) {
      const payload = {
        plan_id: planId,
        comment: result.inputValue || "",
      };

      try {
        const response = await nos.post<FundPlanningResponse>(
          `${apiBaseUrl}/cash/fund-planning/bulk-reject`,
          payload
        );

        if (response.data.success) {
          setData((prev) =>
            prev.map((row) =>
              selectedRows.includes(row.plan_id)
                ? { ...row, processing_status: "REJECTED" }
                : row
            )
          );
          notify("Fund Plan rejected successfully.", "success");
        } else {
          notify(response.data.error || "Rejection failed.", "error");
        }
      } catch (error) {
        notify("Network error. Please try again.", "error");
      }
    } // ✅ closes for-loop
  }; // ✅ closes handleReject

  const handleDelete = async (plan_id: string, entity_name: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.plan_id);

    const selectedRowNames = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.entity_name);

    const selectedObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedObjs
        : [data.find((item) => item.plan_id === plan_id)].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a Fund Plan that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectedRowNames.join(", ") : entity_name
      } fund plan(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      group_ids: selectedRows.length > 0 ? selectedRows : [plan_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<FundPlanningResponse>(
        `${apiBaseUrl}/cash/fund-planning/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.group_ids.includes(row.plan_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${entity_name} deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const columns = useMemo<ColumnDef<PlanRequestSummary>[]>(
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
      { accessorKey: "plan_id", header: "Plan ID" },
      { accessorKey: "entity_name", header: "Entity Name" },
      { accessorKey: "primary_types", header: "Primary Types" },
      { accessorKey: "primary_values", header: "Primary Values" },
      { accessorKey: "horizon", header: "Horizon (Days)" },

      // Action type
      { accessorKey: "action_type", header: "Action Type" },

      // Audit Info (hidden by default)
      { accessorKey: "requested_at", header: "Requested At" },
      { accessorKey: "requested_by", header: "Requested By" },
      { accessorKey: "checker_at", header: "Checker At" },
      { accessorKey: "checker_by", header: "Checker By" },
      { accessorKey: "checker_comment", header: "Checker Comment" },
      { accessorKey: "reason", header: "Reason" },

      // Totals (hidden by default)
      { accessorKey: "total_amount", header: "Total Amount" },
      { accessorKey: "total_groups", header: "Total Groups" },

      // Status
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

      // Action (UI-only)
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <button
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-blue-600 hover:bg-primary-xl transition-colors"
              onClick={() =>
                navigate(`/fund-planning/detail`, {
                  state: {
                    plan_id: row.original.plan_id,
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
                handleDelete(row.original.plan_id, row.original.entity_name)
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

      <NyneOSTable2<PlanRequestSummary>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
        sections={sections}
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

export default AllFundPlanningRow;
