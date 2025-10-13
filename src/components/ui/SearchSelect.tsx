import React from "react";
import Select from "react-select";

type OptionType = {
  value: string;
  label: string;
};

interface CustomSelectPropsBase {
  label?: string;
  options: OptionType[];
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isRequired?: boolean;
  isSearchable?: boolean;
  error?: string,
  menuPlacement?: "auto" | "top" | "bottom";
}

interface CustomSelectSingleProps extends CustomSelectPropsBase {
  isMulti?: false;
  selectedValue?: string | null;
  onChange: (value: string) => void;
}

interface CustomSelectMultiProps extends CustomSelectPropsBase {
  isMulti: true;
  selectedValue?: string[] | null;
  onChange: (value: string[]) => void;
}

type CustomSelectProps = CustomSelectSingleProps | CustomSelectMultiProps;

const CustomSelect: React.FC<CustomSelectProps> = (props) => {
  const {
    label,
    options,
    placeholder = "Select...",
    isDisabled = false,
    isClearable = true,
    isSearchable = true,
    isRequired = false,
    error,
    menuPlacement = "auto",
  } = props;

  // isMulti, selectedValue, onChange are discriminated
  const isMulti = (props as CustomSelectMultiProps).isMulti === true;

  let selectedOption: OptionType | OptionType[] | null = null;
  if (isMulti) {
    const selectedValue = (props as CustomSelectMultiProps).selectedValue;
    selectedOption = Array.isArray(selectedValue)
      ? options.filter((opt) => selectedValue.includes(opt.value))
      : [];
  } else {
    const selectedValue = (props as CustomSelectSingleProps).selectedValue;
    selectedOption =
      typeof selectedValue === "string" && selectedValue !== null
        ? options.find((opt) => opt.value === selectedValue) || null
        : null;
  }

  return (
    <div className="w-full">
      <label className="block font-sans text-md text-secondary-text mb-1 ">
        {label}
        {isRequired && <span className="text-red-500"> *</span>}
      </label>
     
      <Select
        classNamePrefix="react-select"
        options={options}
        value={selectedOption}
        isMulti={isMulti}
        onChange={(selectedOption) => {
          if (isMulti) {
            const handler = (props as CustomSelectMultiProps).onChange;
            if (Array.isArray(selectedOption)) {
              handler(selectedOption.map((opt) => opt.value));
            } else {
              handler([]);
            }
          } else {
            const handler = (props as CustomSelectSingleProps).onChange;
            handler((selectedOption as OptionType)?.value || "");
          }
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        required={isRequired}
        menuPlacement={menuPlacement}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={{
          menuPortal: (base) => ({ 
            ...base, 
            zIndex: 9999,
          }),
          control: (base, state) => ({
            ...base,
            backgroundColor: "var(--secondary-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "3px",
            borderColor: state.isFocused
              ? "var(--primary-color)"
              : "var(--border-color)",
            boxShadow: state.isFocused
              ? "0 0 0 1px var(--primary-color)"
              : "none",
            "&:hover": {
              borderColor: "var(--primary-color)",
            },
          }),
          valueContainer: (base) => ({
            ...base,
            backgroundColor: "var(--secondary-color)",
            color: "var(--secondary-text-color)",
          }),
          input: (base) => ({
            ...base,
            color: "var(--secondary-text-color)",
          }),
          singleValue: (base) => ({
            ...base,
            color: "var(--secondary-text-color)",
          }),
          placeholder: (base) => ({
            ...base,
            color: "var(--secondary-text-color-dark)",
          }),
          indicatorsContainer: (base) => ({
            ...base,
            backgroundColor: "var(--secondary-color)",
            color: "var(--secondary-text-color)",
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "var(--secondary-color)",
            color: "var(--secondary-text-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "3px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            opacity: 1,
            zIndex: 9999,
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
              ? "var(--secondary-color-dark)"
              : state.isFocused
              ? "var(--secondary-color-lt)"
              : "var(--secondary-color)",
            color: "var(--secondary-text-color)",
            opacity: 1,
            "&:active": {
              backgroundColor: "var(--secondary-color-dark)",
            },
          }),
        }}
      />
      {error && (
  <p className="text-sm text-red-500 mt-1">
    {error}
  </p>
)}

    </div>
  );
};

export default CustomSelect;
