import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type ColumnDef,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { Search } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import Pagination from "../../../components/table/Pagination.tsx";
import nos from "../../../utils/nos.tsx";
import SimpleTable from "../../../components/table/Table.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import { useLocation } from "react-router-dom";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// ---- Types ----
export interface FundPlanDetailsResponse {
  plan_info: {
    plan_id: string;
    entity_name?: string;
    horizon?: number;
  };
  groups: GroupRow[];
}

type APIRes = {
  success: boolean;
  rows: FundPlanDetailsResponse;
};

type GroupRow = {
  group_id: string;
  direction: string;
  currency: string;
  primary_key: string;
  primary_value: string;
  total_amount: number;
};

const AllFundPlanningRow: React.FC = () => {
  const location = useLocation();
  const plan_id = location.state?.plan_id; // <-- get plan_id from navigation state

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    group_id: true,
    direction: true,
    currency: true,
    primary_key: true,
    primary_value: true,
    total_amount: true,
  });

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "group_id",
    "direction",
    "currency",
    "primary_key",
    "primary_value",
    "total_amount",
  ]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<GroupRow[]>([]);
  const [planInfo, setPlanInfo] = useState<
    FundPlanDetailsResponse["plan_info"] | null
  >(null);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const { notify } = useNotification();

  // ---- Fetch groups ----
  useEffect(() => {
    setLoading(true);
    nos
      .post<APIRes>(
        `${apiBaseUrl}/cash/fund-planning/details`,
        { plan_id }
      )
      .then((response) => {
        if (response.data.success) {
          setData(response.data.rows.groups);
          setPlanInfo(response.data.rows.plan_info); // <-- set plan_info here
          setLoading(false);
        } else {
          notify("No groups found", "warning");
          setLoading(false);
        }
      })
      .catch(() => {
        notify("Network error. Please try again.", "error");
        setLoading(false);
      });
  }, []);

  // ---- Filtering ----
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
  }, [data, searchTerm]);

  // ---- Columns ----
  const columns = useMemo<ColumnDef<GroupRow>[]>(
    () => [
      { accessorKey: "group_id", header: "Group ID" },
      { accessorKey: "direction", header: "Direction" },
      { accessorKey: "currency", header: "Currency" },
      { accessorKey: "primary_key", header: "Primary Key" },
      { accessorKey: "primary_value", header: "Primary Value" },
      { accessorKey: "total_amount", header: "Total Amount" },
    ],
    []
  );

  // ---- Table ----
  const table = useReactTable({
    data: filteredData,
    columns,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnOrder,
      columnVisibility,
      sorting,
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    enableMultiSort: true,
  });

  // ---- Render ----
  return (
    <Layout title="Fund Planning Detail">
      <div className="w-full space-y-4">
        {/* Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
          
        </div>

        <SimpleTable<GroupRow> table={table} columns={columns} />

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

export default AllFundPlanningRow;
