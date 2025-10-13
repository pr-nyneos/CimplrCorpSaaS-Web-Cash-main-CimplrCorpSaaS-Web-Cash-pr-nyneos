import GridMasterOSTable from "../../masters/GridMasterOSTable";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import { useState, useMemo, useEffect } from "react";
import { Save, Edit, X, UserRoundCheck } from "lucide-react";
import NyneOSTable2 from "../../cashDashboard/NyneOSTable2";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";
import nos from "../../../utils/nos.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type APIResponse = {
  success: boolean;
  message?: string;
};

// Projection Entry Grid Row
export type ProjectionEntry = {
  type: string; // Inflow | Outflow
  categoryName: string;
  entity: string;
  department: string;
  expectedAmount: number;
  recurring: boolean;
  frequency: string; // Monthly | Quarterly | Yearly
  description?: string;
  counterparty_name?: string; // <-- Add this line
};

// Live Projection View Row
export type ProjectionViewRow = {
  type: string;
  categoryName: string;
  [period: string]: number | string | undefined;
  total?: number;
};

// Final payload structure
export type ProjectionPayloadRow = {
  entry: ProjectionEntry; // user input row
  projection: ProjectionViewRow; // calculated view row
};

export type ProjectionPayload = {
  header: {
    currency: string;
    proposal_name: string;
    effective_date: string;
    projection_type: string;
  };
  projections: ProjectionPayloadRow[];
  // projectionTable: ProjectionViewRow[]; // <-- add this
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

const ProjectionCreation = () => {
  const [rows, setRows] = useState<
    (ProjectionEntry & { _isEditing?: boolean })[]
  >([
    {
      categoryName: "",
      type: "",
      entity: "",
      department: "",
      expectedAmount: 0,
      recurring: false,
      frequency: "Monthly",
      description: "",
      counterparty_name: "", // <-- Add this line
      _isEditing: true,
    },
  ]);

  // const [departments, setDepartments] = useState("");
  const [calculationDate, setCalculationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  // const [showSummary, setShowSummary] = useState(false);
  const [proposalType, setProposalType] = useState("Yearly (12 months)");
  const [entityOptions, setEntityOptions] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [currencies, setCurrencies] = useState<
    { value: string; label: string }[]
  >([]);
  const [counterpartyOptions, setCounterpartyOptions] = useState<
  { value: string; label: string }[]
>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [categories, setCategories] = useState<
    { category_id: string; category_name: string; category_type: string }[]
  >([]);
  const [proposalName, setProposalName] = useState("");

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        categoryName: "",
        type: "",
        entity: "",
        department: "",
        expectedAmount: 0,
        recurring: false,
        frequency: "Monthly",
        description: "",
        counterparty_name: "", // <-- Add this line
        _isEditing: true,
      },
    ]);
  };
  const { notify } = useNotification();
  const buildProjectionPayload = (): ProjectionPayload => {
    return {

      header: {
      currency: selectedCurrency,
      proposal_name: proposalName,
      effective_date: calculationDate,
      projection_type: proposalType, // <-- Add this line
    },
      
      projections: rows.map((row) => {
        
        const matchingProjection = projectionRows.find(
          (p) => p.type === row.type && p.categoryName === row.categoryName
        );
        return {
          entry: {
            // currency: selectedCurrency,
            type: row.type || "",
            // proposal_name: proposalName,
            // effective_date: calculationDate,
            categoryName: row.categoryName || "",
            entity: row.entity || "",
            department: row.department || "",
            expectedAmount: row.expectedAmount ?? 0,
            recurring: row.recurring ?? false,
            frequency: row.frequency || "Monthly",
            description: row.description || "",
            counterparty_name: row.counterparty_name || "", // <-- Add this line
          },
          projection: matchingProjection || {
            type: row.type,
            categoryName: row.categoryName,
          },
        };
      }),
      // projectionTable: projectionRows, // <-- add this line
    };
  };

  // ---- onSubmit ----
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double submit

    setSubmitting(true);
    try {
      const payload = buildProjectionPayload();

      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/cash/cashflow-projection/make`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        notify("Projections created successfully", "success");
        setStep(3); // Optionally move to success step
      } else {
        notify("Failed to save projections", "error");
      }
    } catch (error) {
      notify("Error saving projections", "error");
    } finally {
      setSubmitting(false);
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

  const columns = useMemo(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        required: true,
        cell: ({ row }: any) => (
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
        ),
      },

      {
        accessorKey: "categoryName",
        header: "Category Name",
        required: true,

        cell: ({ row }: any) => {
          // Filter categories based on row type
          const options = categories
            .filter((cat) => cat.category_type === row.original.type)
            .map((cat) => cat.category_name);

          return (
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
          );
        },
      },

      // {
      //   accessorKey: "categoryName",
      //   header: "Category Name",
      //   required: true,
      //   cell: ({ row }: any) => {
      //     const options =
      //       row.original.type === "Inflow"
      //         ? ["Sales", "Interest Income", "Investment"]
      //         : row.original.type === "Outflow"
      //         ? ["Salaries", "Rent", "Utilities"]
      //         : [];

      //     return (
      //       <select
      //         value={row.original.categoryName}
      //         onChange={(e) =>
      //           handleInputChange(row.index, "categoryName", e.target.value)
      //         }
      //         disabled={!row.original.type || !row.original._isEditing}
      //         className="border rounded px-2 py-1 w-full"
      //       >
      //         <option value="" hidden>
      //           {row.original.type ? "Choose..." : "Select Type first"}
      //         </option>
      //         {options.map((opt) => (
      //           <option key={opt} value={opt}>
      //             {opt}
      //           </option>
      //         ))}
      //       </select>
      //     );
      //   },
      // },
      {
        accessorKey: "entity",
        header: "Entity",
        required: true,
        cell: ({ row }: any) => (
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
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        required: true,
        cell: ({ row }: any) => (
          <select
            value={row.original.department}
            onChange={(e) => {
              handleInputChange(row.index, "department", e.target.value); // Debug
            }}
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
            <input
              type="number"
              value={localValue}
              min={1}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              className="border rounded px-2 py-1 w-full text-right focus:outline-none"
              disabled={!row.original._isEditing}
            />
          );
        },
      },
      {
        accessorKey: "recurring",
        header: "Recurring",
        required: true,
        cell: ({ row }: any) => (
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
        ),
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        required: true,
        cell: ({ row }: any) => (
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
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        required: false,
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = useState(row.original.description || "");

          const handleBlur = () => {
            handleInputChange(row.index, "description", localValue);
          };

          return (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              className="border rounded px-2 py-1 w-full"
              disabled={!row.original._isEditing}
              placeholder="Enter description"
            />
          );
        },
      },
      {
        accessorKey: "counterparty_name",
        header: "Counterparty Name",
        required: false,
        cell: ({ row }: any) => (
          <CustomSelect
            label=""
            options={counterpartyOptions}
            selectedValue={row.original.counterparty_name}
            onChange={(value) => handleInputChange(row.index, "counterparty_name", value)}
            placeholder="Select counterparty"
            isClearable={true}
            isRequired={false}
            // disabled={!row.original._isEditing}
          />
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }: any) => (
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
        enableSorting: false,
      },
    ],
    [rows]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const projectionColumns = useMemo(() => {
    const baseCols = [
      { id: "type", accessorKey: "type", header: "Type" },
      {
        id: "categoryName",
        accessorKey: "categoryName",
        header: "Category Name",
      },
    ];

    const periodCols = getPeriods(proposalType, calculationDate).map(
      (period) => ({
        id: period, // important!
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
        id: "total", // important!
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
  }, [proposalType, rows, calculationDate]);

  const projectionRows = useMemo(() => {
    return rows.map((row) => {
      const periods = getPeriods(proposalType, calculationDate);
      const amount = Number(row.expectedAmount) || 0;

      let periodData: Record<string, number> = {};

      switch (true) {
        case !amount || !row.frequency:
          // If no amount or frequency, fill all with 0
          periodData = periods.reduce((acc, period) => {
            acc[period] = 0;
            return acc;
          }, {} as Record<string, number>);
          break;

        case row.frequency === "Yearly":
          // Only first month gets the amount
          periodData = periods.reduce((acc, period, idx) => {
            acc[period] = idx === 0 ? amount : 0;
            return acc;
          }, {} as Record<string, number>);
          break;

        case row.frequency === "Quarterly":
          // Distribute equally in every 3rd month (0,3,6,9)
          const n = Math.ceil(periods.length / 3);
          const perQuarter = amount / n;
          periodData = periods.reduce((acc, period, idx) => {
            acc[period] = idx % 3 === 0 ? perQuarter : 0;
            return acc;
          }, {} as Record<string, number>);
          break;

        case row.frequency === "Monthly":
          // Spread amount across all months
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
    setRows([
      {
        categoryName: "",
        type: "",
        entity: "",
        department: "",
        expectedAmount: 0,
        recurring: false,
        frequency: "Monthly",
        description: "",
        counterparty_name: "", // <-- Add this line
        _isEditing: true,
      },
    ]);
    setCalculationDate(() => {
      const today = new Date();
      return today.toISOString().split("T")[0];
    });
    setProposalType("Yearly (12 months)");
    setStep(1);
  };

  const allRowsSaved =
    rows.length > 0 && rows.every((row) => !row._isEditing && isRowValid(row));

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

  // Fetch counterparties (replace API and mapping as per your backend)
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
  }, []);

  return (
    <>
      <div>
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
                              r.categoryName === row.categoryName
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
                                      r.categoryName === row.categoryName
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
                <Button color="Fade" onClick={handleAddAnotherProjection}>
                  Cancel
                </Button>
              </div>
              <div>
                <Button
                  color={allRowsSaved ? "Green" : "Disable"}
                  disabled={!allRowsSaved}
                  onClick={() => setStep(2)}
                  type="submit"
                >
                  Submit for Approval
                </Button>
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className=" mt-16">
              <h2 className="text-xl font-semibold text-primary-lt pb-4">
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
                              r.categoryName === row.categoryName
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
                                      r.categoryName === row.categoryName
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
                <Button color="Fade" onClick={() => setStep(1)}>
                  Edit
                </Button>
              </div>
              <div>
                <form action="" onSubmit={onSubmit}>
                  <Button color="Green" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Confirm & Submit"}
                  </Button>
                </form>
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
      </div>
    </>
  );
};

export default ProjectionCreation;
