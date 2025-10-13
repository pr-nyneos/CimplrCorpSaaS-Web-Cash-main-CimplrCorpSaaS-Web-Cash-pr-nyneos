import React, { useMemo, useState } from "react";
// import axios from "axios";
import { CURRENCY_DATA } from "../../../constant/constants";
// import Layout from "..//../../components/layout/Layout";
import GridMasterOSTable from "../GridMasterOSTable";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
// import { z } from "zod";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { X } from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type CurrencyRow = {
  currencyCode: string;
  currencyName: string;
  country: string;
  symbol: string;
  decimalPlace: number | null;
  status: string;
};

const CurrencyMaster: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotification();

  // Update: Accepts array of rows and sends all as payload
  const onSubmit = async (data: CurrencyRow[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Prepare array payload
    const payload = data.map((row) => ({
      currency_code: row.currencyCode || null,
      currency_name: row.currencyName || null,
      country: row.country || null,
      symbol: row.symbol || null,
      decimal_places: row.decimalPlace ?? null,
      status: row.status || null,
    }));

    try {
      const response = await nos.post<any>(
        `${apiBaseUrl}/master/currency/create`,
        { currency : payload },
        // { headers: { "Content-Type": "application/json" } }
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

  const [rows, setRows] = useState<CurrencyRow[]>([
    {
      currencyCode: "",
      currencyName: "",
      country: "",
      symbol: "",
      decimalPlace: null,
      status: "",
    },
  ]);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        currencyCode: "",
        currencyName: "",
        country: "",
        symbol: "",
        decimalPlace: null,
        status: "",
      },
    ]);
  };

  const handleRemoveRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleInputChange = (
    idx: number,
    field: keyof CurrencyRow,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        // If currencyCode is changed, try to auto-fill other fields
        if (field === "currencyCode") {
          const code = value.toUpperCase();
          const found = CURRENCY_DATA.find(
            (c) => c.currencyCode.toUpperCase() === code
          );
          if (found) {
            return {
              ...row,
              currencyCode: code,
              currencyName: found.currencyName,
              country: found.country,
              symbol: found.symbol,
            };
          } else {
            // If not found, clear the other fields
            return {
              ...row,
              currencyCode: code,
              currencyName: "",
              country: "",
              symbol: "",
            };
          }
        }
        // For other fields, just update as usual
        return { ...row, [field]: value };
      })
    );
  };

  // inside CurrencyMaster component

  const columns = useMemo(
    () => [
      {
        accessorKey: "currencyCode",
        required: true,
        header: "Currency Code",
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = useState(
            row.original.currencyCode
          );

          const commitValue = () => {
            handleInputChange(
              row.index,
              "currencyCode",
              localValue.toUpperCase()
            );
          };

          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              commitValue();
              // Optionally blur to remove focus after enter
              (e.target as HTMLInputElement).blur();
            }
          };

          return (
            <input
              type="text"
              value={localValue}
              maxLength={3}
              onChange={(e) => setLocalValue(e.target.value.toUpperCase())}
              onBlur={commitValue}
              onKeyDown={handleKeyDown}
              className="border rounded px-2 py-1 w-full uppercase focus:outline-none"
            />
          );
        },
      },
      {
        accessorKey: "currencyName",
        header: "Currency Name",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.currencyName}
            disabled
            className="border rounded px-2 py-1 w-full bg-gray-100"
            placeholder="Auto Fill"
          />
        ),
      },
      {
        accessorKey: "country",
        header: "Country",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.country}
            disabled
            className="border rounded px-2 py-1 w-full bg-gray-100"
            placeholder="Auto Fill"
          />
        ),
      },
      {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }: any) => (
          <input
            type="text"
            value={row.original.symbol}
            disabled
            className="border rounded px-2 py-1 w-full bg-gray-100"
            placeholder="Auto Fill"
          />
        ),
      },
      {
        accessorKey: "decimalPlace",
        required: true,
        header: "Decimal Place",
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = useState(
            row.original.decimalPlace?.toString() || ""
          );

          const handleBlur = () => {
            const parsed = Number(localValue);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
              handleInputChange(row.index, "decimalPlace", parsed);
            } else {
              // reset to previous valid value if invalid
              setLocalValue(row.original.decimalPlace?.toString() || "");
            }
          };

          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            // Allow empty for typing/deletion
            if (val === "" || /^[0-4]$/.test(val)) {
              setLocalValue(val);
            }
          };

          return (
            <input
              type="text"
              inputMode="numeric"
              value={localValue}
              onChange={handleChange}
              onBlur={handleBlur}
              className="border rounded px-2 py-1 w-full text-left focus:outline-none"
              maxLength={1}
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
            <option value="" hidden>Choose...</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
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
            <X size={18} />
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

  // Add this function inside your component
  const handleReset = () => {
    setRows([
      {
        currencyCode: "",
        currencyName: "",
        country: "",
        symbol: "",
        decimalPlace: null,
        status: "",
      },
    ]);
  };
  // Add this function inside your component
  const allFieldsFilled = rows.every(
    (row) =>
      row.currencyCode.trim() && row.decimalPlace !== null && row.status.trim()
  );

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
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="w-15rem">
          <Button color="Fade" onClick={handleReset}>
            Reset
          </Button>
        </div>

        {/* <div className="w-15rem">
          <Button color="Fade">Exit</Button>
        </div> */}
      </div>

      <GridMasterOSTable<CurrencyRow> table={table} />

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

export default CurrencyMaster;
