import { useRef, useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type Row,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Search, Trash2 } from "lucide-react";
import type { UpdateRow } from "../../../types/type.ts";
import type { SortingState } from "@tanstack/react-table";
import type { PayableReceivableRow } from "../../../types/masterType";
import NyneOSTable from "../../../components/table/NyneOSTable";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Pagination from "../../../components/table/Pagination";
import { sections } from "./config";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import { formatToDDMMYYYY } from "../../../utils/dateFormat.ts";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
type PayableReceivableMasterResponse = {
  success: boolean;
  rows?: PayableReceivableRow[];
  error?: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  action_id: false,
  action_type: false,
  allow_netting: false,
  business_unit_division: false,
  cash_flow_category: true,
  category: true,
  checker_at: false,
  checker_by: false,
  checker_comment: false,
  created_at: false,
  created_by: false,
  default_currency: true,
  default_due_days: true,
  default_recon_gl: false,
  deleted_at: false,
  deleted_by: false,
  direction: true,
  edited_at: false,
  edited_by: false,
  effective_from: false,
  effective_to: false,
  erp_type: false,
  is_deleted: false,
  offset_revenue_expense_gl: false,
  old_allow_netting: false,
  old_business_unit_division: false,
  old_cash_flow_category: false,
  old_category: false,
  old_default_currency: false,
  old_default_due_days: false,
  old_default_recon_gl: false,
  old_direction: false,
  old_effective_from: false,
  old_effective_to: false,
  old_erp_type: false,
  old_offset_revenue_expense_gl: false,
  old_oracle_distribution_set: false,
  old_oracle_ledger: false,
  old_oracle_source: false,
  old_oracle_transaction_type: false,
  old_payment_terms_name: false,
  old_sage_analysis_code: false,
  old_sage_nominal_control: false,
  old_sap_company_code: false,
  old_sap_fi_doc_type: false,
  old_sap_posting_key_credit: false,
  old_sap_posting_key_debit: false,
  old_sap_reconciliation_gl: false,
  old_sap_tax_code: false,
  old_settlement_discount: false,
  old_settlement_discount_percent: false,
  old_tags: false,
  old_tally_ledger_group: false,
  old_tally_tax_class: false,
  old_tally_voucher_type: false,
  old_tax_applicable: false,
  old_tax_code: false,
  old_type_code: false,
  old_type_name: false,
  oracle_distribution_set: false,
  oracle_ledger: false,
  oracle_source: false,
  oracle_transaction_type: false,
  payment_terms_name: true,
  processing_status: true,
  reason: false,
  requested_at: false,
  requested_by: false,
  sage_analysis_code: false,
  sage_nominal_control: false,
  sap_company_code: false,
  sap_fi_doc_type: false,
  sap_posting_key_credit: false,
  sap_posting_key_debit: false,
  sap_reconciliation_gl: false,
  sap_tax_code: false,
  settlement_discount: false,
  settlement_discount_percent: false,
  tags: false,
  tally_ledger_group: false,
  tally_tax_class: false,
  tally_voucher_type: false,
  tax_applicable: false,
  tax_code: false,
  type_code: true,
  type_id: false,
  type_name: true,
};

const COLUMNS = [
  "select",
  "type_name",
  "type_code",
  "business_unit_division",
  "cash_flow_category",
  "category",
  "direction",
  "default_currency",
  "default_due_days",
  "payment_terms_name",
  "effective_from",
  "effective_to",
  "tags",
  "processing_status",
  "action",
  "expand",
];

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function AllPayableReceivables() {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMNS);
  // const [refresh, setRefresh] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editValues, setEditValues] = useState<PayableReceivableRow>(
    {} as PayableReceivableRow
  );
  const [data, setData] = useState<PayableReceivableRow[]>([]);
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
  const visibility = useAllTabPermissions("payable-receivable-master");
  useEffect(() => {
    setLoading(true);
    nos
      .post<PayableReceivableMasterResponse>(
        `${apiBaseUrl}/master/v2/payablereceivable/names`
      )
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setData(response.data.rows); // <-- rows instead of data
          setLoading(false);
        } else {
          notify(response.data?.error || "Unknown error", "error");
          setLoading(false);
        }
      })
      .catch(() => {
        notify("Network error. Please try again.", "error");
        setLoading(false);
      });
  }, []);

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.processing_status) options.add(item.processing_status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

  const handleDelete = async (type_id: string, category: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.type_id);

    const selectedRowCategories = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.category);

    const selectedCategoryObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedCategoryObjs
        : [data.find((item) => item.type_id === type_id)].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a Payable/Receivable that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectedRowCategories.join(", ") : category
      } selected transaction(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      type_ids: selectedRows.length > 0 ? selectedRows : [type_id],
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<PayableReceivableMasterResponse>(
        `${apiBaseUrl}/master/v2/payablereceivable/delete`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.type_ids.includes(row.type_id)
              ? { ...row, processing_status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${category} Type deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.type_id);
    if (selectedRows.length === 0) {
      notify(
        "Please select at least one Payable/Receivable to approve.",
        "warning"
      );
      return;
    }

    const selectedCategoryObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    // Prevent approving already approved rows
    if (
      selectedCategoryObjs.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot approve a Payable/Receivable that is already approved.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0
          ? selectedRows.join(", ")
          : "this payable/receivable"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      type_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<PayableReceivableMasterResponse>(
        `${apiBaseUrl}/master/v2/payablereceivable/bulk-approve`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.type_id)) {
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
        notify("Payable/Receivable approved successfully.", "success");
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
      .rows.map((row) => row.original.type_id);
    if (selectedRows.length === 0) {
      notify(
        "Please select at least one Payable/Receivable to reject.",
        "warning"
      );
      return;
    }
    const selectedCategoryObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    // Prevent approving already approved rows
    if (
      selectedCategoryObjs.some(
        (row) =>
          row &&
          typeof row.processing_status === "string" &&
          row.processing_status.toUpperCase() === "APPROVED"
      )
    ) {
      notify(
        "You cannot reject a Payable/Receivable that is already approved.",
        "warning"
      );
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0
          ? selectedRows.join(", ")
          : "this payable/receivable"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      type_ids: selectedRows as string[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<PayableReceivableMasterResponse>(
        `${apiBaseUrl}/master/v2/payablereceivable/bulk-reject`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.type_id)
              ? { ...row, processing_status: "REJECTED" }
              : row
          )
        );
        // setRefresh(!refresh);
        notify("Payable/Receivable rejected successfully.", "success");
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as PayableReceivableRow);
  };

  const handleEditChange = (
    field: keyof PayableReceivableRow,
    value: PayableReceivableRow[keyof PayableReceivableRow]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getChangedFields = (
    original: PayableReceivableRow,
    edited: PayableReceivableRow
  ) => {
    const changed: Partial<PayableReceivableRow> = {};
    Object.keys(edited).forEach((key) => {
      if (
        edited[key as keyof PayableReceivableRow] !==
        original[key as keyof PayableReceivableRow]
      ) {
        changed[key as keyof PayableReceivableRow] =
          edited[key as keyof PayableReceivableRow];
      }
    });
    return changed;
  };

  const handleForwardEditToggle = async (row: Row<PayableReceivableRow>) => {
    if (isEditing) {
      const changedFields = getChangedFields(row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve ${row.original.type_name}?`,
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
            type_id: row.original.type_id,
            fields: { ...changedFields },
            reason: result.inputValue || "NA",
          },
        ],
      };

      try {
        setIsSaving(true);
        const response = await nos.post<UpdateRow>(
          `${apiBaseUrl}/master/v2/payablereceivable/updatebulk`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.rows[0].success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...editValues } : item
            )
          );
          setIsEditing(false);
          notify("Payable/Receivable updated successfully!", "success");
        } else {
          notify(response.data?.rows?.[0]?.error || "Update failed", "error");
        }
      } catch (error) {
        notify(
          "An error occurred while updating the Payable/Receivable.",
          "error"
        );
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as PayableReceivableRow);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const columns = useMemo<ColumnDef<PayableReceivableRow>[]>(
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
      // Basic info fields
      {
        accessorKey: "business_unit_division",
        header: "Business Unit Division",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "cash_flow_category",
        header: "Cash Flow Category",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "direction",
        header: "Direction",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "default_currency",
        header: "Currency",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "default_due_days",
        header: "Due Days",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "payment_terms_name",
        header: "Payment Terms",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "effective_from",
        header: "Effective From",
        cell: (info) => {
          const value = info.getValue();
          return value ? formatToDDMMYYYY(value as string) : "—";
        },
      },
      {
        accessorKey: "effective_to",
        header: "Effective To",
        cell: (info) => {
          const value = info.getValue();
          return value ? formatToDDMMYYYY(value as string) : "—";
        },
      },
      { accessorKey: "tags", header: "Tags", cell: (info) => info.getValue() },
      {
        accessorKey: "type_code",
        header: "Type Code",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "type_id",
        header: "Type ID",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "type_name",
        header: "Type Name",
        cell: (info) => info.getValue(),
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
        accessorKey: "reason",
        header: "Reason",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "requested_by",
        header: "Requested By",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "requested_at",
        header: "Requested At",
        cell: (info) => {
          const value = info.getValue();
          return value ? formatToDDMMYYYY(value as string) : "—";
        },
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: (info) => {
          const value = info.getValue();
          return value ? formatToDDMMYYYY(value as string) : "—";
        },
      },
      {
        accessorKey: "created_by",
        header: "Created By",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "edited_at",
        header: "Edited At",
        cell: (info) => {
          const value = info.getValue();
          return value ? formatToDDMMYYYY(value as string) : "—";
        },
      },
      {
        accessorKey: "edited_by",
        header: "Edited By",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "deleted_at",
        header: "Deleted At",
        cell: (info) => {
          const value = info.getValue();
          return value ? formatToDDMMYYYY(value as string) : "—";
        },
      },
      {
        accessorKey: "deleted_by",
        header: "Deleted By",
        cell: (info) => info.getValue(),
      },
      // Optional technical/system fields
      {
        accessorKey: "allow_netting",
        header: "Allow Netting",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "default_recon_gl",
        header: "Default Recon GL",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "offset_revenue_expense_gl",
        header: "Offset Revenue/Expense GL",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "erp_type",
        header: "ERP Type",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "oracle_distribution_set",
        header: "Oracle Distribution Set",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "oracle_ledger",
        header: "Oracle Ledger",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "oracle_source",
        header: "Oracle Source",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "oracle_transaction_type",
        header: "Oracle Transaction Type",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "sage_analysis_code",
        header: "Sage Analysis Code",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "sage_nominal_control",
        header: "Sage Nominal Control",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "sap_company_code",
        header: "SAP Company Code",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "sap_fi_doc_type",
        header: "SAP FI Doc Type",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "sap_posting_key_credit",
        header: "SAP Posting Key Credit",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "sap_posting_key_debit",
        header: "SAP Posting Key Debit",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "sap_reconciliation_gl",
        header: "SAP Reconciliation GL",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "sap_tax_code",
        header: "SAP Tax Code",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "settlement_discount",
        header: "Settlement Discount",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "settlement_discount_percent",
        header: "Settlement Discount %",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "tally_ledger_group",
        header: "Tally Ledger Group",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "tally_tax_class",
        header: "Tally Tax Class",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "tally_voucher_type",
        header: "Tally Voucher Type",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "tax_applicable",
        header: "Tax Applicable",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "tax_code",
        header: "Tax Code",
        cell: (info) => info.getValue(),
      },
      // Action column
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
              onClick={() =>
                handleDelete(row.original.type_id, row.original.category)
              }
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [isEditing, editValues, isSaving, handleForwardEditToggle]
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

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      action: !!visibility.delete, // show if true, hide if false
    }));
  }, [visibility.delete]);

  return (
    <>
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

                {visibility.delete && (
                  <Button onClick={handleReject} color="Green">
                    Reject
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <NyneOSTable<PayableReceivableRow>
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
          column={`grid grid-cols-6`}
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
    </>
  );
}
export default AllPayableReceivables;
