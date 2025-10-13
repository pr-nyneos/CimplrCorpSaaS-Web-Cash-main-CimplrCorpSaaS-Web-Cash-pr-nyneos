import Layout from "../../components/layout/Layout";
import CustomSelect from "../../components/ui/SearchSelect";
import { useMemo, useState, useEffect } from "react";
import { RotateCcw, FileText, Download, FileDown } from "lucide-react";
import type { ReactNode } from "react";
import { ChartContainer } from "./dashboardsContainer/ChartContainer";
import { PieChart } from "./dashboardsContainer/PieChart";
import { BarChart } from "./dashboardsContainer/BarChart";
import {
  defaultColorPalette,
  currencySymbols,
  getColor,
} from "./dashboardsContainer/ChartUtils";
import NyneOSTable2 from "./NyneOSTable2";
import {  
getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getSortedRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
} from "@tanstack/react-table";
import nos from "../../utils/nos";
import { ColumnPicker } from "../../components/ui/ColumnPicker";
import { exportToExcel, exportToPDF, exportToWord } from "../../utils/exportToExcel";

const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || "";

type ApiBankData = {
  entity: string;
  banks: {
    bank: string;
    currencies: { currency: string; balance: number }[];
  }[];
};

type detailedBankBalances = {
  entity: string;
  bank: string;
  accountNumber: string;
  currency: string;
  balanceAccountCcy: number;
  equivalentINR: number;
}

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

const columns: ColumnDef<detailedBankBalances>[] = [
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
];

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

function getBarData(
  data: ApiBankData[],
  selectedEntity?: string,
  selectedBank?: string,
  selectedCurrency?: string
): Record<string, string | number>[] {
  if (!Array.isArray(data)) return [];

  if (selectedEntity) {
    // When entity is selected, show bars for each bank
    const entityData = data.find((entity) => entity.entity === selectedEntity);
    if (!entityData) return [];

    return entityData.banks
      .filter((bank) => !selectedBank || bank.bank === selectedBank)
      .map((bank, idx) => {
        let sum = 0;
        bank.currencies.forEach((c) => {
          if (!selectedCurrency || c.currency === selectedCurrency) {
            sum += c.balance;
          }
        });
        return {
          bank: bank.bank,
          amount: sum,
          color: getColor(idx),
        };
      });
  } else {
    // When no entity is selected, show stacked bars by entity
    const allBanks = Array.from(
      new Set(data.flatMap((entity) => entity.banks.map((b) => b.bank)))
    );
    return data.map((entity) => {
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

function getBankOptions(apiData: ApiBankData[], selectedEntity?: string) {
  if (!Array.isArray(apiData)) return [];

  // If an entity is selected, only show banks for that entity
  if (selectedEntity) {
    const entityData = apiData.find((e) => e.entity === selectedEntity);
    if (!entityData) return [];
    const banks = Array.from(new Set(entityData.banks.map((b) => b.bank)));
    return banks.map((bank) => ({ value: bank, label: bank }));
  }

  // If no entity is selected, show all banks
  const banks = Array.from(
    new Set(apiData.flatMap((e) => e.banks.map((b) => b.bank)))
  );
  return banks.map((bank) => ({ value: bank, label: bank }));
}

function getCurrencyOptions(
  apiData: ApiBankData[],
  selectedEntity?: string,
  selectedBank?: string
) {
  if (!Array.isArray(apiData)) return [];

  let filteredData = apiData;

  // Filter by entity if selected
  if (selectedEntity) {
    filteredData = apiData.filter((e) => e.entity === selectedEntity);
  }

  // Filter by bank if selected
  if (selectedBank) {
    const currencies = Array.from(
      new Set(
        filteredData.flatMap((e) =>
          e.banks
            .filter((b) => b.bank === selectedBank)
            .flatMap((b) => b.currencies.map((c) => c.currency))
        )
      )
    );
    return currencies.map((currency) => ({ value: currency, label: currency }));
  }

  // If no bank is selected, show all currencies for the filtered entities
  const currencies = Array.from(
    new Set(
      filteredData.flatMap((e) =>
        e.banks.flatMap((b) => b.currencies.map((c) => c.currency))
      )
    )
  );
  return currencies.map((currency) => ({ value: currency, label: currency }));
}

function DemoBankBalancesDashboard() {
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>();
  const [selectedBank, setSelectedBank] = useState<string | undefined>();
  const [selectedCurrency, setSelectedCurrency] = useState<
    string | undefined
  >();
  const [apiData, setApiData] = useState<ApiBankData[]>([]);
  const [tableData, setTableData] = useState<detailedBankBalances[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await nos.post<ApiBankData[]>(
        `${apiBaseUrl}/dash/bank-balance/approved`
      );
      setApiData(res.data);
      const res2 = await nos.post<detailedBankBalances[]>(
        `${apiBaseUrl}/dash/bank-balance/currency-wise`
      );
      setTableData(res2.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle entity change and clear dependent dropdowns
  const handleEntityChange = (value: string | undefined) => {
    setSelectedEntity(value);
    // Clear bank and currency when entity changes
    setSelectedBank(undefined);
    setSelectedCurrency(undefined);
  };

  // Handle bank change and clear dependent dropdowns
  const handleBankChange = (value: string | undefined) => {
    setSelectedBank(value);
    // Clear currency when bank changes
    setSelectedCurrency(undefined);
  };

  // Handle currency change
  const handleCurrencyChange = (value: string | undefined) => {
    setSelectedCurrency(value);
  };

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

  // Create selected filters array for display
  const selectedFilters = useMemo(() => {
    const filters = [];
    if (selectedEntity) {
      filters.push({ label: "Entity", value: selectedEntity });
    }
    if (selectedBank) {
      filters.push({ label: "Bank", value: selectedBank });
    }
    if (selectedCurrency) {
      filters.push({ label: "Currency", value: selectedCurrency });
    }
    return filters;
  }, [selectedEntity, selectedBank, selectedCurrency]);

  const filters = [
    {
      label: "Entity",
      options: getEntityOptions(apiData),
      selectedValue: selectedEntity,
      onChange: handleEntityChange,
      placeholder: "Select Entity",
      isClearable: true,
    },
    {
      label: "Bank",
      options: getBankOptions(apiData, selectedEntity),
      selectedValue: selectedBank,
      onChange: handleBankChange,
      placeholder: "Select Bank",
      isClearable: true,
    },
    {
      label: "Currency",
      options: getCurrencyOptions(apiData, selectedEntity, selectedBank),
      selectedValue: selectedCurrency,
      onChange: handleCurrencyChange,
      placeholder: "Select Currency",
      isClearable: true,
    },
  ];

  const filterActions = (
    <button
      className="bg-primary hover:bg-primary-hover text-white border-2 border-primary text-center rounded px-4 py-2 font-bold transition flex items-center gap-2"
      onClick={fetchData}
      disabled={loading}
    >
      <RotateCcw className="w-5 h-5" />
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  );

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

  // Export handlers
  const handleExportToExcel = () => {
    const exportData = table.getRowModel().rows.map(row => row.original);
    exportToExcel(exportData, "bank-balances-report", { fxType: "Bank Balances" });
  };

  const handleExportToPDF = () => {
    const exportData = table.getRowModel().rows.map(row => row.original);
    exportToPDF(exportData, "bank-balances-report", columns, "Bank Balances");
  };

  const handleExportToWord = () => {
    const exportData = table.getRowModel().rows.map(row => row.original);
    exportToWord(exportData, "bank-balances-report", columns, { fxType: "Bank Balances" });
  };

  return (
    <Layout title="Detailed Bank Dashboard">
      {loading && <div className="text-center py-4">Loading...</div>}
      {error && <div className="text-center text-red-500 py-4">{error}</div>}

      <div className="bg-secondary-color-lt p-6 rounded-lg shadow-sm border border-border mb-6">
        <DashboardFilters filters={filters} actions={filterActions} />

        <div className="flex flex-wrap w-full gap-6 px-0 justify-center mt-6 items-stretch">
          <ChartContainer
            title="Entity-Wise Balances"
            exportFileName="entity-wise-balances.svg"
            className="grow shrink basis-0"
            selectedFilters={selectedFilters}
          >
            <BarChart
              data={barData}
              indexBy={selectedEntity ? "bank" : "entity"}
              keys={selectedEntity ? ["amount"] : allBanks}
              groupMode="stacked"
              height={500}
              colorPalette={defaultColorPalette}
              currencySymbols={currencySymbols}
            />
          </ChartContainer>

          <ChartContainer
            title="Currency-Wise Balances"
            exportFileName="currency-wise-balances.svg"
            className="grow shrink basis-0"
            selectedFilters={selectedFilters}
          >
            <PieChart
              data={pieData}
              height={540}
              currencySymbols={currencySymbols}
            />
          </ChartContainer>
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
                    onClick={handleExportToExcel}
                  >
                    <Download className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Export to PDF"
                    onClick={handleExportToPDF}
                  >
                    <FileDown className="flex items-center justify-center text-primary group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                    title="Export to Word"
                    onClick={handleExportToWord}
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
                  {table.getVisibleLeafColumns().map((col) => {
                    const footerContent =
                      {
                        entity: "Total",
                        equivalentINR: formatCurrency(totalAmount, "INR"),
                      }[col.id] ?? null;

                    return (
                      <td
                        key={col.id}
                        className="px-6 py-2 text-white text-sm text-start border-t border-border"
                      >
                        {footerContent}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </NyneOSTable2>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DemoBankBalancesDashboard;
