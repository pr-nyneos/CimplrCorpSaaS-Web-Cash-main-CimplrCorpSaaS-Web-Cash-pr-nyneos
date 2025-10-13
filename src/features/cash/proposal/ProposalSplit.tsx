import React, { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import GridMasterOSTable from "../../../components/table/GridMasterOSTable";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { Trash2 } from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export type ProposalForm = {
  proposalDate: string;
  entity: string;
  department: string;
  bank: string;
  currency: string;
  categoryType: string;
  categoryName: string;
  expectedAmount: number;
  recurring?: boolean;
  recurringType?: string;
  dateSelection?: string;
  remarks?: string;
  autoSpread?: boolean;
};

// const entityOptions: string[] = []; // Fill with entity names/IDs
// const departmentOptions: string[] = []; // Fill with department names/IDs
// const bankOptions: string[] = []; // Fill with bank names/IDs
const currencyOptions = ["INR", "USD", "EUR", "GBP"]; // Replace with your currency master
const categoryTypeOptions = ["Type1", "Type2"]; // Example types
const recurringTypeOptions = ["Monthly", "Quarterly", "Yearly"];

const ProposalSplit: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotification();

  const [rows, setRows] = useState<ProposalForm[]>([
    {
      proposalDate: "",
      entity: "",
      department: "",
      bank: "",
      currency: "",
      categoryType: "",
      categoryName: "",
      expectedAmount: 0,
      recurring: false,
      recurringType: "",
      dateSelection: "",
      remarks: "",
      autoSpread: false,
    },
  ]);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        proposalDate: "",
        entity: "",
        department: "",
        bank: "",
        currency: "",
        categoryType: "",
        categoryName: "",
        expectedAmount: 0,
        recurring: false,
        recurringType: "",
        dateSelection: "",
        remarks: "",
        autoSpread: false,
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleInputChange = (
    idx: number,
    field: keyof ProposalForm,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const onSubmit = async (data: ProposalForm[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await nos.post<any>(
        `${apiBaseUrl}/cash/proposal/split-create`,
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
        proposalDate: "",
        entity: "",
        department: "",
        bank: "",
        currency: "",
        categoryType: "",
        categoryName: "",
        expectedAmount: 0,
        recurring: false,
        recurringType: "",
        dateSelection: "",
        remarks: "",
        autoSpread: false,
      },
    ]);
  };

  const allFieldsFilled = rows.every(
    (row) =>
      row.proposalDate &&
      row.entity &&
      row.department &&
      row.bank &&
      row.currency &&
      row.categoryType &&
      row.categoryName &&
      row.expectedAmount > 0
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "proposalDate",
        header: "Proposal Date",
        cell: ({ row }: any) => (
          <input
            type="date"
            value={row.original.proposalDate}
            onChange={(e) =>
              handleInputChange(row.index, "proposalDate", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          />
        ),
      },
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.entity}
            onChange={(e) =>
              handleInputChange(row.index, "entity", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Entity"
          />
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.department}
            onChange={(e) =>
              handleInputChange(row.index, "department", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Department"
          />
        ),
      },
      {
        accessorKey: "bank",
        header: "Bank",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.bank}
            onChange={(e) =>
              handleInputChange(row.index, "bank", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Bank"
          />
        ),
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ row }: any) => (
          <select
            value={row.original.currency}
            onChange={(e) =>
              handleInputChange(row.index, "currency", e.target.value)
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
        accessorKey: "categoryType",
        header: "Category Type",
        cell: ({ row }: any) => (
          <select
            value={row.original.categoryType}
            onChange={(e) =>
              handleInputChange(row.index, "categoryType", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="" hidden>
              Choose...
            </option>
            {categoryTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "categoryName",
        header: "Category Name",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.categoryName}
            onChange={(e) =>
              handleInputChange(row.index, "categoryName", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Category Name"
          />
        ),
      },
      {
        accessorKey: "expectedAmount",
        header: "Expected Amount",
        cell: ({ row }: any) => (
          <input
            type="number"
            min={0}
            value={row.original.expectedAmount}
            onChange={(e) =>
              handleInputChange(
                row.index,
                "expectedAmount",
                Number(e.target.value)
              )
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Amount"
          />
        ),
      },
      {
        accessorKey: "recurring",
        header: "Recurring",
        cell: ({ row }: any) => (
          <select
            value={
              row.original.recurring === undefined
                ? ""
                : row.original.recurring
                ? "Yes"
                : "No"
            }
            onChange={(e) =>
              handleInputChange(
                row.index,
                "recurring",
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
        accessorKey: "recurringType",
        header: "Recurring Type",
        cell: ({ row }: any) => (
          <select
            value={row.original.recurringType || ""}
            onChange={(e) =>
              handleInputChange(row.index, "recurringType", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            disabled={!row.original.recurring}
          >
            <option value="" hidden>
              Choose...
            </option>
            {recurringTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "dateSelection",
        header: "Date Selection",
        cell: ({ row }: any) => (
          <input
            type="date"
            value={row.original.dateSelection || ""}
            onChange={(e) =>
              handleInputChange(row.index, "dateSelection", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            disabled={!row.original.recurring}
          />
        ),
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.remarks || ""}
            onChange={(e) =>
              handleInputChange(row.index, "remarks", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
            placeholder="Remarks"
          />
        ),
      },
      {
        accessorKey: "autoSpread",
        header: "Auto Spread",
        cell: ({ row }: any) => (
          <select
            value={
              row.original.autoSpread === undefined
                ? ""
                : row.original.autoSpread
                ? "Yes"
                : "No"
            }
            onChange={(e) =>
              handleInputChange(
                row.index,
                "autoSpread",
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

      <GridMasterOSTable<ProposalForm> table={table} />

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

export default ProposalSplit;