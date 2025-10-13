import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import nos from "../../../utils/nos.tsx";
import { type ManualEntryAPIResponse } from "../../../types/type.ts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export type PayableReceivableForm = {
  type_code: string;
  type_name: string;
  direction: "Payable" | "Receivable";
  category: "Invoice" | string;
  business_unit_division?: string;
  default_currency: string | null;
  default_due_days: number;
  payment_terms_name?: string;
  allow_netting?: boolean;
  settlement_discount?: boolean;
  settlement_discount_percent?: number;
  tax_applicable?: boolean;
  tax_code?: string;
  default_recon_gl?: string;
  offset_revenue_expense_gl?: string;
  cash_flow_category: string | null ;
  effective_from: string;
  effective_to?: string;
  tags: string;
  status: string;

  erp_type?: string;
  external_code?: string;
  erp_segment?: string;

  //SAP Specific Fields
  sap_company_code?: string;
  sap_fi_doc_type?: string;
  sap_posting_key_debit?: string;
  sap_posting_key_credit?: string;
  sap_reconciliation_gl?: string;
  sap_tax_code?: string;

  //Oracle Specific Fields
  oracle_ledger?: string;
  oracle_transaction_type?: string;
  oracle_distribution_set?: string;
  oracle_source?: string;

  //Tally Specific Fields
  tally_voucher_type?: string;
  tally_tax_class?: string;
  tally_ledger_group?: string;

  //Sage Specific Fields
  sage_nominal_control?: string;
  sage_analysis_code?: string;
};

// Example options for dropdowns
const directionOptions = ["Payable", "Receivable"];
const categoryOptions = [
  "Invoice",
  "Credit Note",
  "Debit Note",
  "Advance",
  "Refund",
  "Chargeback",
  "Interest",
  "Other",
];

const statusOptions = ["Active", "Inactive"];

// Define your options for Cash Flow Category
const Form: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCashFlowCategory, setSelectedCashFlowCategory] =
    useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [BUEntityOptions, setBUEntityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [currencyOptions, setCurrencyOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const [cashFlowCategoryOptions, setCashFlowCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectBUEntity, setselectBUEntity] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
    watch,
  } = useForm<PayableReceivableForm>();
  const { notify } = useNotification();

  // Watch the settlement_discount checkbox value
  const settlement_discount = useWatch({
    control,
    name: "settlement_discount",
    defaultValue: false,
  });

  // Watch the tax_applicable checkbox value
  const tax_applicable = useWatch({
    control,
    name: "tax_applicable",
    defaultValue: false,
  });

  const onSubmit = async (values: PayableReceivableForm) => {
    setIsSubmitting(true);
    values.business_unit_division = selectBUEntity;
    values.default_currency = selectedCurrency;
    values.cash_flow_category = selectedCashFlowCategory;
    // values.erp_type = values.external_code ? values.erp_type : "";
    values.default_due_days = Number(values.default_due_days) || 0;
    values.settlement_discount_percent =Number(values.settlement_discount_percent) || 0;
    try {
      const payload = [
        {
          ...values,
          source: "Manual",
        },
      ];

      const response = await nos.post<ManualEntryAPIResponse>(
        `${apiBaseUrl}/master/v2/payablereceivable/create`,
        { rows: payload },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = response.data;
      if (data.rows[0].success) {
        notify("Payable Receivable details saved successfully", "success");
        reset();
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

  const erpType = watch("erp_type");

  React.useEffect(() => {
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

    // Fetch Cash Flow Category Names
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

    

    // Fetch Currency Options
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

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text-dark">
          <span>Payable Receivable Type Details</span>
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          <InputGroup
            label="Type Code"
            name="type_code"
            register={register}
            required
            errors={errors}
            maxLength={50}
          />
          <InputGroup
            label="Type Name"
            name="type_name"
            register={register}
            required
            errors={errors}
            maxLength={100}
          />
          <DropdownGroup
            label="Direction"
            name="direction"
            options={directionOptions}
            register={register}
            required
            errors={errors}
          />
          <DropdownGroup
            label="Category"
            name="category"
            options={categoryOptions}
            register={register}
            required
            errors={errors}
          />
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
          <CustomSelect
            label="Default Currency"
            options={currencyOptions}
            selectedValue={selectedCurrency}
            onChange={(value) => setSelectedCurrency(value)}
            placeholder="Select currency"
            isClearable={false}
          />

          <InputGroup
            label="Payment Terms Name"
            name="payment_terms_name"
            register={register}
            errors={errors}
            maxLength={100}
          />

          <div className="flex gap-2 justify-between items-center">
            <InputGroup
              label="Allow Netting"
              name="allow_netting"
              type="checkbox"
              register={register}
              errors={errors}
            />

            <div className="w-1/2">
              <InputGroup
                label="Default Due Days"
                name="default_due_days"
                type="number"
                register={register}
                errors={errors}
                min={0}
              />
            </div>
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-1">
              <InputGroup
                label="Settlement Discount"
                name="settlement_discount"
                type="checkbox"
                register={register}
                errors={errors}
              />
              {settlement_discount && (
                <InputGroup
                  label="Percentage"
                  name="settlement_discount_percent"
                  type="number"
                  register={register}
                  max={100}
                  errors={errors}
                  maxLength={3}
                />
              )}
            </div>

            <div className="flex gap-1">
              <InputGroup
                label="Tax Applicable"
                name="tax_applicable"
                type="checkbox"
                register={register}
                errors={errors}
              />
              {tax_applicable && (
                <InputGroup
                  label="Tax Code"
                  name="tax_code"
                  register={register}
                  errors={errors}
                  maxLength={50}
                />
              )}
            </div>
          </div>

          <InputGroup
            label="Default Recon GL"
            name="default_recon_gl"
            register={register}
            errors={errors}
            maxLength={50}
          />
          <InputGroup
            label="Offset Revenue/Expense GL"
            name="offset_revenue_expense_gl"
            register={register}
            errors={errors}
            maxLength={50}
          />
          <CustomSelect
            label="Cash Flow Category"
            options={cashFlowCategoryOptions}
            selectedValue={selectedCashFlowCategory}
            onChange={(value) => {
              setSelectedCashFlowCategory(value);
            }}
            placeholder="Select category"
            isClearable={false}
          />

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
            register={register}
            errors={errors}
            maxLength={200}
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
              <InputGroup
                label="External Code / Ref"
                name="external_code"
                type="text"
                register={register}
                errors={errors}
                placeholder="Enter external code or reference"
              />
              <InputGroup
                label="Segment / Dimension"
                name="erp_segment"
                type="text"
                register={register}
                errors={errors}
                placeholder="Enter segment or dimension"
              />

              {erpType === "SAP" && (
                <div className="col-span-3">
                  <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
                    SAP F1 Mapping
                  </h2>
                  <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-4 gap-4">
                    <InputGroup
                      label="Company Code (BUKRS)"
                      name="sap_company_code"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter SAP Company Code"
                    />
                    <InputGroup
                      label="FI Doc Type (BLART)"
                      name="sap_fi_doc_type"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter FI Doc Type"
                    />
                    <InputGroup
                      label="Posting Key (Debit)"
                      name="sap_posting_key_debit"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Posting Key (Debit)"
                    />
                    <InputGroup
                      label="Posting Key (Credit)"
                      name="sap_posting_key_credit"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Posting Key (Credit)"
                    />
                    <InputGroup
                      label="Reconciliation GL"
                      name="sap_reconciliation_gl"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Reconciliation GL"
                    />
                    <InputGroup
                      label="Tax Code (MWSKZ)"
                      name="sap_tax_code"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Tax Code (MWSKZ)"
                    />
                  </div>
                </div>
              )}

              {erpType === "Oracle" && (
                <div className="col-span-3">
                  <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
                    Oracle AP/AR Mapping
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
                      label="Transaction Type"
                      name="oracle_transaction_type"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Transaction Type"
                    />
                    <InputGroup
                      label="Source"
                      name="oracle_source"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Source"
                    />
                    <InputGroup
                      label="Distribution Set"
                      name="oracle_distribution_set"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Distribution Set"
                    />
                  </div>
                </div>
              )}

              {erpType === "Tally" && (
                <div className="col-span-3">
                  <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
                    Tally Mapping
                  </h2>
                  <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-4 gap-4">
                    <InputGroup
                      label="Ledger Group"
                      name="tally_ledger_group"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Ledger Group"
                    />
                    <InputGroup
                      label="Voucher Type"
                      name="tally_voucher_type"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Voucher Type"
                    />
                    <InputGroup
                      label="Tax Class"
                      name="tally_tax_class"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Tax Class"
                    />
                  </div>
                </div>
              )}

              {erpType === "Sage" && (
                <div className="col-span-3">
                  <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
                    Sage Mapping
                  </h2>
                  <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-4 gap-4">
                    <InputGroup
                      label="Nominal Control"
                      name="sage_nominal_control"
                      type="text"
                      register={register}
                      required
                      errors={errors}
                      placeholder="Enter Sage Nominal Control"
                    />
                    <InputGroup
                      label="Analysis Code"
                      name="sage_analysis_code"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Sage Analysis Code"
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
              <Button
                type="submit"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Save"}
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
