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
import sections from "./config";
import { Search } from "lucide-react";
import NyneOSTable from "../../../../components/table/NyneOSTable";
import Button from "../../../../components/ui/Button";
import nos from "../../../../utils/nos.tsx";
import { useNotification } from "../../../../app/providers/NotificationProvider/Notification.tsx"
import Pagination from "../../../../components/table/Pagination";
import { getProcessingStatusColor } from "../../../../utils/colorCode";
import { formatToDDMMYYYY } from "../../../../utils/dateFormat";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export type AllForwards = {
  system_transaction_id: string;
  internal_reference_id: string;
  entity_level_0: string;
  entity_level_1: string;
  entity_level_2: string;
  entity_level_3: string;
  local_currency: string;
  order_type: string;
  transaction_type: string;
  counterparty: string;
  mode_of_delivery: string;
  delivery_period: string;
  add_date: string;
  settlement_date: string;
  maturity_date: string;
  delivery_date: string;
  currency_pair: string;
  base_currency: string;
  quote_currency: string;
  input_value: number;
  value_type: string;
  actual_value_base_currency: number;
  spot_rate: number;
  forward_points: number;
  bank_margin: number;
  total_rate: number;
  value_quote_currency: number;
  intervening_rate_quote_to_local: number;
  value_local_currency: number;
  internal_dealer: string;
  counterparty_dealer: string;
  remarks: string;
  narration: string;
  transaction_timestamp: Date;
  bank_transaction_id: string;
  swift_unique_id: string;
  bank_confirmation_date: string;
  status: string;
};

type AllForwardsResponse = {
  success: boolean;
  data?: AllForwards[];
  error: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  expand: true,
  system_transaction_id: false,
  internal_reference_id: true,
  order_type: true,
  transaction_type: true,
  currency_pair: true,
  input_value: true,
  spot_rate: true,
  total_rate: true,
  counterparty: true,
  settlement_date: true,
  status: true,
  action: true,
};

const COLUMNS = [
  "select",
  // "system_transaction_id",
  "internal_reference_id",
  "order_type",
  "transaction_type",
  "currency_pair",
  "input_value",
  "spot_rate",
  "total_rate",
  "counterparty",
  "settlement_date",
  "status",
  "action",
  "expand",
];

const AllForwards: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMNS);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<AllForwards>(
    {} as AllForwards
  );
  const [data, setData] = useState<AllForwards[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [searchTerm, setSearchTerm] = useState("");
  
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
      .post<AllForwardsResponse>(`${apiBaseUrl}/fx/forwards/entity-relevant-list`)
      .then((response) => {
        if (response.data.success && response.data.data) {
          setData(response.data.data);
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
  }, [notify]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsSaving(false);
    setEditValues({} as AllForwards);
  };

  const handleEditChange = (
    field: keyof AllForwards,
    value: AllForwards[keyof AllForwards]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getChangedFields = (original: AllForwards, edited: AllForwards) => {
    const changes: Partial<AllForwards> = {};
    for (const key in edited) {
      if (original[key as keyof AllForwards] !== edited[key as keyof AllForwards]) {
        (changes as any)[key] = edited[key as keyof AllForwards];
      }
    }
    return changes;
  };

  const handleForwardEditToggle = async (row: Row<AllForwards>) => {
    if (isEditing) {
      const changedFields = getChangedFields(row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await confirm(
        `Are you sure you want to update ${row.original.internal_reference_id}?`,
        {
          input: true,
          inputLabel: "Update Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      const payload = {
        system_transaction_id: row.original.system_transaction_id,
        fields: { ...changedFields },
        // reason: result.inputValue || "",
        user_id: "1"
      };

      try {
        setIsSaving(true);
        const response = await nos.post<AllForwardsResponse>(
          `${apiBaseUrl}/fx/forwards/update-fields`,
          payload
        );

        if (response.data.success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...changedFields } : item
            )
          );
          setIsEditing(false);
          notify("Forward updated successfully!", "success");
        } else {
          notify(response.data.error || "Update failed", "error");
        }
      } catch (error) {
        notify("An error occurred while updating the forward.", "error");
      } finally {
        setIsSaving(false);
        setEditValues({} as AllForwards);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const handleDelete = async (system_transaction_id: string, reference_id: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.system_transaction_id);

    const selectRowRefs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.internal_reference_id);

    const selectedForwardObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedForwardObjs
        : [
            data.find((item) => item.system_transaction_id === system_transaction_id),
          ].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.status === "string" &&
          row.status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a Forward that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectRowRefs.join(", ") : reference_id
      } selected forward(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      system_transaction_ids: selectedRows.length > 0 ? selectedRows : [system_transaction_id],
    };

    try {
      const response = await nos.post<AllForwardsResponse>(
        `${apiBaseUrl}/fx/forwards/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.system_transaction_ids.includes(row.system_transaction_id)
              ? { ...row, status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );

        notify(`${reference_id} Forward deleted.`, "success");
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
      .rows.map((row) => row.original.system_transaction_id);
    if (selectedRows.length === 0) {
      notify("Please select at least one Forward to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0
          ? selectedRows.join(", ")
          : "this forward"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      system_transaction_ids: selectedRows as string[],
    };
    try {
      const response = await nos.post<AllForwardsResponse>(
        `${apiBaseUrl}/fx/forwards/bulk-reject`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.system_transaction_id)
              ? { ...row, status: "REJECTED" }
              : row
          )
        );
        notify("Forward rejected successfully.", "success");
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
      .rows.map((row) => row.original.system_transaction_id);
    if (selectedRows.length === 0) {
      notify(
        "Please select at least one Forward to approve.",
        "warning"
      );
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0
          ? selectedRows.join(", ")
          : "this forward"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      system_transaction_ids: selectedRows as string[],
    };
    try {
      const response = await nos.post<AllForwardsResponse>(
        `${apiBaseUrl}/fx/forwards/bulk-approve`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.system_transaction_id)) {
              if (
                typeof row.status === "string" &&
                row.status.toUpperCase() === "PENDING_DELETE_APPROVAL"
              ) {
                return false;
              }
              row.status = "APPROVED";
            }
            return true;
          })
        );
        notify("Forward approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.status) options.add(item.status);
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
      result = result.filter((item) => item.status === statusFilter);
    }

    return result;
  }, [data, searchTerm, statusFilter]);

  const columns = useMemo<ColumnDef<AllForwards>[]>(
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
        accessorKey: "system_transaction_id",
        header: "System Transaction ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "internal_reference_id",
        header: "Internal Ref ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "order_type",
        header: "Order Type",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "transaction_type",
        header: "TX Type",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "currency_pair",
        header: "Currency Pair",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "input_value",
        header: "Input Value",
        cell: ({ getValue }) => <span>{(getValue() as number) || "—"}</span>,
      },
      {
        accessorKey: "spot_rate",
        header: "Spot Rate",
        cell: ({ getValue }) => <span>{(getValue() as number) || "—"}</span>,
      },
      {
        accessorKey: "total_rate",
        header: "Total Rate",
        cell: ({ getValue }) => <span>{(getValue() as number) || "—"}</span>,
      },
      {
        accessorKey: "counterparty",
        header: "Counterparty",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "settlement_date",
        header: "Settlement Date",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <span>{value ? formatToDDMMYYYY(value) : "—"}</span>;
        },
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
                value.toUpperCase()
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
              onClick={() =>
                handleDelete(
                  row.original.system_transaction_id,
                  row.original.internal_reference_id
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
    autoResetPageIndex: false,
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

      <NyneOSTable<AllForwards>
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
        column={`grid-cols-4`}
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

export default AllForwards;
