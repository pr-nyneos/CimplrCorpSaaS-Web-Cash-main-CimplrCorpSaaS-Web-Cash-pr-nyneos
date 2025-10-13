import { useForm } from "react-hook-form";
import Button from "../../../components/ui/Button";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import nos from "../../../utils/nos.tsx";
import { useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type RoleFormValue = {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
};

export type CreateRoleSuccess = {
  success: true;
  id: string;
};

export type CreateRoleError = {
  error: string;
};

export type CreateRoleResponse = CreateRoleSuccess | CreateRoleError;

const RoleCreationForm = () => {
  const { notify } = useNotification();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RoleFormValue>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      startTime: "",
      endTime: "",
      isOvernight: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const watchAll = watch();
  const allFieldsFilled = Boolean(
    watchAll.name &&
      watchAll.description &&
      watchAll.startTime &&
      watchAll.endTime
  );

  const onSubmit = async (values: RoleFormValue) => {
    setIsSubmitting(true);

    if (!values.isOvernight && values.startTime >= values.endTime) {
      notify("Start time must be before end time.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: values.name,
        rolecode: values.name.toUpperCase().trim(),
        description: values.description,
        office_start_time_ist: values.startTime,
        office_end_time_ist: values.endTime,
        is_overnight: values.isOvernight,
        created_by: localStorage.getItem("userEmail"),
      };

      const response = await nos.post<CreateRoleResponse>(
        `${apiBaseUrl}/uam/roles/create-role`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      if ("success" in data && data.success) {
        notify("Role created successfully!", "success");
        reset();
      } else {
        notify("Failed to create role.", "error");
      }
    } catch (error: any) {
      console.error("Role creation error:", error);
      notify(
        `Failed to create role. ${error?.response?.data?.error || error.message || ""}`,
        "error"
      );
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border text-secondary-text border-border bg-secondary-color-lt shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text">
          Create User Role
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          <InputGroup
            label="Role Name"
            name="name"
            register={register}
            required
            maxLength={50}
            errors={errors}
          />

          <InputGroup
            label="Description"
            name="description"
            register={register}
            required
            maxLength={200}
            errors={errors}
          />

          <InputGroup
            label="Office Start Time (IST)"
            name="startTime"
            type="time"
            register={register}
            required
            errors={errors}
          />

          <InputGroup
            label="Office End Time (IST)"
            name="endTime"
            type="time"
            register={register}
            required
            errors={errors}
          />

          <div className="col-span-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="isOvernight"
              {...register("isOvernight")}
              className="accent-primary"
            />
            <label
              htmlFor="isOvernight"
              className="text-sm text-secondary-text"
            >
              End time is next day (overnight shift)
            </label>
          </div>

          <div className="col-span-3 flex justify-end mt-4 gap-3">
            <div>
              <Button type="button" color="Fade" onClick={() => reset()}>
                Reset
              </Button>
            </div>
            <div>
              <Button
                type="submit"
                color={allFieldsFilled ? "Green" : "Disable"}
                disabled={!allFieldsFilled || isSubmitting}
              >
                {isSubmitting ? "Saving Role..." : "Save Role"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default RoleCreationForm;
