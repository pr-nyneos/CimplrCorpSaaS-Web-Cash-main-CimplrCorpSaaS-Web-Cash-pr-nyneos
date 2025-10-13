import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { bankMasterSchema } from "./validationSchema"; // adjust path as needed

import Button from "../../../components/ui/Button";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import type { BankMasterFormValue } from "../../../types/masterType";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import { CURRENCY_DATA } from "../../../constant/constants";
import { useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const Connectivity = ["Choose...", "API", "File Transfer", "Database", "Others"];
const statusOptions = ["Choose...", "Active", "Inactive"];

export type CreateBankMasterSuccess = { success: true; bank_id: string };
export type CreateBankMasterError = { error: string };
export type CreateBankMasterResponse = CreateBankMasterSuccess | CreateBankMasterError;

function BankMaster() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<BankMasterFormValue>({
  resolver: yupResolver(bankMasterSchema),
  mode: "onSubmit",
});


  const [selectedHeadquarters, setSelectedHeadquarters] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { notify } = useNotification();
<CustomSelect
  label="Country of Headquarters"
  options={[{ value: "", label: "Choose..." }, ...CURRENCY_DATA.map((c) => ({ value: c.country, label: c.country }))]}
  selectedValue={selectedHeadquarters}
  onChange={(value) => {
    setSelectedHeadquarters(value);
    setValue("country_of_headquarters", value);
  }}
  placeholder="Select country code..."
  isRequired={true}
  error={errors.country_of_headquarters?.message}
/>
  // const validateDropdowns = () => {
  //   let valid = true;

  //   if (watch("connectivity_type") === "Choose...") {
  //     setError("connectivity_type", { type: "manual", message: "Please select a valid connectivity type" });
  //     valid = false;
  //   } else {
  //     clearErrors("connectivity_type");
  //   }

  //   if (watch("active_status") === "Choose...") {
  //     setError("active_status", { type: "manual", message: "Please select a valid status" });
  //     valid = false;
  //   } else {
  //     clearErrors("active_status");
  //   }

  //   if (!selectedHeadquarters) {
  //     setError("country_of_headquarters", { type: "manual", message: "Please select a country" });
  //     valid = false;
  //   } else {
  //     clearErrors("country_of_headquarters");
  //   }

  //   return valid;
  // };

  const onSubmit = async (values: BankMasterFormValue) => {
    //if (!validateDropdowns()) return;

    setIsSubmitting(true);
    try {
      values.country_of_headquarters = selectedHeadquarters;
      const response = await nos.post<CreateBankMasterResponse>(
        `${apiBaseUrl}/master/bank/create`,
        values,
        { headers: { "Content-Type": "application/json" } }
      );
      const data = response.data;
      if ("success" in data && data.success) {
        notify("Bank details saved successfully", "success");
        reset();
        setSelectedHeadquarters("");
      } else {
        notify("Error saving data", "error");
      }
    } catch (error) {
      notify("Error saving data", "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text-dark">Enter Bank Master Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-3 gap-x-6 gap-y-4">
          <InputGroup label="Bank Name" name="bank_name" register={register} required maxLength={100} errors={errors} />
          <InputGroup label="Bank Short Name" name="bank_short_name" register={register} maxLength={50} errors={errors} />
          <InputGroup
            label="SWIFT/BIC Code"
            name="swift_bic_code"
            register={register}
            maxLength={11}
           
            pattern={{
              value: /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/,
              message: "Must be 8 or 11 alphanumeric characters",
            }}
            errors={errors}
          />

          <CustomSelect
            label="Country of Headquarters"
            options={[{ value: "", label: "Choose..." }, ...CURRENCY_DATA.map((c) => ({ value: c.country, label: c.country }))]}
            selectedValue={selectedHeadquarters}
            onChange={(value) => setSelectedHeadquarters(value)}
            placeholder="Select country code..."
            isRequired={true}
            error={errors.country_of_headquarters?.message}
          />

          <DropdownGroup
            label="Connectivity Type"
            name="connectivity_type"
            options={Connectivity}
            register={register}
            required
            errors={errors}
          />

          <DropdownGroup
            label="Active Status"
            name="active_status"
            options={statusOptions}
            register={register}
            required
            errors={errors}
          />

          <InputGroup label="Bank Contact Name" name="contact_person_name" register={register} maxLength={100} errors={errors} />
          <InputGroup label="Bank Contact Email" name="contact_person_email" type="email" register={register} errors={errors} />
          <InputGroup
            label="Bank Contact Phone"
            name="contact_person_phone"
            type="tel"
            register={register}
            pattern={{
              value: /^[0-9+\-]*$/,
              message: "Only numbers, +, - allowed",
            }}
            errors={errors}
          />

          <InputGroup label="Bank Address Line 1" name="address_line1" register={register} maxLength={100} errors={errors} />
          <InputGroup label="Bank Address Line 2" name="address_line2" register={register} maxLength={100} errors={errors} />
          <InputGroup label="City" name="city" register={register} maxLength={50} errors={errors} />
          <InputGroup label="State/Province" name="state_province" register={register} maxLength={50} errors={errors} />
          <InputGroup
            label="Postal Code"
            name="postal_code"
            register={register}
            maxLength={20}
            pattern={{
              value: /^[A-Za-z0-9]*$/,
              message: "Only alphanumeric allowed",
            }}
            errors={errors}
          />

          <div className="col-span-3 flex justify-end">
            <div className="flex gap-3">
              <Button type="submit" color={isSubmitting ? "Disable" : "Green"} disabled={isSubmitting}>
                {isSubmitting ? "Saving Bank Details..." : "Save Bank Details"}
              </Button>
              <Button type="button" color="Fade" onClick={() => reset()}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BankMaster;