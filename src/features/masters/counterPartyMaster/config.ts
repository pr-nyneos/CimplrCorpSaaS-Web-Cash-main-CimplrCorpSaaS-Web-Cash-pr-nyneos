import type {
  Template,
  Section,
  ValidationConfig,
  FieldConfig,
} from "../../../types/type";
import type { CounterpartyRow } from "../../../types/masterType";

const commonAuditFields: FieldConfig<CounterpartyRow>[] = [
  { key: "reason", label: "Reason", type: "text" },
  { key: "requested_by", label: "Requested By", type: "text" },
  { key: "requested_at", label: "Requested At", type: "date" },
];

const auditFieldsByActionType = (
  data: CounterpartyRow
): FieldConfig<CounterpartyRow>[] => {
  switch (data.processing_status) {
    case "PENDING_DELETE_APPROVAL":
      return [
        ...commonAuditFields,
        { key: "deleted_at", label: "Deleted At", type: "date" },
        { key: "deleted_by", label: "Deleted By", type: "text" },
      ];
    case "PENDING_EDIT_APPROVAL":
      return [
        ...commonAuditFields,
        { key: "edited_at", label: "Edited At", type: "date" },
        { key: "edited_by", label: "Edited By", type: "text" },
      ];
    case "APPROVED":
    case "REJECTED":
      // case "PENDING_APPROVAL":
      return [
        ...commonAuditFields,
        { key: "checker_at", label: "Checked At", type: "date" },
        { key: "checker_by", label: "Checked By", type: "text" },
        { key: "checker_comment", label: "Checker Comment", type: "text" },
      ];
    default:
      return [
        { key: "reason", label: "Reason", type: "text" },
        { key: "requested_by", label: "Requested By", type: "text" },
        { key: "requested_at", label: "Requested At", type: "date" },
      ];
  }
};

const sections: Section<CounterpartyRow>[] = [
  {
    title: "Basic Information",
    fields: [
      {
        key: "counterparty_name",
        label: "Counterparty Name",
        type: "text",
        oldValue: "old_counterparty_name",
      },
      {
        key: "counterparty_code",
        label: "Counterparty Code",
        type: "text",
        oldValue: "old_counterparty_code",
      },
      {
        key: "counterparty_type",
        label: "Counterparty Type",
        type: "select",
        oldValue: "old_counterparty_type",
        options: [
          { value: "Vendor", label: "Vendor" },
          { value: "Customer", label: "Customer" },
          { value: "Employee", label: "Employee" },
          { value: "Intercompany", label: "Intercompany" },
        ],
      },

      {
        key: "contact",
        label: "Contact",
        type: "text",
        oldValue: "old_contact",
      },
      { key: "email", label: "Email", type: "text", oldValue: "old_email" },
      {
        key: "country",
        label: "Country",
        type: "text",
        oldValue: "old_country",
      },
      { key: "tags", label: "Tags", type: "text", oldValue: "old_tags" },
      {
        key: "status",
        label: "Status",
        type: "select",
        oldValue: "old_status",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
      },
      {
        key: "address",
        label: "Address",
        type: "text",
        oldValue: "old_address",
      },
    ],
    editableKeys: [
      // "counterparty_name",
      // "counterparty_code",
      "counterparty_type",
      "contact",
      "email",
      "country",
      "tags",
      "status",
      "address",
    ],
  },
  {
    title: "Audit Details",
    fields: auditFieldsByActionType,
  },
];

const counterpartyValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "system_counterparty_id",
    "counterparty_name",
    "counterparty_code",
    "counterparty_type",
    "legal_name",
    "tax_id",
    "address",
    "erp_ref_id",
    "default_payment_terms",
    "internal_risk_rating",
    "treasury_rm",
    "status",
    "default_cashflow_category",
  ],
  requiredFields: [
    "system_counterparty_id",
    "counterparty_name",
    "counterparty_code",
    "counterparty_type",
    "legal_name",
    "tax_id",
    "address",
    "erp_ref_id",
    "default_payment_terms",
    "internal_risk_rating",
    "treasury_rm",
    "status",
    // "default_cashflow_category",
  ],
  numericFields: [], // Add numeric keys here if any field should be numeric
};

const templates: Template[] = [
  {
    id: "counterparty",
    name: "Counterparty Template",
    type: "Excel",
    description: "Counterparty details template",
    headers: [
      "system_counterparty_id",
      "counterparty_name",
      "counterparty_code",
      "counterparty_type",
      "legal_name",
      "tax_id",
      "address",
      "erp_ref_id",
      "default_payment_terms",
      "internal_risk_rating",
      "treasury_rm",
      "status",
      "default_cashflow_category",
    ],
    sampleRow: [
      "SYSCP0010",
      "ABC Corporation",
      "CP001",
      "Customer",
      "ABC Corporation Legal",
      "TAX123456",
      "123 Main St, New York, NY 10001",
      "ERP1001",
      "Net 30",
      "Low",
      "RM001",
      "Active",
      "Category A",
    ],
  },
];

export { templates, counterpartyValidationConfig, sections };
