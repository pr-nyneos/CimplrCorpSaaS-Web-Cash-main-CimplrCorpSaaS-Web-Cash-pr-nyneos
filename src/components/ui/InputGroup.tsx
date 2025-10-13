import React from "react";

interface InputGroupProps {
  label: string;
  name?: string;
  register?: any;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  max?: number;
  min?: number;
  errors?: Record<string, any>;
  pattern?: any;
  readOnlyMode?: boolean;
  disabled?: boolean;
  oldValue?: string;
  onInput?: React.InputHTMLAttributes<HTMLInputElement>["onInput"];
  value?: string;
  onChange?: (value: string) => void; // <-- Add this line
}

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  name,
  register,
  required = false,
  type = "text",
  placeholder,
  maxLength,
  max,
  min,
  errors,
  pattern,
  readOnlyMode = false,
  disabled = false,
  oldValue,
  onInput,
  value,
  onChange, // <-- Add this line
}: InputGroupProps) => {
  let registerProps;
  if (typeof register === "function") {
    registerProps = register(name, {
      required: required ? `${label} is required` : false,
      maxLength: maxLength
        ? { value: maxLength, message: `Max ${maxLength} characters` }
        : undefined,
      pattern: pattern,
    });
  } else {
    registerProps = register;
  }

  const handleNumberInput = (e: React.FormEvent<HTMLInputElement>) => {
    let value = e.currentTarget.value;

    // Prevent more digits than maxLength
    if (type === "number" && maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
      e.currentTarget.value = value;
    }

    // Prevent value greater than max
    if (type === "number" && typeof max === "number" && value) {
      const numValue = Number(value);
      if (numValue > max) {
        e.currentTarget.value = String(max);
      }
    }

    if (onInput) onInput(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
    if (registerProps && registerProps.onChange) {
      registerProps.onChange(e);
    }
  };

  if (type === "checkbox") {
    return (
      <label className="flex items-center justify-start h-full gap-3 text-secondary-text text-base mt-3">
        <input
          type="checkbox"
          {...registerProps}
          disabled={readOnlyMode || disabled}
          className="accent-primary w-5 h-5"
        />
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
    );
  }

  return (
    <div>
      <label className="text-secondary-text">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        name={name}
        maxLength={type !== "number" ? maxLength : undefined}
        max={max}
        min={min}
        onInput={type === "number" && maxLength ? handleNumberInput : onInput}
        {...registerProps}
        disabled={readOnlyMode || disabled}
        className={`w-full bg-secondary-color-lt text-secondary-text outline-none rounded 
          ${readOnlyMode ? "border-none bg-transparent p-0" : "border border-border p-2"}`}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        value={value !== undefined ? value : undefined}
        onChange={handleChange}
        onKeyDown={type === "date" ? (e) => e.preventDefault() : undefined}
      />
      {!readOnlyMode && oldValue !== undefined && oldValue !== "" && (
        <div className="text-xs text-gray-400 mt-1">Old: {oldValue}</div>
      )}
      {!readOnlyMode && name && errors?.[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name]?.message}</p>
      )}
    </div>
  );
};

export default InputGroup;
