// For Payables Template
import type {
  Section,
  Template,
  FieldConfig,
  ValidationConfig,
} from "../../../types/type";
import type { Payable, Receivable } from "../../../types/cashType";

const sections: Section<Payable>[] = [
  {
    title: "Basic Information",
    fields: [
      { key: "payable_id", label: "Payable ID", type: "text" },
      { key: "entity_name", label: "Entity ID", type: "text" },
      { key: "counterparty_name", label: "Vendor Name", type: "text" },
      {
        key: "invoice_number",
        label: "Invoice Number",
        type: "text",
        oldValue: "old_invoice_number",
      },
      {
        key: "invoice_date",
        label: "Invoice Date",
        type: "date",
        oldValue: "old_invoice_date",
      },
      {
        key: "due_date",
        label: "Due Date",
        type: "date",
        oldValue: "old_due_date",
      },
      {
        key: "amount",
        label: "Amount",
        type: "number",
        oldValue: "old_amount",
      },
      {
        key: "currency_code",
        label: "Currency Code",
        type: "text",
        oldValue: "old_currency_code",
      },
    ],
    editableKeys: [
      // "entity_id",
      // "vendor_id",
      "invoice_number",
      "invoice_date",
      "due_date",
      "amount",
      "currency_code",
      // "status",
    ],
  },
  {
    title: "Audit Trail",
    fields: [
      { key: "created_by", label: "Created By", type: "text" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "edited_by", label: "Edited By", type: "text" },
      { key: "edited_at", label: "Edited At", type: "datetime" },
      { key: "deleted_by", label: "Deleted By", type: "text" },
      { key: "deleted_at", label: "Deleted At", type: "datetime" },
    ],
    editableKeys: [],
  },
];

const ReceivableSection: Section<Receivable>[] = [
  {
    title: "Basic Information",
    fields: [
      { key: "receivable_id", label: "Receivable ID", type: "text" },
      { key: "entity_name", label: "Entity Name", type: "text" },
      { key: "counterparty_name", label: "Customer Name", type: "text" },
      {
        key: "invoice_number",
        label: "Invoice Number",
        type: "text",
        oldValue: "old_invoice_number",
      },
      {
        key: "invoice_date",
        label: "Invoice Date",
        type: "date",
        oldValue: "old_invoice_date",
      },
      {
        key: "due_date",
        label: "Due Date",
        type: "date",
        oldValue: "old_due_date",
      },
      {
        key: "invoice_amount",
        label: "Amount",
        type: "number",
        oldValue: "old_invoice_amount",
      },
      {
        key: "currency_code",
        label: "Currency Code",
        type: "text",
        oldValue: "old_currency_code",
      },
      {
        key: "status",
        label: "Status",
        type: "text",
        // oldValue: "old_status",
      },
    ],
    editableKeys: [
      // "entity_id",
      // "vendor_id",
      "invoice_number",
      "invoice_date",
      "due_date",
      "invoice_amount",
      "currency_code",
      // "status",
    ],
  },
  {
    title: "Audit Trail",
    fields: [
      { key: "created_by", label: "Created By", type: "text" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "edited_by", label: "Edited By", type: "text" },
      { key: "edited_at", label: "Edited At", type: "datetime" },
      { key: "deleted_by", label: "Deleted By", type: "text" },
      { key: "deleted_at", label: "Deleted At", type: "datetime" },
    ],
    editableKeys: [],
  },
];

const payablesValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "Entity",
    "Vendor",
    "InvoiceNo",
    "InvoiceDate",
    "DueDate",
    "Amount",
    "Currency",
  ],
  requiredFields: [
    "Entity",
    "Vendor",
    "InvoiceNo",
    "InvoiceDate",
    "DueDate",
    "Amount",
    "Currency",
  ],
  numericFields: ["Amount"],
};

// For Receivables Template
const receivablesValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "Entity",
    "Customer",
    "InvoiceNo",
    "InvoiceDate",
    "DueDate",
    "InvoiceAmount",
    "Currency",
  ],
  requiredFields: [
    "Entity",
    "Customer",
    "InvoiceNo",
    "InvoiceDate",
    "DueDate",
    "InvoiceAmount",
    "Currency",
  ],
  numericFields: ["InvoiceAmount"],
};

const templates: Template[] = [
  {
    id: "payables",
    name: "Payables Template",
    type: "Excel",
    description: "Vendor Payables Template",
    headers: [
      "Entity",
      "Vendor",
      "InvoiceNo",
      "InvoiceDate",
      "DueDate",
      "Amount",
      "Currency",
    ],
    sampleRow: [
      "EC-NU2F8TD0",
      "ACME Vendor Ltd",
      "INV001",
      "01-09-2024",
      "15-09-2024",
      "10000",
      "USD",
    ],
  },

  {
    id: "receivables",
    name: "Receivables Template",
    type: "Excel",
    description: "Customer Receivables Template",
    headers: [
      "Entity",
      "Customer",
      "InvoiceNo",
      "InvoiceDate",
      "DueDate",
      "InvoiceAmount",
      "Currency",
    ],
    sampleRow: [
      "EC-NU2F8TD0",
      "XYZ Customer Inc",
      "INV1001",
      "05-09-2024",
      "20-09-2024",
      "25000",
      "EUR",
    ],
  },
];

export {
  templates,
  payablesValidationConfig,
  receivablesValidationConfig,
  sections,
  ReceivableSection,
};
