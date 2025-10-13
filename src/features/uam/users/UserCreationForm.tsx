import { useForm } from "react-hook-form";
import Button from "../../../components/ui/Button";
import InputGroup from "../../../components/ui/InputGroup.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import nos from "../../../utils/nos.tsx";
import { useState, useEffect } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

type UserFormValue = {
  authenticationType: string;
  employeeName: string;
  usernameOrEmployeeId: string;
  roleName: string;
  email: string;
  mobile: string;
  address: string;
  businessUnitName: string;
};

export type CreateUserSuccess = {
  success: true;
  id: string;
};

export type CreateUserError = {
  error: string;
};

export type CreateUserResponse = CreateUserSuccess | CreateUserError;

const UserCreationForm = () => {
  const { notify } = useNotification();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserFormValue>({
    mode: "onChange",
    defaultValues: {
      authenticationType: "LDAP",
      employeeName: "",
      usernameOrEmployeeId: "",
      roleName: "",
      email: "",
      mobile: "",
      address: "",
      businessUnitName: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [businessUnits, setBusinessUnits] = useState<string[]>([]);

  const watchAll = watch();
  const allFieldsFilled = Boolean(
    watchAll.authenticationType &&
      watchAll.employeeName &&
      watchAll.usernameOrEmployeeId &&
      watchAll.roleName &&
      watchAll.email &&
      watchAll.mobile &&
      watchAll.address &&
      watchAll.businessUnitName
  );

  // Fetch roles
  useEffect(() => {
    nos
      .post<any>(`${apiBaseUrl}/uam/roles/get-just-roles`)
      .then(({ data }) => {
        const roles = data.roles.map((role: string) => role);
        setRoles(roles);
      })
      .catch((error) => {
        console.error("Error fetching roles:", error);
        notify("Failed to load roles.", "error");
      });
  }, []);

  // Fetch business units
  useEffect(() => {
    nos
      .post<any>(`${apiBaseUrl}/master/entity/all-names`)
      .then(({ data }) => {
        setBusinessUnits(data);
      })
      .catch((err) => {
        console.error("Error fetching entity names:", err);
        notify("Failed to load business units.", "error");
      });
  }, []);

  const onSubmit = async (values: UserFormValue) => {
    setIsSubmitting(true);

    try {
      const payload = {
        authentication_type: values.authenticationType,
        employee_name: values.employeeName,
        role: values.roleName,
        username_or_employee_id: values.usernameOrEmployeeId,
        email: values.email,
        mobile: values.mobile,
        address: values.address,
        business_unit_name: values.businessUnitName,
      };

      const response = await nos.post<CreateUserResponse>(
        `${apiBaseUrl}/uam/users/create-user`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      const data = response.data;
      if ("success" in data && data.success) {
        notify("User created successfully!", "success");
        reset();
      } else {
        notify("Failed to create user.", "error");
      }
    } catch (error: any) {
      console.error("User creation error:", error);
      notify(
        `Failed to create user. ${error?.response?.data?.error || error.message || ""}`,
        "error"
      );
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-xl border text-secondary-text border-border bg-secondary-color-lt shadow-md space-y-6 w-full max-w-full">
        <h2 className="text-xl font-semibold text-secondary-text">
          Create New User
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-3 gap-x-6 gap-y-4"
        >
          <div className="col-span-1">
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Authentication Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("authenticationType", {
                required: "Please select authentication type",
              })}
              className="w-full text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            >
              <option value="ADFS">ADFS</option>
              <option value="LDAP">LDAP</option>
              <option value="CImplr">CImplr</option>
            </select>
            {errors.authenticationType && (
              <span className="text-red-500 text-sm">
                {errors.authenticationType.message}
              </span>
            )}
          </div>

          <InputGroup
            label="Employee Name"
            name="employeeName"
            register={register}
            required
            maxLength={100}
            errors={errors}
            placeholder="Enter employee name"
          />

          <InputGroup
            label="Username / Employee ID"
            name="usernameOrEmployeeId"
            register={register}
            required
            maxLength={50}
            errors={errors}
            placeholder="Enter username or employee ID"
          />

          <div className="col-span-1">
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Role Name <span className="text-red-500">*</span>
            </label>
            <select
              {...register("roleName", {
                required: "Please select a role",
              })}
              className="w-full text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            >
              <option value="" disabled>
                Select Role
              </option>
              {roles.map((role, index) => (
                <option key={index} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.roleName && (
              <span className="text-red-500 text-sm">
                {errors.roleName.message}
              </span>
            )}
          </div>

          <InputGroup
            label="Email"
            name="email"
            type="email"
            register={register}
            required
            errors={errors}
            placeholder="Enter email address"
          />

          <InputGroup
            label="Mobile"
            name="mobile"
            type="tel"
            register={register}
            required
            maxLength={15}
            errors={errors}
            placeholder="Enter mobile number"
          />

          <InputGroup
            label="Address"
            name="address"
            register={register}
            required
            maxLength={255}
            errors={errors}
            placeholder="Enter address"
          />

          <div className="col-span-1">
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Business Unit Name <span className="text-red-500">*</span>
            </label>
            <select
              {...register("businessUnitName", {
                required: "Please select a business unit",
              })}
              className="w-full text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
            >
              <option value="" disabled>
                Select Business Unit
              </option>
              {businessUnits.map((bu, index) => (
                <option key={index} value={bu}>
                  {bu}
                </option>
              ))}
            </select>
            {errors.businessUnitName && (
              <span className="text-red-500 text-sm">
                {errors.businessUnitName.message}
              </span>
            )}
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
                {isSubmitting ? "Creating User..." : "Create User"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreationForm;