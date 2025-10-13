import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import nos from "../../../utils/nos.tsx";
import { CURRENCY_DATA } from "../../../constant/constants";
import { useLocation } from "react-router-dom";
import Layout from "../../../components/layout/Layout.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export type BankAccountResponse = {
  success: boolean;
  data: BankAccountData;
};

export type BankAccountData = {
  // Basic account info
  account_id: string;
  account_number: string;
  account_nickname: string;
  iban: string;
  branch_name: string;

  // Bank and entity info
  bank_id: string;
  entity_id: string;
  bank_name: string;
  entity_name: string;

  // Location info
  country: string;
  addr1: string;
  addr2: string;
  city: string;
  state: string;
  postal: string;

  // Account details
  relationship: string;
  usage: string;
  currency: string;
  nickname: string;
  account_no: string;
  status: string;

  // Dates
  eff_from: string; // yyyy-mm-dd
  eff_to: string; // yyyy-mm-dd

  // Contact info
  branch_email: string;
  branch_phone: string;

  // ERP info
  erp_type: string;
  sap_bukrs: string;
  sap_hbkid: string;
  sap_hktid: string;
  sap_bankl: string;
  ora_ledger: string;
  ora_branch: string;
  ora_account: string;
  tally_ledger: string;
  sage_cc: string;

  // Categories
  cat_inflow: string;
  cat_outflow: string;
  cat_charges: string;
  cat_int_inc: string;
  cat_int_exp: string;

  // Connection info
  conn_channel: string;
  conn_tz: string;
  conn_cutoff: string;
  api_base: string;
  api_auth: string;

  // SFTP info
  sftp_host: string;
  sftp_port: number;
  sftp_user: string;
  sftp_folder: string;

  // EBICS info
  ebics_host_id: string;
  ebics_partner_id: string;
  ebics_user_id: string;

  // SWIFT info
  swift_bic: string;
  swift_service: string;
  portal_url: string;
  portal_notes: string;

  // Old fields
  old_bank_name: string;
  old_country: string;
  old_relationship: string;
  old_usage: string;
  old_currency: string;
  old_nickname: string;
  old_account_no: string;
  old_status: string;
  old_eff_from: string;
  old_eff_to: string;
  old_branch_email: string;
  old_branch_phone: string;
  old_addr1: string;
  old_addr2: string;
  old_city: string;
  old_state: string;
  old_postal: string;
  old_erp_type: string;
  old_sap_bukrs: string;
  old_sap_hbkid: string;
  old_sap_hktid: string;
  old_sap_bankl: string;
  old_ora_ledger: string;
  old_ora_branch: string;
  old_ora_account: string;
  old_tally_ledger: string;
  old_sage_cc: string;
  old_cat_inflow: string;
  old_cat_outflow: string;
  old_cat_charges: string;
  old_cat_int_inc: string;
  old_cat_int_exp: string;
  old_conn_channel: string;
  old_conn_tz: string;
  old_conn_cutoff: string;
  old_api_base: string;
  old_api_auth: string;
  old_sftp_host: string;
  old_sftp_port: number;
  old_sftp_user: string;
  old_sftp_folder: string;
  old_ebics_host_id: string;
  old_ebics_partner_id: string;
  old_ebics_user_id: string;
  old_swift_bic: string;
  old_swift_service: string;
  old_portal_url: string;
  old_portal_notes: string;

  // Clearing codes
  clearing_codes: ClearingCode[];

  // Audit info
  processing_status: string;
  action_type: string;
  action_id: string;
  requested_by: string;
  requested_at: string;
  checker_by: string;
  checker_at: string;
  checker_comment: string;
  reason: string;

  // Audit detail
  created_by: string;
  created_at: string;
  edited_by: string;
  edited_at: string;
  deleted_by: string;
  deleted_at: string;
};

export type ClearingCode = {
  clearing_id: string;
  code_type: string;
  code_value: string;
  optional_code_type: string;
  optional_code_value: string;
  old_code_type: string;
  old_code_value: string;
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

  if (c === "india") {
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

const BankAccountDetail: React.FC = () => {
  const location = useLocation();
  const accountId = location.state?.account_id;

  // Add edit mode state
  const [editMode, setEditMode] = useState(false);

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
  //   { value: string; label: string; type: string }[]
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
  } = useForm<BankAccountData>();
  const { notify } = useNotification();
  //   const erpType = useWatch({ control, name: "erp_type", defaultValue: "Generic" });
  // const erpType = watch("erp_type");
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
              value: bank.bank_name,
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
              value: item.entity_name,
              label: item.entity_name,
            }))
          );
        } else {
          setBUEntityOptions([]);
        }
      })
      .catch(() => setBUEntityOptions([]));

    // Fetch Currency Options from API
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
            .filter(
              (cat) => cat.category_type.toLowerCase().trim() === "inflow"
            )
            .map((cat) => cat.category_name);
          const outflow = response.data.categories
            .filter(
              (cat) => cat.category_type.toLowerCase().trim() === "outflow"
            )
            .map((cat) => cat.category_name);
          setInflowOptions(
            inflow.length ? ["Choose..", ...inflow] : ["", "— None —"]
          );
          setOutflowOptions(
            outflow.length ? ["Choose..", ...outflow] : ["", "— None —"]
          );
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

  const onSubmit = async (values: BankAccountData) => {
    setIsSubmitting(true);

    // Build clearing_codes array with all required fields
    const clearing_codes: ClearingCode[] = [
      {
        clearing_id: "", // or generate an ID if needed
        code_type: branchCodeLabel,
        code_value: branchCodeValue,
        optional_code_type: optionalCodeLabel,
        optional_code_value: optionalCodeValue,
        old_code_type: "", // or previous value if available
        old_code_value: "", // or previous value if available
      },
    ];

    values.country = selectedCountry;
    values.currency = selectedCurrency || "";
    values.bank_id = values.bank_id || "";
    values.entity_id = selectBUEntity || "";

    // Get only changed fields
    const changedFields = getChangedFields(
      { ...values, clearing_codes },
      originalData
    );

    // If nothing changed, don't call API
    if (Object.keys(changedFields).length === 0) {
      notify("No changes to save.", "info");
      setIsSubmitting(false);
      setEditMode(false);
      return;
    }

    // Prepare payload for bulk update
    const payload = {
      accounts: [
        {
          account_id: accountId,
          fields: changedFields,
        },
      ],
    };

    try {
      const response = await nos.post<{ success: boolean; error?: string }>(
        `${apiBaseUrl}/master/bankaccount/update`,
        payload
      );
      const data = response.data;
      if ("success" in data && data.success) {
        notify("Bank account updated successfully", "success");
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

  //   const branchCodeFields = getBranchCodeFields(selectedCountry);

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

  // 1. Add a state to store the original data after fetch
  const [originalData, setOriginalData] = useState<BankAccountData | null>(null);

  useEffect(() => {
    if (accountId) {
      nos
        .post<BankAccountResponse>(
          `${apiBaseUrl}/master/bankaccount/for-user`,
          { account_id: accountId }
        )
        .then((response) => {
          if (response.data.success && response.data.data) {
            const data = response.data.data;
            // Pre-populate form fields
            reset({
              ...data,
              bank_id: data.bank_id,
              bank_name: data.bank_name,
              entity_id: data.entity_id,
              country: data.country,
              currency: data.currency,
              relationship: data.relationship,
              usage: data.usage,
              nickname: data.nickname,
              account_number: data.account_number,
              iban: data.iban,
              eff_from: data.eff_from,
              eff_to: data.eff_to,
              status: data.status,
              branch_name: data.branch_name,
              branch_email: data.branch_email,
              branch_phone: data.branch_phone,
              addr1: data.addr1,
              addr2: data.addr2,
              city: data.city,
              state: data.state,
              postal: data.postal,
              cat_inflow: data.cat_inflow,
              cat_outflow: data.cat_outflow,
              cat_charges: data.cat_charges,
              cat_int_inc: data.cat_int_inc,
              cat_int_exp: data.cat_int_exp,
              erp_type: data.erp_type,
              sage_cc: data.sage_cc,
              tally_ledger: data.tally_ledger,
              ora_ledger: data.ora_ledger,
              ora_branch: data.ora_branch,
              ora_account: data.ora_account,
              sap_bukrs: data.sap_bukrs,
              sap_hbkid: data.sap_hbkid,
              sap_hktid: data.sap_hktid,
              sap_bankl: data.sap_bankl,
              conn_channel: data.conn_channel,
              conn_tz: data.conn_tz,
              conn_cutoff: data.conn_cutoff,
              portal_url: data.portal_url,
              portal_notes: data.portal_notes,
              swift_bic: data.swift_bic,
              swift_service: data.swift_service,
              ebics_host_id: data.ebics_host_id,
              ebics_partner_id: data.ebics_partner_id,
              ebics_user_id: data.ebics_user_id,
              sftp_host: data.sftp_host,
              sftp_port: data.sftp_port, // keep as number, do NOT use .toString()
              sftp_user: data.sftp_user,
              sftp_folder: data.sftp_folder,
              api_base: data.api_base,
              api_auth: data.api_auth,
              // ...add other fields as needed
            });
            setOriginalData(data); // <-- store original data
            setSelectedCountry(data.country);
            setSelectedCurrency(data.currency);
            setselectBUEntity(data.entity_id);
            // Set branch code values if needed
            if (data.clearing_codes && data.clearing_codes.length > 0) {
              setBranchCodeLabel(data.clearing_codes[0].code_type);
              setBranchCodeValue(data.clearing_codes[0].code_value);
              setOptionalCodeLabel(data.clearing_codes[0].optional_code_type);
              setOptionalCodeValue(data.clearing_codes[0].optional_code_value);
            }
          }
        });
    }
  }, [accountId, reset]);

  // Save handler
  const handleSave = handleSubmit(async (values: BankAccountData) => {
    await onSubmit(values);
    setEditMode(false);
  });

  // Cancel handler
  const handleCancel = () => {
    reset();
    setEditMode(false);
  };

  // Add a helper to check if a field should always be readonly
  const alwaysReadOnlyFields = [
    "bank_name",
    "country",
    "entity_id",
    "currency",
    "erp_type",
    "conn_channel",
    "cat_inflow",
    "cat_outflow",
    "cat_charges",
    "cat_int_inc",
    "cat_int_exp",
  ];

  const isAlwaysReadOnly = (name: string) =>
    alwaysReadOnlyFields.includes(name);

  // Helper to get old value key for a field
  const getOldValueKey = (name: string) => {
    if (name.startsWith("cat_")) return `old_${name}`;
    if (name.startsWith("sap_")) return `old_${name}`;
    if (name.startsWith("ora_")) return `old_${name}`;
    if (name.startsWith("tally_")) return `old_${name}`;
    if (name.startsWith("sage_")) return `old_${name}`;
    if (name.startsWith("conn_")) return `old_${name}`;
    if (name.startsWith("sftp_")) return `old_${name}`;
    if (name.startsWith("ebics_")) return `old_${name}`;
    if (name.startsWith("swift_")) return `old_${name}`;
    if (name.startsWith("api_")) return `old_${name}`;
    if (name === "bank_name") return "old_bank_name";
    if (name === "entity_id") return "old_entity_name";
    if (name === "currency") return "old_currency";
    if (name === "relationship") return "old_relationship";
    if (name === "usage") return "old_usage";
    if (name === "nickname") return "old_nickname";
    if (name === "account_number") return "old_account_no";
    if (name === "status") return "old_status";
    if (name === "eff_from") return "old_eff_from";
    if (name === "eff_to") return "old_eff_to";
    if (name === "branch_email") return "old_branch_email";
    if (name === "branch_phone") return "old_branch_phone";
    if (name === "addr1") return "old_addr1";
    if (name === "addr2") return "old_addr2";
    if (name === "city") return "old_city";
    if (name === "state") return "old_state";
    if (name === "postal") return "old_postal";
    if (name === "erp_type") return "old_erp_type";
    return undefined;
  };

  // Update renderField
  const renderField = ({
    label,
    name,
    options,
    value,
    // onChange,
    placeholder,
    type,
    maxLength,
    // disabled,
    errors,
    register,
  }: any) => {
    const oldValueKey = getOldValueKey(name);
    let oldValue = oldValueKey ? watch(oldValueKey as keyof BankAccountData) : undefined;
    if (typeof oldValue === "number") oldValue = oldValue.toString();
    if (Array.isArray(oldValue)) oldValue = "";
    if (!editMode || isAlwaysReadOnly(name)) {
      return (
        <InputGroup
          label={label}
          name={name}
          value={value}
          register={register}
          errors={errors}
          readOnlyMode
          disabled
          placeholder={placeholder}
          type={type}
          maxLength={maxLength}
          oldValue={editMode ? oldValue : undefined}
        />
      );
    }
    if (options) {
      return (
        <DropdownGroup
          label={label}
          name={name}
          options={options}
          register={register}
          errors={errors}
          oldValue={editMode ? oldValue : undefined}
        />
      );
    }
    return (
      <InputGroup
        label={label}
        name={name}
        register={register}
        errors={errors}
        placeholder={placeholder}
        type={type}
        maxLength={maxLength}
        oldValue={editMode ? oldValue : undefined}
      />
    );
  };

  const renderSelectField = ({
    label,
    name,
    options,
    value,
    onChange,
    placeholder,
    // disabled,
    errors,
    register,
  }: any) => {
    const oldValueKey = getOldValueKey(name);
    let oldValue = oldValueKey ? watch(oldValueKey as keyof BankAccountData) : undefined;
    if (typeof oldValue === "number") oldValue = oldValue.toString();
    if (Array.isArray(oldValue)) oldValue = "";
    if (!editMode || isAlwaysReadOnly(name)) {
      return (
        <InputGroup
          label={label}
          name={name}
          value={value}
          register={register}
          errors={errors}
          readOnlyMode
          disabled
          placeholder={placeholder}
          oldValue={editMode ? oldValue : undefined}
        />
      );
    }
    return (
      <CustomSelect
        label={label}
        options={options}
        selectedValue={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={false}
        // required={required} // removed
        // oldValue={editMode ? oldValue : undefined}
      />
    );
  };

  const branchCodeFields = getBranchCodeFields(selectedCountry);

  const categoryFields: Array<keyof BankAccountData> = [
    "cat_inflow",
    "cat_outflow",
    "cat_charges",
    "cat_int_inc",
    "cat_int_exp",
  ];

  return (
    <Layout title="Bank Account Master - Details">
      <div className="flex justify-center">
        <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-secondary-text-dark mb-2">
              Core Details
            </h2>
            <div className="flex justify-end">
              <div className="flex gap-3">
                {!editMode ? (
                  <Button type="button" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                    <Button type="button" color="Fade" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <form className="grid grid-cols-4 gap-x-6 gap-y-4">
            {/* Bank Name */}
            {renderSelectField({
              label: "Bank Name",
              name: "bank_name",
              options: bankNameOptions,
              value: watch("bank_name") || "",
              onChange: (value: string) => setValue("bank_name", value),
              placeholder: "Select bank",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Country */}
            {renderSelectField({
              label: "Country",
              name: "country",
              options: [
                { value: "", label: "Choose country..." },
                ...CURRENCY_DATA.map((c) => ({
                  value: c.country,
                  label: c.country,
                })),
              ],
              value: selectedCountry,
              onChange: (value: string) => setSelectedCountry(value),
              placeholder: "Select country...",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Business Unit / Division */}
            {renderSelectField({
              label: "Business Unit / Division",
              name: "entity_id",
              options: BUEntityOptions,
              value: selectBUEntity,
              onChange: (value: string) => setselectBUEntity(value),
              placeholder: "Select Business Unit",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Relationship Type */}
            {renderField({
              label: "Relationship Type",
              name: "relationship",
              options: ["Current", "Savings", "OD"],
              value: watch("relationship"),
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Default Currency */}
            {renderSelectField({
              label: "Default Currency",
              name: "currency",
              options: currencyOptions,
              value: selectedCurrency,
              onChange: (value: string) => setSelectedCurrency(value),
              placeholder: "Select currency",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Usage */}
            {renderField({
              label: "Usage",
              name: "usage",
              options: usageOptions,
              value: watch("usage"),
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Nickname */}
            {renderField({
              label: "Nickname (display)",
              name: "nickname",
              value: watch("nickname"),
              maxLength: 50,
              placeholder: "Primary Ops A/C",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Account Number */}
            {renderField({
              label: "Account Number",
              name: "account_number",
              value: watch("account_number"),
              maxLength: 34,
              required: true,
              placeholder: "Account Number",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* IBAN */}
            {renderField({
              label: "IBAN",
              name: "iban",
              value: watch("iban"),
              maxLength: 34,
              placeholder: "International Bank Account Number",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* SWIFT/BIC */}
            {renderField({
              label: "SWIFT/BIC",
              name: "swift_bic",
              value: watch("swift_bic"),
              maxLength: 11,
              placeholder: "8 or 11 chars",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Effective From */}
            {renderField({
              label: "Effective From",
              name: "eff_from",
              value: watch("eff_from"),
              type: "date",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Effective To */}
            {renderField({
              label: "Effective To",
              name: "eff_to",
              value: watch("eff_to"),
              type: "date",
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Status */}
            {renderField({
              label: "Status",
              name: "status",
              options: statusOptions,
              value: watch("status"),
              disabled: !editMode,
              errors,
              register,
            })}

            {/* Branch & Country Codes */}
            <h2 className="text-xl font-semibold text-secondary-text-dark col-span-4 mt-2 mb-4">
              Branch & Country Codes
            </h2>
            <div className="col-span-4">
              <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-3 gap-x-6 gap-y-4">
                {/* Branch Name, Email, Phone, Address, etc. */}
                {renderField({
                  label: "Branch Name",
                  name: "branch_name",
                  value: watch("branch_name"),
                  maxLength: 100,
                  placeholder: "e.g., Fort Branch",
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "Branch Email",
                  name: "branch_email",
                  value: watch("branch_email"),
                  maxLength: 100,
                  placeholder: "branch@bank.example",
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "Branch Phone",
                  name: "branch_phone",
                  value: watch("branch_phone"),
                  maxLength: 20,
                  placeholder: "+91-22-xxxx-xxxx",
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "Address Line 1",
                  name: "addr1",
                  value: watch("addr1"),
                  maxLength: 100,
                  placeholder: "Street, area",
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "Address Line 2",
                  name: "addr2",
                  value: watch("addr2"),
                  maxLength: 100,
                  placeholder: "Building, floor (optional)",
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "City",
                  name: "city",
                  value: watch("city"),
                  maxLength: 50,
                  placeholder: "City",
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "State/Province",
                  name: "state",
                  value: watch("state"),
                  maxLength: 50,
                  placeholder: "State/Province",
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "Postal Code",
                  name: "postal",
                  value: watch("postal"),
                  maxLength: 20,
                  placeholder: "PIN/ZIP",
                  disabled: !editMode,
                  errors,
                  register,
                })}

                {/* Branch code fields */}
                {branchCodeFields && (
                  <>
                    <InputGroup
                      label={branchCodeLabel}
                      name={branchCodeLabel
                        .toLowerCase()
                        .replace(/[^a-z]/g, "_")}
                      value={branchCodeValue}
                      readOnlyMode={!editMode}
                      disabled={!editMode}
                      placeholder={branchCodeFields.placeholder}
                      required={branchCodeFields.required}
                      onChange={
                        editMode
                          ? (e: any) => setBranchCodeValue(e.target.value)
                          : undefined
                      }
                    />
                    {optionalCodeLabel && (
                      <InputGroup
                        label={optionalCodeLabel}
                        name={branchCodeFields.optional?.name}
                        value={optionalCodeValue}
                        readOnlyMode={!editMode}
                        disabled={!editMode}
                        placeholder={branchCodeFields.optional?.placeholder}
                        onChange={
                          editMode
                            ? (e: any) => setOptionalCodeValue(e.target.value)
                            : undefined
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Category Mapping */}
            <h2 className="text-xl font-semibold text-secondary-text-dark col-span-4 mt-8 mb-4">
              Category Mapping
            </h2>
            <div className="col-span-4">
              <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-5 gap-x-6 gap-y-4">
                {categoryFields.map((cat, idx) =>
                  renderField({
                    label: [
                      "Default Inflow Category",
                      "Default Outflow Category",
                      "Charges Category",
                      "Interest Income Category",
                      "Interest Expense Category",
                    ][idx],
                    name: cat,
                    options:
                      cat === "cat_inflow"
                        ? inflowOptions
                        : cat === "cat_outflow"
                        ? outflowOptions
                        : ["— None —"],
                    value: watch(cat),
                    disabled: !editMode,
                    errors,
                    register,
                  })
                )}
              </div>
            </div>

            {/* ERP Mapping */}
            <h2 className="text-xl font-semibold text-secondary-text-dark col-span-4 mt-8 mb-4">
              ERP Mapping
            </h2>
            <div className="col-span-4">
              <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-4 gap-x-6 gap-y-4">
                {renderField({
                  label: "ERP",
                  name: "erp_type",
                  options: ["Generic", "SAP", "Oracle", "Tally", "Sage"],
                  value: watch("erp_type"),
                  disabled: !editMode,
                  errors,
                  register,
                })}

                {/* SAGE */}
                {watch("erp_type") === "Sage" && (
                  <InputGroup
                    label="Cost Centre"
                    name="sage_cc"
                    value={watch("sage_cc")}
                    readOnlyMode={!editMode}
                    disabled={!editMode}
                    placeholder="CC10"
                    register={register}
                    errors={errors}
                  />
                )}

                {/* TALLY */}
                {watch("erp_type") === "Tally" && (
                  <InputGroup
                    label="Ledger Name"
                    name="tally_ledger"
                    value={watch("tally_ledger")}
                    readOnlyMode={!editMode}
                    disabled={!editMode}
                    placeholder="HDFC-Current-Primary"
                    register={register}
                    errors={errors}
                  />
                )}

                {/* ORACLE */}
                {watch("erp_type") === "Oracle" && (
                  <>
                    <InputGroup
                      label="Ledger"
                      name="ora_ledger"
                      value={watch("ora_ledger")}
                      readOnlyMode={!editMode}
                      disabled={!editMode}
                      placeholder="CORP_LEDGER"
                      register={register}
                      errors={errors}
                    />
                    <InputGroup
                      label="Bank Branch (Name/No)"
                      name="ora_branch"
                      value={watch("ora_branch")}
                      readOnlyMode={!editMode}
                      disabled={!editMode}
                      placeholder="JPM NY 021000021"
                      register={register}
                      errors={errors}
                    />
                    <InputGroup
                      label="Bank Account Reference"
                      name="ora_account"
                      value={watch("ora_account")}
                      readOnlyMode={!editMode}
                      disabled={!editMode}
                      placeholder="Vendor Bank Account Ref"
                      register={register}
                      errors={errors}
                    />
                  </>
                )}

                {/* SAP */}
                {watch("erp_type") === "SAP" && (
                  <>
                    <InputGroup
                      label="Company Code (BUKRS)"
                      name="sap_bukrs"
                      value={watch("sap_bukrs")}
                      readOnlyMode={!editMode}
                      disabled={!editMode}
                      placeholder="1000"
                      register={register}
                      errors={errors}
                    />
                    <InputGroup
                      label="House Bank (HBKID)"
                      name="sap_hbkid"
                      value={watch("sap_hbkid")}
                      readOnlyMode={!editMode}
                      disabled={!editMode}
                      placeholder="HB01"
                      register={register}
                      errors={errors}
                    />
                    <InputGroup
                      label="Account ID (HKTID)"
                      name="sap_hktid"
                      value={watch("sap_hktid")}
                      readOnlyMode={!editMode}
                      disabled={!editMode}
                      placeholder="AC01"
                      register={register}
                      errors={errors}
                    />
                    <InputGroup
                      label="Bank Key (BANKL)"
                      name="sap_bankl"
                      value={watch("sap_bankl")}
                      readOnlyMode={!editMode}
                      disabled={!editMode}
                      placeholder="OPTIONAL"
                      register={register}
                      errors={errors}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Connectivity */}
            <h2 className="text-xl font-semibold text-secondary-text-dark col-span-4 mt-8 mb-4">
              Connectivity
            </h2>
            <div className="col-span-4">
              <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-4 gap-x-6 gap-y-4">
                {renderField({
                  label: "Channel",
                  name: "conn_channel",
                  options: channelOptions,
                  value: watch("conn_channel"),
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "Timezone",
                  name: "conn_tz",
                  options: timezoneOptions,
                  value: watch("conn_tz"),
                  disabled: !editMode,
                  errors,
                  register,
                })}
                {renderField({
                  label: "Cut-off",
                  name: "conn_cutoff",
                  value: watch("conn_cutoff"),
                  placeholder: "17:00",
                  disabled: !editMode,
                  errors,
                  register,
                })}

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
        </div>
      </div>
    </Layout>
  );
};

// Utility to get only changed fields
function getChangedFields(
  current: Partial<BankAccountData>,
  original: Partial<BankAccountData> | null
) {
  if (!original) return current;
  const changed: Record<string, any> = {};
  Object.keys(current).forEach((key) => {
    if (
      typeof current[key as keyof BankAccountData] !== "function" &&
      current[key as keyof BankAccountData] !== original[key as keyof BankAccountData]
    ) {
      changed[key] = current[key as keyof BankAccountData];
    }
  });
  return changed;
}

export default BankAccountDetail;
