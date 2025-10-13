import React from "react";

import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";

const counterparty_types = ["Vendor", "Customer", "Employee", "Intercompany"];
const cashflowCategoryOptions = ["NN","Operating", "Investing", "Financing"];
const paymentTermsOptions = ["Net 30", "Net 60", "Net 90"];
const riskRatingOptions = ["Low", "Medium", "High"];
const statusOptions = ["Choose...", "Active", "Inactive"];
const inputMethodOptions = ["Manual"]; // fixed option

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Type for form values
type CounterpartyMasterFormValue = {
  counterparty_code: string;
  counterparty_name: string;
  legal_name: string;
  counterparty_type: string;
  tax_id?: string;
  address?: string;
  // city?: string;
  // state?: string;
  // zip?: string;
  // country?: string;
  // phone?: string;
  // email?: string;
  erp_ref_id ?: string;
  default_cashflow_category?: string;
  default_payment_terms?: string;
  internal_risk_rating?: string;
  treasury_rm?: string;
  status: string;
  system_counterparty_id?: string;
  input_method?: string;
  // cashflow_categories and source are added in payload, not in form
};


type APIResponnse={
  success: boolean;
  rows: { success: boolean; error?: string }[];
}

const Form: React.FC = () => {
  // const [cashflowCategories, setCashflowCategories] = useState<any[]>([]);
  const { notify } = useNotification();

  const onSubmit = async (values: CounterpartyMasterFormValue) => {
    try {
    
      if(values.status){
        values.system_counterparty_id = values.counterparty_code;
      }
      const payload = {
        ...values,
      };

      const response = await nos.post<APIResponnse>(
        `${apiBaseUrl}/master/counterparty/create`,
        {rows :  [payload]},
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      if ("success" in data && data.rows[0].success) {
        notify("GL Account saved successfully", "success");
        reset();
        // setCashflowCategories([]);
      } else {
        notify(response.data.rows[0].error || "Error saving data", "error");
      }
    } catch (error) {
      notify("Error saving data", "error");
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CounterpartyMasterFormValue>();

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
          {/* Existing fields */}
          <InputGroup
            label="Counterparty Code"
            name="counterparty_code"
            register={register}
            required
            errors={errors}
            placeholder="Enter unique code"
            maxLength={50}
            pattern={{
              value: /^[A-Za-z0-9_-]+$/,
              message: "Only letters, numbers, _ and - allowed",
            }}
          />
          <InputGroup
            label="Counterparty Name"
            name="counterparty_name"
            register={register}
            required
            errors={errors}
            placeholder="Enter counterparty name"
            maxLength={50}
            pattern={{
              value: /^[A-Za-z0-9_-]+$/,
              message: "Only letters, numbers, _ and - allowed",
            }}
          />
          <InputGroup
            label="Legal Name"
            name="legal_name"
            register={register}
            required
            errors={errors}
            placeholder="Enter legal name"
            maxLength={100}
          />
          <DropdownGroup
            label="Counterparty Type"
            name="counterparty_type"
            options={counterparty_types}
            register={register}
            required
            errors={errors}
          />
          <InputGroup
            label="Tax ID / Business ID"
            name="tax_id"
            register={register}
            errors={errors}
            placeholder="Enter tax or business ID"
            maxLength={50}
          />
          <InputGroup
            label="ERP Reference ID"
            name="erp_ref_id"
            register={register}
            errors={errors}
            placeholder="Enter ERP Reference ID"
            maxLength={50}
          />
          
          {/* <InputGroup
            label="Address"
            name="address"
            register={register}
            errors={errors}
            placeholder="Enter registered address"
            maxLength={200}
          /> */}
          {/* <InputGroup
            label="City"
            name="city"
            register={register}
            errors={errors}
            placeholder="Enter city"
            maxLength={100}
          />
          <InputGroup
            label="State / Province"
            name="state"
            register={register}
            errors={errors}
            placeholder="Enter state or province"
            maxLength={100}
          />
          <InputGroup
            label="ZIP / Postal Code"
            name="zip"
            register={register}
            errors={errors}
            placeholder="Enter ZIP or postal code"
            maxLength={20}
          />
          <InputGroup
            label="Country"
            name="country"
            register={register}
            errors={errors}
            placeholder="Enter country"
            maxLength={100}
          />
          <InputGroup
            label="Phone Number"
            name="phone"
            register={register}
            errors={errors}
            placeholder="Enter phone number"
            maxLength={20}
            pattern={{
              value: /^[0-9-+() ]+$/,
              message: "Invalid phone number",
            }}
          /> */}
          {/* <InputGroup
            label="Email Address"
            name="email"
            register={register}
            errors={errors}
            placeholder="Enter email address"
            maxLength={100}
            pattern={{
              value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
              message: "Invalid email address",
            }}
          /> */}

          {/* New Fields */}
          <DropdownGroup
            label="Default Cashflow Category"
            name="default_cashflow_category"
            options={cashflowCategoryOptions}
            register={register}
            errors={errors}
          />

          <DropdownGroup
            label="Default Payment Terms"
            name="default_payment_terms"
            options={paymentTermsOptions}
            register={register}
            errors={errors}
          />

          <DropdownGroup
            label="Internal Risk Rating"
            name="internal_risk_rating"
            options={riskRatingOptions}
            register={register}
            errors={errors}
          />

          <InputGroup
            label="Treasury RM"
            name="treasury_rm"
            register={register}
            errors={errors}
            placeholder="Enter Treasury Relationship Manager"
            maxLength={100}
          />

          <DropdownGroup
            label="Active Status"
            name="status"
            options={statusOptions}
            register={register}
            required
            errors={errors}
          />

          {/* Disabled Fields */}
          <InputGroup
            label="System Counterparty ID"
            name="system_counterparty_id"
            register={register}
            errors={errors}
            // placeholder="Auto-generated"
            // disabled
          />

          <DropdownGroup
            label="Input Method"
            name="input_method"
            options={inputMethodOptions}
            register={register}
            errors={errors}
            // defaultValue="Manual"
            disabled
          />
          <div className="col-span-3 flex justify-end">
            <div className="flex gap-3">
              <div>
                <Button type="submit">Save Bank Details</Button>
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

export default Form;
