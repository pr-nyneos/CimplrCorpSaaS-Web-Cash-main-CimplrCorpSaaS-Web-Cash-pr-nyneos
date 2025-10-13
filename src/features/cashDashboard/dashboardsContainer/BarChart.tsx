import { ResponsiveBar } from "@nivo/bar";
import { formatCompactCurrency, defaultColorPalette } from "./ChartUtils";

interface BarChartProps {
  data: Record<string, string | number>[];
  indexBy: string;
  keys: string[];
  groupMode?: "grouped" | "stacked";
  height?: number;
  colorPalette?: string[];
  currencySymbols?: Record<string, string>;
}

export const BarChart = ({
  data,
  indexBy,
  keys,
  groupMode = "stacked",
  height = 500,
  colorPalette = defaultColorPalette,
//   currencySymbols = {}
}: BarChartProps) => {
  return (
    <div style={{ height }}>
      <ResponsiveBar
        data={data}
        indexBy={indexBy}
        keys={keys}
        groupMode={groupMode}
        colors={colorPalette}
        innerPadding={-60}
        labelSkipHeight={16}
        labelSkipWidth={16}
        labelTextColor="white"
        margin={{ bottom: 60, left: 110, right: 50, top: 60 }}
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
          legendOffset: -90,
        }}
        tooltip={({ id, value, color, indexValue, data }) => {
          const currency = typeof data.currency === "string" ? data.currency : "INR";
        //   const symbol = currencySymbols[currency] || "";
          
          return (
            <div className="p-3 bg-white rounded-lg shadow-lg border min-w-32">
              <div style={{ color, fontWeight: 600 }}>{id}</div>
              <div>Entity: <b>{indexValue}</b></div>
              <div>Balance: <b>{formatCompactCurrency(Number(value), currency)}</b></div>
            </div>
          );
        }}
        theme={{
          axis: { ticks: { text: { fontSize: 12, fill: "#159588" } } },
          labels: { text: { fontSize: 14, fontWeight: 900, fill: "#222" } },
          tooltip: { container: { background: "#e3f2fd", borderRadius: 8 } },
        }}
        animate={true}
        motionConfig="wobbly"
      />
    </div>
  );
};