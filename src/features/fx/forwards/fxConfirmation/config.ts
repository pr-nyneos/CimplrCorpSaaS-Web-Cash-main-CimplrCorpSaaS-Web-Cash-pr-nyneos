import type {Section} from "../../../../types/type";
import type {PendingForwards} from "./PendingForwards";

const sections: Section<PendingForwards>[] = [
  {
    title: "Transaction Identifiers",
    fields: [
      { key: "system_transaction_id", label: "System Transaction ID", type: "text" },
      { key: "internal_reference_id", label: "Internal Reference ID", type: "text" },
      { key: "bank_transaction_id", label: "Bank Transaction ID", type: "text" },
      { key: "swift_unique_id", label: "Swift Unique ID", type: "text" },
    ],
    editableKeys: ["system_transaction_id", "internal_reference_id", "bank_transaction_id", "swift_unique_id"],
  },
  {
    title: "Entity Information",
    fields: [
      { key: "entity_level_0", label: "Entity Level 0", type: "text" },
      { key: "entity_level_1", label: "Entity Level 1", type: "text" },
      { key: "entity_level_2", label: "Entity Level 2", type: "text" },
      { key: "entity_level_3", label: "Entity Level 3", type: "text" },
      { key: "local_currency", label: "Local Currency", type: "text" },
    ],
  },
  {
    title: "Order & Transaction Details",
    fields: [
      { key: "order_type", label: "Order Type", type: "text" },
      { key: "transaction_type", label: "Transaction Type", type: "text" },
      { key: "counterparty", label: "Counterparty", type: "text" },
      { key: "mode_of_delivery", label: "Mode of Delivery", type: "text" },
      { key: "delivery_period", label: "Delivery Period", type: "text" },
    ],
  },
  {
    title: "Currency & Financial Details",
    fields: [
      { key: "currency_pair", label: "Currency Pair", type: "text" },
      { key: "base_currency", label: "Base Currency", type: "text" },
      { key: "quote_currency", label: "Quote Currency", type: "text" },
      { key: "input_value", label: "Input Value", type: "number" },
      { key: "value_type", label: "Value Type", type: "text" },
      { key: "actual_value_base_currency", label: "Actual Value Base Currency", type: "number" },
    ],
  },
  {
    title: "Rates & Margins",
    fields: [
      { key: "spot_rate", label: "Spot Rate", type: "number" },
      { key: "forward_points", label: "Forward Points", type: "number" },
      { key: "bank_margin", label: "Bank Margin", type: "number" },
      { key: "total_rate", label: "Total Rate", type: "number" },
      { key: "value_quote_currency", label: "Value Quote Currency", type: "number" },
      { key: "intervening_rate_quote_to_local", label: "Intervening Rate Quote to Local", type: "number" },
      { key: "value_local_currency", label: "Value Local Currency", type: "number" },
    ],
  },
  {
    title: "Important Dates",
    fields: [
      { key: "add_date", label: "Add Date", type: "date" },
      { key: "settlement_date", label: "Settlement Date", type: "date" },
      { key: "maturity_date", label: "Maturity Date", type: "date" },
      { key: "delivery_date", label: "Delivery Date", type: "date" },
      { key: "bank_confirmation_date", label: "Bank Confirmation Date", type: "date" },
      { key: "transaction_timestamp", label: "Transaction Timestamp", type: "date" },
    ],
  },
  {
    title: "Personnel & Additional Info",
    fields: [
      { key: "internal_dealer", label: "Internal Dealer", type: "text" },
      { key: "counterparty_dealer", label: "Counterparty Dealer", type: "text" },
      { key: "remarks", label: "Remarks", type: "text" },
      { key: "narration", label: "Narration", type: "text" },
      { key: "status", label: "Status", type: "text" },
    ],
  },
];

export default sections;