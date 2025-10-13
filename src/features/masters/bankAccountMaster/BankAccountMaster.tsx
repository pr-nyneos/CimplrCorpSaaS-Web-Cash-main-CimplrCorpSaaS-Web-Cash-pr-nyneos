import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Button from "../../../components/ui/Button";
import { useState } from "react";
import { UserRoundCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";

import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import nos from "../../../utils/nos.tsx";
import LoadingSpinner from "../../../components/layout/LoadingSpinner.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type BankItem = {
  bank_id: string;
  bank_name: string;
  bank_short_name: string | null;
};

type GetBankNamesWithIDResponse = {
  success: boolean;
  results?: BankItem[];
  error?: string;
};

type ClearingCode = {
  code_type: string;
  code_value: string;
  
};

export type EntityResult = {
  entity_id: string;
  entity_name: string;
  entity_short_name: string;
};

export type EntityListResponse = {
  results: EntityResult[];
  success: boolean;
  error?: string;
};

type BankAccountMasterRequest = {
  user_id: string;
  bank_id: string;
  entity_id: string;
  account_number: string;
  account_nickname?: string | null;
  account_type: string;
  credit_limit?: number | null;
  account_currency: string;
  iban?: string | null;
  // entity_name?: string;
  branch_name?: string | null;
  branch_address?: string | null;
  account_status: string;
  clearing_codes?: ClearingCode[];
};

const accountTypes = [
  "Choose...",
  "Current",
  "Savings",
  "Overdraft",
  "Loan",
  "Cash Credit",
];
const accountStatusOptions = ["Choose...", "Active", "Inactive", "Closed"];
const clearingCodeTypes = ["Choose...", "IFSC", "ABA Routing", "SWIFT/BIC"];
const currencies = ["Choose...", "INR", "USD", "GBP", "EUR"];

const DropdownGroupWithButton = ({
  label,
  name,
  options,
  register,
  required = false,
  errors,
  readOnly = false,
  watch,
  onAdd,
}: any) => {
  const value = watch?.(name);
  return (
    <div>
      <label className="text-secondary-text">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="flex gap-2 items-center">
        {readOnly ? (
          <div className="w-full p-2 bg-transparent text-secondary-text rounded border-none">
            {value || `No ${label} selected`}
          </div>
        ) : (
          <>
            <select
              {...register(name, {
                required: required ? `${label} is required` : false,
              })}
              className="w-full p-2 border border-border bg-secondary-color-lt text-secondary-text outline-none rounded"
            >
              <option value="" disabled hidden>
                Select {label}
              </option>
              {options.map((opt: string, idx: number) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onAdd}
              className="w-[160px] px-3 py-2 bg-primary hover:bg-primary-hover text-white border-2 border-primary text-center rounded font-bold transition"
              disabled={readOnly}
            >
              + Add bank
            </button>
          </>
        )}
      </div>
      {errors?.[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name]?.message}</p>
      )}
    </div>
  );
};

function BankAccountMaster() {
  const [bankOptions, setBankOptions] = useState<string[]>(["Choose..."]);
  const [entityOptions, setEntityOptions] = useState<string[]>(["Choose..."]);
  const [entity, setEntity] = useState<EntityResult[]>([]);
  const [bank, setBank] = useState<BankItem[]>([]);
  const [review, setReview] = useState(false);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(1);
  const [createdAccountNumber, setCreatedAccountNumber] = useState("");

  const { notify } = useNotification();
  useEffect(() => {
    setLoading(true);
    // Fetch bank names
    nos
      .post<GetBankNamesWithIDResponse>(`${apiBaseUrl}/master/bank/names`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setBankOptions([
            "Choose...",
            ...response.data.results.map((item) => item.bank_name),
          ]);
          setBank(response.data.results);
        } else {
          notify(response.data.error || "Failed to fetch banks", "error");
        }
        setLoading(false);
      })
      .catch(() => {
        notify("Network error. Please try again.", "error");
        setLoading(false);
      });

    // Fetch entity names
    nos
      .post<EntityListResponse>(`${apiBaseUrl}/master/entitycash/all-names`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setEntityOptions([
            "Choose...",
            ...response.data.results.map((item) => item.entity_name),
          ]);
          setEntity(response.data.results);
        } else {
          notify(response.data.error || "Failed to fetch entities", "error");
        }
      })
      .catch(() => {
        notify("Network error. Please try again.", "error");
      });
  }, []);

  const navigator = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<BankAccountMasterRequest>({ mode: "onChange" });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "clearing_codes",
  });

  const accountType = watch("account_type");

  const onSubmit = async (values: BankAccountMasterRequest) => {
    if (
      values.account_type !== "Cash Credit" &&
      values.account_type !== "Overdraft"
    ) {
      values.credit_limit = 0;
    } else {
      values.credit_limit = Number(values.credit_limit);
    }
    const entityID = entity.find((item) => item.entity_name === values.entity_id);
    const bankID = bank.find((item) => item.bank_name === values.bank_id);
    if (entityID) {
      values.entity_id = entityID.entity_id;
    }
    if (bankID) {
      values.bank_id = bankID.bank_id;
    }
    try {
      const response = await nos.post<{ success: boolean; error?: string }>(
        `${apiBaseUrl}/master/bankaccount/create`,
        values
      );
      const data = response.data;
      if ("success" in data && data.success) {
        notify("Bank account created successfully", "success");
        reset();
        setStep(2);
        setCreatedAccountNumber(values.account_number);
      } else {
        notify(data.error || "Error saving data", "error");
      }
    } catch (error) {
      notify("Error saving data", "error");
    }
  };

  const onChange = async () => {
    setReview(true);
  };

  const handleAddAnotherAccount = () => {
    setStep(1);
    setReview(false);
    setCreatedAccountNumber("");
    reset();
  };

  return (
    <>
      <div className="flex justify-center">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
            {step === 1 && (
              <>
                <h2 className="text-xl font-semibold text-secondary-text-dark">
                  Enter Bank Account Details
                </h2>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="grid grid-cols-3 gap-x-6 gap-y-4"
                >
                  <DropdownGroupWithButton
                    label="Parent Bank"
                    name="bank_id"
                    options={bankOptions}
                    register={register}
                    required
                    errors={errors}
                    watch={watch}
                    readOnly={review}
                    onAdd={() =>
                      navigator("/bank-master", { state: { from: "form" } })
                    }
                  />
                  <InputGroup
                    label="Account Number"
                    name="account_number"
                    register={register}
                    required
                    errors={errors}
                    readOnlyMode={review}
                  />
                  <InputGroup
                    label="Account Nickname"
                    name="account_nickname"
                    register={register}
                    required
                    errors={errors}
                    readOnlyMode={review}
                  />
                  <DropdownGroup
                    label="Account Type"
                    name="account_type"
                    options={accountTypes}
                    register={register}
                    required
                    errors={errors}
                    watch={watch}
                    readOnly={review}
                  />
                  {(accountType === "Overdraft" ||
                    accountType === "Cash Credit") && (
                      <InputGroup
                        label="Credit Limit"
                        name="credit_limit"
                        register={register}
                        type="number"
                        required
                        readOnlyMode={review}
                        errors={errors}
                      />
                    )}
                  <DropdownGroup
                    label="Entity Name"
                    name="entity_id" // <-- use entity_id here
                    options={entityOptions}
                    register={register}
                    required
                    errors={errors}
                    watch={watch}
                    readOnly={review}
                  />
                  <DropdownGroup
                    label="Account Currency"
                    name="account_currency"
                    options={currencies}
                    register={register}
                    required
                    watch={watch}
                    readOnly={review}
                    errors={errors}
                  />
                  <InputGroup
                    label="IBAN"
                    name="iban"
                    register={register}
                    required
                    errors={errors}
                    readOnlyMode={review}
                  />
                  <InputGroup
                    label="Branch Name/Code"
                    name="branch_name"
                    register={register}
                    required
                    errors={errors}
                    readOnlyMode={review}
                  />
                  <InputGroup
                    label="Branch Address"
                    name="branch_address"
                    register={register}
                    required
                    errors={errors}
                    readOnlyMode={review}
                  />
                  {/* Local Clearing Codes (Dynamic Rows) */}
                  <div className="col-span-3 space-y-3">
                    <label className="text-secondary-text font-semibold">
                      Local Clearing Codes
                    </label>
                    <div className="space-y-3">
                      {(() => {
                        const renderRow = (index: number, key?: string) => (
                          <div
                            key={key || index}
                            className="grid grid-cols-3 gap-4 items-center"
                          >
                            <DropdownGroup
                              label="Code Type"
                              name={`clearing_codes.${index}.code_type`}
                              options={clearingCodeTypes}
                              register={register}
                              required
                              errors={errors}
                              watch={watch}
                              readOnly={review}
                            />
                            <InputGroup
                              label="Code Value"
                              name={`clearing_codes.${index}.code_value`}
                              register={register}
                              required
                              errors={errors}
                              readOnlyMode={review}
                            />
                            {!review && (
                              <div className="flex gap-3 relative top-3 justify-end">
                                <Button
                                  type="button"
                                  color={
                                    fields.length <= 1 ? "Disable" : "Fade"
                                  }
                                  onClick={() => remove(index)}
                                  disabled={fields.length <= 1}
                                >
                                  Remove
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() =>
                                    append({ code_type: "", code_value: "" })
                                  }
                                >
                                  + Add Code
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                        if (fields.length === 0) {
                          return renderRow(0);
                        }
                        return fields.map((field, index) =>
                          renderRow(index, field.id)
                        );
                      })()}
                    </div>
                  </div>
                  <DropdownGroup
                    label="Account Status"
                    name="account_status"
                    options={accountStatusOptions}
                    register={register}
                    required
                    errors={errors}
                    watch={watch}
                    readOnly={review}
                  />
                  <div className="col-span-3 flex justify-end">
                    <div className="flex gap-3">
                      {!review && (
                        <div>
                          <Button onClick={onChange}>
                            Review Account Details
                          </Button>
                        </div>
                      )}
                      {review && (
                        <div>
                          <Button
                            type="submit"
                            color="Green"
                            // onClick={() => {handleConfirmCreate()}}
                          >
                            Confirm & Create Account
                          </Button>
                        </div>
                      )}
                      {review && (
                        <div>
                          <Button
                            onClick={() => setReview(false)}
                            type="button"
                            color="Fade"
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </>
            )}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary-xl p-6 mb-4">
                  {/* Card icon SVG */}
                  <span className="text-primary-lt">
                    <UserRoundCheck size={42} />
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-primary-lt tracking-wider mb-2">
                  Account Created Successfully!
                </h2>
                <p className="text-secondary-text-dark font-normal mb-6">
                  Bank account "{createdAccountNumber}" has been created.
                </p>
                <div className="col-span-3 flex justify-end">
                  <div>
                    <Button
                      type="button"
                      color="Green"
                      onClick={handleAddAnotherAccount}
                    >
                      Add Another Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default BankAccountMaster;
