import React from "react";
import { useForm } from "react-hook-form";
import Button from "../../../components/ui/Button";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import nos from "../../../utils/nos.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type BankStatementEntry = {
  entityid: string;
  account_number: string;
  statementdate: string;
  transactiondate: string;
  openingbalance?: number;
  closingbalance?: number;
  description?: string;
  status?: string;
  accountholdername?: string;
  branchname?: string;
  ifsccode?: string;
  statement_period?: string;
  chequerefno?: string;
  withdrawalamount?: number;
  depositamount?: number;
  modeoftransaction?: string;
};

type BankAccount = {
  account_number: string;
  bank_name?: string;
  [key: string]: any;
};

const statusOptions = ["Choose...", "Active", "Inactive"];
const modeOfTransactionOptions = [
  "Choose...",
  "Cash",
  "Cheque",
  "NEFT",
  "RTGS",
  "IMPS",
  "UPI",
  "Other",
];

const BankStatementForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch,
  } = useForm<BankStatementEntry>({ mode: "onChange" });

  const { notify } = useNotification();

  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Entity options state
  const [entityOptions, setEntityOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [entityLoading, setEntityLoading] = React.useState(false);

  // Fetch bank accounts
  React.useEffect(() => {
    setLoading(true);
    nos
      .post<any>(`${apiBaseUrl}/master/bankaccount/all`)
      .then((response) => {
        if (response.data.success && response.data.data) {
          setBankAccounts(response.data.data);
        } else {
          notify(
            response.data.error ? response.data.error : "Failed Loading Data",
            "error"
          );
        }
        setLoading(false);
      })
      .catch(() => {
        notify("Network error. Please try again.", "error");
        setLoading(false);
      });
  }, [notify]);

  // Fetch entity options
  React.useEffect(() => {
    setEntityLoading(true);
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
        setEntityLoading(false);
      })
      .catch(() => {
        setEntityOptions([]);
        setEntityLoading(false);
      });
  }, []);

  // Prepare options for CustomSelect
  const accountNumberOptions = [
    { value: "", label: "Choose..." },
    ...bankAccounts.map((acc) => ({
      value: acc.account_number,
      label: acc.account_number + (acc.bank_name ? ` - ${acc.bank_name}` : ""),
    })),
  ];

  // Set value for CustomSelect
  const selectedAccount = accountNumberOptions.find(
    (opt) => opt.value === watch("account_number")
  ) || null;

  const selectedEntity = entityOptions.find(
    (opt) => opt.value === watch("entityid")
  ) || null;

  const onSubmit = async (values: BankStatementEntry) => {
    try {
      values.openingbalance = Number(values.openingbalance);
      values.closingbalance = Number(values.closingbalance);
      values.withdrawalamount = Number(values.withdrawalamount);
      values.depositamount = Number(values.depositamount);
      const response = await nos.post<BankStatementEntry>(
        `${apiBaseUrl}/cash/bank-statements/create`,
        { rows: [values] },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = response.data;
      if ("success" in data && data.success) {
        notify("Bank details saved successfully", "success");
        reset();
      } else {
        notify("Error saving data", "error");
      }
    } catch (error) {
      notify("Error saving data", "error");
    }
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text-dark">
          Enter Bank Statement Details
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          <CustomSelect
            label="Entity ID"
            options={entityOptions}
            selectedValue={watch("entityid")}
            onChange={(value) =>
              setValue("entityid", value, { shouldValidate: true })
            }
            placeholder="Select entity..."
            isRequired={true}
          />
          {typeof errors?.entityid?.message === "string" && (
            <p className="text-red-500 text-sm mt-1 col-span-3">
              {errors.entityid.message}
            </p>
          )}

          <CustomSelect
            label="Account Number"
            options={accountNumberOptions}
            selectedValue={watch("account_number")}
            onChange={(value) =>
              setValue("account_number", value, { shouldValidate: true })
            }
            placeholder="Select account number..."
            isRequired={true}
          />
          {typeof errors?.account_number?.message === "string" && (
            <p className="text-red-500 text-sm mt-1 col-span-3">
              {errors.account_number.message}
            </p>
          )}

          <InputGroup
            label="Statement Date"
            name="statementdate"
            type="date"
            register={register("statementdate", {
              required: "Statement Date is required",
            })}
            required
            errors={errors}
          />

          <InputGroup
            label="Transaction Date"
            name="transactiondate"
            type="date"
            register={register("transactiondate", {
              required: "Transaction Date is required",
            })}
            required
            errors={errors}
          />

          <InputGroup
            label="Opening Balance"
            name="openingbalance"
            type="number"
            register={register("openingbalance")}
            errors={errors}
          />

          <InputGroup
            label="Closing Balance"
            name="closingbalance"
            type="number"
            register={register("closingbalance")}
            errors={errors}
          />

          <InputGroup
            label="Description"
            name="description"
            register={register("description", {
              maxLength: { value: 200, message: "Max 200 characters" },
            })}
            maxLength={200}
            errors={errors}
          />

          <DropdownGroup
            label="Status"
            name="status"
            options={statusOptions}
            register={register("status")}
            errors={errors}
          />

          <InputGroup
            label="Account Holder Name"
            name="accountholdername"
            register={register("accountholdername", {
              maxLength: { value: 100, message: "Max 100 characters" },
            })}
            maxLength={100}
            errors={errors}
          />

          <InputGroup
            label="Branch Name"
            name="branchname"
            register={register("branchname", {
              maxLength: { value: 100, message: "Max 100 characters" },
            })}
            maxLength={100}
            errors={errors}
          />

          <InputGroup
            label="IFSC Code"
            name="ifsccode"
            register={register("ifsccode", {
              maxLength: { value: 20, message: "Max 20 characters" },
            })}
            maxLength={20}
            errors={errors}
          />

          <InputGroup
            label="Statement Period"
            name="statement_period"
            register={register("statement_period", {
              maxLength: { value: 50, message: "Max 50 characters" },
            })}
            maxLength={50}
            errors={errors}
          />

          <InputGroup
            label="Cheque Ref No"
            name="chequerefno"
            register={register("chequerefno", {
              maxLength: { value: 30, message: "Max 30 characters" },
            })}
            maxLength={30}
            errors={errors}
          />

          <InputGroup
            label="Withdrawal Amount"
            name="withdrawalamount"
            type="number"
            register={register("withdrawalamount")}
            errors={errors}
          />

          <InputGroup
            label="Deposit Amount"
            name="depositamount"
            type="number"
            register={register("depositamount")}
            errors={errors}
          />

          <DropdownGroup
            label="Mode of Transaction"
            name="modeoftransaction"
            options={modeOfTransactionOptions}
            register={register("modeoftransaction")}
            errors={errors}
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
      </div>
    </div>
  );
};

export default BankStatementForm;
