import React, { useEffect } from "react";
import SectionCard from "../../../components/ui/SectionCard";
import CustomSelect from "../../../components/ui/SearchSelect";

export type DeliveryDetails = {
  modeOfDelivery: string;
  deliveryPeriod: string;
  addDate: string;
  settlementDate: string;
  maturityDate: string;
  deliveryDate: string;
};

type DeliveryDateDetailsProps = {
  details: DeliveryDetails;
  setDetails: React.Dispatch<React.SetStateAction<DeliveryDetails>>;
  isLoading?: boolean;
};

const modeOfDeliveryOptions = [
  { value: "Cash", label: "Cash" },
  { value: "TOM", label: "TOM" },
  { value: "Spot", label: "Spot" },
  { value: "Forward", label: "Forward" },
];

const deliveryPeriodOptions = [
  { value: "1M", label: "1M" },
  { value: "2M", label: "2M" },
  { value: "3M", label: "3M" },
  { value: "4M", label: "4M" },
  { value: "5M", label: "5M" },
  { value: "6M", label: "6M" },
];

const DateInput: React.FC<{
  isDisabled: boolean;
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ isDisabled, label, value, onChange }) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
      />
    </div>
  );
};

const DeliveryDateDetails: React.FC<DeliveryDateDetailsProps> = ({
  details,
  setDetails,
  isLoading = false,
}) => {
  // Set Add Date to today's date if empty
  useEffect(() => {
    if (!details.addDate) {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10); // yyyy-mm-dd
      setDetails((prev) => ({ ...prev, addDate: todayStr }));
    }
  }, [details.addDate, setDetails]);

  // Auto-calculate Settlement Date based on Mode of Delivery and Add Date
  useEffect(() => {
    if (!details.addDate) return;
    let settlementDate = details.settlementDate;
    const addDateObj = new Date(details.addDate);

    if (details.modeOfDelivery === "TOM") {
      addDateObj.setDate(addDateObj.getDate() + 1);
      settlementDate = addDateObj.toISOString().slice(0, 10);
    } else if (details.modeOfDelivery === "Cash") {
      addDateObj.setDate(addDateObj.getDate() + 2);
      settlementDate = addDateObj.toISOString().slice(0, 10);
    } else if (details.modeOfDelivery === "Spot") {
      settlementDate = details.addDate;
    } else if (details.modeOfDelivery) {
      addDateObj.setDate(addDateObj.getDate() + 2);
      settlementDate = addDateObj.toISOString().slice(0, 10);
    }

    // Only update if different (to preserve user edits)
    if (details.settlementDate !== settlementDate) {
      setDetails((prev) => ({ ...prev, settlementDate }));
    }
  }, [details.modeOfDelivery, details.addDate, setDetails]);

  // Auto-calculate Maturity Date based on Delivery Period
  useEffect(() => {
    if (details.deliveryPeriod) {
      // Extract number of months from deliveryPeriod (e.g., "2M" => 2)
      const match = details.deliveryPeriod.match(/^(\d+)M$/);
      if (match) {
        const monthsToAdd = parseInt(match[1], 10);
        const now = new Date();
        now.setMonth(now.getMonth() + monthsToAdd);
        const maturityDate = now.toISOString().slice(0, 10); // yyyy-mm-dd
        if (details.maturityDate !== maturityDate) {
          setDetails((prev) => ({ ...prev, maturityDate }));
        }
      }
    }
  }, [details.deliveryPeriod, setDetails, details.maturityDate]);

  return (
    <SectionCard title="Delivery & Date Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomSelect
          label="Mode of Delivery"
          selectedValue={details.modeOfDelivery}
          options={modeOfDeliveryOptions}
          onChange={(val) =>
            setDetails((prev) => ({ ...prev, modeOfDelivery: val }))
          }
          isDisabled={isLoading}
        />

        <CustomSelect
          label="Delivery Period"
          selectedValue={details.deliveryPeriod}
          options={deliveryPeriodOptions}
          onChange={(val) =>
            setDetails((prev) => ({ ...prev, deliveryPeriod: val }))
          }
          isDisabled={isLoading}
        />

        <DateInput
          label="Add Date"
          value={details.addDate}
          onChange={(val) => setDetails((prev) => ({ ...prev, addDate: val }))}
          isDisabled={isLoading}
        />
        <DateInput
          label="Settlement Date"
          value={details.settlementDate}
          onChange={(val) =>
            setDetails((prev) => ({ ...prev, settlementDate: val }))
          }
          isDisabled={isLoading}
        />
        <DateInput
          label="Maturity Date"
          value={details.maturityDate}
          onChange={(val) =>
            setDetails((prev) => ({ ...prev, maturityDate: val }))
          }
          isDisabled={isLoading}
        />
        <DateInput
          label="Delivery Date"
          value={details.deliveryDate}
          onChange={(val) =>
            setDetails((prev) => ({ ...prev, deliveryDate: val }))
          }
          isDisabled={isLoading}
        />
      </div>
    </SectionCard>
  );
};

export default DeliveryDateDetails;
