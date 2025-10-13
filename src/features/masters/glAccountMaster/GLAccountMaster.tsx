import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Define the form value type
export interface GLAccountFormValue {
  gl_account_code: string;
  gl_account_name: string;
  gl_account_type: string;
  //   cashflow_categories: string[];
  status: "Active" | "Inactive";
  source: "Manual"; // fixed value

  gl_account_level: number | string; // can be number (0-4) or string ("Level 0"-"Level 4")
  reconciliation_required: boolean;
  posting_allowed: boolean;
  is_cash_bank: boolean;
  account_class: string;
  normal_balance: string;
  effective_from: string; // date in YYYY-MM-DD format
  effective_to: string; // date in YYYY-MM-DD format
  tags: string; // comma separated tags
  default_currency: string | null; // ISO currency code (e.g., USD, EUR

  // ERP Codes & Mapping
  erp_type?: string;
  external_code?: string;
  segment?: string;

  // SAP fields
  sap_bukrs?: string;
  sap_ktopl?: string;
  sap_saknr?: string;
  sap_ktoks?: string;

  // Oracle fields
  oracle_ledger?: string;
  oracle_coa?: string;
  oracle_balancing_seg?: string;
  oracle_natural_account?: string;

  // Tally fields
  tally_ledger_name?: string;
  tally_ledger_group?: string;

  // Sage fields
  sage_nominal_code?: string;
  sage_cost_centre?: string;
  sage_department?: string;

  is_top_level_gl_account?: boolean;
  parent_gl_account_code?: string;
  is_deleted?: boolean;
}

const GLAccountLevelMap: Record<string, number> = {
  "Level 0": 0,
  "Level 1": 1,
  "Level 2": 2,
  "Level 3": 3,
  "Level 4": 4,
};
const GLAccountLevelOptions = ["Level 0", "Level 1", "Level 2", "Level 3"];

type APIResponse = {
  rows?: { success: boolean; error: string }[];
  error?: string;
  success: boolean;
};

// Example GL Account types
const accountTypes = ["Asset", "Liability", "Equity", "Income", "Expense"];
const statusOptions = ["Choose...", "Active", "Inactive"];
const accountClassOptions = ["Balance Sheet", "Profit & Loss", "Off-Balance"];
const normalBalanceOptions = ["Debit", "Credit", "Neutral"];

const Form: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GLAccountFormValue>();

  const gl_account_level = watch("gl_account_level");
  const erpType = watch("erp_type");

  const [currencyOptions, setCurrencyOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);

  const [GLParentOptions, setGLParentOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedType, setSelectedType] = useState("");
  const { notify } = useNotification();

  useEffect(() => {
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

  useEffect(() => {
    // Only fetch if not Level 0 and a level is selected
    if (gl_account_level && gl_account_level !== "Level 0" && typeof(gl_account_level)==="string") {
      const levelNumber = Number(gl_account_level.replace("Level ", ""));
      nos
        .post<{ results: { gl_account_code: string; gl_account_id: string; gl_account_name: string }[] }>(
          `${apiBaseUrl}/master/v2/glaccount/find-parent-at-level`,
          { level: levelNumber }
        )
        .then((response) => {
          if (response.data.results) {
            setGLParentOptions(
              response.data.results.map((item) => ({
                label: `${item.gl_account_name} (${item.gl_account_code})`,
                value: item.gl_account_code,
              }))
            );
          } else {
            setGLParentOptions([]);
          }
        })
        .catch(() => setGLParentOptions([]));
    } else {
      setGLParentOptions([]);
    }
  }, [gl_account_level]);

  const onSubmit = async (values: GLAccountFormValue) => {
    try {
      if (
        values.gl_account_level &&
        typeof values.gl_account_level === "string"
      ) {
        const mappedLevel = GLAccountLevelMap[values.gl_account_level];
        if (mappedLevel !== undefined) {
          values.gl_account_level = mappedLevel;
          values.is_top_level_gl_account = mappedLevel === 0;
        } else {
          values.is_top_level_gl_account = false;
        }
      }

      if (values.gl_account_name) {
        values.parent_gl_account_code = selectedType;
        values.is_deleted = false;
        values.source = "Manual";
      }

      values.default_currency = selectedCurrency;
      
      // Merge fixed fields like source and cashflow_categories
      const payload = [
        {
          ...values,
          source: "Manual",
        },
      ];

      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/v2/glaccount/create`,
        { rows: payload },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      if (data.rows?.[0]?.success) {
        notify("GL Account saved successfully", "success");
        reset();
        // setCashflowCategories([]);
      } else {
        notify(data.rows?.[0]?.error || "Error saving data", "error");
      }
    } catch (error) {
      console.error("GL Account save error:", error);
      notify(
        error instanceof Error
          ? `Error saving data: ${error.message}`
          : "Error saving data",
        "error"
      );
    }
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text-dark">
          <span>GL Account Details</span>
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          {/* GL Account Code */}
          <InputGroup
            label="GL Account Code"
            name="gl_account_code"
            register={register}
            required
            errors={errors}
            placeholder="Enter GL account code"
            maxLength={50}
            pattern={{
              value: /^[A-Za-z0-9_-]+$/,
              message: "Only letters, numbers, _ and - allowed",
            }}
          />

          {/* GL Account Name */}
          <InputGroup
            label="GL Account Name"
            name="gl_account_name"
            register={register}
            required
            errors={errors}
            placeholder="Enter GL account name"
            maxLength={100}
          />

          {/* GL Account Type */}
          <DropdownGroup
            label="GL Account Type / Nature"
            name="gl_account_type"
            options={accountTypes}
            register={register}
            required
            errors={errors}
          />

          {/* Status */}

          <DropdownGroup
            label="Account Class"
            name="account_class"
            options={accountClassOptions}
            register={register}
            required
            errors={errors}
          />

          <DropdownGroup
            label="Normal Balance"
            name="normal_balance"
            options={normalBalanceOptions}
            register={register}
            required
            errors={errors}
          />

          <div className="flex gap-5">
            <InputGroup
              label="Reconciliation Required"
              name="reconciliation_required"
              type="checkbox"
              register={register}
              errors={errors}
            />
            <InputGroup
              label="Posting Allowed"
              name="posting_allowed"
              type="checkbox"
              register={register}
              errors={errors}
            />
            <InputGroup
              label="Cash/Bank"
              name="is_cash_bank"
              type="checkbox"
              register={register}
              errors={errors}
            />
          </div>

          <DropdownGroup
            label="GL Account Level"
            name="gl_account_level"
            options={GLAccountLevelOptions}
            register={register}
            required
            errors={errors}
          />

          {gl_account_level && gl_account_level !== "Level 0" && (
            <CustomSelect
              label="GL Account Company"
              options={GLParentOptions}
              selectedValue={selectedType}
              onChange={(value) => {
                setSelectedType(value);
              }}
              placeholder="Select company"
              isClearable={false}
            />
          )}

          <div className="flex gap-2">
            <InputGroup
              label="Effective From"
              name="effective_from"
              type="date"
              register={register}
              required
              errors={errors}
            />
            <InputGroup
              label="Effective To"
              name="effective_to"
              type="date"
              register={register}
              required
              errors={errors}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Default Currency"
              options={currencyOptions}
              selectedValue={selectedCurrency}
              onChange={(value) => setSelectedCurrency(value)}
              placeholder="Select currency"
              isClearable={false}
            />

            <DropdownGroup
              label="Active Status"
              name="status"
              options={statusOptions}
              register={register}
              required
              errors={errors}
            />
          </div>

          <InputGroup
            label="Tags (comma separated)"
            name="tags"
            type="text"
            register={register}
            required
            errors={errors}
          />
          <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
            ERP Codes & Mapping
          </h2>
          <div className="col-span-3">
            <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-3 gap-4">
              <DropdownGroup
                label="ERP Type"
                name="erp_type"
                options={["Generic", "SAP", "Oracle", "Tally", "Sage"]}
                register={register}
                errors={errors}
              />
              {/* External Code / Ref */}
              <InputGroup
                label="External Code / Ref"
                name="external_code"
                type="text"
                register={register}
                errors={errors}
                placeholder="Enter external code or reference"
              />
              {/* GL Segment / Dimension */}
              <InputGroup
                label="GL Segment / COA Dimension"
                name="segment"
                type="text"
                register={register}
                errors={errors}
                placeholder="Enter GL segment or dimension"
              />

              {erpType === "SAP" && (
                <div className="col-span-3">
                  <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
                    SAP Codes
                  </h2>
                  <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-4 gap-4">
                    <InputGroup
                      label="Company Code (BUKRS)"
                      name="sap_bukrs"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter SAP Company Code"
                    />
                    <InputGroup
                      label="Chart of Accounts (KTOPL)"
                      name="sap_ktopl"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Chart of Accounts"
                    />
                    <InputGroup
                      label="GL Account (SAKNR)"
                      name="sap_saknr"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter SAP GL Account"
                    />
                    <InputGroup
                      label="Account Group (KTOKS)"
                      name="sap_ktoks"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter SAP Account Group"
                    />
                  </div>
                </div>
              )}

              {erpType === "Oracle" && (
                <div className="col-span-3">
                  <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
                    Oracle Codes
                  </h2>
                  <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-4 gap-4">
                    <InputGroup
                      label="Ledger"
                      name="oracle_ledger"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Oracle Ledger"
                    />
                    <InputGroup
                      label="COA Code"
                      name="oracle_coa"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Oracle COA Code"
                    />
                    <InputGroup
                      label="Balancing Segment"
                      name="oracle_balancing_seg"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Oracle Balancing Segment"
                    />
                    <InputGroup
                      label="Natural Account"
                      name="oracle_natural_account"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Oracle Natural Account"
                    />
                  </div>
                </div>
              )}

              {erpType === "Tally" && (
                <div className="col-span-3">
                  <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
                    Tally Codes
                  </h2>
                  <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-4 gap-4">
                    <InputGroup
                      label="Ledger Name"
                      name="tally_ledger_name"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Tally Ledger"
                    />
                    <InputGroup
                      label="Ledger Group"
                      name="tally_ledger_group"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Tally Ledger Group"
                    />
                  </div>
                </div>
              )}

              {erpType === "Sage" && (
                <div className="col-span-3">
                  <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
                    Sage Codes
                  </h2>
                  <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-4 gap-4">
                    <InputGroup
                      label="Nominal Code"
                      name="sage_nominal_code"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Sage Nominal Code"
                    />
                    <InputGroup
                      label="Cost Centre"
                      name="sage_cost_centre"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Sage Cost Centre"
                    />
                    <InputGroup
                      label="Department"
                      name="sage_department"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Sage Department"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="col-span-3 flex justify-end">
          <div className="flex gap-3">
            <div>
              <Button type="submit" onClick={handleSubmit(onSubmit)}>
                Save GL Account
              </Button>
            </div>
            <div>
              <Button type="button" color="Fade" onClick={() => reset()}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form;
