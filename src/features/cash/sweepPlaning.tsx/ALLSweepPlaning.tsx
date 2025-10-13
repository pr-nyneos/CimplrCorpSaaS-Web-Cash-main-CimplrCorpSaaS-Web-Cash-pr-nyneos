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
import { sections } from "./config.ts";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import type { SweepConfiguration } from "../../../types/cashType";
import NyneOSTable from "../../../components/table/NyneOSTable";
import Button from "../../../components/ui/Button";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import type { Update } from "../../../types/type.ts";
import Pagination from "../../../components/table/Pagination.tsx";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const defaultColumnVisibility: Record<string, boolean> = {
  // UI helpers
  select: true,
  expand: true,
  action: true,

  // main fields
  sweep_id: false,
  entity_name: true,
  bank_name: true,
  bank_account: true,
  sweep_type: true,
  parent_account: true,
  buffer_amount: true,
  frequency: true,
  cutoff_time: false,
  auto_sweep: false,
  active_status: true,
  processing_status: true,
  reason: false,

  // old fields
  old_entity_name: false,
  old_bank_name: false,
  old_bank_account: false,
  old_sweep_type: false,
  old_parent_account: false,
  old_buffer_amount: false,
  old_frequency: false,
  old_cutoff_time: false,
  old_auto_sweep: false,
  old_active_status: false,

  // workflow / audit fields
  action_type: false,
  action_id: false,
  checker_at: false,
  checker_by: false,
  checker_comment: false,
  created_by: false,
  created_at: false,
  edited_by: false,
  edited_at: false,
  deleted_by: false,
  deleted_at: false,
};

export interface GetSweepConfigurationsResponse {
  success: boolean;
  message: string;
  rows: SweepConfiguration[];
}

const SweepConfigurationPage: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "sweep_id",
    "entity_name",
    "bank_name",
    "bank_account",
    "sweep_type",
    "parent_account",
    "buffer_amount",
    "frequency",
    "cutoff_time",
    "auto_sweep",
    "active_status",
    "processing_status",
    "action",
    "expand",
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [editValues, setEditValues] = useState<SweepConfiguration>(
    {} as SweepConfiguration
  );
  const [data, setData] = useState<SweepConfiguration[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [sweepTypeFilter, setSweepTypeFilter] = useState("All");
  const [activeStatusFilter, setActiveStatusFilter] = useState("All");

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const { notify, confirm } = useNotification();
  //   const visibility = useAllTabPermissions("sweep-configuration");

  useEffect(() => {
    setLoading(true);
    nos
      .post<GetSweepConfigurationsResponse>(
        `${apiBaseUrl}/cash/sweep-config/all`
      )
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setData(response.data.rows || []);
          setLoading(false);
        } else {
          notify(response.data.message, "error");
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
      .rows.map((row) => row.original.sweep_id);

    const selectRowNames = table
      .getSelectedRowModel()
      .rows.map(
        (row) => `${row.original.entity_name} - ${row.original.bank_name}`
      );

    if (selectedRows.length === 0) {
      notify(
        "Please select at least one Sweep Configuration to approve.",
        "warning"
      );
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0
          ? selectRowNames.join(", ")
          : "this sweep configuration"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      sweep_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<GetSweepConfigurationsResponse>(
        `${apiBaseUrl}/cash/sweep-config/bulk-approve`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.sweep_id)) {
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
        notify("Sweep Configuration approved successfully.", "success");
      } else {
        notify(response.data.message || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleDelete = async (
    sweep_id: string,
    entity_name: string,
    bank_name: string
  ) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.sweep_id);

    const selectRowNames = table
      .getSelectedRowModel()
      .rows.map(
        (row) => `${row.original.entity_name} - ${row.original.bank_name}`
      );

    const selectedObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedObjs
        : [data.find((item) => item.sweep_id === sweep_id)].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a sweep configuration that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0
          ? selectRowNames.join(", ")
          : `${entity_name} - ${bank_name}`
      } selected sweep configuration(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      sweep_ids: selectedRows.length > 0 ? selectedRows : [sweep_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<GetSweepConfigurationsResponse>(
        `${apiBaseUrl}/cash/sweep-config/request-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.sweep_ids.includes(row.sweep_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(
          `${entity_name} - ${bank_name} Sweep Configuration deleted.`,
          "success"
        );
      } else {
        notify(response.data.message || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleReject = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.sweep_id);

    const selectRowNames = table
      .getSelectedRowModel()
      .rows.map(
        (row) => `${row.original.entity_name} - ${row.original.bank_name}`
      );

    const selectedObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    if (
      selectedObjs.some(
        (row) =>
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot reject a sweep configuration that is already approved.",
        "warning"
      );
      return;
    }

    if (selectedRows.length === 0) {
      notify(
        "Please select at least one Sweep Configuration to reject.",
        "warning"
      );
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0
          ? selectRowNames.join(", ")
          : "this sweep configuration"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      sweep_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<GetSweepConfigurationsResponse>(
        `${apiBaseUrl}/cash/sweep-config/bulk-reject`,
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
        notify("Sweep Configuration rejected successfully.", "success");
      } else {
        notify(response.data.message || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleEditChange = (
    field: keyof SweepConfiguration,
    value: SweepConfiguration[keyof SweepConfiguration]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as SweepConfiguration);
  };

  const handleForwardEditToggle = async (row: Row<SweepConfiguration>) => {
    if (isEditing) {
      // Only send changed fields
      const changedFields: Partial<SweepConfiguration> = {};
      for (const key in editValues) {
        if (editValues[key] !== row.original[key]) {
          changedFields[key] = editValues[key];
        }
      }

      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        setEditValues({} as SweepConfiguration);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve ${row.original.entity_name} - ${row.original.bank_name}?`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      const payload = {
        sweep_id: row.original.sweep_id,
        fields: changedFields,
        reason: result.inputValue || "",
      };

      try {
        setIsSaving(true);
        const response = await nos.post<Update>(
          `${apiBaseUrl}/cash/sweep-config/update`,
          payload
        );

        if (response.data.success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...changedFields } : item
            )
          );
          setIsEditing(false);
          notify("Sweep Configuration updated successfully!", "success");
        } else {
          notify(
            response.data?.results?.[0]?.error || "Update failed",
            "error"
          );
        }
      } catch (error) {
        notify(
          "An error occurred while updating the sweep configuration.",
          "error"
        );
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as SweepConfiguration);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<SweepConfiguration>[]>(
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

      // OLD fields
      {
        accessorKey: "old_entity_name",
        header: "Old Entity Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_bank_name",
        header: "Old Bank Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_bank_account",
        header: "Old Bank Account",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_sweep_type",
        header: "Old Sweep Type",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_parent_account",
        header: "Old Parent Account",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_buffer_amount",
        header: "Old Buffer Amount",
        cell: ({ getValue }) => <span>{(getValue() as number) || "—"}</span>,
      },
      {
        accessorKey: "old_frequency",
        header: "Old Frequency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_cutoff_time",
        header: "Old Cutoff Time",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_auto_sweep",
        header: "Old Auto Sweep",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_active_status",
        header: "Old Active Status",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },

      // ACTION & AUDIT fields
      {
        accessorKey: "action_type",
        header: "Action Type",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "action_id",
        header: "Action ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "checker_at",
        header: "Checker At",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "checker_by",
        header: "Checker By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
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

      // Main fields
      {
        accessorKey: "sweep_id",
        header: "Sweep ID",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "entity_name",
        header: "Entity Name",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "bank_name",
        header: "Bank Name",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "bank_account",
        header: "Bank Account",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "sweep_type",
        header: "Sweep Type",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "parent_account",
        header: "Parent Account",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "buffer_amount",
        header: "Buffer Amount",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "cutoff_time",
        header: "Cutoff Time",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "auto_sweep",
        header: "Auto Sweep",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "active_status",
        header: "Active Status",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
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
        cell: ({ row }) => {
          const handleExpandClick = () => {
            row.toggleExpanded();
            if (!row.getIsExpanded()) {
              setTimeout(() => scrollExpandedRowIntoView(row.id), 100);
            }
          };

          return (
            <button
              onClick={handleExpandClick}
              className="p-2 hover:bg-primary-xl text-primary rounded-md transition-colors"
              aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
            >
              {row.getIsExpanded() ? (
                <ChevronUp className="w-4 h-4 text-primary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-primary" />
              )}
            </button>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
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
        id: "action",
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                handleDelete(
                  row.original.sweep_id,
                  row.original.entity_name,
                  row.original.bank_name
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
    [isEditing, editValues]
  );

  const sweepTypeOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.sweep_type) options.add(item.sweep_type);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

  const activeStatusOptions = ["All", "Active", "Inactive"];

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
    if (sweepTypeFilter !== "All") {
      result = result.filter((item) => item.sweep_type === sweepTypeFilter);
    }
    if (activeStatusFilter !== "All") {
      result = result.filter(
        (item) => item.active_status === activeStatusFilter
      );
    }

    return result;
  }, [data, searchTerm, statusFilter, sweepTypeFilter, activeStatusFilter]);

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.processing_status) options.add(item.processing_status);
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

  //   useEffect(() => {
  //     setColumnVisibility((prev) => ({
  //       ...prev,
  //       action: !!visibility.delete,
  //     }));
  //   }, [visibility.delete]);

  return (
    <div className="w-full space-y-4">
      <div className="-mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Sweep Type Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text">
            Sweep Type
          </label>
          <select
            className="text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            value={sweepTypeFilter}
            onChange={(e) => setSweepTypeFilter(e.target.value)}
          >
            {sweepTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
        <div className="col-span-1 md:col-span-4 flex items-center justify-end gap-4">
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

      <NyneOSTable<SweepConfiguration>
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

export default SweepConfigurationPage;
