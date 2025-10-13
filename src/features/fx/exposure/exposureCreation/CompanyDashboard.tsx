import React, { useState, useMemo } from "react";
import CustomSelect from "../../../../components/ui/SearchSelect.tsx";
import GridMasterOSTable from "../../../../components/table/GridMasterOSTable.tsx";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Button from "../../../../components/ui/Button.tsx";
import NyneOSTable2 from "../../../cashDashboard/NyneOSTable2.tsx";
import Pagination from "../../../../components/table/Pagination.tsx";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import nos from "../../../../utils/nos.tsx";
import { ChevronDown, ChevronRight } from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export interface ExposureRecord {
  exposure_header_id: string;
  company_code: string;
  entity: string;
  document_id: string;
  document_date: string;
  posting_date: string;
  value_date: string;
  counterparty_code: string;
  counterparty_name: string;
  currency: string;
  total_original_amount: number;
  total_open_amount: number;
  aging_days: number;
  status: string;
  approval_status: string;
  approved_by: string;
  approved_at: string;
  rejected_by: string;
  rejected_at: string;
  rejection_comment: string;
  delete_comment: string;
  created_at: string;
  updated_at: string;
  year: string;
  pay_amount: number;
  rec_amount: number;
  exposure_type: string;
  exposure_category: string;
}

// Type for grouped data
type GroupedExposureData = {
  company_code: string;
  currency: string;
  total_open_amount: number;
  subRows: ExposureRecord[];
};

const partyOptions = Array.from({ length: 2050 - 1995 + 1 }, (_, i) => {
  const year = (1995 + i).toString();
  return { value: year, label: year };
});

type consolidatedDetails = {
  month: string;
  totalPayables: number;
  totalReceivables: number;
  netExposure: number;
};

type FxExposureDataItem = {
  month: string;
  netFlow: number;
};

type MonthlyBusinessDashboard = {
  company: string;
  currency: string;
  "Jan-25": number;
  "Feb-25": number;
  "Mar-25": number;
  "Apr-25": number;
  "May-25": number;
  "Jun-25": number;
  "Jul-25": number;
  "Aug-25": number;
  "Sep-25": number;
  "Oct-25": number;
  "Nov-25": number;
  "Dec-25": number;
  total: number;
};

const defaultColumnVisibility: Record<string, boolean> = {
  month: true,
  totalPayables: true,
  totalReceivables: true,
  netExposure: true,
};

const defaultMonthlyColumnVisibility: Record<string, boolean> = {
  company: true,
  currency: true,
  "Jan-25": true,
  "Feb-25": true,
  "Mar-25": true,
  "Apr-25": true,
  "May-25": true,
  "Jun-25": true,
  "Jul-25": true,
  "Aug-25": true,
  "Sep-25": true,
  "Oct-25": true,
  "Nov-25": true,
  "Dec-25": true,
  total: true,
  select: true,
};

const monthlyBusinessDashboardMockData: MonthlyBusinessDashboard[] = [
  {
    company: "2100",
    currency: "CNY",
    "Jan-25": 480635.92,
    "Feb-25": 1922647.24,
    "Mar-25": 3983466.93,
    "Apr-25": 4527126.94,
    "May-25": 5158289.5,
    "Jun-25": 27662672.92,
    "Jul-25": -20543558.27,
    "Aug-25": 20148031.45,
    "Sep-25": 7500000.0,
    "Oct-25": 10400000.0,
    "Nov-25": 5900000.0,
    "Dec-25": 12600000.0,
    total: 78637113.53,
  },
];

const processMonthlyData = (data: ExposureRecord[]) => {
  const monthlyMap = new Map<
    string,
    { payables: number; receivables: number }
  >();

  data.forEach((record) => {
    const month = record.year;

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { payables: 0, receivables: 0 });
    }

    const monthData = monthlyMap.get(month)!;
    monthData.payables += record.pay_amount || 0;
    monthData.receivables += record.rec_amount || 0;
  });

  const monthOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month: month.toUpperCase(),
      payables: -Math.abs(data.payables),
      receivables: data.receivables,
      status: data.receivables - data.payables >= 0 ? "positive" : "negative",
    }))
    .sort((a, b) => {
      const aMonth = a.month.split("-")[0];
      const bMonth = b.month.split("-")[0];
      const aYear = a.month.split("-")[1];
      const bYear = b.month.split("-")[1];

      if (aYear !== bYear) {
        return aYear.localeCompare(bYear);
      }
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
    });
};

const CompanyDashboard = () => {
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "month",
    "totalPayables",
    "totalReceivables",
    "netExposure",
  ]);

  const [monthlyData, setMonthlyData] = useState<MonthlyBusinessDashboard[]>(
    monthlyBusinessDashboardMockData
  );
  const [monthlyColumnVisibility, setMonthlyColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultMonthlyColumnVisibility);
  const [monthlyColumnOrder, setMonthlyColumnOrder] = useState<string[]>([
    "select",
    "company",
    "currency",
    "Jan-25",
    "Feb-25",
    "Mar-25",
    "Apr-25",
    "May-25",
    "Jun-25",
    "Jul-25",
    "Aug-25",
    "Sep-25",
    "Oct-25",
    "Nov-25",
    "Dec-25",
    "total",
  ]);
  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [exposureData, setExposureData] = useState<ExposureRecord[]>([]);

  // New state for selected month details
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expanded, setExpanded] = useState({});

  React.useEffect(() => {
    const fetchExposureData = async () => {
      try {
        const response = await nos.post<{
          rows: ExposureRecord[];
          success: boolean;
        }>(`${apiBaseUrl}/fx/exposures/dashboard/by-year/v91`);
        if (response.data.success) {
          setExposureData(response.data.rows);
        }
      } catch (error) {
        console.error("Error fetching exposure data:", error);
      }
    };
    fetchExposureData();
  }, []);

  const formatNumber = (num: number): string => {
    if (num === 0) return "0.00";
    return Math.abs(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getValueColor = (value: number): string => {
    if (value === 0) return "text-gray-500";
    return value > 0 ? "text-primary-lt" : "text-red-600";
  };

  const filteredMonthlyData = useMemo(() => {
    if (!partyFilter) return [];

    let filtered = [...exposureData];
    filtered = filtered.filter((item) =>
      item.year.endsWith(`-${partyFilter.slice(-2)}`)
    );

    if (companyFilter) {
      filtered = filtered.filter((item) => item.company_code === companyFilter);
    }
    if (currencyFilter) {
      filtered = filtered.filter((item) => item.currency === currencyFilter);
    }

    return processMonthlyData(filtered);
  }, [exposureData, companyFilter, currencyFilter, partyFilter]);

  // Get detailed data for selected month
  const selectedMonthDetailData = useMemo(() => {
    if (!selectedMonth || !partyFilter) return [];

    let filtered = exposureData.filter(
      (item) => item.year.toUpperCase() === selectedMonth.toUpperCase()
    );

    if (companyFilter) {
      filtered = filtered.filter((item) => item.company_code === companyFilter);
    }
    if (currencyFilter) {
      filtered = filtered.filter((item) => item.currency === currencyFilter);
    }

    // Group by company_code and currency
    const grouped = new Map<string, GroupedExposureData>();

    filtered.forEach((record) => {
      const key = `${record.company_code}_${record.currency}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          company_code: record.company_code,
          currency: record.currency,
          total_open_amount: 0,
          subRows: [],
        });
      }

      const group = grouped.get(key)!;
      group.total_open_amount += record.total_open_amount || 0;
      group.subRows.push(record);
    });

    return Array.from(grouped.values());
  }, [selectedMonth, exposureData, companyFilter, currencyFilter, partyFilter]);

  const consolidatedDetailsData = useMemo(() => {
    return filteredMonthlyData.map((monthData) => ({
      month: monthData.month,
      totalPayables: monthData.payables,
      totalReceivables: monthData.receivables,
      netExposure: monthData.receivables + monthData.payables,
    }));
  }, [filteredMonthlyData]);

  const fxExposureChartData = useMemo(() => {
    return filteredMonthlyData.map((monthData) => ({
      month: monthData.month,
      netFlow: (monthData.receivables + monthData.payables) / 100000,
    }));
  }, [filteredMonthlyData]);

  const filteredData = useMemo(() => {
    let result = [...monthlyData];

    if (companyFilter) {
      result = result.filter((item) => item.company === companyFilter);
    }
    if (currencyFilter) {
      result = result.filter((item) => item.currency === currencyFilter);
    }

    return result;
  }, [monthlyData, companyFilter, currencyFilter]);

  const calculateNet = (receivables: number, payables: number): number => {
    return receivables + payables;
  };

  const consolidatedDetailsColumns = useMemo<ColumnDef<consolidatedDetails>[]>(
    () => [
      {
        accessorKey: "month",
        header: "Month",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "totalPayables",
        header: "Total Payables",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span className={`${getValueColor(value)}`}>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "totalReceivables",
        header: "Total Receivables",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span className={`${getValueColor(value)}`}>
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "netExposure",
        header: "Net Exposure",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span className={`font-semibold ${getValueColor(value)}`}>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
    ],
    []
  );

  const consolidatedDetailsTable = useReactTable({
    data: consolidatedDetailsData,
    columns: consolidatedDetailsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      columnVisibility,
      columnOrder,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  // Month detail table columns
  const monthDetailColumns = useMemo<
    ColumnDef<GroupedExposureData | ExposureRecord>[]
  >(
    () => [
      {
        id: "expander",
        header: "",
        cell: ({ row }) => {
          if (row.depth === 0) {
            return (
              <button onClick={row.getToggleExpandedHandler()} className="p-1">
                {row.getIsExpanded() ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            );
          }
          return null;
        },
      },
      {
        accessorKey: "company_code",
        header: "Company Code",
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <span className={row.depth === 0 ? "font-semibold" : ""}>
              {value || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <span className={row.depth === 0 ? "font-semibold" : ""}>
              {value || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "document_id",
        header: "Document ID",
        cell: ({ row, getValue }) => {
          if (row.depth === 0) return null;
          return <span>{(getValue() as string) || "—"}</span>;
        },
      },
      {
        accessorKey: "posting_date",
        header: "Posting Date",
        cell: ({ row, getValue }) => {
          if (row.depth === 0) return null;
          const date = getValue() as string;
          return (
            <span>{date ? new Date(date).toLocaleDateString() : "—"}</span>
          );
        },
      },
      {
        accessorKey: "value_date",
        header: "Value Date",
        cell: ({ row, getValue }) => {
          if (row.depth === 0) return null;
          const date = getValue() as string;
          return (
            <span>{date ? new Date(date).toLocaleDateString() : "—"}</span>
          );
        },
      },
      {
        accessorKey: "exposure_category",
        header: "Category",
        cell: ({ row, getValue }) => {
          if (row.depth === 0) return null;
          return <span>{(getValue() as string) || "—"}</span>;
        },
      },
      {
        accessorKey: "total_open_amount",
        header: "Total Open Amount",
        cell: ({ row, getValue }) => {
          const value = getValue() as number;
          return (
            <span
              className={row.depth === 0 ? "font-semibold text-primary-lt" : ""}
            >
              {formatNumber(value)}
            </span>
          );
        },
      },
    ],
    [formatNumber]
  );

  const monthDetailTable = useReactTable({
  data: selectedMonthDetailData,
  columns: monthDetailColumns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(), // <-- paginate first
  getExpandedRowModel: getExpandedRowModel(),     // <-- then expand
  getSubRows: (row: any) => row.subRows,
  state: {
    expanded,
  },
  onExpandedChange: setExpanded,
  initialState: {
    pagination: {
      pageSize: 10,
    },
  },
});

  const columns = useMemo<ColumnDef<MonthlyBusinessDashboard>[]>(
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
        accessorKey: "company",
        header: "Company",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "Jan-25",
        header: "Jan-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Feb-25",
        header: "Feb-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Mar-25",
        header: "Mar-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Apr-25",
        header: "Apr-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "May-25",
        header: "May-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Jun-25",
        header: "Jun-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Jul-25",
        header: "Jul-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Aug-25",
        header: "Aug-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Sep-25",
        header: "Sep-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Oct-25",
        header: "Oct-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Nov-25",
        header: "Nov-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "Dec-25",
        header: "Dec-25",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span>
              {value < 0 && "-"}
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ getValue }) => (
          <span className="text-primary-lt font-medium">
            {formatNumber(getValue() as number)}
          </span>
        ),
      },
    ],
    [formatNumber]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    enableRowSelection: true,
    onRowSelectionChange: setSelectedRowIds,
    onColumnOrderChange: setMonthlyColumnOrder,
    onColumnVisibilityChange: setMonthlyColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnOrder: monthlyColumnOrder,
      rowSelection: selectedRowIds,
      columnVisibility: monthlyColumnVisibility,
    },
    autoResetPageIndex: false,
  });

  const handleReset = () => {
    setCompanyFilter("");
    setCurrencyFilter("");
    setPartyFilter("");
    setShowDashboard(false);
    setSelectedMonth(null);
  };

  const handleMonthClick = (month: string) => {
    setSelectedMonth(month);
  };

  const companyOptions = useMemo(() => {
    const uniqueCompanies = new Set<string>();
    exposureData.forEach((item) => {
      if (item.company_code) uniqueCompanies.add(item.company_code);
    });
    return Array.from(uniqueCompanies).map((company) => ({
      value: company,
      label: company,
    }));
  }, [exposureData]);

  const currencyOptions = useMemo(() => {
    const uniqueCurrencies = new Set<string>();
    exposureData.forEach((item) => {
      if (item.currency) uniqueCurrencies.add(item.currency);
    });
    return Array.from(uniqueCurrencies).map((currency) => ({
      value: currency,
      label: currency,
    }));
  }, [exposureData]);

  const dynamicHeatmapData = useMemo(() => {
    const map = new Map<string, Map<string, number>>();

    let filtered = [...exposureData];
    if (partyFilter) {
      filtered = filtered.filter((item) =>
        item.year.endsWith(`-${partyFilter.slice(-2)}`)
      );
    }
    if (companyFilter) {
      filtered = filtered.filter((item) => item.company_code === companyFilter);
    }
    if (currencyFilter) {
      filtered = filtered.filter((item) => item.currency === currencyFilter);
    }

    filtered.forEach((item) => {
      const company = item.company_code;
      const currency = item.currency;
      const net = (item.rec_amount || 0) + (item.pay_amount || 0);

      if (!map.has(company)) map.set(company, new Map());
      const currencyMap = map.get(company)!;
      currencyMap.set(currency, (currencyMap.get(currency) || 0) + net);
    });

    const allCurrencies = Array.from(
      new Set(filtered.map((item) => item.currency))
    );

    return Array.from(map.entries()).map(([company, currencyMap]) => ({
      id: company,
      data: allCurrencies.map((currency) => ({
        x: currency,
        y: currencyMap.get(currency) || 0,
      })),
    }));
  }, [exposureData, companyFilter, currencyFilter, partyFilter]);

  return (
    <>
      <div className="w-full space-y-6">
        <h2 className="text-2xl font-semibold text-secondary-text-dark">
          Dashboard
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CustomSelect
            label="Company"
            options={companyOptions}
            selectedValue={companyFilter}
            onChange={setCompanyFilter}
            placeholder="Select Company"
            isClearable={true}
          />
          <CustomSelect
            label="Currency"
            options={currencyOptions}
            selectedValue={currencyFilter}
            onChange={setCurrencyFilter}
            placeholder="Select Currency"
            isClearable={true}
          />
          <CustomSelect
            label="Year"
            options={partyOptions}
            selectedValue={partyFilter}
            onChange={setPartyFilter}
            placeholder="Select Year"
            isClearable={true}
          />
          <div className="flex gap-2 p-7">
            <Button
              categories="Large"
              onClick={() => setShowDashboard(true)}
              disabled={!partyFilter}
            >
              {exposureData.length === 0 ? "Loading..." : "Generate"}
            </Button>
            <Button categories="Large" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>

        {showDashboard && !partyFilter && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Please select a Year to generate the dashboard.
            </p>
          </div>
        )}

        {showDashboard && partyFilter && filteredMonthlyData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No data available for the selected filters. Please adjust your
              filters and try again.
            </p>
          </div>
        )}

        {showDashboard && partyFilter && filteredMonthlyData.length > 0 && (
          <>
            <div>
              <h2 className="text-xl font-semibold text-primary-lt pt-6">
                Year Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredMonthlyData.map((monthData) => {
                  const netValue = calculateNet(
                    monthData.receivables,
                    monthData.payables
                  );
                  const isSelected = selectedMonth === monthData.month;
                  return (
                    <div
                      key={monthData.month}
                      onClick={() => handleMonthClick(monthData.month)}
                      className={`bg-primary-xl p-4 px-6 rounded-lg shadow-sm border ${
                        isSelected
                          ? "border-primary-lt border-2"
                          : "border-border"
                      } hover:shadow-md transition-shadow duration-200 cursor-pointer`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-secondary-text-dark mb-1">
                          {monthData.month}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            Payables
                          </span>
                          <span
                            className={`text-sm font-medium ${getValueColor(
                              monthData.payables
                            )}`}
                          >
                            {monthData.payables < 0 && "-"}
                            {formatNumber(monthData.payables)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            Receivables
                          </span>
                          <span
                            className={`text-sm font-medium ${getValueColor(
                              monthData.receivables
                            )}`}
                          >
                            {formatNumber(monthData.receivables)}
                          </span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-700">
                              Net
                            </span>
                            <span
                              className={`text-sm font-bold ${getValueColor(
                                netValue
                              )}`}
                            >
                              {netValue < 0 && "-"}
                              {formatNumber(netValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Month Detail Table */}
            {selectedMonth && selectedMonthDetailData.length > 0 && (
              <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full mt-6 overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-primary-lt">
                    Details for {selectedMonth}
                  </h2>
                </div>

                <div className="border border-border overflow-x-auto overflow-y-auto">
                  <table className="min-w-full table-auto">
                    <thead className="bg-secondary-color rounded-xl">
                      {monthDetailTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                              {header.isPlaceholder
                                ? null
                                : typeof header.column.columnDef.header ===
                                  "function"
                                ? header.column.columnDef.header(
                                    header.getContext()
                                  )
                                : header.column.columnDef.header}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y">
                      {monthDetailTable
                        .getRowModel()
                        .rows.map((row, idx: number) => (
                          <React.Fragment key={row.id}>
                            <tr
                              className={
                                idx % 2 === 0
                                  ? "bg-primary-md hover:bg-teal-100"
                                  : "bg-secondary-color-lt hover:bg-gray-50"
                              }
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className={`px-4 py-3 text-sm ${
                                    row.depth === 1 ? "pl-12" : ""
                                  }`}
                                >
                                  {typeof cell.column.columnDef.cell ===
                                  "function"
                                    ? cell.column.columnDef.cell(
                                        cell.getContext()
                                      )
                                    : (cell.getValue() as any)}
                                </td>
                              ))}
                            </tr>
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  table={monthDetailTable}
                  totalItems={selectedMonthDetailData.length}
                  startIndex={
                    selectedMonthDetailData.length === 0
                      ? 0
                      : monthDetailTable.getState().pagination.pageIndex *
                          monthDetailTable.getState().pagination.pageSize +
                        1
                  }
                  endIndex={Math.min(
                    (monthDetailTable.getState().pagination.pageIndex + 1) *
                      monthDetailTable.getState().pagination.pageSize,
                    selectedMonthDetailData.length
                  )}
                />
              </div>
            )}

            <div className="flex gap-6">
              <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full mt-6">
                <h2 className="text-xl font-semibold text-primary-lt pt-6">
                  Consolidated Details
                </h2>
                <GridMasterOSTable<consolidatedDetails>
                  table={consolidatedDetailsTable}
                />
              </div>
              <div
                className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full mt-6"
                style={{ minWidth: 0, minHeight: 0, height: 480 }}
              >
                <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                  Unhedged FX Exposure (Net in USD)
                </h2>
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart
                    data={fxExposureChartData}
                    margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      label={{
                        value: "Net Flow ($ USD)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="netFlow"
                      name="Net Flow"
                      isAnimationActive={false}
                      fill={"#4CC4BA"}
                    >
                      {fxExposureChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.netFlow >= 0 ? "#4CC4BA" : "#F47560"}
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-primary-lt">
              Monthly Business Dashboard
            </h2>
            <NyneOSTable2<MonthlyBusinessDashboard>
              table={table}
              columns={columns}
              nonDraggableColumns={["expand", "action", "select"]}
              nonSortingColumns={["expand", "action", "select"]}
              sections={[]}
              loading={loading}
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

            <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full mt-6">
              <h2 className="text-xl font-semibold text-primary-lt">
                Company × Currency Heatmap
              </h2>
              <div style={{ height: "700px" }}>
                <ResponsiveHeatMap
                  data={dynamicHeatmapData}
                  margin={{ top: 80, right: 120, bottom: 140, left: 120 }}
                  valueFormat=">-.2s"
                  axisTop={{
                    tickSize: 8,
                    tickPadding: 10,
                    tickRotation: -60,
                    legend: "",
                    legendOffset: 60,
                    legendPosition: "middle",
                  }}
                  axisRight={{
                    tickSize: 8,
                    tickPadding: 10,
                    tickRotation: 0,
                    legend: "Company",
                    legendPosition: "middle",
                    legendOffset: 90,
                  }}
                  axisLeft={{
                    tickSize: 8,
                    tickPadding: 10,
                    tickRotation: 0,
                    legend: "Company",
                    legendPosition: "middle",
                    legendOffset: -90,
                  }}
                  axisBottom={{
                    tickSize: 8,
                    tickPadding: 10,
                    tickRotation: 0,
                    legend: "Currency",
                    legendPosition: "middle",
                    legendOffset: 130,
                  }}
                  colors={{
                    type: "quantize",
                    colors: ["#81E6D9", "#4FD1C7", "#4CC4BA", "#38B2AC"],
                    steps: 8,
                  }}
                  emptyColor="#f3f4f6"
                  borderColor={{
                    from: "color",
                    modifiers: [["darker", 0.3]],
                  }}
                  labelTextColor={{
                    from: "color",
                    modifiers: [["darker", 2]],
                  }}
                  legends={[
                    {
                      anchor: "bottom",
                      translateX: 0,
                      translateY: 60,
                      length: 500,
                      thickness: 16,
                      direction: "row",
                      tickPosition: "after",
                      tickSize: 8,
                      tickSpacing: 10,
                      tickOverlap: false,
                      tickFormat: ">-.2s",
                      title: "Value →",
                      titleAlign: "start",
                      titleOffset: 10,
                    },
                  ]}
                  theme={{
                    axis: {
                      legend: {
                        text: {
                          fontSize: 18,
                          fontWeight: "bold",
                        },
                      },
                      ticks: {
                        text: {
                          fontSize: 14,
                        },
                      },
                    },
                    legends: {
                      title: {
                        text: {
                          fontSize: 16,
                          fontWeight: "bold",
                        },
                      },
                      text: {
                        fontSize: 14,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CompanyDashboard;
