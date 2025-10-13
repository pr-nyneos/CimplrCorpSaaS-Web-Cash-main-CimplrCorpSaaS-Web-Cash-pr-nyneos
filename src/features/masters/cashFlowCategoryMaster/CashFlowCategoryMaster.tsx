import { Trash2, Settings as SettingsIcon } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
// import Layout from "../../../../components/layout/Layout";
import GridMasterOSTable from "../GridMasterOSTable";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";
import React from "react";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup.tsx";
import InputGroup from "../../../components/ui/InputGroup.tsx";
// import type { APIResponse } from "../../../types/type.ts";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const mappingOptions = ["Choose...", "Payable", "Receivable", "Neutral"];

const usageFlagOptions = [
  "Choose...",
  "Forecasting Only",
  "Reporting Only",
  "Both",
];
const Cashflow = ["Choose...", "Operating", "Investing", "Financing"];

type APIResponse = {
  success: boolean;
  error?: string;
  rows?: {
    created: {
      category_id: string;
      category_name: string;
      success: boolean;
      error?: string;
    }[];
    relationships_added: number;
  };
};

type CashflowCategoryRow = {
  category_name: string;
  category_type: string;
  parent_category_id: string;
  default_mapping: string;
  cashflow_nature: string;
  usage_flag: string;
  description: string;
  status: string;
  category_level: number;

  // ERP fields
  erp_type?: string;
  external_code?: string;
  erp_segment?: string;

  // SAP
  sap_fsv?: string;
  sap_node?: string;
  sap_bukrs?: string;
  sap_notes?: string;

  // Oracle
  oracle_ledger?: string;
  oracle_cf_code?: string;
  oracle_cf_name?: string;
  oracle_line?: string;

  // Tally
  tally_group?: string;
  tally_voucher?: string;
  tally_notes?: string;

  // Sage
  sage_section?: string;
  sage_line?: string;
  sage_notes?: string;
};

const categoryLevelMap: Record<string, number> = {
  "Level 0": 0,
  "Level 1": 1,
  "Level 2": 2,
  "Level 3": 3,
};

function CashFlowCategoryMaster() {
  const emptyRow: CashflowCategoryRow = {
    category_name: "",
    category_type: "",
    parent_category_id: "",
    default_mapping: "",
    cashflow_nature: "",
    usage_flag: "",
    description: "",
    status: "Active",
    category_level: 0,

    // ERP fields
    erp_type: "",
    external_code: "",
    erp_segment: "",

    sap_fsv: "",
    sap_node: "",
    sap_bukrs: "",
    sap_notes: "",

    oracle_ledger: "",
    oracle_cf_code: "",
    oracle_cf_name: "",
    oracle_line: "",

    tally_group: "",
    tally_voucher: "",
    tally_notes: "",

    sage_section: "",
    sage_line: "",
    sage_notes: "",
  };

  const [rows, setRows] = useState<CashflowCategoryRow[]>([{ ...emptyRow }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setCategoryLevel] = useState<string>("");
  // const [parentOptions, setParentOptions] = useState<
  //   { value: string; label: string }[]
  // >([]);
  const [parentOptionsMap, setParentOptionsMap] = useState<
    Record<number, { value: string; label: string }[]>
  >({});
  const [erpDrawerOpen, setErpDrawerOpen] = useState(false);
  const [erpDrawerRow, setErpDrawerRow] = useState<any>(null);

  const handleAddRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  const handleReset = () => {
    setRows([{ ...emptyRow }]);
  };

  const { notify } = useNotification();

  const handleInputChange = (
    idx: number,
    field: keyof CashflowCategoryRow,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );

    if (field === "category_level") {
      const levelNumber = Number(value); // Ensure this is a number
      console.log("Selected level number:", levelNumber);

      nos
        .post<{ rows: { id: string; name: string }[]; success: boolean }>(
          `${apiBaseUrl}/master/cashflow-category/find-parent-at-level`,
          { level: Number(levelNumber) }
        )
        .then((response) => {
          if (response.data.success && response.data.rows) {
            console.log("Fetched parent categories:", response.data.rows);
            setParentOptionsMap((prev) => ({
              ...prev,
              [idx]: response.data.rows.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            }));
            console.log("Updated parentOptionsMap:", parentOptionsMap);
          } else {
            setParentOptionsMap((prev) => ({ ...prev, [idx]: [] }));
          }
        })
        .catch(() => setParentOptionsMap((prev) => ({ ...prev, [idx]: [] })));
      // } else {
      //   setParentOptionsMap((prev) => ({ ...prev, [idx]: [] }));
      // }
    }
  };

  const handleRemoveRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  // React.useEffect(() => {
  //   console.log("category_level changed:", category_level);
  //   if (category_level && typeof category_level === "string") {
  //     const levelNumber = categoryLevelMap[category_level];
  //     console.log("Fetching parent categories for level:", levelNumber);
  //     nos
  //       .post<{ rows: { id: string; name: string }[]; success: boolean }>(
  //         `${apiBaseUrl}/master/cashflow-category/find-parent-at-level`,
  //         { level: levelNumber }
  //       )
  //       .then((response) => {
  //         console.log("API called for parent categories");
  //         console.log("API Response:", response.data);
  //         if (response.data.success && response.data.rows) {
  //           setParentOptions(
  //             response.data.rows.map((item) => ({
  //               value: item.id,
  //               label: item.name,
  //             }))
  //           );
  //         } else {
  //           console.warn("No results found or API indicated failure");
  //           setParentOptions([]);
  //         }
  //       })
  //       .catch((err) => {
  //         console.error("API call failed:", err);
  //         setParentOptions([]);
  //       });
  //   } else {
  //     setParentOptions([]);
  //   }
  // }, [category_level]);

  // // To log the updated value:
  // React.useEffect(() => {
  //   console.log("Updated Parent Options:", parentOptions);
  // }, [parentOptions]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "category_name",
        header: "Category Name",
        required: true,
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = useState(
            row.original["category_name"] || ""
          );
          const handleBlur = () => {
            if (localValue !== row.original["category_name"]) {
              handleInputChange(row.index, "category_name", localValue);
            }
          };
          return (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              maxLength={100}
              className="border rounded px-2 py-1 w-full"
            />
          );
        },
      },
      {
        accessorKey: "category_type",
        header: "Category Type",
        required: true,
        cell: ({ row }: any) => (
          <select
            value={row.original["category_type"]}
            onChange={(e) =>
              handleInputChange(row.index, "category_type", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">Select Category Type</option>
            <option value="Inflow">Inflow</option>
            <option value="Outflow">Outflow</option>
          </select>
        ),
      },
      {
        accessorKey: "parent_category_id",
        header: "Parent Category",
        cell: ({ row }: any) =>
          row.original.category_level > 0 ? (
            <CustomSelect
              label=""
              options={parentOptionsMap[row.index] || []}
              selectedValue={row.original.parent_category_id || ""}
              onChange={(value) =>
                handleInputChange(row.index, "parent_category_id", value)
              }
              placeholder="Select parent category"
              isClearable={false}
            />
          ) : null,
      },
      {
        accessorKey: "category_level",
        header: "Category Level",
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = React.useState(
            Object.keys(categoryLevelMap).find(
              (key) => categoryLevelMap[key] === row.original.category_level
            ) || "Level 0"
          );

          const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            setLocalValue(e.target.value);
            handleInputChange(
              row.index,
              "category_level",
              categoryLevelMap[e.target.value]
            );
          };

          return (
            <select
              value={localValue}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            >
              {Object.keys(categoryLevelMap).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        accessorKey: "default_mapping",
        header: "Default Mapping",
        required: true,
        cell: ({ row }: any) => {
          return (
            <select
              value={row.original["default_mapping"]}
              onChange={(e) =>
                handleInputChange(row.index, "default_mapping", e.target.value)
              }
              className="border rounded px-2 py-1 w-full"
            >
              {mappingOptions.map((option) => (
                <option
                  key={option}
                  value={option === "Choose..." ? "" : option}
                >
                  {option}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        accessorKey: "cashflow_nature",
        header: "Cashflow Nature",
        required: true,
        cell: ({ row }: any) => {
          return (
            <select
              value={row.original["cashflow_nature"]}
              onChange={(e) =>
                handleInputChange(row.index, "cashflow_nature", e.target.value)
              }
              className="border rounded px-2 py-1 w-full"
            >
              {Cashflow.map((option) => (
                <option
                  key={option}
                  value={option === "Choose..." ? "" : option}
                >
                  {option}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        accessorKey: "usage_flag",
        header: "Usage Flag",
        required: true,
        cell: ({ row }: any) => {
          return (
            <select
              value={row.original["usage_flag"]}
              onChange={(e) =>
                handleInputChange(row.index, "usage_flag", e.target.value)
              }
              className="border rounded px-2 py-1 w-full"
            >
              {usageFlagOptions.map((option) => (
                <option
                  key={option}
                  value={option === "Choose..." ? "" : option}
                >
                  {option}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = useState(
            row.original.description || ""
          );
          const handleBlur = () => {
            if (localValue !== row.original.description) {
              handleInputChange(row.index, "description", localValue);
            }
          };
          return (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              maxLength={200}
              className="border rounded px-2 py-1 w-full"
            />
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        required: true,
        cell: ({ row }: any) => (
          <select
            value={row.original.status}
            onChange={(e) =>
              handleInputChange(row.index, "status", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }: any) => (
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="text-blue-600 font-bold px-2 flex items-center"
              onClick={() => {
                setErpDrawerRow(row.original);
                setErpDrawerOpen(true);
              }}
              title="ERP Mapping"
            >
              <SettingsIcon size={18} />
            </button>
            <button
              type="button"
              className="text-red-600 font-bold px-2 flex items-center"
              onClick={() => handleRemoveRow(row.index)}
              title="Remove Row"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [rows]
  );

  const allFieldsFilled = rows.every(
    (row) =>
      row.category_name.trim() &&
      row.category_type.trim() &&
      row.default_mapping.trim() &&
      row.cashflow_nature.trim() &&
      row.usage_flag.trim() &&
      row.status.trim()
  );

  const onSubmit = async (data: CashflowCategoryRow[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Prepare array payload
    const payload = data.map((row) => ({
      category_name: row.category_name || null,
      category_type: row.category_type || null,
      parent_category_id:
        (row.parent_category_id === "None" ? "" : row.parent_category_id) || "",
      default_mapping: row.default_mapping || null,
      cashflow_nature: row.cashflow_nature || null,
      usage_flag: row.usage_flag ? row.usage_flag.replace(/\s+/g, "") : null,
      description: row.description || null,
      status: row.status || null,
      category_level: row.category_level ?? null,
    }));

    try {
      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/v2/cashflow-category/bulk-create-sync`,
        { categories: payload },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response?.data?.rows?.created && response.data.rows.created[0].success) {
        notify("CashFlow Category created successfully", "success");
        handleReset();
      } else {
        notify(response?.data?.rows?.created[0]?.error || "Error saving data", "error");
      }
    } catch (error) {
      console.error("API Error:", error);
      notify("Error saving cashflow categories", "error");
    }

    setIsSubmitting(false);
  };

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (rows.length > 0) {
      setCategoryLevel(
        Object.keys(categoryLevelMap).find(
          (key) => categoryLevelMap[key] === rows[0].category_level
        ) || ""
      );
    }
  }, [rows]);

  return (
    <>
      <div className="flex items-center justify-end py-3 gap-x-4 gap-2">
        <div className="w-15rem">
          <Button
            type="submit"
            color={allFieldsFilled ? "Green" : "Disable"}
            disabled={!allFieldsFilled || isSubmitting}
            onClick={() => onSubmit(rows)}
          >
            Save
          </Button>
        </div>
        <div className="w-15rem">
          <Button color="Fade" onClick={handleReset}>
            Reset
          </Button>
        </div>
        <div className="w-15rem">
          <Button color="Fade">Exit</Button>
        </div>
      </div>
      <GridMasterOSTable<CashflowCategoryRow> table={table} />
      <div className="mt-4">
        <button
          onClick={handleAddRow}
          className="px-6 py-2 bg-primary text-white rounded font-semibold"
        >
          Add Row
        </button>
      </div>
      <ErpMappingDrawer
        open={erpDrawerOpen}
        onClose={() => setErpDrawerOpen(false)}
        row={erpDrawerRow}
        onSave={(fields) => {
          if (erpDrawerRow) {
            setRows((prev) =>
              prev.map((row) =>
                row === erpDrawerRow ? { ...row, ...fields } : row
              )
            );
            setErpDrawerOpen(false);
          }
        }}
      />
    </>
  );
}

// Drawer component for ERP Mapping
function ErpMappingDrawer({
  open,
  onClose,
  row,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  row: any;
  onSave: (fields: any) => void;
}) {
  const [erpType, setErpType] = React.useState("Generic");
  const [fields, setFields] = React.useState<any>({});

  React.useEffect(() => {
    setErpType("Generic");
    setFields({});
  }, [row, open]);

  const handleFieldChange = (name: string, value: string) => {
    setFields((prev: any) => ({ ...prev, [name]: value }));
  };

  // const erpOptions = [
  //   { label: "Generic", value: "Generic" },
  //   { label: "SAP", value: "SAP" },
  //   { label: "Oracle", value: "Oracle" },
  //   { label: "Tally", value: "Tally" },
  //   { label: "Sage", value: "Sage" },
  // ];

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[9999] flex justify-end"
      style={{ background: "rgba(0,0,0,0.2)" }}
    >
      <div className="bg-white w-full max-w-2xl h-full shadow-xl p-6 relative overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">ERP Mapping</h2>
        <div className="mb-2 text-gray-700">
          <span className="font-semibold">For:</span>{" "}
          {row?.category_name || "(unnamed)"}
        </div>
        <form className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <DropdownGroup
              label="ERP Type"
              // options={erpOptions}
              options={["Generic", "SAP", "Oracle", "Tally", "Sage"]}
              // value={erpType}
              onChange={(val: string) => setErpType(val)}
              required={true}
            />
            <InputGroup
              label="External Code / Ref"
              placeholder="Enter external code or reference"
              value={fields.external_code || ""}
              onChange={(val: string) =>
                handleFieldChange("external_code", val)
              }
            />
            <InputGroup
              label="Segment / Dimension"
              placeholder="Enter segment or dimension"
              value={fields.erp_segment || ""}
              onChange={(val: string) => handleFieldChange("erp_segment", val)}
            />
          </div>

          {erpType === "SAP" && (
            <div className="col-span-3">
              <h2 className="text-xl font-semibold text-secondary-text-dark mt-2 mb-4">
                SAP FSV Mapping
              </h2>
              <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-3 gap-4">
                <InputGroup
                  label="FSV ID"
                  placeholder="ZFSV01"
                  value={fields.sap_fsv || ""}
                  onChange={(val: string) => handleFieldChange("sap_fsv", val)}
                  required
                />
                <InputGroup
                  label="FSV Node"
                  placeholder="1000.10"
                  value={fields.sap_node || ""}
                  onChange={(val: string) => handleFieldChange("sap_node", val)}
                  required
                />
                <InputGroup
                  label="Company Code (BUKRS)"
                  placeholder="1000"
                  value={fields.sap_bukrs || ""}
                  onChange={(val: string) =>
                    handleFieldChange("sap_bukrs", val)
                  }
                  required
                />
                <InputGroup
                  label="Notes"
                  placeholder="Notes"
                  value={fields.sap_notes || ""}
                  onChange={(val: string) =>
                    handleFieldChange("sap_notes", val)
                  }
                />
              </div>
            </div>
          )}

          {erpType === "Oracle" && (
            <div className="col-span-3">
              <h2 className="text-xl font-semibold text-secondary-text-dark mt-2 mb-4">
                Oracle Mapping
              </h2>
              <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-3 gap-4">
                <InputGroup
                  label="Ledger"
                  placeholder="CORP_LEDGER"
                  value={fields.oracle_ledger || ""}
                  onChange={(val: string) =>
                    handleFieldChange("oracle_ledger", val)
                  }
                  required
                />
                <InputGroup
                  label="CF Category Code"
                  placeholder="CFO_CUST_RCPT"
                  value={fields.oracle_cf_code || ""}
                  onChange={(val: string) =>
                    handleFieldChange("oracle_cf_code", val)
                  }
                />
                <InputGroup
                  label="CF Category Name"
                  placeholder=""
                  value={fields.oracle_cf_name || ""}
                  onChange={(val: string) =>
                    handleFieldChange("oracle_cf_name", val)
                  }
                />
                <InputGroup
                  label="Line Order"
                  placeholder=""
                  value={fields.oracle_line || ""}
                  onChange={(val: string) =>
                    handleFieldChange("oracle_line", val)
                  }
                />
              </div>
            </div>
          )}

          {erpType === "Tally" && (
            <div className="col-span-3">
              <h2 className="text-xl font-semibold text-secondary-text-dark mt-2 mb-4">
                Tally Mapping
              </h2>
              <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-3 gap-4">
                <InputGroup
                  label="Cash Flow Group"
                  placeholder="Operating / Investing / Financing"
                  value={fields.tally_group || ""}
                  onChange={(val: string) =>
                    handleFieldChange("tally_group", val)
                  }
                  required
                />
                <InputGroup
                  label="Voucher Type"
                  placeholder="Receipt / Payment / Contra"
                  value={fields.tally_voucher || ""}
                  onChange={(val: string) =>
                    handleFieldChange("tally_voucher", val)
                  }
                  required
                />
                <InputGroup
                  label="Notes"
                  placeholder="Notes"
                  value={fields.tally_notes || ""}
                  onChange={(val: string) =>
                    handleFieldChange("tally_notes", val)
                  }
                />
              </div>
            </div>
          )}

          {erpType === "Sage" && (
            <div className="col-span-3">
              <h2 className="text-xl font-semibold text-secondary-text-dark mt-2 mb-4">
                Sage Mapping
              </h2>
              <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-3 gap-4">
                <InputGroup
                  label="Report Section"
                  placeholder=""
                  value={fields.sage_section || ""}
                  onChange={(val: string) =>
                    handleFieldChange("sage_section", val)
                  }
                  required
                />
                <InputGroup
                  label="Line Code"
                  placeholder=""
                  value={fields.sage_line || ""}
                  onChange={(val: string) =>
                    handleFieldChange("sage_line", val)
                  }
                />
                <InputGroup
                  label="Notes"
                  placeholder="Notes"
                  value={fields.sage_notes || ""}
                  onChange={(val: string) =>
                    handleFieldChange("sage_notes", val)
                  }
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="px-4 py-2 bg-primary text-white rounded"
              onClick={() => onSave({ ...fields, erp_type: erpType })}
            >
              Save Mapping
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CashFlowCategoryMaster;
