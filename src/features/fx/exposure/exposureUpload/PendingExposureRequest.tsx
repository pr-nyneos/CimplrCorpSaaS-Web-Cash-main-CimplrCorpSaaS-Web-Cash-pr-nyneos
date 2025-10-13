import { useRef, useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  // type Row,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import { sections } from "./config";
import { Search } from "lucide-react";
import NyneOSTable2 from "../../../cashDashboard/NyneOSTable2.tsx";
import Button from "../../../../components/ui/Button";
import nos from "../../../../utils/nos.tsx";
import { useNotification } from "../../../../app/providers/NotificationProvider/Notification.tsx";
import Pagination from "../../../../components/table/Pagination";
import { getProcessingStatusColor } from "../../../../utils/colorCode";
import { formatToDDMMYY_HHMM } from "../../../../utils/formatToDDMMYY_HHMM";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type AllExposureRequestResponse = {
  buAccessible: string[];
  "exposure-upload": {
    tabs: {
      allTab: any;
      pendingTab: any;
      uploadTab: any;
    };
  };
  pageData: AllExposureRequest[];
};

type AllExposureOperationResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

export type AllExposureRequest = {
  additional_header_details: string;
  additional_line_details: string;
  amount_in_local_currency: number;
  approval_comment: string;
  approval_status: string;
  approved_at: string;
  approved_by: string;
  company_code: string;
  counterparty_code: string;
  counterparty_name: string;
  counterparty_type: string;
  created_at: string;
  currency: string;
  delete_comment: string;
  delivery_date: string;
  document_date: string;
  document_id: string;
  entity: string;
  entity1: string;
  entity2: string;
  entity3: string;
  exposure_header_id: string;
  exposure_type: string;
  gl_account: string;
  inco_terms: string;
  is_active: boolean;
  line_item_amount: number;
  line_item_id: string;
  line_number: string;
  payment_terms: string;
  plant_code: string;
  posting_date: string;
  product_description: string;
  product_id: string;
  quantity: string;
  reference: string;
  rejected_at: string;
  rejected_by: string;
  rejection_comment: string;
  requested_by: string;
  status: string;
  text: string;
  time_based: string;
  total_open_amount: number;
  total_original_amount: number;
  unit_of_measure: string;
  unit_price: string;
  updated_at: string;
  value_date: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  expand: true,
  document_id: true,
  exposure_type: true,
  entity: true,
  counterparty_name: true,
  total_original_amount: true,
  total_open_amount: true,
  currency: true,
  document_date: true,
  status: false,
  action: false,
  exposure_header_id: false,
  line_item_id: false,
  approval_status: true,
  company_code: false,
  counterparty_code: false,
  gl_account: false,
  amount_in_local_currency: false,
};

const COLUMNS = [
  "select",
  "document_id",
  "exposure_type",
  "entity",
  "counterparty_name",
  "total_original_amount",
  "total_open_amount",
  "currency",
  "document_date",
  "approval_status",
  "action",
  "expand",
];

const PendingExposureRequests = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMNS);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  // const [isEditing, setIsEditing] = useState(false);
  // const [isSaving, setIsSaving] = useState(false);
  // const [editValues, setEditValues] = useState<AllExposureRequest>(
  //   {} as AllExposureRequest
  // );
  const [data, setData] = useState<AllExposureRequest[]>([]);
  const [, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // const handleEditChange = (
  //   field: keyof AllExposureRequest,
  //   value: AllExposureRequest[keyof AllExposureRequest]
  // ) => {
  //   setEditValues((prev) => ({
  //     ...prev,
  //     [field]: value,
  //   }));
  // };


  // const getChangedFields = (original: AllExposureRequest, edited: AllExposureRequest) => {
  //   const changes: Partial<AllExposureRequest> = {};
  //   for (const key in edited) {
  //     if (original[key] !== edited[key]) {
  //       changes[key] = edited[key];
  //     }
  //   }
  //   return changes;
  // };

  const { notify, confirm } = useNotification();

  useEffect(() => {
    setLoading(true);
    nos
      .post<AllExposureRequestResponse>(
        `${apiBaseUrl}/fx/exposures/headers-line-items`
      )
      .then((response) => {
        console.log("API Response:", response.data); // Debug log
        if (response.data.pageData && Array.isArray(response.data.pageData)) {
          console.log("Setting data:", response.data.pageData); // Debug log
          setData(response.data.pageData);
          setLoading(false);
        } else {
          console.log("No pageData found in response:", response.data); // Debug log
          notify("No data received from server.", "error");
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("API Error:", error); // Debug log
        notify("Network error. Please try again.", "error");
        setLoading(false);
      });
  }, [notify]);

  // const handleCancelEdit = () => {
  //   setIsEditing(false);
  //   setIsSaving(false);
  //   setEditValues({} as AllExposureRequest);
  // };

  // const handleForwardEditToggle = async (row: Row<AllExposureRequest>) => {
  //   if (isEditing) {
  //     const changedFields = getChangedFields(row.original, editValues);
  //     if (Object.keys(changedFields).length === 0) {
  //       setIsEditing(false);
  //       return;
  //     }

  //     const result = await confirm(
  //       `Are you sure you want to update ${row.original.document_id}?`,
  //       {
  //         input: true,
  //         inputLabel: "Update Comments (optional)",
  //         inputPlaceholder: "Enter comments...",
  //       }
  //     );
  //     if (!result.confirmed) return;

  //     const payload = {
  //       id: row.original.exposure_header_id,
  //       fields: { ...changedFields },
  //       // reason: result.inputValue || "",
  //       user_id: "1"
  //     };

  //     try {
  //       setIsSaving(true);
  //       const response = await nos.post<AllExposureOperationResponse>(
  //         `${apiBaseUrl}/fx/exposures/edit`,
  //         payload
  //       );

  //       if (response.data.success) {
  //         setData((prev) =>
  //           prev.map((item, idx) =>
  //             idx === row.index ? { ...item, ...changedFields } : item
  //           )
  //         );
  //         setIsEditing(false);
  //         notify("Exposure updated successfully!", "success");
  //       } else {
  //         notify(response.data.error || "Update failed", "error");
  //       }
  //     } catch (error) {
  //       notify("An error occurred while updating the exposure.", "error");
  //     } finally {
  //       setIsSaving(false);
  //       setEditValues({} as AllExposureRequest);
  //     }
  //   } else {
  //     const initialValues = { ...row.original };
  //     setEditValues(initialValues);
  //     setIsEditing(true);
  //   }
  // };

  const handleDelete = async (
    exposure_header_id: string,
    document_id: string
  ) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.exposure_header_id);

    const selectRowRefs = table
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
          typeof row.status === "string" &&
          row.status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete an Exposure that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectRowRefs.join(", ") : document_id
      } selected exposure(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      exposureHeaderIds:
        selectedRows.length > 0 ? selectedRows : [exposure_header_id],
    };

    try {
      const response = await nos.post<AllExposureOperationResponse>(
        `${apiBaseUrl}/fx/exposures/delete-multiple-headers`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.exposureHeaderIds.includes(row.exposure_header_id)
              ? { ...row, status: "PENDING_DELETE_APPROVAL" }
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

  const handleReject = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.exposure_header_id);
    if (selectedRows.length === 0) {
      notify("Please select at least one Exposure to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this exposure"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      exposureHeaderIds: selectedRows as string[],
    };
    try {
      const response = await nos.post<AllExposureOperationResponse>(
        `${apiBaseUrl}/fx/exposures/reject-multiple-headers`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.exposure_header_id)
              ? { ...row, status: "REJECTED" }
              : row
          )
        );
        notify("Exposure rejected successfully.", "success");
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
      .rows.map((row) => row.original.exposure_header_id);
    if (selectedRows.length === 0) {
      notify("Please select at least one Exposure to approve.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectedRows.join(", ") : "this exposure"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      exposureHeaderIds: selectedRows as string[],
    };
    try {
      const response = await nos.post<AllExposureOperationResponse>(
        `${apiBaseUrl}/fx/exposures/approve-multiple-headers`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.exposure_header_id)) {
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
        notify("Exposure approved successfully.", "success");
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
      if (item.approval_status) options.add(item.approval_status);
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
      result = result.filter((item) => item.approval_status === statusFilter);
    }

    return result;
  }, [data, searchTerm, statusFilter]);
  const columns = useMemo<ColumnDef<AllExposureRequest>[]>(
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
        accessorKey: "document_id",
        header: "Document ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "exposure_type",
        header: "Exposure Type",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "counterparty_name",
        header: "Counterparty",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "total_original_amount",
        header: "Total Original Amount",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "total_open_amount",
        header: "Total Open",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "document_date",
        header: "Document Date",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <span>{value ? formatToDDMMYY_HHMM(value) : "—"}</span>;
        },
      },
      {
        accessorKey: "approval_status",
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
                  row.original.exposure_header_id,
                  row.original.document_id
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

      <NyneOSTable2<AllExposureRequest>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "symbol", "select"]}
        sections={sections}
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

export default PendingExposureRequests;
