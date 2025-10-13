import type {
  Section,
  Template,
  ValidationConfig,
  FieldConfig,
} from "../../../types/type";
import type { BankStatementRow } from "../../../types/cashType";

const commonAuditFields: FieldConfig<BankStatementRow>[] = [
  { key: "reason_raw", label: "Reason", type: "text" },
  { key: "requested_by", label: "Requested By", type: "text" },
  { key: "requested_at", label: "Requested At", type: "date" },
];

const auditFieldsByActionType = (
  data: BankStatementRow
): FieldConfig<BankStatementRow>[] => {
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
      return [
        ...commonAuditFields,
        { key: "checker_at", label: "Checked At", type: "date" },
        { key: "checker_by", label: "Checked By", type: "text" },
      ];
    default:
      return [
        { key: "reason_raw", label: "Reason", type: "text" },
        { key: "requested_by", label: "Requested By", type: "text" },
        { key: "requested_at", label: "Requested At", type: "date" },
      ];
  }
};

const sections: Section<BankStatementRow>[] = [
  {
    title: "Account Details",
    fields: [
      {
        key: "accountholdername",
        label: "Account Holder Name",
        type: "text",
        oldValue: "old_accountholdername_db",
      },
      {
        key: "branchname",
        label: "Branch Name",
        type: "text",
        oldValue: "old_branchname_db",
      },
      {
        key: "ifsccode",
        label: "IFSC Code",
        type: "text",
        oldValue: "old_ifsccode_db",
      },
      {
        key: "statement_period",
        label: "Statement Period",
        type: "text",
        oldValue: "old_statement_period_db",
      },
      { key: "entity_name", label: "Entity Name", type: "text" },
      { key: "bank_name", label: "Bank Name", type: "text" },
    ],
    editableKeys: [
      "accountholdername",
      "branchname",
      "ifsccode",
      "statement_period",
    ],
  },
  {
    title: "Statement Information",
    fields: [
      {
        key: "statementdate",
        label: "Statement Date",
        type: "date",
        oldValue: "old_statementdate_db",
      },
      {
        key: "transactiondate",
        label: "Transaction Date",
        type: "date",
        oldValue: "old_transactiondate_db",
      },
      {
        key: "description",
        label: "Description",
        type: "text",
        oldValue: "old_description_db",
      },
      {
        key: "modeoftransaction",
        label: "Mode of Transaction",
        type: "text",
        oldValue: "old_modeoftransaction_db",
      },
      {
        key: "chequerefno",
        label: "Cheque Ref No",
        type: "text",
        oldValue: "old_chequerefno_db",
      },
      {
        key: "openingbalance",
        label: "Opening Balance",
        type: "number",
        oldValue: "old_openingbalance_db",
      },
      {
        key: "closingbalance",
        label: "Closing Balance",
        type: "number",
        oldValue: "old_closingbalance_db",
      },
      {
        key: "withdrawalamount",
        label: "Withdrawal Amount",
        type: "number",
        oldValue: "old_withdrawalamount_db",
      },
      {
        key: "depositamount",
        label: "Deposit Amount",
        type: "number",
        oldValue: "old_depositamount_db",
      },
    ],
    editableKeys: [
      "statementdate",
      "transactiondate",
      "description",
      "modeoftransaction",
      "chequerefno",
      "openingbalance",
      "closingbalance",
      "withdrawalamount",
      "depositamount",
    ],
  },

  {
    title: "Audit Details",
    fields: auditFieldsByActionType,
  },
];

const bankStatementValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "BankStatementID",
    "TransactionID",
    "Amount",
    "Date",
    "Description",
  ],
  requiredFields: [
    "BankStatementID",
    "TransactionID",
    "Amount",
    "Date",
    "Description",
  ],
  numericFields: ["Amount"],
};

const templates: Template[] = [
  
  {
    id: "bank_statement",
    name: "Bank Statement Template",
    type: "Excel",
    description: "Bank statement template",
    headers: [
      "entity_code",
      "account_number",
      "statement_date",
      "opening_balance",
      "closing_balance",
      "transaction_date",
      "description",
      "withdrawal_amount",
      "deposit_amount",
      "mode_of_transaction",
      "account_holder_name",
      "branch_name",
      "ifsc_code",
      "statement_period",
      "cheque_ref_no",
    ],
    sampleRow: [
      "EC-LAWJUEHG",
      "00070500123456",
      "2025-10-09",
      "92540",
      "112540",
      "2025-10-09",
      "Project Income",
      "0",
      "20000",
      "RTGS",
      "Neha Kapoor",
      "ICICI Connaught Place",
      "ICIC0001234",
      "01-10-2025 to 09-10-2025",
      "-",
    ],
  },
];

export { templates, bankStatementValidationConfig, sections };
