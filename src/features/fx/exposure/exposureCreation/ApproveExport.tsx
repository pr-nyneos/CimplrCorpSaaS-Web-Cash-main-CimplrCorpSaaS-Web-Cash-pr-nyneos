import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import NyneOSTable2 from "../../../cashDashboard/NyneOSTable2.tsx";
import Pagination from "../../../../components/table/Pagination.tsx";
import GridMasterOSTable from "../../../../components/table/GridMasterOSTable.tsx";
import nos from "../../../../utils/nos"; // Adjust import if needed
import Button from "../../../../components/ui/Button.tsx";
import { getProcessingStatusColor } from "../../../../utils/colorCode.ts";
import { useNotification } from "../../../../app/providers/NotificationProvider/Notification.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type ApproveExport = {
  exposure_header_id: string;
  company_code: string;
  counterparty_name: string;
  currency: string;
  document_id: string;
  posting_date: string; // ISO Date string
  value_date: string; // ISO Date string
  total_open_amount: number;
  exposure_category: string; // e.g. "FBL1N"
  approval_status?: string; // <-- Add this line
};

type approveSummary = {
  company_code: string;
  currency: string;
  total: number;
};

const defaultColumnVisibility: Record<string, boolean> = {
  exposure_header_id: false, // Hide this column
  company_code: true,
  counterparty_name: true,
  currency: true,
  document_id: true,
  posting_date: true,
  value_date: true,
  new_due_date: true,
  aging_days: true,
  total_open_amount: true,
  exposure_category: true,
  select: true,
};

const ApproveExport = () => {
  const [data, setData] = useState<ApproveExport[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApproveExportData = async () => {
      setLoading(true);
      try {
        const response = await nos.post<{
          rows: ApproveExport[];
          success: boolean;
        }>(`${apiBaseUrl}/fx/exposures/dashboard/all/v91`);
        if (response.data.success && Array.isArray(response.data.rows)) {
          setData(response.data.rows);
        }
      } catch (error) {
        // Handle error (optional: show notification)
      } finally {
        setLoading(false);
      }
    };

    fetchApproveExportData();
  }, []);

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "exposure_header_id",
    "company_code",
    "counterparty_name",
    "currency",
    "document_id",
    "posting_date",
    "value_date",
    "new_due_date",
    "aging_days",
    "total_open_amount",
    "approval_status",
    "exposure_category",
    "action",
  ]);

  const { notify, confirm } = useNotification();

  const formatNumber = (num: number): string => {
    if (num === 0) return "0.00";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const columns = useMemo<ColumnDef<ApproveExport>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-primary-lt focus:ring-2"
            />
          </div>
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
        accessorKey: "exposure_header_id",
        header: "Exposure Header ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "company_code",
        header: "Company Code",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "counterparty_name",
        header: "Party",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "document_id",
        header: "Document",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "posting_date",
        header: "Posting Date",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "value_date",
        header: "Due Date",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "total_open_amount",
        header: "Adjusted (Signed)",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return <span>{formatNumber(value)}</span>;
        },
      },
      {
        accessorKey: "exposure_category",
        header: "Source",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "approval_status",
        header: "Approval Status",
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
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
              onClick={() =>
                handleDelete(
                  row.original.exposure_header_id,
                  row.original.document_id
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
    [formatNumber]
  );

  // Calculate summary data by grouping company_code × currency
  const approveSummaryData = useMemo<approveSummary[]>(() => {
    const summary: Record<string, approveSummary> = {};

    // Filter only approved exposures
    const approvedRows = data.filter(
      (item) =>
        item.approval_status &&
        item.approval_status.toUpperCase() === "APPROVED"
    );

    approvedRows.forEach((item) => {
      const key = `${item.company_code}-${item.currency}`;
      if (summary[key]) {
        summary[key].total += item.total_open_amount;
      } else {
        summary[key] = {
          company_code: item.company_code,
          currency: item.currency,
          total: item.total_open_amount,
        };
      }
    });

    return Object.values(summary);
  }, [data]);

  // Summary table columns
  const approveSummaryColumns = useMemo<ColumnDef<approveSummary>[]>(
    () => [
      {
        accessorKey: "company_code",
        header: "Company Code",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return <span className="font-medium">{formatNumber(value)}</span>;
        },
      },
    ],
    [formatNumber]
  );

  // Summary table
  const approveSummaryTable = useReactTable({
    data: approveSummaryData,
    columns: approveSummaryColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const table = useReactTable({
    data: data,
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
      columnOrder: columnOrder,
      rowSelection: selectedRowIds,
      columnVisibility: columnVisibility,
    },
    autoResetPageIndex: false,
  });

  // ...existing code...

  const handleDelete = async (
    exposure_header_id: string,
    document_id: string
  ) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.exposure_header_id);

    const selectRowDocument = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.document_id);

    const selectedExposureObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedExposureObjs
        : [
            data.find((item) => item.exposure_header_id === exposure_header_id),
          ].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.approval_status === "string" &&
          row.approval_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete an exposure that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectRowDocument.join(", ") : document_id
      } selected exposure(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      exposure_ids:
        selectedRows.length > 0 ? selectedRows : [exposure_header_id],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<{ success: boolean; error?: string }>(
        `${apiBaseUrl}/fx/exposures/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.exposure_ids.includes(row.exposure_header_id)
              ? { ...row, approval_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${document_id} Exposure deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  // ...existing code...

  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.exposure_header_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one exposure to approve.", "warning");
      return;
    }

    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "these exposures"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      exposure_ids: selectedRows,
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<{ success: boolean; error?: string }>(
        `${apiBaseUrl}/fx/exposures/bulk-approve`,
        payload
      );

      if (response.data.success) {
        notify("Exposures approved successfully.", "success");
        // Optionally refresh data here
        setData((prev) =>
          prev.filter((row) => !selectedRows.includes(row.exposure_header_id))
        );
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleReject = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.exposure_header_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one exposure to reject.", "warning");
      return;
    }

    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "these exposures"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      exposure_ids: selectedRows,
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<{ success: boolean; error?: string }>(
        `${apiBaseUrl}/fx/exposures/bulk-reject`,
        payload
      );

      if (response.data.success) {
        notify("Exposures rejected successfully.", "success");
        // Optionally refresh data here
        setData((prev) =>
          prev.filter((row) => !selectedRows.includes(row.exposure_header_id))
        );
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between pb-6">
        <h2 className="text-xl font-semibold text-primary-lt">
          Approve Exposures
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={handleApprove}>Approve</Button>
          <Button onClick={handleReject} color="Green">
            Reject
          </Button>
        </div>
      </div>
      <NyneOSTable2<ApproveExport>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
        sections={[]}
        loading={loading}
      />
      <Pagination
        table={table}
        totalItems={data.length}
        startIndex={
          data.length === 0
            ? 0
            : table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
              1
        }
        endIndex={Math.min(
          (table.getState().pagination.pageIndex + 1) *
            table.getState().pagination.pageSize,
          data.length
        )}
      />
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full mt-6">
        <h2 className="text-xl font-semibold text-primary-lt">
          Approve Summary (Company × Currency)
        </h2>
        <GridMasterOSTable<approveSummary> table={approveSummaryTable} />
        <Pagination
          table={approveSummaryTable}
          totalItems={approveSummaryData.length}
          startIndex={
            approveSummaryData.length === 0
              ? 0
              : approveSummaryTable.getState().pagination.pageIndex *
                  approveSummaryTable.getState().pagination.pageSize +
                1
          }
          endIndex={Math.min(
            (approveSummaryTable.getState().pagination.pageIndex + 1) *
              approveSummaryTable.getState().pagination.pageSize,
            approveSummaryData.length
          )}
        />
      </div>
    </>
  );
};

export default ApproveExport;
