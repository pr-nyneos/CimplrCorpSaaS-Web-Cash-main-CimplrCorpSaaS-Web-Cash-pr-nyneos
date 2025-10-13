import { useForm } from "react-hook-form";
// import axios from "axios";
import Layout from "../../../components/layout/Layout";
import Button from "../../../components/ui/Button";
import { SquarePen } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GridMasterOSTable from "../../../components/table/GridMasterOSTable";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";

const InputGroup = ({
  label,
  name,
  register,
  required = false,
  type = "text",
  placeholder,
  maxLength,
  errors,
  pattern,
}: any) => (
  <div>
    <label className="text-secondary-text">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type={type}
      maxLength={maxLength}
      {...register(name, {
        required: required ? `${label} is required` : false,
        maxLength: maxLength
          ? { value: maxLength, message: `Max ${maxLength} characters` }
          : undefined,
        pattern: pattern,
      })}
      className="w-full p-2 border border-border bg-secondary-color-lt text-secondary-text outline-none rounded"
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
    />
    {errors?.[name] && (
      <p className="text-red-500 text-sm mt-1">{errors[name]?.message}</p>
    )}
  </div>
);


type sweepConfigurationData = {
  entity: string;
  bank: string;
  bankAccount: string;
  sweepType: string;
  parentAccount: string;
  bufferAmount: string;
  sweepFrequency: string;
  cutoffTime: string;
  autoSweep: string;
  status: string;
  index?: number;
};

function SweepPlanning() {
  const navigate = useNavigate();
  const [data, setData] = useState<sweepConfigurationData[]>([
    {
      entity: "entity1",
      bank: "bank1",
      bankAccount: "acc1",
      sweepType: "zero-balance",
      parentAccount: "acc2",
      bufferAmount: "10000",
      sweepFrequency: "daily",
      cutoffTime: "09:00",
      autoSweep: "yes",
      status: "Active",
    },
  ]);
  const [editingRow, setEditingRow] = useState<sweepConfigurationData | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm({ mode: "onChange" });

  const handleEdit = (row: sweepConfigurationData, index: number) => {
    reset(row); 
    setEditingRow({ ...row, index }); 
  };

  // Handle form submission
  const onSubmit = (formData: any) => {
    if (editingRow) {
      setData((prev) =>
        prev.map((row, idx) =>
          idx === editingRow.index ? { ...formData, status: row.status } : row
        )
      );
      setEditingRow(null);
      // Reset with empty values to clear the form
      reset({
        entity: "",
        bank: "",
        bankAccount: "",
        sweepType: "",
        parentAccount: "",
        bufferAmount: "",
        sweepFrequency: "",
        cutoffTime: "",
        autoSweep: "",
      });
    } else {
      setData((prev) => [...prev, { ...formData, status: "Active" }]);
      reset();
    }
  };

  const entityOptions = [
    { value: "entity1", label: "Entity 1" },
    { value: "entity2", label: "Entity 2" },
  ];

  const bankOptions = [
    { value: "bank1", label: "Bank A" },
    { value: "bank2", label: "Bank B" },
  ];

  const bankAccountOptions = [
    { value: "acc1", label: "Account 1" },
    { value: "acc2", label: "Account 2" },
  ];

  const sweepTypeOptions = [
    { value: "zero-balance", label: "Zero Balance" },
    { value: "concentration", label: "Concentration" },
    { value: "target-balance", label: "Target Balance" },
    { value: "standalone", label: "Standalone" },
  ];

  const sweepFrequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const yesNoOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  const sweepType = watch("sweepType");

  const columns = useMemo<ColumnDef<sweepConfigurationData>[]>(
    () => [
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "bank",
        header: "Bank",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "bankAccount",
        header: "Bank Account",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "sweepType",
        header: "Sweep Type",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "parentAccount",
        header: "Parent Account",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "bufferAmount",
        header: "Buffer Amount",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "sweepFrequency",
        header: "Sweep Frequency",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "cutoffTime",
        header: "Cutoff Time",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "autoSweep",
        header: "Auto Sweep",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "actions",
        header: "Action",
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <button
              onClick={() => handleEdit(rowData, row.index)}
              className="p-1.5 hover:bg-primary-xl rounded transition-colors"
            >
              <SquarePen className="w-4 h-4 text-primary-lt" />
            </button>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Layout title="Sweep Planning" showButton={true} buttonText="Back" onButtonClick={() => navigate("/fund-availability")}>
      <div className="flex flex-col gap-6 justify-center">
        <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
          <h2 className="text-xl font-semibold text-secondary-text-dark">
            Define Sweep Configuration
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-3 gap-x-6 gap-y-4"
          >
            <input
              type="hidden"
              value="initiatecreateentity"
              {...register("processname")}
            />

            <CustomSelect
              label="Entity"
              options={[{ value: "", label: "Choose..." }, ...entityOptions]}
              selectedValue={watch("entity")}
              onChange={(value) => {
                reset({ ...watch(), entity: value });
              }}
              placeholder="Select entity..."
              isRequired={true}
            />
            {typeof errors?.entity?.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{errors.entity.message}</p>
            )}

            <CustomSelect
              label="Bank"
              options={[{ value: "", label: "Choose..." }, ...bankOptions]}
              selectedValue={watch("bank")}
              onChange={(value) => {
                reset({ ...watch(), bank: value });
              }}
              placeholder="Select bank..."
              isRequired={true}
            />
            {typeof errors?.bank?.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{errors.bank.message}</p>
            )}

            <CustomSelect
              label="Bank Account"
              options={[{ value: "", label: "Choose..." }, ...bankAccountOptions]}
              selectedValue={watch("bankAccount")}
              onChange={(value) => {
                reset({ ...watch(), bankAccount: value });
              }}
              placeholder="Select bank account..."
              isRequired={true}
            />
            {typeof errors?.bankAccount?.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{errors.bankAccount.message}</p>
            )}

            <CustomSelect
              label="Sweep Type"
              options={[{ value: "", label: "Choose..." }, ...sweepTypeOptions]}
              selectedValue={watch("sweepType")}
              onChange={(value) => {
                reset({ ...watch(), sweepType: value });
              }}
              placeholder="Select sweep type..."
              isRequired={true}
            />
            {typeof errors?.sweepType?.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{errors.sweepType.message}</p>
            )}

            <CustomSelect
              label="Parent Account"
              options={[{ value: "", label: "Choose..." }, ...bankAccountOptions]}
              selectedValue={watch("parentAccount")}
              onChange={(value) => {
                reset({ ...watch(), parentAccount: value });
              }}
              placeholder="Select parent account..."
              isRequired={sweepType !== "standalone"}
            />
            {typeof errors?.parentAccount?.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{errors.parentAccount.message}</p>
            )}

            <InputGroup
              label="Buffer Amount"
              name="bufferAmount"
              type="number"
              register={register}
              errors={errors}
              pattern={{
                value: /^[0-9]+$/,
                message: "Must be a positive number",
              }}
            />

            <CustomSelect
              label="Sweep Frequency"
              options={[{ value: "", label: "Choose..." }, ...sweepFrequencyOptions]}
              selectedValue={watch("sweepFrequency")}
              onChange={(value) => {
                reset({ ...watch(), sweepFrequency: value });
              }}
              placeholder="Select sweep frequency..."
              isRequired={true}
            />
            {typeof errors?.sweepFrequency?.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{errors.sweepFrequency.message}</p>
            )}

            <InputGroup
              label="Cutoff Time"
              name="cutoffTime"
              type="time"
              register={register}
              required
              errors={errors}
            />

            <CustomSelect
              label="Auto Sweep"
              options={[{ value: "", label: "Choose..." }, ...yesNoOptions]}
              selectedValue={watch("autoSweep")}
              onChange={(value) => {
                reset({ ...watch(), autoSweep: value });
              }}
              placeholder="Select auto sweep..."
              isRequired={true}
            />
            {typeof errors?.autoSweep?.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{errors.autoSweep.message}</p>
            )}

            <div className="col-span-3 flex justify-end">
              <div className="flex gap-3">
                <div>
                  <Button
                    type="submit"
                    color={isValid ? "Green" : "Disable"}
                    disabled={!isValid}
                  >
                    {editingRow ? "Update Sweep Setup" : "Save Sweep Setup"}
                  </Button>
                </div>
                <div>
                  <Button type="button" color="Fade" onClick={() => reset()}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
          <h2 className="text-xl font-semibold text-secondary-text-dark">
            Existing Sweep Configurations
          </h2>
          <GridMasterOSTable<sweepConfigurationData> table={table} />
        </div>
      </div>
    </Layout>
  );
}

export default SweepPlanning;
