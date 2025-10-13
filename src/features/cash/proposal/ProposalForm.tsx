import React, { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import GridMasterOSTable from "../../../components/table/GridMasterOSTable";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { Trash2} from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export type Proposal = {
  ProjectionID: string;
  ProposalType: "Yearly" | "Quarterly" | "Monthly";
  StartDate: string;
  CategoryID: string;
  Type: "Inflow" | "Outflow";
  EntityID: string;
  DepartmentID: string;
  ExpectedAmount: number;
  Recurring?: boolean;
  CurrencyCode: string;
  CreatedAt: string;
  UpdatedAt: string;
};

const proposalTypeOptions = ["Yearly", "Quarterly", "Monthly"];
const typeOptions = ["Inflow", "Outflow"];
const currencyOptions = ["INR", "USD", "EUR", "GBP"]; // Replace with your currency master
// You may want to fetch these from API:
// const categoryOptions: string[] = []; // CategoryID options
// const entityOptions: string[] = []; // EntityID options
// const departmentOptions: string[] = []; // DepartmentID options

const ProposalForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotification();

  const [rows, setRows] = useState<Proposal[]>([
    {
      ProjectionID: "",
      ProposalType: "Yearly",
      StartDate: "",
      CategoryID: "",
      Type: "Inflow",
      EntityID: "",
      DepartmentID: "",
      ExpectedAmount: 0,
      Recurring: false,
      CurrencyCode: "",
      CreatedAt: "",
      UpdatedAt: "",
    },
  ]);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        ProjectionID: "",
        ProposalType: "Yearly",
        StartDate: "",
        CategoryID: "",
        Type: "Inflow",
        EntityID: "",
        DepartmentID: "",
        ExpectedAmount: 0,
        Recurring: false,
        CurrencyCode: "",
        CreatedAt: "",
        UpdatedAt: "",
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleInputChange = (
    idx: number,
    field: keyof Proposal,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const onSubmit = async (data: Proposal[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await nos.post<any>(
        `${apiBaseUrl}/cash/proposal/create`,
        { proposals: data }
      );
      if (response.data.success) {
        notify("Proposal(s) created successfully", "success");
      }
    } catch (error) {
      notify("Error saving proposal ❌", "error");
    }
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setRows([
      {
        ProjectionID: "",
        ProposalType: "Yearly",
        StartDate: "",
        CategoryID: "",
        Type: "Inflow",
        EntityID: "",
        DepartmentID: "",
        ExpectedAmount: 0,
        Recurring: false,
        CurrencyCode: "",
        CreatedAt: "",
        UpdatedAt: "",
      },
    ]);
  };

  const allFieldsFilled = rows.every(
    (row) =>
      row.ProposalType &&
      row.StartDate &&
      row.CategoryID &&
      row.Type &&
      row.EntityID &&
      row.DepartmentID &&
      row.ExpectedAmount > 0 &&
      row.CurrencyCode
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "ProposalType",
        header: "Proposal Type",
        cell: ({ row }: any) => (
          <select
            value={row.original.ProposalType}
            onChange={(e) =>
              handleInputChange(row.index, "ProposalType", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          >
            {proposalTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "StartDate",
        header: "Start Date",
        cell: ({ row }: any) => (
          <input
            type="date"
            value={row.original.StartDate}
            onChange={(e) =>
              handleInputChange(row.index, "StartDate", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          />
        ),
      },
      {
        accessorKey: "CategoryID",
        header: "Category",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.CategoryID}
            onChange={(e) =>
              handleInputChange(row.index, "CategoryID", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Category ID"
          />
        ),
      },
      {
        accessorKey: "Type",
        header: "Type",
        cell: ({ row }: any) => (
          <select
            value={row.original.Type}
            onChange={(e) =>
              handleInputChange(row.index, "Type", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          >
            {typeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "EntityID",
        header: "Entity",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.EntityID}
            onChange={(e) =>
              handleInputChange(row.index, "EntityID", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Entity ID"
          />
        ),
      },
      {
        accessorKey: "DepartmentID",
        header: "Department",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.DepartmentID}
            onChange={(e) =>
              handleInputChange(row.index, "DepartmentID", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Department ID"
          />
        ),
      },
      {
        accessorKey: "ExpectedAmount",
        header: "Expected Amount",
        cell: ({ row }: any) => (
          <input
            type="number"
            min={0}
            value={row.original.ExpectedAmount}
            onChange={(e) =>
              handleInputChange(
                row.index,
                "ExpectedAmount",
                Number(e.target.value)
              )
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Amount"
          />
        ),
      },
      {
        accessorKey: "Recurring",
        header: "Recurring",
        cell: ({ row }: any) => (
          <select
            value={
              row.original.Recurring === undefined
                ? ""
                : row.original.Recurring
                ? "Yes"
                : "No"
            }
            onChange={(e) =>
              handleInputChange(
                row.index,
                "Recurring",
                e.target.value === "Yes" ? true : false
              )
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">Choose...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        ),
      },
      {
        accessorKey: "CurrencyCode",
        header: "Currency",
        cell: ({ row }: any) => (
          <select
            value={row.original.CurrencyCode}
            onChange={(e) =>
              handleInputChange(row.index, "CurrencyCode", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="" hidden>
              Choose...
            </option>
            {currencyOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }: any) => (
          <button
            type="button"
            className="text-red-600 font-bold px-2 flex items-center"
            onClick={() => handleRemoveRow(row.index)}
            title="Remove row"
          >
            <Trash2 size={18} />
          </button>
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

      <GridMasterOSTable<Proposal> table={table} />

      <div className="mt-4">
        <button
          onClick={handleAddRow}
          className="px-6 py-2 bg-primary text-white rounded font-semibold"
        >
          Add Row
        </button>
      </div>
    </>
  );
};

export default ProposalForm;