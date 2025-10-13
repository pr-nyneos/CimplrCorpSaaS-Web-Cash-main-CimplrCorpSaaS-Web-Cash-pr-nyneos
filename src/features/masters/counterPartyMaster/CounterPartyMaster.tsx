import React from "react";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";

import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import GridMasterOSTable from "../GridMasterOSTable";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import type { ManualEntryAPIResponse } from "../../../types/type.ts";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";

import nos from "../../../utils/nos.tsx";
// import { set } from "date-fns";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type CounterpartyMasterFormValue = {
  input_method: string;
  counterparty_name: string;
  counterparty_code: string;
  counterparty_type: string;
  address: string;
  status: string;
  country?: string;
  contact?: string;
  email?: string;
  eff_from?: string;
  eff_to?: string;
  tags?: string;
};

export interface BankRequest {
  bank?: string;
  country: string;
  branch?: string;
  account?: string;
  swift?: string;
  rel?: string;
  currency: string;
  category?: string;
  status?: string;
}

const counterpartyTypeOptions = ["Customer", "Vendor", "Bank", "Other"];
const relationshipOptions = ["Current", "Saving", "CC", "OD"];
const countryOptions = ["IN", "US", "UK"];
const statusOptions = ["Active", "Inactive"];

const Form: React.FC = () => {
  const [, setIsSubmitting] = React.useState(false);
  const [banks, setBanks] = React.useState<BankRequest[]>([]);
  const [cashFlowCategoryOptions, setCashFlowCategoryOptions] = React.useState<
    { value: string; label: string }[]
  >([]);
  const [bankNameOptions, setBankNameOptions] = React.useState<
    { value: string; label: string }[]
  >([]);
  const [, setCurrencyOptions] = React.useState<
    { label: string; value: string }[]
  >([]);
  const {notify} = useNotification();

  React.useEffect(() => {
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
          setCashFlowCategoryOptions(
            response.data.categories.map((cat) => ({
              value: cat.category_name,
              label: cat.category_name,
            }))
          );
        } else {
          setCashFlowCategoryOptions([]);
        }
      })
      .catch(() => {
        setCashFlowCategoryOptions([]);
      });

    nos
      .post<{
        success: boolean;
        results: {
          bank_id: string;
          bank_name: string;
          bank_short_name: string;
        }[];
      }>(`${apiBaseUrl}/master/bank/names`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setBankNameOptions(
            response.data.results.map((bank) => ({
              value: bank.bank_name,
              label: bank.bank_name,
            }))
          );
        } else {
          setBankNameOptions([]);
        }
      })
      .catch(() => {
        setBankNameOptions([]);
      });

    nos
      .post<{ results: { currency_code: string; decimal_place: number }[] }>(
        `${apiBaseUrl}/master/currency/active-approved`
      )
      .then((response) => {
        if (response.data.results) {
          setCurrencyOptions(
            response.data.results.map((cur) => ({
              label: cur.currency_code,
              value: cur.currency_code,
            }))
          );
        } else {
          setCurrencyOptions([]);
        }
      })
      .catch(() => setCurrencyOptions([]));
  }, []);

  const handleAddBankRow = () => {
    setBanks([
      ...banks,
      {
        bank: "",
        country: "",
        branch: "",
        account: "",
        swift: "",
        rel: "",
        currency: "",
        category: "",
        status: "",
      } as BankRequest,
    ]);
  };

  const handleBankInputChange = (
    idx: number,
    field: keyof BankRequest,
    value: any
  ) => {
    setBanks((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        return { ...row, [field]: value };
      })
    );
  };

  const handleRemoveRow = (idx: number) => {
    setBanks((prev) => prev.filter((_, i) => i !== idx));
  };

  const bankColumns = React.useMemo(
    () => [
      {
        accessorKey: "bank",
        header: "Bank Name",
        cell: ({ row }: any) => (
          <CustomSelect
            options={bankNameOptions}
            selectedValue={row.original.bank || ""}
            onChange={(value: string) =>
              handleBankInputChange(row.index, "bank", value)
            }
            placeholder="Select bank"
            isClearable={false}
          />
        ),
      },
      {
        accessorKey: "country",
        header: "Country",
        cell: ({ row }: any) => (
          <CustomSelect
            options={countryOptions.map((c) => ({ value: c, label: c }))}
            selectedValue={row.original.country || ""}
            onChange={(value: string) =>
              handleBankInputChange(row.index, "country", value)
            }
            placeholder="Select country"
            isClearable={false}
          />
        ),
      },
      {
        accessorKey: "branch",
        header: "Branch",
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = React.useState(
            row.original.branch || ""
          );
          const commitValue = () =>
            handleBankInputChange(row.index, "branch", localValue);
          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              commitValue();
              (e.target as HTMLInputElement).blur();
            }
          };
          return (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={commitValue}
              onKeyDown={handleKeyDown}
              className="border rounded px-2 py-1 w-full focus:outline-none h-[37px]"
            />
          );
        },
      },
      {
        accessorKey: "account",
        header: "Account",
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = React.useState(
            row.original.account || ""
          );
          const commitValue = () =>
            handleBankInputChange(row.index, "account", localValue);
          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              commitValue();
              (e.target as HTMLInputElement).blur();
            }
          };
          return (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={commitValue}
              onKeyDown={handleKeyDown}
              className="border rounded px-2 py-1 w-full focus:outline-none h-[37px]"
            />
          );
        },
      },
      {
        accessorKey: "swift",
        header: "Swift",
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = React.useState(
            row.original.swift || ""
          );
          const commitValue = () =>
            handleBankInputChange(row.index, "swift", localValue);
          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              commitValue();
              (e.target as HTMLInputElement).blur();
            }
          };
          return (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={commitValue}
              onKeyDown={handleKeyDown}
              className="border rounded px-2 py-1 w-full focus:outline-none h-[37px]"
            />
          );
        },
      },
      {
        accessorKey: "rel",
        header: "Relationship",
        cell: ({ row }: any) => (
          <select
            value={row.original.rel || ""}
            onChange={(e) =>
              handleBankInputChange(row.index, "rel", e.target.value)
            }
            className="border rounded px-2 py-1 w-full h-[37px]"
          >
            <option value="" hidden>
              Choose...
            </option>
            {relationshipOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ),
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ row }: any) => {
          const [localValue, setLocalValue] = React.useState(
            row.original.currency || ""
          );
          const commitValue = () =>
            handleBankInputChange(
              row.index,
              "currency",
              localValue.toUpperCase()
            );
          const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              commitValue();
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
              className="border rounded px-2 py-1 w-full uppercase focus:outline-none h-[37px]"
            />
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }: any) => (
          <CustomSelect
            options={cashFlowCategoryOptions}
            selectedValue={row.original.category || ""}
            onChange={(value: string) =>
              handleBankInputChange(row.index, "category", value)
            }
            placeholder="Select category"
            isClearable={false}
          />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <select
            value={row.original.status || ""}
            onChange={(e) =>
              handleBankInputChange(row.index, "status", e.target.value)
            }
            className="border rounded px-2 py-1 w-full h-[37px]"
          >
            <option value="" hidden>
              Choose...
            </option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
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
            <X size={18} />
          </button>
        ),
        enableSorting: false,
      },
    ],
    [banks]
  );

  const isBankRowComplete = (row: BankRequest) => {
    return (
      row.bank &&
      row.country &&
      row.branch &&
      row.account &&
      row.swift &&
      row.rel &&
      row.currency &&
      row.category &&
      row.status
    );
  };

  const table = useReactTable({
    data: banks,
    columns: bankColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CounterpartyMasterFormValue>();

  const onSubmit = async (values: CounterpartyMasterFormValue) => {
    setIsSubmitting(true);
    try {
      const payload = [
        {
          ...values,
          input_method: "Manual",
          banks,
        },
      ];

      const response = await nos.post<ManualEntryAPIResponse>(
        `${apiBaseUrl}/master/v2/counterparty/create`,
        { rows: payload },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = response.data;
      if (data.rows[0].success) {
        notify("Counterparty details saved successfully", "success");
        setBanks([]);
      } else {
        const error = data.rows[0].error;
        notify(`Error saving data: ${error}`, "error");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      notify("Error saving data", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text-dark">
          Enter Counterparty Master Details
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          <InputGroup
            label="Counterparty Code"
            name="counterparty_code"
            register={register}
            required
            errors={errors}
            placeholder="Enter unique code"
            maxLength={50}
          />
          <InputGroup
            label="Counterparty Name"
            name="counterparty_name"
            register={register}
            required
            errors={errors}
            placeholder="Enter counterparty name"
            maxLength={50}
          />
          <DropdownGroup
            label="Counterparty Type"
            name="counterparty_type"
            options={counterpartyTypeOptions}
            register={register}
            required
            errors={errors}
          />
          <InputGroup
            label="Address"
            name="address"
            register={register}
            required
            errors={errors}
            placeholder="Enter address"
            maxLength={200}
          />
          <DropdownGroup
            label="Country"
            name="country"
            options={countryOptions}
            register={register}
            required
            errors={errors}
          />

          <InputGroup
            label="Contact"
            name="contact"
            register={register}
            errors={errors}
            placeholder="Enter contact"
            maxLength={50}
          />
          <InputGroup
            label="Email"
            name="email"
            register={register}
            errors={errors}
            placeholder="Enter email"
            maxLength={100}
          />
          <div className="flex gap-2">
            <InputGroup
              label="Effective From"
              name="eff_from"
              register={register}
              errors={errors}
              placeholder="YYYY-MM-DD"
              type="date"
            />
            <InputGroup
              label="Effective To"
              name="eff_to"
              register={register}
              errors={errors}
              placeholder="YYYY-MM-DD"
              type="date"
            />
          </div>
          <DropdownGroup
            label="Status"
            name="status"
            options={statusOptions}
            register={register}
            required
            errors={errors}
          />

          <InputGroup
            label="Tags"
            name="tags"
            register={register}
            errors={errors}
            placeholder="Enter tags"
            maxLength={100}
          />

          <div className="col-span-3 flex justify-end">
            <div className="flex gap-3">
              <Button type="submit">Save</Button>
              <Button type="button" color="Fade" onClick={() => reset()}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
        <GridMasterOSTable<BankRequest> table={table} />

        <div className="mt-4">
          <button
            onClick={handleAddBankRow}
            className="px-6 py-2 bg-primary text-white rounded font-semibold disabled:opacity-50"
            disabled={
              banks.length > 0 && !isBankRowComplete(banks[banks.length - 1])
            }
          >
            Add Row
          </button>
        </div>
      </div>
    </div>
  );
};

export default Form;
