import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { addDays, addWeeks, addMonths, format } from "date-fns";
import nos from "../../../utils/nos";
import Button from "../../../components/ui/Button";
import CustomSelect from "../../../components/ui/SearchSelect";
import Layout from "../../../components/layout/Layout";
// import NyneOSTableExpanded from "../../cashDashboard/NyneOSTableExpaned";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// 
const periodOptions = [
  { label: "3 Month", value: "3month", horizon: 3 },
  { label: "6 Month", value: "6month", horizon: 6 },
  // { label: "9 Month", value: "9month", horizon: 9 },
  // { label: "12 Month", value: "12month", horizon: 12 },
];

const initialRow = {
  entity: "",
  bankAccount: "",
  period: "",
};

export type AvailabilitySummary = {
  category: string;
  projected: string;
  actual: string;
  subRows?: AvailabilitySummary[];
};

export type ApiResponse = {
  rows: {
    date: string;
    category: string;
    type: string;
    actual: number;
    forecast: number;
    variance: number;
  }[];
  success: boolean;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL; // Add this if not present

const FundAvailability = () => {
  const [row, setRow] = useState(initialRow);
  const [BUEntityOptions, setBUEntityOptions] = useState<{ value: string; label: string }[]>([]);
  const [bankAccountOptions, setBankAccountOptions] = useState<{ label: string; value: string }[]>([]);
  const navigate = useNavigate();
  const [apiData, setApiData] = useState<ApiResponse["rows"]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [viewGenerated, setViewGenerated] = useState(false);

  const allFieldsFilled = row.entity && row.bankAccount && row.period;
  const handleInputChange = (field: string, value: string) => {
    setRow((prev) => ({ ...prev, [field]: value }));
    setViewGenerated(false); // Hide view when any field changes
  };

  // Function to fetch data from API
  const fetchForecastData = async () => {
    if (!allFieldsFilled) return;
    setViewGenerated(true); // Show view only after Generate is clicked
    
    // Get horizon value from selected period
    const selectedPeriod = periodOptions.find(p => p.value === row.period);
    const horizon = selectedPeriod?.horizon || 3;
    
    setLoading(true);
    try {
      const response = await nos.post<ApiResponse>(`${apiBaseUrl}/dash/forecast-vs-actual/by-month`, {
        entity_name: "",
        account_id: "",
        horizon: horizon,
      });
      
      if (response.data.success) {
        setApiData(response.data.rows);
      } else {
        console.error('API returned success: false');
        setApiData([]);
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      setApiData([]);
    } finally {
      setLoading(false);
    }
  };

  // Transform API data to match the table structure
  const transformApiDataToTableFormat = (apiRows: ApiResponse["rows"], period: string): AvailabilitySummary[] => {
    if (apiRows.length === 0) return [];

    // Generate expected date range based on period (not from API)
    const today = new Date();
    let expectedDates: string[] = [];
    
    if (period === "daily") {
      expectedDates = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        return format(date, "yyyy-MM-dd");
      });
    } else if (period === "weekly") {
      expectedDates = Array.from({ length: 4 }, (_, i) => {
        const date = addWeeks(today, i);
        return format(date, "yyyy-MM-dd");
      });
    } else if (period === "3month") {
      expectedDates = Array.from({ length: 3 }, (_, i) => {
        const date = addMonths(today, i);
        return format(date, "yyyy-MM-dd");
      });
    } else if (period === "9month") {
      expectedDates = Array.from({ length: 9 }, (_, i) => {
        const date = addMonths(today, i);
        return format(date, "yyyy-MM-dd");
      });
    } else if (period === "12month") {
      expectedDates = Array.from({ length: 12 }, (_, i) => {
        const date = addMonths(today, i);
        return format(date, "yyyy-MM-dd");
      });
    }
    
    // Format dates for display headers
    const dateHeaders = expectedDates.map(date => {
      const dateObj = new Date(date);
      if (period === "daily" || period === "weekly") {
        return format(dateObj, "dd-MMM");
      } else if (period === "3month" || period === "6month" || period === "9month" || period === "12month") {
        return format(dateObj, "MMM-yy");
      }
      return format(dateObj, "dd-MMM"); // fallback
    });

    const grouped: { [key: string]: { [category: string]: { [date: string]: { actual: number; forecast: number } } } } = {};
    
    // Group data by type (Inflow/Outflow), category, and date - only include data within expected date range
    apiRows.forEach(row => {
      const rowDateStr = format(new Date(row.date), "yyyy-MM-dd");
      
      // Only process data that falls within our expected date range
      if (!expectedDates.includes(rowDateStr)) return;
      
      const type = row.type || (row.actual >= 0 ? 'Inflow' : 'Outflow');
      const typeKey = type === 'Inflow' ? 'Inflow (+)' : 'Outflow (-)';
      const rowDate = new Date(row.date);
      let dateKey = "";
      
      // Match API date to our period headers
      if (period === "daily" || period === "weekly") {
        dateKey = format(rowDate, "dd-MMM");
      } else if (period === "3month" || period === "6month" || period === "9month" || period === "12month") {
        dateKey = format(rowDate, "MMM-yy");
      }
      
      if (!grouped[typeKey]) {
        grouped[typeKey] = {};
      }
      
      if (!grouped[typeKey][row.category]) {
        grouped[typeKey][row.category] = {};
      }
      
      if (!grouped[typeKey][row.category][dateKey]) {
        grouped[typeKey][row.category][dateKey] = { actual: 0, forecast: 0 };
      }
      
      grouped[typeKey][row.category][dateKey].actual += row.actual;
      grouped[typeKey][row.category][dateKey].forecast += row.forecast;
    });

    // Convert to AvailabilitySummary format with date-specific data
    return Object.entries(grouped).map(([typeKey, categories]) => {
      const mainRowData: any = { category: typeKey };
      const subRows: any[] = [];

      // Calculate totals for main row and prepare subrows
      dateHeaders.forEach(dateHeader => {
        let totalProjected = 0;
        let totalActual = 0;

        Object.entries(categories).forEach(([category, dateData]) => {
          const data = dateData[dateHeader] || { actual: 0, forecast: 0 };
          totalProjected += data.forecast;
          totalActual += data.actual;
        });

        mainRowData[`${dateHeader}-projected`] = totalProjected.toFixed(2);
        mainRowData[`${dateHeader}-actual`] = totalActual.toFixed(2);
      });

      // Prepare subrows
      Object.entries(categories).forEach(([category, dateData]) => {
        const subRowData: any = { category };
        dateHeaders.forEach(dateHeader => {
          const data = dateData[dateHeader] || { actual: 0, forecast: 0 };
          // Format negative values with parentheses
          subRowData[`${dateHeader}-projected`] = data.forecast < 0 ? 
            `(${Math.abs(data.forecast).toFixed(2)})` : data.forecast.toFixed(2);
          subRowData[`${dateHeader}-actual`] = data.actual < 0 ? 
            `(${Math.abs(data.actual).toFixed(2)})` : data.actual.toFixed(2);
        });
        subRows.push(subRowData);
      });

      // Format main row totals with parentheses for negative values
      dateHeaders.forEach(dateHeader => {
        const projectedValue = parseFloat(mainRowData[`${dateHeader}-projected`]);
        const actualValue = parseFloat(mainRowData[`${dateHeader}-actual`]);
        
        mainRowData[`${dateHeader}-projected`] = projectedValue < 0 ? 
          `(${Math.abs(projectedValue).toFixed(2)})` : projectedValue.toFixed(2);
        mainRowData[`${dateHeader}-actual`] = actualValue < 0 ? 
          `(${Math.abs(actualValue).toFixed(2)})` : actualValue.toFixed(2);
      });

      mainRowData.subRows = subRows;
      return mainRowData;
    });
  };

  // Removed unused generateDynamicColumns function

  // Custom header component to display month headers (not used in this implementation)
  // const CustomHeader = ({ header }: { header: any }) => {
  //   const monthHeader = header.column.columnDef.meta?.monthHeader;
  //   if (monthHeader) {
  //     return (
  //       <div className="text-center font-bold">{monthHeader}</div>
  //     );
  //   }
  //   return <div>{header.column.columnDef.header as string}</div>;
  // };

  // Get transformed API data
  const transformedData = useMemo(() => {
    return row.period ? transformApiDataToTableFormat(apiData, row.period) : [];
  }, [apiData, row.period]);

  const dynamicData = useMemo(
    () => transformedData,
    [transformedData]
  );


  const filteredTableData = useMemo(() => {
    if (!searchTerm.trim()) return dynamicData;
    const lowerSearch = searchTerm.toLowerCase();
    const filterFn = (item: any) => {
      return Object.values(item)
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(lowerSearch));
    };

    const filterRows = (rows: any[]): any[] =>
      rows
        .map((row) => {
          let match = filterFn(row);
          let subRows = row.subRows ? filterRows(row.subRows) : undefined;
          if (match || (subRows && subRows.length > 0)) {
            return { ...row, subRows };
          }
          return null;
        })
        .filter(Boolean) as any[];
    return filterRows(dynamicData);
  }, [dynamicData, searchTerm]);

  // Group columns by month for header rendering
  const groupedColumns = useMemo(() => {
    if (!row.period) return [];
    
    // Generate expected date range based on period (same logic as transform function)
    const today = new Date();
    let expectedDates: string[] = [];
    
    if (row.period === "daily") {
      expectedDates = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        return format(date, "yyyy-MM-dd");
      });
    } else if (row.period === "weekly") {
      expectedDates = Array.from({ length: 4 }, (_, i) => {
        const date = addWeeks(today, i);
        return format(date, "yyyy-MM-dd");
      });
    } else if (row.period === "3month") {
      expectedDates = Array.from({ length: 3 }, (_, i) => {
        const date = addMonths(today, i);
        return format(date, "yyyy-MM-dd");
      });
    } else if (row.period === "9month") {
      expectedDates = Array.from({ length: 9 }, (_, i) => {
        const date = addMonths(today, i);
        return format(date, "yyyy-MM-dd");
      });
    } else if (row.period === "12month") {
      expectedDates = Array.from({ length: 12 }, (_, i) => {
        const date = addMonths(today, i);
        return format(date, "yyyy-MM-dd");
      });
    }
    
    // Format dates for display headers
    const headers = expectedDates.map(date => {
      const dateObj = new Date(date);
      if (row.period === "daily" || row.period === "weekly") {
        return format(dateObj, "dd-MMM");
      } else if (row.period === "3month" || row.period === "6month" || row.period === "9month" || row.period === "12month") {
        return format(dateObj, "MMM-yy");
      }
      return format(dateObj, "dd-MMM"); // fallback
    });

    return headers.map(header => ({
      header,
      columns: [
        { accessor: `${header}-projected`, header: "PROJECTED" },
        { accessor: `${header}-actual`, header: "ACTUAL" },
      ],
    }));
  }, [row.period]);

  useEffect(() => {
    // Fetch Business Unit / Entity Names
    nos
      .post<{
        results: {
          entity_id: string;
          entity_name: string;
          entity_short_name: string;
        }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/entitycash/all-names`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setBUEntityOptions(
            response.data.results.map((item) => ({
              value: item.entity_name,
              label: item.entity_name,
            }))
          );
        } else {
          setBUEntityOptions([]);
        }
      })
      .catch(() => setBUEntityOptions([]));

    // Fetch Bank Accounts
    nos
      .post<{ success: boolean; rows: { bank_name: string; account_no: string; account_id: string }[] }>(
        `${apiBaseUrl}/master/bankaccount/pre-populate`
      )
      .then((res) => {
        if (res.data?.success && res.data.rows) {
          setBankAccountOptions(
            res.data.rows.map((acc) => ({
              value: acc.account_id, // Use account_id as value
              label: `${acc.bank_name} - ${acc.account_no}`, // Show bank name and account number
            }))
          );
        } else {
          setBankAccountOptions([]);
        }
      })
      .catch(() => setBankAccountOptions([]));
  }, []);

  // Reset function
  const handleReset = () => {
    setRow(initialRow);
    setApiData([]);
    setExpanded({});
  };

  return (
    <Layout title="Fund Availability">
      <div className="grid grid-cols-4 gap-4 items-end">
        <CustomSelect
          label="Entity"
          options={BUEntityOptions}
          selectedValue={row.entity}
          onChange={(value) => handleInputChange("entity", value)}
          placeholder="Select entity"
          isClearable
          isSearchable
        />
        <CustomSelect
          label="Bank Account"
          options={bankAccountOptions}
          selectedValue={row.bankAccount}
          onChange={(value) => handleInputChange("bankAccount", value)}
          placeholder="Select bank account"
          isClearable
          isSearchable
        />
        <CustomSelect
          label="Period"
          options={periodOptions}
          selectedValue={row.period}
          onChange={(value) => handleInputChange("period", value)}
          placeholder="Select period"
          isClearable
          isSearchable
        />
        
        <Button type="button" color="Green" onClick={fetchForecastData} disabled={!allFieldsFilled || loading}>
          {loading ? "Loading..." : "Generate View"}
        </Button>
      </div>

      {viewGenerated && allFieldsFilled && (
        <div className="mt-8 space-y-4 ">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 bg-white rounded-lg shadow p-6">
              <div className="font-semibold text-lg mb-2">Limits Available</div>
              <div className="flex justify-between mb-1">
                <span>Non-Fund Based</span>
                <span className="font-bold">N/A</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Cash Credit (CC)</span>
                <span className="font-bold">N/A</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Overdraft (OD)</span>
                <span className="font-bold">N/A</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-green-600">
                <span>Total Available</span>
                <span className="text-2xl font-bold">00.00</span>
              </div>
            </div>

            {/* Buttons in a line */}
            <div className="flex flex-col gap-6 p-4">
              <Button type="button" color="Fade" onClick={() => navigate("/fund-planning") }>
                Fund Planning
              </Button>
              <Button type="button" color="Disable" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="button" color="Green" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className=" gap-3 flex flex-col">
              <h2 className="text-xl pl-2 font-semibold text-primary-lt pt-6">
                {loading ? "Loading fund availability data..." : 
                 apiData.length > 0 ? `Displaying fund availability for selected account` :
                 "Select all fields and click 'Generate View' to see fund availability data"}
              </h2>
            </div>
            <div className="shadow-lg border border-border lg:overflow-x-auto md:overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-secondary-color rounded-xl">

                  <tr>
                    <th className="px-6 py-4 border-b border-border" colSpan={2}></th>
                    {groupedColumns.map((monthGroup) => (
                      <th key={monthGroup.header} className="px-6 py-4 text-center border-b border-border text-header-color text-sm font-semibold uppercase tracking-wider" colSpan={2}>
                        {monthGroup.header}
                      </th>
                    ))}
                  </tr>
                  
                  <tr>
                    <th className="px-6 py-4 border-b border-border text-left text-header-color text-sm font-semibold uppercase tracking-wider" colSpan={2}>CATEGORY</th>
                    {groupedColumns.flatMap((monthGroup) => [
                      <th key={`${monthGroup.header}-projected`} className="px-6 py-4 text-center border-b border-border text-header-color text-sm font-semibold uppercase tracking-wider">
                        PROJECTED
                      </th>,
                      <th key={`${monthGroup.header}-actual`} className="px-6 py-4 text-center border-b border-border text-header-color text-sm font-semibold uppercase tracking-wider">
                        ACTUAL
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={2 + groupedColumns.length * 2} className="px-6 py-12 text-center text-primary">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredTableData.length === 0 ? (
                    <tr>
                      <td colSpan={2 + groupedColumns.length * 2} className="px-6 py-12 text-center text-primary">
                        {apiData.length === 0 ? "No data available. Click 'Generate View' to fetch data." : "No data matches your search."}
                      </td>
                    </tr>
                  ) : (
                    filteredTableData.map((rowData, rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        <tr
                          className={
                            rowIndex % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"
                          }
                        >
                          <td className="px-6 py-4 border-b border-border">
                            {rowData.subRows && (
                              <button
                                onClick={() => {
                                  const newExpanded = { ...expanded };
                                  if (newExpanded[rowIndex]) {
                                    delete newExpanded[rowIndex];
                                  } else {
                                    newExpanded[rowIndex] = true;
                                  }
                                  setExpanded(newExpanded);
                                }}
                                className="flex items-center justify-center ml-4 w-6 h-6 text-primary hover:bg-gray-100 rounded transition focus:outline-none"
                              >
                                {expanded[rowIndex] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-secondary-text-dark text-sm border-b border-border font-bold">{rowData.category}</td>
                          {groupedColumns.flatMap((monthGroup) => [
                            <td key={`${monthGroup.header}-projected-${rowIndex}`} className="px-6 py-4 text-center border-b border-border text-secondary-text-dark text-sm font-bold">
                              {rowData[`${monthGroup.header}-projected`]}
                            </td>,
                            <td key={`${monthGroup.header}-actual-${rowIndex}`} className="px-6 py-4 text-center border-b border-border text-secondary-text-dark text-sm font-bold">
                              {rowData[`${monthGroup.header}-actual`]}
                            </td>,
                          ])}
                        </tr>
                        {expanded[rowIndex] && rowData.subRows?.map((subRow: any, subIndex: number) => (
                          <tr key={`${rowIndex}-${subIndex}`} className={subIndex % 2 === 0 ? "bg-secondary-color-lt" : "bg-primary-md"}>
                            <td className="px-6 py-4 border-b border-border"></td>
                            <td className="px-6 py-4 text-secondary-text-dark text-sm border-b border-border font-normal">{subRow.category}</td>
                            {groupedColumns.flatMap((monthGroup) => [
                              <td key={`${monthGroup.header}-projected-${rowIndex}-${subIndex}`} className="px-6 py-4 text-center pl-16 border-b border-border text-secondary-text-dark text-sm font-normal">
                                {subRow[`${monthGroup.header}-projected`]}
                              </td>,
                              <td key={`${monthGroup.header}-actual-${rowIndex}-${subIndex}`} className="px-6 py-4 text-center pl-16 border-b border-border text-secondary-text-dark text-sm font-normal">
                                {subRow[`${monthGroup.header}-actual`]}
                              </td>,
                            ])}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-primary font-semibold sticky bottom-0 z-10">
                  <tr>
                    <td className="px-6 py-2 text-white text-sm text-start border-t border-border" colSpan={2}>Net Surplus/Deficit</td>
                    {groupedColumns.flatMap((monthGroup) => {
                      // Sum Projected and Actual for this column
                      let projectedSum = 0;
                      let actualSum = 0;
                      filteredTableData.forEach((row) => {
                        const projectedValue = row[`${monthGroup.header}-projected`];
                        const actualValue = row[`${monthGroup.header}-actual`];
                        
                        const projected = Number((projectedValue || "0").toString().replace(/[(),]/g, ""));
                        const actual = Number((actualValue || "0").toString().replace(/[(),]/g, ""));
                        
                        // Handle negative values properly (for outflow)
                        const projectedMultiplier = projectedValue && projectedValue.toString().includes('(') ? -1 : 1;
                        const actualMultiplier = actualValue && actualValue.toString().includes('(') ? -1 : 1;
                        
                        projectedSum += (isNaN(projected) ? 0 : projected) * projectedMultiplier;
                        actualSum += (isNaN(actual) ? 0 : actual) * actualMultiplier;
                      });
                      return [
                        <td key={`${monthGroup.header}-projected-total`} className="px-6 py-2 text-white text-sm text-center border-t border-border">
                          {projectedSum > 0 ? projectedSum.toLocaleString() : `(${Math.abs(projectedSum).toLocaleString()})`}
                        </td>,
                        <td key={`${monthGroup.header}-actual-total`} className="px-6 py-2 text-white text-sm text-center border-t border-border">
                          {actualSum > 0 ? actualSum.toLocaleString() : `(${Math.abs(actualSum).toLocaleString()})`}
                        </td>
                      ];
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FundAvailability;
