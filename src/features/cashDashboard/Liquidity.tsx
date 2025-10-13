import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect.tsx";
import { useMemo, useState, useEffect } from "react";
import { Mail, FileText, Download, FileDown, BadgePlus } from "lucide-react";
// import { exportToExcel, exportToPDF } from "../../utils/exportToExcel";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { RotateCcw } from "lucide-react";
import StatCard from "./StatCard";
import NyneOSTable2 from "./NyneOSTable2";
import nos from "../../utils/nos";
import { useNotification } from "../../app/providers/NotificationProvider/Notification.tsx";
import Pagination from "../../components/table/Pagination";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

import {
  // flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getPaginationRowModel,
} from "@tanstack/react-table";

const colorPalette = [
  "hsl(174, 70%, 50%)",
  "hsl(285, 70%, 50%)",
  "hsl(327, 70%, 50%)",
  "hsl(50, 70%, 50%)",
  "hsl(210, 70%, 50%)",
];
const getColor = (idx: number) => colorPalette[idx % colorPalette.length];

// Types for bar chart API data
type EntityCurrencyData = {
  entity_name: string;
  currency_code: string;
  total_balance: number;
  normalized_total: number;
};

type BarDataRow = { entity: string; [currency: string]: string | number };

function getBarData(
  data: EntityCurrencyData[],
  selectedEntity?: string,
  selectedCurrency?: string
): BarDataRow[] {
  // Filter out data with zero or undefined values
  const filteredData = data.filter(item => item.normalized_total && item.normalized_total > 0);
  
  // Get unique currencies that have non-zero values
  const allCurrencies = Array.from(
    new Set(filteredData.map((item) => item.currency_code))
  );
  
  // Group data by entity
  const groupedByEntity = filteredData.reduce((acc, item) => {
    if (!acc[item.entity_name]) {
      acc[item.entity_name] = {};
    }
    acc[item.entity_name][item.currency_code] = item.normalized_total;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return Object.entries(groupedByEntity)
    .filter(([entity]) => !selectedEntity || entity === selectedEntity)
    .map(([entity, currencies]) => {
      const row: BarDataRow = { entity };
      
      allCurrencies.forEach((currency, cIdx) => {
        if (!selectedCurrency || currency === selectedCurrency) {
          const value = currencies[currency];
          if (value && value > 0) {
            row[currency] = value;
            row[`${currency}Color`] = getColor(cIdx);
          }
        }
      });
      
      return row;
    });
}

// Removed getPieData and all mockData references

const timeOptions = [
  { value: "next7days", label: "Next 7 Days", days: 7 },
  { value: "next14days", label: "Next 14 Days", days: 14 },
  { value: "next30days", label: "Next 30 Days", days: 30 },
];

export interface detailedDailyCashFlow {
  date: string;
  opening_balance: number;
  inflows: number;
  outflows: number;
  net_flow: number;
  closing_balance: number;
}

export interface LiquidityKPI {
  total_cash_balance: number;
  liquidity_coverage: number;
  surplus_deficit: boolean;
  min_projected_closing: number;
  net_position_today: number;
}

function Liquidity() {
  // Time horizon state
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  );
  const [selectedBank] = useState<string | undefined>(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(
    undefined
  );
  const [data, setData] = useState<detailedDailyCashFlow[]>([]);
  const [barChartRawData, setBarChartRawData] = useState<EntityCurrencyData[]>(
    []
  );
  const [currencies, setCurrencies] = useState<{ value: string; label: string }[]>([]);
  const [kpiData, setKpiData] = useState<LiquidityKPI | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);
  const [entityOptions, setEntityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [currencyOptions, setCurrencyOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { notify } = useNotification();

  const columns: ColumnDef<detailedDailyCashFlow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "opening_balance",
      header: "Opening Balance",
      cell: ({ getValue }) => {
        const value = getValue() as number;
        const isNegative = value < 0;
        return (
          <span
            className={
              isNegative
                ? "text-red-600 font-semibold"
                : "text-green-600 font-semibold"
            }
          >
            {Math.abs(value).toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "inflows",
      header: "Inflows",
      cell: ({ getValue }) => <span>{(getValue() as number).toFixed(2)}</span>,
    },
    {
      accessorKey: "outflows",
      header: "Outflows",
      cell: ({ getValue }) => <span>{(getValue() as number).toFixed(2)}</span>,
    },
    {
      accessorKey: "net_flow",
      header: "Net Flow",
      cell: ({ getValue }) => {
        const value = getValue() as number;
        const isNegative = value < 0;
        return (
          <span
            className={
              isNegative
                ? "text-red-600 font-semibold"
                : "text-green-600 font-semibold"
            }
          >
            {Math.abs(value).toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "closing_balance",
      header: "Closing Balance",
      cell: ({ getValue }) => {
        const value = getValue() as number;
        const isNegative = value < 0;
        return (
          <span
            className={
              isNegative
                ? "text-red-600 font-semibold"
                : "text-green-600 font-semibold"
            }
          >
            {Math.abs(value).toFixed(2)}
          </span>
        );
      },
    },
  ];

  const columnAccessorKeys = columns
    .filter(
      (col): col is { accessorKey: string } =>
        "accessorKey" in col && typeof col.accessorKey === "string"
    )
    .map((col) => col.accessorKey);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
    manualPagination: false,
    pageCount: Math.ceil(data.length / pagination.pageSize),
  });

  // const totalAmount = useMemo(() => {
  //   return 0;
  // }, [data]);

  // Compute chart data
  const barData = useMemo(
    () => getBarData(barChartRawData, selectedEntity, selectedCurrency),
    [barChartRawData, selectedEntity, selectedCurrency]
  );

  // Area graph: generate real data from API based on selected time horizon
  const selectedTimeObj =
    timeOptions.find((t) => t.value === selectedTime) || timeOptions[0];
  const areaGraphLabel = selectedTime ? selectedTimeObj.label : "";
  const areaGraphDays = selectedTime ? selectedTimeObj.days : 0;

  // Transform API data for ResponsiveLine chart
  const areaGraphData = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        {
          id: "Net Liquidity",
          color: "hsl(194, 70%, 50%)",
          data: [],
        },
      ];
    }

    // Filter data based on selected time horizon
    const today = new Date();
    const filteredData = data.filter((item) => {
      const itemDate = new Date(item.date);
      const daysDiff = Math.ceil(
        (itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff >= 0 && daysDiff < areaGraphDays;
    });

    // Sort by date to ensure proper line chart ordering
    const sortedData = filteredData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return [
      {
        id: "Net Liquidity",
        color: "hsl(194, 70%, 50%)",
        data: sortedData.map((item) => ({
          x: new Date(item.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }),
          y: item.net_flow,
        })),
      },
    ];
  }, [data, areaGraphDays]);

  // Calculate y-axis range based on data
  const yAxisRange = useMemo(() => {
    if (areaGraphData[0]?.data.length === 0) {
      return { min: "auto" as const, max: "auto" as const };
    }

    const values = areaGraphData[0].data.map((d) => d.y as number);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Add 10% padding to the range for better visualization
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.1, Math.abs(minValue * 0.1)); // At least 10% of range or 10% of absolute min value

    return {
      min: minValue - padding,
      max: maxValue + padding,
    };
  }, [areaGraphData]);

  // Get all unique currencies for bar chart keys
  const allCurrencies = useMemo(
    () =>
      Array.from(
        new Set(
          barChartRawData.map((item: EntityCurrencyData) => item.currency_code)
        )
      ) as string[],
    [barChartRawData]
  );

  // Get filtered currency options based on selected entity
  const filteredCurrencyOptions = useMemo(() => {
    if (!selectedEntity || barChartRawData.length === 0) {
      // If no entity selected, show all currencies
      return currencyOptions;
    }
    
    // If entity is selected, only show currencies that have data for that entity
    const entityCurrencies = barChartRawData
      .filter(item => item.entity_name === selectedEntity && item.normalized_total > 0)
      .map(item => item.currency_code);
    
    const uniqueEntityCurrencies = Array.from(new Set(entityCurrencies));
    
    return uniqueEntityCurrencies.map(currency => ({ 
      value: currency, 
      label: currency 
    }));
  }, [selectedEntity, barChartRawData, currencyOptions]);

  const fetchData = async () => {
    if (!selectedTime) {
      notify("Please select a time horizon before generating report.", "error");
      return;
    }

    setLoading(true);
    try {
      // Get the selected time option to extract the days value
      const selectedTimeOption = timeOptions.find(option => option.value === selectedTime);
      const horizonDays = selectedTimeOption ? selectedTimeOption.days : 0;

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

      // Fetch KPI data
      const kpiResponse = await nos.post<LiquidityKPI>(
        `${apiBaseUrl}/dash/liquidity/kpi`,
        requestBody
      );
      if (kpiResponse.data) {
        setKpiData(kpiResponse.data);
      }

      // Fetch bar chart data
      const barResponse = await nos.post<EntityCurrencyData[]>(
        `${apiBaseUrl}/dash/liquidity/entity-currency-wise-cash`,
        requestBody
      );
      if (Array.isArray(barResponse.data)) {
        setBarChartRawData(barResponse.data);

        // Populate entity options
        // const entities = Array.from(
        //   new Set(barResponse.data.map((item) => item.entity_name))
        // );
        // setEntityOptions(
        //   entities.map((entity) => ({ value: entity, label: entity }))
        // );

        // Populate currency options
        const currencies = Array.from(
          new Set(barResponse.data.map((item) => item.currency_code))
        );
        setCurrencyOptions(
          currencies.map((currency) => ({ value: currency, label: currency }))
        );
      }

      // Fetch table data
      const response = await nos.post<detailedDailyCashFlow[]>(
        `${apiBaseUrl}/dash/liquidity/daily`,
        requestBody
      );
      if (Array.isArray(response.data)) {
        setData(response.data);
        setHasGeneratedReport(true);
        // Reset pagination to first page when new data is loaded
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      } else {
        notify("Failed to fetch daily cash flow data.", "error");
      }
    } catch {
      notify("Network error. Please try again.", "error");
    }
    setLoading(false);
  };

  const handleGenerateReport = () => {
    fetchData();
  };

  // Reset data only when time horizon changes
  useEffect(() => {
    if (hasGeneratedReport) {
      setHasGeneratedReport(false);
      setData([]);
      setBarChartRawData([]);
      setKpiData(null);
      // Reset pagination when data is cleared
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }
  }, [selectedTime]);

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
    <Layout title="Liquidity Dashboard">
      <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
        <div className="flex gap-4 py-4 items-end">
          <CustomSelect
            label="Time Horizon"
            options={timeOptions}
            selectedValue={selectedTime}
            onChange={(option) =>
              setSelectedTime(option || "")
            }
            placeholder="Select time horizon (required)"
            isClearable={false}
            isRequired={true}
          />

          <CustomSelect
            label="Entity"
            options={entityOptions}
            selectedValue={selectedEntity}
            onChange={(option) => setSelectedEntity(option ? option : undefined)}
            placeholder="Select entity"
            isClearable={true}
          />

          <CustomSelect
            label="View in Currency"
            options={currencies}
            selectedValue={selectedCurrency}
            onChange={(option) => setSelectedCurrency(option ? option : undefined)}
            placeholder="Select currency"
            isClearable={true}
          />

          <div className="flex flex-row w-full pl-40 justify-end gap-4">
            <button 
              className={`${
                !selectedTime 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-primary hover:bg-primary-hover"
              } text-white border-2 border-primary text-center rounded px-4 py-2 font-bold transition flex items-center gap-2`}
              onClick={handleGenerateReport}
              disabled={!selectedTime || loading}
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
                Please select a time horizon and click "Generate Report" to view data
              </div>
              <div className="text-gray-400 text-sm">
                Time horizon selection is required. Entity and currency selections are optional.
              </div>
            </div>
          </div>
        )}
        {hasGeneratedReport && selectedTime && (
          <>
            <div className="flex w-full gap-6 my-8">
              <StatCard
                title="Total Cash Balance"
                value={
                  loading
                    ? "Loading..."
                    : kpiData
                    ? kpiData.total_cash_balance.toFixed(2)
                    : "N/A"
                }
                bgColor="bg-gradient-to-tl from-[#4dc9bf] to-[#073f40CC]"
              />
              <StatCard
                title="Net Position (Today)"
                value={
                  loading
                    ? "Loading..."
                    : kpiData
                    ? kpiData.net_position_today.toFixed(2)
                    : "N/A"
                }
                bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
              />
              <StatCard
                title="14-Day Liquidity Coverage"
                value={
                  loading
                    ? "Loading..."
                    : kpiData
                    ? `${kpiData.liquidity_coverage.toFixed(2)}%`
                    : "N/A"
                }
                bgColor="bg-gradient-to-br from-[#0d6d69CC] to-[#0a5755B3]"
              />
              <StatCard
                title="Surplus/Deficit Flag"
                value={
                  loading
                    ? "Loading..."
                    : kpiData
                    ? kpiData.surplus_deficit
                      ? "Surplus"
                      : "Deficit"
                    : "N/A"
                }
                bgColor={
                  loading
                    ? "bg-gradient-to-tr from-gray-500 to-gray-600"
                    : kpiData
                    ? kpiData.surplus_deficit
                      ? "bg-gradient-to-tr from-green-500 to-green-600"
                      : "bg-gradient-to-tr from-red-500 to-red-600"
                    : "bg-gradient-to-tr from-gray-500 to-gray-600"
                }
              />
            </div>

            <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-10 items-stretch">
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
            style={{ minWidth: 0, minHeight: 0, height: 480 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Net Liquidity Trend ({areaGraphLabel})
            </h2>
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
              <div className="w-full h-[380px] max-w-full">
                <ResponsiveLine
                  data={areaGraphData}
                  animate
                  curve="monotoneX"
                  defs={[
                    {
                      colors: [
                        {
                          color: "inherit",
                          offset: 0,
                        },
                        {
                          color: "inherit",
                          offset: 100,
                          opacity: 0,
                        },
                      ],
                      id: "gradientA",
                      type: "linearGradient",
                    },
                  ]}
                  enableArea
                  enableSlices="x"
                  enableTouchCrosshair
                  enableGridX={true}
                  enableGridY={true}
                  fill={[
                    {
                      id: "gradientA",
                      match: "*",
                    },
                  ]}
                  initialHiddenIds={[]}
                  margin={{
                    bottom: 60,
                    left: 70,
                    right: 20,
                    top: 20,
                  }}
                  yScale={{
                    type: "linear",
                    min: yAxisRange.min,
                    max: yAxisRange.max,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Net Flow",
                    legendOffset: -60,
                    legendPosition: "middle",
                    format: (value) => {
                      if (Math.abs(value) >= 1000000) {
                        return `${(value / 1000000).toFixed(1)}M`;
                      } else if (Math.abs(value) >= 1000) {
                        return `${(value / 1000).toFixed(1)}K`;
                      }
                      return value.toFixed(0);
                    },
                  }}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: "Date Range",
                    legendOffset: 45,
                    legendPosition: "middle",
                  }}
                  enablePoints={true}
                  pointSize={4}
                  pointColor={{ theme: "background" }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: "serieColor" }}
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
              </div>
            </div>
          </div>
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
            style={{ minWidth: 0, minHeight: 0, height: 480 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Cash Distribution by Entity & Currency
            </h2>
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
              <div className="w-full h-[380px] max-w-full">
                {/* Custom tick renderer for wrapping long x-axis labels */}
                <ResponsiveBar
                  data={
                    selectedEntity
                      ? barData
                          .filter((row) => row.entity === selectedEntity)
                          .map((row) => {
                            // Transform to show currencies for the selected entity
                            const transformedData: any[] = [];
                            allCurrencies.forEach((currency) => {
                              const value = row[currency];
                              if (value && typeof value === 'number' && value > 0) {
                                transformedData.push({
                                  currency,
                                  value: value,
                                  color: row[`${currency}Color`],
                                });
                              }
                            });
                            return transformedData;
                          })
                          .flat()
                      : barData
                  }
                  indexBy={selectedEntity ? "currency" : "entity"}
                  keys={selectedEntity ? ["value"] : allCurrencies}
                  colors={
                    selectedEntity
                      ? (bar) => String(bar.data.color || "#8884d8")
                      : ({ id, data }) => String(data[`${id}Color`] || "#8884d8")
                  }
                  labelSkipHeight={16}
                  labelSkipWidth={16}
                  labelTextColor="inherit:darker(1.4)"
                  margin={{
                    bottom: 80,
                    left: 80,
                    right: 50,
                    top: 40,
                  }}
                  onClick={() => {}}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                  padding={0.2}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    renderTick: (tick) => {
                      const words = String(tick.value).split(" ");
                      const lines = [];
                      let currentLine = "";
                      words.forEach((word) => {
                        if ((currentLine + " " + word).trim().length > 10) {
                          lines.push(currentLine);
                          currentLine = word;
                        } else {
                          currentLine = (currentLine + " " + word).trim();
                        }
                      });
                      if (currentLine) lines.push(currentLine);
                      return (
                        <g transform={`translate(${tick.x},${tick.y + 22})`}>
                          {lines.map((line, i) => (
                            <text
                              key={i}
                              x={0}
                              y={i * 13}
                              textAnchor="middle"
                              dominantBaseline="hanging"
                              style={{ fontSize: 12 }}
                              fill="#555"
                            >
                              {line}
                            </text>
                          ))}
                        </g>
                      );
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {hasGeneratedReport && selectedTime && (
      <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
        <div className="space-y-4">
          <div className=" gap-3 flex flex-col">
            <div className="flex justify-between items-center ">
              <h2 className="text-xl font-semibold text-primary-lt pt-6">
                Detailed Daily Cash Flow
              </h2>
              <div className="flex items-center justify-end gap-x-6">
                <div className="flex relative top-2.5 items-center justify-end gap-x-6">
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Export to Excel"
                    // onClick={handleExportExcel}
                  >
                    <Download className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Export to PDF"
                    // onClick={handleExportPDF}
                  >
                    <FileDown className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Email Report"
                    // onClick={handleEmail}
                  >
                    <Mail className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Email Report"
                    // onClick={handleEmail}
                  >
                    <FileText className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="shadow-lg border border-border">
            <NyneOSTable2<detailedDailyCashFlow>
              table={table}
              columns={columns}
              nonDraggableColumns={columnAccessorKeys}
              nonSortingColumns={columnAccessorKeys}
              //   sections={sections}
            >
              <tfoot className="bg-primary font-semibold sticky bottom-0 z-10">
                <tr>
                  {table.getVisibleLeafColumns().map((col) => {
                    const columnId = col.id;
                    let totalValue = null;

                    if (columnId === "date") {
                      totalValue = "Total";
                    } else if (columnId === "opening_balance") {
                      totalValue = table
                        .getRowModel()
                        .rows.reduce(
                          (sum, row) =>
                            sum + (row.getValue("opening_balance") as number),
                          0
                        )
                        .toFixed(2);
                    } else if (columnId === "net_flow") {
                      totalValue = table
                        .getRowModel()
                        .rows.reduce(
                          (sum, row) =>
                            sum + (row.getValue("net_flow") as number),
                          0
                        )
                        .toFixed(2);
                    } else if (columnId === "closing_balance") {
                      const lastRow =
                        table.getRowModel().rows[
                          table.getRowModel().rows.length - 1
                        ];
                      totalValue = lastRow
                        ? (
                            lastRow.getValue("closing_balance") as number
                          ).toFixed(2)
                        : "0.00";
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
                totalItems={data.length}
                startIndex={
                  data.length === 0
                    ? 0
                    : table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                      1
                }
                endIndex={Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  data.length
                )}
              />
          </div>
        </div>
      </div>
      )}
    </Layout>
  );
}

export default Liquidity;
