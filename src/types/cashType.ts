// export type BankStatementItem = {
//   bankstatementid: string;
//   entityid: string;
//   account_number: string;
//   statementdate: string; // ISO date string
//   openingbalance: number | null;
//   closingbalance: number | null;
//   currencycode: string;
//   transactiondate: string; // ISO date string
//   description: string | null;
//   debitamount: number | null;
//   creditamount: number | null;
//   balanceaftertxn: number | null;
//   createdby: string | null;
//   createdat: string; // ISO date string
//   status: string;
//   entity_name: string;
//   bank_name: string;
// };
export type BankStatementRow = {
  bankstatementid: string;
  entityid: string;
  account_number: string;
  statementdate: string; // ISO date string
  openingbalance?: number;
  closingbalance?: number;
  transactiondate: string; // ISO date string
  description: string;
  status: string;
  is_deleted: boolean;
  accountholdername: string;
  branchname: string;
  ifsccode: string;
  statement_period: string;
  chequerefno: string;
  withdrawalamount?: number;
  depositamount?: number;
  modeoftransaction: string;
  entity_name: string;
  bank_name: string;
  processing_status: string;
  requested_by: string;
  requested_at?: string; // ISO date string
  checker_by: string;
  checker_at?: string; // ISO date string

  // DB-backed old_* columns
  old_entityid_db: string;
  old_account_number_db: string;
  old_statementdate_db?: string;
  old_openingbalance_db?: number;
  old_closingbalance_db?: number;
  old_transactiondate_db?: string;
  old_description_db: string;
  old_status_db: string;
  old_accountholdername_db: string;
  old_branchname_db: string;
  old_ifsccode_db: string;
  old_statement_period_db: string;
  old_chequerefno_db: string;
  old_withdrawalamount_db?: number;
  old_depositamount_db?: number;
  old_modeoftransaction_db: string;

  // audit-created/edited/deleted info
  created_by: string;
  created_at: string;
  edited_by: string;
  edited_at: string;
  deleted_by: string;
  deleted_at: string;

  // raw reason from latest audit (internal use)
  reason_raw?: string;

  // public old_* fields
  old_entityid: string;
  old_account_number: string;
  old_description: string;
};

export type Proposal = {
  ProjectionID: string; // UUID, Primary Key
  ProposalType: "Yearly" | "Quarterly" | "Monthly";
  StartDate: string; // ISO date string
  CategoryID: string; // Foreign Key -> Cashflow Category Master
  Type: "Inflow" | "Outflow";
  EntityID: string; // Foreign Key -> Entity Master
  DepartmentID: string; // Foreign Key -> Cost/Profit Centre Master
  ExpectedAmount: number; // Numeric(19,2)
  Recurring?: boolean; // Optional since not mandatory
  CurrencyCode: string; // Foreign Key -> Currency Master
  CreatedAt: string; // Timestamp as ISO string
  UpdatedAt: string; // Timestamp as ISO string
};

export interface Payable {
  payable_id: string;
  entity_name: string;
  counterparty_name: string;
  invoice_number: string;
  invoice_date: string;   // ISO date string
  due_date: string;       // ISO date string
  amount: number;
  currency_code: string;

  old_entity_name: string;
  old_counterparty_name: string;
  old_invoice_number: string;
  old_invoice_date: string;
  old_due_date: string;
  old_amount: number;
  old_currency_code: string;

  status: string;
  created_by: string;
  created_at: string;
  edited_by: string;
  edited_at: string;
  deleted_by: string;
  deleted_at: string;
}

export interface Receivable {
  receivable_id: string;
  entity_name: string;
  counterparty_name: string;
  invoice_number: string;
  invoice_date: string;   // ISO date string
  due_date: string;       // ISO date string
  invoice_amount: number;
  currency_code: string;

  old_entity_name: string;
  old_counterparty_name: string;
  old_invoice_number: string;
  old_invoice_date: string;
  old_due_date: string;
  old_invoice_amount: number;
  old_currency_code: string;

  status: string;
  created_by: string;
  created_at: string;
  edited_by: string;
  edited_at: string;
  deleted_by: string;
  deleted_at: string;
}



export type BankBalance = {
  balance_id: string;
  bank_name: string;
  account_no: string;
  iban: string;
  currency_code: string;
  nickname: string;
  country: string;
  as_of_date: string; // format: YYYY-MM-DD
  as_of_time: string; // format: HH:mm:ss
  balance_type: string; // e.g., "CURRENT", "SAVINGS"
  balance_amount: string; // keeping as string since JSON shows it as string
  statement_type: string; // e.g., "DAILY", "MONTHLY"
  source_channel: string; // e.g., "MANUAL", "AUTO"
  opening_balance: string;
  total_credits: string;
  total_debits: string;
  closing_balance: string;
  reason: string;
};

export type AllBankBalance = {
  account_no: string;
  action_id: string;
  action_type: string;
  as_of_date: string;
  as_of_time: string;
  balance_amount: string;
  balance_id: string;
  balance_type: string;
  bank_name: string;
  checker_at: string;
  checker_by: string;
  checker_comment: string;
  closing_balance: string;
  country: string;
  created_at: string;
  created_by: string;
  currency_code: string;
  deleted_at: string;
  deleted_by: string;
  edited_at: string;
  edited_by: string;
  iban: string;
  nickname: string;
  old_account_no: string;
  old_as_of_date: string;
  old_as_of_time: string;
  old_balance_amount: string;
  old_balance_type: string;
  old_bank_name: string;
  old_closing_balance: string;
  old_currency_code: string;
  old_iban: string;
  old_nickname: string;
  old_opening_balance: string;
  old_source_channel: string;
  old_statement_type: string;
  old_total_credits: string;
  old_total_debits: string;
  opening_balance: string;
  processing_status: string;
  reason: string;
  source_channel: string;
  statement_type: string;
  total_credits: string;
  total_debits: string;
};

//Sweep

export interface SweepConfiguration {
  sweep_id: string;
  entity_name: string;
  bank_name: string;
  bank_account: string;
  sweep_type: string;
  parent_account: string;
  buffer_amount: number;
  frequency: string;
  cutoff_time: string;
  auto_sweep: string;
  active_status: string;

  old_entity_name: string;
  old_bank_name: string;
  old_bank_account: string;
  old_sweep_type: string;
  old_parent_account: string;
  old_buffer_amount: number;
  old_frequency: string;
  old_cutoff_time: string;
  old_auto_sweep: string;
  old_active_status: string;

  processing_status: string;
  action_type: string;
  action_id: string;
  checker_by: string;
  checker_at: string;
  checker_comment: string;
  reason: string;

  created_by: string;
  created_at: string;
  edited_by: string;
  edited_at: string;
  deleted_by: string;
  deleted_at: string;
}

//  FUND PLANNING
export interface PlanRequestSummary {
  action_type: string;
  checker_at: string;
  checker_by: string;
  checker_comment: string;
  entity_name: string;
  horizon: number;
  plan_id: string;
  primary_types: string;
  primary_values: string;
  processing_status: string;
  reason: string;
  requested_at: string;
  requested_by: string;
  total_amount: number;
  total_groups: number;
}

export interface FundPlanDetailsResponse {
  plan_info: {
    plan_id: string;
    entity_name?: string;
    horizon?: number;
  };
  groups: GroupRow[];
}

type GroupRow = {
  group_id: string;
  direction: string;
  currency: string;
  primary_key: string;
  primary_value: string;
  total_amount: number;
  action_type?: string;
  processing_status?: string;
  requested_by?: string;
  requested_at?: string;
  checker_by?: string;
  checker_at?: string;
  checker_comment?: string;
  reason?: string;
};
