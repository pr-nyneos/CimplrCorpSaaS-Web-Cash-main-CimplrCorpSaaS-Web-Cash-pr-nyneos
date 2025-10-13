import { useMemo, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
//   type Row,
  type ColumnDef,
} from "@tanstack/react-table";
// import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import Button from "../../../../components/ui/Button";
import nos from "../../../../utils/nos.tsx";
import { useNotification } from "../../../../app/providers/NotificationProvider/Notification.tsx";
import Pagination from "../../../../components/table/Pagination";
import { getProcessingStatusColor } from "../../../../utils/colorCode";
// import { formatToDDMMYY_HHMM } from "../../../../utils/formatToDDMMYY_HHMM";
import Layout from "../../../../components/layout/Layout.tsx";
import NyneOSTableWithOldVal, {
  InlineEditableCell,
} from "../../../../components/table/NyneOSTableWithOldVal.tsx";
import CustomSelect from "../../../../components/ui/SearchSelect.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type HedgingProposalResponse = {
  proposals: HedgingProposal[];
  success: boolean;
};

type HedgingProposalOperationResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

export type HedgingProposal = {
  business_unit: string;
  comments: string | null;
  contributing_header_ids: string;
  currency: string;
  exposure_type: string;
  hedge_month1: number;
  hedge_month2: number;
  hedge_month3: number;
  hedge_month4: number;
  hedge_month4to6: number;
  hedge_month6plus: number;
  old_hedge_month1: number;
  old_hedge_month2: number;
  old_hedge_month3: number;
  old_hedge_month4: number;
  old_hedge_month4to6: number;
  old_hedge_month6plus: number;
  status: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  exposure_type: true,
  business_unit: true,
  currency: true,
  hedge_month1: true,
  hedge_month2: true,
  hedge_month3: true,
  hedge_month4to6: true,
  hedge_month6plus: true,
  status: true,
};

const COLUMNS = [
  "select",
  "exposure_type",
  "business_unit",
  "currency",
  "hedge_month1",
  "hedge_month2",
  "hedge_month3",
  "hedge_month4to6",
  "hedge_month6plus",
  "status",
];

const HedgingProposal = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>(COLUMNS);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [data, setData] = useState<HedgingProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitTypeFilter, setSubmitTypeFilter] = useState<string>("");
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("");
  const { notify, } = useNotification();

  const filteredData = useMemo(() => {
    let result = [...data];

    if (submitTypeFilter) {
      result = result.filter((item) => item.status === submitTypeFilter);
    }

    if (businessUnitFilter) {
      result = result.filter((item) => item.business_unit === businessUnitFilter);
    }

    if (currencyFilter) {
      result = result.filter((item) => item.currency === currencyFilter);
    }

    return result;
  }, [data, submitTypeFilter, businessUnitFilter, currencyFilter]);

  const submitTypeOptions = useMemo(() => {
    const uniqueStatuses = [...new Set(data.map(item => item.status))].filter(Boolean);
    return uniqueStatuses.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    }));
  }, [data]);

  const businessUnitOptions = useMemo(() => {
    const uniqueUnits = [...new Set(data.map(item => item.business_unit))].filter(Boolean);
    return uniqueUnits.map(unit => ({ value: unit, label: unit }));
  }, [data]);

  const currencyOptions = useMemo(() => {
    const uniqueCurrencies = [...new Set(data.map(item => item.currency))].filter(Boolean);
    return uniqueCurrencies.map(currency => ({ value: currency, label: currency }));
  }, [data]);

  const nonDraggableColumns = ["select"];
  const nonSortingColumns = ["select"];

  const handleUpdate = async (
    rowId: any,
    updates: Partial<HedgingProposal>
  ) => {
    try {
      const rowIndex = data.findIndex(
        (item) => item.contributing_header_ids === rowId
      );
      if (rowIndex === -1) return;

      setData((prev) =>
        prev.map((item, idx) =>
          idx === rowIndex ? { ...item, ...updates } : item
        )
      );

    } catch (_error) {
    }
  };

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        proposals: data.map((item) => ({
          contributing_header_ids: item.contributing_header_ids,
          hedge_month1: item.hedge_month1,
          hedge_month2: item.hedge_month2,
          hedge_month3: item.hedge_month3,
          hedge_month4to6: item.hedge_month4to6,
          hedge_month6plus: item.hedge_month6plus,
        })),
      };

      const response = await nos.post<HedgingProposalOperationResponse>(
        `${apiBaseUrl}/fx/hedging-proposals/save`,
        payload
      );

      if (response.data.success) {
        notify("Hedging proposals saved successfully!", "success");
      } else {
        notify(response.data.error || "Save failed", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset function
//   const handleReset = () => {
//     setData((prev) =>
//       prev.map((item) => ({
//         ...item,
//         hedge_month1: item.old_hedge_month1,
//         hedge_month2: item.old_hedge_month2,
//         hedge_month3: item.old_hedge_month3,
//         hedge_month4to6: item.old_hedge_month4to6,
//         hedge_month6plus: item.old_hedge_month6plus,
//       }))
//     );
//     notify("Values reset to original state.", "info");
//   };

  // Fetch data on component mount
  useEffect(() => {
    setLoading(true);
    nos
      .post<HedgingProposalResponse>(
        `${apiBaseUrl}/fx/exposures/get-hedging-proposals`
      )
      .then((response) => {
        if (response.data.success && Array.isArray(response.data.proposals)) {
          setData(response.data.proposals);
        } else {
          notify("No data received from server.", "error");
        }
      })
      .catch((error) => {
        console.error("API Error:", error);
        notify("Network error. Please try again.", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [notify]);

  const columns = useMemo<ColumnDef<HedgingProposal>[]>(
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
        accessorKey: "exposure_type",
        header: "Exposure Type",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "business_unit",
        header: "Business Unit",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "hedge_month1",
        header: "Hedge Month 1",
        cell: ({ row }) => (
          <InlineEditableCell
            row={row}
            fieldKey="hedge_month1"
            oldFieldKey="old_hedge_month1"
            handleUpdate={(_, updates) => {
              // Use contributing_header_ids as the row identifier
              const actualRowId = (row.original as any).contributing_header_ids;
              handleUpdate(actualRowId, updates);
            }}
            type="number"
          />
        ),
      },
      {
        accessorKey: "hedge_month2",
        header: "Hedge Month 2",
        cell: ({ row }) => (
          <InlineEditableCell
            row={row}
            fieldKey="hedge_month2"
            oldFieldKey="old_hedge_month2"
            handleUpdate={(_, updates) => {
              const actualRowId = (row.original as any).contributing_header_ids;
              handleUpdate(actualRowId, updates);
            }}
            type="number"
          />
        ),
      },
      {
        accessorKey: "hedge_month3",
        header: "Hedge Month 3",
        cell: ({ row }) => (
          <InlineEditableCell
            row={row}
            fieldKey="hedge_month3"
            oldFieldKey="old_hedge_month3"
            handleUpdate={(_, updates) => {
              const actualRowId = (row.original as any).contributing_header_ids;
              handleUpdate(actualRowId, updates);
            }}
            type="number"
          />
        ),
      },
      {
        accessorKey: "hedge_month4to6",
        header: "Hedge Month 4-6",
        cell: ({ row }) => (
          <InlineEditableCell
            row={row}
            fieldKey="hedge_month4to6"
            oldFieldKey="old_hedge_month4to6"
            handleUpdate={(_, updates) => {
              const actualRowId = (row.original as any).contributing_header_ids;
              handleUpdate(actualRowId, updates);
            }}
            type="number"
          />
        ),
      },
      {
        accessorKey: "hedge_month6plus",
        header: "Hedge Month > 6",
        cell: ({ row }) => (
          <InlineEditableCell
            row={row}
            fieldKey="hedge_month6plus"
            oldFieldKey="old_hedge_month6plus"
            handleUpdate={(_, updates) => {
              const actualRowId = (row.original as any).contributing_header_ids;
              handleUpdate(actualRowId, updates);
            }}
            type="number"
          />
        ),
      },
      {
        accessorKey: "status",
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
    <Layout title="Hedging Proposal">
      <div className="w-full space-y-4">
        <div className="-mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
          <CustomSelect
            label="Submit Type"
            options={submitTypeOptions}
            selectedValue={submitTypeFilter}
            onChange={(value) => setSubmitTypeFilter(value)}
            placeholder="Select submit type"
            isClearable={true}
          />
          
          <CustomSelect
            label="Business Unit"
            options={businessUnitOptions}
            selectedValue={businessUnitFilter}
            onChange={(value) => setBusinessUnitFilter(value)}
            placeholder="Select business unit"
            isClearable={true}
          />
          
          <CustomSelect
            label="Currency"
            options={currencyOptions}
            selectedValue={currencyFilter}
            onChange={(value) => setCurrencyFilter(value)}
            placeholder="Select currency"
            isClearable={true}
          />
          
        </div>
        <div className="flex items-center justify-end py-3 gap-x-4 gap-2">
          <div className="w-15rem">
            <Button color="Disable" type="submit" onClick={() => onSubmit()}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
          {/* <div className="w-15rem">
            <Button color="Fade" onClick={handleReset}>
              Reset
            </Button>
          </div> */}

          {/* <div className="w-15rem">
          <Button color="Fade">Exit</Button>
        </div> */}
        </div>

        <NyneOSTableWithOldVal<HedgingProposal>
          table={table}
          columns={columns}
          nonDraggableColumns={nonDraggableColumns}
          nonSortingColumns={nonSortingColumns}
          loading={loading}
          handleUpdate={handleUpdate}
        >
          <tfoot className="bg-primary font-semibold sticky bottom-0 z-10">
            <tr>
              {table.getVisibleLeafColumns().map((col) => (
                <td
                  key={col.id}
                  className="px-6 py-2 text-white text-sm text-start border-t border-border"
                >
                  {{
                    select: "Total",
                    hedge_month1: table.getRowModel().rows.reduce((sum, row) => sum + (typeof row.getValue === 'function' ? Number(row.getValue('hedge_month1')) || 0 : 0), 0).toLocaleString("en-IN"),
                    hedge_month2: table.getRowModel().rows.reduce((sum, row) => sum + (typeof row.getValue === 'function' ? Number(row.getValue('hedge_month2')) || 0 : 0), 0).toLocaleString("en-IN"),
                    hedge_month3: table.getRowModel().rows.reduce((sum, row) => sum + (typeof row.getValue === 'function' ? Number(row.getValue('hedge_month3')) || 0 : 0), 0).toLocaleString("en-IN"),
                    hedge_month4to6: table.getRowModel().rows.reduce((sum, row) => sum + (typeof row.getValue === 'function' ? Number(row.getValue('hedge_month4to6')) || 0 : 0), 0).toLocaleString("en-IN"),
                    hedge_month6plus: table.getRowModel().rows.reduce((sum, row) => sum + (typeof row.getValue === 'function' ? Number(row.getValue('hedge_month6plus')) || 0 : 0), 0).toLocaleString("en-IN"),
                  }[col.id] ?? null}
                </td>
              ))}
            </tr>
          </tfoot>
        </NyneOSTableWithOldVal>

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
export default HedgingProposal;
