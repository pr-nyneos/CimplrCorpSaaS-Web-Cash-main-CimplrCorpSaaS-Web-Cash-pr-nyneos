import React from "react";
import SectionCard from "../../../components/ui/SectionCard";
import CustomSelect from "../../../components/ui/SearchSelect";

type OptionType = {
  value: string;
  label: string;
};

type OrderState = {
  orderType: string;
  transactionType: string;
  counterparty: string;
  localCurrency: string;
};

interface OrderDetailsProps {
  orderDetails: OrderState;
  isThere?: boolean;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderState>>;
}

const orderTypeOptions: OptionType[] = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
];

const transactionTypeOptions: OptionType[] = [
  { value: "Swap", label: "Swap" },
  { value: "Outright", label: "Outright" },
];

// const localCurrencyDefault = { label: "INR (Based on entity)", value: "INR" };

const counterpartyOptions: OptionType[] = [
  { value: "Counterparty A", label: "Counterparty A" },
  { value: "Counterparty B", label: "Counterparty B" },
  { value: "Counterparty C", label: "Counterparty C" },
];

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderDetails, setOrderDetails , isThere = false }) => {
  return (
    <SectionCard title="Order Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomSelect
          label="Order Type"
          options={orderTypeOptions}
          selectedValue={orderDetails.orderType}
          onChange={(val) => setOrderDetails((prev) => ({ ...prev, orderType: val }))}
          placeholder="Select..."
          isDisabled={isThere} // Disable if isThere is true
        />

        <CustomSelect
          label="Transaction Type"
          options={transactionTypeOptions}
          selectedValue={orderDetails.transactionType}
          onChange={(val) => setOrderDetails((prev) => ({ ...prev, transactionType: val }))}
          placeholder="Select..."
          isDisabled={isThere} // Disable if isThere is true
        />

        <CustomSelect
          label="Counterparty"
          options={counterpartyOptions}
          selectedValue={orderDetails.counterparty}
          onChange={(val) => setOrderDetails((prev) => ({ ...prev, counterparty: val }))}
          placeholder="Select..."
          isDisabled={isThere} // Disable if isThere is true
        />

        <CustomSelect
          label="Local Currency"
          options={[{ label: orderDetails.localCurrency, value: orderDetails.localCurrency }]}
          selectedValue={orderDetails.localCurrency}
          onChange={() => {}}
          isDisabled={true}
          placeholder="Select..."
          isClearable={false} // Disable clearing for local currency
        />
      </div>
    </SectionCard>
  );
};

export default OrderDetails;

