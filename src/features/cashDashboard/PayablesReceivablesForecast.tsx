import { BadgePlus } from "lucide-react";
import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { useState, useEffect, useMemo } from "react";
import { Download, FileDown, FileText } from "lucide-react";
import { ColumnPicker } from "../../components/ui/ColumnPicker";
import { ResponsiveBar } from "@nivo/bar";

import nos from "../../utils/nos";

import Pagination from "../../components/table/Pagination";

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getSortedRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
} from "@tanstack/react-table";
import StatCard from "./StatCard";
import NyneOSTable2 from "./NyneOSTable2";
// import { get } from "react-hook-form";

const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || "";

export type DetailedForecast = {
  counterparty: string;
  type: string;
  invoice_no: string;
  due_date: string;
  amount: number;
  entity?: string;
};

export type PayablesReceivablesData = {
  date_range: string;
  entities: {
    entity: string;
    counterparties: {
      name: string;
      currencies: {
        type: "Receivable" | "Payable";
        currency: string;
        amount: number;
      }[];
    }[];
  }[];
};

// No longer using mock data, will fetch from API

// const DetailedForecastMockData: DetailedForecast[] = [];

// --- Helper functions for filters and chart data ---
function getDateRangeOptions(apiData: PayablesReceivablesData[]) {
  return apiData.map((d) => ({ value: d.date_range, label: d.date_range }));
}
function getEntityOptions(
  apiData: PayablesReceivablesData[],
  dateRange?: string
) {
  const found = apiData.find((d) => d.date_range === dateRange);
  if (!found) return [];
  return found.entities.map((e) => ({ value: e.entity, label: e.entity }));
}
function getCounterpartyOptions(
  apiData: PayablesReceivablesData[],
  dateRange?: string,
  entity?: string
) {
  const found = apiData.find((d) => d.date_range === dateRange);
  if (!found) return [];
  const ent = found.entities.find((e) => e.entity === entity);
  if (!ent) return [];
  return ent.counterparties.map((c) => ({ value: c.name, label: c.name }));
}
function getCurrencyOptions(
  apiData: PayablesReceivablesData[],
  dateRange?: string,
  entity?: string,
  counterparty?: string
) {
  const found = apiData.find((d) => d.date_range === dateRange);
  if (!found) return [];
  const ent = entity
    ? found.entities.find((e) => e.entity === entity)
    : undefined;
  let currencies: string[] = [];
  if (ent) {
    if (counterparty) {
      const cp = ent.counterparties.find((c) => c.name === counterparty);
      if (cp) {
        currencies = cp.currencies.map((c) => c.currency);
      }
    } else {
      currencies = ent.counterparties.flatMap((c) =>
        c.currencies.map((cc) => cc.currency)
      );
    }
  } else {
    currencies = found.entities.flatMap((e) =>
      e.counterparties.flatMap((c) => c.currencies.map((cc) => cc.currency))
    );
  }
  return Array.from(new Set(currencies)).map((c) => ({ value: c, label: c }));
}

// Chart data helpers
function getInflowOutflowBarData(
  apiData: PayablesReceivablesData[],
  dateRange?: string,
  entity?: string,
  counterparty?: string,
  currency?: string
) {
  // Dynamically group by 4 weeks (30 days), 8 weeks (60 days), or 3 months (quarter)
  const found = apiData.find((d) => d.date_range === dateRange) || apiData[0];
  if (!found) return [];
  let counterparties = found.entities.flatMap((e) => {
    if (entity && e.entity !== entity) return [];
    return e.counterparties.filter((c) => {
      if (counterparty && c.name !== counterparty) return false;
      return true;
    });
  });
  if (currency) {
    counterparties = counterparties.map((c) => ({
      ...c,
      currencies: c.currencies.filter((cc) => cc.currency === currency),
    }));
  }
  // Flatten all currency rows for splitting
  let inflowRows: number[] = [];
  let outflowRows: number[] = [];
  for (const c of counterparties) {
    for (const cur of c.currencies) {
      if (cur.type === "Receivable") inflowRows.push(cur.amount);
      else outflowRows.push(Math.abs(cur.amount));
    }
  }
  let groupCount = 4;
  let labelPrefix = "Week";
  if (dateRange && dateRange.toLowerCase().includes("60")) {
    groupCount = 8;
    labelPrefix = "Week";
  } else if (dateRange && dateRange.toLowerCase().includes("quarter")) {
    groupCount = 3;
    labelPrefix = "Month";
  }
  // Distribute inflows and outflows evenly across groups
  const inflowChunkSize = Math.ceil(inflowRows.length / groupCount) || 1;
  const outflowChunkSize = Math.ceil(outflowRows.length / groupCount) || 1;
  let weekData: { week: string; Inflows: number; Outflows: number }[] = [];
  for (let i = 0; i < groupCount; i++) {
    const inflowChunk = inflowRows.slice(
      i * inflowChunkSize,
      (i + 1) * inflowChunkSize
    );
    const outflowChunk = outflowRows.slice(
      i * outflowChunkSize,
      (i + 1) * outflowChunkSize
    );
    const inflow = inflowChunk.reduce((sum, v) => sum + v, 0);
    const outflow = outflowChunk.reduce((sum, v) => sum + v, 0);
    weekData.push({
      week: `${labelPrefix} ${i + 1}`,
      Inflows: inflow,
      Outflows: outflow,
    });
  }
  return weekData;
}
function getAgingAnalysisBarData(
  apiData: PayablesReceivablesData[],
  dateRange?: string,
  entity?: string,
  counterparty?: string,
  currency?: string
) {
  // Group by due date buckets: 0-7, 8-15, 16-30, >30 days
  // For mock, randomly assign to buckets (since due_date is '-')
  const found = apiData.find((d) => d.date_range === dateRange) || apiData[0];
  if (!found) return [];
  let counterparties = found.entities.flatMap((e) => {
    if (entity && e.entity !== entity) return [];
    return e.counterparties.filter((c) => {
      if (counterparty && c.name !== counterparty) return false;
      return true;
    });
  });
  if (currency) {
    counterparties = counterparties.map((c) => ({
      ...c,
      currencies: c.currencies.filter((cc) => cc.currency === currency),
    }));
  }
  // Buckets
  const buckets = [
    { label: "0-7 Days", min: 0, max: 7 },
    { label: "8-15 Days", min: 8, max: 15 },
    { label: "16-30 Days", min: 16, max: 30 },
    { label: ">30 Days", min: 31, max: Infinity },
  ];
  // For mock, assign each currency randomly to a bucket
  let bucketData: {
    [label: string]: { Receivables: number; Payables: number };
  } = {};
  buckets.forEach(
    (b) => (bucketData[b.label] = { Receivables: 0, Payables: 0 })
  );
  let i = 0;
  for (const c of counterparties) {
    for (const cur of c.currencies) {
      // In real: parse due_date and calculate daysDiff
      // For mock: assign round-robin
      const bucketIdx = i % buckets.length;
      const bucket = buckets[bucketIdx];
      if (cur.type === "Receivable")
        bucketData[bucket.label].Receivables += Math.abs(cur.amount);
      else bucketData[bucket.label].Payables += Math.abs(cur.amount);
      i++;
    }
  }
  // Convert to nivo format
  return buckets.map((b) => ({
    status: b.label,
    Receivables: bucketData[b.label].Receivables,
    Payables: bucketData[b.label].Payables,
  }));
}

const PayableReceivablesForecast = () => {
  // --- State for filters ---
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [searchTerm, ] = useState("");

  // Filters
  const [apiData, setApiData] = useState<PayablesReceivablesData[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<
    string | undefined
  >(undefined);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  );
  const [selectedCounterparty, setSelectedCounterparty] = useState<
    string | undefined
  >(undefined);
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(
    undefined
  );

  // Fetch forecast data for charts/filters
  // useEffect(() => {
  //   const fetchForecast = async () => {
  //     setLoading(true);
  //     try {
  //       type ForecastApiResponse = {
  //         rows: PayablesReceivablesData[];
  //         success?: boolean;
  //       };
  //       const res = await nos.post<ForecastApiResponse>(`${apiBaseUrl}/dash/payrec/forecast`);
  //       if (res.data && Array.isArray(res.data.rows)) {
  //         setApiData(res.data.rows);
  //         // Set default date range if not set
  //         if (!selectedDateRange && res.data.rows.length > 0) {
  //           setSelectedDateRange(res.data.rows[0].date_range);
  //         }
  //       } else {
  //         setApiData([]);
  //       }
  //     } catch (e) {
  //       setApiData([]);
  //     }
  //     setLoading(false);
  //   };
  //   fetchForecast();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);


    // --- Stats calculation based on selected date range ---
    function getStatsForDateRange(apiData: PayablesReceivablesData[], dateRange?: string) {
      const found = apiData.find((d) => d.date_range === dateRange);
      if (!found || !found.entities || found.entities.length === 0) {
        return {
          totalReceivables: null,
          totalPayables: null,
          netWorkingCapital: null,
          overduePayables: null, // Not available in current data
        };
      }
      let totalReceivables = 0;
      let totalPayables = 0;
      // Loop through all entities and counterparties
      for (const entity of found.entities) {
        for (const counterparty of entity.counterparties) {
          for (const currency of counterparty.currencies) {
            if (currency.type === "Receivable") {
              totalReceivables += Math.abs(currency.amount);
            } else if (currency.type === "Payable") {
              totalPayables += Math.abs(currency.amount);
            }
          }
        }
      }
      return {
        totalReceivables,
        totalPayables,
        netWorkingCapital: totalReceivables - totalPayables,
        overduePayables: null, 
      };
    }

    const stats = useMemo(() => getStatsForDateRange(apiData, selectedDateRange), [apiData, selectedDateRange]);

    // --- Chart data ---
    const InflowOutflowBarData = useMemo(
      () =>
        getInflowOutflowBarData(
          apiData,
          selectedDateRange,
          selectedEntity,
          selectedCounterparty,
          selectedCurrency
        ),
      [
        apiData,
        selectedDateRange,
        selectedEntity,
        selectedCounterparty,
        selectedCurrency,
      ]
    );
    const AgingAnalysisBarData = useMemo(
      () =>
        getAgingAnalysisBarData(
          apiData,
          selectedDateRange,
          selectedEntity,
          selectedCounterparty,
          selectedCurrency
        ),
      [
        apiData,
        selectedDateRange,
        selectedEntity,
        selectedCounterparty,
        selectedCurrency,
      ]
    );

  // --- Table data (from API) ---
  const [data, setData] = useState<DetailedForecast[]>([]);
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);
  //     try {
  //       type ApiResponse = {
  //         rows: DetailedForecast[];
  //         success?: boolean;
  //       };
  //       const res = await nos.post<ApiResponse>(`${apiBaseUrl}/dash/payrec/rows`);
  //       if (res.data && Array.isArray(res.data.rows)) {
  //         setData(res.data.rows);
  //       } else {
  //         setData([]);
  //       }
  //     } catch (e) {
  //       setData([]);
  //     }
  //     setLoading(false);
  //   };
  //   fetchData();
  // }, []);
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch detailed rows
        type ApiResponse = {
          rows: DetailedForecast[];
          success?: boolean;
        };
        const resRows = await nos.post<ApiResponse>(
          `${apiBaseUrl}/dash/payrec/rows`
        );
        if (resRows.data && Array.isArray(resRows.data.rows)) {
          setData(resRows.data.rows);
        } else {
          setData([]);
        }

        // Fetch forecast
        type ForecastApiResponse = {
          rows: PayablesReceivablesData[];
          success?: boolean;
        };
        const resForecast = await nos.post<ForecastApiResponse>(
          `${apiBaseUrl}/dash/payrec/forecast`
        );
        if (resForecast.data && Array.isArray(resForecast.data.rows)) {
          setApiData(resForecast.data.rows);
          if (!selectedDateRange && resForecast.data.rows.length > 0) {
            setSelectedDateRange(resForecast.data.rows[0].date_range);
          }
        } else {
          setApiData([]);
        }
      } catch (e) {
        setData([]);
        setApiData([]);
      }
      setLoading(false);
    };
    fetchAll();
    
  }, []);
  const columns: ColumnDef<DetailedForecast>[] = [
    {
      accessorKey: "counterparty",
      header: "Counterparty",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "invoice_no",
      header: "Invoice #",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "entity",
      header: "Entity",
      cell: ({ getValue }) => <span>{(getValue() as string) || "-"}</span>,
    },
    {
      accessorKey: "amount",
      header: "Amount (INR)",
      cell: ({ getValue }) => (
        <span>{(getValue() as number).toLocaleString("en-IN")}</span>
      ),
    },
  ];

  // Add statusOptions for filter dropdown (if needed in future)
  // const statusOptions = useMemo(() => {
  //   const options = new Set<string>();
  //   data.forEach((item) => {
  //     if ((item as any).processing_status) options.add((item as any).processing_status);
  //   });
  //   return ["All", ...Array.from(options)];
  // }, [data]);

  // Filtering logic (search)
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

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      grouping: groupBy,
    },
    onGroupingChange: setGroupBy,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <Layout title="Payables & Receivables Forecast">
        <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
          <div className="flex gap-6 py-4 items-end">
            <CustomSelect
              label="Date Range"
              options={getDateRangeOptions(apiData)}
              selectedValue={selectedDateRange}
              onChange={(option) => {
                setSelectedDateRange(option || undefined);
                setSelectedEntity(undefined);
                setSelectedCounterparty(undefined);
                setSelectedCurrency(undefined);
              }}
              placeholder="Select date range"
              isClearable={true}
            />
            <CustomSelect
              label="Entity Type"
              options={getEntityOptions(apiData, selectedDateRange)}
              selectedValue={selectedEntity}
              onChange={(option) => {
                setSelectedEntity(option || undefined);
                setSelectedCounterparty(undefined);
                setSelectedCurrency(undefined);
              }}
              placeholder="Select entity"
              isClearable={true}
              isDisabled={!selectedDateRange}
            />
            <CustomSelect
              label="Counterparty"
              options={getCounterpartyOptions(
                apiData,
                selectedDateRange,
                selectedEntity
              )}
              selectedValue={selectedCounterparty}
              onChange={(option) => {
                setSelectedCounterparty(option || undefined);
                setSelectedCurrency(undefined);
              }}
              placeholder="Select counterparty"
              isClearable={true}
              isDisabled={!selectedDateRange}
            />
            <CustomSelect
              label="Currency"
              options={getCurrencyOptions(
                apiData,
                selectedDateRange,
                selectedEntity,
                selectedCounterparty
              )}
              selectedValue={selectedCurrency}
              onChange={(option) => setSelectedCurrency(option || undefined)}
              placeholder="Select currency"
              isClearable={true}
              isDisabled={!selectedDateRange}
            />
            <div className="flex flex-row w-full pl-40 justify-end gap-4">
              <button
                // onClick={fetchData}
                className="bg-primary hover:bg-primary-hover text-white border-2 border-primary text-center rounded px-4 py-2 font-bold transition flex items-center gap-2"
              >
                <BadgePlus className="w-5 h-5" />
                {loading ? "Generating Report..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
          {/* Stat Cards */}
          <div className="flex w-full gap-6 my-8">
            <StatCard
              title="Total Receivables"
              value={
                loading
                  ? "Loading..."
                  : stats.totalReceivables === null
                  ? "No Data"
                  : stats.totalReceivables.toLocaleString("en-IN")
              }
              bgColor="bg-gradient-to-tl from-[#4dc9bf] to-[#073f40CC]"
            />
            <StatCard
              title="Total Payables"
              value={
                loading
                  ? "Loading..."
                  : stats.totalPayables === null
                  ? "No Data"
                  : stats.totalPayables.toLocaleString("en-IN")
              }
              bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
            />
            <StatCard
              title="Net Working Capital"
              value={
                loading
                  ? "Loading..."
                  : stats.netWorkingCapital === null
                  ? "No Data"
                  : stats.netWorkingCapital.toLocaleString("en-IN")
              }
              bgColor="bg-gradient-to-br from-[#0d6d69CC] to-[#0a5755B3]"
            />
            <StatCard
              title="Overdue Payables"
              value={loading ? "Loading..." : "0"}
              bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
            />
          </div>

          <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-10 items-stretch">
            <div
              className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
              style={{ minWidth: 0, minHeight: 0, height: 480 }}
            >
              <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                Weekly Inflow vs. Outflow
              </h2>
              <ResponsiveBar
                data={InflowOutflowBarData}
                indexBy="week"
                keys={["Inflows", "Outflows"]}
                colors={({ id }) => (id === "Inflows" ? "#22c55e" : "#ef4444")}
                groupMode="grouped"
                labelSkipHeight={16}
                labelSkipWidth={16}
                labelTextColor="#fff"
                margin={{
                  bottom: 100,
                  left: 80,
                  right: 50,
                  top: 40,
                }}
                onClick={() => {}}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                padding={0.2}
                legends={[
                  {
                    dataFrom: "keys",
                    anchor: "bottom",
                    direction: "row",
                    justify: false,
                    translateY: 50,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemsSpacing: 2,
                    symbolSize: 20,
                    itemDirection: "left-to-right",
                    effects: [
                      {
                        on: "hover",
                        style: {
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
              />
              <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
                <div className="w-full h-[340px] max-w-full"></div>
              </div>
            </div>
            <div
              className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
              style={{ minWidth: 0, minHeight: 0, height: 480 }}
            >
              <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                Aging Analysis
              </h2>
              <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
                <div className="w-full h-[420px] max-w-full">
                  <ResponsiveBar
                    data={AgingAnalysisBarData}
                    indexBy="status"
                    keys={["Receivables", "Payables"]}
                    colors={({ id }) =>
                      id === "Receivables" ? "#22c55e" : "#ef4444"
                    }
                    groupMode="grouped"
                    layout="horizontal"
                    enableGridY={false}
                    enableGridX={true}
                    labelSkipHeight={16}
                    labelSkipWidth={16}
                    labelTextColor="#fff"
                    margin={{
                      bottom: 60,
                      left: 80,
                      right: 50,
                      top: 40,
                    }}
                    onClick={() => {}}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    padding={0.2}
                    legends={[
                      {
                        dataFrom: "keys",
                        anchor: "bottom",
                        direction: "row",
                        justify: false,
                        translateY: 50,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemsSpacing: 2,
                        symbolSize: 20,
                        itemDirection: "left-to-right",
                        effects: [
                          {
                            on: "hover",
                            style: {
                              itemOpacity: 1,
                            },
                          },
                        ],
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
          <div className="space-y-4">
            <div className=" gap-3 flex flex-col">
              <h2 className="text-xl font-semibold text-primary-lt pt-6">
                Detailed Forecast
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
                    {table.getVisibleLeafColumns().map((col) => (
                      <td
                        key={col.id}
                        className="px-6 py-2 text-white text-sm text-start border-t border-border"
                      >
                        {{
                          counterparty: "Grand Total",
                          amount: table
                            .getRowModel()
                            .rows.reduce(
                              (sum, row) =>
                                sum +
                                (typeof row.getValue === "function"
                                  ? Number(row.getValue("amount"))
                                  : 0),
                              0
                            )
                            .toLocaleString("en-IN"),
                        }[col.id] ?? null}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </NyneOSTable2>
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
          </div>
        </div>
      </Layout>
    </>
  );
};
export default PayableReceivablesForecast;
