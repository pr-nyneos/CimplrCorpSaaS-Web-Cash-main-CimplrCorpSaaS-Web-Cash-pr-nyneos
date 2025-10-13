import { useMemo, useState } from "react";
// import axios from "axios";
// import Layout from "../../../../components/layout/Layout";
import GridMasterOSTable from "../GridMasterOSTable";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import nos from "../../../utils/nos.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Category = [
  "Choose...",
  "Vendor Payment",
  "Salary Payment",
  "Customer Collection",
  "Loan Receipt",
  "Tax Payment",
  "Other",
];

type PayableReceivableRow = {
  type: string;
  name: string;
  category: string;
  description: string;
  status: string;
};

const PayableReceivableMaster: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotification();

  // const [localValue, setLocalValue] = useState(row.original.Name || "");
  // Update: Accepts array of rows and sends all as payload
  const onSubmit = async (data: PayableReceivableRow[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Prepare array payload
    const payload = data.map((row) => ({
      type: row.type || null,
      name: row.name || null,
      category: row.category || null,
      description: row.description || null,
      status: row.status || null,
    }));

    try {
      const response = await nos.post<any>(
        `${apiBaseUrl}/master/payablereceivable/create`,
        { rows: payload }
      );
      if (response.data.success) {
        notify("Currency created successfully", "success");
      }
    } catch (error) {
      console.error("API Error:", error);
      notify("Error saving currency", "error");
    }

    setIsSubmitting(false);
  };

  const [rows, setRows] = useState<PayableReceivableRow[]>([
    {
      type: "",
      name: "",
      category: "",
      description: "",
      status: "",
    },
  ]);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        type: "",
        name: "",
        category: "",
        description: "",
        status: "",
      },
    ]);
  };

  const handleReset = () => {
    setRows([
      {
        type: "",
        name: "",
        category: "",
        description: "",
        status: "",
      },
    ]);
  };

  const handleInputChange = (
    idx: number,
    field: keyof PayableReceivableRow,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  // const handleSave = async () => {
  //   try {
  //     const response = await axios.post(
  //       "/api/payable-receivable-master",
  //       rows,
  //       {
  //         headers: { "Content-Type": "application/json" },
  //       }
  //     );
  //     console.log("Save success:", response.data);
  //     alert("Data saved successfully ✅");
  //   } catch (error) {
  //     console.error("Save failed:", error);
  //     alert("Error saving data ❌");
  //   }
  // };

  const columns = useMemo(
    () => [
      {
        accessorKey: "Type",
        header: "Type",
        required: true,
        cell: ({ row }: any) => (
          <select
            value={row.original.type}
            onChange={(e) =>
              handleInputChange(row.index, "type", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">Choose...</option>
            <option value="Payable">Payable</option>
            <option value="Receivable">Receivable</option>
          </select>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }: any) => (
          <input
            type="text"
            defaultValue={row.original.name} // use defaultValue for uncontrolled input
            onBlur={(e) => handleInputChange(row.index, "name", e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        ),
      },

      {
        accessorKey: "Category",
        header: "Category",
        required: true,
        cell: ({ row }: any) => (
          <select
            value={row.original.category}
            onChange={(e) =>
              handleInputChange(row.index, "category", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          >
            {Category.map((option) => (
              <option key={option} value={option === "Choose..." ? "" : option}>
                {option}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }: any) => (
          <input
            type="text"
            defaultValue={row.original.description} // uncontrolled input
            onBlur={(e) =>
              handleInputChange(row.index, "description", e.target.value)
            }
            className="border rounded px-2 py-1 w-full"
          />
        ),
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
            <option value="" hidden>Choose...</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        ),
      },
    ],
    [rows]
  );

  const allFieldsFilled = rows.every(
    (row) =>
      row.type?.trim() &&
      row.name?.trim() &&
      row.category?.trim() &&
      row.status?.trim()
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
            color={allFieldsFilled ? "Green" : "Disable"}
            disabled={!allFieldsFilled || isSubmitting}
            onClick={() => onSubmit(rows)}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="w-15rem">
          <Button color="Fade" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
      <GridMasterOSTable<PayableReceivableRow> table={table} />
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

export default PayableReceivableMaster;
