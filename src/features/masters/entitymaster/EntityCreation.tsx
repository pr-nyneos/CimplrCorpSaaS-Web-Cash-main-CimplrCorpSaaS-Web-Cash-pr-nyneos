import React, { useState } from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup.tsx";
import Button from "../../../components/ui/Button.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
// import axios from "axios";
import { CURRENCY_DATA } from "../../../constant/constants";
import nos from "../../../utils/nos.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

interface EntityCreationForm {
  entity_name: string;
  entity_short_name?: string;
  entity_level: string | number;
  parent_entity_id?: string; // If applicable
  entity_registration_number?: string;
  country: string;
  base_operating_currency: string;
  tax_identification_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  active_status: string;
  is_top_level_entity?: boolean;
  is_deleted?: boolean;
}

type CreateEntityResponse = {
  success: boolean;
  entities: {
    error: string;
    success: boolean;
  }[];
  error?: string;
};

const levelMap: Record<string, number> = {
  "Level 0": 0,
  "Level 1": 1,
  "Level 2": 2,
  "Level 3": 3,
  "Level 4": 4,
};

const entityLevelOptions = ["Level 0", "Level 1", "Level 2", "Level 3"];

const EntityCreation: React.FC = () => {
  //   const navigate = useNavigate();
  // Separate state for Parent Company and Base Operating Currency
  const [selectedParentCompany, setSelectedParentCompany] = useState("");
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [currencies, setCurrencies] = useState<
    { value: string; label: string }[]
  >([]);
  const [parentOptions, setParentOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const { notify } = useNotification();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setError,
  clearErrors,

  } = useForm<EntityCreationForm>({
    mode:"onChange"
  });
<CustomSelect
  label="Country"
  options={[{ value: "", label: "Choose country..." }, ...CURRENCY_DATA.map(c => ({ value: c.country, label: c.country }))]}
  selectedValue={selectedCountry}
  onChange={(value) => setSelectedCountry(value)}
  placeholder="Select country..."
  isRequired={true}
  error={errors.country?.message}
/>
  const validateCustomFields = () => {
  let valid = true;

  if (!selectedCountry) {
    setError("country", { type: "manual", message: "Country is required" });
    valid = false;
  } else {
    clearErrors("country");
  }

  if (!selectedBaseCurrency) {
    setError("base_operating_currency", { type: "manual", message: "Currency is required" });
    valid = false;
  } else {
    clearErrors("base_operating_currency");
  }

  if (entity_level && entity_level !== "Level 0" && !selectedParentCompany) {
    setError("parent_entity_id", { type: "manual", message: "Parent Company is required" });
    valid = false;
  } else {
    clearErrors("parent_entity_id");
  }

  return valid;
};

  const onSubmit = async (values: EntityCreationForm) => {
     if (!validateCustomFields()) return;

    if (values.entity_level && typeof values.entity_level === "string") {
      const mappedLevel = levelMap[values.entity_level];
      if (mappedLevel !== undefined) {
        values.entity_level = mappedLevel;
        values.is_top_level_entity = mappedLevel === 0;
      } else {
        values.is_top_level_entity = false;
      }
    }

    if (values.entity_name) {
      values.parent_entity_id = selectedParentCompany;
      values.is_deleted = false;
      values.base_operating_currency = selectedBaseCurrency;
      values.country = selectedCountry;
    }

    setIsSubmitting(true);
    try {
      const response = await nos.post<CreateEntityResponse>(
        `${apiBaseUrl}/master/entitycash/bulk-create-sync`,
        { entities: [values] },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = response.data;
      if (data.entities[0].success) {
        notify("Entity details saved successfully", "success");
        reset();
        setIsSubmitting(false);
      } else {
        const error = data.entities[0].error;
        setIsSubmitting(false);
        notify(`Error saving data: ${error}`, "error");
      }
    } catch (error) {
      setIsSubmitting(false);
      notify("Error saving data", "error");
    }
  };


 
  const entity_level = watch("entity_level");
  const allFieldsFilled = Boolean(
    watch("entity_name") &&
    watch("entity_level") &&
    selectedCountry &&
    (entity_level !== "Level 0" ? selectedParentCompany : true) &&
    watch("active_status")
  );


  React.useEffect(() => {
    if (
      entity_level &&
      entity_level !== "Level 0" &&
      typeof entity_level === "string"
    ) {
      const levelNumber = Number(entity_level.replace("Level ", ""));
      nos
        .post<{ results: { id: string; name: string }[]; success: boolean }>(
          `${apiBaseUrl}/master/entitycash/find-parent-at-level`,
          { level: levelNumber }
        )
        .then((response) => {
          if (response.data.success && response.data.results) {
            setParentOptions(
              response.data.results.map((item) => ({
                value: item.id,
                label: item.name,
              }))
            );
          } else {
            setParentOptions([]);
          }
        })
        .catch(() => setParentOptions([]));
    } else {
      setParentOptions([]);
    }
  }, [entity_level]);

  React.useEffect(() => {
    nos
      .post<{
        results: { currency_code: string; decimal_place: number }[];
        success: boolean;
      }>(`${apiBaseUrl}/master/currency/active-approved`)
      .then((response) => {
        if (response.data.success && response.data.results) {
          setCurrencies(
            response.data.results.map((c) => ({
              value: c.currency_code,
              label: c.currency_code,
            }))
          );
        } else {
          setCurrencies([]);
        }
      })
      .catch(() => setCurrencies([]));
  }, []);

  return (
    <>
      <div className="flex justify-center">
        <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
          <h2 className="text-xl font-semibold text-secondary-text-dark">
            Entity User Form
          </h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-3 gap-x-6 gap-y-4"
          >
          
            <InputGroup
              label="Entity Name"
              name="entity_name"
              register={register}
              required
              errors={errors}
              maxLength={100}
            />
           
            <InputGroup
              label="Entity Short Name"
              name="entity_short_name"
              register={register}
              errors={errors}
              maxLength={50}
            />
         
            <DropdownGroup
              label="Entity Level"
              name="entity_level"
              options={entityLevelOptions}
              register={register}
              required
              errors={errors}
            />
         
            {entity_level && entity_level !== "Level 0" && (
              <CustomSelect
                label="Parent Company"
                options={parentOptions}
                selectedValue={selectedParentCompany}
                onChange={(value) => {
                  setSelectedParentCompany(value);
                }}
                placeholder="Select company"
                isClearable={false}
              />
            )}
          
            <InputGroup
              label="Entity Registration Number"
              name="entity_registration_number"
              register={register}
              pattern={/^[a-zA-Z0-9]*$/}
            />
      
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

           
            <CustomSelect
              label="Base Operating Currency"
              options={currencies}
              selectedValue={selectedBaseCurrency}
              onChange={(value) => {
                setSelectedBaseCurrency(value);
              }}
              placeholder="Select currency"
              isClearable={false}
              isRequired={true}
            />
           
            <InputGroup
              label="Tax Identification Number"
              name="tax_identification_number"
              register={register}
              pattern={/^[a-zA-Z0-9]*$/}
            />
          
            <InputGroup
              label="Address Line 1"
              name="address_line1"
              register={register}
              maxLength={100}
            />
           
            <InputGroup
              label="Address Line 2"
              name="address_line2"
              register={register}
              maxLength={100}
            />
          
            <InputGroup
              label="City"
              name="city"
              register={register}
              maxLength={50}
            />
         
            <InputGroup
              label="State/Province"
              name="state_province"
              register={register}
              maxLength={50}
            />
           
            <InputGroup
              label="Postal Code"
              name="postal_code"
              register={register}
              maxLength={20}
            />
            
            <InputGroup
              label="Contact Person Name"
              name="contact_person_name"
              register={register}
              maxLength={100}
            />
          
            <InputGroup
              label="Contact Person Email"
              name="contact_person_email"
              register={register}
              type="email"
              pattern={/^[^@\s]+@[^@\s]+\.[^@\s]+$/}
            />
           
            <InputGroup
              label="Contact Person Phone"
              name="contact_person_phone"
              register={register}
              pattern={/^[0-9+\-\s]*$/}
            />
           
            <DropdownGroup
              label="Active Status"
              name="active_status"
              options={["Active", "Inactive"]}
              register={register}
              required
              errors={errors}
            />
            <div className="col-span-3 flex justify-end">
              <div className="w-[8rem]">
                <Button
                  type="submit"
                  color={allFieldsFilled ? "Green" : "Disable"}
                  disabled={!allFieldsFilled || isSubmitting} 
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EntityCreation;
