import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import Button from "../../../components/ui/Button";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import type { BankBalance } from "../../../types/cashType";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import { CURRENCY_DATA } from "../../../constant/constants";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type BankAccount = {
  account_no: string;
  bank_name: string;
  currency_code: string;
  iban: string;
  nickname: string;
};

type APIResponse = {
  rows: BankAccount[];
  success: boolean;
};

const BankBalanceForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BankBalance>({ mode: "onChange" });

  const { notify } = useNotification();
  const onSubmit = async (values: BankBalance) => {
    try {
      // Ensure numeric fields are numbers and default to 0 if empty or invalid
      const payload = {
        ...values,
        bank_name: selectedBank || "",
        account_no: selectedAccountNumber || "",
        balance_amount: Number(values.balance_amount) || 0,
        opening_balance: Number(values.opening_balance) || 0,
        total_credits: Number(values.total_credits) || 0,
        total_debits: Number(values.total_debits) || 0,
        closing_balance: Number(values.closing_balance) || 0,
      };

      const response = await nos.post<BankBalance>(
        `${apiBaseUrl}/cash/bank-balances/create`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = response.data;
      if ("success" in data && data.success) {
        notify("Bank details saved successfully", "success");
        reset();
        setSelectedBank("");
        setSelectedAccountNumber("");
        setSelectedCountry("");
      } else {
        notify("Error saving data", "error");
      }
    } catch (error) {
      // Handle the error by logging it for debugging
      console.error("Error saving bank balance:", error);
      notify("Error saving data", "error");
    }
  };

  // State for pre-populated bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedAccountNumber, setSelectedAccountNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  // Fetch all bank accounts on mount
  useEffect(() => {
    nos
      .post<APIResponse>(`${apiBaseUrl}/master/bankaccount/pre-populate`)
      .then((res) => {
        if (res.data?.success) {
          setBankAccounts(res.data.rows);
          // Set default selected bank and account number if available
          if (res.data.rows.length > 0) {
            setSelectedBank(res.data.rows[0].bank_name);
            setSelectedAccountNumber(res.data.rows[0].account_no);
          }
        }
      })
      .catch(() => {});
  }, []);

  // When bank changes, filter account numbers for that bank
  useEffect(() => {
    if (selectedBank) {
      const filtered = bankAccounts.filter(
        (acc) => acc.bank_name === selectedBank
      );
      setFilteredAccounts(filtered);
      setSelectedAccountNumber("");
      setValue("currency_code", "");
      setValue("iban", "");
      setValue("nickname", "");
    } else {
      setFilteredAccounts([]);
      setSelectedAccountNumber("");
      setValue("currency_code", "");
      setValue("iban", "");
      setValue("nickname", "");
    }
  }, [selectedBank, bankAccounts, setValue]);

  // When account number changes, auto-populate fields
  useEffect(() => {
    if (selectedAccountNumber) {
      const acc = filteredAccounts.find(
        (a) => a.account_no === selectedAccountNumber
      );
      if (acc) {
        setValue("currency_code", acc.currency_code || "");
        setValue("iban", acc.iban || "");
        setValue("nickname", acc.nickname || "");
      }
    }
  }, [selectedAccountNumber, filteredAccounts, setValue]);

  // Prepare options for selects
  const bankOptions = [
    ...Array.from(new Set(bankAccounts.map((b) => b.bank_name))),
  ].map((name) => ({ label: name, value: name }));

  const accountNumberOptions = filteredAccounts.map((acc) => ({
    label: acc.account_no,
    value: acc.account_no,
  }));

  // Replace these arrays:
  const balanceTypeOptions = ["Ledger", "Available"];
  const statementTypeOptions = [
    "Manual",
    "MT940",
    "MT942",
    "CAMT.053",
    "CAMT.052",
    "BAI2",
    "CSV",
  ];
  const sourceChannelOptions = [
    "None",
    "Direct API",
    "H2H - SFTP",
    "H2H - EBICS",
    "SWIFT SCORE",
    "Bank Portal",
  ];

  // Set default as_of_time to current IST time on mount
  useEffect(() => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(
      now.getTime() + istOffset - now.getTimezoneOffset() * 60000
    );
    const hours = String(ist.getHours()).padStart(2, "0");
    const minutes = String(ist.getMinutes()).padStart(2, "0");
    setValue("as_of_time", `${hours}:${minutes}`);
  }, [setValue]);

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text-dark">
          Enter Bank Balance Details
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          {/* Bank Name as CustomSelect */}
          <CustomSelect
            label="Bank Name"
            options={bankOptions}
            selectedValue={selectedBank}
            onChange={(value) => setSelectedBank(value)}
            placeholder="Select bank"
            isRequired={true}
          />
          {/* Account Number as CustomSelect */}
          <CustomSelect
            label="Account Number"
            options={accountNumberOptions}
            selectedValue={selectedAccountNumber}
            onChange={(value) => setSelectedAccountNumber(value)}
            placeholder="Select account number"
            isRequired={true}
            isDisabled={!selectedBank}
          />
          {/* Currency */}
          <InputGroup
            label="Currency"
            name="currency_code"
            register={register}
            required
            placeholder="Auto Populated"
            errors={errors}
            maxLength={10}
            disabled
          />
          {/* Country as CustomSelect */}
          <CustomSelect
            label="Country"
            options={[
              { value: "", label: "Choose country..." },
              ...CURRENCY_DATA.map((c) => ({
                value: c.country,
                label: c.country,
              })),
            ]}
            selectedValue={selectedCountry}
            onChange={(value) => {
              setSelectedCountry(value);
              setValue("country", value);
            }}
            placeholder="Select country..."
            isRequired={true}
          />
          {/* IBAN */}
          <InputGroup
            label="IBAN"
            name="iban"
            placeholder="Auto Populated"
            register={register}
            errors={errors}
            maxLength={34}
            disabled
          />
          {/* Nickname */}
          <InputGroup
            label="Nickname"
            name="nickname"
            placeholder="Auto Populated"
            register={register}
            errors={errors}
            maxLength={50}
          //   disabled
          />
          <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3">
            Balance & Context
          </h2>
          <div className="col-span-3">
            <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-4 gap-4">
              {/* As-of Date */}
              <InputGroup
                label="As-of Date"
                name="as_of_date"
                type="date"
                register={register}
                required
                errors={errors}
              />
              {/* As-of Time */}
              <InputGroup
                label="As-of Time"
                name="as_of_time"
                type="time"
                register={register}
                required
                errors={errors}
              />
              
              {/* Balance Type */}
              <DropdownGroup
                label="Balance Type"
                name="balance_type"
                options={balanceTypeOptions}
                register={register}
                required
                errors={errors}
              />
              {/* Balance Amount */}
              <InputGroup
                label="Balance Amount"
                name="balance_amount"
                type="number"
                register={register}
                required
              //   errors={errors}
              />
              {/* Statement Type */}
              <DropdownGroup
                label="Statement Type"
                name="statement_type"
                options={statementTypeOptions}
                register={register}
                errors={errors}
              />
              {/* Source Channel */}
              <DropdownGroup
                label="Source Channel"
                name="source_channel"
                options={sourceChannelOptions}
                register={register}
                errors={errors}
              />
              {/* Opening Balance (opt) */}
              <InputGroup
                label="Opening Balance (opt)"
                name="opening_balance"
                type="number"
                register={register}
                errors={errors}
              />
              {/* Total Credits (opt) */}
              <InputGroup
                label="Total Credits (opt)"
                name="total_credits"
                type="number"
                register={register}
                errors={errors}
              />
              {/* Total Debits (opt) */}
              <InputGroup
                label="Total Debits (opt)"
                name="total_debits"
                type="number"
                register={register}
                errors={errors}
              />
              {/* Closing Balance (opt) */}
              <InputGroup
                label="Closing Balance (opt)"
                name="closing_balance"
                type="number"
                register={register}
                errors={errors}
              />
            </div>
          </div>
          <div className="col-span-3 flex justify-end">
            <div className="flex gap-3">
              <div>
                <Button type="submit">Save Bank Balance</Button>
              </div>
              <div>
                <Button type="button" color="Fade" onClick={() => reset()}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default BankBalanceForm;
