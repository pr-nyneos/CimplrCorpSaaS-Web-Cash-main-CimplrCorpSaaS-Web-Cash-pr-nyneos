import React, { useState } from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import {type ManualEntryAPIResponse} from "../../../types/type.ts"
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const centreTypes = ["Cost", "Profit"];
const statusOptions = ["Active", "Inactive"];

const levelMap: Record<string, number> = {
  "Level 0": 0,
  "Level 1": 1,
  "Level 2": 2,
  "Level 3": 3,
  "Level 4": 4,
};

const entityLevelOptions = ["Level 0", "Level 1", "Level 2", "Level 3"];

export type CostProfitCenterFormValue = {
  centre_code: string;
  centre_name: string;
  centre_type: string;
  parent_centre_code: string;
  entity_code: string;
  status: string;
  source: string;
  erp_ref?: string;
  centre_level: string | number;
  is_top_level_centre?: boolean;
  is_deleted?: boolean;

  // Additional fields from the form
  owner_manager?: string;
  owner_email?: string;
  effective_from?: string;
  effective_to?: string;
  tags?: string;
  default_currency?: string;

  //Generic
  // erp_ref?: string;
  external_code?: string;
  gl_segment?: string;

  //SAP
  sap_controlling_area?: string;
  sap_company_code?: string;
  sap_cost_center?: string;

  // Oracle-specific
  oracle_ledger?: string;
  oracle_dept_segment?: string;
  oracle_profit_center_segment?: string;

  // Tally-specific
  tally_ledger?: string;
  tally_ledger_group?: string;

  // Sage-specific
  sage_department_code?: string;
  sage_ost_centre_code?: string;
};



const Form: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentOptions, setParentOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedType, setSelectedType] = useState("");
  const [businessUnitOptions, setBusinessUnitOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CostProfitCenterFormValue>();

  const centre_level = watch("centre_level");
  const erpType = watch("erp_ref");

  const { notify } = useNotification();

  const onSubmit = async (values: CostProfitCenterFormValue) => {
    if (values.centre_level && typeof values.centre_level === "string") {
      const mappedLevel = levelMap[values.centre_level];
      if (mappedLevel !== undefined) {
        values.centre_level = mappedLevel;
        values.is_top_level_centre = mappedLevel === 0;
      } else {
        values.is_top_level_centre = false;
      }
    }

    if (values.centre_name) {
      values.parent_centre_code = selectedType;
      values.is_deleted = false;
      values.source = "Manual";
    }

    values.entity_code = selectedBusinessUnit;

    setIsSubmitting(true);
    try {
      const payload = [
        {
          ...values,
          source: "Manual",
          erp_ref: "",
        },
      ];

      const response = await nos.post<ManualEntryAPIResponse>(
        `${apiBaseUrl}/master/v2/costprofit-center/bulk-create-sync`,
        { rows: payload },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = response.data;
      if (data.rows[0].success) {
        notify("Entity details saved successfully", "success");
        reset();
      } else {
        const error = data.rows[0].error;
        notify(`Error saving data: ${error}`, "error");
      }
    } catch (error) {
      // Properly handle the exception: log it for debugging and notify the user
      console.error("Error saving data:", error);
      notify("Error saving data", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    const fetchParentOptions = async () => {
      if (!centre_level || centre_level === "Level 0") {
        setParentOptions([]);
        console.log(
          "Centre level is Level 0 or undefined, clearing parent options"
        );
        return;
      }

      const levelNumber = Number(
        typeof centre_level === "string"
          ? centre_level.replace("Level ", "")
          : centre_level
      );
      console.log(
        "Centre level changed, fetching parent options for level:",
        levelNumber
      );

      try {
        const response = await nos.post<{
          results: { centre_id: string; centre_name: string ;centre_code: string}[];
          success: boolean; 
          error: boolean;
        }>(`${apiBaseUrl}/master/v2/costprofit-center/find-parent-at-level`, {
          level: levelNumber,
        });

        if (response.data.success && response.data.results) {
          const options = response.data.results.map((item) => ({
            value: item.centre_code,
            label: item.centre_code,
          }));
          setParentOptions(options);
        } else {
          setParentOptions([]);
        }
      } catch (error) {
        setParentOptions([]);
        notify(
          `Error fetching parent options: ${
            error instanceof Error ? error.message : String(error)
          }`,
          "error"
        );
      }
    };

    fetchParentOptions();
  }, [centre_level]);

  React.useEffect(() => {
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
          setBusinessUnitOptions(
            response.data.results.map((item) => ({
              value: item.entity_name,
              label: item.entity_name,
            }))
          );
        } else {
          setBusinessUnitOptions([]);
        }
      })
      .catch(() => setBusinessUnitOptions([]));
  }, []);

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold text-secondary-text-dark">
            <span>Enter Centre Details</span>
          </h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          {/* Centre Code/ID */}
          <InputGroup
            label="Centre Code/ID"
            name="centre_code"
            register={register}
            required
            errors={errors}
            placeholder="Enter a unique centre code"
            maxLength={50}
            pattern={{
              value: /^[A-Za-z0-9_-]+$/,
              message: "Only letters, numbers, _ and - allowed",
            }}
          />

          {/* Centre Name */}
          <InputGroup
            label="Centre Name"
            name="centre_name"
            register={register}
            required
            errors={errors}
            placeholder='e.g., "Marketing Department", "Project Phoenix"'
            maxLength={100}
          />

          {/* Centre Type */}
          <DropdownGroup
            label="Centre Type"
            name="centre_type"
            options={centreTypes}
            register={register}
            required
            errors={errors}
          />

          {/* Business Unit/Division */}
          <CustomSelect
            label="Business Unit / Division"
            options={businessUnitOptions}
            selectedValue={selectedBusinessUnit}
            onChange={(value) => {
              setSelectedBusinessUnit(value);
            }}
            placeholder="Select Business Unit"
            isClearable={false}
          />

          {/* Owner/Manager */}
          {/* <InputGroup
            label="Owner / Manager"
            name="owner_manager"
            register={register}
            required={false}
            errors={errors}
            placeholder="Enter name of person responsible"
            maxLength={100}
          /> */}

          <DropdownGroup
            label="Centre Level"
            name="centre_level"
            options={entityLevelOptions}
            register={register}
            required
            errors={errors}
          />

          {/* Parent Entity (if any) */}
          {centre_level && centre_level !== "Level 0" && (
            <CustomSelect
              label="Parent Company"
              options={parentOptions}
              selectedValue={selectedType}
              onChange={(value) => {
                setSelectedType(value);
              }}
              placeholder="Select company"
              isClearable={false}
            />
          )}

          {/* Status */}
          <DropdownGroup
            label="Status"
            name="status"
            options={statusOptions}
            register={register}
            required
            errors={errors}
          />

          <InputGroup
            label="Owner / Manager"
            name="owner_manager"
            register={register}
            required
            errors={errors}
            placeholder="Name"
            maxLength={100}
          />

          <InputGroup
            label="Owner Email"
            name="owner_email"
            register={register}
            type="email"
            required
            errors={errors}
            placeholder="Email"
            maxLength={100}
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
          </div>

          <InputGroup
            label="Tags (comma separated)"
            name="tags"
            type="text"
            register={register}
            required
            errors={errors}
          />

          <div className="w-1/2">
            <InputGroup
              label="Default Currency"
              name="default_currency"
              type="text"
              register={register}
              required
              errors={errors}
              maxLength={3}
              pattern={{
                value: /^[A-Za-z]+$/,
                message: "Only letters allowed",
              }}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </div>

          <h2 className="text-xl font-semibold text-secondary-text-dark col-span-3 mt-2 mb-4">
            ERP Codes & Mapping
          </h2>
          <div className="col-span-3">
            <div className="p-4 rounded-lg border bg-white border-border grid grid-cols-3 gap-4">
              <DropdownGroup
                label="ERP Type"
                name="erp_ref"
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
                label="GL Segment / Dimension"
                name="gl_segment"
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
                      label="Controlling Area (KOKRS)"
                      name="sap_controlling_area"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter SAP Controlling Area"
                    />

                    <InputGroup
                      label="Company Code (BUKRS)"
                      name="sap_company_code"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter SAP Company Code"
                    />

                    <InputGroup
                      label="Cost Center (KOSTL)"
                      name="sap_cost_center"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter SAP Cost Center"
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
                      errors={errors}
                      placeholder="Enter Oracle Ledger"
                    />

                    <InputGroup
                      label="Dept Segment"
                      name="oracle_dept_segment"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Oracle Dept Segment"
                    />

                    <InputGroup
                      label="Profit Center Segment"
                      name="oracle_profit_center_segment"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Oracle Profit Center"
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
                      name="tally_ledger"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Tally Ledger"
                    />

                    <InputGroup
                      label="Ledger Group"
                      name="tally_ledger_group"
                      type="text"
                      register={register}
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
                      label="Department Code"
                      name="sage_department_code"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Sage Department Code"
                    />

                    <InputGroup
                      label="Cost Centre Code"
                      name="sage_ost_centre_code"
                      type="text"
                      register={register}
                      errors={errors}
                      placeholder="Enter Sage Cost Centre Code"
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
                {isSubmitting ? "Saving..." : "Save Cost/Profit Centre"}
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
