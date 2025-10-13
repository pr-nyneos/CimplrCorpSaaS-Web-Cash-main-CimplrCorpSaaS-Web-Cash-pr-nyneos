import type {
  Section,
  Template,
  FieldConfig,
  ValidationConfig,
} from "../../../types/type";
import type { BankSummary } from "../../../types/masterType";

const defaultColumnVisibility: Record<string, boolean> = {
  select: true,
  account_id: false, // internal ID, usually hidden
  account_nickname: true,
  account_number: true,
  bank_name: true,
  entity_id: false, // hidden if entity_name is shown
  entity_name: true,
  action_id: false,
  action_type: false,
  processing_status: true,
  status: true,
  reason: false,
  requested_at: false,
  requested_by: false,
  checker_at: false,
  checker_by: false,
  checker_comment: false,
  created_at: false,
  created_by: false,
  edited_at: false,
  edited_by: false,
  deleted_at: false,
  deleted_by: false,
  action: true,
  // expand: false, // Uncomment if you use row expansion
};

const COLUMNS = [
  "select",
  "account_id",
  "account_nickname",
  "account_number",
  "bank_name",
  "entity_id",
  "entity_name",
  "action_id",
  "action_type",
  "processing_status",
  "status",
  "reason",
  "requested_at",
  "requested_by",
  "checker_at",
  "checker_by",
  "checker_comment",
  "created_at",
  "created_by",
  "edited_at",
  "edited_by",
  "deleted_at",
  "deleted_by",

  "action",
  "expand",
  // "expand", // Uncomment if you use row expansion
];

const commonAuditFields: FieldConfig<BankSummary>[] = [
  { key: "reason", label: "Reason", type: "text" },
  { key: "requested_by", label: "Requested By", type: "text" },
  { key: "requested_at", label: "Requested At", type: "date" },
];

const auditFieldsByActionType = (
  data: BankSummary
): FieldConfig<BankSummary>[] => {
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

const sections: Section<BankSummary>[] = [
  {
    title: "Audit Details",
    fields: auditFieldsByActionType,
  },
];

const bankAccountValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "account_code",
    "account_name",
    "account_type",
    "entity_code",
    "currency",
    "active_status",
  ],
  requiredFields: [
    "account_code",
    "account_name",
    "account_type",
    "entity_code",
    "currency",
    "active_status",
  ],
  numericFields: ["opening_balance"],
};

const templates: Template[] = [
  {
    id: "bank_account",
    name: "Bank Account Template",
    type: "Excel",
    description: "Template for uploading Bank Account details",
    headers: [
      "account_code",
      "account_name",
      "account_type",
      "entity_code",
      "currency",
      "opening_balance",
      "active_status",
      "description",
    ],
    sampleRow: [
      "BA001",
      "Main Branch Savings",
      "Savings",
      "ENT001",
      "INR",
      100000,
      "Active",
      "Primary savings account for Main Branch",
    ],
  },
];
export {
  sections,
  templates,
  bankAccountValidationConfig,
  defaultColumnVisibility,
  COLUMNS,
};
