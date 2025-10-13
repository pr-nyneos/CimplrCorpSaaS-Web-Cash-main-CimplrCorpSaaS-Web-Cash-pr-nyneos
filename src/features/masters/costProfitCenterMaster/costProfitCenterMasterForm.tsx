import React, { useState } from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import CustomSelect from "../../../components/ui/SearchSelect.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
import nos from "../../../utils/nos.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";

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
const inputSourceOptions = ["Manual"];

const entityLevelOptions = ["Level 0", "Level 1", "Level 2", "Level 3"];

export type CostProfitCenterFormValue = {
  centre_code: string;
  centre_name: string;
  centre_type: string;
  parent_centre_code: string;
  // entity_code: string;
  entity_code: string;
  status: string;
  source: string;
  erp_ref: string;
  centre_level: string | number;
  is_top_level_centre?: boolean;
  is_deleted?: boolean;
};

type CreateCostProfitCenterResponse = {
  success: boolean;
  rows: {
    error: string;
    success: boolean;
  }[];
  error?: string;
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

      const response = await nos.post<CreateCostProfitCenterResponse>(
        `${apiBaseUrl}/master/costprofit-center/bulk-create-sync`,
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
          results: { centre_id: string; centre_name: string }[];
          success: boolean;
        }>(`${apiBaseUrl}/master/costprofit-center/find-parent-at-level`, {
          level: levelNumber,
        });

        if (response.data.success && response.data.results) {
          const options = response.data.results.map((item) => ({
            value: item.centre_id,
            label: item.centre_name,
          }));
          setParentOptions(options);
        } else {
          setParentOptions([]);
        }
      } catch (error) {
        setParentOptions([]);
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
              label="Parent Centre Level"
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
          <DropdownGroup
            label="Source"
            name="source"
            options={inputSourceOptions}
            register={register}
            errors={errors}
            // defaultValue="Manual"
            disabled
          />
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
