import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { _success } from "zod/v4/core";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Define the form value type
export interface GLAccountFormValue {
  gl_account_code: string;
  gl_account_name: string;
  gl_account_type: string;
  cashflow_categories: string[];
  active_status: "Active" | "Inactive";
  source: "Manual"; // fixed value
}

type APIResponse ={
  rows?:{success:boolean,error:string}[],
  error?:string,
  success:boolean
}

// Example GL Account types
const accountTypes = ["Asset", "Liability", "Equity", "Income", "Expense"];
// Example Cashflow Categories (to be dynamically fetched from master)
const statusOptions = ["Choose...", "Active", "Inactive"];

const Form: React.FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GLAccountFormValue>();

  const [cashflowCategoryOptions, setCashflowCategoryOptions] = useState<string[]>([]);
  const { notify } = useNotification();
  

  useEffect(() => {
    nos
      .post<{ categories: { category_id: string; category_name: string }[] }>(
        `${apiBaseUrl}/master/cashflow-category/names`
      )
      .then((response) => {
        if (response.data.categories) {
          setCashflowCategoryOptions(
            response.data.categories.map((cat) => cat.category_name)
          );
        } else {
          setCashflowCategoryOptions([]);
        }
      })
      .catch(() => setCashflowCategoryOptions([]));
  }, []);

  const onSubmit = async (values: GLAccountFormValue) => {
    try {
      // Merge fixed fields like source and cashflow_categories
      const payload = [{
        ...values,
        // cashflow_categories: cashflowCategories.map((c) => c.value), // assuming CustomSelect returns {value,label}
        source: "Manual",
        erp_ref: "",
      }];

      const response = await nos.post<APIResponse>(
        `${apiBaseUrl}/master/glaccount/create`,
        { rows: payload },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      if (data.rows && data.rows[0]?.success) {
        notify("GL Account saved successfully", "success");
        reset();
        // setCashflowCategories([]);
      } else {
        notify(data.rows && data.rows[0]?.error || "Error saving data", "error");
      }
    } catch (error) {
      notify("Error saving data", "error");
    }
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text-dark">
          <span>Enter GL Account Details</span>
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
            label="GL Account Type"
            name="gl_account_type"
            options={accountTypes}
            register={register}
            required
            errors={errors}
          />

          <DropdownGroup
            label="Cashflow Category Name"
            name="cashflow_category_name"
            options={cashflowCategoryOptions}
            register={register}
            required
            errors={errors}
          />

          {/* Cashflow Category Link (Multi-select) */}
          {/* <CustomSelect
            label="Cashflow Category Link"
            options={cashflowCategoryOptions}
            selectedValue={cashflowCategories}
            onChange={(vals) => {
              setCashflowCategories(Array.isArray(vals) ? vals : [vals]);
            }}
            placeholder="Select cashflow category(s)"
            isClearable={true}
            isMulti={true}
          /> */}

          {/* Status */}
          <DropdownGroup
            label="Active Status"
            name="status"
            options={statusOptions}
            register={register}
            required
            errors={errors}
          />
        </form>

        <div className="col-span-3 flex justify-end">
          <div className="flex gap-3">
            <div>
              <Button type="submit" onClick={handleSubmit(onSubmit)}>Save GL Account</Button>
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
