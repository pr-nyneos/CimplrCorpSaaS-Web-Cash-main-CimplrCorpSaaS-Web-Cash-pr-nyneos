import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { DateRange, type Range } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangeFilterProps {
  label?: string;
  value: Range[];
  onChange: (range: Range[]) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  label = "Created Date",
  value,
  onChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div className="flex flex-col relative">
      <label className="text-sm font-medium text-secondary-text">
        {label}
      </label>
      <div
        className="border border-border text-secondary-text rounded-md px-3 py-2 flex items-center justify-between cursor-pointer"
        onClick={() => setShowDatePicker(!showDatePicker)}
      >
        <span>
          {value[0]?.startDate && value[0]?.endDate
            ? `${value[0].startDate?.toLocaleDateString()} - ${value[0].endDate?.toLocaleDateString()}`
            : "Select Date Range"}
        </span>
        <Calendar className="w-4 h-4 text-primary" />
      </div>

      {showDatePicker && (
        <div className="absolute z-10 top-16 left-0 bg-white shadow-lg rounded-md">
          <DateRange
            editableDateInputs
            onChange={(item) => {
              if (!item.selection.startDate && !item.selection.endDate) {
                onChange([{ startDate: undefined, endDate: undefined, key: "selection" }]);
              } else {
                onChange([
                  {
                    ...item.selection,
                    key: "selection",
                    startDate: item.selection.startDate,
                    endDate: item.selection.endDate,
                  },
                ]);
              }
            }}
            moveRangeOnFirstSelection={false}
            ranges={value[0]?.startDate && value[0]?.endDate ? value : [{ startDate: undefined, endDate: undefined, key: "selection" }]}
          />
          <div className="flex justify-between p-2 border-t">
            <button
              className="px-3 py-1 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
              onClick={() => setShowDatePicker(false)}
            >
              Close
            </button>
            <button
              className="px-3 py-1 bg-[#129990] text-white rounded-md text-sm hover:bg-[#0d7a73]"
              onClick={() => {
                setShowDatePicker(false);
              }}
            >
              Apply
            </button>
            <button
              className="px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
              onClick={() => {
                onChange([{ startDate: undefined, endDate: undefined, key: "selection" }]);
                setShowDatePicker(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
