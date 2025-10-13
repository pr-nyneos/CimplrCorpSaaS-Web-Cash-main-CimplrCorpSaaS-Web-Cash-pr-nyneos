import { useMemo, useState, useEffect } from "react";
import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { BadgePlus } from "lucide-react";
import StatCard from "./StatCard";
import { FileText, Download, FileDown } from "lucide-react";
import NyneOSTableExpanded from "./NyneOSTableExpaned";
// import { ColumnPicker } from "../../components/ui/ColumnPicker";
import { ChevronRight, ChevronDown } from "lucide-react";
import { ResponsiveLine } from "@nivo/line";
// import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar"; // use ResponsiveBar for auto sizing
import type { StoryObj } from "@storybook/react";
import nos from "../../utils/nos";
import { useNotification } from "../../app/providers/NotificationProvider/Notification";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getSortedRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  type ExpandedState,
} from "@tanstack/react-table";

// --- Types ---
export type DropdownOption = { value: string; label: string; days?: number };

// API Types
export type ForecastActualRow = {
  category: string;
  type: "Inflow" | "Outflow";
  actual: number;
  forecast: number;
  variance: number;
  currency?: string;
};

export type ForecastActualApiResponse = {
  rows: ForecastActualRow[];
  success: boolean;
};

export type ForecastActualKPI = {
  forecast_net: number;
  actual_net: number;
  net_variance: number;
  net_variance_pct: number;
};

export type ForecastActualKPIResponse = {
  kpis: ForecastActualKPI;
  success: boolean;
};

export type ForecastActualByDateRow = {
  date: string;
  category: string;
  type: "Inflow" | "Outflow";
  actual: number;
  forecast: number;
  variance: number;
  currency?: string;
};

export type ForecastActualByDateResponse = {
  rows: ForecastActualByDateRow[];
  success: boolean;
};

export type DetailedForecastActual = {
  category: string;
  forecast: string;
  actual: string;
  variance: string;
  varianceRaw: number; // Raw variance value for color determination
  total: number;
  subRows?: DetailedForecastActual[];
};

export type ClosingBalancePoint = { x: string; y: number };

export type ClosingBalanceSeries = {
  id: string;
  color: string;
  data: ClosingBalancePoint[];
};

const dateOptions = [
  { value: "thisQuarter", label: "This Quarter", days: 90 },
  { value: "thisMonth", label: "This Month", days: 30 },
];

// Default currency options
const defaultCurrencyOptions = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  // { value: "GBP", label: "GBP" },
];

export type VarianceByCategory = {
  category: string;
  variance: number;
};

// Transform API data for variance by category chart
const transformApiDataToVarianceChart = (
  data: ForecastActualRow[]
): VarianceByCategory[] => {
  return data.map((item) => ({
    category: item.category,
    variance: item.variance,
  }));
};

// Transform by-date API data for closing balance trend chart
const transformByDateDataToChart = (
  data: ForecastActualByDateRow[]
): ClosingBalanceSeries[] => {
  // Group data by date and sum actual/forecast values
  const dateGroups = data.reduce((acc, item) => {
    const date = new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });

    if (!acc[date]) {
      acc[date] = { actual: 0, forecast: 0 };
    }

    acc[date].actual += item.actual;
    acc[date].forecast += item.forecast;

    return acc;
  }, {} as Record<string, { actual: number; forecast: number }>);

  // Sort dates and create chart data
  const sortedDates = Object.keys(dateGroups).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return [
    {
      id: "Forecast",
      color: "hsl(194, 70%, 50%)",
      data: sortedDates.map((date) => ({
        x: date,
        y: dateGroups[date].forecast,
      })),
    },
    {
      id: "Actual",
      color: "hsl(14, 80%, 60%)",
      data: sortedDates.map((date) => ({
        x: date,
        y: dateGroups[date].actual,
      })),
    },
  ];
};

// Filter functions based on selections
function getFilteredVarianceData(
  data: ForecastActualRow[],
  entity?: string,
  currency?: string
): VarianceByCategory[] {
  let filteredData = data;

  if (entity) {
    filteredData = filteredData.filter((item) => item.category === entity);
  }

  if (currency) {
    // Filter by currency if the field exists in the data
    filteredData = filteredData.filter(
      (item) =>
        item.currency === currency || (!item.currency && currency === "USD") // Default to USD if no currency specified
    );
  }

  return transformApiDataToVarianceChart(filteredData);
}

function getFilteredClosingBalanceData(
  data: ForecastActualByDateRow[],
  entity?: string,
  currency?: string
): ClosingBalanceSeries[] {
  let filteredData = data;

  if (entity) {
    filteredData = filteredData.filter((item) => item.category === entity);
  }

  if (currency) {
    // Filter by currency if the field exists in the data
    filteredData = filteredData.filter(
      (item) =>
        item.currency === currency || (!item.currency && currency === "USD") // Default to USD if no currency specified
    );
  }

  return transformByDateDataToChart(filteredData);
}

function getFilteredTableData(
  data: ForecastActualRow[],
  entity?: string,
  currency?: string
): ForecastActualRow[] {
  let filteredData = data;

  if (entity) {
    filteredData = filteredData.filter((item) => item.category === entity);
  }

  if (currency) {
    // Filter by currency if the field exists in the data
    filteredData = filteredData.filter(
      (item) =>
        item.currency === currency || (!item.currency && currency === "USD") // Default to USD if no currency specified
    );
  }

  return filteredData;
}

const getDivergingCommonProps = (data: VarianceByCategory[]) => ({
  data: data,
  keys: ["variance"],
  indexBy: "category",
  margin: { top: 50, right: 50, bottom: 50, left: 70 },
  padding: 0.3,
  layout: "vertical" as const,
  valueScale: {
    type: "linear" as const,
    min:
      data.length > 0 ? Math.min(...data.map((d) => d.variance)) - 10000 : -60,
    max:
      data.length > 0 ? Math.max(...data.map((d) => d.variance)) + 10000 : 60,
  },
  colors: (bar: any) => (bar.data.variance >= 0 ? "#4CC4BA" : "#F47560"),
  axisLeft: {
    legend: "Variance",
    legendPosition: "middle" as const,
    legendOffset: -60,
  },
  axisBottom: {
    legend: "Category",
    legendPosition: "middle" as const,
    legendOffset: 40,
  },
  markers: [
    {
      axis: "y",
      value: 0,
      legendPosition: "top-left",
    },
  ],
});

const ForecastActualDashboard = () => {
  // API data state
  const [apiData, setApiData] = useState<ForecastActualRow[]>([]);
  const [kpiData, setKpiData] = useState<ForecastActualKPI | null>(null);
  const [byDateData, setByDateData] = useState<ForecastActualByDateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);

  // Dropdown filter states
  const [selectedDateRange, setSelectedDateRange] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  );
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(
    undefined
  );

  // Dynamic options populated from API data
  const [entityOptions, setEntityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [currencyOptions, setCurrencyOptions] = useState<
    { value: string; label: string }[]
  >(defaultCurrencyOptions);

  const { notify } = useNotification();

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
  // Fetch data from API
  const fetchAllData = async () => {
    if (!selectedDateRange) {
      notify("Please select a date range before generating report.", "error");
      return;
    }

    setLoading(true);
    try {
      // Get the selected date option to extract the days value
      const selectedDateOption = dateOptions.find(
        (option) => option.value === selectedDateRange
      );
      const horizonDays = selectedDateOption ? selectedDateOption.days : 0;

      // Prepare request body with required and optional parameters
      const requestBody: any = {
        dateRange: selectedDateRange,
        horizon: horizonDays,
      };

      if (selectedEntity) {
        requestBody.entity = selectedEntity;
      }

      if (selectedCurrency) {
        requestBody.currency = selectedCurrency;
      }

      // Fetch table rows data
      const rowsResponse = await nos.post<ForecastActualApiResponse>(
        `${apiBaseUrl}/dash/forecast-vs-actual/rows`,
        requestBody
      );
      if (
        rowsResponse.data &&
        rowsResponse.data.success &&
        Array.isArray(rowsResponse.data.rows)
      ) {
        setApiData(rowsResponse.data.rows);

        // Populate entity options from table data
        // const entities = Array.from(
        //   new Set(rowsResponse.data.rows.map((item) => item.category))
        // );
        // setEntityOptions(
        //   entities.map((entity) => ({ value: entity, label: entity }))
        // );

        // Populate currency options from table data, merge with defaults
        const currencies = Array.from(
          new Set(
            rowsResponse.data.rows
              .map((item) => item.currency)
              .filter((currency) => currency) // Filter out null/undefined currencies
          )
        );

        // Merge API currencies with default currencies
        const uniqueCurrencies = new Set([
          ...defaultCurrencyOptions.map((opt) => opt.value),
          ...currencies,
        ]);

        const newCurrencyOptions = Array.from(uniqueCurrencies).map(
          (currency) => {
            const defaultOption = defaultCurrencyOptions.find(
              (opt) => opt.value === currency
            );
            return defaultOption || { value: currency, label: currency };
          }
        );

        setCurrencyOptions(newCurrencyOptions);
      } else {
        setApiData([]);
        notify("Failed to fetch forecast vs actual data.", "error");
      }

      // Fetch KPI data for StatCards
      const kpiResponse = await nos.post<ForecastActualKPIResponse>(
        `${apiBaseUrl}/dash/forecast-vs-actual/kpi`,
        requestBody
      );
      if (
        kpiResponse.data &&
        kpiResponse.data.success &&
        kpiResponse.data.kpis
      ) {
        setKpiData(kpiResponse.data.kpis);
      } else {
        setKpiData(null);
        notify("Failed to fetch KPI data.", "error");
      }

      // Fetch by-date data for Closing Balance Trend chart
      const byDateResponse = await nos.post<ForecastActualByDateResponse>(
        `${apiBaseUrl}/dash/forecast-vs-actual/by-date`,
        requestBody
      );
      if (
        byDateResponse.data &&
        byDateResponse.data.success &&
        Array.isArray(byDateResponse.data.rows)
      ) {
        setByDateData(byDateResponse.data.rows);
        setHasGeneratedReport(true);
      } else {
        setByDateData([]);
        notify("Failed to fetch trend data.", "error");
      }
    } catch (err) {
      console.error("Error fetching forecast vs actual data:", err);
      setApiData([]);
      setKpiData(null);
      setByDateData([]);
      notify("Network error. Please try again.", "error");
    }
    setLoading(false);
  };

  const handleGenerateReport = () => {
    fetchAllData();
  };

  // Reset data only when date range changes
  useEffect(() => {
    if (hasGeneratedReport) {
      setHasGeneratedReport(false);
      setApiData([]);
      setKpiData(null);
      setByDateData([]);
      // Reset entity options but keep default currency options
      setEntityOptions([]);
      setCurrencyOptions(defaultCurrencyOptions);
    }
  }, [selectedDateRange]);

  // Get filtered currency options based on selected entity
  const filteredCurrencyOptions = useMemo(() => {
    if (!selectedEntity || apiData.length === 0) {
      return currencyOptions;
    }

    // Filter currencies available for the selected entity
    const entityData = apiData.filter(
      (item) => item.category === selectedEntity
    );
    const availableCurrencies = Array.from(
      new Set(
        entityData.map((item) => item.currency).filter((currency) => currency) // Filter out null/undefined currencies
      )
    );

    // If no specific currencies found for entity, return all options
    if (availableCurrencies.length === 0) {
      return currencyOptions;
    }

    // Return only currencies available for this entity
    return currencyOptions.filter((option) =>
      availableCurrencies.includes(option.value)
    );
  }, [selectedEntity, currencyOptions, apiData]);

  // Clear selected currency if it's not available for the selected entity
  useEffect(() => {
    if (
      selectedEntity &&
      selectedCurrency &&
      filteredCurrencyOptions.length > 0
    ) {
      const isCurrencyAvailable = filteredCurrencyOptions.some(
        (option) => option.value === selectedCurrency
      );
      if (!isCurrencyAvailable) {
        setSelectedCurrency(undefined);
      }
    }
  }, [selectedEntity, selectedCurrency, filteredCurrencyOptions]);

  // Reset selected entity and currency when they change
  useEffect(() => {
    // If entity changes, clear currency selection to avoid conflicts
    if (selectedEntity) {
      const availableCurrencies = filteredCurrencyOptions.map(
        (opt) => opt.value
      );
      if (selectedCurrency && !availableCurrencies.includes(selectedCurrency)) {
        setSelectedCurrency(undefined);
      }
    }
  }, [selectedEntity, filteredCurrencyOptions, selectedCurrency]);

  // Transform API data to table format
  const transformApiDataToTableFormat = (
    data: ForecastActualRow[]
  ): DetailedForecastActual[] => {
    // Group by type (Inflow/Outflow)
    const inflowItems = data.filter((item) => item.type === "Inflow");
    const outflowItems = data.filter((item) => item.type === "Outflow");

    const result: DetailedForecastActual[] = [];

    // Create Inflow group
    if (inflowItems.length > 0) {
      const inflowTotal = {
        forecast: inflowItems.reduce((sum, item) => sum + item.forecast, 0),
        actual: inflowItems.reduce((sum, item) => sum + item.actual, 0),
        variance: inflowItems.reduce((sum, item) => sum + item.variance, 0),
      };

      result.push({
        category: "Inflow",
        forecast: inflowTotal.forecast.toLocaleString(),
        actual: inflowTotal.actual.toLocaleString(),
        variance: Math.abs(inflowTotal.variance).toLocaleString(),
        varianceRaw: inflowTotal.variance,
        total: inflowTotal.forecast + inflowTotal.actual,
        subRows: inflowItems.map((item) => ({
          category: item.category,
          forecast: item.forecast.toLocaleString(),
          actual: item.actual.toLocaleString(),
          variance: Math.abs(item.variance).toLocaleString(),
          varianceRaw: item.variance,
          total: item.forecast + item.actual,
        })),
      });
    }

    // Create Outflow group
    if (outflowItems.length > 0) {
      const outflowTotal = {
        forecast: outflowItems.reduce((sum, item) => sum + item.forecast, 0),
        actual: outflowItems.reduce((sum, item) => sum + item.actual, 0),
        variance: outflowItems.reduce((sum, item) => sum + item.variance, 0),
      };

      result.push({
        category: "Outflow",
        forecast: outflowTotal.forecast.toLocaleString(),
        actual: outflowTotal.actual.toLocaleString(),
        variance: Math.abs(outflowTotal.variance).toLocaleString(),
        varianceRaw: outflowTotal.variance,
        total: outflowTotal.forecast + outflowTotal.actual,
        subRows: outflowItems.map((item) => ({
          category: item.category,
          forecast: item.forecast.toLocaleString(),
          actual: item.actual.toLocaleString(),
          variance: Math.abs(item.variance).toLocaleString(),
          varianceRaw: item.variance,
          total: item.forecast + item.actual,
        })),
      });
    }

    return result;
  };

  // Apply filters to data based on selections
  const filteredApiData = useMemo(() => {
    return getFilteredTableData(apiData);
  }, [apiData, selectedEntity, selectedCurrency]);

  const filteredTableData = useMemo(() => {
    return transformApiDataToTableFormat(filteredApiData);
  }, [filteredApiData]);

  const varianceChartData = useMemo(() => {
    return getFilteredVarianceData(apiData);
  }, [apiData, selectedEntity, selectedCurrency]);

  const filteredClosingBalanceData = useMemo(() => {
    return getFilteredClosingBalanceData(
      byDateData,
      // selectedEntity,
      // selectedCurrency
    );
  }, [byDateData, selectedEntity, selectedCurrency]);

  const [groupBy, setGroupBy] = useState<string[]>([]);
  // const [loading, ] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns: ColumnDef<DetailedForecastActual>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <button
            {...{
              onClick: row.getToggleExpandedHandler(),
              className:
                "flex items-center justify-center ml-4 w-6 h-6 text-primary hover:bg-gray-100 rounded transition focus:outline-none",
              style: { cursor: "pointer" },
              title: row.getIsExpanded() ? "Collapse" : "Expand",
            }}
          >
            {row.getIsExpanded() ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        ) : null,
      // enableSorting: false,
      // enableColumnFilter: false,
      size: 32,
      minSize: 32,
      maxSize: 32,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "forecast",
      header: "Forecast",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "actual",
      header: "Actual",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "variance",
      header: "Variance (Amount)",
      cell: ({ getValue, row }) => {
        const varianceRaw = (row.original as DetailedForecastActual)
          .varianceRaw;
        const colorClass = varianceRaw >= 0 ? "text-green-600" : "text-red-600";
        return <span className={colorClass}>{getValue() as string}</span>;
      },
    },
  ];

  const table = useReactTable({
    data: filteredTableData,
    columns,
    state: {
      grouping: groupBy,
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <Layout title="Forecast vs Actual Dashboard">
      <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
        <div className="flex gap-6 py-4 items-end">
          <div className="w-2/4">
            <CustomSelect
              label="Date Range"
              options={dateOptions}
              selectedValue={selectedDateRange}
              onChange={(option) => setSelectedDateRange(option || "")}
              placeholder="Select date range (required)"
              isClearable={false}
              isRequired={true}
            />
          </div>
          <div className="w-2/4">
            <CustomSelect
              label="Entity"
              options={entityOptions}
              selectedValue={selectedEntity}
              onChange={(option) => setSelectedEntity(option || undefined)}
              placeholder="Select entity"
              isClearable={true}
            />
          </div>

          <div className="flex flex-row w-full pl-40 justify-end gap-4">
            <button
              className={`${
                !selectedDateRange
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-hover"
              } text-white border-2 border-primary text-center rounded px-4 py-2 font-bold transition flex items-center gap-2`}
              onClick={handleGenerateReport}
              disabled={!selectedDateRange || loading}
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
                Please select a date range and click "Generate Report" to view
                data
              </div>
              <div className="text-gray-400 text-sm">
                Date range selection is required. Entity and currency selections
                are optional.
              </div>
            </div>
          </div>
        )}
        {hasGeneratedReport && selectedDateRange && (
          <>
            <div className="flex w-full gap-6 my-8">
              <StatCard
                title="Forecasted Net Flow"
                value={
                  loading
                    ? "Loading..."
                    : kpiData
                    ? kpiData.forecast_net.toLocaleString()
                    : "N/A"
                }
                bgColor="bg-gradient-to-tl from-[#4dc9bf] to-[#073f40CC]"
              />
              <StatCard
                title="Actual Net Flow"
                value={
                  loading
                    ? "Loading..."
                    : kpiData
                    ? kpiData.actual_net.toLocaleString()
                    : "N/A"
                }
                bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
              />
              <StatCard
                title="Net Variance (Amount)"
                value={
                  loading
                    ? "Loading..."
                    : kpiData
                    ? Math.abs(kpiData.net_variance).toLocaleString()
                    : "N/A"
                }
                bgColor="bg-gradient-to-br from-[#0d6d69CC] to-[#0a5755B3]"
              />
              <StatCard
                title="Net Variance (%)"
                value={
                  loading
                    ? "Loading..."
                    : kpiData
                    ? `${kpiData.net_variance_pct.toFixed(2)}%`
                    : "N/A"
                }
                bgColor="bg-gradient-to-tr from-red-400 to-red-500"
              />
            </div>
            <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-10 items-stretch">
              <div
                className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
                style={{ minWidth: 0, minHeight: 0, height: 480 }}
              >
                <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                  Closing Balance Trend
                </h2>

                <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
                  <div className="w-full h-[340px] max-w-full">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">
                          Loading chart data...
                        </div>
                      </div>
                    ) : filteredClosingBalanceData.length > 0 &&
                      filteredClosingBalanceData[0].data.length > 0 ? (
                      <ResponsiveLine
                        data={filteredClosingBalanceData}
                        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                        yScale={{
                          type: "linear",
                          min: "auto",
                          max: "auto",
                          stacked: false,
                          reverse: false,
                        }}
                        axisBottom={{ legend: "Date", legendOffset: 40 }}
                        axisLeft={{ legend: "Amount", legendOffset: -50 }}
                        pointSize={10}
                        pointColor={{ theme: "background" }}
                        pointBorderWidth={2}
                        pointBorderColor={{ from: "seriesColor" }}
                        pointLabelYOffset={-12}
                        enableTouchCrosshair={true}
                        useMesh={true}
                        legends={[
                          {
                            anchor: "bottom-right",
                            direction: "column",
                            translateX: 100,
                            itemWidth: 80,
                            itemHeight: 22,
                            symbolShape: "circle",
                          },
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">No data available</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
                style={{ minWidth: 0, minHeight: 0, height: 480 }}
              >
                <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                  Variance by Category
                </h2>
                <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
                  <div className="w-full h-[340px] max-w-full">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">
                          Loading chart data...
                        </div>
                      </div>
                    ) : varianceChartData.length > 0 ? (
                      <ResponsiveBar
                        {...getDivergingCommonProps(varianceChartData)}
                        markers={[
                          {
                            axis: "y",
                            value: 0,
                            legendPosition: "top-left",
                          },
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">No data available</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {hasGeneratedReport && selectedDateRange && (
        <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
          <div className="space-y-4">
            <div className=" gap-3 flex flex-col">
              <h2 className="text-xl font-semibold text-primary-lt pt-6">
                Detailed Forecast vs Actual Report
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
                  {/* <div className="relative top-2.5">
                  <ColumnPicker table={table} />
                </div> */}
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
              <NyneOSTableExpanded<DetailedForecastActual>
                data={filteredTableData}
                columns={columns}
                getSubRows={(row) => row.subRows}
                expandLevel={2}
              >
                <tfoot className="bg-primary font-semibold sticky bottom-0 z-10">
                  <tr>
                    {(() => {
                      // Calculate totals for forecast, actual, and variance columns
                      let forecastTotal = 0;
                      let actualTotal = 0;
                      let varianceTotal = 0;
                      filteredTableData.forEach((row) => {
                        // Remove commas and parse as number
                        const forecast = Number(
                          (row.forecast || "0").replace(/,/g, "")
                        );
                        const actual = Number(
                          (row.actual || "0").replace(/,/g, "")
                        );
                        // Use raw variance value for calculation
                        const variance = row.varianceRaw || 0;
                        forecastTotal += isNaN(forecast) ? 0 : forecast;
                        actualTotal += isNaN(actual) ? 0 : actual;
                        varianceTotal += isNaN(variance) ? 0 : variance;
                      });
                      return table.getVisibleLeafColumns().map((col) => {
                        let value = null;
                        let colorClass = "";
                        if (col.id === "category") value = "Total";
                        else if (col.id === "forecast")
                          value = forecastTotal.toLocaleString();
                        else if (col.id === "actual")
                          value = actualTotal.toLocaleString();
                        else if (col.id === "variance")
                          value =
                            (varianceTotal > 0 ? "" : "-") +
                            Math.abs(varianceTotal).toLocaleString();
                        return (
                          <td
                            key={col.id}
                            className={`px-6 py-2 text-white text-sm text-start border-t border-border `}
                          >
                            {value}
                          </td>
                        );
                      });
                    })()}
                  </tr>
                </tfoot>
              </NyneOSTableExpanded>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ForecastActualDashboard;
