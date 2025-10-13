import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { useMemo, useState, useEffect } from "react";
import { BadgePlus } from "lucide-react";
import type { ReactNode } from "react";
import { ChartContainer } from "./dashboardsContainer/ChartContainer";
import { BarChart } from "./dashboardsContainer/BarChart";
import {
  defaultColorPalette,
  currencySymbols,
  // getColor,
} from "./dashboardsContainer/ChartUtils";
import nos from "../../utils/nos";

const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || "";

type DashboardFiltersProps = {
  filters: Array<{
    label: string;
    options: Array<{ value: string; label: string }>;
    selectedValue: string | undefined;
    onChange: (value: string | undefined) => void;
    placeholder: string;
    isClearable?: boolean;
    isDisabled?: boolean;
  }>;
  actions?: ReactNode;
};

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

export const DashboardFilters = ({
  filters,
  actions,
}: DashboardFiltersProps) => {
  return (
    <div className="flex gap-4 py-4 items-end">
      {filters.map((filter, index) => (
        <CustomSelect
          key={index}
          label={filter.label}
          options={filter.options}
          selectedValue={filter.selectedValue}
          onChange={(option) => filter.onChange(option || undefined)}
          placeholder={filter.placeholder}
          isClearable={filter.isClearable}
          isDisabled={filter.isDisabled}
        />
      ))}
      {actions && (
        <div className="flex flex-row w-full pl-40 justify-end gap-4">
          {actions}
        </div>
      )}
    </div>
  );
};

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

const DemoPlannedInflowOutflowDashboard = () => {
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

  // Create selected filters array for display
  const selectedFilters = useMemo(() => {
    const filters = [];
    if (selectedDateRange) {
      filters.push({ label: "Date Range", value: selectedDateRange });
    }
    if (selectedEntity) {
      filters.push({ label: "Entity", value: selectedEntity });
    }
    if (selectedCashflowNature) {
      filters.push({ label: "Cashflow Nature", value: selectedCashflowNature });
    }
    return filters;
  }, [selectedDateRange, selectedEntity, selectedCashflowNature]);


  const filters = [
    {
      label: "Date Range",
      options: getDateRangeOptions(apiData),
      selectedValue: selectedDateRange,
      onChange: (option: string | undefined) => {
        setSelectedDateRange(option || undefined);
        setSelectedEntity(undefined);
        setSelectedCashflowNature(undefined);
      },
      placeholder: "Select date range",
      isClearable: true,
    },
    {
      label: "Entity Type",
      options: getEntityOptions(apiData, selectedDateRange),
      selectedValue: selectedEntity,
      onChange: (option: string | undefined) => {
        setSelectedEntity(option || undefined);
      },
      placeholder: "Select entity",
      isClearable: true,
      isDisabled: !selectedDateRange,
    },
    {
      label: "Cashflow Nature",
      options: getCashflowNatureOptions(apiData, selectedDateRange),
      selectedValue: selectedCashflowNature,
      onChange: (option: string | undefined) => {
        setSelectedCashflowNature(option || undefined);
      },
      placeholder: "Select cashflow nature",
      isClearable: true,
      isDisabled: !selectedDateRange,
    },
  ];

  const filterActions = (
    <button
      className="bg-primary hover:bg-primary-hover text-white border-2 border-primary text-center rounded px-4 py-2 font-bold transition flex items-center gap-2"
    >
      <BadgePlus className="w-5 h-5" />
      {loading ? "Generating Report..." : "Generate Report"}
    </button>
  );

  return (
    <>
      <Layout title="Planned Inflow Outflow Dashboard">
        <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
          <DashboardFilters filters={filters} actions={filterActions} />
        </div>

        <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
          <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-10 items-stretch">
            <ChartContainer
              title="Planned Inflows vs Outflows (by Entity)"
              exportFileName="planned-inflows-outflows-by-entity.svg"
              className="grow shrink basis-0"
              selectedFilters={selectedFilters}
            >
              <BarChart
                data={PlannedInflowOutflowBarDataByEntity}
                indexBy="week"
                keys={["Inflows", "Outflows"]}
                height={480}
                colorPalette={defaultColorPalette}
                currencySymbols={currencySymbols}
              />
            </ChartContainer>

            <ChartContainer
              title="Planned Inflows vs Outflows (by Category Nature)"
              exportFileName="planned-inflows-outflows-by-category.svg"
              className="grow shrink basis-0"
              selectedFilters={selectedFilters}
            >
              <BarChart
                data={PlannedInflowOutflowBarDataByCategoryNature}
                indexBy="week"
                keys={["Inflows", "Outflows"]}
                height={480}
                colorPalette={defaultColorPalette}
                currencySymbols={currencySymbols}
              />
            </ChartContainer>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default DemoPlannedInflowOutflowDashboard;
