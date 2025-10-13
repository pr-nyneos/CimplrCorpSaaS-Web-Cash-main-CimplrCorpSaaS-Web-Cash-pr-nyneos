import type {
  Section,
  Template,
  ValidationConfig,
  FieldConfig,
} from "../../../types/type";
import type { PayableReceivableRow } from "../../../types/masterType";

const CategoryOptions = [
  { value: "", label: "Select Category" },
  { value: "VENDOR_PAYMENT", label: "Vendor Payment" },
  { value: "SALARY_PAYMENT", label: "Salary Payment" },
  { value: "CUSTOMER_COLLECTION", label: "Customer Collection" },
  { value: "LOAN_RECEIPT", label: "Loan Receipt" },
  { value: "TAX_PAYMENT", label: "Tax Payment" },
  { value: "OTHER", label: "Other" },
];

const erpTypeOptions = [
  { value: "SAP", label: "SAP" },
  { value: "Oracle", label: "Oracle" },
  { value: "Tally", label: "Tally" },
  { value: "Sage", label: "Sage" },
  { value: "Generic", label: "Generic" },
];

const commonERPFields: FieldConfig<PayableReceivableRow>[] = [
  {
    key: "erp_type",
    label: "ERP Type",
    type: "select",
    options: erpTypeOptions,
  },
  { key: "external_code", label: "External Code / Ref", type: "text" },
  { key: "segment", label: "Segment / Dimension", type: "text" },
];

const commonAuditFields: FieldConfig<PayableReceivableRow>[] = [
  { key: "reason", label: "Reason", type: "text" },
  { key: "requested_by", label: "Requested By", type: "text" },
  { key: "requested_at", label: "Requested At", type: "date" },
];

const auditFieldsByActionType = (
  data: PayableReceivableRow
): FieldConfig<PayableReceivableRow>[] => {
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

const erpMappingFields = (
  data: PayableReceivableRow
): FieldConfig<PayableReceivableRow>[] => {
  switch (data.erp_type) {
    case "SAP":
      return [
        ...commonERPFields,
        {
          key: "sap_company_code",
          label: "Company Code (BUKRS)",
          type: "text",
        },
        { key: "sap_fi_doc_type", label: "FI Doc Type (BLART)", type: "text" },
        {
          key: "sap_posting_key_debit",
          label: "Posting Key (Debit)",
          type: "text",
        },
        {
          key: "sap_posting_key_credit",
          label: "Posting Key (Credit)",
          type: "text",
        },
        {
          key: "sap_reconciliation_gl",
          label: "Reconciliation GL",
          type: "text",
        },
        { key: "sap_tax_code", label: "Tax Code (MWSKZ)", type: "text" },
      ];
    case "Oracle":
      return [
        ...commonERPFields,
        { key: "oracle_ledger", label: "Ledger", type: "text" },
        {
          key: "oracle_transaction_type",
          label: "Transaction Type",
          type: "text",
        },
        { key: "oracle_source", label: "Source", type: "text" },
        {
          key: "oracle_distribution_set",
          label: "Distribution Set",
          type: "text",
        },
      ];
    case "Tally":
      return [
        ...commonERPFields,
        { key: "tally_ledger_group", label: "Ledger Group", type: "text" },
        { key: "tally_voucher_type", label: "Voucher Type", type: "text" },
        { key: "tally_tax_class", label: "Tax Class", type: "text" },
      ];
    case "Sage":
      return [
        ...commonERPFields,
        { key: "sage_nominal_control", label: "Nominal Control", type: "text" },
        { key: "sage_analysis_code", label: "Analysis Code", type: "text" },
      ];
    default:
      return [...commonERPFields];
  }
};

const sections: Section<PayableReceivableRow>[] = [
  {
    title: "Basic Information",
    fields: [
      {
        key: "category",
        label: "Category",
        type: "select",
        options: CategoryOptions,
        oldValue: "old_category",
      },
      {
        key: "direction",
        label: "Direction",
        type: "select",
        options: [
          { value: "Payable", label: "Payable" },
          { value: "Receivable", label: "Receivable" },
        ],
        oldValue: "old_direction",
      },
      {
        key: "default_due_days",
        label: "Default Due Days",
        type: "text",
        oldValue: "old_default_due_days",
      },
      {
        key: "payment_terms_name",
        label: "Payment Terms Name",
        type: "text",
        oldValue: "old_payment_terms_name",
      },
      {
        key: "effective_from",
        label: "Effective From",
        type: "date",
        oldValue: "old_effective_from",
      },
      {
        key: "effective_to",
        label: "Effective To",
        type: "date",
        oldValue: "old_effective_to",
      },
      {
        key: "allow_netting",
        label: "Allow Netting",
        type: "select",
        options: [
          { value: "true", label: "True" },
          { value: "false", label: "False" },
        ],
        oldValue: "old_allow_netting",
      },
      {
        key: "default_recon_gl",
        label: "Default Recon GL",
        type: "text",
        oldValue: "old_default_recon_gl",
      },
      {
        key: "offset_revenue_expense_gl",
        label: "Offset Revenue/Expense GL",
        type: "text",
        oldValue: "old_offset_revenue_expense_gl",
      },
      { key: "tags", label: "Tags", type: "text", oldValue: "old_tags" },
    ],
    editableKeys: [
      "category",
      "direction",
      "default_recon_gl",
      "offset_revenue_expense_gl",
      "allow_netting",
      "default_due_days",
      "payment_terms_name",
      "effective_from",
      "effective_to",
      "tags",
      "type_code",
      "type_name",
    ],
  },
  {
    title: "Audit Details",
    fields: auditFieldsByActionType,
  },
  {
    title: "ERP Mapping",
    fields: erpMappingFields, // <-- Dynamic fields based on erp_type
    editableKeys: [
      // "erp_type",
      "sap_company_code",
      "sap_fi_doc_type",
      "sap_posting_key_debit",
      "sap_posting_key_credit",
      "sap_reconciliation_gl",
      "sap_tax_code",
      "oracle_ledger",
      "oracle_transaction_type",
      "oracle_source",
      "oracle_distribution_set",
      "tally_ledger_group",
      "tally_voucher_type",
      "tally_tax_class",
      "sage_nominal_control",
      "sage_analysis_code",
    ],
  },
];

const payableReceivableValidationConfig: ValidationConfig = {
  requiredHeaders: ["Type", "Name", "Category", "Description", "Status"],
  requiredFields: ["Type", "Name", "Category", "Description", "Status"],
  numericFields: [], // Add numeric fields if needed
};

const templates: Template[] = [
  {
    id: "payable/receivable_upload",
    name: "Payable/Receivable Upload Template",
    type: "Excel",
    description: "Template for uploading payable/receivable data",
    headers: ["Type", "Name", "Category", "Description", "Status"],
    sampleRow: [
      "Payable",
      "Counterparty 5672",
      "Finance",
      "Legal Entity 203",
      "Active",
    ],
  },
];

export {
  templates,
  payableReceivableValidationConfig,
  sections,
  auditFieldsByActionType,
};
