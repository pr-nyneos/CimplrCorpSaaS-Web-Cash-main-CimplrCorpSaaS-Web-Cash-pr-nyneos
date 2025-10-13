import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateInputProps {
  isDisabled: boolean;
  label: string;
  value: string;
  onChange: (val: string) => void;
  minDate?: Date;
}

const DateInput: React.FC<DateInputProps> = ({ isDisabled, label, value, onChange, minDate }) => {
  // Convert string value (yyyy-mm-dd) to Date object
  const dateValue = value ? new Date(value) : null;

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <DatePicker
        selected={dateValue}
        onChange={(date: Date | null) => {
          if (date) {
            // Format as yyyy-mm-dd for storage
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            onChange(`${yyyy}-${mm}-${dd}`);
          } else {
            onChange("");
          }
        }}
        dateFormat="dd/MM/yyyy"
        disabled={isDisabled}
        minDate={minDate}
        className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
        placeholderText="dd/mm/yyyy"
      />
    </div>
  );
};

export default DateInput;
