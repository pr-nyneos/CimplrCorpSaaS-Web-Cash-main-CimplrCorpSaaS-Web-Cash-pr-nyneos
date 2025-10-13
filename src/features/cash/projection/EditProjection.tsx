import GridMasterOSTable from "../../masters/GridMasterOSTable";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import React, { useState, useMemo, useEffect } from "react";
import { Save, Edit, X, UserRoundCheck } from "lucide-react";
import NyneOSTable2 from "../../cashDashboard/NyneOSTable2";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";
import nos from "../../../utils/nos.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import Layout from "../../../components/layout/Layout.tsx";
import { useNavigate, useLocation } from "react-router-dom";
import SimpleTable from "../../../components/table/Table.tsx";
import { getProcessingStatusColor } from "../../../utils/colorCode.ts";
import { useAllTabPermissions } from "../../../hooks/useAllTabPermission.tsx";
import { set } from "date-fns";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export type ActionRequest = {
  action_id: string;
  action_type: string;
  checker_at: string;
  checker_by: string;
  checker_comment: string;
  processing_status: string;
  proposal_id: string;
  reason: string;
  requested_at: string; // timestamp format
  requested_by: string;
};
export type ProjectionEntry = {
  categoryName: string;
  department: string;
  description: string;
  end_date: string;
  entity: string;
  expectedAmount: number;
  frequency: string;
  item_id: string;
  old_categoryName: string;
  old_department: string;
  old_end_date: string;
  old_entity: string;
  old_expectedAmount: number;
  old_frequency: string;
  old_recurrence_pattern: string;
  old_recurring: boolean;
  old_start_date: string;
  old_counterparty_name: string;
  old_type: string;
  recurrence_pattern: string;
  recurring: boolean;
  start_date: string;
  type: string;
  counterparty_name: string; // <-- Add this line
};

export type Header = {
  currency: string;
  effective_date: string; // timestamp format
  old_currency: string;
  old_effective_date: string;
  old_projection_type: string;
  old_proposal_name: string;
  processing_status: string;
  projection_type: string;
  proposal_id: string;
  proposal_name: string;
};

export type ProjectionViewRow = {
  [key: string]: number | string; // month-year keys + categoryName/item_id/type
  categoryName: string;
  item_id: string;
  type: string;
};

export type ProjectionWrapper = {
  entry: ProjectionEntry;
  projection: ProjectionViewRow;
};

type APIResponse = {
  actions: ActionRequest[];
  header: Header;
  projections: ProjectionWrapper[];
  success: boolean;
};

// Final payload structure
export type ProjectionPayloadRow = {
  entry: ProjectionEntry; // user input row
  projection: ProjectionViewRow; // calculated view row
};

export type ProjectionPayload = {
  header: {
    proposal_id?: string; // <-- add this
    currency: string;
    proposal_name: string;
    effective_date: string;
    projection_type: string;
  };
  projections: ProjectionPayloadRow[];
  // projectionTable: ProjectionViewRow[]; // <-- add this line
};

const proposalTypeOptions = [
  "Yearly (12 months)",
  "Quarterly (3 months)",
  "Monthly (1 month)",
];

type DateInputProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
};

const DateInput: React.FC<DateInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
      />
    </div>
  );
};

const EditProjection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const visibility = useAllTabPermissions("projection");

  // Access state sent from navigate
  const { proposal_id, edit } = location.state || {};

  // Now you can use proposal_id and edit in your component logic

  const emptyRow: ProjectionEntry & { _isEditing?: boolean } = {
    categoryName: "",
    type: "",
    entity: "",
    department: "",
    expectedAmount: 0,
    recurring: false,
    frequency: "Monthly",
    description: "",
    end_date: "",
    item_id: "",
    old_counterparty_name: "",
    old_categoryName: "",
    old_department: "",
    old_end_date: "",
    old_entity: "",
    old_expectedAmount: 0,
    old_frequency: "",
    old_recurrence_pattern: "",
    old_recurring: false,
    old_start_date: "",
    old_type: "",
    recurrence_pattern: "",
    start_date: "",
    counterparty_name: "",
    _isEditing: true,
  };

  const [rows, setRows] = useState<
    (ProjectionEntry & { _isEditing?: boolean })[]
  >([{ ...emptyRow }]);
  const [edits, setEdits] = useState(false);
  // const [,setEdits]=useState(false);

  // const [departments, setDepartments] = useState("");
  const [calculationDate, setCalculationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({
    type: true,
    categoryName: true,
    entity: true,
    department: true,
    expectedAmount: true,
    recurring: true,
    frequency: true,
    description: true,
    item_id: false,
    start_date: false,
    end_date: false,
    recurrence_pattern: true,
    action: true,
    // Hide all old_ fields and proposal_id
    old_categoryName: false,
    old_department: false,
    old_end_date: false,
    old_entity: false,
    old_expectedAmount: false,
    old_frequency: false,
    old_recurrence_pattern: false,
    old_recurring: false,
    old_start_date: false,
    old_type: false,
    counterparty_name: true, // <-- Add this line
    proposal_id: false,
  });
  // const [showSummary, setShowSummary] = useState(false);
  const [proposalType, setProposalType] = useState("Yearly (12 months)");
  const [entityOptions, setEntityOptions] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [currencies, setCurrencies] = useState<
    { value: string; label: string }[]
  >([]);
  const [auditLogData, setAuditLogData] = useState<ActionRequest[]>([]);

  const [departmentOptions, setDepartmentOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [categories, setCategories] = useState<
    { category_id: string; category_name: string; category_type: string }[]
  >([]);
  const [proposalName, setProposalName] = useState("");

  const [counterpartyOptions, setCounterpartyOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [step, setStep] = useState(2);
  const handleAddRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };
  const { notify } = useNotification();
  const buildProjectionPayload = (): ProjectionPayload => {
    return {
      header: {
        proposal_id, // <-- add this line to include proposal_id in the payload
        currency: selectedCurrency,
        proposal_name: proposalName,
        effective_date: calculationDate,
        projection_type: proposalType,
      },
      projections: rows.map((row) => {
        const matchingProjection = projectionRows.find(
          (p) => p.type === row.type && p.categoryName === row.categoryName
        );
        return {
          entry: { ...row },
          projection: matchingProjection
            ? { ...matchingProjection, item_id: row.item_id }
            : {
                type: row.type,
                categoryName: row.categoryName,
                item_id: row.item_id,
              },
        };
      }),
      // projectionTable: projectionRows,
    };
  };

  // ---- onSubmit ----
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = buildProjectionPayload();

      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/cash/cashflow-projection/update`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        notify("Projections created successfully", "success");
      } else {
        notify("Failed to save projections", "error");
      }
    } catch (error) {
      notify("Error saving projections", "error");
    }
  };

  const handleInputChange = (
    idx: number,
    field: keyof ProjectionEntry,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const getPeriods = (type: string, startDate: string) => {
    const start = startDate ? new Date(startDate) : new Date();
    const months = (count: number) =>
      Array.from({ length: count }, (_, i) => {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        return (
          d.toLocaleString("en-US", { month: "short" }) +
          "-" +
          String(d.getFullYear()).slice(-2)
        );
      });
    switch (type) {
      case "Yearly (12 months)":
        return months(12);
      case "Quarterly (3 months)":
        return months(4);
      case "Monthly (1 month)":
        return months(1);
      default:
        return [];
    }
  };

  const isRowValid = (row: ProjectionEntry) => {
    return (
      !!row.type &&
      !!row.categoryName &&
      !!row.entity &&
      !!row.department &&
      !!row.expectedAmount &&
      row.expectedAmount > 0 &&
      (row.recurring === true || row.recurring === false)
    );
  };

  // Only allow save if row is valid
  const handleToggleEdit = (idx: number) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        if (row._isEditing) {
          // Trying to save: only allow if valid
          if (!isRowValid(row)) {
            alert("Please fill all required fields before saving.");
            return row;
          }
          return { ...row, _isEditing: false };
        } else {
          // Enter edit mode
          return { ...row, _isEditing: true };
        }
      })
    );
  };

  const handleRemoveRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => [
      {
        accessorKey: "type",
        header: "Type",
        required: true,
        cell: ({ row }: any) => (
         <div className="flex flex-col gap-1">
            <select
              value={row.original.type}
              onChange={(e) =>
                handleInputChange(row.index, "type", e.target.value)
              }
              className="border rounded px-2 py-1 w-full"
              disabled={!row.original._isEditing}
            >
              <option value="" hidden>
                Choose...
              </option>
              <option value="Inflow">Inflow</option>
              <option value="Outflow">Outflow</option>
            </select>
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_type}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "categoryName",
        header: "Category Name",
        required: true,
        cell: ({ row }: any) => {
          const options = categories
            .filter((cat) => cat.category_type === row.original.type)
            .map((cat) => cat.category_name);
          return (
           <div className="flex flex-col gap-1">
              <select
                value={row.original.categoryName}
                onChange={(e) =>
                  handleInputChange(row.index, "categoryName", e.target.value)
                }
                disabled={!row.original.type || !row.original._isEditing}
                className="border rounded px-2 py-1 w-full"
              >
                <option value="" hidden>
                  {row.original.type ? "Choose..." : "Select Type first"}
                </option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {edits && (
                <span className="text-xs text-gray-500">
                  Old: {row.original.old_categoryName}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "entity",
        header: "Entity",
        required: true,
        cell: ({ row }: any) => (
         <div className="flex flex-col gap-1">
            <select
              value={row.original.entity}
              onChange={(e) =>
                handleInputChange(row.index, "entity", e.target.value)
              }
              className="border rounded px-2 py-1 w-full"
              disabled={!row.original._isEditing}
            >
              <option value="" hidden>
                Choose...
              </option>
              {entityOptions.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_entity}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        required: true,
        cell: ({ row }: any) => (
         <div className="flex flex-col gap-1">
            <select
              value={row.original.department}
              onChange={(e) =>
                handleInputChange(row.index, "department", e.target.value)
              }
              className="border rounded px-2 py-1 w-full"
              disabled={!row.original._isEditing}
            >
              <option value="" hidden>
                Choose...
              </option>
              {departmentOptions.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_department}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "expectedAmount",
        header: "Expected Amount",
        required: true,
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = useState(
            row.original.expectedAmount?.toString() || ""
          );
          const handleBlur = () => {
            const parsed = Number(localValue);
            if (!isNaN(parsed) && parsed > 0) {
              handleInputChange(row.index, "expectedAmount", parsed);
            } else {
              setLocalValue(row.original.expectedAmount?.toString() || "");
            }
          };
          return (
           <div className="flex flex-col gap-1">
              <input
                type="number"
                value={localValue}
                min={1}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                className="border rounded px-2 py-1 w-full text-right focus:outline-none"
                readOnly={!row.original._isEditing}
              />
              {edits && (
                <span className="text-xs text-gray-500">
                  Old: {row.original.old_expectedAmount}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "recurring",
        header: "Recurring",
        required: true,
        cell: ({ row }: any) => (
         <div className="flex flex-col gap-1">
            <select
              value={row.original.recurring ? "Yes" : "No"}
              onChange={(e) =>
                handleInputChange(
                  row.index,
                  "recurring",
                  e.target.value === "Yes"
                )
              }
              className="border rounded px-2 py-1 w-full"
              disabled={!row.original._isEditing}
            >
              <option value="" hidden>
                Choose...
              </option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_recurring}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        required: true,
        cell: ({ row }: any) => (
         <div className="flex flex-col gap-1">
            <select
              value={row.original.frequency}
              onChange={(e) =>
                handleInputChange(row.index, "frequency", e.target.value)
              }
              disabled={!row.original.recurring || !row.original._isEditing}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="" hidden>
                Choose...
              </option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_frequency}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        required: false,
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = useState(
            row.original.description || ""
          );
          const handleBlur = () =>
            handleInputChange(row.index, "description", localValue);
          return (
           <div className="flex flex-col gap-1">
              <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                className="border rounded px-2 py-1 w-full"
                readOnly={!row.original._isEditing}
                placeholder="Enter description"
              />
              {edits && (
                <span className="text-xs text-gray-500">
                  Old: {row.original.old_description}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "item_id",
        header: "Item ID",
        required: false,
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.item_id}
            onChange={(e) =>
              handleInputChange(row.index, "item_id", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            readOnly={!row.original._isEditing}
            placeholder="Enter Item ID"
          />
        ),
      },
      {
        accessorKey: "start_date",
        header: "Start Date",
        required: false,
        cell: ({ row }: any) => (
         <div className="flex flex-col gap-1">
            <input
              type="date"
              value={row.original.start_date}
              onChange={(e) =>
                handleInputChange(row.index, "start_date", e.target.value)
              }
              className="border rounded px-2 py-1 w-full"
              readOnly={!row.original._isEditing}
            />
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_start_date}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "end_date",
        header: "End Date",
        required: false,
        cell: ({ row }: any) => (
         <div className="flex flex-col gap-1">
            <input
              type="date"
              value={row.original.end_date}
              onChange={(e) =>
                handleInputChange(row.index, "end_date", e.target.value)
              }
              className="border rounded px-2 py-1 w-full"
              readOnly={!row.original._isEditing}
            />
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_end_date}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "recurrence_pattern",
        header: "Recurrence Pattern",
        required: false,
        cell: ({ row }: any) => (
         <div className="flex flex-col gap-1">
            <input
              type="text"
              value={row.original.recurrence_pattern}
              onChange={(e) =>
                handleInputChange(
                  row.index,
                  "recurrence_pattern",
                  e.target.value
                )
              }
              className="border rounded px-2 py-1 w-full"
              readOnly={!row.original._isEditing}
              placeholder="Enter Recurrence Pattern"
            />
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_recurrence_pattern}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "counterparty_name",
        header: "Counterparty Name",
        required: false,
        cell: ({ row }: any) => (
          <>
            <CustomSelect
              label=""
              options={counterpartyOptions}
              selectedValue={row.original.counterparty_name}
              onChange={(value) =>
                handleInputChange(row.index, "counterparty_name", value)
              }
              placeholder="Select counterparty"
              isClearable={true}
              isRequired={false}
              isDisabled={!row.original._isEditing}
            />
            {edits && (
              <span className="text-xs text-gray-500">
                Old: {row.original.old_counterparty_name}
              </span>
            )}
          </>
        ),
      },
      // Action column (edit/remove)
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }: { row: any }) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="text-primary font-bold px-2 flex items-center"
              onClick={() => handleToggleEdit(row.index)}
              title={row.original._isEditing ? "Save" : "Edit"}
            >
              {row.original._isEditing ? (
                <Save size={18} />
              ) : (
                <Edit size={18} />
              )}
            </button>
            <button
              type="button"
              className="text-red-600 font-bold px-2 flex items-center"
              onClick={() => handleRemoveRow(row.index)}
              title="Remove row"
            >
              <X size={18} />
            </button>
          </div>
        ),
      },
    ],
    // Only depend on rows, categories, entityOptions, departmentOptions
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, categories, entityOptions, departmentOptions, counterpartyOptions]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  const actionRequestColumns = [
    { accessorKey: "action_id", header: "Action ID" },
    // { accessorKey: "action_type", header: "Action Type" },
    {
      accessorKey: "action_type",
      header: "Action Type",
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const value = getValue() as string;
        if (!value) return "—";
        // Format action type (e.g., CREATE -> Create)
        const formatted = value
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        // Color badge based on action type
        let color = "bg-gray-200 text-gray-800";
        if (value === "CREATE") color = "bg-green-100 text-green-700";
        if (value === "EDIT") color = "bg-blue-100 text-blue-700";
        if (value === "DELETE") color = "bg-red-100 text-red-700";
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}
          >
            {formatted}
          </span>
        );
      },
    },
    { accessorKey: "checker_at", header: "Checker At" },
    { accessorKey: "checker_by", header: "Checker By" },
    { accessorKey: "checker_comment", header: "Checker Comment" },
    {
      accessorKey: "processing_status",
      header: "Status",
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const value = getValue() as string;
        if (!value) return "—";
        // Format status name
        const formatted = value
          .toLowerCase()
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getProcessingStatusColor(
              value
            )}`}
          >
            {formatted}
          </span>
        );
      },
    },
    { accessorKey: "proposal_id", header: "Proposal ID" },
    { accessorKey: "reason", header: "Reason" },
    { accessorKey: "requested_at", header: "Requested At" },
    { accessorKey: "requested_by", header: "Requested By" },
  ];

  const [auditLogColumnVisibility, setAuditLogColumnVisibility] = useState<
    Record<string, boolean>
  >({
    action_id: false, // Hide by default
    action_type: true,
    checker_at: true,
    checker_by: true,
    checker_comment: true,
    processing_status: true,
    proposal_id: true,
    reason: true,
    requested_at: true,
    requested_by: true,
  });

  const auditLogTable = useReactTable({
    data: auditLogData,
    columns: actionRequestColumns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setAuditLogColumnVisibility,
    state: {
      columnVisibility: auditLogColumnVisibility,
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const projectionColumns = useMemo(() => {
    const baseCols = [
      { id: "type", accessorKey: "type", header: "Type" },
      {
        id: "categoryName",
        accessorKey: "categoryName",
        header: "Category Name",
      },
      {
        id: "item_id",
        accessorKey: "item_id",
        header: "Item ID",
      },
    ];

    const periodCols = getPeriods(proposalType, calculationDate).map(
      (period) => ({
        id: period,
        accessorKey: period,
        header: period,
        cell: ({ row }: any) => {
          const val = row.original[period];
          return (
            <span>
              {typeof val === "number" && !Number.isInteger(val)
                ? val.toFixed(2)
                : val}
            </span>
          );
        },
      })
    );

    const totalCols = [
      {
        id: "total",
        accessorKey: "total",
        header: "Total",
        cell: ({ row }: any) => {
          const periodKeys = getPeriods(proposalType, calculationDate);
          const total = periodKeys.reduce(
            (sum, key) => sum + (Number(row.original[key]) || 0),
            0
          );
          return (
            <span>
              {typeof total === "number" && !Number.isInteger(total)
                ? total.toFixed(2)
                : total}
            </span>
          );
        },
      },
    ];

    return [...baseCols, ...periodCols, ...totalCols];
  }, [proposalType, calculationDate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const projectionRows = useMemo(() => {
    return rows.map((row) => {
      const periods = getPeriods(proposalType, calculationDate);
      const amount = Number(row.expectedAmount) || 0;

      let periodData: Record<string, number> = {};

      switch (true) {
        case !amount || !row.frequency:
          periodData = periods.reduce((acc, period) => {
            acc[period] = 0;
            return acc;
          }, {} as Record<string, number>);
          break;

        case row.frequency === "Yearly":
          periodData = periods.reduce((acc, period, idx) => {
            acc[period] = idx === 0 ? amount : 0;
            return acc;
          }, {} as Record<string, number>);
          break;

        case row.frequency === "Quarterly":
          const n = Math.ceil(periods.length / 3);
          const perQuarter = amount / n;
          periodData = periods.reduce((acc, period, idx) => {
            acc[period] = idx % 3 === 0 ? perQuarter : 0;
            return acc;
          }, {} as Record<string, number>);
          break;

        case row.frequency === "Monthly":
          const perMonth = amount / periods.length;
          periodData = periods.reduce((acc, period) => {
            acc[period] = perMonth;
            return acc;
          }, {} as Record<string, number>);
          break;

        default:
          periodData = periods.reduce((acc, period) => {
            acc[period] = 0;
            return acc;
          }, {} as Record<string, number>);
          break;
      }

      return {
        type: row.type,
        categoryName: row.categoryName,
        item_id: row.item_id, // <-- Add this line
        ...periodData,
      };
    });
  }, [rows, proposalType, calculationDate]);

  const projectionViewTable = useReactTable({
    data: projectionRows,
    columns: projectionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const periodKeys = getPeriods(proposalType, calculationDate);
  const staticKeys = ["type", "categoryName", "total"];
  const nonDraggableColumns = [...staticKeys, ...periodKeys];
  const nonSortingColumns = [...staticKeys, ...periodKeys];

  const handleAddAnotherProjection = () => {
    setRows([{ ...emptyRow }]);
    setCalculationDate(() => {
      const today = new Date();
      return today.toISOString().split("T")[0];
    });
    setProposalType("Yearly (12 months)");
    setStep(2);
  };

  useEffect(() => {
    nos
      .post<{
        results: { currency_code: string; decimal_place: number }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/currency/active-approved`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setCurrencies(
            response.data.results.map((c) => ({
              value: c.currency_code,
              label: c.currency_code,
            }))
          );
        }
      })

      .catch(() => {
        setCurrencies([]);
      });

    nos
      .post<{
        rows: { centre_name: string; centre_code: string }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/costprofit-center/approved-active`)
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setDepartmentOptions(
            response.data.rows.map((item) => ({
              value: item.centre_code,
              label: item.centre_name,
            }))
          );
        }
      })
      .catch(() => {
        setDepartmentOptions([]);
      });

    nos
      .post<{
        rows: { centre_name: string; centre_code: string }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/costprofit-center/approved-active`)
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setDepartmentOptions(
            response.data.rows.map((item) => ({
              value: item.centre_code,
              label: item.centre_name,
            }))
          );
        }
      })
      .catch(() => {
        setDepartmentOptions([]);
      });

    nos
      .post<{
        rows: { centre_name: string; centre_code: string }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/costprofit-center/approved-active`)
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setDepartmentOptions(
            response.data.rows.map((item) => ({
              value: item.centre_code,
              label: item.centre_name,
            }))
          );
        }
      })
      .catch(() => {
        setDepartmentOptions([]);
      });

    nos
      .post<{
        categories: {
          category_id: string;
          category_name: string;
          category_type: string;
        }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/cashflow-category/names`)
      .then((response) => {
        if (response.data.success && response.data.categories) {
          setCategories(response.data.categories);
        }
      })
      .catch(() => {
        setCategories([]);
      });

    nos
      .post<{ results: { entity_name: string }[]; success: boolean }>(
        `${apiBaseUrl}/master/entitycash/all-names`
      )
      .then((response) => {
        if (response.data.success && response.data.results) {
          setEntityOptions(
            response.data.results.map((item) => item.entity_name)
          );
        }
      })
      .catch(() => {
        setEntityOptions([]);
      });

    // Fetch counterparties
    nos
      .post<{ rows: { counterparty_name: string }[]; success: boolean }>(
        `${apiBaseUrl}/master/counterparty/approved-active`
      )
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setCounterpartyOptions(
            response.data.rows.map((item) => ({
              value: item.counterparty_name,
              label: item.counterparty_name,
            }))
          );
        }
      })
      .catch(() => {
        setCounterpartyOptions([]);
      });
  }, [step === 1]);

  useEffect(() => {
    if (step === 2) {
      // Make all rows readonly
      setRows((prev) =>
        prev.map((row) =>
          row._isEditing ? { ...row, _isEditing: false } : row
        )
      );
    }
    if (step === 1) {
      // Make all rows editable
      setRows((prev) =>
        prev.map((row) =>
          !row._isEditing ? { ...row, _isEditing: true } : row
        )
      );
    }
  }, [edit]);

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      action: step === 1,
    }));
  }, [step]);

  useEffect(() => {
    if (!proposal_id) return;
    nos
      .post<APIResponse>(
        `${apiBaseUrl}/cash/cashflow-projection/get-projection`,
        {
          proposal_id,
        }
      )
      .then((response) => {
        if (response.data.success) {
          // Set actions for audit log table
          setAuditLogData(response.data.actions || []);
          // Set header fields
          const header = response.data.header;
          setProposalName(header.proposal_name || "");
          setSelectedCurrency(header.currency || "");
          setCalculationDate(header.effective_date?.split(" ")[0] || "");
          setProposalType(header.projection_type || proposalTypeOptions[0]);
          // Set rows for the entry table (add _isEditing: false)
          setRows(
            (response.data.projections || []).map((p) => ({
              ...p.entry,
              _isEditing: false,
            }))
          );
        }
      })
      .catch(() => {
        // handle error, maybe notify
      });
  }, [proposal_id]);

  return (
    <>
      <Layout
        title="Projection Summary"
        showButton={true}
        buttonText="Back"
        onButtonClick={() => navigate("/projection")}
      >
        <div className="space-y-8">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-primary-lt pt-6">
                Proposal Header
              </h2>
              <div className="mt-4 grid grid-cols-1 pb-20 md:grid-cols-4 gap-12">
                <div className="flex flex-col">
                  <label className="text-sm mb-1 font-medium text-secondary-text">
                    Proposal Name
                  </label>
                  <input
                    type="text"
                    value={proposalName}
                    onChange={(e) => setProposalName(e.target.value)}
                    placeholder="Enter proposal name"
                    className="text-secondary-text bg-secondary-color-lt px-3 py-1.5 border border-border rounded-md shadow-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm mb-1 font-medium text-secondary-text">
                    Proposal Type
                  </label>
                  <select
                    className="text-secondary-text bg-secondary-color-lt px-3 py-1.5 border border-border rounded-md shadow-sm focus:outline-none"
                    value={proposalType}
                    onChange={(e) => setProposalType(e.target.value)}
                  >
                    <option value="" disabled hidden>
                      Select Proposal Type
                    </option>
                    {proposalTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <DateInput
                    label="Settlement Date:"
                    value={calculationDate}
                    onChange={(val) => {
                      setCalculationDate(val);
                    }}
                  />
                </div>

                <div className="flex-1">
                  <CustomSelect
                    label="Base Operating Currency"
                    options={currencies}
                    selectedValue={selectedCurrency}
                    onChange={(value) => {
                      setSelectedCurrency(value);
                    }}
                    placeholder="Select currency"
                    isClearable={false}
                    isRequired={true}
                  />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-primary-lt pb-4">
                Projection Entry Grid
              </h2>
              <GridMasterOSTable<ProjectionEntry> table={table} />

              <div className="mt-4">
                <button
                  onClick={handleAddRow}
                  className="px-6 py-2 bg-primary text-white rounded font-semibold"
                >
                  Add Row
                </button>
              </div>

              <div className=" mt-16">
                <h2 className="text-xl font-semibold text-primary-lt pb-4">
                  Live Projection View
                </h2>
                <NyneOSTable2
                  table={projectionViewTable}
                  columns={projectionColumns}
                  nonDraggableColumns={nonDraggableColumns}
                  nonSortingColumns={nonSortingColumns}
                />
                {/* Footer row for column totals */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-100 rounded shadow-sm">
                    <tfoot>
                      <tr>
                        {/* Static columns: Type, Category Name */}
                        <td className="px-4 py-2 font-semibold text-primary-lt">
                          Total
                        </td>
                        {/* Dynamic period columns */}
                        {periodKeys.map((period) => {
                          // Sum for this period column: inflow as positive, outflow as negative
                          const sum = rows.reduce((acc, row) => {
                            let val = 0;
                            const found = projectionRows.find(
                              (r) =>
                                r.type === row.type &&
                                r.categoryName === row.categoryName &&
                                r.item_id === row.item_id
                            ) as Record<string, any> | undefined;
                            if (row.type === "Inflow") {
                              val = Number(found?.[period] || 0);
                            } else if (row.type === "Outflow") {
                              val = -Math.abs(Number(found?.[period] || 0));
                            }
                            return acc + val;
                          }, 0);
                          return (
                            <td
                              key={period}
                              className={`px-2 py-2 text-sm text-right font-medium ${
                                sum > 0
                                  ? "text-green-600"
                                  : sum < 0
                                  ? "text-red-600"
                                  : "text-primary"
                              }`}
                            >
                              {sum < 0 ? "-" : ""}
                              {Math.abs(sum).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          );
                        })}
                        {/* Grand total for all periods */}
                        <td className="px-3 py-2 text-center text-sm font-medium text-primary-lt">
                          {/* Grand total: inflow as positive, outflow as negative */}
                          {(() => {
                            const grandTotal = periodKeys.reduce(
                              (acc, period) => {
                                return (
                                  acc +
                                  rows.reduce((rowAcc, row) => {
                                    let val = 0;
                                    const found = projectionRows.find(
                                      (r) =>
                                        r.type === row.type &&
                                        r.categoryName === row.categoryName &&
                                        r.item_id === row.item_id
                                    ) as Record<string, any> | undefined;
                                    if (row.type === "Inflow") {
                                      val = Number(found?.[period] || 0);
                                    } else if (row.type === "Outflow") {
                                      val = -Math.abs(
                                        Number(found?.[period] || 0)
                                      );
                                    }
                                    return rowAcc + val;
                                  }, 0)
                                );
                              },
                              0
                            );
                            return (
                              <>
                                {grandTotal < 0 ? "-" : ""}
                                {Math.abs(grandTotal).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </>
                            );
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="flex mt-6 items-center justify-end gap-x-4 gap-2">
                <div>
                  <Button
                    color="Fade"
                    onClick={() => {
                      setStep(2), setEdits(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <div>
                  <form action="" onSubmit={onSubmit}>
                    <Button color="Green" type="submit">
                      Confirm & Submit
                    </Button>
                  </form>
                </div>
              </div>
            </div>
            // </div>
          )}
          {step === 2 && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {[
                  ["proposal_id", proposal_id],
                  ["proposal_name", proposalName],
                  ["proposal_type", proposalType],
                  ["effective_date", calculationDate],
                  ["currency", selectedCurrency],
                ].map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-primary-xl p-4 px-6 rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  >
                    <h3 className="text-lg font-medium text-secondary-text-dark mb-1">
                      {key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </h3>
                    <p className="text-md text-primary mb-1">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <div className=" mt-16">
                <h2 className="text-xl font-semibold text-primary-lt pb-4">
                  Projection Entry Grid
                </h2>
                <GridMasterOSTable<ProjectionEntry> table={table} />

                <h2 className="text-xl font-semibold text-primary-lt pb-4 mt-8">
                  Review Projection
                </h2>
                <NyneOSTable2
                  table={projectionViewTable}
                  columns={projectionColumns}
                  nonDraggableColumns={nonDraggableColumns}
                  nonSortingColumns={nonSortingColumns}
                />
                {/* Footer row for column totals */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-100 rounded shadow-sm">
                    <tfoot>
                      <tr>
                        {/* Static columns: Type, Category Name */}
                        <td className="px-4 py-2 font-semibold text-primary-lt">
                          Total
                        </td>
                        {/* Dynamic period columns */}
                        {periodKeys.map((period) => {
                          // Sum for this period column: inflow as positive, outflow as negative
                          const sum = rows.reduce((acc, row) => {
                            let val = 0;
                            const found = projectionRows.find(
                              (r) =>
                                r.type === row.type &&
                                r.categoryName === row.categoryName &&
                                r.item_id === row.item_id
                            ) as Record<string, any> | undefined;
                            if (row.type === "Inflow") {
                              val = Number(found?.[period] || 0);
                            } else if (row.type === "Outflow") {
                              val = -Math.abs(Number(found?.[period] || 0));
                            }
                            return acc + val;
                          }, 0);
                          return (
                            <td
                              key={period}
                              className={`px-2 py-2 text-sm text-right font-medium ${
                                sum > 0
                                  ? "text-green-600"
                                  : sum < 0
                                  ? "text-red-600"
                                  : "text-primary"
                              }`}
                            >
                              {sum < 0 ? "-" : ""}
                              {Math.abs(sum).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          );
                        })}
                        {/* Grand total for all periods */}
                        <td className="px-3 py-2 text-center text-sm font-medium text-primary-lt">
                          {/* Grand total: inflow as positive, outflow as negative */}
                          {(() => {
                            const grandTotal = periodKeys.reduce(
                              (acc, period) => {
                                return (
                                  acc +
                                  rows.reduce((rowAcc, row) => {
                                    let val = 0;
                                    const found = projectionRows.find(
                                      (r) =>
                                        r.type === row.type &&
                                        r.categoryName === row.categoryName &&
                                        r.item_id === row.item_id
                                    ) as Record<string, any> | undefined;
                                    if (row.type === "Inflow") {
                                      val = Number(found?.[period] || 0);
                                    } else if (row.type === "Outflow") {
                                      val = -Math.abs(
                                        Number(found?.[period] || 0)
                                      );
                                    }
                                    return rowAcc + val;
                                  }, 0)
                                );
                              },
                              0
                            );
                            return (
                              <>
                                {grandTotal < 0 ? "-" : ""}
                                {Math.abs(grandTotal).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </>
                            );
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="flex mt-6 items-center justify-end gap-x-4 gap-2">
                <div>
                  {visibility.edit && (
                    <Button
                      color="Fade"
                      onClick={() => {
                        setStep(1), setEdits(true);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-primary-xl p-6 mb-4">
                {/* Card icon SVG */}
                <span className="text-primary-lt">
                  <UserRoundCheck size={42} />
                </span>
              </div>
              <h2 className="text-2xl font-bold text-primary-lt tracking-wider mb-2">
                Projection Created Successfully!
              </h2>
              <p className="text-secondary-text-dark font-normal mb-6">
                Your projection has been submitted for approval.
              </p>
              <div className="col-span-3 flex justify-end">
                <div>
                  <Button
                    type="button"
                    color="Green"
                    onClick={handleAddAnotherProjection}
                  >
                    Add Another Projection
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-primary-lt pb-4">
              Audit Log
            </h2>

            <SimpleTable<ActionRequest>
              table={auditLogTable}
              columns={actionRequestColumns}
            />
          </div>
        </div>
      </Layout>
    </>
  );
};

export default EditProjection;
