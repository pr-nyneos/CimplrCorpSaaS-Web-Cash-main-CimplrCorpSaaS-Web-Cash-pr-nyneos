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
import type { BankStatementRow } from "../../../types/cashType.ts";
import NyneOSTable from "../../../components/table/NyneOSTable";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Pagination from "../../../components/table/Pagination";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type BankStatementRowResponse = {
  success: boolean;
  rows?: BankStatementRow[];
  error: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  expand: true,
  bankstatementid: false,
  entityid: false,
  account_number: true,
  statementdate: false,
  openingbalance: true,
  closingbalance: true,
  transactiondate: false,
  description: false,
  withdrawalamount: true,
  depositamount: false,
  modeoftransaction: false,
  accountholdername: false,
  branchname: false,
  ifsccode: false,
  statement_period: false,
  chequerefno: false,
  status: true,
  processing_status: true,
  entity_name: false,
  bank_name: true,
  requested_by: false,
  requested_at: false,
  checker_by: false,
  checker_at: false,
  created_by: false,
  created_at: false,
  edited_by: false,
  edited_at: false,
  action: true,
};

const COLUMNS = [
  "select",
  "bankstatementid",
  "entityid",
  "account_number",
  "statementdate",
  "openingbalance",
  "closingbalance",
  "transactiondate",
  "description",
  "withdrawalamount",
  "depositamount",
  "modeoftransaction",
  "accountholdername",
  "branchname",
  "ifsccode",
  "statement_period",
  "chequerefno",
  "status",
  "processing_status",
  "entity_name",
  "bank_name",
  "requested_by",
  "requested_at",
  "checker_by",
  "checker_at",
  "created_by",
  "created_at",
  "edited_by",
  "edited_at",
  "action",
  "expand",
];

const AllBankStatement: React.FC = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMNS);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<BankStatementRow>(
    {} as BankStatementRow
  );
  const [data, setData] = useState<BankStatementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [processingStatusFilter, setProcessingStatusFilter] = useState("All");
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
      .post<BankStatementRowResponse>(`${apiBaseUrl}/cash/bank-statements/all`)
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    // setIsSaving(false);
    setEditValues({} as BankStatementRow);
  };

  const handleDelete = async (bankstatementid: string, bank_name: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bankstatementid);

    const selectRowBank = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.bank_name);

    const selectedBankObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedBankObjs
        : [
            data.find((item) => item.bankstatementid === bankstatementid),
          ].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a Bank statement that is already pending delete approval.",
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
      bankstatement_ids:
        selectedRows.length > 0 ? selectedRows : [bankstatementid],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<BankStatementRowResponse>(
        `${apiBaseUrl}/cash/bank-statements/bulk-delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.bankstatement_ids.includes(row.bankstatementid)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );

        notify(`${bank_name} Bank statement deleted.`, "success");
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
      .rows.map((row) => row.original.bankstatementid);
    if (selectedRows.length === 0) {
      notify("Please select at least one Bank statement to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0
          ? selectedRows.join(", ")
          : "this bank statement"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      bankstatement_ids: selectedRows as string[],
      comments: result.inputValue || "",
    };
    try {
      const response = await nos.post<BankStatementRowResponse>(
        `${apiBaseUrl}/cash/bank-statements/bulk-reject`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.bankstatementid)
              ? { ...row, processing_status: "REJECTED" }
              : row
          )
        );
        notify("Bank statement rejected successfully.", "success");
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
      .rows.map((row) => row.original.bankstatementid);
    if (selectedRows.length === 0) {
      notify(
        "Please select at least one Bank statement to approve.",
        "warning"
      );
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0
          ? selectedRows.join(", ")
          : "this bank statement"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      bankstatement_ids: selectedRows as string[],
      comments: result.inputValue || "",
    };
    try {
      const response = await nos.post<BankStatementRowResponse>(
        `${apiBaseUrl}/cash/bank-statements/bulk-approve`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.bankstatementid)) {
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
        notify("Bank Statement approved successfully.", "success");
      } else {
        notify(response.data.error || "Approval failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleEditChange = (
    field: keyof BankStatementRow,
    value: BankStatementRow[keyof BankStatementRow]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleForwardEditToggle = async (row: Row<BankStatementRow>) => {
    if (isEditing) {
      // Only send changed fields
      const changedFields: Partial<BankStatementRow> = {};
      Object.keys(editValues).forEach((key) => {
        if ((editValues as any)[key] !== (row.original as any)[key]) {
          (changedFields as any)[key] = (editValues as any)[key];
        }
      });

      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        setEditValues({} as BankStatementRow);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve Bank Statement ${row.original.bankstatementid}?`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      const payload = {
        // bank_statements: [
          // {
            bankstatementid: row.original.bankstatementid,
            fields: { ...changedFields },
            reason: result.inputValue || "",
          // },
        // ],
      };

      try {
        setIsSaving(true);
        const response = await nos.post<any>(
          `${apiBaseUrl}/cash/bank-statements/update`,
          payload
        );

        if (response.data.success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...editValues } : item
            )
          );
          setIsEditing(false);
          setEditValues({} as BankStatementRow);
          notify("Bank Statement updated successfully!", "success");
        } else {
          notify(response.data?.error || "Update failed", "error");
        }
      } catch (error) {
        notify("An error occurred while updating the bank statement.", "error");
      } finally {
        setIsSaving(false);
        setEditValues({} as BankStatementRow);
      }
    } else {
      setEditValues({ ...row.original });
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<BankStatementRow>[]>(
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
        accessorKey: "bankstatementid",
        header: "Bank Statement ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "entityid",
        header: "Entity ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "account_number",
        header: "Account Number",
        cell: ({ getValue }) => (
          <span className="font-mono">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "statementdate",
        header: "Statement Date",
        cell: ({ getValue }) => (
          <span className="font-mono">{(getValue() as number) || "—"}</span>
        ),
      },
      {
        accessorKey: "openingbalance",
        header: "Opening Balance",
        cell: ({ getValue }) => (
          <span className="font-mono">{(getValue() as number) || "—"}</span>
        ),
      },
      {
        accessorKey: "closingbalance",
        header: "Closing Balance",
        cell: ({ getValue }) => (
          <span className="font-mono">{(getValue() as number) || "—"}</span>
        ),
      },
      {
        accessorKey: "transactiondate",
        header: "Transaction Date",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span>{value ? new Date(value).toLocaleDateString() : "—"}</span>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "withdrawalamount",
        header: "Withdrawal Amount",
        cell: ({ getValue }) => (
          <span className="font-mono">{(getValue() as number) || "—"}</span>
        ),
      },
      {
        accessorKey: "depositamount",
        header: "Deposit Amount",
        cell: ({ getValue }) => (
          <span className="font-mono">{(getValue() as number) || "—"}</span>
        ),
      },
      {
        accessorKey: "modeoftransaction",
        header: "Mode of Transaction",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "accountholdername",
        header: "Account Holder Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "branchname",
        header: "Branch Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "ifsccode",
        header: "IFSC Code",
        cell: ({ getValue }) => (
          <span className="font-mono">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "statement_period",
        header: "Statement Period",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "chequerefno",
        header: "Cheque Ref No",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "status",
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
        accessorKey: "processing_status",
        header: "Processing Status",
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
        accessorKey: "entity_name",
        header: "Entity Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "bank_name",
        header: "Bank Name",
        cell: ({ getValue }) => (
          <span className="font-semibold">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "requested_by",
        header: "Requested By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "requested_at",
        header: "Requested At",
        cell: ({ getValue }) => {
          const value = getValue() as string | undefined;
          return (
            <span className="font-mono text-sm">
              {value ? new Date(value).toLocaleString() : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "checker_by",
        header: "Checker By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "checker_at",
        header: "Checker At",
        cell: ({ getValue }) => {
          const value = getValue() as string | undefined;
          return (
            <span className="font-mono text-sm">
              {value ? new Date(value).toLocaleString() : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "created_by",
        header: "Created By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span className="font-mono text-sm">
              {value ? new Date(value).toLocaleString() : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "edited_by",
        header: "Edited By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "edited_at",
        header: "Edited At",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span className="font-mono text-sm">
              {value ? new Date(value).toLocaleString() : "—"}
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
                  row.original.bankstatementid,
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
    []
  );

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.status) options.add(item.status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

  const processingStatusOptions = useMemo(() => {
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
      result = result.filter((item) => item.status === statusFilter);
    }

    if (processingStatusFilter !== "All") {
      result = result.filter(
        (item) => item.processing_status === processingStatusFilter
      );
    }

    return result;
  }, [data, searchTerm, statusFilter, processingStatusFilter]);

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

        {/* Processing Status Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text">
            Processing Status
          </label>
          <select
            className="text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            value={processingStatusFilter}
            onChange={(e) => setProcessingStatusFilter(e.target.value)}
          >
            {processingStatusOptions.map((status) => (
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

      <NyneOSTable<BankStatementRow>
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
        column={`grid-cols-6`}
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

export default AllBankStatement;
