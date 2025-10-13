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
import { ChevronDown, ChevronUp, Trash2, Search } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";

import { sections } from "./config";
import type { GLAccountMaster } from "../../../types/masterType";
import NyneOSTable from "../../../components/table/NyneOSTable";
import Pagination from "../../../components/table/Pagination";
import Button from "../../../components/ui/Button";
// import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import type { UpdateRow } from "../../../types/type.ts";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const defaultColumnVisibility: Record<string, boolean> = {
  action_id: false,
  action_type: true,
  cashflow_category_name: false,
  checker_at: false,
  checker_by: false,
  checker_comment: false,
  created_at: false,
  created_by: false,
  deleted_at: false,
  deleted_by: false,
  edited_at: false,
  edited_by: false,
  erp_ref: false,
  gl_account_code: true,
  gl_account_id: false,
  gl_account_name: true,
  gl_account_type: true,
  old_cashflow_category_name: false,
  old_erp_ref: false,
  old_gl_account_code: false,
  old_gl_account_name: false,
  old_gl_account_type: false,
  old_source: false,
  old_status: false,
  processing_status: true,
  reason: false,
  requested_at: false,
  requested_by: false,
  source: true,
  status: true,
};

type GLAccountMasterResponse = {
  success: boolean;
  rows?: GLAccountMaster[];
  error: string;
};

const AllBankAccounts: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "action_type",
    "cashflow_category_name",
    "gl_account_code",
    "gl_account_name",
    "gl_account_type",
    "erp_ref",
    "status",
    "processing_status",
    "reason",
    "source",
    "created_at",
    "created_by",
    "action",
    "expand",
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // const [refresh, setRefresh] = useState(false);
  const [editValues, setEditValues] = useState<GLAccountMaster>(
    {} as GLAccountMaster
  );
  const { notify, confirm } = useNotification();

  const [statusFilter, setStatusFilter] = useState("All");
  const [data, setData] = useState<GLAccountMaster[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  useEffect(() => {
    setLoading(true);
    nos
      .post<GLAccountMasterResponse>(`${apiBaseUrl}/master/glaccount/names`)
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

  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.gl_account_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one GL Account to approve.", "warning");
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
        "You cannot approve a GL Account that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this GL Account"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      gl_account_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<GLAccountMasterResponse>(
        `${apiBaseUrl}/master/glaccount/bulk-approve`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.gl_account_id)) {
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
        notify("GL Account(s) approved successfully.", "success");
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
      .rows.map((row) => row.original.gl_account_id);

    if (selectedRows.length === 0) {
      notify("Please select at least one GL Account to reject.", "warning");
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
        "You cannot reject a GL Account that is already approved.",
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
      gl_account_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };

    try {
      const response = await nos.post<GLAccountMasterResponse>(
        `${apiBaseUrl}/master/glaccount/bulk-reject`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.gl_account_id)
              ? { ...row, processing_status: "REJECTED" }
              : row
          )
        );
        notify("GL Account(s) rejected successfully.", "success");
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleDelete = async (
    gl_account_id: string,
    gl_account_name: string
  ) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.gl_account_id);

    const selectedRowNames = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.gl_account_name);

    const selectedRowObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedRowObjs
        : [data.find((item) => item.gl_account_id === gl_account_id)].filter(
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
        "You cannot delete a GL Account that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectedRowNames.join(", ") : gl_account_name
      } selected GL Account(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      gl_account_ids: selectedRows.length > 0 ? selectedRows : [gl_account_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<GLAccountMasterResponse>(
        `${apiBaseUrl}/master/glaccount/delete`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.gl_account_ids.includes(row.gl_account_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${gl_account_name} deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as GLAccountMaster);
  };

  const handleEditChange = (
    field: keyof GLAccountMaster,
    value: GLAccountMaster[keyof GLAccountMaster]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleForwardEditToggle = async (row: Row<GLAccountMaster>) => {
    if (isEditing) {
      const changedFields = (row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve ${row.original.gl_account_name}`,
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
            gl_account_id: row.original.gl_account_id,
            fields: { editValues },
            reason: result.inputValue || "",
          },
        ],
      };

      try {
        setIsSaving(true);
        const response = await nos.post<UpdateRow>(
          `${apiBaseUrl}/master/glaccount/updatebulk`,
          payload
        );

        if (response.data.rows[0].success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...editValues } : item
            )
          );
          setIsEditing(false);
          notify("GL Account updated successfully!", "success");
        } else {
          notify(
            response.data?.rows?.[0]?.error || "Update failed",
            "error"
          );
        }
      } catch (error) {
        notify("An error occurred while updating the GL Account.", "error");
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as GLAccountMaster);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<GLAccountMaster>[]>(
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
      {
        accessorKey: "gl_account_id",
        header: "GL Account ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-gray-600">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "gl_account_code",
        header: "GL Account Code",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm font-medium text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "gl_account_name",
        header: "GL Account Name",
        cell: ({ getValue }) => (
          <span className="font-semibold">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "gl_account_type",
        header: "GL Account Type",
        cell: ({ getValue }) => (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Active Status",
        cell: ({ getValue }) => {
          const status = (getValue() as string)?.toLowerCase();
          const statusColors: Record<string, string> = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-red-100 text-red-800",
            pending: "bg-yellow-100 text-yellow-800",
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
          const value = (getValue() as string)?.toUpperCase();
          const colors: Record<string, string> = {
            APPROVED: "bg-green-100 text-green-800",
            REJECTED: "bg-red-100 text-red-800",
            PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
            PENDING_DELETE_APPROVAL: "bg-orange-100 text-orange-800",
          };
          return (
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                colors[value] || "bg-gray-100 text-gray-800"
              }`}
            >
              {value || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "cashflow_category_name",
        header: "Cashflow Category",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "erp_ref",
        header: "ERP Ref",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "requested_by",
        header: "Requested By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "requested_at",
        header: "Requested At",
        cell: ({ getValue }) => (
          <span>{new Date(getValue() as string).toLocaleString() || "—"}</span>
        ),
      },
      {
        accessorKey: "checker_by",
        header: "Checked By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "checker_at",
        header: "Checked At",
        cell: ({ getValue }) => (
          <span>{new Date(getValue() as string).toLocaleString() || "—"}</span>
        ),
      },
      {
        accessorKey: "checker_comment",
        header: "Checker Comment",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
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
          <span>{new Date(getValue() as string).toLocaleString() || "—"}</span>
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
          <span>{new Date(getValue() as string).toLocaleString() || "—"}</span>
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
          <span>{new Date(getValue() as string).toLocaleString() || "—"}</span>
        ),
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() =>
                handleDelete(
                  row.original.gl_account_id,
                  row.original.gl_account_name
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
    []
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
    data, // <-- use your stateful data here
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

      <NyneOSTable<GLAccountMaster>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
        sections={sections} // Pass your sections if needed
        isEditing={isEditing}
        isSaving={isSaving}
        editValues={editValues}
        column={`grid grid-cols-6`}
        loading={loading}
        handleCancelEdit={handleCancelEdit}
        onChange={handleEditChange}
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

export default AllBankAccounts;
