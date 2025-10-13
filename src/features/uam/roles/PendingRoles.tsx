import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import Pagination from "../../../components/table/Pagination";
// import type { Update } from "../../../types/type.ts";
import DateRangeFilter from "../../../components/ui/DateRangeFilter.tsx";
import type { Range } from "react-date-range";
import Button from "../../../components/ui/Button.tsx";
import { sections } from "./config";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
//   type Row,
} from "@tanstack/react-table";

import nos from "../../../utils/nos.tsx";
import { exportToExcel } from "../../../utils/exportToExcel.ts";
import { formatToHHMM } from "../../../utils/formatToHHMM";
import { formatToDDMMYY_HHMM } from "../../../utils/formatToDDMMYY_HHMM";
import NyneOSTable2 from "../../cashDashboard/NyneOSTable2.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type AllPendingRolesResponse = {
  permissions: any;
  roleData: PendingRoles[];
  success: boolean;
  error: string;
};

type PendingRoles = {
  id: number;
  srNo: string | number;
  name: string;
  roleCode: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  status?: string;
  createdBy?: string;
  approvedBy?: string;
  approveddate?: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  expand: true,
  action: false,
  id: true,
  srNo: true,
  name: true,
  roleCode: false,
  description: true,
  startTime: true,
  endTime: true,
  createdAt: false,
  status: true,
  createdBy: true,
  approvedBy: true,
  approveddate: true,
};

const mapRole = (item: any): PendingRoles => ({
  id: item.id,
  srNo: item.srNo ?? item.id,
  name: item.name,
  roleCode: item.roleCode,
  description: item.description,
  startTime: item.startTime,
  endTime: item.endTime,
  createdAt: item.createdAt,
  status: item.status,
  createdBy: item.createdBy,
  approvedBy: item.approvedBy,
  approveddate: item.approveddate,
});

const PendingRoles = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const { notify, confirm } = useNotification();
  const [data, setData] = useState<PendingRoles[]>([]);
  const [isEditing, ] = useState(false);
  const [editValues, ] = useState<PendingRoles>({} as PendingRoles);
  const [selectedRowIds, setSelectedRowIds] = useState({});
//   const [isSaving, setIsSaving] = useState(false);
  const [, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    },
  ]);
  const [refresh, setRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const scrollExpandedRowIntoView = (rowId: string) => {
    const ref = rowRefs.current[rowId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "id",
    "srNo",
    "name",
    "roleCode",
    "description",
    "startTime",
    "endTime",
    "createdAt",
    "status",
    "createdBy",
    "approvedBy",
    "approveddate",
    "action",
    "expand",
  ]);

  useEffect(() => {
    setLoading(true);
    nos
      .post<AllPendingRolesResponse>(`${apiBaseUrl}/uam/roles/page-data`)
      .then((response) => {
        const roleData = response.data?.roleData ?? [];
        setData(roleData.map(mapRole));
      })
      .catch(() => notify("Network error. Please try again.", "error"))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleDelete = async (id: number, name: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    const selectRowRole = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.name);

    const selectedRoleObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedRoleObjs
        : [data.find((item) => item.id === id)].filter(Boolean);

    if (
      rowsToCheck.some(
        (row) =>
          row &&
          typeof row.status === "string" &&
          row.status.toUpperCase() === "PENDING_DELETE_APPROVAL"
      )
    ) {
      notify(
        "You cannot delete a role that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectRowRole.join(", ") : name
      } selected transaction(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      id: selectedRows.length > 0 ? selectedRows[0] : id,
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<AllPendingRolesResponse>(
        `${apiBaseUrl}/uam/roles/delete-role`,
        payload
      );

      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            row.id === payload.id
              ? { ...row, status: "PENDING_DELETE_APPROVAL" }
              : row
          )
        );
        notify(`${name} Role deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  const columns = useMemo<ColumnDef<PendingRoles>[]>(
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
        accessorKey: "srNo",
        header: "Sr No",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "roleCode",
        header: "Role Code",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "startTime",
        header: "Start Time",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <span>{value ? formatToHHMM(value) : "—"}</span>;
        },
      },
      {
        accessorKey: "endTime",
        header: "End Time",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <span>{value ? formatToHHMM(value) : "—"}</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
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
                value.toUpperCase()
              )}`}
            >
              {formatted}
            </span>
          );
        },
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "approvedBy",
        header: "Approved By",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "approveddate",
        header: "Approved Date",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <span>{value ? formatToDDMMYY_HHMM(value) : "—"}</span>;
        },
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
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                exportToExcel([row.original], `Role_${row.original.id}`)
              }
              className="p-1.5 hover:bg-primary-xl rounded transition-colors"
            >
              <Download className="w-4 h-4 text-primary" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id, row.original.name)}
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
      result = result.filter((item) => item.status === statusFilter);
    }

    if (dateRange[0].startDate && dateRange[0].endDate) {
      const start = new Date(dateRange[0].startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange[0].endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((item) => {
        if (!item.createdAt) return false;
        const createdDate = new Date(item.createdAt);
        if (isNaN(createdDate.getTime())) return false;
        return createdDate >= start && createdDate <= end;
      });
    }

    return result;
  }, [data, searchTerm, statusFilter, dateRange]);

//   const handleEditChange = (
//     field: keyof PendingRoles,
//     value: PendingRoles[keyof PendingRoles]
//   ) => {
//     setEditValues((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleCancelEdit = () => {
//     setIsEditing(false);
//     setEditValues({} as PendingRoles);
//   };

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.status) options.add(item.status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

//   const handleEditToggle = async (row: Row<PendingRoles>) => {
//     if (isEditing) {
//       const changedFields = (row.original, editValues);
//       if (Object.keys(changedFields).length === 0) {
//         setIsEditing(false);
//         return;
//       }

//       const result = await confirm(
//         `Are you sure you want to approve ${row.original.name}`,
//         {
//           input: true,
//           inputLabel: "Approve Comments (optional)",
//           inputPlaceholder: "Enter comments...",
//         }
//       );
//       if (!result.confirmed) return;

//       const { id, ...restEditValues } = editValues;
//       const payload = {
//         id: row.original.id,
//         ...restEditValues,
//         reason: result.inputValue || "",
//       };

//       try {
//         setIsSaving(true);
//         const response = await nos.post<Update>(
//           `${apiBaseUrl}/uam/roles/update-role`,
//           payload
//         );

//         if (response.data.results[0].success) {
//           setData((prev) =>
//             prev.map((item, idx) =>
//               idx === row.index ? { ...item, ...editValues } : item
//             )
//           );
//           setIsEditing(false);
//           notify("Role updated successfully!", "success");
//         } else {
//           notify(
//             response.data?.results?.[0]?.error || "Update failed",
//             "error"
//           );
//         }
//       } catch (error) {
//         notify("An error occurred while updating the role.", "error");
//         return;
//       } finally {
//         setIsSaving(false);
//         setEditValues({} as PendingRoles);
//       }
//     } else {
//       const initialValues = { ...row.original };
//       setEditValues(initialValues);
//       setIsEditing(true);
//     }
//   };

  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    const selectRowRole = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.name);

    if (selectedRows.length === 0) {
      notify("Please select at least one Role to approve.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectRowRole.join(", ") : "this role"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      // user_id: currentUserId,
      roleIds: selectedRows as number[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<AllPendingRolesResponse>(
        `${apiBaseUrl}/uam/roles/approve-multiple-roles`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.filter((row) => {
            if (selectedRows.includes(row.id)) {
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
        setRefresh(!refresh);
        notify("Role approved successfully.", "success");
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
      .rows.map((row) => row.original.id);

    const selectRowRole = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.name);

    if (selectedRows.length === 0) {
      notify("Please select at least one Role to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectRowRole.join(", ") : "this role"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      roleIds: selectedRows as number[],
      comment: result.inputValue || "",
    };
    try {
      const response = await nos.post<AllPendingRolesResponse>(
        `${apiBaseUrl}/uam/roles/reject-multiple-roles`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.id) ? { ...row, status: "REJECTED" } : row
          )
        );
        setRefresh(!refresh);

        notify("Role rejected successfully.", "success");
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

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
        <DateRangeFilter
          label="Created Date"
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Row 2: Search */}
      <div className="flex flex-wrap px-1  items-center justify-between gap-4 pt-6">
        {/* Left Side: Download + Refresh */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
            title="Download All Roles"
            onClick={() => exportToExcel(filteredData, "All_Roles")}
          >
            <Download className="flex items-center justify-center text-primary group-hover:text-white" />
          </button>

          <button
            type="button"
            className="text-primary group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
            title="Refresh"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="flex items-center justify-center text-primary group-hover:text-white" />
          </button>
        </div>

        {/* Right Side: Search + Approve + Reject */}
        <div className="flex items-center gap-4">
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

          <div className="flex items-center gap-2">
            <Button onClick={handleApprove}>Approve</Button>
            <Button onClick={handleReject} color="Green">
              Reject
            </Button>
          </div>
        </div>
      </div>

      <NyneOSTable2<PendingRoles>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
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

export default PendingRoles;
