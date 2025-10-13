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
import type { AllBankBalance } from "../../../types/cashType";
import NyneOSTable from "../../../components/table/NyneOSTable";
import Button from "../../../components/ui/Button";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import type { Update } from "../../../types/type.ts";
import Pagination from "../../../components/table/Pagination.tsx";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
import { get } from "react-hook-form";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type BankMasterResponse = {
  success: boolean;
  rows?: AllBankBalance[];
  error: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  // UI helpers
  select: true,
  expand: true,
  action: true,

  // main fields
  balance_id: false,
  account_no: true,
  bank_name: true,
  iban: true,
  currency_code: true,
  balance_type: true,
  opening_balance: false,
  closing_balance: false,
  total_credits: false,
  total_debits: false,
  as_of_date: false,
  as_of_time: false,
  country: false,
  nickname: false,
  source_channel: false,
  statement_type: false,
  processing_status: true,
  reason: false,

  // old fields
  old_account_no: false,
  old_as_of_date: false,
  old_as_of_time: false,
  old_balance_amount: false,
  old_balance_type: false,
  old_bank_name: false,
  old_closing_balance: false,
  old_currency_code: false,
  old_iban: false,
  old_nickname: false,
  old_opening_balance: false,
  old_source_channel: false,
  old_statement_type: false,
  old_total_credits: false,
  old_total_debits: false,

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

const AllBankBalancePage: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "balance_id",
    "account_no",
    "bank_name",
    "iban",
    "currency_code",
    "balance_type",
    "opening_balance",
    "closing_balance",
    "total_credits",
    "total_debits",
    "as_of_date",
    "as_of_time",
    "country",
    "nickname",
    "source_channel",
    "statement_type",
    "processing_status",
    "balance_amount",
    "action",
    "expand",
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [maxAsOfDateFilter, setMaxAsOfDateFilter] = useState<string>("");

  const [editValues, setEditValues] = useState<AllBankBalance>(
    {} as AllBankBalance
  );
  const [data, setData] = useState<AllBankBalance[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [balanceTypeFilter, setBalanceTypeFilter] = useState("All");
  const [currencyFilter, setCurrencyFilter] = useState("All");

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };
  //   const [refresh, setRefresh] = useState(false);

  const { notify, confirm } = useNotification();
  const visibility = useAllTabPermissions("bank-balance");

  useEffect(() => {
    setLoading(true);
    nos
      .post<BankMasterResponse>(`${apiBaseUrl}/cash/bank-balances/all`)
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setData(response.data.rows || []);
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
      .rows.map((row) => row.original.balance_id);

    const selectRowBank = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bank_name);

    if (selectedRows.length === 0) {
      notify("Please select at least one Bank Balance to approve.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectRowBank.join(", ") : "this bank balance"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      balance_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/cash/bank-balances/bulk-approve`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.balance_id)) {
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
        // setRefresh(!refresh);
        notify("Bank Balance approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleDelete = async (balance_id: string, bank_name: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.balance_id);

    const selectRowBank = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bank_name);

    const selectedBankObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedBankObjs
        : [data.find((item) => item.balance_id === balance_id)].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a bank balance that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectRowBank.join(", ") : bank_name
      } selected bank balance(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      balance_ids: selectedRows.length > 0 ? selectedRows : [balance_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/cash/bank-balances/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.balance_ids.includes(row.balance_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${bank_name} Bank Balance deleted.`, "success");
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
      .rows.map((row) => row.original.balance_id);

    const selectRowBank = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bank_name);

    // Get the selected row objects
    const selectedBankObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    // Check if any selected row is already APPROVED
    if (
      selectedBankObjs.some(
        (row) =>
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot reject a bank balance that is already approved.",
        "warning"
      );
      return;
    }

    if (selectedRows.length === 0) {
      notify("Please select at least one Bank Balance to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectRowBank.join(", ") : "this bank balance"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      balance_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<BankMasterResponse>(
        `${apiBaseUrl}/cash/bank-balances/bulk-reject`,
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
        notify("Bank Balance rejected successfully.", "success");
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleEditChange = (
    field: keyof AllBankBalance,
    value: AllBankBalance[keyof AllBankBalance]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as AllBankBalance);
  };

  const handleForwardEditToggle = async (row: Row<AllBankBalance>) => {
    if (isEditing) {
      const changedFields = getChangedFields(row.original, editValues);
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
            bank_id: row.original.balance_id,
            fields: { ...changedFields },
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
        setEditValues({} as AllBankBalance);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<AllBankBalance>[]>(
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
        accessorKey: "old_bank_name",
        header: "Old Bank Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_account_no",
        header: "Old Account No",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_iban",
        header: "Old IBAN",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "old_currency_code",
        header: "Old Currency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_balance_type",
        header: "Old Balance Type",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_balance_amount",
        header: "Old Balance",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_opening_balance",
        header: "Old Opening Balance",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_closing_balance",
        header: "Old Closing Balance",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_total_credits",
        header: "Old Total Credits",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_total_debits",
        header: "Old Total Debits",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_as_of_date",
        header: "Old As of Date",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_as_of_time",
        header: "Old As of Time",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_nickname",
        header: "Old Nickname",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_source_channel",
        header: "Old Source Channel",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "old_statement_type",
        header: "Old Statement Type",
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

      {
        accessorKey: "bank_name",
        header: "Bank Name",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "account_no",
        header: "Account No",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "iban",
        header: "IBAN",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "currency_code",
        header: "Currency",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "balance_type",
        header: "Balance Type",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "balance_amount",
        header: "Balance",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "opening_balance",
        header: "Opening Balance",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "closing_balance",
        header: "Closing Balance",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "total_credits",
        header: "Total Credits",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "total_debits",
        header: "Total Debits",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "as_of_date",
        header: "As of Date",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "as_of_time",
        header: "As of Time",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "nickname",
        header: "Nickname",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "source_channel",
        header: "Source Channel",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "statement_type",
        header: "Statement Type",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "country",
        header: "Country",
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
        id: "action",
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                handleDelete(row.original.balance_id, row.original.bank_name)
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

  // Utility to get changed fields between two AllBankBalance objects
  const getChangedFields = (
    original: AllBankBalance,
    edited: AllBankBalance
  ) => {
    const changed: Partial<AllBankBalance> = {};
    Object.keys(edited).forEach((key) => {
      if (
        edited[key as keyof AllBankBalance] !==
        original[key as keyof AllBankBalance]
      ) {
        changed[key as keyof AllBankBalance] =
          edited[key as keyof AllBankBalance];
      }
    });
    return changed;
  };
  // ...existing code...
  // Unique options for filters
  const balanceTypeOptions = ["Ledger", "Available"];

  const currencyOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.currency_code) options.add(item.currency_code);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

  // Update filteredData to include new filters
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
    if (balanceTypeFilter !== "All") {
      result = result.filter((item) => item.balance_type === balanceTypeFilter);
    }
    if (currencyFilter !== "All") {
      result = result.filter((item) => item.currency_code === currencyFilter);
    }

    if (maxAsOfDateFilter) {
      result = result.filter((item) => {
        if (!item.as_of_date) return false;
        const itemDate = new Date(item.as_of_date);
        const filterDate = new Date(maxAsOfDateFilter);
        return itemDate <= filterDate;
      });
    }

    return result;
  }, [
    data,
    searchTerm,
    statusFilter,
    balanceTypeFilter,
    currencyFilter,
    maxAsOfDateFilter,
  ]);

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

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      action: !!visibility.delete,
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
        {/* Balance Type Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text">
            Balance Type
          </label>
          <select
            className="text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            value={balanceTypeFilter}
            onChange={(e) => setBalanceTypeFilter(e.target.value)}
          >
            {balanceTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {/* Currency Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text">
            Currency
          </label>
          <select
            className="text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
          >
            {currencyOptions.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text">
            Max As-of Date (max)
          </label>
          <input
            type="date"
            className="text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            value={maxAsOfDateFilter}
            onChange={(e) => setMaxAsOfDateFilter(e.target.value)}
          />
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

      <NyneOSTable<AllBankBalance>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
        sections={sections} // Pass your sections if needed
        isEditing={false}
        isSaving={isSaving}
        loading={loading}
        editValues={editValues}
        onChange={handleEditChange}
        column={`grid grid-cols-6`}
        handleCancelEdit={handleCancelEdit}
        handleForwardEditToggle={handleForwardEditToggle}
        Visibility={false}
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

export default AllBankBalancePage;
