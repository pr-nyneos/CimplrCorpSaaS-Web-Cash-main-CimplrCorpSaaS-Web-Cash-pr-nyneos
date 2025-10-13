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
import type { BankMasterForm } from "../../../types/masterType";
import NyneOSTable from "../../../components/table/NyneOSTable";
import Button from "../../../components/ui/Button";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import type { Update } from "../../../types/type.ts";
import Pagination from "../../../components/table/Pagination.tsx";
import {useAllTabPermissions} from "../../../hooks/useAllTabPermission.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type BankMasterResponse = {
  success: boolean;
  data?: BankMasterForm[];
  error: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  expand: true,
  action: true,
  bank_id: false,
  bank_name: true,
  bank_short_name: true,
  swift_bic_code: true,
  country_of_headquarters: true,
  connectivity_type: true,
  active_status: true,
  contact_person_name: true,
  contact_person_email: false,
  contact_person_phone: false,
  address_line1: false,
  address_line2: false,
  city: false,
  state_province: false,
  postal_code: false,
  old_bank_name: false,
  old_bank_short_name: false,
  old_swift_bic_code: false,
  old_country_of_headquarters: false,
  old_connectivity_type: false,
  old_active_status: false,
  old_contact_person_name: false,
  old_contact_person_email: false,
  old_contact_person_phone: false,
  old_address_line1: false,
  old_address_line2: false,
  old_city: false,
  old_state_province: false,
  old_postal_code: false,
  processing_status: true,
  action_id: false,
  action_type: false,
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
};

const AllBankAccounts: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "bank_id",
    "bank_name",
    "bank_short_name",
    "swift_bic_code",
    "country_of_headquarters",
    "connectivity_type",
    "active_status",
    "contact_person_name",
    "contact_person_email",
    "contact_person_phone",
    "address_line1",
    "address_line2",
    "city",
    "state_province",
    "postal_code",
    "old_bank_name",
    "old_bank_short_name",
    "old_swift_bic_code",
    "old_country_of_headquarters",
    "old_connectivity_type",
    "old_active_status",
    "old_contact_person_name",
    "old_contact_person_email",
    "old_contact_person_phone",
    "old_address_line1",
    "old_address_line2",
    "old_city",
    "old_state_province",
    "old_postal_code",
    "processing_status",
    "action_type",
    "action_id",
    "checker_at",
    "checker_by",
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
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editValues, setEditValues] = useState<BankMasterForm>(
    {} as BankMasterForm
  );
  const [data, setData] = useState<BankMasterForm[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };
  const [refresh, setRefresh] = useState(false);
  const visibility = useAllTabPermissions("bank-master");

  // Hide "action" column if delete permission is false
  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      action: !!visibility.delete, // show if true, hide if false
    }));
  }, [visibility.delete]);

  const { notify, confirm } = useNotification();

  useEffect(() => {
    setLoading(true);
    nos
      .post<BankMasterResponse>(`${apiBaseUrl}/master/bank/all`)
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
  }, [, refresh]);

  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.action_id);

    const selectRowBank = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bank_name);

    if (selectedRows.length === 0) {
      notify("Please select at least one Bank to approve.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectRowBank.join(", ") : "this bank"
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
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/master/bank/bulk-approve`,
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
        notify("Bank approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleDelete = async (bank_id: string, bank_name: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bank_id);

    const selectRowBank = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bank_name);

    const selectedBankObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedBankObjs
        : [data.find((item) => item.bank_id === bank_id)].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a bank that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectRowBank.join(", ") : bank_name
      } selected transaction(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      bank_ids: selectedRows.length > 0 ? selectedRows : [bank_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/master/bank/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.bank_ids.includes(row.bank_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${bank_name} Bank deleted.`, "success");
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

    const selectRowBank = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bank_name);

    if (selectedRows.length === 0) {
      notify("Please select at least one Bank to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectRowBank.join(", ") : "this bank"
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
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/master/bank/bulk-reject`,
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

        notify("Bank rejected successfully.", "success");
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleEditChange = (
    field: keyof BankMasterForm,
    value: BankMasterForm[keyof BankMasterForm]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as BankMasterForm);
  };

  const handleForwardEditToggle = async (row: Row<BankMasterForm>) => {
    if (isEditing) {
      const changedFields = (row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve ${row.original.bank_name}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      const payload = {
        banks: [
          {
            bank_id: row.original.bank_id,
            fields: { ...editValues },
            reason: result.inputValue || "",
          },
        ],
      };

      try {
        setIsSaving(true);
        const response = await nos.post<Update>(
          `${apiBaseUrl}/master/bank/update`,
          payload
        );

        if (response.data.results[0].success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...editValues } : item
            )
          );
          setIsEditing(false);
          notify("Bank updated successfully!", "success");
        } else {
          notify(
            response.data?.results?.[0]?.error || "Update failed",
            "error"
          );
        }
      } catch (error) {
        notify("An error occurred while updating the bank.", "error");
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as BankMasterForm);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<BankMasterForm>[]>(
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
        accessorKey: "old_bank_name",
        header: "Old Bank Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "bank_id",
        header: "Bank ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "old_bank_short_name",
        header: "Old Short Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_swift_bic_code",
        header: "Old SWIFT/BIC",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "old_country_of_headquarters",
        header: "Old HQ Country",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_connectivity_type",
        header: "Old Connectivity",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_active_status",
        header: "Old Status",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_contact_person_name",
        header: "Old Contact Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_contact_person_email",
        header: "Old Contact Email",
        cell: ({ getValue }) => (
          <span className="text-blue-600 underline">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "old_contact_person_phone",
        header: "Old Contact Phone",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_address_line1",
        header: "Old Address Line 1",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_address_line2",
        header: "Old Address Line 2",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_city",
        header: "Old City",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_state_province",
        header: "Old State/Province",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_postal_code",
        header: "Old Postal Code",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
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
      {
        accessorKey: "bank_name",
        header: "Bank Name",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "bank_short_name",
        header: "Short Name",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "swift_bic_code",
        header: "SWIFT/BIC Code",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "country_of_headquarters",
        header: "HQ Country",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "connectivity_type",
        header: "Connectivity Type",
        cell: ({ getValue }) => (
          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "active_status",
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
        accessorKey: "contact_person_name",
        header: "Contact Name",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "contact_person_email",
        header: "Contact Email",
        cell: ({ getValue }) => (
          <span className="text-blue-600 underline">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "contact_person_phone",
        header: "Contact Phone",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "address_line1",
        header: "Address Line 1",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "address_line2",
        header: "Address Line 2",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "state_province",
        header: "State/Province",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "postal_code",
        header: "Postal Code",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        id: "action",
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                handleDelete(row.original.bank_id, row.original.bank_name)
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

      <NyneOSTable<BankMasterForm>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
        sections={sections} // Pass your sections if needed
        isEditing={true}
        isSaving={isSaving}
        loading={loading}
        editValues={editValues}
        onChange={handleEditChange}
        column={`grid grid-cols-6`}
        handleCancelEdit={handleCancelEdit}
        handleForwardEditToggle={handleForwardEditToggle}
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

export default AllBankAccounts;
