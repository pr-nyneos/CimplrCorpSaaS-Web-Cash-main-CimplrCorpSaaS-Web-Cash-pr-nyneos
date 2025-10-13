import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { Eye, Trash2 } from "lucide-react";
import Pagination from "../../../components/table/Pagination";
// import type { AuditLogEntry } from "../../../types/masterType";

import NyneOSTable2 from "../../cashDashboard/NyneOSTable2";
import Button from "../../../components/ui/Button";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";
import nos from "../../../utils/nos";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import { useNavigate } from "react-router-dom";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type Entry = {
  proposal_id: string;
  currency: string;
  proposal_name: string;
  processing_status: string;
  effectiive_date: string;
  proposal_type: string;
};

type ProjectionHeaderApiResponse = {
  header: Entry[];
  success: boolean;
};

type APIRes = {
  success: boolean;
  // data?: CurrencyMaster[];
  error: string;
};

export type ProjectionLineItem = {
  proposal_id: string;
  department: string;
  bank: string;
  currency: string;
  category_type: string;
  category_name: string;
  amount: number;
  remarks: string;
};

export type Projection = {
  id: string;
  proposal_id: string;
  type: string;
  category_name: string;
  entity: string;
  processing_status: string;
  action_id: string | null;
  effective_period: string;
  submitted_on: string | null;
  submitted_by: string | null;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  proposal_id: true,
  proposal_name: true,
  effective_date: true,
  proposal_type: true,
  currency: true,
  processing_status: true,
  action: true,
};

const COLUMNS = [
  "select",
  "proposal_id",
  "proposal_name",
  "effective_date",
  "proposal_type",
  "currency",
  "processing_status",
  "action",
];

const AllProjection = () => {
  const [data, setData] = useState<Entry[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMNS);
  //   const [searchTerm, setSearchTerm] = useState("");
  const { notify, confirm } = useNotification();
  const [refresh] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  //   const [statusFilter, setStatusFilter] = useState("All");
  const [, setSelectedProposalId] = useState<string | null>(null);

  const navigate = useNavigate();
  const visibility = useAllTabPermissions("projection");

  const columns = useMemo<ColumnDef<Entry>[]>(
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
      { accessorKey: "proposal_type", header: "Proposal Type" },
      { accessorKey: "effective_date", header: "Effective Date" },
      { accessorKey: "proposal_name", header: "Proposal Name" },
      { accessorKey: "proposal_id", header: "Proposal ID" },
      // { accessorKey: "entity", header: "Entity" },
      // { accessorKey: "category_name", header: "Category Name" },
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
      { accessorKey: "currency", header: "Currency" },

      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
              onClick={() =>
                navigate(`/projection/edit-projection`, {
                  state: {
                    proposal_id: row.original.proposal_id,
                    edit: true,
                  },
                })
              }
              title="View"
            >
              <Eye color="blue" className="w-4 h-4" />
            </button>
            {visibility.delete && (
              <button
                className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
                onClick={() => {
                  setSelectedProposalId(row.original.proposal_id),
                    handleDelete(
                      row.original.proposal_id,
                      row.original.proposal_name
                    );
                }}
                title="View"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [navigate, visibility.delete]
  );

  const table = useReactTable({
    data,
    columns,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setSelectedRowIds,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getExpandedRowModel: getExpandedRowModel(),
    state: {
      columnOrder,
      rowSelection: selectedRowIds,
      columnVisibility,
    },
    enableMultiSort: true,

    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  useEffect(() => {
    const fetchProjections = async () => {
      try {
        const response = await nos.post<ProjectionHeaderApiResponse>(
          `${apiBaseUrl}/cash/cashflow-projection/get-header`
        );
        const projections = response.data?.header || [];

        setData(projections);
      } catch (error) {
        notify("Failed to fetch projections.", "error");
      }
    };

    fetchProjections();
  }, [refresh]);

  const handleReject = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.proposal_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one Proposal to reject.", "warning");
      return;
    }

    const selectedAccounts = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    // Prevent rejecting already approved rows
    if (
      selectedAccounts.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot reject a Proposal that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this GL Account"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      proposal_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<any>(
        `${apiBaseUrl}/cash/cashflow-projection/bulk-reject`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.proposal_id)
              ? { ...row, processing_status: "REJECTED" }
              : row
          )
        );
        notify("Proposal(s) rejected successfully.", "success");
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
      .rows.map((row) => row.original.proposal_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one proposal to approve.", "warning");
      return;
    }

    const selectedAccounts = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    // Prevent approving already approved rows
    if (
      selectedAccounts.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot approve a Proposal that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this Proposal"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      proposal_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<any>(
        `${apiBaseUrl}/cash/cashflow-projection/bulk-approve`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.proposal_id)) {
              if (
                typeof row.processing_status === "string" &&
                row.processing_status.toUpperCase() ===
                  "PENDING_DELETE_APPROVAL"
              ) {
                return false; // remove deleted ones
              }
              row.processing_status = "APPROVED";
            }
            return true;
          })
        );
        notify("Proposal(s) approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleDelete = async (proposal_id: string, proposal_name: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.proposal_id);

    const selectRowProposalName = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.proposal_name);

    const selectedProposalObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedProposalObjs
        : [data.find((item) => item.proposal_id === proposal_id)].filter(
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
        "You cannot delete a proposal that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0
          ? selectRowProposalName.join(", ")
          : proposal_name
      } selected proposal(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      proposal_ids: selectedRows.length > 0 ? selectedRows : [proposal_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<APIRes>(
        `${apiBaseUrl}/cash/cashflow-projection/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.proposal_ids.includes(row.proposal_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${proposal_name} Proposal deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
        <div className="col-span-1 md:col-span-4 flex items-center justify-end gap-4">
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
      <div className="w-full space-y-4">
        <NyneOSTable2<Entry>
          table={table}
          columns={columns}
          nonDraggableColumns={[
            "id",
            "select",
            "entity",
            "processing_status",
            "effective_period",
            "action",
          ]}
          nonSortingColumns={[
            "id",
            "entity",
            "select",
            "processing_status",
            "effective_period",
            "action",
          ]}
        ></NyneOSTable2>

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
      </div>
    </div>
  );
};

export default AllProjection;
