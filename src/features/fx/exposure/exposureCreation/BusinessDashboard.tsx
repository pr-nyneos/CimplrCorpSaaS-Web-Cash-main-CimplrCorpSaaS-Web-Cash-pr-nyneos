import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type Row,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import type { Range } from "react-date-range";
import { useNotification } from "../../../../app/providers/NotificationProvider/Notification.tsx";
import { Download, Search } from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import NyneOSTable2 from "../../../cashDashboard/NyneOSTable2.tsx";
import nos from "../../../../utils/nos.tsx";
import Button from "../../../../components/ui/Button.tsx";
import Pagination from "../../../../components/table/Pagination.tsx";
import { useNavigate } from "react-router-dom";
import DateRangeFilter from "../../../../components/ui/DateRangeFilter.tsx";
import { useAllTabPermissions } from "../../../../hooks/useAllTabPermission.tsx";
import CustomSelect from "../../../../components/ui/SearchSelect.tsx";
import { ColumnPicker } from "../../../../components/ui/ColumnPicker.tsx";
import { exportToExcel } from "../../../../utils/exportToExcel.ts";
import { formatToDDMMYYYY } from "../../../../utils/formatDate.ts";
import GridMasterOSTable from "../../../../components/table/GridMasterOSTable";

const DateInput: React.FC<{
  isDisabled: boolean;
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ isDisabled, label, value, onChange }) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
      />
    </div>
  );
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type BusinessDashboard = {
  exposure_header_id: string;
  company_code: string;
  counterparty_name: string;
  currency: string;
  document_id: string;
  posting_date: string; // ISO Date string
  value_date: string; // ISO Date string
  new_due_date: string;
  aging_days: number;
  total_open_amount: number;
  exposure_category: string; // e.g. "FBL1N"
};

type kpiSnapshot = {
  company_code: string;
  counterparty_name: string;
  currency: string;
  document_id: string;
  posting_date: string;
  value_date: string;
  new_due_date: string;
  total_open_amount: number;
  exposure_category: string;
};

const defaultColumnVisibility: Record<string, boolean> = {
  company_code: true,
  counterparty_name: true,
  currency: true,
  document_id: true,
  posting_date: true,
  value_date: true,
  new_due_date: true,
  aging_days: true,
  total_open_amount: true,
  exposure_category: true,
  action: false,
  select: true,
  expand: false,
};

const sourceOptions = [
  { value: "FBL5N", label: "FBL5N" },
  { value: "FBL3N", label: "FBL3N" },
  { value: "FBL1N", label: "FBL1N" },
];

const BusinessDashboard = () => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select", // UI
    "company_code",
    "counterparty_name",
    "currency",
    "document_id",
    "posting_date",
    "value_date",
    "new_due_date",
    "aging_days",
    "total_open_amount",
    "exposure_category",
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<BusinessDashboard[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter states for dropdowns
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [currencyFilter, setCurrencyFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");

  // Business Adjustments state
  const [dueDateShiftDays, setDueDateShiftDays] = useState<number>();
  const [bulkDueDate, setBulkDueDate] = useState<string>("");

  const navigate = useNavigate();
  const visibility = useAllTabPermissions("fx-exposure");
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const [dateRange, setDateRange] = useState<Range[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    },
  ]);

  const [initialNewDueDates, setInitialNewDueDates] = useState<string[]>([]);

  // Store initial new_due_date values from data when page mounts
  useEffect(() => {
    setInitialNewDueDates(data.map((item) => item.new_due_date));
    // Only run on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to parse ISO date string
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    // Accepts "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ssZ"
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Function to calculate aging in days
  const calculateAging = (postDate: string, dueDate: string): number => {
    const post = parseDate(postDate);
    const due = parseDate(dueDate);

    if (!post || !due) return 0;

    const diffTime = due.getTime() - post.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply dropdown filters
    if (companyFilter) {
      result = result.filter((item) => item.company_code === companyFilter);
    }
    if (currencyFilter) {
      result = result.filter((item) => item.currency === currencyFilter);
    }
    if (partyFilter) {
      result = result.filter((item) => item.counterparty_name === partyFilter);
    }
    if (sourceFilter) {
      result = result.filter((item) => item.exposure_category === sourceFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item)
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(lowerSearch));
      });
    }

    // Apply date range filter to value_date field
    if (dateRange[0].startDate && dateRange[0].endDate) {
      const start = new Date(dateRange[0].startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange[0].endDate);
      end.setHours(23, 59, 59, 999);

      result = result.filter((item) => {
        const valueDate = parseDate(item.value_date);
        if (!valueDate) return false;
        return valueDate >= start && valueDate <= end;
      });
    }

    // Calculate aging dynamically for each row
    result = result.map((item) => {
      // Use new_due_date if it exists and is not empty, otherwise use value_date
      const dueDate =
        item.new_due_date && item.new_due_date.trim() !== ""
          ? item.new_due_date
          : item.value_date;

      return {
        ...item,
        aging_days: calculateAging(item.posting_date, dueDate),
      };
    });

    return result;
  }, [
    data,
    searchTerm,
    companyFilter,
    currencyFilter,
    partyFilter,
    sourceFilter,
    dateRange,
  ]);

  const { notify, confirm } = useNotification();

  // Function to apply due date shift to all selected rows
  const handleApplyDueDateShift = () => {
    const selectedRows = table.getSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      notify("Please select rows to apply due date shift.", "warning");
      return;
    }

    setData((prevData) => {
      const updatedData = [...prevData];

      selectedRows.forEach((row) => {
        const rowIndex = updatedData.findIndex(
          (item) =>
            item.company_code === row.original.company_code &&
            item.counterparty_name === row.original.counterparty_name &&
            item.document_id === row.original.document_id
        );

        if (rowIndex !== -1) {
          const currentDueDate = parseDate(updatedData[rowIndex].value_date);
          if (currentDueDate) {
            const newDueDate = new Date(currentDueDate);
            newDueDate.setDate(newDueDate.getDate() + dueDateShiftDays);

            // Format back to YYYY-MM-DD
            const year = newDueDate.getFullYear();
            const month = String(newDueDate.getMonth() + 1).padStart(2, "0");
            const day = String(newDueDate.getDate()).padStart(2, "0");
            const formattedDate = `${year}-${month}-${day}`;

            updatedData[rowIndex] = {
              ...updatedData[rowIndex],
              new_due_date: formattedDate,
            };
          }
        }
      });

      return updatedData;
    });

    notify(
      `Due date shift of ${dueDateShiftDays} days applied to ${selectedRows.length} rows.`,
      "success"
    );
  };

  const handleDateUpdate = (rowIndex: number, newDate: string) => {
    setData((prevData) => {
      const updatedData = [...prevData];
      if (updatedData[rowIndex]) {
        updatedData[rowIndex] = {
          ...updatedData[rowIndex],
          new_due_date: newDate,
        };
      }
      return updatedData;
    });
  };

  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return "";
    // Expecting "YYYY-MM-DD"
    return dateStr;
  };

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    return dateStr;
  };

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      action: !!visibility.delete,
    }));
  }, [visibility.delete]);

  const columns = useMemo<ColumnDef<BusinessDashboard>[]>(
    () => [
      // Select
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-primary-lt focus:ring-2"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-primary-lt focus:ring-2"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },

      // Core columns
      {
        accessorKey: "company_code",
        header: "Company",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "counterparty_name",
        header: "Party",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "document_id",
        header: "Document ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "posting_date",
        header: "Posting Date",
        cell: ({ getValue }) => (
          <span>{formatToDDMMYYYY(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "value_date",
        header: "Due (original) Date",
        cell: ({ getValue }) => (
          <span>{formatToDDMMYYYY(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "new_due_date",
        header: "New Due Date",
        cell: ({ row }) => {
          // Use new_due_date if present, otherwise fallback to value_date
          const rawDate =
            row.original.new_due_date && row.original.new_due_date.trim() !== ""
              ? row.original.new_due_date
              : row.original.value_date || "";

          const formatForInput = (dateStr: string) => {
            if (!dateStr) return "";
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
            if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
              const [dd, mm, yyyy] = dateStr.split("-");
              return `${yyyy}-${mm}-${dd}`;
            }
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              return `${year}-${month}-${day}`;
            }
            return "";
          };

          const rowIndex = data.findIndex(
            (item) =>
              item.company_code === row.original.company_code &&
              item.counterparty_name === row.original.counterparty_name &&
              item.document_id === row.original.document_id
          );

          return (
            <div className="w-40">
              <DateInput
                isDisabled={false}
                label=""
                value={formatForInput(rawDate)}
                onChange={(newDate) => {
                  handleDateUpdate(rowIndex, newDate);
                }}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "aging_days",
        header: "Aging (Days)",
        cell: ({ getValue }) => {
          const value = getValue() as number;
          return (
            <span className="inline-block px-3 py-0.5 rounded-full border border-red-200 bg-red-50 text-xs text-gray-700 font-medium">
              {value?.toLocaleString() ? `${value.toLocaleString()}d` : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "total_open_amount",
        header: "Adjusted (Signed)",
        cell: ({ getValue }) => <span>{(getValue() as number) || "—"}</span>,
      },
      {
        accessorKey: "exposure_category",
        header: "Source",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
    ],
    [data, formatDateForInput, formatDateForDisplay, handleDateUpdate]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    enableRowSelection: true,
    onRowSelectionChange: setSelectedRowIds,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    state: {
      columnOrder,
      rowSelection: selectedRowIds,
      columnVisibility,
      sorting,
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    enableMultiSort: true,
  });

  // KPI Snapshot data - summarized view of the filtered data
  const kpiSnapshotData = useMemo<kpiSnapshot[]>(() => {
    const summary: Record<string, kpiSnapshot> = {};

    filteredData.forEach((item) => {
      const key = `${item.company_code}-${item.counterparty_name}-${item.currency}`;
      const dueDate =
        item.new_due_date && item.new_due_date.trim() !== ""
          ? item.new_due_date
          : item.value_date;

      if (summary[key]) {
        summary[key].total_open_amount += item.total_open_amount;
      } else {
        summary[key] = {
          company_code: item.company_code,
          counterparty_name: item.counterparty_name,
          currency: item.currency,
          document_id: item.document_id,
          posting_date: item.posting_date,
          value_date: item.value_date,
          new_due_date: dueDate,
          total_open_amount: item.total_open_amount,
          exposure_category: item.exposure_category,
        };
      }
    });

    return Object.values(summary);
  }, [filteredData]);

  // KPI Snapshot columns
  const kpiSnapshotColumns = useMemo<ColumnDef<kpiSnapshot>[]>(
    () => [
      {
        accessorKey: "company_code",
        header: "Company",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "counterparty_name",
        header: "Party",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "document_id",
        header: "Document ID",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
      {
        accessorKey: "posting_date",
        header: "Posting Date",
        cell: ({ getValue }) => (
          <span>{formatToDDMMYYYY(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "value_date",
        header: "Due (original) Date",
        cell: ({ getValue }) => (
          <span>{formatToDDMMYYYY(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "new_due_date",
        header: "New Due Date",
        cell: ({ getValue }) => (
          <span>{formatToDDMMYYYY(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "total_open_amount",
        header: "Adjusted (signed)",
        cell: ({ getValue }) => <span>{(getValue() as number) || "—"}</span>,
      },
      {
        accessorKey: "exposure_category",
        header: "Source",
        cell: ({ getValue }) => <span>{(getValue() as string) || "—"}</span>,
      },
    ],
    []
  );

  // KPI Snapshot table
  const kpiSnapshotTable = useReactTable({
    data: kpiSnapshotData,
    columns: kpiSnapshotColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  // KPI Calculations
  const kpiMetrics = useMemo(() => {
    const totalRecords = filteredData.length;
    const totalAmount = filteredData.reduce(
      (sum, item) => sum + item.total_open_amount,
      0
    );
    const nonQualifiedCount = filteredData.filter(
      (item) => item.aging_days < 0
    ).length;
    const averageAging =
      totalRecords > 0
        ? Math.round(
            filteredData.reduce((sum, item) => sum + item.aging_days, 0) /
              totalRecords
          )
        : 0;
    const totalCompanies = new Set(
      filteredData.map((item) => item.company_code)
    ).size;
    const totalCurrencies = new Set(filteredData.map((item) => item.currency))
      .size;

    return {
      totalRecords,
      totalAmount,
      nonQualifiedCount,
      averageAging,
      totalCompanies,
      totalCurrencies,
    };
  }, [filteredData]);

  const handleBulkDueDateChange = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      notify("Please select rows to set due date.", "warning");
      return;
    }
    if (!bulkDueDate) {
      notify("Please select a date.", "warning");
      return;
    }

    // Format date to YYYY-MM-DD
    const dateObj = new Date(bulkDueDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    setData((prevData) => {
      const updatedData = [...prevData];
      selectedRows.forEach((row) => {
        const rowIndex = updatedData.findIndex(
          (item) =>
            item.company_code === row.original.company_code &&
            item.counterparty_name === row.original.counterparty_name &&
            item.document_id === row.original.document_id
        );
        if (rowIndex !== -1) {
          updatedData[rowIndex] = {
            ...updatedData[rowIndex],
            new_due_date: formattedDate,
          };
        }
      });
      return updatedData;
    });

    notify(
      `Due date set to ${formattedDate} for ${selectedRows.length} rows.`,
      "success"
    );
  };

  const handleCancelDateChanges = () => {
    setData((prevData) =>
      prevData.map((item, idx) => ({
        ...item,
        new_due_date: initialNewDueDates[idx] || "",
      }))
    );
    notify("All date changes have been cancelled.", "info");
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await nos.post<{
          rows: BusinessDashboard[];
          success: boolean;
        }>(`${apiBaseUrl}/fx/exposures/dashboard/all/v91`);
        if (response.data.success && Array.isArray(response.data.rows)) {
          setData(response.data.rows);
        }
      } catch (error) {
        // Handle error (optional: show notification)
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const companyDropdownOptions = useMemo(
    () =>
      Array.from(new Set(data.map((row) => row.company_code))).map(
        (company) => ({ value: company, label: company })
      ),
    [data]
  );

  const currencyDropdownOptions = useMemo(
    () =>
      Array.from(new Set(data.map((row) => row.currency))).map((currency) => ({
        value: currency,
        label: currency,
      })),
    [data]
  );

  const partyDropdownOptions = useMemo(
    () =>
      Array.from(new Set(data.map((row) => row.counterparty_name))).map(
        (party) => ({ value: party, label: party })
      ),
    [data]
  );

  const handleEdit = async () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.exposure_header_id);

    const selectedExposureObjs = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const rowsToEdit = selectedRows.length > 0 ? selectedExposureObjs : [];

    // Build array of objects for the payload
    const payload = rowsToEdit.map((row) => ({
      exposure_header_id: row.exposure_header_id,
      new_value_date: row.new_due_date,
    }));

    try {
      const response = await nos.post<{ success: boolean; error?: string }>(
        `${apiBaseUrl}/fx/exposures/bulk-update-value-dates`,
        [payload]
      );

      if (response.data.success) {
        setData((prev) =>
          prev.map((row) =>
            payload.some((p) => p.exposure_header_id === row.exposure_header_id)
              ? {
                  ...row,
                  new_due_date: payload.find(
                    (p) => p.exposure_header_id === row.exposure_header_id
                  )?.new_value_date,
                }
              : row
          )
        );
        notify(`Exposure(s) due date updated.`, "success");
      } else {
        notify(response.data.error || "Edit failed.", "error");
      }
    } catch (error) {
      notify("Network error. Please try again.", "error");
    }
  };

  return (
    <>
      <div className="w-full space-y-4">
        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-3">
          <CustomSelect
            label="Company"
            options={companyDropdownOptions}
            selectedValue={companyFilter}
            onChange={setCompanyFilter}
            placeholder="Select Company"
            isClearable={true}
          />
          <CustomSelect
            label="Currency"
            options={currencyDropdownOptions}
            selectedValue={currencyFilter}
            onChange={setCurrencyFilter}
            placeholder="Select Currency"
            isClearable={true}
          />
          <CustomSelect
            label="Party"
            options={partyDropdownOptions}
            selectedValue={partyFilter}
            onChange={setPartyFilter}
            placeholder="Select Counterparty"
            isClearable={true}
          />
          <CustomSelect
            label="Source"
            options={sourceOptions}
            selectedValue={sourceFilter}
            onChange={setSourceFilter}
            placeholder="Select Exposure Category"
            isClearable={true}
          />
          <div className="relative top-1.5">
            <DateRangeFilter
              label="Filter by Value Date"
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>

        <div className="bg-primary-xl p-6 rounded-lg shadow-sm border border-border">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-text">
              Business Adjustments
            </h3>

            <div className="flex items-center gap-4 flex-wrap justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-secondary-text font-medium">
                  Shift all Due Dates by (days)
                </span>

                <input
                  type="number"
                  value={dueDateShiftDays}
                  onChange={(e) =>
                    setDueDateShiftDays(parseInt(e.target.value) || 0)
                  }
                  className="w-20 px-3 py-2 text-center border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  min="0"
                />

                <Button
                  onClick={handleApplyDueDateShift}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Set Due-Date Shift
                </Button>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-secondary-text font-medium ml-6">
                  Set Due Date for selected rows
                </span>
                <input
                  type="date"
                  value={bulkDueDate}
                  onChange={(e) => setBulkDueDate(e.target.value)}
                  className="w-40 px-3 py-2 text-center border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <Button
                  onClick={handleBulkDueDateChange}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Set Due Date
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Apply Due Date
                </Button>
                <Button
                  onClick={handleCancelDateChanges}
                  className="px-4 py-2 bg-secondary-color-lt text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>

            <p className="text-sm text-secondary-text-dark">
              Shift affects effective due dates used by Year cards, consolidated
              table, crosstab, and approvals.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap px-1  items-center justify-between gap-4">
          {/* Left Side: Download + Refresh */}
          <div className="flex items-center gap-4">
            <ColumnPicker table={table} />
            <button
              type="button"
              className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
              title="Export to Excel"
              onClick={() => exportToExcel(filteredData, "Exposure List")}
            >
              <Download className="flex items-center justify-center text-primary group-hover:text-white" />
            </button>
            <button className="text-primary font-semibold group flex items-center gap-2 px-3 py-2.5 text-sm border border-primary rounded-md transition hover:bg-primary hover:text-white">
              Views
            </button>
          </div>

          {/* Right Side: Search + Approve + Reject */}
          <div className="flex items-center gap-4">
            <form
              className="relative flex items-center"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="text"
                placeholder="Search"
                className="w-full text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none hover:border hover:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
                tabIndex={-1}
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <NyneOSTable2<BusinessDashboard>
          table={table}
          columns={columns}
          nonDraggableColumns={["expand", "action", "select"]}
          nonSortingColumns={["expand", "action", "select"]}
          sections={[]}
          loading={loading}
        />

        <Pagination
          table={table}
          totalItems={filteredData.length}
          startIndex={
            filteredData.length === 0
              ? 0
              : table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                1
          }
          endIndex={Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            filteredData.length
          )}
        />
      </div>
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full mt-6">
        <h2 className="text-xl font-semibold text-secondary-text-dark">
          KPI Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            ["Total Records", kpiMetrics.totalRecords],
            ["Total Amount", kpiMetrics.totalAmount.toLocaleString()],
            ["Non-Qualified Count", kpiMetrics.nonQualifiedCount],
            ["Average Aging (Days)", kpiMetrics.averageAging],
            ["Companies", kpiMetrics.totalCompanies],
            ["Currencies", kpiMetrics.totalCurrencies],
          ].map(([key, value]) => (
            <div
              key={key}
              className="bg-primary-xl p-4 px-6 rounded-lg shadow-sm border border-border hover:shadow-md "
            >
              <h3 className="text-sm font-medium text-secondary-text-dark mb-1">
                {key}
              </h3>
              <p className="text-lg font-semibold text-primary mb-1">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>
        <GridMasterOSTable<kpiSnapshot> table={kpiSnapshotTable} />

        <Pagination
          table={kpiSnapshotTable}
          totalItems={kpiSnapshotData.length}
          startIndex={
            kpiSnapshotData.length === 0
              ? 0
              : kpiSnapshotTable.getState().pagination.pageIndex *
                  kpiSnapshotTable.getState().pagination.pageSize +
                1
          }
          endIndex={Math.min(
            (kpiSnapshotTable.getState().pagination.pageIndex + 1) *
              kpiSnapshotTable.getState().pagination.pageSize,
            kpiSnapshotData.length
          )}
        />
      </div>
    </>
  );
};
export default BusinessDashboard;
