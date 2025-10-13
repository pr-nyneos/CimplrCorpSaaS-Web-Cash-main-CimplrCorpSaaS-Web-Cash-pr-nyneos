import { useState, useMemo, useEffect } from "react";
import { BadgePlus } from "lucide-react";
import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { ResponsiveBar } from "@nivo/bar";
import nos from "../../utils/nos";

const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || "";

export type PlannedInflowOutflowEntity = {
  entity: string;
  inflow: number;
  outflow: number;
};

export type PlannedInflowOutflowCashflow = {
  cashflow_nature: string;
  inflow: number;
  outflow: number;
};

export type PlannedInflowOutflowData = {
  date_range: string;
  entities: PlannedInflowOutflowEntity[];
  cashflows: PlannedInflowOutflowCashflow[];
};

function getDateRangeOptions(apiData: PlannedInflowOutflowData[]) {
  return apiData.map((d) => ({ value: d.date_range, label: d.date_range }));
}
function getEntityOptions(
  apiData: PlannedInflowOutflowData[],
  dateRange?: string
) {
  const found = apiData.find((d) => d.date_range === dateRange);
  if (!found) return [];
  return found.entities.map((e) => ({ value: e.entity, label: e.entity }));
}
function getCashflowNatureOptions(
  apiData: PlannedInflowOutflowData[],
  dateRange?: string
) {
  const found = apiData.find((d) => d.date_range === dateRange);
  if (!found) return [];
  return found.cashflows.map((c) => ({
    value: c.cashflow_nature,
    label: c.cashflow_nature,
  }));
}

function getPlannedInflowOutflowBarDataByEntity(
  apiData: PlannedInflowOutflowData[],
  dateRange?: string,
  entity?: string
) {
  const found = apiData.find((d) => d.date_range === dateRange) || apiData[0];
  if (!found) return [];
  let entities = found.entities;
  if (entity) {
    entities = entities.filter((e) => e.entity === entity);
  }

  return entities.map((e) => ({
    week: e.entity,
    Inflows: e.inflow,
    Outflows: e.outflow,
  }));
}

function getPlannedInflowOutflowBarDataByCategoryNature(
  apiData: PlannedInflowOutflowData[],
  dateRange?: string,
  cashflowNature?: string
) {
  const found = apiData.find((d) => d.date_range === dateRange) || apiData[0];
  if (!found) return [];
  let cashflows = found.cashflows;
  if (cashflowNature) {
    cashflows = cashflows.filter((c) => c.cashflow_nature === cashflowNature);
  }

  return cashflows.map((c) => ({
    week: c.cashflow_nature,
    Inflows: c.inflow,
    Outflows: c.outflow,
  }));
}

const PlannedInflowOutflowDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState<PlannedInflowOutflowData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        type ApiResponse = {
          data: PlannedInflowOutflowData[];
          success?: boolean;
        };
        const res = await nos.post<ApiResponse>(
          `${apiBaseUrl}/dash/planned-inflow-outflow`
        );
        if (res.data && Array.isArray(res.data.data)) {
          setApiData(res.data.data);
          if (!selectedDateRange && res.data.data.length > 0) {
            setSelectedDateRange(res.data.data[0].date_range);
          }
        } else {
          setApiData([]);
        }
      } catch (e) {
        setApiData([]);
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedDateRange, setSelectedDateRange] = useState<
    string | undefined
  >(undefined);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  );
  const [selectedCashflowNature, setSelectedCashflowNature] = useState<
    string | undefined
  >(undefined);

  const PlannedInflowOutflowBarDataByEntity = useMemo(
    () =>
      getPlannedInflowOutflowBarDataByEntity(
        apiData,
        selectedDateRange,
        selectedEntity
      ),
    [apiData, selectedDateRange, selectedEntity]
  );

  const PlannedInflowOutflowBarDataByCategoryNature = useMemo(
    () =>
      getPlannedInflowOutflowBarDataByCategoryNature(
        apiData,
        selectedDateRange,
        selectedCashflowNature
      ),
    [apiData, selectedDateRange, selectedCashflowNature]
  );

  return (
    <>
      <Layout title="Planned Inflow Outflow Dashboard">
        <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
          <div className="flex gap-6 py-4 items-end">
            <CustomSelect
              label="Date Range"
              options={getDateRangeOptions(apiData)}
              selectedValue={selectedDateRange}
              onChange={(option) => {
                setSelectedDateRange(option || undefined);
                setSelectedEntity(undefined);
                setSelectedCashflowNature(undefined);
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
              }}
              placeholder="Select entity"
              isClearable={true}
              isDisabled={!selectedDateRange}
            />
            <CustomSelect
              label="Cashflow Nature"
              options={getCashflowNatureOptions(apiData, selectedDateRange)}
              selectedValue={selectedCashflowNature}
              onChange={(option) => {
                setSelectedCashflowNature(option || undefined);
              }}
              placeholder="Select cashflow nature"
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
          <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-10 items-stretch">
            <div
              className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
              style={{ minWidth: 0, minHeight: 0, height: 480 }}
            >
              <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                Planned Inflows vs Outflows (by Entity)
              </h2>
              <ResponsiveBar
                data={PlannedInflowOutflowBarDataByEntity}
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
                Planned Inflows vs Outflows (by Category Nature)
              </h2>
              <ResponsiveBar
                data={PlannedInflowOutflowBarDataByCategoryNature}
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
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PlannedInflowOutflowDashboard;
