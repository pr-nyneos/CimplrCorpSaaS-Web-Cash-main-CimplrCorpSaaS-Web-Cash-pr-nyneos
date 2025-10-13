import React, {  useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  // type Row,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import Layout from "../../../components/layout/Layout.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
// import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import { Search } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
// import type { UpdateRow } from "../../../types/type.ts";

// import { sections } from "./config";
import type { CounterpartyBankRow } from "../../../types/masterType";
import nos from "../../../utils/nos.tsx";
import Button from "../../../components/ui/Button.tsx";
import Pagination from "../../../components/table/Pagination.tsx";
import { useLocation } from "react-router-dom";
import NyneOSTable2 from "../../cashDashboard/NyneOSTable2.tsx";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type CounterpartyResponse = {
  success: boolean;
  rows?: CounterpartyBankRow[];
  error: string;
};
// Mock data for demonstration

const relationshipOptions = ["Current", "Saving", "CC", "OD"];
const statusOptions = ["Active", "Inactive"];

const AllCounterpartyBankRow: React.FC = () => {
  const location = useLocation();
  // Access state like this:
  const { counterparty_id } = location.state || {};

  // Now you can use counterparty_id and edit in your component

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select", // UI-only
    "bank_id",
    "bank",
    "branch",
    "account",
    "swift",
    "rel",
    "currency",
    "category",
    "country",
    "status",
    // "processing_status",
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [, setIsSaving] = useState(false);
  const [, setLoading] = useState(false);
  const [statusFilter, ] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [data, setData] = useState<CounterpartyBankRow[]>([]);

  // const navigate = useNavigate();

  // const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // const scrollExpandedRowIntoView = (rowId: string) => {
  //   const ref = rowRefs.current[rowId];
  //   if (ref) {
  //     ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
  //   }
  // };
  const visibility = useAllTabPermissions("counterparty-master");

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

    return result;
  }, [data, searchTerm, statusFilter]);

  const { notify } = useNotification();

  useEffect(() => {
    setLoading(true);
    nos
      .post<CounterpartyResponse>(
        `${apiBaseUrl}/master/v2/counterparty/banks`,
        { counterparty_id }
      )
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

  const handleEditChange = (rowIndex: number, field: string, value: any) => {
    setEditValues((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Transform editValues to the required array format
      const updates = Object.entries(editValues).map(([rowIndex, fields]) => {
        const row = data[Number(rowIndex)];
        return {
          bank_id: row.bank_id,
          fields,
          reason: fields.reason || "", // Add a reason if you collect it from UI, else empty
        };
      });

      await nos.post(`${apiBaseUrl}/master/v2/counterparty/banks/updatebulk`, {
        rows: updates,
      });

      setIsEditing(false);
      setEditValues({});
      notify("Saved successfully", "success");
    } catch (err) {
      notify("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<CounterpartyBankRow>[]>(
    () => [
      // Select
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
      { accessorKey: "bank_id", header: "Bank ID" },
      {
        accessorKey: "bank",
        header: "Bank",
        cell: ({ row }) => row.original.bank, // always plain text
      },
      {
        accessorKey: "branch",
        header: "Branch",
        cell: ({ row }) =>
          isEditing ? (
            <div>
              <input
                className="w-24 px-2 py-1 rounded text-sm text-secondary-text bg-secondary-color border border-border outline-none"
                value={editValues[row.index]?.branch ?? row.original.branch}
                onChange={(e) =>
                  handleEditChange(row.index, "branch", e.target.value)
                }
              />
              {row.original.old_branch && (
                <span className="block text-xs text-secondary-text-dark mt-1">
                  Old: {row.original.old_branch}
                </span>
              )}
            </div>
          ) : (
            row.original.branch
          ),
      },
      {
        accessorKey: "account",
        header: "Account",
        cell: ({ row }) =>
          isEditing ? (
            <div>
              <input
                className="w-24 px-2 py-1 rounded text-sm text-secondary-text bg-secondary-color border border-border outline-none"
                value={editValues[row.index]?.account ?? row.original.account}
                onChange={(e) =>
                  handleEditChange(row.index, "account", e.target.value)
                }
              />
              {row.original.old_account && (
                <span className="block text-xs text-secondary-text-dark mt-1">
                  Old: {row.original.old_account}
                </span>
              )}
            </div>
          ) : (
            row.original.account
          ),
      },
      {
        accessorKey: "swift",
        header: "SWIFT",
        cell: ({ row }) =>
          isEditing ? (
            <div>
              <input
                className="w-24 px-2 py-1 rounded text-sm text-secondary-text bg-secondary-color border border-border outline-none"
                value={editValues[row.index]?.swift ?? row.original.swift}
                onChange={(e) =>
                  handleEditChange(row.index, "swift", e.target.value)
                }
              />
              {row.original.old_swift && (
                <span className="block text-xs text-secondary-text-dark mt-1">
                  Old: {row.original.old_swift}
                </span>
              )}
            </div>
          ) : (
            row.original.swift
          ),
      },
      {
        accessorKey: "rel",
        header: "Relationship",
        cell: ({ row }) =>
          isEditing ? (
            <div>
              <select
                className="w-24 px-2 py-1 rounded text-sm text-secondary-text bg-secondary-color border border-border outline-none"
                value={editValues[row.index]?.rel ?? row.original.rel}
                onChange={(e) =>
                  handleEditChange(row.index, "rel", e.target.value)
                }
              >
                <option value="" hidden>
                  Choose...
                </option>
                {relationshipOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {row.original.old_rel && (
                <span className="block text-xs text-secondary-text-dark mt-1">
                  Old: {row.original.old_rel}
                </span>
              )}
            </div>
          ) : (
            row.original.rel
          ),
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ row }) =>
          isEditing ? (
            <input
              className="border rounded px-2 py-1 w-full h-[37px]"
              value={editValues[row.index]?.currency ?? row.original.currency}
              onChange={(e) =>
                handleEditChange(row.index, "currency", e.target.value)
              }
            />
          ) : (
            row.original.currency
          ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => row.original.category, // always plain text
      },
      {
        accessorKey: "country",
        header: "Country",
        cell: ({ row }) => row.original.country, // always plain text
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          isEditing ? (
            <div>
              <select
                className="w-24 px-2 py-1 rounded text-sm text-secondary-text bg-secondary-color border border-border outline-none"
                value={editValues[row.index]?.status ?? row.original.status}
                onChange={(e) =>
                  handleEditChange(row.index, "status", e.target.value)
                }
              >
                <option value="" hidden>
                  Choose...
                </option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {row.original.old_status && (
                <span className="block text-xs text-secondary-text-dark mt-1">
                  Old: {row.original.old_status}
                </span>
              )}
            </div>
          ) : (
            row.original.status
          ),
      },
    ],
    [isEditing, editValues]
  );

  const table = useReactTable({
    data: filteredData, // <-- use your stateful data here
    columns,
    enableRowSelection: true,
    onRowSelectionChange: setSelectedRowIds,
    onColumnOrderChange: setColumnOrder,
    // onColumnVisibilityChange: setColumnVisibility,
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
      //   columnVisibility,
      sorting,
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    enableMultiSort: true,
  });

  return (
    <Layout title="Counterparty Master">
      <div className="w-full space-y-4">
        <div className="-mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          {/* <div className="flex flex-col">
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
        </div> */}
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
                {visibility.edit && !isEditing ? (
                  <Button color="Green" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      color="Green"
                      //   loading={isSaving}
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                    <Button
                      color="Fade"
                      //   variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditValues({});
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <NyneOSTable2<CounterpartyBankRow>
          table={table}
          columns={columns}
          nonDraggableColumns={[]}
          nonSortingColumns={[]}
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
    </Layout>
  );
};

export default AllCounterpartyBankRow;
