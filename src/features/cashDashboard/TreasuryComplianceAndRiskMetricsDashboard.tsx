import { useState } from "react";
import { BadgePlus } from "lucide-react";
import Layout from "../../components/layout/Layout";
import ReactECharts from "echarts-for-react";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
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
import CustomSelect from "../../components/ui/SearchSelect";

// Types for the dashboard data
export type CombineMetricData = {
  lcr: number;
  approvalSLA: number;
  auditTrail: number;
};

export type PieDataItem = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type RiskMetricTrendItem = {
  id: string;
  data: { x: string; y: number }[];
};

export type FxExposureDataItem = {
  week: string;
  netFlow: number;
};

export type TreasuryComplianceAndRiskMetricData = {
  combineData: CombineMetricData;
  pieData: PieDataItem[];
  RiskMetricTrends: RiskMetricTrendItem[];
  fxExposureData: FxExposureDataItem[];
};

// For future use: get dropdown options from API data
// function getDateRangeOptions(apiData?: TreasuryComplianceAndRiskMetricData[]) {
function getDateRangeOptions() {
  return [
    { value: "last_6_months", label: "Last 6 Months" },
    { value: "ytd", label: "Year to Date" },
    { value: "last_12_months", label: "Last 12 Months" },
  ];
}

const TreasuryComplianceAndRiskMetricsDashboard = () => {
  const mockData: TreasuryComplianceAndRiskMetricData = {
    combineData: {
      lcr: 95,
      approvalSLA: 92,
      auditTrail: 97,
    },
    pieData: [
      { id: "dept1", label: "Finance", value: 120, color: "#4CC4BA" },
      { id: "dept2", label: "Operations", value: 80, color: "#F47560" },
      { id: "dept3", label: "IT", value: 60, color: "#00C853" },
      { id: "dept4", label: "HR", value: 40, color: "#FFD600" },
    ],
    RiskMetricTrends: [
      {
        id: "RLC Score",
        data: [
          { x: "2025-01-01", y: 80 },
          { x: "2025-02-01", y: 45 },
          { x: "2025-03-01", y: 78 },
          { x: "2025-04-01", y: 90 },
          { x: "2025-05-01", y: 95 },
          { x: "2025-06-01", y: 92 },
        ],
      },
      {
        id: "SLA Score",
        data: [
          { x: "2025-01-01", y: 10 },
          { x: "2025-02-01", y: 80 },
          { x: "2025-03-01", y: 28 },
          { x: "2025-04-01", y: 40 },
          { x: "2025-05-01", y: 45 },
          { x: "2025-06-01", y: 90 },
        ],
      },
    ],
    fxExposureData: [
      { week: "W1", netFlow: 40 },
      { week: "W2", netFlow: -60 },
      { week: "W3", netFlow: -100 },
      { week: "W4", netFlow: 180 },
      { week: "W5", netFlow: -50 },
      { week: "W6", netFlow: 0 },
      { week: "W7", netFlow: -200 },
      { week: "W8", netFlow: 0 },
    ],
  };

  // --- STATE ---
  const [loading, ] = useState(false);
  // In future, apiData will be fetched from API
  const [apiData] = useState<TreasuryComplianceAndRiskMetricData>(mockData);
  const [selectedDateRange, setSelectedDateRange] = useState<
    string | undefined
  >(undefined);

  return (
    <Layout title="Treasury Compliance and Risk Metrics Dashboard">
      <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border mb-6">
        <div className="flex gap-6 py-4 items-end">
          <div className="w-[480px]" >
            <CustomSelect
              label="Filter Period"
              options={getDateRangeOptions()}
              selectedValue={selectedDateRange}
              onChange={(option) => {
                setSelectedDateRange(option || undefined);
              }}
              placeholder="Select date range"
              isClearable={true}
              isDisabled={true} // Disabled for now
            />
          </div>
          <div className="flex flex-row w-full pl-40 justify-end gap-4">
            <button
              className="bg-primary hover:bg-primary-hover text-white border-2 border-primary text-center rounded px-4 py-2 font-bold transition flex items-center gap-2"
              disabled
            >
              <BadgePlus className="w-5 h-5" />
              {loading ? "Generating Report..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
        <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-10 items-stretch">

          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden items-center"
            style={{ minWidth: 0, minHeight: 0, height: 360 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Liquidity Coverage Ratio (LCR)
            </h2>
            <div style={{ width: '100%' }}>
              <ReactECharts
                option={{
                  series: [
                    {
                      type: "gauge",
                      startAngle: 180,
                      endAngle: 0,
                      min: 0,
                      max: 100,
                      progress: {
                        show: true,
                        width: 36,
                        itemStyle: { color: "#4CC4BA" },
                      },
                      axisLine: {
                        lineStyle: {
                          width: 36,
                          color: [[1, "#e0e0e0"]],
                        },
                      },
                      axisTick: { show: false },
                      splitLine: { show: false },
                      axisLabel: { show: false },
                      pointer: { show: false },
                      detail: {
                        valueAnimation: true,
                        fontSize: 24,
                        fontWeight: "bold",
                        offsetCenter: [0, "-10%"],
                        formatter: function (value: number) {
                          return value + "%";
                        },
                        color: "#4CC4BA",
                      },
                      data: [{ value: apiData.combineData.lcr }],
                    },
                  ],
                  grid: { left: 0, right: 0 },
                }}
                style={{ width: '100%', height: 390 }}
              />
              <div className="text-center text-base font-medium text-gray-600 relative -top-36">LCR measures liquidity buffer</div>
            </div>
          </div>
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden items-center"
            style={{ minWidth: 0, minHeight: 0, height: 360 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Approval SLA Compliance
            </h2>
            <div style={{ width: '100%', }}>
              <ReactECharts
                option={{
                  series: [
                    {
                      type: "gauge",
                      startAngle: 180,
                      endAngle: 0,
                      min: 0,
                      max: 100,
                      progress: {
                        show: true,
                        width: 36,
                        itemStyle: { color: "#F47560" },
                      },
                      axisLine: {
                        lineStyle: {
                          width: 36,
                          color: [[1, "#e0e0e0"]],
                        },
                      },
                      axisTick: { show: false },
                      splitLine: { show: false },
                      axisLabel: { show: false },
                      pointer: { show: false },
                      detail: {
                        valueAnimation: true,
                        fontSize: 24,
                        fontWeight: "bold",
                        offsetCenter: [0, "-10%"],
                        formatter: function (value: number) {
                          return value + "%";
                        },
                        color: "#F47560",
                      },
                      data: [{ value: apiData.combineData.approvalSLA }],
                    },
                  ],
                  grid: { left: 0, right: 0 },
                }}
                style={{ width: '100%', height: 390 }}
              />
              <div className="text-center text-base font-medium text-gray-600 relative -top-36">SLA met for approvals</div>
            </div>
          </div>
          {/* Audit Trail Completeness Card */}
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden items-center"
            style={{ minWidth: 0, minHeight: 0, height: 360 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Audit Trail Completeness
            </h2>
            <div style={{ width: '90%', margin: '0 auto' }}>
              <ReactECharts
                option={{
                  series: [
                    {
                      type: "gauge",
                      startAngle: 180,
                      endAngle: 0,
                      min: 0,
                      max: 100,
                      progress: {
                        show: true,
                        width: 36,
                        itemStyle: { color: "#FFD600" },
                      },
                      axisLine: {
                        lineStyle: {
                          width: 36,
                          color: [[1, "#e0e0e0"]],
                        },
                      },
                      axisTick: { show: false },
                      splitLine: { show: false },
                      axisLabel: { show: false },
                      pointer: { show: false },
                      detail: {
                        valueAnimation: true,
                        fontSize: 24,
                        fontWeight: "bold",
                        offsetCenter: [0, "-10%"],
                        formatter: function (value: number) {
                          return value + "%";
                        },
                        color: "#FFD600",
                      },
                      data: [{ value: apiData.combineData.auditTrail }],
                    },
                  ],
                  grid: { left: 0, right: 0 },
                }}
                style={{ width: '100%', height: 390 }}
              />
              <div className="text-center text-base font-medium text-gray-600 relative -top-36">Audit trail completeness</div>
            </div>
          </div>
          {/* Proposals by Department Pie Chart */}
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
            style={{ minWidth: 0, minHeight: 0, height: 360 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Proposals by Department
            </h2>
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
              <div className="w-full h-[320px] max-w-full">
                <ResponsivePie
                  data={apiData.pieData}
                  margin={{ top: 40, right: 80, bottom: 20, left: 80 }}
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
                  colors={({ data }) => data.color}
                  // legends={[
                  //   {
                  //     anchor: "bottom",
                  //     direction: "row",
                  //     translateY: 56,
                  //     itemWidth: 100,
                  //     itemHeight: 18,
                  //     symbolShape: "circle",
                  //   },
                  // ]}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap w-full gap-6 px-0 justify-center items-stretch">
          {/* Risk Metric Trends Line Chart */}
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
            style={{ minWidth: 0, minHeight: 0, height: 480 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Risk Metric Trends
            </h2>
            <ResponsiveLine
              data={apiData.RiskMetricTrends}
              animate
              axisBottom={{
                // format removed because xScale is 'point' (not time)
                legend: "Time",
                legendOffset: -12,
                tickRotation: -30,
              }}
              axisLeft={{
                legend: "Score",
                legendOffset: 12,
              }}
              curve="monotoneX"
              enablePointLabel={false}
              enableTouchCrosshair
              margin={{
                bottom: 120,
                left: 60,
                right: 20,
                top: 20,
              }}
              pointBorderColor={{
                from: "color",
                modifiers: [["darker", 0.3]],
              }}
              pointBorderWidth={1}
              pointSize={10}
              useMesh
              xScale={{
                type: "point",
              }}
              yScale={{
                type: "linear",
              }}
              defaultHeight={400}
              defaultWidth={900}
            />
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
              <div className="w-full h-[340px] max-w-full"></div>
            </div>
          </div>
          {/* Unhedged FX Exposure Bar Chart */}
          <div
            className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
            style={{ minWidth: 0, minHeight: 0, height: 480 }}
          >
            <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
              Unhedged FX Exposure (Net in INR Cr)
            </h2>
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart
                data={apiData.fxExposureData}
                margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  label={{
                    value: "Net Flow",
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
                  {apiData.fxExposureData.map((entry, index) => (
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
      </div>
    </Layout>
  );
};

export default TreasuryComplianceAndRiskMetricsDashboard;
