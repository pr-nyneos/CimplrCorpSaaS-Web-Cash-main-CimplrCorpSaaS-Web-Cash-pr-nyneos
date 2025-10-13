import React from "react";

interface DropdownGroupProps {
  label: string;
  name?: string;
  options: string[];
  register?: any;
  required?: boolean;
  errors?: Record<string, any>;
  watch?: any;
  readOnly?: boolean;
  disabled?: boolean;
  oldValue?: string;
  value?: string; // <-- Add this
  onChange?: (value: string) => void; // <-- Add this
}

const DropdownGroupChange: React.FC<DropdownGroupProps> = ({
  label,
  name,
  options,
  register,
  required = false,
  errors,
  readOnly = false,
  disabled = false,
  watch,
  oldValue,
  value,
  onChange,
}) => {
  const watchedValue = watch?.(name);

  if (readOnly) {
    return (
      <div>
        <label className="text-secondary-text">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        <div className="w-full p-2 bg-transparent text-secondary-text rounded border-none">
          {value || watchedValue || `No ${label} selected`}
        </div>
      </div>
    );
  }

  const selectProps =
    typeof register === "function" && name
      ? register(name, {
          required: required ? `${label} is required` : false,
        })
      : register || {};

  return (
    <div>
      <label className="text-secondary-text">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <select
        {...selectProps}
        className="w-full p-2 border border-border bg-secondary-color-lt text-secondary-text outline-none rounded"
        disabled={disabled}
        value={value !== undefined ? value : watchedValue || ""}
        onChange={
          onChange
            ? (e) => onChange(e.target.value)
            : selectProps.onChange
        }
      >
        <option value="" disabled hidden>
          Select {label}
        </option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {oldValue !== undefined && (
        <span className="text-xs text-gray-500 block mt-1">
          Old Value: {oldValue}
        </span>
      )}
      {errors?.[name || ""] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[name || ""]?.message}
        </p>
      )}
    </div>
  );
};

export default DropdownGroupChange;