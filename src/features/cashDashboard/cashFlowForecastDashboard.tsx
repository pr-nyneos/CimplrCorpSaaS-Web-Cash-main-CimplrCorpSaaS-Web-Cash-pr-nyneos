import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { useState, useEffect, useMemo } from "react";
import { FileText, Download, FileDown } from "lucide-react";
import nos from "../../utils/nos";
import { useNotification } from "../../app/providers/NotificationProvider/Notification";
import { ResponsivePie } from "@nivo/pie";
import NyneOSTable2 from "./NyneOSTable2";
import { BadgePlus } from "lucide-react";
import StatCard from "./StatCard";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import React from "react";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getSortedRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
} from "@tanstack/react-table";

import { ColumnPicker } from "../../components/ui/ColumnPicker";
import Pagination from "../../components/table/Pagination";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

interface ForecastKPI {
  starting_balance: number;
  total_inflows: number;
  total_outflows: number;
  projected_net_flow: number;
  projected_closing_balance: number;
}

interface CategorySumsResponse {
  category_sums: Record<string, number>;
  success: boolean;
}

interface PieChartData {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface DailyForecastData {
  date: string;
  opening: number;
  net_flow: number;
  closing: number;
}

interface DailyForecastResponse {
  rows: DailyForecastData[];
  success: boolean;
}

interface DailyForecastResponse {
  rows: DailyForecastData[];
  success: boolean;
}

type ComboChartData = {
  date: string;
  netFlow: number;
  closingBalance: number;
};

const forecastOptions = [
  { value: "7d", label: "Next 7 Days", days: 7 },
  { value: "14d", label: "Next 14 Days", days: 14 },
  { value: "30d", label: "Next 30 Days", days: 30 },
];

function getComboChartData(
  data: ComboChartData[],
  entity?: string,
  bank?: string,
  currency?: string,
  tableData ?: ForecastRow[]
): ComboChartData[] {
  // If no filters are applied, return original data
  if (!entity && !bank && !currency) {
    return data;
  }

  // If entity is selected, we need to filter based on table data and recalculate
  if (entity && tableData) {
    // Filter table data by entity (using description field as entity identifier)
    const filteredTableData = tableData.filter(row => 
      row.description === entity || row.category === entity
    );

    // Group by date and calculate net flow for each date
    const dateGroups = filteredTableData.reduce((acc, row) => {
      const date = row.date;
      if (!acc[date]) {
        acc[date] = { totalInflow: 0, totalOutflow: 0 };
      }
      
      if (row.type.toLowerCase() === 'inflow') {
        acc[date].totalInflow += row.normalized_usd;
      } else {
        acc[date].totalOutflow += row.normalized_usd;
      }
      
      return acc;
    }, {} as Record<string, { totalInflow: number; totalOutflow: number }>);

    // Convert to chart data format and calculate cumulative closing balance
    let cumulativeBalance = 0;
    const chartData = Object.entries(dateGroups)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, flows]) => {
        const netFlow = flows.totalInflow - flows.totalOutflow;
        cumulativeBalance += netFlow;
        return {
          date,
          netFlow,
          closingBalance: cumulativeBalance
        };
      });

    return chartData;
  }

  return data;
}

function getFilteredPieChartData(
  pieData: PieChartData[],
  tableData: ForecastRow[],
  entity?: string,
  currency?: string
): PieChartData[] {
  // If no filters are applied, return original data
  if (!entity && !currency) {
    return pieData;
  }

  // Filter table data based on selected entity and currency
  let filteredTableData = tableData;
  
  if (entity) {
    filteredTableData = filteredTableData.filter(row => 
      row.description === entity || row.category === entity
    );
  }
  
  if (currency) {
    filteredTableData = filteredTableData.filter(row => 
      row.currency === currency
    );
  }

  // Recalculate category sums from filtered data
  const categorySums: Record<string, number> = {};
  
  filteredTableData.forEach(row => {
    const categoryKey = `${row.category}-(${row.type})`;
    if (!categorySums[categoryKey]) {
      categorySums[categoryKey] = 0;
    }
    categorySums[categoryKey] += row.normalized_usd;
  });

  // Convert to pie chart format
  const filteredPieData: PieChartData[] = Object.entries(categorySums).map(
    ([key, value], index) => {
      const isInflow = key.includes("(Inflow)");
      const colors = [
        "hsl(140, 70%, 50%)",
        "hsl(160, 70%, 50%)",
        "hsl(0, 70%, 50%)",
        "hsl(10, 70%, 50%)",
        "hsl(340, 70%, 50%)",
        "hsl(200, 70%, 50%)",
        "hsl(260, 70%, 50%)",
        "hsl(30, 70%, 50%)",
      ];
      return {
        id: key,
        label: key.replace(/-(Inflow|Outflow)/, ""),
        value,
        color: isInflow ? colors[index % 2] : colors[(index % 6) + 2],
      };
    }
  );

  return filteredPieData;
}

export type NetCashFlowClosingData = {
  date: string;
  netCashFlow: number;
  closingBalance: number;
};

export type ForecastRow = {
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  normalized_usd: number;
};

export type DetailedForecastActual = {
  date: string;
  type: string;
  category: string;
  details: string;
  variance: string | number;
};


const CashFlowForecastDashboard: React.FC = () => {
  const [selectedForecast, setSelectedForecast] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>();
  const [selectedBank, ] = useState<string | undefined>();
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>();
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [kpiData, setKpiData] = useState<ForecastKPI | null>(null);
  const [tableData, setTableData] = useState<ForecastRow[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [dailyChartData, setDailyChartData] = useState<ComboChartData[]>([]);
  const [entityOptions, setEntityOptions] = useState<{ value: string; label: string }[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<{ value: string; label: string }[]>([]);
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const fetchAllData = async () => {
    if (!selectedForecast) {
      notify("Please select a forecast horizon before generating report.", "error");
      return;
    }

    setLoading(true);
    try {
      // Get the selected forecast option to extract the days value
      const selectedForecastOption = forecastOptions.find(option => option.value === selectedForecast);
      const horizonDays = selectedForecastOption ? selectedForecastOption.days : 0;

      // Prepare request body with required and optional parameters
      const requestBody: any = {
        horizon: horizonDays
      };

      if (selectedEntity) {
        requestBody.entity = selectedEntity;
      }

      if (selectedCurrency) {
        requestBody.currency = selectedCurrency;
      }

      type KpiApiResponse = {
        kpis: ForecastKPI;
        success: boolean;
      };
      const kpiRes = await nos.post<KpiApiResponse>(
        `${apiBaseUrl}/dash/cash/forecast/kpi`,
        requestBody
      );
      if (kpiRes.data && kpiRes.data.kpis) {
        setKpiData(kpiRes.data.kpis);
      } else {
        setKpiData(null);
        notify("Failed to fetch KPI data.", "error");
      }
      // console.log("KPI Response:", kpiRes.data.kpis);

      type TableApiResponse = {
        rows: ForecastRow[];
        success: boolean;
      };
      const tableRes = await nos.post<TableApiResponse>(
        `${apiBaseUrl}/dash/cash/forecast/rows`,
        // requestBody
        {horizon : horizonDays}
      );
      if (tableRes.data && tableRes.data.success && Array.isArray(tableRes.data.rows)) {
        setTableData(tableRes.data.rows);

        // // Populate entity options from table data
        // const entities = Array.from(
        //   new Set(tableRes.data.rows.map((item) => item.description)) // assuming description can be used as entity
        // );
        // setEntityOptions(
        //   entities.map((entity) => ({ value: entity, label: entity }))
        // );

        // Populate currency options from table data
        // const currencies = Array.from(
        //   new Set(tableRes.data.rows.map((item) => item.currency))
        // );
        // setCurrencyOptions(
        //   currencies.map((currency) => ({ value: currency, label: currency }))
        // );
      } else {
        setTableData([]);
        // notify("Failed to fetch table data.", "error");
      }

      const pieRes = await nos.post<CategorySumsResponse>(
        `${apiBaseUrl}/dash/cash/forecast/categories`,
        requestBody
      );
      if (pieRes.data && pieRes.data.success && pieRes.data.category_sums) {
        const pieData: PieChartData[] = Object.entries(pieRes.data.category_sums).map(
          ([key, value], index) => {
            const isInflow = key.includes("(Inflow)");
            const colors = [
              "hsl(140, 70%, 50%)",
              "hsl(160, 70%, 50%)",
              "hsl(0, 70%, 50%)",
              "hsl(10, 70%, 50%)",
              "hsl(340, 70%, 50%)",
              "hsl(200, 70%, 50%)",
              "hsl(260, 70%, 50%)",
              "hsl(30, 70%, 50%)",
            ];
            return {
              id: key,
              label: key.replace(/-(Inflow|Outflow)/, ""),
              value,
              color: isInflow ? colors[index % 2] : colors[(index % 6) + 2],
            };
          }
        );
        setPieChartData(pieData);
      } else {
        setPieChartData([]);
        notify("Failed to fetch category data.", "error");
      }

      const dailyRes = await nos.post<DailyForecastResponse>(
        `${apiBaseUrl}/dash/cash/forecast/daily`,
        requestBody
      );
      if (dailyRes.data && dailyRes.data.success && Array.isArray(dailyRes.data.rows)) {
        const chartData: ComboChartData[] = dailyRes.data.rows.map(row => ({
          date: row.date,
          netFlow: row.net_flow,
          closingBalance: row.closing,
        }));
        setDailyChartData(chartData);
        setHasGeneratedReport(true);
        // Reset pagination to first page when new data is loaded
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      } else {
        setDailyChartData([]);
        notify("Failed to fetch daily chart data.", "error");
      }
    } catch (error) {
      setKpiData(null);
      setTableData([]);
      setPieChartData([]);
      setDailyChartData([]);
      notify("Network error. Please try again.", "error");
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleGenerateReport = () => {
    fetchAllData();
  };

  // Reset data only when forecast horizon changes
  useEffect(() => {
    if (hasGeneratedReport) {
      setHasGeneratedReport(false);
      setTableData([]);
      setPieChartData([]);
      setDailyChartData([]);
      setKpiData(null);
      // Reset pagination when data is cleared
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }
  }, [selectedForecast]);

  // Get filtered currency options based on selected entity
  const filteredCurrencyOptions = useMemo(() => {
    if (!selectedEntity || currencyOptions.length === 0) {
      // If no entity selected, show all currencies
      return currencyOptions;
    }
    
    // If entity is selected, only show currencies that have data for that entity
    const entityCurrencies = tableData
      .filter(item => item.description === selectedEntity || item.category === selectedEntity)
      .map(item => item.currency);
    
    const uniqueEntityCurrencies = Array.from(new Set(entityCurrencies));
    
    return uniqueEntityCurrencies.map(currency => ({ 
      value: currency, 
      label: currency 
    }));
  }, [selectedEntity, currencyOptions, tableData]);

  // Clear selected currency if it's not available for the selected entity
  useEffect(() => {
    if (selectedEntity && selectedCurrency && filteredCurrencyOptions.length > 0) {
      const isCurrencyAvailable = filteredCurrencyOptions.some(
        option => option.value === selectedCurrency
      );
      if (!isCurrencyAvailable) {
        setSelectedCurrency(undefined);
      }
    }
  }, [selectedEntity, selectedCurrency, filteredCurrencyOptions]);


  const columns: ColumnDef<ForecastRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => <span>{(getValue() as number).toFixed(2)}</span>,
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "normalized_usd",
      header: "Normalized USD",
      cell: ({ getValue }) => <span>{(getValue() as number).toFixed(2)}</span>,
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      grouping: groupBy,
      pagination,
    },
    onGroupingChange: setGroupBy,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    manualPagination: false,
  });

  useEffect(() => {
    nos
      .post<{
        results: {
          entity_id: string;
          entity_name: string;
          entity_short_name: string;
        }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/entitycash/all-names`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setEntityOptions(
            response.data.results.map((item) => ({
              value: item.entity_name,
              label: item.entity_name,
            }))
          );
        } else {
          setEntityOptions([]);
        }
      })
      .catch(() => setEntityOptions([]));
  }, []);

  useEffect(() => {
    nos
      .post<{
        results: { currency_code: string; decimal_place: number }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/currency/active-approved`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setCurrencies(
            response.data.results.map((c) => ({
              value: c.currency_code,
              label: c.currency_code,
            }))
          );
        } else {
          setCurrencies([]);
        }
      })
      .catch(() => {
        setCurrencies([]);
      });
  }, []);

  return (
    <Layout title="Cash Flow Forecast Dashboard">
      <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
        <div className="flex gap-6 py-4 items-end">
          <CustomSelect
            label="Forecast Horizon"
            options={forecastOptions}
            selectedValue={selectedForecast}
            onChange={(option) => setSelectedForecast(option || "")}
            placeholder="Select forecast horizon (required)"
            isClearable={false}
            isRequired={true}
          />

          <CustomSelect
            label="Entity"
            options={entityOptions}
            selectedValue={selectedEntity}
            onChange={(option) => setSelectedEntity(option || undefined)}
            placeholder="Select entity"
            isClearable={true}
          />

          <CustomSelect
            label="Currency"
            options={currencies}
            selectedValue={selectedCurrency}
            onChange={(option) => setSelectedCurrency(option || undefined)}
            placeholder="Select currency"
            isClearable={true}
          />

          <div className="flex flex-row w-full pl-40 justify-end gap-4">
            <button 
              className={`${
                !selectedForecast 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-primary hover:bg-primary-hover"
              } text-white border-2 border-primary text-center rounded px-4 py-2 font-bold transition flex items-center gap-2`}
              onClick={handleGenerateReport}
              disabled={!selectedForecast || loading}
            >
              <BadgePlus className="w-5 h-5" />
              {loading ? "Generating Report..." : "Generate Report"}
            </button>
          </div>
        </div>
        {!hasGeneratedReport && !loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-2">
                Please select a forecast horizon and click "Generate Report" to view data
              </div>
              <div className="text-gray-400 text-sm">
                Forecast horizon selection is required. Entity and currency selections are optional.
              </div>
            </div>
          </div>
        )}
        {hasGeneratedReport && selectedForecast && (
          <>
            <div className="flex w-full gap-6 my-8">
              <StatCard
                title="Starting Balance"
                value={loading ? "Loading..." : kpiData ? kpiData.starting_balance.toFixed(2) : "N/A"}
                bgColor="bg-gradient-to-tl from-[#4dc9bf] to-[#073f40CC]"
              />
              <StatCard
                title="Total Inflows"
                value={loading ? "Loading..." : kpiData ? kpiData.total_inflows.toFixed(2) : "N/A"}
                bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
              />
              <StatCard
                title="Total Outflows"
                value={loading ? "Loading..." : kpiData ? kpiData.total_outflows.toFixed(2) : "N/A"}
                bgColor="bg-gradient-to-br from-[#0d6d69CC] to-[#0a5755B3]"
              />
              <StatCard
                title="Projected Net Flow"
                value={loading ? "Loading..." : kpiData ? kpiData.projected_net_flow.toFixed(2) : "N/A"}
                bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
              />
              <StatCard
                title="Projected Closing Balance"
                value={loading ? "Loading..." : kpiData ? kpiData.projected_closing_balance.toFixed(2) : "N/A"}
                bgColor="bg-gradient-to-tl from-[#4dc9bf] to-[#073f40CC]"
              />
            </div>
            <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-10 items-stretch">
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
            style={{ minWidth: 0, minHeight: 0, height: 480 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Forecast Composition (Inflow vs Outflow)
            </h2>

            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
              <div className="w-full h-[340px] max-w-full">
                <ResponsivePie
                  data={getFilteredPieChartData(pieChartData, tableData)}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.6}
                  padAngle={0.5}
                  cornerRadius={5}
                  activeOuterRadiusOffset={8}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: "color" }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{
                    from: "color",
                    modifiers: [["darker", 2]],
                  }}
                  legends={[
                    {
                      anchor: "bottom",
                      direction: "row",
                      translateY: 56,
                      itemWidth: 100,
                      itemHeight: 18,
                      symbolShape: "circle",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
            style={{ minWidth: 0, minHeight: 0, height: 480 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Daily Net Cash Flow & Closing Balance
            </h2>
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
              <div className="w-full h-[380px] max-w-full">
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart
                    data={getComboChartData(
                      dailyChartData,
                      // selectedEntity,
                      // selectedBank,
                      // selectedCurrency,
                      // tableData
                    )}
                    margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      label={{
                        value: "Net Flow",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: "Closing Balance",
                        angle: 90,
                        position: "insideRight",
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
                      
                      {getComboChartData(
                        dailyChartData,
                        // selectedEntity,
                        // selectedBank,
                        // selectedCurrency,
                        // tableData,
                      ).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.netFlow >= 0 ? "#4CC4BA" : "#F47560"}
                        />
                      ))}
                    </Bar>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="closingBalance"
                      name="Closing Balance"
                      stroke="#36A9A1"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {hasGeneratedReport && selectedForecast && (
      <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
        <div className="space-y-4">
          <div className=" gap-3 flex flex-col">
            <h2 className="text-xl font-semibold text-primary-lt pt-6">
              Detailed Forecast Transactions
            </h2>
            <div className="flex justify-between items-center ">
              <div className="flex items-center space-x-4">
                <div style={{ minWidth: 180, maxWidth: 320 }}>
                  <CustomSelect
                    label="Group By"
                    options={columns
                      .filter(
                        (
                          col
                        ): col is { accessorKey: string; header: string } => {
                          return (
                            Object.prototype.hasOwnProperty.call(
                              col,
                              "accessorKey"
                            ) &&
                            typeof (col as { accessorKey?: unknown })
                              .accessorKey === "string" &&
                            typeof (col as { header?: unknown }).header ===
                              "string"
                          );
                        }
                      )
                      .map((col) => ({
                        value: col.accessorKey,
                        label: col.header,
                      }))}
                    selectedValue={groupBy}
                    onChange={(vals: string[] | string | null) =>
                      setGroupBy(
                        Array.isArray(vals) ? vals : vals ? [vals] : []
                      )
                    }
                    placeholder="Select column(s) to group by"
                    isClearable={true}
                    isMulti={true}
                  />
                </div>
                <div className="relative top-2.5">
                  <ColumnPicker table={table} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-x-6">
                <div className="flex relative top-2.5 items-center justify-end gap-x-6">
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Export to Excel"
                    disabled={true}
                  >
                    <Download className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Export to PDF"
                    disabled={true}
                  >
                    <FileDown className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Email Report"
                    disabled={true}
                  >
                    <FileText className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="shadow-lg border border-border">
            <NyneOSTable2
              table={table}
              columns={columns}
              nonDraggableColumns={[]}
              nonSortingColumns={[]}
            >
              <tfoot className="bg-primary font-semibold sticky bottom-0 z-10">
                <tr>
                  {table.getVisibleLeafColumns().map((col) => {
                    const columnId = col.id;
                    let totalValue = null;

                    if (columnId === "date") {
                      totalValue = "Total";
                    } else if (columnId === "amount") {
                      totalValue = table
                        .getRowModel()
                        .rows.reduce((sum, row) => sum + (row.getValue("amount") as number || 0), 0)
                        .toFixed(2);
                    } else if (columnId === "normalized_usd") {
                      totalValue = table
                        .getRowModel()
                        .rows.reduce((sum, row) => sum + (row.getValue("normalized_usd") as number || 0), 0)
                        .toFixed(2);
                    }

                    return (
                      <td
                        key={col.id}
                        className="px-6 py-2 text-white text-sm text-start border-t border-border"
                      >
                        {totalValue}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </NyneOSTable2>
            <Pagination
                table={table}
                totalItems={tableData.length}
                startIndex={
                  tableData.length === 0
                    ? 0
                    : table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                      1
                }
                endIndex={Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  tableData.length
                )}
              />
          </div>
        </div>
      </div>
      )}
    </Layout>
  );
};

export default CashFlowForecastDashboard;
