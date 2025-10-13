import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import GridMasterOSTable from "../../masters/GridMasterOSTable";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import type { ColumnDef } from "@tanstack/react-table";
import CustomSelect from "../../../components/ui/SearchSelect";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification";
import { Trash2 } from "lucide-react";

import nos from "../../../utils/nos";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
// Dropdown options (mocked – replace with API fetch later)
const transactionTypes = ["Payables", "Receivables"];
const counterpartyMaster = ["Amazon", "Google", "Microsoft", "Reliance", "TCS"]; // Mock for auto-suggest

export interface TransactionItem {
  transaction_type: string;
  entity_name: string;
  counterparty_name: string;
  invoice_number: string;
  invoice_date?: string; // optional, format: YYYY-MM-DD
  due_date?: string; // optional, format: YYYY-MM-DD
  currency_code: string;
  amount: number | string;
}

const defaultRow: TransactionItem = {
  transaction_type: "",
  entity_name: "",
  counterparty_name: "",
  invoice_number: "",
  invoice_date: "",
  due_date: "",
  currency_code: "",
  amount: "",
};

export interface BulkCreateTransactionsResponse {
  success: boolean;
  error?: string;
}

const ManualEntryGrid: React.FC = () => {
  const { notify } = useNotification();

  const [rows, setRows] = useState<TransactionItem[]>([defaultRow]);
  const [entityOptions, setEntityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [currencyOptions, setCurrencyOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [allCounterparties, setAllCounterparties] = useState<
    { value: string; label: string; type: string }[]
  >([]);

  useEffect(() => {
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
          setEntityOptions(
            response.data.results.map((item) => ({
              value: item.entity_name,
              label: item.entity_name,
            }))
          );
        } else {
          setEntityOptions([]);
        }
      })
      .catch(() => setEntityOptions([]));
  }, []);

  useEffect(() => {
    nos
      .post<{
        results: { currency_code: string; decimal_place: number }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/currency/active-approved`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setCurrencyOptions(
            response.data.results.map((c) => ({
              value: c.currency_code,
              label: c.currency_code,
            }))
          );
        }
      })
      .catch(() => {
        setCurrencyOptions([]);
      });
  }, []);

  useEffect(() => {
    nos
      .post<{
        rows: { counterparty_name: string; counterparty_type: string }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/counterparty/approved-active`)
      .then((response) => {
        if (response.data.success && response.data.rows) {
          setAllCounterparties(
            response.data.rows.map((item) => ({
              value: item.counterparty_name,
              label: item.counterparty_name,
              type: item.counterparty_type, // "Vendor" or "Customer"
            }))
          );
        }
      })
      .catch(() => {
        setAllCounterparties([]);
      });
  }, []);

  const validateRows = () => {
    for (const row of rows) {
      if (!row.transaction_type) return false;
      if (!row.entity_name) return false;
      if (!row.counterparty_name) return false;
      if (!row.invoice_number) return false;
      if (!row.invoice_date) return false;
      if (new Date(row.invoice_date) > new Date()) return false;
      if (!row.due_date) return false;
      if (new Date(row.due_date) < new Date(row.invoice_date!)) return false;
      if (!row.amount || Number(row.amount) <= 0) return false;
      if (!row.currency_code) return false;
    }
    return true;
  };

  const handleReset = () => {
    setRows([defaultRow]);
  };

  const handleAddRow = () => {
    if (!validateRows()) {
      notify(
        "Please fill all fields correctly before adding a new row.",
        "warning"
      );
      return;
    }
    setRows([...rows, { ...defaultRow }]);
  };

  const handleInputChange = (
    idx: number,
    field: keyof TransactionItem,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const payload = {
      rows: rows.map((row) => ({
        ...row,
        transaction_type: row.transaction_type
          ? row.transaction_type.toUpperCase().replace(/S$/, "") // "Payables" -> "PAYABLE"
          : "",
        amount: Number(row.amount) || 0,
      })),
    };

    try {
      const response = await nos.post<BulkCreateTransactionsResponse>(
        `${apiBaseUrl}/cash/transactions/create`,
        payload
      );
      if (response.data.success) {
        notify("Transactions created successfully", "success");
        handleReset();
      } else {
        notify(response.data.error || "Error saving transactions", "error");
      }
    } catch (error) {
      console.error("API Error:", error);
      notify("Error saving transactions", "error");
    }
  };

  const transactionTypeOptions = transactionTypes.map((t) => ({
    value: t,
    label: t,
  }));

  const columns = useMemo<ColumnDef<TransactionItem>[]>(
    () => [
      {
        accessorKey: "transaction_type",
        header: "Type",
        cell: ({ row }: any) => (
          <CustomSelect
            label=""
            options={transactionTypeOptions}
            selectedValue={row.original.transaction_type}
            onChange={(value) =>
              handleInputChange(row.index, "transaction_type", value)
            }
            placeholder="Select type"
            isClearable
            isSearchable
          />
        ),
      },
      {
        accessorKey: "entity_name",
        header: "Entity",
        cell: ({ row }: any) => (
          <CustomSelect
            label=""
            options={entityOptions}
            selectedValue={row.original.entity_name}
            onChange={(value) =>
              handleInputChange(row.index, "entity_name", value)
            }
            placeholder="Select entity"
            isClearable
            isSearchable
          />
        ),
      },
      {
        accessorKey: "counterparty_name",
        header: "Customer/Vendor",
        cell: ({ row }) => {
          // Filter options based on transaction_type
          const type = row.original.transaction_type;
          let filteredOptions = [];
          if (type === "Payables") {
            filteredOptions = allCounterparties.filter(
              (c) => c.type === "Vendor"
            );
          } else if (type === "Receivables") {
            filteredOptions = allCounterparties.filter(
              (c) => c.type === "Customer"
            );
          } else {
            filteredOptions = [];
          }
          return (
            <CustomSelect
              label=""
              options={filteredOptions}
              selectedValue={row.original.counterparty_name}
              onChange={(value) =>
                handleInputChange(row.index, "counterparty_name", value)
              }
              placeholder={
                type === "Receivables"
                  ? "Enter customer name"
                  : "Enter vendor name"
              }
              isClearable
              isSearchable
            />
          );
        },
      },
      {
        accessorKey: "invoice_number",
        header: "Invoice",
        cell: ({ row }: any) => (
          <input
            type="text"
            defaultValue={row.original.invoice_number}
            onBlur={(e) =>
              handleInputChange(row.index, "invoice_number", e.target.value)
            }
            className="border rounded px-2 py-1 w-full h-[37px]"
            placeholder="Invoice Number"
          />
        ),
      },
      {
        accessorKey: "invoice_date",
        header: "Invoice Date",
        cell: ({ row }: any) => {
          const today = new Date().toISOString().split("T")[0];
          return (
            <input
              type="date"
              value={row.original.invoice_date}
              max={today}
              onChange={(e) =>
                handleInputChange(row.index, "invoice_date", e.target.value)
              }
              className="border rounded px-2 py-1 w-full h-[37px]"
            />
          );
        },
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }: any) => (
          <input
            type="date"
            value={row.original.due_date}
            onChange={(e) =>
              handleInputChange(row.index, "due_date", e.target.value)
            }
            className="border rounded px-2 py-1 w-full h-[37px]"
          />
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }: any) => (
          <input
            type="number"
            defaultValue={row.original.amount}
            onBlur={(e) =>
              handleInputChange(row.index, "amount", e.target.value)
            }
            className="border rounded px-2 py-1 w-full h-[36px]"
            min="0"
            step="any"
          />
        ),
      },
      {
        accessorKey: "currency_code",
        header: "Currency",
        cell: ({ row }: any) => (
          <CustomSelect
            label=""
            options={currencyOptions}
            selectedValue={row.original.currency_code}
            onChange={(value) =>
              handleInputChange(row.index, "currency_code", value)
            }
            placeholder="Select currency"
            isClearable
            isSearchable
          />
        ),
      },
      {
        id: "actions",
        header: "actions",
        cell: ({ row }: any) => (
          <button
            type="button"
            onClick={() => handleRemoveRow(row.index)}
            className="text-red-500 hover:bg-red-50 rounded p-1"
            title="Remove row"
          >
            <Trash2 size={18} />
          </button>
        ),
        size: 40,
      },
    ],
    [rows, allCounterparties]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="flex items-center justify-end py-3 gap-x-4 gap-2">
        <div>
          <Button onClick={handleSave}>Save Manual Entries</Button>
        </div>
        <div>
          <Button onClick={handleReset} color="Fade">
            Reset
          </Button>
        </div>
      </div>

      <GridMasterOSTable<TransactionItem> table={table} />

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

export default ManualEntryGrid;
