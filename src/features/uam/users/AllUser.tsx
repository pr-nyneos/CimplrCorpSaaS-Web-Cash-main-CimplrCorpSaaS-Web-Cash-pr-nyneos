
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
import NyneOSTable from "../../../components/table/NyneOSTable";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import Pagination from "../../../components/table/Pagination";
import type { Update } from "../../../types/type.ts";
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
  type Row,
} from "@tanstack/react-table";

import nos from "../../../utils/nos.tsx";
import { exportToExcel } from "../../../utils/exportToExcel.ts";
import { formatToDDMMYY_HHMM } from "../../../utils/formatToDDMMYY_HHMM.ts";


const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type AllUsersResponse = {
  permissions: any;
  users: AllUsers[];
  success: boolean;
  error: string;
};

type AllUsers = {
  id: number | string;
  sr_no: string;
  authentication_type: string;
  employee_name: string;
  username_or_employee_id: string;
  email: string;
  mobile: string;
  address: string;
  business_unit_name: string;
  created_by: string;
  created_at: string;
  status_change_request: string;
  status: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  expand: true,
  action: true,
  id: false,
  sr_no: true,
  authentication_type: true,
  employee_name: true,
  username_or_employee_id: true,
  email: true,
  mobile: true,
  address: false,
  business_unit_name: true,
  created_by: true,
  created_at: true,
  status_change_request: false,
  status: true,
};

const mapUser = (item: any): AllUsers => ({
  id: item.id,
  sr_no: item.sr_no ?? item.id,
  authentication_type: item.authentication_type,
  employee_name: item.employee_name,
  username_or_employee_id: item.username_or_employee_id,
  email: item.email,
  mobile: item.mobile,
  address: item.address,
  business_unit_name: item.business_unit_name,
  created_by: item.created_by,
  created_at: item.created_at,
  status_change_request: item.status_change_request || "N/A",
  status: item.status,
});

const AllUsers = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const { notify, confirm } = useNotification();
  const [data, setData] = useState<AllUsers[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<AllUsers>({} as AllUsers);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
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
    "sr_no",
    "authentication_type",
    "employee_name",
    "username_or_employee_id",
    "email",
    "mobile",
    "address",
    "business_unit_name",
    "created_by",
    "created_at",
    "status_change_request",
    "status",
    "action",
    "expand",
  ]);

  useEffect(() => {
    setLoading(true);
    nos
      .post<AllUsersResponse>(`${apiBaseUrl}/uam/users/get-users`)
      .then((response) => {
        const userData = response.data?.users ?? [];
        setData(userData.map(mapUser));
      })
      .catch(() => notify("Network error. Please try again.", "error"))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleDelete = async (id: number | string, employeeName: string) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    const selectRowUser = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.employee_name);

    const selectedUserObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToCheck =
      selectedRows.length > 0
        ? selectedUserObjs
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
        "You cannot delete a user that is already pending delete approval.",
        "warning"
      );
      return;
    }

    const result = await confirm(
      `Are you sure you want to delete ${
        selectedRows.length > 0 ? selectRowUser.join(", ") : employeeName
      } selected user(s)?`,
      {
        input: true,
        inputLabel: "Reason for deletion",
        inputPlaceholder: "Enter reason...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      id: String(selectedRows.length > 0 ? selectedRows[0] : id),
      reason: result.inputValue || "",
    };

    try {
      const response = await nos.post<AllUsersResponse>(
        `${apiBaseUrl}/uam/users/delete-user`,
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
        notify(`${employeeName} User deleted.`, "success");
      } else {
        notify(response.data.error || "Delete failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

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
        if (!item.created_at) return false;
        const createdDate = new Date(item.created_at);
        if (isNaN(createdDate.getTime())) return false;
        return createdDate >= start && createdDate <= end;
      });
    }

    return result;
  }, [data, searchTerm, statusFilter, dateRange]);

  const handleEditChange = (
    field: keyof AllUsers,
    value: AllUsers[keyof AllUsers]
  ) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValues({} as AllUsers);
  };

//   const getChangedFields = (original: AllUsers, edited: AllUsers) => {
//     const changes: Partial<AllUsers> = {};
//     for (const key in edited) {
//       if (original[key as keyof AllUsers] !== edited[key as keyof AllUsers]) {
//         (changes as any)[key] = edited[key as keyof AllUsers];
//       }
//     }
//     return changes;
//   };

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.status) options.add(item.status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

  const handleEditToggle = async (row: Row<AllUsers>) => {
    if (isEditing) {
      const changedFields = (row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      const result = await confirm(
        `Are you sure you want to approve ${row.original.employee_name}`,
        {
          input: true,
          inputLabel: "Approve Comments (optional)",
          inputPlaceholder: "Enter comments...",
        }
      );
      if (!result.confirmed) return;

      const { id, ...restEditValues } = editValues;
      const payload = {
        id: String(row.original.id),
        ...restEditValues,
        reason: result.inputValue || "",
      };

      try {
        setIsSaving(true);
        const response = await nos.post<Update>(
          `${apiBaseUrl}/uam/users/update-user`,
          payload
        );
        
        if (response.data.success) {
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...editValues } : item
            )
          );
          setIsEditing(false);
          notify("User updated successfully!", "success");
        } else {
          notify(
            response.data?.results?.[0]?.error || "Update failed",
            "error"
          );
        }
      } catch (error) {
        notify("An error occurred while updating the user.", "error");
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as AllUsers);
      }
    } else {
      const initialValues = { ...row.original };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  const handleApprove = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    const selectRowUser = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.employee_name);

    if (selectedRows.length === 0) {
      notify("Please select at least one User to approve.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to approve ${
        selectedRows.length > 0 ? selectRowUser.join(", ") : "this user"
      }?`,
      {
        input: true,
        inputLabel: "Approve Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      ids: selectedRows.map(id => String(id)),
      approval_comment: result.inputValue || "No comment provided",
      approved_by: "1", // or get from current user context
    };
    try {
      const response = await nos.post<AllUsersResponse>(
        `${apiBaseUrl}/uam/users/approve-multiple-users`,
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
        notify("User approved successfully.", "success");
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

    const selectRowUser = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.employee_name);

    if (selectedRows.length === 0) {
      notify("Please select at least one User to reject.", "warning");
      return;
    }
    const result = await confirm(
      `Are you sure you want to reject ${
        selectedRows.length > 0 ? selectRowUser.join(", ") : "this user"
      }?`,
      {
        input: true,
        inputLabel: "Reject Comments (optional)",
        inputPlaceholder: "Enter comments...",
      }
    );
    if (!result.confirmed) return;

    const payload = {
      ids: selectedRows.map(id => String(id)),
      rejection_comment: result.inputValue || "No comment provided",
      rejected_by: "1", // or get from current user context
    };
    try {
      const response = await nos.post<AllUsersResponse>(
        `${apiBaseUrl}/uam/users/reject-multiple-users`,
        payload
      );
      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            selectedRows.includes(row.id) ? { ...row, status: "REJECTED" } : row
          )
        );
        setRefresh(!refresh);

        notify("User rejected successfully.", "success");
      } else {
        notify(response.data.error || "Rejection failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };
      const columns = useMemo<ColumnDef<AllUsers>[]>(
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
            accessorKey: "sr_no",
            header: "Sr No",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "authentication_type",
            header: "Auth Type",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "employee_name",
            header: "Employee Name",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "username_or_employee_id",
            header: "Username",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "email",
            header: "Email",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "mobile",
            header: "Mobile",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "address",
            header: "Address",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "business_unit_name",
            header: "Business Unit",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "created_by",
            header: "Created By",
            cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
          },
          {
            accessorKey: "created_at",
            header: "Created Date",
            cell: ({ getValue }) => {
              const value = getValue() as string;
              if (!value) return "—";
              return <span>{formatToDDMMYY_HHMM(value)}</span>;
            },
          },
          {
            accessorKey: "status_change_request",
            header: "Status Change Request",
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
                    exportToExcel([row.original], `User_${row.original.id}`)
                  }
                  className="p-1.5 hover:bg-primary-xl rounded transition-colors"
                >
                  <Download className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={() => handleDelete(row.original.id, row.original.employee_name)}
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
            title="Download All Users"
            onClick={() => exportToExcel(filteredData, "All_Users")}
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

      <NyneOSTable<AllUsers>
        table={table}
        columns={columns}
        nonDraggableColumns={["expand", "action", "select"]}
        nonSortingColumns={["expand", "action", "select"]}
        sections={sections} 
        isEditing={true}
        isSaving={isSaving}
        loading={loading}
        editValues={editValues}
        onChange={handleEditChange}
        column={`grid grid-cols-6`}
        handleCancelEdit={handleCancelEdit}
        handleForwardEditToggle={handleEditToggle}
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

export default AllUsers;
