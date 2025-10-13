import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { useMemo, useState, useEffect } from "react";
import { BadgePlus, FileText, Download, FileDown } from "lucide-react";
import type { ReactNode } from "react";
import { ChartContainer } from "./dashboardsContainer/ChartContainer";
import { PieChart } from "./dashboardsContainer/PieChart";
import { BarChart } from "./dashboardsContainer/BarChart";
import {
  defaultColorPalette,
  currencySymbols,
  getColor,
} from "./dashboardsContainer/ChartUtils";
import { ColumnPicker } from "../../components/ui/ColumnPicker";
import nos from "../../utils/nos";
import { exportToExcel, exportToPDF, exportToWord } from "../../utils/exportToExcel";

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
import Pagination from "../../components/table/Pagination";

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

export type DetailedPipeline = {
  id: string;
  entity: string;
  department: string;
  submitted_by: string;
  submitted_on: string;
  amount: number;
  status?: string;
};

export type ProjectionData = {
  entity: string;
  departments: {
    name: string;
    status: { amount: number; status: string }[];
  }[];
};

function getEntityOptions(apiData: ProjectionData[]) {
  return apiData.map((d) => ({ value: d.entity, label: d.entity }));
}

function getDepartmentOptions(apiData: ProjectionData[], entity?: string) {
  const found = apiData.find((d) => d.entity === entity);
  if (!found) return [];
  return found.departments.map((dep) => ({ value: dep.name, label: dep.name }));
}

function getStatusOptions(
  apiData: ProjectionData[],
  entity?: string,
  department?: string
) {
  const found = apiData.find((d) => d.entity === entity);
  if (!found) return [];
  let statuses: string[] = [];
  if (department) {
    const dep = found.departments.find((dep) => dep.name === department);
    if (dep) {
      statuses = dep.status.map((s) => s.status);
    }
  } else {
    statuses = found.departments.flatMap((dep) =>
      dep.status.map((s) => s.status)
    );
  }
  return Array.from(new Set(statuses)).map((s) => ({
    value: s,
    label: s.replace(/_/g, " ").toUpperCase(),
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

function getPieData(
  apiData: ProjectionData[],
  entity?: string,
  department?: string,
  status?: string
) {
  let data: { id: string; label: string; value: number; color: string }[] = [];
  const found = entity ? apiData.find((d) => d.entity === entity) : undefined;
  if (found) {
    if (department) {
      const dep = found.departments.find((dep) => dep.name === department);
      if (dep) {
        // Filter by status if specified
        const filteredStatus = status 
          ? dep.status.filter((s) => s.status === status)
          : dep.status;
        
        data.push({
          id: dep.name,
          label: dep.name,
          value: Number(filteredStatus.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
          color: getColor(0),
        });
      }
    } else {
      data = found.departments.map((dep, idx) => {
        // Filter by status if specified
        const filteredStatus = status 
          ? dep.status.filter((s) => s.status === status)
          : dep.status;
        
        return {
          id: dep.name,
          label: dep.name,
          value: Number(filteredStatus.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
          color: getColor(idx),
        };
      });
    }
  } else {
    // All entities
    let idx = 0;
    apiData.forEach((d) => {
      d.departments.forEach((dep) => {
        // Filter by status if specified
        const filteredStatus = status 
          ? dep.status.filter((s) => s.status === status)
          : dep.status;
        
        const value = Number(filteredStatus.reduce((sum, s) => sum + s.amount, 0).toFixed(2));
        
        // Only add if there's a value after filtering
        if (value > 0) {
          data.push({
            id: dep.name,
            label: dep.name,
            value: value,
            color: getColor(idx),
          });
          idx++;
        }
      });
    });
  }
  return data;
}

function getBarData(
  apiData: ProjectionData[],
  entity?: string,
  department?: string,
  status?: string
) {
  // status: "APPROVED", "PENDING_APPROVAL", "REJECTED"
  let statusMap: Record<string, number> = {};
  if (entity) {
    const found = apiData.find((d) => d.entity === entity);
    if (found) {
      let departments = found.departments;
      if (department) {
        departments = departments.filter((dep) => dep.name === department);
      }
      departments.forEach((dep) => {
        dep.status.forEach((s) => {
          // Filter by status if specified
          if (!status || s.status === status) {
            statusMap[s.status] = (statusMap[s.status] || 0) + s.amount;
          }
        });
      });
    }
  } else {
    // All entities
    apiData.forEach((d) => {
      d.departments.forEach((dep) => {
        dep.status.forEach((s) => {
          // Filter by status if specified
          if (!status || s.status === status) {
            statusMap[s.status] = (statusMap[s.status] || 0) + s.amount;
          }
        });
      });
    });
  }
  const statusKeys = Object.keys(statusMap);
  return statusKeys.map((status, idx) => ({
    id: status.toLowerCase(),
    status: status.replace(/_/g, " ").toUpperCase(),
    netAmount: Number(statusMap[status].toFixed(2)),
    color: getColor(idx),
  }));
}

const DetailedPipelineMockData: DetailedPipeline[] = [];

// function getEntityOptions(apiData: ProjectionData[]) {}

const DemoProjectionPipelineDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<DetailedPipeline[]>(
    DetailedPipelineMockData
  );

  const [groupBy, setGroupBy] = useState<string[]>([]);

  // For charts, use API data
  const [apiData, setApiData] = useState<ProjectionData[]>([]);
  const [totalProposals, setTotalProposals] = useState<string>("Loading...");
  const [pendingApproval, setPendingApproval] = useState<string>("Loading...");
  const [valuePending, setValuePending] = useState<string>("Loading...");
  const [approvedThisMonth, setApprovedThisMonth] =
    useState<string>("Loading...");

  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(
    undefined
  );
  const [selectedDepartment, setSelectedDepartment] = useState<
    string | undefined
  >(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  );

  const pieData = useMemo(
    () => getPieData(apiData, selectedEntity, selectedDepartment, selectedStatus),
    [apiData, selectedEntity, selectedDepartment, selectedStatus]
  );
  const barData = useMemo(
    () => getBarData(apiData, selectedEntity, selectedDepartment, selectedStatus),
    [apiData, selectedEntity, selectedDepartment, selectedStatus]
  );

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch table data
        type TableApiResponse = {
          rows: DetailedPipeline[];
          success: boolean;
        };
        const tableRes = await nos.post<TableApiResponse>(
          `${apiBaseUrl}/dash/projection-pipeline/detailed`
        );
        if (tableRes.data && Array.isArray(tableRes.data.rows)) {
          setTableData(tableRes.data.rows);
        } else {
          setTableData(DetailedPipelineMockData);
        }

        // Fetch projection data for charts
        type ProjectionApiResponse = {
          data: ProjectionData[];
          success: boolean;
        };
        const projRes = await nos.post<ProjectionApiResponse>(
          `${apiBaseUrl}/dash/projection-pipeline/by-entity`
        );
        if (projRes.data && Array.isArray(projRes.data.data)) {
          setApiData(projRes.data.data);
        } else {
          setApiData([]);
        }

        // Fetch KPI data for StatCards
        type KpiApiResponse = {
          kpi: {
            totalProposals: number;
            pendingApproval: number;
            valuePendingNet: number;
            approvedThisMonth: number;
          };
          success: boolean;
        };
        const kpiRes = await nos.post<KpiApiResponse>(`${apiBaseUrl}/dash/projection-pipeline/kpi`);
        if (kpiRes.data && kpiRes.data.kpi) {
          setTotalProposals(kpiRes.data.kpi.totalProposals.toLocaleString("en-IN"));
          setPendingApproval(kpiRes.data.kpi.pendingApproval.toLocaleString("en-IN"));
          setValuePending(kpiRes.data.kpi.valuePendingNet.toLocaleString("en-IN"));
          setApprovedThisMonth(kpiRes.data.kpi.approvedThisMonth.toLocaleString("en-IN"));
        } else {
          setTotalProposals("-");
          setPendingApproval("-");
          setValuePending("-");
          setApprovedThisMonth("-");
        }
      } catch (e) {
        setTableData(DetailedPipelineMockData);
        setApiData([]);
        setTotalProposals("-");
        setPendingApproval("-");
        setValuePending("-");
        setApprovedThisMonth("-");
      }
      setLoading(false);
    };
    fetchAllData();
  }, []);

  const columns: ColumnDef<DetailedPipeline>[] = [
    {
      accessorKey: "id",
      header: "Proposal ID",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "entity",
      header: "Entity",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "submitted_by",
      header: "Submitted By",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "submitted_on",
      header: "Submitted On",
      cell: ({ getValue }) => <span>{getValue() as string}</span>,
    },
    {
      accessorKey: "amount",
      header: "Net Amount (INR)",
      cell: ({ getValue }) => (
        <span>{(getValue() as number).toLocaleString("en-IN")}</span>
      ),
    },
  ];

  // Create selected filters array for display
  const selectedFilters = useMemo(() => {
    const filters = [];
    if (selectedEntity) {
      filters.push({ label: "Entity", value: selectedEntity });
    }
    if (selectedDepartment) {
      filters.push({ label: "Department", value: selectedDepartment });
    }
    if (selectedStatus) {
      filters.push({ label: "Status", value: selectedStatus });
    }
    return filters;
  }, [selectedEntity, selectedDepartment, selectedStatus]);

  // Export handlers
  const handleExportToExcel = () => {
    const exportData = table.getRowModel().rows.map(row => row.original);
    exportToExcel(exportData, "projection-pipeline-report", { fxType: "Projection Pipeline" });
  };

  const handleExportToPDF = () => {
    const exportData = table.getRowModel().rows.map(row => row.original);
    exportToPDF(exportData, "projection-pipeline-report", columns, "Projection Pipeline");
  };

  const handleExportToWord = () => {
    const exportData = table.getRowModel().rows.map(row => row.original);
    exportToWord(exportData, "projection-pipeline-report", columns, { fxType: "Projection Pipeline" });
  };

  // Filter table data based on selected filters
  const filteredTableData = useMemo(() => {
    return tableData.filter(row => {
      // Filter by entity
      if (selectedEntity && row.entity !== selectedEntity) {
        return false;
      }
      
      // Filter by department
      if (selectedDepartment && row.department !== selectedDepartment) {
        return false;
      }
      
      // Filter by status (if the row has a status field)
      if (selectedStatus && row.status && row.status !== selectedStatus) {
        return false;
      }
      
      return true;
    });
  }, [tableData, selectedEntity, selectedDepartment, selectedStatus]);

  const table = useReactTable({
    data: filteredTableData,
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

  const filters = [
    {
      label: "Entity Type",
      options: getEntityOptions(apiData),
      selectedValue: selectedEntity,
      onChange: (option: string | undefined) => {
        setSelectedEntity(option || undefined);
        setSelectedDepartment(undefined);
        setSelectedStatus(undefined);
      },
      placeholder: "Select entity",
      isClearable: true,
    },
    {
      label: "Department",
      options: getDepartmentOptions(apiData, selectedEntity),
      selectedValue: selectedDepartment,
      onChange: (option: string | undefined) => {
        setSelectedDepartment(option || undefined);
        setSelectedStatus(undefined);
      },
      placeholder: "Select department",
      isClearable: true,
      isDisabled: !selectedEntity,
    },
    {
      label: "Status",
      options: getStatusOptions(
        apiData,
        selectedEntity,
        selectedDepartment
      ),
      selectedValue: selectedStatus,
      onChange: (option: string | undefined) => setSelectedStatus(option || undefined),
      placeholder: "Select status",
      isClearable: true,
      isDisabled: !selectedEntity,
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
      <Layout title="Projection Pipeline Dashboard">
        <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
          <DashboardFilters filters={filters} actions={filterActions} />
        </div>

        <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
          <div className="flex w-full gap-6 my-8">
            <StatCard
              title="Total Proposals"
              value={loading ? "Loading..." : totalProposals}
              bgColor="bg-gradient-to-tl from-[#4dc9bf] to-[#073f40CC]"
            />
            <StatCard
              title="Pending Approval"
              value={loading ? "Loading..." : pendingApproval}
              bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
            />
            <StatCard
              title="Value Pending (Net)"
              value={loading ? "Loading..." : valuePending}
              bgColor="bg-gradient-to-br from-[#0d6d69CC] to-[#0a5755B3]"
            />
            <StatCard
              title="Approved this Month"
              value={loading ? "Loading..." : approvedThisMonth}
              bgColor="bg-gradient-to-r from-[#65b67cf7] to-green-700"
            />
          </div>

          <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-10 items-stretch">
            <ChartContainer
              title="Pipeline by Status (Net Amount)"
              exportFileName="pipeline-by-status.svg"
              className="grow shrink basis-0"
              selectedFilters={selectedFilters}
            >
              <BarChart
                data={barData}
                indexBy="status"
                keys={["netAmount"]}
                height={480}
                colorPalette={defaultColorPalette}
                currencySymbols={currencySymbols}
              />
            </ChartContainer>

            <ChartContainer
              title="Proposals by Department"
              exportFileName="proposals-by-department.svg"
              className="grow shrink basis-0"
              selectedFilters={selectedFilters}
            >
              <PieChart
                data={pieData}
                height={480}
                currencySymbols={currencySymbols}
              />
            </ChartContainer>
          </div>
        </div>

        <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border">
          <div className="space-y-4">
            <div className=" gap-3 flex flex-col">
              <h2 className="text-xl font-semibold text-primary-lt pt-6">
                Detailed Pipeline View
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
                      onClick={handleExportToExcel}
                      className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                      title="Export to Excel"
                    >
                      <Download className="flex items-center justify-center text-primary group-hover:text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={handleExportToPDF}
                      className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                      title="Export to PDF"
                    >
                      <FileDown className="flex items-center justify-center text-primary group-hover:text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={handleExportToWord}
                      className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                      title="Export to Word"
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
                          id: "Net Flow",
                          amount: table.getRowModel().rows.reduce((sum, row) => sum + (typeof row.getValue === 'function' ? Number(row.getValue('amount')) : 0), 0).toLocaleString("en-IN"),
                        }[col.id] ?? null}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </NyneOSTable2>
              <Pagination
                table={table}
                totalItems={filteredTableData.length}
                startIndex={
                  filteredTableData.length === 0
                    ? 0
                    : table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                      1
                }
                endIndex={Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  filteredTableData.length
                )}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};
export default DemoProjectionPipelineDashboard;
