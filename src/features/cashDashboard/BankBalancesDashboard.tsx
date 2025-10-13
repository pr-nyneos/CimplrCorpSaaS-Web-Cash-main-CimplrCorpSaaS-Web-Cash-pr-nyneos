import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { useMemo, useState, useEffect } from "react";
import { FileText, Download, FileDown } from "lucide-react";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { saveAs } from "file-saver";
import { RotateCcw } from "lucide-react";
import NyneOSTable2 from "./NyneOSTable2";
import nos from "../../utils/nos";

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getSortedRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
} from "@tanstack/react-table";

import { ColumnPicker } from "../../components/ui/ColumnPicker";

const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || "";

const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  // GBP: "£",
  JPY: "¥",
  AED: "د.إ",
  // Add more as needed
};

function formatCurrency(value: number, currency: string) {
  if (isNaN(value)) return "-";
  // Compact notation for large numbers
  const symbol = currencySymbols[currency] || "";
  return (
    symbol +
    value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      notation: "compact",
    })
  );
}

const columns = [
  {
    accessorKey: "entity",
    header: "Entity",
    cell: ({ getValue }) => <span>{getValue() as string}</span>,
  },
  {
    accessorKey: "bank",
    header: "Bank",
    cell: ({ getValue }) => <span>{getValue() as string}</span>,
  },
  {
    accessorKey: "accountNumber",
    header: "Account Number",
    cell: ({ getValue }) => <span>{getValue() as string}</span>,
  },
  {
    accessorKey: "currency",
    header: "Currency",
    cell: ({ getValue }) => <span>{getValue() as string}</span>,
  },
  {
    accessorKey: "balanceAccountCcy",
    header: "Balance (Account Ccy)",
    cell: ({ row }) =>
      formatCurrency(row.original.balanceAccountCcy, row.original.currency),
  },
  {
    accessorKey: "equivalentINR",
    header: "Equivalent (INR)",
    cell: ({ getValue }) => formatCurrency(getValue() as number, "INR"),
  },
] as ColumnDef<detailedBankBalances>[];

type ApiBankData = {
  entity: string;
  banks: {
    bank: string;
    currencies: { currency: string; balance: number }[];
  }[];
};

// Cimplr teal/white/blue palette for Nivo
// Professional Banking Color System
const colorPalette = [
  "#159588", // Cimplr sidebar teal
  // "#2196f3",
  "#78B9B5", // blue accent
  // blue accent
  // "#388e3c", // strong green
  "#1976d2",
  "#4F959D", // muted teal
  "#71C0BB", // deep blue
  "#43a047", // teal-green
  "#00897b", // dark teal
  "#607d8b", // blue-grey for contrast
  "#455a64", // dark blue-grey// Slate Blue - Neutral for less important data
];
const getColor = (idx: number) => colorPalette[idx % colorPalette.length];

function getBarData(
  data: ApiBankData[],
  selectedEntity?: string,
  selectedBank?: string,
  selectedCurrency?: string
): Record<string, string | number>[] {
  if (!Array.isArray(data)) return [];
  const allBanks = Array.from(
    new Set(data.flatMap((entity) => entity.banks.map((b) => b.bank)))
  );
  return data
    .filter((entity) => !selectedEntity || entity.entity === selectedEntity)
    .map((entity) => {
      const row: Record<string, string | number> = { entity: entity.entity };
      entity.banks.forEach((bank) => {
        if (selectedBank && bank.bank !== selectedBank) return;
        let sum = 0;
        bank.currencies.forEach((c) => {
          if (!selectedCurrency || c.currency === selectedCurrency) {
            sum += c.balance;
          }
        });
        row[bank.bank] = sum;
        row[`${bank.bank}Color`] = getColor(allBanks.indexOf(bank.bank));
      });
      allBanks.forEach((bank, bIdx) => {
        if (!(bank in row)) {
          row[bank] = 0;
          row[`${bank}Color`] = getColor(bIdx);
        }
      });
      return row;
    });
}

function getPieData(
  data: ApiBankData[],
  selectedEntity?: string,
  selectedBank?: string,
  selectedCurrency?: string
): { id: string; label: string; value: number; color: string }[] {
  if (!Array.isArray(data)) return [];
  const currencyMap: Record<string, { value: number; color: string }> = {};
  let colorIdx = 0;
  data.forEach((entity) => {
    if (selectedEntity && entity.entity !== selectedEntity) return;
    entity.banks.forEach((bank) => {
      if (selectedBank && bank.bank !== selectedBank) return;
      bank.currencies.forEach((c) => {
        if (selectedCurrency && c.currency !== selectedCurrency) return;
        if (!currencyMap[c.currency]) {
          currencyMap[c.currency] = {
            value: 0,
            color: getColor(colorIdx++),
          };
        }
        currencyMap[c.currency].value += c.balance;
      });
    });
  });
  return Object.entries(currencyMap).map(([currency, { value, color }]) => ({
    id: currency,
    label: currency,
    value,
    color,
  }));
}

function getEntityOptions(apiData: ApiBankData[]) {
  if (!Array.isArray(apiData)) return [];
  const entities = Array.from(new Set(apiData.map((e) => e.entity)));
  return entities.map((entity) => ({ value: entity, label: entity }));
}
function getBankOptions(apiData: ApiBankData[]) {
  if (!Array.isArray(apiData)) return [];
  const banks = Array.from(
    new Set(apiData.flatMap((e) => e.banks.map((b) => b.bank)))
  );
  return banks.map((bank) => ({ value: bank, label: bank }));
}
function getCurrencyOptions(apiData: ApiBankData[]) {
  if (!Array.isArray(apiData)) return [];
  const currencies = Array.from(
    new Set(
      apiData.flatMap((e) =>
        e.banks.flatMap((b) => b.currencies.map((c) => c.currency))
      )
    )
  );
  return currencies.map((currency) => ({ value: currency, label: currency }));
}

interface detailedBankBalances {
  entity: string;
  bank: string;
  accountNumber: string;
  currency: string;
  balanceAccountCcy: number;
  equivalentINR: number;
}

function BankBalancesDashboard() {
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  );
  const [selectedBank, setSelectedBank] = useState<string | undefined>(
    undefined
  );
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(
    undefined
  );
  const [apiData, setApiData] = useState<ApiBankData[]>([]);
  const [tableData, setTableData] = useState<detailedBankBalances[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch for charts
      const res = await nos.post<ApiBankData[]>(
        `${apiBaseUrl}/dash/bank-balance/approved`
      );
      setApiData(res.data);
      // Fetch for table
      const res2 = await nos.post<detailedBankBalances[]>(
        `${apiBaseUrl}/dash/bank-balance/currency-wise`
      );
      setTableData(res2.data);
    } catch (e) {
      setError(
        e instanceof Error && typeof e.message === "string"
          ? e.message
          : "Failed to fetch data"
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      grouping: groupBy,
    },
    onGroupingChange: setGroupBy,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    manualPagination: false,
  });

  const totalAmount = useMemo(() => {
    const total = table
      .getRowModel()
      .rows.reduce(
        (sum, row) => {
          const value = row.original.equivalentINR || 0;
          return sum + value;
        },
        0
      );

    return total;
  }, [table]);

  const totalBalanceAccountCcy = table
    .getRowModel()
    .rows.reduce((sum, row) => sum + (row.original.balanceAccountCcy || 0), 0);

  const totalEquivalentINR = table
    .getRowModel()
    .rows.reduce((sum, row) => sum + (row.original.equivalentINR || 0), 0);

  const barData = useMemo(
    () => getBarData(apiData, selectedEntity, selectedBank, selectedCurrency),
    [apiData, selectedEntity, selectedBank, selectedCurrency]
  );
  const pieData = useMemo(
    () => getPieData(apiData, selectedEntity, selectedBank, selectedCurrency),
    [apiData, selectedEntity, selectedBank, selectedCurrency]
  );

  const allBanks = useMemo(() => {
    if (!Array.isArray(apiData)) return [];
    return Array.from(
      new Set(apiData.flatMap((entity) => entity.banks.map((b) => b.bank)))
    );
  }, [apiData]);

  // Pie slice filtering state (legend never disappears)
  const [hiddenSlices, setHiddenSlices] = useState<string[]>([]);
  // removed highlight state
  const [barMode, setBarMode] = useState<"grouped" | "stacked">("stacked");

  // Only filter pie slices, not legend display. Use arc onClick for filtering.
  const handleArcClick = (datum: { id: string | number }) => {
    const sliceId = String(datum.id);
    setHiddenSlices((prev) =>
      prev.includes(sliceId)
        ? prev.filter((id) => id !== sliceId)
        : [...prev, sliceId]
    );
  };
  // removed highlight handlers

  // Filter pieData based on hiddenSlices
  const filteredPieData = useMemo(
    () => pieData.filter((d) => !hiddenSlices.includes(String(d.id))),
    [pieData, hiddenSlices]
  );

  // Add a reset button to restore all slices
  const handleResetPie = () => {
    setHiddenSlices([]);
  };

  // Export chart as PNG
  const exportPieAsPng = () => {
    const svg = document.querySelector(".nivo-pie svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const b64start = "data:image/svg+xml;base64,";
    saveAs(b64start + svg64, "pie-chart.svg");
  };
  const exportBarAsPng = () => {
    const svg = document.querySelector(".nivo-bar svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const b64start = "data:image/svg+xml;base64,";
    saveAs(b64start + svg64, "bar-chart.svg");
  };

  return (
    <Layout title="Detailed Bank Dashboard">
      {loading && <div className="text-center py-4">Loading...</div>}
      {error && <div className="text-center text-red-500 py-4">{error}</div>}
      <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
        <div className="flex gap-4 py-4 items-end">
          <CustomSelect
            label="Entity"
            options={getEntityOptions(apiData)}
            selectedValue={selectedEntity}
            onChange={(option) => setSelectedEntity(option || undefined)}
            placeholder="Select Entity"
            isClearable={true}
          />
          <CustomSelect
            label="Bank"
            options={getBankOptions(apiData)}
            selectedValue={selectedBank}
            onChange={(option) => setSelectedBank(option || undefined)}
            placeholder="Select Bank"
            isClearable={true}
          />
          <CustomSelect
            label="Currency"
            options={getCurrencyOptions(apiData)}
            selectedValue={selectedCurrency}
            onChange={(option) => setSelectedCurrency(option || undefined)}
            placeholder="Select Currency"
          />
          <div className="flex flex-row w-full pl-40 justify-end gap-4">
            <button
              className="bg-primary hover:bg-primary-hover text-white border-2 border-primary text-center rounded px-4 py-2 font-bold transition flex items-center gap-2"
              type="button"
              onClick={fetchData}
              disabled={loading}
            >
              <RotateCcw className="w-5 h-5" />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-6 items-stretch">
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 max-w-full rounded-2xl shadow-xl border border-border overflow-hidden glass-card"
            style={{
              minWidth: 0,
              minHeight: 0,
              position: "relative",
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
            }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Entity-Wise Balances
            </h2>
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
              <div
                className="w-full h-[500px] max-w-full nivo-bar"
                style={{
                  position: "relative",
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 2px 12px 0 #e3f2fd",
                }}
              >
                {/* <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                  Entity-Wise Balances
                </h2> */}
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 10,
                    zIndex: 2,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    className="px-2 py-1 rounded bg-primary text-white text-xs shadow"
                    onClick={exportBarAsPng}
                  >
                    Export
                  </button>
                  {/* <button
                    className={`px-2 py-1 rounded text-xs shadow ${
                      barMode === "grouped"
                        ? "bg-primary text-white"
                        : "bg-white text-primary border border-primary"
                    }`}
                    onClick={() => setBarMode("grouped")}
                  >
                    Grouped
                  </button> */}
                  <button
                    className={`px-2 py-1 rounded text-xs shadow ${
                      barMode === "stacked"
                        ? "bg-primary text-white"
                        : "bg-white text-primary border border-primary"
                    }`}
                    onClick={() => setBarMode("stacked")}
                  >
                    Stacked
                  </button>
                </div>
                <ResponsiveBar
                  data={barData}
                  indexBy="entity"
                  keys={allBanks}
                    innerPadding={-60}
                  groupMode={barMode}
                  colors={colorPalette}
                  // No highlight border
                  labelSkipHeight={16}
                  labelSkipWidth={16}
                  labelTextColor="white"
                  margin={{
                    bottom: 60,
                    left: 80,
                    right: 50,
                    top: 60,
                  }}
                  padding={0.1}
                  borderRadius={4}
                  enableLabel={true}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Entity",
                    legendPosition: "middle",
                    legendOffset: 32,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: "Balance",
                    legendPosition: "middle",
                    legendOffset: -60,
                  }}
                  tooltip={({ id, value, color, indexValue, data }) => {
                    // Try to infer currency from data row
                    let currency: string = "INR";
                    if (typeof data.currency === "string")
                      currency = data.currency;
                    else if (typeof id === "string" && currencySymbols[id])
                      currency = id;
                    return (
                      <div
                        style={{
                          padding: 8,
                          background: "#fff",
                          borderRadius: 6,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          color: "#222",
                          minWidth: 120,
                        }}
                      >
                        <div style={{ fontWeight: 600, color }}>{id}</div>
                        <div>
                          Entity: <b>{indexValue}</b>
                        </div>
                        <div>
                          Balance:{" "}
                          <b>{formatCurrency(Number(value), currency)}</b>
                        </div>
                      </div>
                    );
                  }}
                  theme={{
                    axis: {
                      ticks: { text: { fontSize: 12, fill: "#159588" } },
                    },
                    labels: {
                      text: { fontSize: 14, fontWeight: 900, fill: "#222" },
                    },
                    tooltip: {
                      container: {
                        fontSize: 18,
                        color: "#2196f3",
                        fontWeight: 700,
                        background: "#e3f2fd",
                        borderRadius: 8,
                      },
                    },
                    legends: { text: { fontSize: 19, fill: "#159588" } },
                  }}
                  animate={true}
                  motionConfig="wobbly"
                  // No highlight handlers
                />
              </div>
            </div>
          </div>

          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-2xl shadow-xl border border-border overflow-hidden glass-card"
            style={{
              minWidth: 0,
              position: "relative",
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Currency-Wise Balances
            </h2> */}
            {/* <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center"> */}
            {/* <div className="w-full h-[340px] max-w-full"> */}
            <>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "540px",
                  minHeight: 540,
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 2px 12px 0 #e3f2fd",
                }}
                className="nivo-pie"
              >
                <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                  Currency-Wise Balances
                </h2>
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 10,
                    zIndex: 2,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    className="px-2 py-1 rounded bg-primary text-white text-xs shadow"
                    onClick={exportPieAsPng}
                  >
                    Export
                  </button>
                  {hiddenSlices.length > 0 && (
                    <button
                      className="px-2 py-1 bg-white text-primary border border-primary rounded text-xs shadow"
                      onClick={handleResetPie}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <ResponsivePie
                  data={filteredPieData}
                  margin={{ top: 80, right: 120, bottom: 100, left: 120 }}
                  innerRadius={0.5}
                  padAngle={1.2}
                  cornerRadius={8}
                  colors={colorPalette}
                  activeOuterRadiusOffset={10}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#159588"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: "color" }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={"white"}
                  // arcLabelsTextColor={{
                  //   from: "color",
                  //   modifiers: [["darker", 1.5]],
                  // }}
                  legends={[
                    {
                      anchor: "bottom",
                      direction: "row",
                      translateY: 48,
                      itemWidth: 100,
                      itemHeight: 22,
                      symbolShape: "circle",
                      itemTextColor: "#159588",
                      data: filteredPieData.map((d, i) => ({
                        id: d.label,
                        label: d.label,
                        color: colorPalette[i % colorPalette.length],
                      })),
                    },
                  ]}
                  onClick={handleArcClick}
                  // No highlight handlers
                  tooltip={({ datum }) => {
                    const total = filteredPieData.reduce(
                      (sum, d) =>
                        sum + (typeof d.value === "number" ? d.value : 0),
                      0
                    );
                    const percent =
                      total > 0
                        ? ((datum.value / total) * 100).toFixed(2)
                        : "0.00";
                    const currency =
                      typeof datum.label === "string" ? datum.label : "INR";
                    const symbol = currencySymbols[currency] || "";
                    return (
                      <div
                        style={{
                          padding: 10,
                          background: "#e3f2fd",
                          borderRadius: 8,
                          color: "#2196f3",
                          minWidth: 140,
                          fontWeight: 700,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: datum.color,
                            fontSize: 18,
                          }}
                        >
                          {symbol} {datum.label}
                        </div>
                        <div>
                          Value:{" "}
                          <b>{formatCurrency(Number(datum.value), currency)}</b>
                        </div>
                        <div>
                          Percent: <b>{percent}%</b>
                        </div>
                      </div>
                    );
                  }}
                  theme={{
                    labels: {
                      text: {
                        fontSize: 13,
                        fontWeight: 700,
                        fill: "#159588",
                      },
                    },
                    tooltip: {
                      container: {
                        fontSize: 18,
                        color: "#2196f3",
                        fontWeight: 700,
                        background: "#e3f2fd",
                        borderRadius: 8,
                      },
                    },
                    legends: { text: { fontSize: 18, fill: "#159588" } },
                  }}
                  animate={true}
                  motionConfig="wobbly"
                />
                {/* Center label */}
                <div
                  style={{
                    position: "relative",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%,-50%)",
                    pointerEvents: "none",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "#222",
                    opacity: 0.8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span>
                      {(() => {
                        const total = filteredPieData.reduce(
                          (sum, d) =>
                            sum + (typeof d.value === "number" ? d.value : 0),
                          0
                        );
                        // Try to infer currency from first slice
                        const first = filteredPieData[0];
                        const symbol = first
                          ? currencySymbols[first.label] || ""
                          : "";
                        return (
                          symbol +
                          total.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                            notation: "compact",
                          })
                        );
                      })()}
                    </span>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 400,
                        color: "#666",
                        textAlign: "center",
                      }}
                    >
                      Total
                    </div>
                  </div>
                </div>
              </div>
            </>
            {/* </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>

      <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
        <div className="space-y-4">
          <div className=" gap-3 flex flex-col">
            <h2 className="text-xl font-semibold text-primary-lt pt-6">
              Detailed Bank Balances
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
              // sections={sections}
            >
              <tfoot className="bg-primary font-semibold sticky bottom-0 z-10">
                <tr>
                  {table.getVisibleLeafColumns().map((col) => (
                    <td
                      key={col.id}
                      className="px-6 py-2 text-white text-sm text-start border-t border-border"
                    >
                      {{
                        entity: "Total",
                        bank: `${new Set(
                          table.getRowModel().rows.map((row) => row.original.bank)
                        ).size} Banks`,
                        accountNumber: `${table.getRowModel().rows.length} Accounts`,
                        currency: `${new Set(
                          table.getRowModel().rows.map((row) => row.original.currency)
                        ).size} Currencies`,
                        balanceAccountCcy: formatCurrency(
                          totalBalanceAccountCcy,
                          table.getRowModel().rows[0]?.original.currency || "INR"
                        ),
                        equivalentINR: formatCurrency(totalEquivalentINR, "INR"),
                      }[col.id] ?? null}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </NyneOSTable2>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default BankBalancesDashboard;
