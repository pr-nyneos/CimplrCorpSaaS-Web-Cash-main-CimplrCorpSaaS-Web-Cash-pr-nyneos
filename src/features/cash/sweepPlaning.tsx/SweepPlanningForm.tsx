import { useForm } from "react-hook-form";
// import axios from "axios";
// import Layout from "../../../components/layout/Layout.tsx";
import Button from "../../../components/ui/Button.tsx";
import { SquarePen } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import GridMasterOSTable from "../../../components/table/GridMasterOSTable.tsx";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import nos from "../../../utils/nos.tsx";

// Add this type for the bank API response
type GetBankNamesWithIDResponse = {
  results: { bank_id: string; bank_name: string }[];
  success: boolean;
  error?: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type sweepConfigurationData = {
  entity_name: string;
  bank_name: string;
  bank_account: string;
  sweep_type: string;
  parent_account: string;
  buffer_amount: number | null;
  frequency: string;
  cutoff_time: string;
  auto_sweep: string;
  active_status: string;
};

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

export interface SweepConfigurationResponse {
  success: boolean;
  message: string;
  data: string | null; // sweep_id if success, or null if error
}

// Add this type for bank accounts
type BankAccount = {
  bank_name: string;
  account_no: string;
  // Add more fields if needed
};

function SweepPlanning() {
  // const navigate = useNavigate();

  const [editingRow, setEditingRow] = useState<sweepConfigurationData | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useNotification();

  // Add state for entity options
  const [entityOptions, setEntityOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Fetch entity options on mount
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue, // <-- add this
    formState: { errors, isValid },
  } = useForm({ mode: "onChange" });

  // Handle form submission
  const onSubmit = async (values: sweepConfigurationData) => {
    setIsSubmitting(true);
    try {
      values.buffer_amount = Number(values.buffer_amount);
      values.active_status = "Active";

      // Example API call, adjust endpoint and payload as needed
      const response = await nos.post<SweepConfigurationResponse>(
        `${apiBaseUrl}/cash/sweep-config/create`,
        values,

        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = response.data;
      if ("success" in data && data.success) {
        notify("Sweep configuration saved successfully", "success");
        reset();
      } else {
        notify("Error saving data", "error");
      }
    } catch (error) {
      notify("Error saving data", "error");
    }
    setIsSubmitting(false);
  };

  const bankAccountOptions = [
    { value: "acc1", label: "Account 1" },
    { value: "acc2", label: "Account 2" },
  ];

  // const sweepType = watch("sweepType");

  // New state for bank options
  const [bankOptions, setBankOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Fetch bank options on mount
  useEffect(() => {
    setLoading(true);
    nos
      .post<GetBankNamesWithIDResponse>(`${apiBaseUrl}/master/bank/names`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setBankOptions([
            { value: "", label: "Choose..." },
            ...response.data.results.map((item) => ({
              value: item.bank_name,
              label: item.bank_name,
            })),
          ]);
        } else {
          notify(response.data.error || "Failed to fetch banks", "error");
          setBankOptions([{ value: "", label: "Choose..." }]);
        }
        setLoading(false);
      })
      .catch(() => {
        notify("Network error. Please try again.", "error");
        setBankOptions([{ value: "", label: "Choose..." }]);
        setLoading(false);
      });
  }, []);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<BankAccount[]>([]);

  // Fetch all bank accounts on mount
  useEffect(() => {
    nos
      .post<{ success: boolean; rows: BankAccount[] }>(
        `${apiBaseUrl}/master/bankaccount/pre-populate`
      )
      .then((res) => {
        if (res.data?.success) {
          setBankAccounts(res.data.rows);
        }
      })
      .catch(() => {});
  }, []);

  // Filter accounts when bank changes
  useEffect(() => {
    const selectedBank = watch("bank_name");
    if (selectedBank) {
      setFilteredAccounts(
        bankAccounts.filter((acc) => acc.bank_name === selectedBank)
      );
      setValue("bank_account", "");
      setValue("parent_account", "");
    } else {
      setFilteredAccounts([]);
      setValue("bank_account", "");
      setValue("parent_account", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("bank_name"), bankAccounts]);

  return (
    <>
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
              selectedValue={watch("entity_name")}
              onChange={(value) =>
                setValue("entity_name", value, { shouldValidate: true })
              }
              placeholder="Select entity..."
              isRequired={true}
            />
            {typeof errors?.entity_name?.message === "string" && (
              <p className="text-red-500 text-sm mt-1">
                {errors.entity_name.message}
              </p>
            )}

            <CustomSelect
              label="Bank"
              options={bankOptions}
              selectedValue={watch("bank_name")}
              onChange={(value) =>
                setValue("bank_name", value, { shouldValidate: true })
              }
              placeholder="Select bank..."
              isRequired={true}
            />
            {typeof errors?.bank_name?.message === "string" && (
              <p className="text-red-500 text-sm mt-1">
                {errors.bank_name.message}
              </p>
            )}

            <CustomSelect
              label="Bank Account"
              options={[
                { value: "", label: "Choose..." },
                ...filteredAccounts.map((acc) => ({
                  value: acc.account_no,
                  label: acc.account_no,
                })),
              ]}
              selectedValue={watch("bank_account")}
              onChange={(value) =>
                setValue("bank_account", value, { shouldValidate: true })
              }
              placeholder="Select bank account..."
              isRequired={true}
            />
            {typeof errors?.bank_account?.message === "string" && (
              <p className="text-red-500 text-sm mt-1">
                {errors.bank_account.message}
              </p>
            )}

            <CustomSelect
              label="Sweep Type"
              options={[{ value: "", label: "Choose..." }, ...sweepTypeOptions]}
              selectedValue={watch("sweep_type")}
              onChange={(value) =>
                setValue("sweep_type", value, { shouldValidate: true })
              }
              placeholder="Select sweep type..."
              isRequired={true}
            />
            {typeof errors?.sweep_type?.message === "string" && (
              <p className="text-red-500 text-sm mt-1">
                {errors.sweep_type.message}
              </p>
            )}

            <CustomSelect
              label="Parent Account"
              options={[
                { value: "", label: "Choose..." },
                ...filteredAccounts.map((acc) => ({
                  value: acc.account_no,
                  label: acc.account_no,
                })),
              ]}
              selectedValue={watch("parent_account")}
              onChange={(value) =>
                setValue("parent_account", value, { shouldValidate: true })
              }
              placeholder="Select parent account..."
              // isRequired={sweepType !== "standalone"}
            />
            {typeof errors?.parent_account?.message === "string" && (
              <p className="text-red-500 text-sm mt-1">
                {errors.parent_account.message}
              </p>
            )}

            <InputGroup
              label="Buffer Amount"
              name="buffer_amount"
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
              options={[
                { value: "", label: "Choose..." },
                ...sweepFrequencyOptions,
              ]}
              selectedValue={watch("frequency")}
              onChange={(value) =>
                setValue("frequency", value, { shouldValidate: true })
              }
              placeholder="Select sweep frequency..."
              isRequired={true}
            />
            {typeof errors?.frequency?.message === "string" && (
              <p className="text-red-500 text-sm mt-1">
                {errors.frequency.message}
              </p>
            )}

            <InputGroup
              label="Cutoff Time"
              name="cutoff_time"
              type="time"
              register={register}
              required
              errors={errors}
            />

            <CustomSelect
              label="Auto Sweep"
              options={[{ value: "", label: "Choose..." }, ...yesNoOptions]}
              selectedValue={watch("auto_sweep")}
              onChange={(value) =>
                setValue("auto_sweep", value, { shouldValidate: true })
              }
              placeholder="Select auto sweep..."
              isRequired={true}
            />
            {typeof errors?.auto_sweep?.message === "string" && (
              <p className="text-red-500 text-sm mt-1">
                {errors.auto_sweep.message}
              </p>
            )}

            <div className="col-span-3 flex justify-end">
              <div className="flex gap-3">
                <div>
                  <Button
                    type="submit"
                    color={isValid ? "Green" : "Disable"}
                    disabled={!isValid || isSubmitting}
                  >
                    {editingRow
                      ? "Update Sweep Setup"
                      : isSubmitting
                      ? "Saving..."
                      : "Save Sweep Setup"}
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
      </div>
    </>
  );
}

export default SweepPlanning;