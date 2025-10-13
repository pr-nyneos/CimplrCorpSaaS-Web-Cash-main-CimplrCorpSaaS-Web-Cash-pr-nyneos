import React from "react";
import { useForm } from "react-hook-form";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import DropdownGroup from "../../../components/ui/DropdownGroup";
import Button from "../../../components/ui/Button";
const bankOptions = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank"];
const entityOptions = ["Entity A", "Entity B", "Entity C"];
const accountOptions = ["Account 1", "Account 2", "Account 3"];

const ERP: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border bg-secondary-color-lt border-border shadow-md space-y-6 w-full max-w-full">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold text-secondary-text-dark">
            <span>Fetch Bank Statements</span>
          </h2>
          <div className="flex items-center justify-end gap-x-4 gap-2">
            <div>
              <Button onClick={() => {}}>Fetch Statements</Button>
            </div>
            <div>
              <Button onClick={() => reset()} color="Fade">
                Reset
              </Button>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          {/* Select Bank */}
          <DropdownGroup
            label="Select Bank"
            name="bank"
            options={bankOptions}
            register={register}
            required
            errors={errors}
          />

          {/* Select Entity */}
          <DropdownGroup
            label="Select Entity"
            name="entity"
            options={entityOptions}
            register={register}
            required
            errors={errors}
          />

          {/* Select Account */}
          <DropdownGroup
            label="Select Account"
            name="account"
            options={accountOptions}
            register={register}
            required
            errors={errors}
          />

          {/* From Date */}
          <InputGroup
            label="From Date"
            name="from_date"
            type="date"
            register={register}
            required
            errors={errors}
          />

          {/* To Date */}
          <InputGroup
            label="To Date"
            name="to_date"
            type="date"
            register={register}
            required
            errors={errors}
          />
        </form>
      </div>
    </div>
  );
};

export default ERP;
