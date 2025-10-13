import { ResponsivePie } from "@nivo/pie";
import { useState, useMemo } from "react";
import { formatCompactCurrency, formatCompactNumber } from "./ChartUtils";

interface PieChartProps {
  data: Array<{ id: string; label: string; value: number; color: string }>;
  height?: number;
  showTotal?: boolean;
  currencySymbols?: Record<string, string>;
  onSliceClick?: (sliceId: string) => void;
}

export const PieChart = ({ 
  data, 
  height = 500, 
  showTotal = true,
  currencySymbols = {},
  onSliceClick 
}: PieChartProps) => {
  const [hiddenSlices, setHiddenSlices] = useState<string[]>([]);

  const filteredData = useMemo(
    () => data.filter((d) => !hiddenSlices.includes(String(d.id))),
    [data, hiddenSlices]
  );

  const handleArcClick = (datum: { id: string | number }) => {
    const sliceId = String(datum.id);
    setHiddenSlices((prev) =>
      prev.includes(sliceId)
        ? prev.filter((id) => id !== sliceId)
        : [...prev, sliceId]
    );
    onSliceClick?.(sliceId);
  };

//   const handleReset = () => setHiddenSlices([]);

  const total = filteredData.reduce((sum, d) => sum + (d.value || 0), 0);
  const firstCurrency = filteredData[0]?.label || "INR";
  const symbol = currencySymbols[firstCurrency] || "";

  return (
    <div style={{ height, position: "relative" }}>
      <ResponsivePie
        data={filteredData}
        margin={{ top: 80, right: 120, bottom: 100, left: 120 }}
        innerRadius={0.5}
        padAngle={1.2}
        cornerRadius={8}
        colors={{ datum: "data.color" }}
        activeOuterRadiusOffset={10}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#159588"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={"white"}
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            translateY: 48,
            itemWidth: 100,
            itemHeight: 22,
            symbolShape: "circle",
            itemTextColor: "#159588",
            data: filteredData.map((d) => ({
              id: d.label,
              label: d.label,
              color: d.color,
            })),
          },
        ]}
        onClick={handleArcClick}
        tooltip={({ datum }) => {
          const percent = total > 0 ? ((datum.value / total) * 100).toFixed(2) : "0.00";
          const currency = typeof datum.label === "string" ? datum.label : "INR";
          const symbol = currencySymbols[currency] || "";

          return (
            <div className="p-3 bg-white rounded-lg shadow-lg border min-w-32">
              <div style={{ color: datum.color, fontWeight: 600 }}>
                {symbol} {datum.label}
              </div>
              <div>Value: <b>{formatCompactCurrency(Number(datum.value), currency)}</b></div>
              <div>Percent: <b>{percent}%</b></div>
            </div>
          );
        }}
        theme={{
          labels: { text: { fontSize: 13, fontWeight: 700, fill: "#159588" } },
          tooltip: { container: { background: "#e3f2fd", borderRadius: 8 } },
          legends: { text: { fontSize: 18, fill: "#159588" } },
        }}
        animate={true}
        motionConfig="wobbly"
      />
      
      {showTotal && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {symbol}{formatCompactNumber(total)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </div>
        </div>
      )}
    </div>
  );
};