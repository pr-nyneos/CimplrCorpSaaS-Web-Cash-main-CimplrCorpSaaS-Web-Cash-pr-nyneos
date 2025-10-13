import { BadgePlus } from "lucide-react";
import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { useState, useEffect, useMemo } from "react";
import { Download, FileDown, FileText } from "lucide-react";
import { ColumnPicker } from "../../components/ui/ColumnPicker";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import nos from "../../utils/nos";

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

const colorPalette = [
  "hsl(174, 70%, 50%)",
  "hsl(285, 70%, 50%)",
  "hsl(327, 70%, 50%)",
  "hsl(50, 70%, 50%)",
  "hsl(210, 70%, 50%)",
];
const getColor = (idx: number) => colorPalette[idx % colorPalette.length];

// No longer using ProjectionDataMock, will fetch from API

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

function getPieData(
  apiData: ProjectionData[],
  entity?: string,
  department?: string
) {
  let data: { id: string; label: string; value: number; color: string }[] = [];
  const found = entity ? apiData.find((d) => d.entity === entity) : undefined;
  if (found) {
    if (department) {
      const dep = found.departments.find((dep) => dep.name === department);
      if (dep) {
        data.push({
          id: dep.name,
          label: dep.name,
          value: Number(dep.status.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
          color: getColor(0),
        });
      }
    } else {
      data = found.departments.map((dep, idx) => ({
        id: dep.name,
        label: dep.name,
        value: Number(dep.status.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
        color: getColor(idx),
      }));
    }
  } else {
    // All entities
    let idx = 0;
    apiData.forEach((d) => {
      d.departments.forEach((dep) => {
        data.push({
          id: dep.name,
          label: dep.name,
          value: Number(dep.status.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
          color: getColor(idx),
        });
        idx++;
      });
    });
  }
  return data;
}

function getBarData(
  apiData: ProjectionData[],
  entity?: string,
  department?: string
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
          statusMap[s.status] = (statusMap[s.status] || 0) + s.amount;
        });
      });
    }
  } else {
    // All entities
    apiData.forEach((d) => {
      d.departments.forEach((dep) => {
        dep.status.forEach((s) => {
          statusMap[s.status] = (statusMap[s.status] || 0) + s.amount;
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

const ProjectionPipelineDashboard = () => {
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
    () => getPieData(apiData, selectedEntity, selectedDepartment),
    [apiData, selectedEntity, selectedDepartment]
  );
  const barData = useMemo(
    () => getBarData(apiData, selectedEntity, selectedDepartment),
    [apiData, selectedEntity, selectedDepartment]
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <Layout title="Projection Pipeline Dashboard">
        <div className="bg-secondary-color-lt p-6  rounded-lg shadow-sm border border-border mb-6">
          <div className="flex gap-6 py-4 items-end">
            <CustomSelect
              label="Entity Type"
              options={getEntityOptions(apiData)}
              selectedValue={selectedEntity}
              onChange={(option) => {
                setSelectedEntity(option || undefined);
                setSelectedDepartment(undefined);
                setSelectedStatus(undefined);
              }}
              placeholder="Select entity"
              isClearable={true}
            />

            <CustomSelect
              label="Department"
              options={getDepartmentOptions(apiData, selectedEntity)}
              selectedValue={selectedDepartment}
              onChange={(option) => {
                setSelectedDepartment(option || undefined);
                setSelectedStatus(undefined);
              }}
              placeholder="Select department"
              isClearable={true}
              isDisabled={!selectedEntity}
            />

            <CustomSelect
              label="Status"
              options={getStatusOptions(
                apiData,
                selectedEntity,
                selectedDepartment
              )}
              selectedValue={selectedStatus}
              onChange={(option) => setSelectedStatus(option || undefined)}
              placeholder="Select status"
              isClearable={true}
              isDisabled={!selectedEntity}
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
            <div
              className="bg-secondary-color-lt flex flex-col p-2 md:p-4 grow shrink basis-0 min-w-0 max-w-full rounded-lg shadow-sm border border-border mb-6 overflow-hidden"
              style={{ minWidth: 0, minHeight: 0, height: 480 }}
            >
              <h2 className="text-xl font-semibold text-primary-lt pt-2 pb-2 text-center">
                Pipeline by Status (Net Amount)
              </h2>
              <ResponsiveBar
                data={barData}
                indexBy="status"
                keys={["netAmount"]}
                colors={({ data }) => data.color}
                labelSkipHeight={16}
                labelSkipWidth={16}
                labelTextColor="inherit:darker(1.4)"
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
                Proposals by Department
              </h2>
              <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
                <div className="w-full h-[380px] max-w-full">
                  <ResponsivePie
                    data={pieData}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
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
                    legends={[
                      {
                        anchor: "bottom",
                        direction: "row",
                        translateY: 56,
                        itemWidth: 100,
                        itemHeight: 18,
                        symbolShape: "circle",
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
                totalItems={tableData.length}
                startIndex={
                  tableData.length === 0
                    ? 0
                    : table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                      1
                }
                endIndex={Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  tableData.length
                )}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};
export default ProjectionPipelineDashboard;
