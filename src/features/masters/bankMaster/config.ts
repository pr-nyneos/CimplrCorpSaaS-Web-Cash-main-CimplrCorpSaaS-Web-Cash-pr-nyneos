import type { Section, Template, ValidationConfig } from "../../../types/type";
import type { BankMasterForm } from "../../../types/masterType";

const sections: Section<BankMasterForm>[] = [
  {
    title: "Basic Information",
    fields: [
      {
        key: "bank_name",
        label: "Bank Name",
        type: "text",
        oldValue: "old_bank_name",
      },
      {
        key: "bank_short_name",
        label: "Short Name",
        type: "text",
        oldValue: "old_bank_short_name",
      },
      {
        key: "swift_bic_code",
        label: "SWIFT/BIC Code",
        type: "text",
        oldValue: "old_swift_bic_code",
      },
      {
        key: "country_of_headquarters",
        label: "HQ Country",
        type: "text",
        maxLength: 2,
        oldValue: "old_country_of_headquarters",
      },
      {
        key: "connectivity_type",
        label: "Connectivity Type",
        type: "select",
        options: [
          { value: "API", label: "API" },
          { value: "File Transfer", label: "File Transfer" },
          { value: "Database", label: "Database" },
          { value: "Host-to-Host", label: "Host-to-Host" },
          { value: "Others", label: "Others" },
        ],
        oldValue: "old_connectivity_type",
      },
      {
        key: "active_status",
        label: "Active Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
        oldValue: "old_active_status",
      },
    ],
    editableKeys: [
      "bank_name",
      "bank_short_name",
      "swift_bic_code",
      "country_of_headquarters",
      "connectivity_type",
      "active_status",
    ],
  },
  {
    title: "Personal Details",
    fields: [
      {
        key: "contact_person_name",
        label: "Contact Name",
        type: "text",
        oldValue: "old_contact_person_name",
      },
      {
        key: "contact_person_email",
        label: "Contact Email",
        type: "text",
        oldValue: "old_contact_person_email",
      },
      {
        key: "address_line1",
        label: "Address Line 1",
        type: "text",
        oldValue: "old_address_line1",
      },
      {
        key: "address_line2",
        label: "Address Line 2",
        type: "text",
        oldValue: "old_address_line2",
      },
      { key: "city", label: "City", type: "text", oldValue: "old_city" },
      {
        key: "state_province",
        label: "State/Province",
        type: "text",
        oldValue: "old_state_province",
      },
      {
        key: "postal_code",
        label: "Postal Code",
        type: "text",
        oldValue: "old_postal_code",
      },

      {
        key: "contact_person_phone",
        label: "Contact Phone",
        type: "text",
        oldValue: "old_contact_person_phone",
      },
    ],
    editableKeys: [
      "contact_person_name",
      "contact_person_email",
      "contact_person_phone",
      "address_line1",
      "address_line2",
      "city",
      "state_province",
      "postal_code",
    ],
  },
  {
    title: "Audit Metadata",
    fields: [
      { key: "bank_id", label: "Bank ID", type: "text" },
      { key: "processing_status", label: "Processing Status", type: "text" },
      { key: "action_id", label: "Action ID", type: "text" },
      { key: "action_type", label: "Action Type", type: "text" },
      { key: "checker_at", label: "Checked At", type: "date" },
      { key: "checker_by", label: "Checked By", type: "text" },
      { key: "checker_comment", label: "Checker Comment", type: "text" },
      { key: "reason", label: "Reason", type: "text" },
      { key: "created_by", label: "Created By", type: "text" },
      { key: "created_at", label: "Created At", type: "date" },
      { key: "edited_by", label: "Edited By", type: "text" },
      { key: "edited_at", label: "Edited At", type: "date" },
      { key: "deleted_by", label: "Deleted By", type: "text" },
      { key: "deleted_at", label: "Deleted At", type: "date" },
    ],
  },
];

const bankMasterValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "account_number",
    "account_name",
    "transaction_date",
    "amount",
  ],
  requiredFields: [
    "account_number",
    "account_name",
    "transaction_date",
    "amount",
  ],
  numericFields: ["amount"], // amount should be numeric
};

const templates: Template[] = [
  {
    id: "bank_transaction",
    name: "Bank Transaction Template",
    type: "Excel",
    description: "Template for bank transaction CSV upload",
    headers: [
      "account_number",
      "account_name",
      "transaction_date",
      "amount",
      "currency",
      "description",
    ],
    sampleRow: [
      "123456",
      "John Doe",
      "2025-09-04",
      "1000.50",
      "INR",
      "Payment received",
    ],
  },
];

export { templates, bankMasterValidationConfig, sections };
