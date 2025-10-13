import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";
// import axios from "axios";
// import { Download } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Draggable } from "../../../components/table/Draggable";
import { Droppable } from "../../../components/table/Droppable";
import Button from "../../../components/ui/Button";
import Pagination from "../../../components/table/Pagination";
// import { exportToExcel } from "../../../components/utils/ExportToExcel";
import nos from "../../../utils/nos";
// const cURLHOST = "https://cimplrcorpsaas-go-ci.onrender.com";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Types
// interface PermissionData {
//   srNo?: number;
//   RoleName: string;
//   UpdatedBy: string;
//   UpdatedDate: string;
//   Status: string;
// }

interface PermissionData {
  roleName: string;
  status: string;
}


type TabVisibility = {
  // add:boolean,
  // edit:boolean,
  approve: boolean;
  // approve:boolean,
  // reject:boolean,
  reject: boolean;
  // edit: boolean;
  // upload:boolean,
};

const TableContent: React.FC<{
  data: PermissionData[];
  searchTerm: string;
  showSelected: boolean;
  isPending?: boolean;
  onSearchChange: (term: string) => void;
}> = ({
  data,
  searchTerm,
  showSelected,
  isPending = false,
  onSearchChange,
}) => {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  // Track selected rows
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  // const roleName = localStorage.getItem("userRole");

  const [Visibility, setVisibility] = useState<TabVisibility>({
    approve: true,
    reject: true,
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await nos.post<any>(
          `${apiBaseUrl}/uam/permissions/permissions-json`
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["permissions"]?.tabs;

        if (userTabs) {
          setVisibility({
            approve: userTabs.pendingTab.showApproveButton || false,
            reject: userTabs.pendingTab.showRejectButton || false,
            // pendingTab: userTabs?.pendingTab?.hasAccess || false,
          });
        }
      } catch (error) {
        //  console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, []);

  const filteredData = useMemo(() => {
    let statusFilteredData;

    if (isPending) {
      // If isPending is true, show only non-approved items
      statusFilteredData = data.filter(
        (item) => item.status && item.status.toLowerCase() !== "approved"
      );
    } else {
      // If isPending is false, show everything but prioritize pending over approved for duplicate roleNames
      const roleNameMap = new Map<string, PermissionData>();

      // First pass: collect all items, giving priority to non-approved items
      data.forEach((item) => {
        const roleName = item.roleName;
        const currentItem = roleNameMap.get(roleName);

        if (!currentItem) {
          // If no item exists for this roleName, add it
          roleNameMap.set(roleName, item);
        } else {
          // If item exists, prioritize non-approved over approved
          const currentIsApproved =
            currentItem.status?.toLowerCase() === "approved";
          const newIsApproved = item.status?.toLowerCase() === "approved";

          if (currentIsApproved && !newIsApproved) {
            // Replace approved with non-approved
            roleNameMap.set(roleName, item);
          }
        }
      });

      statusFilteredData = Array.from(roleNameMap.values());
    }

    // Then apply search filter if search term exists
    if (!searchTerm || !searchTerm.trim()) return statusFilteredData;
    const lowerSearch = searchTerm.toLowerCase().trim();
    return statusFilteredData.filter((user) =>
      Object.values(user)
        .flatMap((value) =>
          typeof value === "object" && value !== null
            ? Object.values(value)
            : [value]
        )
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(lowerSearch))
    );
  }, [searchTerm, data, isPending]);

  const columns = useMemo<ColumnDef<PermissionData>[]>(() => {
    const baseColumns: ColumnDef<PermissionData>[] = [
      {
        accessorKey: "srNo",
        header: "Sr No",
        cell: ({ row }) => (
          <span className="text-secondary-text">{row.index + 1}</span>
        ),
      },
      {
        accessorKey: "roleName",
        header: "roleName",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },

      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue() as string;

          const statusColors: Record<string, string> = {
            approved: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            "delete-approval": "bg-orange-100 text-orange-800",
            "awaiting-approval": "bg-yellow-100 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
            inactive: "bg-gray-200 text-gray-700",
          };

          const normalizedStatus = status.toLowerCase();

          const toPascalCase = (str: string) =>
            str.replace(
              /\w+/g,
              (word) => word[0].toUpperCase() + word.substring(1).toLowerCase()
            );

          const displayStatus = toPascalCase(status);

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[normalizedStatus] || "bg-gray-100 text-gray-800"
              }`}
            >
              {displayStatus}
            </span>
          );
        },
      },
    ];

    if (showSelected) {
      baseColumns.unshift({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-start">
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-start">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
          </div>
        ),
      });
    }

    return baseColumns;
  }, [showSelected]);

  const defaultVisibility: Record<string, boolean> = {
    select: true,
    srNo: true,
    RoleName: true,
    // UpdatedBy: true,
    // UpdatedDate: true,
    Status: true,
  };

  const [columnVisibility, setColumnVisibility] = useState(defaultVisibility);

  const table = useReactTable({
    data: filteredData,
    columns,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 10, // Set default page size
      },
    },
    state: {
      columnOrder,
      columnVisibility,
    },
  });

  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  const { notify } = useNotification();

  // Update selectedRows when selection changes
  useEffect(() => {
    if (table) {
      const selected = table.getSelectedRowModel().rows.map((row) => {
        // Use roleName as unique identifier
        return row.original.roleName;
      });
      setSelectedRows(selected);
    }
  }, [table.getSelectedRowModel().rows]);

  const handleApprove = async () => {
    if (selectedRows.length === 0) {
      // alert("Please select at least one role to approve.");
      notify("Please select at least one role to approve.", "warning");
      return;
    }
    try {
      for (const roleName of selectedRows) {
        const response = await nos.post<any>(
          `${apiBaseUrl}/uam/permissions/status`,
          {
            roleName,
            status: "Approved",
          }
        );
        if(response.data.sucess){
          // console.log("Approve Response for", roleName, response.data);

        }
      }
      // alert("Selected role permissions approved successfully.");
      notify("Selected role permissions approved successfully.", "success");
      // window.location.reload();
    } catch (error) {
      //  console.error("Error approving role permissions:", error);
      // alert("Failed to approve role permissions.");
      notify("Failed to approve role permissions.", "error");
    }
  };

  const handleReject = async () => {
    if (selectedRows.length === 0) {
      // alert("Please select at least one role to reject.");
      notify("Please select at least one role to reject.", "warning");
      return;
    }
    try {
      for (const roleName of selectedRows) {
        const response = await nos.post<any>(
          `${apiBaseUrl}/uam/permissions/status`,
          {
            roleName,
            status: "Rejected",
          }
        );
        if(response.data.success){}
        //  console.log("Reject Response for", roleName, response.data);
      }
      // alert("Selected role permissions rejected successfully.");
      notify("Selected role permissions rejected successfully.", "success");
      // window.location.reload();
    } catch (error) {
      //  console.error("Error rejecting role permissions:", error);
      // alert("Failed to reject role permissions.");
      notify("Failed to reject role permissions.", "error");
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Controls - Two rows on mobile, one row on desktop */}
      <div className="mt-14 flex flex-col gap-3 w-full">
        <div className="flex justify-end w-full">
          <div className="flex items-center gap-4 w-2xl justify-end">
            {/* <button
              type="button"
              className="text-primary group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
              title="Download All Roles"
              onClick={() => exportToExcel(filteredData, "All_Roles")}
            >
              <Download className="flex items-center justify-center text-primary group-hover:text-white" />
            </button> */}

            <button
              type="button"
              className="text-primary group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
              title="Refresh"
              onClick={() => window.location.reload()}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                className="accent-primary"
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>

            <form
              className="relative flex items-center w-full md:w-[220px]"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="text"
                placeholder="Search"
                className="pl-4 pr-10 py-2 text-secondary-text bg-secondary-color-lt border border-border rounded-lg focus:outline-none w-full hover:border hover:border-primary"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
                tabIndex={-1}
                aria-label="Search"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 accent-primary"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {isPending && (
          <div className="flex justify-end w-full">
            <div className="flex items-center gap-2 w-2xl justify-end">
              {Visibility.approve && (
                <Button onClick={handleApprove}>Approve</Button>
              )}
              {Visibility.reject && (
                <Button color="Green" onClick={handleReject}>
                  Reject
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table with DndContext properly positioned */}
      <div className="w-full overflow-x-auto">
        <div className=" shadow-lg border border-border">
          <DndContext onDragEnd={handleDragEnd}>
            <table className="min-w-full">
              <colgroup>
                {table.getVisibleLeafColumns().map((col) => (
                  <col key={col.id} className="font-medium min-w-[150px]" />
                ))}
              </colgroup>
              <thead className="bg-secondary-color rounded-xl">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const isFirst = index === 0;
                      const isLast = index === headerGroup.headers.length - 1;
                      return (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
                          style={{ width: header.getSize() }}
                        >
                          <Droppable id={header.column.id}>
                            {isFirst || isLast ? (
                              <div className="px-1">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </div>
                            ) : (
                              <Draggable id={header.column.id}>
                                <div className="cursor-move border-border text-header-color hover:bg-primary-lg rounded px-1 py-1 transition duration-150 ease-in-out">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </div>
                              </Draggable>
                            )}
                          </Droppable>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y ">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-primary"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-xl font-medium text-primary mb-1">
                          No users found
                        </p>
                        <p className="text-md font-medium text-primary">
                          There are no users to display at the moment.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        row.index % 2 === 0
                          ? "bg-primary-md"
                          : "bg-secondary-color-lt"
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>

      {/* Pagination Controls */}
      <Pagination
        table={table}
        totalItems={table.getFilteredRowModel().rows.length}
        // currentPageItems={table.getRowModel().rows.length}
        startIndex={
          table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
          1
        }
        endIndex={Math.min(
          (table.getState().pagination.pageIndex + 1) *
            table.getState().pagination.pageSize,
          table.getFilteredRowModel().rows.length
        )}
      />
    </div>
  );
};

export default TableContent;
