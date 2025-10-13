import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import nos from "../../../utils/nos.tsx";
import { CURRENCY_DATA } from "../../../constant/constants";

import CustomSelect from "../../../components/ui/SearchSelect.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type ClearingCode = {
  code_type: string;
  code_value: string;
  optional_code_type: string;
  optional_code_value: string;
};
type BankAccountForm = {
  // Core
  bank_id: string;
  country: string;
  entity_id: string;
  account_no: string;
  account_nickname?: string;
  relationship: string;
  usage: string;
  currency: string;
  nickname?: string;
  account_number?: string;
  iban?: string;
  eff_from: string;
  eff_to?: string;
  status: string;

  // Branch & Country Codes
  branch_name?: string;
  branch_email?: string;
  branch_phone?: string;
  addr1?: string;
  addr2?: string;
  city?: string;
  state?: string;
  postal?: string;

  // Category Mapping
  cat_inflow?: string;
  cat_outflow?: string;
  cat_charges?: string;
  cat_int_inc?: string;
  cat_int_exp?: string;

  // ERP Mapping
  erp_type: string;
  sage_cc?: string;
  tally_ledger?: string;
  ora_ledger?: string;
  ora_branch?: string;
  ora_account?: string;
  sap_bukrs?: string;
  sap_hbkid?: string;
  sap_hktid?: string;
  sap_bankl?: string;

  // Connectivity
  conn_channel: string;
  conn_tz?: string;
  conn_cutoff?: string;

  // Bank Portal
  portal_url?: string;
  portal_notes?: string;

  // SWIFT SCORE
  swift_bic?: string;
  swift_service?: string;

  // H2H - EBICS
  ebics_host_id?: string;
  ebics_partner_id?: string;
  ebics_user_id?: string;

  // H2H - SFTP
  sftp_host?: string;
  sftp_port?: number;
  sftp_user?: string;
  sftp_folder?: string;

  // Direct API
  api_base?: string;
  api_auth?: string;

  clearing_codes?: ClearingCode[];
};

const usageOptions = [
  "Operational",
  "Collection",
  "Payroll",
  // ...add more as needed
];

const statusOptions = ["Active", "Inactive"];

const channelOptions = [
  "None",
  "Bank Portal",
  "SWIFT SCORE",
  "H2H - EBICS",
  "H2H - SFTP",
  "Direct API",
];

const timezoneOptions = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "America/New_York",
  // ...add more as needed
];


  const getBranchCodeFields = (country: string) => {
    const c = country.toLowerCase().trim();

    if (c === ("india")) {
      return {
        label: "IFSC",
        placeholder: "ABCD0XXXXXX",
        required: true,
        optional: {
          label: "MICR (optional)",
          name: "micr",
          placeholder: "9 digits",
        },
      };
    }
    if (c.includes("united states") || c.includes("usa") || c.includes("us")) {
      return {
        label: "ABA/Routing",
        placeholder: "9 digits with checksum",
        required: true,
        optional: {
          label: "Fedwire (optional)",
          name: "fedwire",
          placeholder: "9 digits",
        },
      };
    }
    if (
      (c.includes("united") && c.includes("kingdom")) ||
      c.includes("uk") ||
      c.includes("great britain")
    ) {
      return {
        label: "Sort Code",
        placeholder: "12-34-56 or 123456",
        required: true,
      };
    }
    if (c.includes("australia")) {
      return {
        label: "BSB",
        placeholder: "6 digits",
        required: true,
      };
    }
    if (c.includes("germany")) {
      return {
        label: "BLZ",
        placeholder: "8 digits",
        required: true,
      };
    }
    return null;
  };

const BankAccountMasterForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankNameOptions, setBankNameOptions] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);
  const [BUEntityOptions, setBUEntityOptions] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);
  const [currencyOptions, setCurrencyOptions] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);
  const [selectBUEntity, setselectBUEntity] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  // Add these state hooks at the top of your component:
  // const [cashFlowCategoryOptions, setCashFlowCategoryOptions] = useState<
    // { value: string; label: string; type: string }[]
  // >([]);
  const [inflowOptions, setInflowOptions] = useState<string[]>([]);
  const [outflowOptions, setOutflowOptions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue, // <-- add this
  } = useForm<BankAccountForm>();
  const { notify } = useNotification();
  //   const erpType = useWatch({ control, name: "erp_type", defaultValue: "Generic" });
  const erpType = watch("erp_type");
  const connectivityChannel = watch("conn_channel") || "None";

  // Add these in your component, after other useState hooks
  const [branchCodeLabel, setBranchCodeLabel] = useState<string>("");
  const [branchCodeValue, setBranchCodeValue] = useState<string>("");
  const [optionalCodeLabel, setOptionalCodeLabel] = useState<string>("");
  const [optionalCodeValue, setOptionalCodeValue] = useState<string>("");

  // Sync with react-hook-form
  useEffect(() => {
    setValue("country", selectedCountry);
  }, [selectedCountry, setValue]);

  // You can fetch options from API if needed, currently hardcoded for demo
  useEffect(() => {
    // Fetch Bank Names
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
              value: bank.bank_id,
              label: bank.bank_name,
            }))
          );
        } else {
          setBankNameOptions([]);
        }
      })
      .catch(() => setBankNameOptions([]));

    // Fetch Business Unit / Entity Names
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
          setBUEntityOptions(
            response.data.results.map((item) => ({
              value: item.entity_id,
              label: item.entity_name,
            }))
          );
        } else {
          setBUEntityOptions([]);
        }
      })
      .catch(() => setBUEntityOptions([]));

    // Fetch Currency Options (replace with your API if needed)
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

    // Fetch and filter categories:
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
          const inflow = response.data.categories
            .filter((cat) => cat.category_type.toLowerCase().trim() === "inflow")
            .map((cat) => cat.category_name);
          const outflow = response.data.categories
            .filter((cat) => cat.category_type.toLowerCase().trim() === "outflow")
            .map((cat) => cat.category_name);
          setInflowOptions(inflow.length ? ["Choose..", ...inflow] : ["", "— None —"]);
          setOutflowOptions(outflow.length ? ["Choose..", ...outflow] : ["", "— None —"]);
        } else {
          setInflowOptions([""]);
          setOutflowOptions([""]);
        }
      })
      .catch(() => {
        setInflowOptions([""]);
        setOutflowOptions([""]);
      });
  }, []);

  const onSubmit = async (values: BankAccountForm) => {
    setIsSubmitting(true);

    // Find the selected bank's label
    const selectedBank = bankNameOptions.find(
      (b) => b.value === values.bank_id
    );
    const bank_name = selectedBank ? selectedBank.label : "";

    // Build clearing_codes array
    const clearing_codes: ClearingCode[] = [
      {
        code_type: branchCodeLabel,
        code_value: branchCodeValue,
        optional_code_type: optionalCodeLabel,
        optional_code_value: optionalCodeValue,
      },
    ];

    values.country = selectedCountry;
    values.account_nickname = values.nickname || "";
    values.currency = selectedCurrency || "";
    values.bank_id = values.bank_id || "";
    values.account_no = values.account_number || "";
    values.entity_id = selectBUEntity || "";
    values.sftp_port = Number(values.sftp_port) || 0;

    const payload = {
      ...values,
      bank_name, // <-- add bank_name here
      clearing_codes,
    };

    try {
      const response = await nos.post<{ success: boolean; error?: string }>(
        `${apiBaseUrl}/master/bankaccount/create`,
        payload
      );
      const data = response.data;
      if ("success" in data && data.success) {
        notify("Bank account created successfully", "success");
        reset();
      } else {
        notify(data.error || "Error saving data", "error");
      }
    } catch (error) {
      notify("Error saving data", "error");
    } finally {
      setIsSubmitting(false);
    }
  };


  const branchCodeFields = getBranchCodeFields(selectedCountry);

  useEffect(() => {
    // Use selectedCurrency for mapping
    const branchFields = getBranchCodeFields(selectedCountry || "");
    if (branchFields) {
      setBranchCodeLabel(branchFields.label);
      setBranchCodeValue(""); // reset value on currency change
      if (branchFields.optional) {
        setOptionalCodeLabel(branchFields.optional.label);
        setOptionalCodeValue("");
      } else {
        setOptionalCodeLabel("");
        setOptionalCodeValue("");
      }
    } else {
      setBranchCodeLabel("");
      setBranchCodeValue("");
      setOptionalCodeLabel("");
      setOptionalCodeValue("");
    }
  }, [selectedCountry]);

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text-dark mb-2">
          Core Details
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-4 gap-x-6 gap-y-4"
        >
          {/* Bank Name */}
          <CustomSelect
            label="Bank Name"
            options={bankNameOptions}
            selectedValue={watch("bank_id") || ""}
            onChange={(value: string) => {
              setValue("bank_id", value); // <-- set the value in the form
            }}
            placeholder="Select bank"
            isClearable={false}
          />
          {/* Country Selection */}
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
            onChange={(value) => setSelectedCountry(value)}
            placeholder="Select country..."
            isRequired={true}
          />

          {/* Business Unit / Division */}
          <CustomSelect
            label="Business Unit / Division"
            options={BUEntityOptions}
            selectedValue={selectBUEntity}
            onChange={(value) => {
              setselectBUEntity(value);
            }}
            placeholder="Select Business Unit"
            isClearable={false}
          />

          {/* Relationship Type */}
          <DropdownGroup
            label="Relationship Type"
            name="relationship"
            options={["Current", "Savings", "OD"]}
            register={register}
            required
            errors={errors}
          />

          {/* Default Currency */}
          <CustomSelect
            label="Default Currency"
            options={currencyOptions}
            selectedValue={selectedCurrency}
            onChange={(value) => setSelectedCurrency(value)}
            placeholder="Select currency"
            isClearable={false}
          />

          <DropdownGroup
            label="Usage"
            name="usage"
            options={usageOptions}
            register={register}
            required
            errors={errors}
          />
          <InputGroup
            label="Nickname (display)"
            name="nickname"
            register={register}
            errors={errors}
            maxLength={50}
            placeholder="Primary Ops A/C"
          />
          <InputGroup
            label="Account Number"
            name="account_number"
            register={register}
            errors={errors}
            maxLength={34}
            required={true}
            placeholder="(required if IBAN not provided)"
          />
          <InputGroup
            label="IBAN"
            name="iban"
            register={register}
            errors={errors}
            maxLength={34}
            placeholder="International Bank Account Number"
          />
          <InputGroup
            label="SWIFT/BIC"
            name="swift_bic"
            register={register}
            errors={errors}
            maxLength={11}
            max={11}
            placeholder="8 or 11 chars"
          />
          <InputGroup
            label="Effective From"
            name="eff_from"
            type="date"
            register={register}
            required
            errors={errors}
          />
          <InputGroup
            label="Effective To"
            name="eff_to"
            type="date"
            register={register}
            errors={errors}
          />
          <DropdownGroup
            label="Status"
            name="status"
            options={statusOptions}
            register={register}
            required
            errors={errors}
          />

          <h2 className="text-xl font-semibold text-secondary-text-dark col-span-4 mt-2 mb-4">
            Branch & Country Codes
          </h2>
          <div className="col-span-4">
            <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-3 gap-x-6 gap-y-4">
              <InputGroup
                label="Branch Name"
                name="branch_name"
                register={register}
                errors={errors}
                maxLength={100}
                placeholder="e.g., Fort Branch"
              />
              <InputGroup
                label="Branch Email"
                name="branch_email"
                register={register}
                errors={errors}
                maxLength={100}
                placeholder="branch@bank.example"
              />
              <InputGroup
                label="Branch Phone"
                name="branch_phone"
                register={register}
                errors={errors}
                maxLength={20}
                placeholder="+91-22-xxxx-xxxx"
              />
              <InputGroup
                label="Address Line 1"
                name="addr1"
                register={register}
                errors={errors}
                maxLength={100}
                placeholder="Street, area"
              />
              <InputGroup
                label="Address Line 2"
                name="addr2"
                register={register}
                errors={errors}
                maxLength={100}
                placeholder="Building, floor (optional)"
              />
              <InputGroup
                label="City"
                name="city"
                register={register}
                errors={errors}
                maxLength={50}
                placeholder="City"
              />
              <InputGroup
                label="State/Province"
                name="state"
                register={register}
                errors={errors}
                maxLength={50}
                placeholder="State/Province"
              />
              <InputGroup
                label="Postal Code"
                name="postal"
                register={register}
                errors={errors}
                maxLength={20}
                placeholder="PIN/ZIP"
              />

              {branchCodeFields && (
                <>
                  {branchCodeLabel && (
                    <div className="flex flex-col">
                      <label className="font-semibold text-secondary-text mb-1">
                        {branchCodeLabel} {branchCodeFields.required ? "*" : ""}
                      </label>
                      <input
                        type="text"
                        name={branchCodeLabel
                          .toLowerCase()
                          .replace(/[^a-z]/g, "_")}
                        className="w-full p-2 border border-border bg-white text-secondary-text outline-none rounded"
                        placeholder={branchCodeFields.placeholder}
                        required={branchCodeFields.required}
                        value={branchCodeValue}
                        onChange={(e) => setBranchCodeValue(e.target.value)}
                      />
                      {(errors as any)?.[
                        branchCodeLabel.toLowerCase().replace(/[^a-z]/g, "_")
                      ] && (
                        <span className="text-red-500 text-sm mt-1">
                          {
                            (errors as any)[
                              branchCodeLabel
                                .toLowerCase()
                                .replace(/[^a-z]/g, "_")
                            ]?.message
                          }
                        </span>
                      )}
                    </div>
                  )}
                  {optionalCodeLabel && (
                    <div className="flex flex-col">
                      <label className="font-semibold text-secondary-text mb-1">
                        {optionalCodeLabel}
                      </label>
                      <input
                        type="text"
                        name={branchCodeFields.optional?.name}
                        className="w-full p-2 border border-border bg-white text-secondary-text outline-none rounded"
                        placeholder={branchCodeFields.optional?.placeholder}
                        value={optionalCodeValue}
                        onChange={(e) => setOptionalCodeValue(e.target.value)}
                      />
                      {(errors as any)?.[branchCodeFields.optional?.name || ""] && (
                        <span className="text-red-500 text-sm mt-1">
                          {
                            (errors as any)[branchCodeFields.optional?.name || ""]
                              ?.message
                          }
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-secondary-text-dark col-span-4 mt-8 mb-4">
            Category Mapping
          </h2>
          <div className="col-span-4">
            <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-5 gap-x-6 gap-y-4">
              <DropdownGroup
                label="Default Inflow Category"
                name="cat_inflow"
                options={inflowOptions}
                register={register}
                errors={errors}
              />
              <DropdownGroup
                label="Default Outflow Category"
                name="cat_outflow"
                options={outflowOptions}
                register={register}
                errors={errors}
              />
              <DropdownGroup
                label="Charges Category"
                name="cat_charges"
                options={["— None —"]}
                register={register}
                errors={errors}
              />
              <DropdownGroup
                label="Interest Income Category"
                name="cat_int_inc"
                options={["— None —"]}
                register={register}
                errors={errors}
              />
              <DropdownGroup
                label="Interest Expense Category"
                name="cat_int_exp"
                options={["— None —"]}
                register={register}
                errors={errors}
              />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-secondary-text-dark col-span-4 mt-8 mb-4">
            ERP Mapping
          </h2>
          <div className="col-span-4">
            <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-4 gap-x-6 gap-y-4">
              <DropdownGroup
                label="ERP"
                name="erp_type"
                options={["Generic", "SAP", "Oracle", "Tally", "Sage"]}
                register={register}
                errors={errors}
              />

              {/* SAGE */}
              {erpType === "Sage" && (
                <div className="col-span-3 grid grid-cols-3 gap-x-6">
                  <InputGroup
                    label="Cost Centre"
                    name="sage_cc"
                    register={register}
                    errors={errors}
                    placeholder="CC10"
                  />
                </div>
              )}

              {/* TALLY */}
              {erpType === "Tally" && (
                <div className="col-span-3 grid grid-cols-3 gap-x-6">
                  <InputGroup
                    label="Ledger Name"
                    name="tally_ledger"
                    register={register}
                    errors={errors}
                    placeholder="HDFC-Current-Primary"
                  />
                </div>
              )}

              {/* ORACLE */}
              {erpType === "Oracle" && (
                <div className="col-span-3 grid grid-cols-3 gap-x-6">
                  <InputGroup
                    label="Ledger"
                    name="ora_ledger"
                    register={register}
                    errors={errors}
                    placeholder="CORP_LEDGER"
                  />
                  <InputGroup
                    label="Bank Branch (Name/No)"
                    name="ora_branch"
                    register={register}
                    errors={errors}
                    placeholder="JPM NY 021000021"
                  />
                  <InputGroup
                    label="Bank Account Reference"
                    name="ora_account"
                    register={register}
                    errors={errors}
                    placeholder="Vendor Bank Account Ref"
                  />
                </div>
              )}

              {/* SAP */}
              {erpType === "SAP" && (
                <div className="col-span-3 grid grid-cols-4 gap-x-6">
                  <InputGroup
                    label="Company Code (BUKRS)"
                    name="sap_bukrs"
                    register={register}
                    errors={errors}
                    placeholder="1000"
                  />
                  <InputGroup
                    label="House Bank (HBKID)"
                    name="sap_hbkid"
                    register={register}
                    errors={errors}
                    placeholder="HB01"
                  />
                  <InputGroup
                    label="Account ID (HKTID)"
                    name="sap_hktid"
                    register={register}
                    errors={errors}
                    placeholder="AC01"
                  />
                  <InputGroup
                    label="Bank Key (BANKL)"
                    name="sap_bankl"
                    register={register}
                    errors={errors}
                    placeholder="OPTIONAL"
                  />
                </div>
              )}

              {/* GENERIC */}
              {erpType === "Generic" && <div className="col-span-3"></div>}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-secondary-text-dark col-span-4 mt-8 mb-4">
            Connectivity
          </h2>
          <div className="col-span-4">
            <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-4 gap-x-6 gap-y-4">
              <DropdownGroup
                label="Channel"
                name="conn_channel"
                options={channelOptions}
                register={register}
                errors={errors}
              />
              <DropdownGroup
                label="Timezone"
                name="conn_tz"
                options={timezoneOptions}
                register={register}
                errors={errors}
              />
              <InputGroup
                label="Cut-off"
                name="conn_cutoff"
                register={register}
                errors={errors}
                placeholder="17:00"
              />
              {connectivityChannel !== "None" && (
                <div className="flex items-end">
                  <Button type="button" color="NonPrimary" disabled>Test (Mock)</Button>
                </div>
              )}

              {/* Bank Portal */}
              {connectivityChannel === "Bank Portal" && (
                <>
                  <InputGroup
                    label="Portal URL"
                    name="portal_url"
                    register={register}
                    errors={errors}
                    
                    placeholder="https://.../login"
                  />
                  <InputGroup
                    label="Notes"
                    name="portal_notes"
                    register={register}
                    errors={errors}
                    placeholder="Manual download @ 16:30 daily"
                  />
                </>
              )}

              {/* SWIFT SCORE */}
              {connectivityChannel === "SWIFT SCORE" && (
                <>
                  <InputGroup
                    label="BIC"
                    name="swift_bic"
                    register={register}
                    errors={errors}
                    placeholder="BANKINBBXXX"
                  />
                  <InputGroup
                    label="Service"
                    name="swift_service"
                    register={register}
                    errors={errors}
                    placeholder="MT940/MT942"
                  />
                </>
              )}

              {/* H2H - EBICS */}
              {connectivityChannel === "H2H - EBICS" && (
                <>
                  <InputGroup
                    label="Host ID"
                    name="ebics_host_id"
                    register={register}
                    errors={errors}
                  />
                  <InputGroup
                    label="Partner ID"
                    name="ebics_partner_id"
                    register={register}
                    errors={errors}
                  />
                  <InputGroup
                    label="User ID"
                    name="ebics_user_id"
                    register={register}
                    errors={errors}
                  />
                </>
              )}

              {/* H2H - SFTP */}
              {connectivityChannel === "H2H - SFTP" && (
                <>
                  <InputGroup
                    label="Host"
                    name="sftp_host"
                    register={register}
                    errors={errors}
                  />
                  <InputGroup
                    label="Port"
                    name="sftp_port"
                    register={register}
                    errors={errors}
                    placeholder="22"
                  />
                  <InputGroup
                    label="User"
                    name="sftp_user"
                    register={register}
                    errors={errors}
                  />
                  <InputGroup
                    label="Folder"
                    name="sftp_folder"
                    register={register}
                    errors={errors}
                    placeholder="/incoming"
                  />
                </>
              )}

              {/* Direct API */}
              {connectivityChannel === "Direct API" && (
                <>
                  <InputGroup
                    label="Base URL"
                    name="api_base"
                    register={register}
                    errors={errors}
                    placeholder="https://bank.example/api"
                  />
                  <InputGroup
                    label="Auth (Bearer / Key)"
                    name="api_auth"
                    register={register}
                    errors={errors}
                    placeholder="token-or-key"
                  />
                </>
              )}
            </div>
          </div>
        </form>
        <div className="flex justify-end">
          <div className="flex gap-3">
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Save"}
            </Button>
            <Button type="button" color="Fade" onClick={() => reset()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountMasterForm;
