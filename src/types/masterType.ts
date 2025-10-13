// import { PayableReceivableMaster } from './masterType';
// import { Payable } from './cashType';
export type BankMasterForm = {
  bank_id: string;
  bank_name: string;
  bank_short_name: string | null;
  swift_bic_code: string | null;
  country_of_headquarters: string;
  connectivity_type: string;
  active_status: string;
  contact_person_name: string | null;
  contact_person_email: string | null;
  contact_person_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  old_bank_name: string | null;
  old_bank_short_name: string | null;
  old_swift_bic_code: string | null;
  old_country_of_headquarters: string | null;
  old_connectivity_type: string | null;
  old_active_status: string | null;
  old_contact_person_name: string | null;
  old_contact_person_email: string | null;
  old_contact_person_phone: string | null;
  old_address_line1: string | null;
  old_address_line2: string | null;
  old_city: string | null;
  old_state_province: string | null;
  old_postal_code: string | null;
  processing_status: string | null;
  action_type: string | null;
  action_id: string | null;
  checker_at: string | null;
  checker_by: string | null;
  checker_comment: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string | null;
  edited_by: string | null;
  edited_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
};

export type BankMasterFormValue = {
  bank_name: string;
  bank_short_name: string;
  swift_bic_code: string;
  country_of_headquarters: string;
  connectivity_type: string;
  active_status: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  user_id?: string;
};

export type CurrencyMaster = {
  currency_id: string;
  currency_code: string;
  currency_name: string;
  country: string;
  symbol: string;
  decimal_places: number;
  old_decimal_places: number;
  status: string;
  old_status: string;
  processing_status: string | null;
  action_type: string | null;
  action_id: string | null;
  checker_at: string | null;
  checker_by: string | null;
  checker_comment: string | null;
  reason: string | null;
  created_by: string | null;
  created_at: string | null;
  edited_by: string | null;
  edited_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
};

export type GLAccount = {
  account_class: string;
  action_id: string;
  action_type: string;
  checker_at: string;
  checker_by: string;
  checker_comment: string;
  created_at: string;
  created_by: string;
  default_currency: string;
  deleted_at: string;
  deleted_by: string;
  edited_at: string;
  edited_by: string;
  effective_from: string;
  effective_to: string;
  erp_type: string;
  external_code: string;
  gl_account_code: string;
  gl_account_id: string;
  gl_account_level: number;
  gl_account_name: string;
  gl_account_type: string;
  is_cash_bank: boolean;
  is_deleted: boolean;
  is_top_level_gl_account: boolean;
  normal_balance: string;

  old_account_class: string;
  old_default_currency: string;
  old_effective_from: string;
  old_effective_to: string;
  old_erp_type: string;
  old_external_code: string;
  old_gl_account_code: string;
  old_gl_account_level: number;
  old_gl_account_name: string;
  old_gl_account_type: string;
  old_is_cash_bank: boolean;
  old_normal_balance: string;
  old_oracle_balancing_seg: string;
  old_oracle_coa: string;
  old_oracle_ledger: string;
  old_oracle_natural_account: string;
  old_parent_gl_code: string;
  old_posting_allowed: boolean;
  old_reconciliation_required: boolean;
  old_sage_cost_centre: string;
  old_sage_department: string;
  old_sage_nominal_code: string;
  old_sap_bukrs: string;
  old_sap_ktoks: string;
  old_sap_ktopl: string;
  old_sap_saknr: string;
  old_segment: string;
  old_source: string;
  old_status: string;
  old_tags: string;
  old_tally_ledger_group: string;
  old_tally_ledger_name: string;

  oracle_balancing_seg: string;
  oracle_coa: string;
  oracle_ledger: string;
  oracle_natural_account: string;
  parent_gl_code: string;
  posting_allowed: boolean;
  processing_status: string;
  reason: string;
  reconciliation_required: boolean;
  requested_at: string;
  requested_by: string;
  sage_cost_centre: string;
  sage_department: string;
  sage_nominal_code: string;
  sap_bukrs: string;
  sap_ktoks: string;
  sap_ktopl: string;
  sap_saknr: string;
  segment: string;
  source: "Upload" | "Manual" | string;
  status: "Active" | "Inactive" | string;
  tags: string;
  tally_ledger_group: string;
  tally_ledger_name: string;
};

export type GLAccountMaster = {
  action_id: string;
  action_type: string;
  cashflow_category_name: string;
  checker_at: string;
  checker_by: string;
  checker_comment: string;
  created_at: string;
  created_by: string;
  deleted_at: string;
  deleted_by: string;
  edited_at: string;
  edited_by: string;
  erp_ref: string;
  gl_account_code: string;
  gl_account_id: string;
  gl_account_name: string;
  gl_account_type: string;
  old_cashflow_category_name: string;
  old_erp_ref: string;
  old_gl_account_code: string;
  old_gl_account_name: string;
  old_gl_account_type: string;
  old_source: string;
  old_status: string;
  processing_status: string; // example enum
  reason: string;
  requested_at: string;
  requested_by: string;
  source: string;
  status: string;
};

export type CostProfitCenterMaster = {
  centre_code: string;
  centre_name: string;
  centre_type: string;
  business_unit?: string; // Optional
  owner_manager?: string; // Optional
  status: "Active" | "Inactive";
};

export type CounterPartyMaster = {
  counterparty_id: string;
  input_method: string;
  system_counterparty_id: string;
  old_system_counterparty_id: string;
  counterparty_name: string;
  old_counterparty_name: string;
  counterparty_code: string;
  old_counterparty_code: string;
  legal_name: string;
  old_legal_name: string;
  counterparty_type: string;
  old_counterparty_type: string;
  tax_id: string;
  old_tax_id: string;
  address: string;
  old_address: string;
  erp_ref_id: string;
  old_erp_ref_id: string;
  default_cashflow_category: string;
  old_default_cashflow_category: string;
  default_payment_terms: string;
  old_default_payment_terms: string;
  internal_risk_rating: string;
  old_internal_risk_rating: string;
  treasury_rm: string;
  old_treasury_rm: string;
  status: string;
  old_status: string;
  processing_status: string;
  requested_by: string;
  requested_at: string; // ISO date string
  action_type: string;
  action_id: string;
  checker_by: string;
  checker_at: string; // ISO date string
  checker_comment: string;
  reason: string;
  created_by: string;
  created_at: string;
  edited_by: string;
  edited_at: string;
  deleted_by: string;
  deleted_at: string;
};

export type CounterpartyBankRow = {
  bank_id: string;
  bank: string;
  old_bank: string;
  country: string;
  old_country: string;
  branch: string;
  old_branch: string;
  account: string;
  old_account: string;
  swift: string;
  old_swift: string;
  rel: string;
  old_rel: string;
  currency: string;
  old_currency: string;
  category: string;
  old_category: string;
  status: string;
  old_status: string;
};

export interface CounterpartyRow {
  counterparty_id: string;
  input_method: string;
  counterparty_name: string;
  old_counterparty_name: string;
  counterparty_code: string;
  old_counterparty_code: string;
  counterparty_type: string;
  old_counterparty_type: string;
  address: string;
  old_address: string;
  status: string;
  old_status: string;
  country: string;
  old_country: string;
  contact: string;
  old_contact: string;
  email: string;
  old_email: string;
  eff_from: string;
  old_eff_from: string;
  eff_to: string;
  old_eff_to: string;
  tags: string;
  old_tags: string;
  processing_status: string;
  requested_by: string;
  requested_at: string;
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

export type LocalClearingCode = {
  codeType: string;
  codeValue: string;
};

export type ClearingCode = {
  code_type: string;
  code_value: string;
  old_code_type: string | null;
  old_code_value: string | null;
};
export type BankAccountMaster = {
  account_id: string;
  account_number: string;
  account_type: string;
  account_status: string;
  account_currency: string;
  account_nickname: string | null;
  credit_limit: number;
  iban: string | null;
  branch_name: string | null;
  branch_address: string | null;

  old_bank_id: string | null;
  old_entity_id: string | null;
  old_account_number: string | null;
  old_account_nickname: string | null;
  old_account_type: string | null;
  old_credit_limit: number;
  old_account_currency: string | null;
  old_iban: string | null;
  old_branch_name: string | null;
  old_branch_address: string | null;
  old_account_status: string | null;

  bank_id: string | null;
  bank_name: string | null;
  entity_id: string | null;
  entity_name: string | null;

  clearing_codes: ClearingCode[];

  // Latest audit info
  processing_status: string;
  action_type: string;
  action_id: string;
  requested_by: string;
  requested_at: string | null;
  checker_by: string;
  checker_at: string | null;
  checker_comment: string;
  reason: string;

  // Create/Edit/Delete audit info
  created_by: string;
  created_at: string | null;
  edited_by: string;
  edited_at: string | null;
  deleted_by: string;
  deleted_at: string | null;
};

export type BankSummary = {
  account_id: string;
  account_nickname: string;
  account_number: string;
  action_id: string;
  action_type: "CREATE" | "UPDATE" | "DELETE" | string; // extendable
  bank_name: string;
  checker_at: string; // ISO timestamp
  checker_by: string;
  checker_comment: string;
  created_at: string;
  created_by: string;
  deleted_at: string;
  deleted_by: string;
  edited_at: string;
  edited_by: string;
  entity_id: string;
  entity_name: string;
  processing_status: string; // enum-like
  reason: string;
  requested_at: string;
  requested_by: string;
  status: "Active" | "Inactive"|string; // extendable
};

export interface TreeNodeData {
  // Core identifiers
  entity_id: string;
  entity_name: string;
  entity_short_name: string;
  entity_registration_number: string;
  entity_level: number;
  parent_entity_id: string;
  parent_entity: string;

  // Status flags
  is_top_level_entity: boolean;
  is_deleted: boolean;
  active_status: string;

  // Contact & Address
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;

  // Financial
  base_operating_currency: string;
  tax_identification_number: string;

  // Workflow / Audit
  action_id: string;
  action_type: string;
  processing_status?: string;
  reason?: string;

  requested_at?: string;
  requested_by?: string;
  checker_at?: string;
  checker_by?: string;
  checker_comment?: string;

  created_at?: string;
  created_by?: string;
  edited_at?: string;
  edited_by?: string;
  deleted_at?: string;
  deleted_by?: string;

  // Old values (for edit comparison)
  old_entity_name?: string;
  old_entity_short_name?: string;
  old_entity_registration_number?: string;
  old_entity_level?: number;
  old_parent_entity_id?: string;

  old_active_status?: string;
  old_address_line1?: string;
  old_address_line2?: string;
  old_city?: string;
  old_state_province?: string;
  old_postal_code?: string;
  old_country?: string;

  old_contact_person_name?: string;
  old_contact_person_email?: string;
  old_contact_person_phone?: string;

  old_base_operating_currency?: string;
  old_tax_identification_number?: string;
}

export type TreeNodeType = {
  id: string;
  name: string;
  data: TreeNodeData;
  children?: TreeNodeType[];
};

export type Projection = {
  id: string;
  type: string;
  category_name: string;
  entity: string;
  processing_status: string;
  action_id: string | null;
  effective_period: string;
  submitted_on: string | null;
  submitted_by: string | null;
};

export type ProjectionLineItem = {
  department: string;
  // bank: string;
  currency: string;
  category_type: string;
  category_name: string;
  amount: number;
  remarks: string;
};

export interface AuditLogEntry {
  id: string;
  action: string;
  description: string;
  performedBy: string;
  role?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}



export type PayableReceivableForm = {
  type_code: string;
  type_name: string;
  direction: "Payable" | "Receivable";
  category: "Invoice" | string;
  business_unit_division?: string;
  default_currency: string;
  default_due_days?: number;
  payment_terms_name?: string;
  allow_netting?: boolean;
  settlement_discount?: boolean;
  settlement_discount_percent?: number;
  tax_applicable?: boolean;
  tax_code?: string;
  default_recon_gl?: string;
  offset_revenue_expense_gl?: string;
  cash_flow_category?: string;
  effective_from: string;
  effective_to?: string;
  tags?: string[];
  status: "Active" | "Inactive" | string;
};

export interface PayableReceivableRow {
  action_id: string;
  action_type: string;
  allow_netting: string;
  business_unit_division: string;
  cash_flow_category: string;
  category: string;
  checker_at: string;
  checker_by: string;
  checker_comment: string;
  created_at: string;
  created_by: string;
  default_currency: string;
  default_due_days: string;
  default_recon_gl: string;
  deleted_at: string;
  deleted_by: string;
  direction: "Payable" | "Receivable" | string;
  edited_at: string;
  edited_by: string;
  effective_from: string;
  effective_to: string;
  erp_type: string;
  is_deleted: string;
  offset_revenue_expense_gl: string;
  old_allow_netting: string;
  old_business_unit_division: string;
  old_cash_flow_category: string;
  old_category: string;
  old_default_currency: string;
  old_default_due_days: string;
  old_default_recon_gl: string;
  old_direction: string;
  old_effective_from: string;
  old_effective_to: string;
  old_erp_type: string;
  old_offset_revenue_expense_gl: string;
  old_oracle_distribution_set: string;
  old_oracle_ledger: string;
  old_oracle_source: string;
  old_oracle_transaction_type: string;
  old_payment_terms_name: string;
  old_sage_analysis_code: string;
  old_sage_nominal_control: string;
  old_sap_company_code: string;
  old_sap_fi_doc_type: string;
  old_sap_posting_key_credit: string;
  old_sap_posting_key_debit: string;
  old_sap_reconciliation_gl: string;
  old_sap_tax_code: string;
  old_settlement_discount: string;
  old_settlement_discount_percent: string;
  old_tags: string;
  old_tally_ledger_group: string;
  old_tally_tax_class: string;
  old_tally_voucher_type: string;
  old_tax_applicable: string;
  old_tax_code: string;
  old_type_code: string;
  old_type_name: string;
  oracle_distribution_set: string;
  oracle_ledger: string;
  oracle_source: string;
  oracle_transaction_type: string;
  payment_terms_name: string;
  processing_status: string;
  reason: string;
  requested_at: string;
  requested_by: string;
  sage_analysis_code: string;
  sage_nominal_control: string;
  sap_company_code: string;
  sap_fi_doc_type: string;
  sap_posting_key_credit: string;
  sap_posting_key_debit: string;
  sap_reconciliation_gl: string;
  sap_tax_code: string;
  settlement_discount: string;
  settlement_discount_percent: string;
  tags: string;
  tally_ledger_group: string;
  tally_tax_class: string;
  tally_voucher_type: string;
  tax_applicable: string;
  tax_code: string;
  type_code: string;
  type_id: string;
  type_name: string;
  external_code: string;
  segment: string;
}

export interface PayableReceivableMaster {
  action_id: string;
  action_type: string;
  category: string;
  checker_at: string;
  checker_by: string;
  checker_comment: string;
  created_at: string;
  created_by: string;
  deleted_at: string;
  deleted_by: string;
  description: string;
  edited_at: string;
  edited_by: string;
  name: string;
  old_category: string;
  old_description: string;
  old_name: string;
  old_status: string;
  old_type: string;
  processing_status: string; // use union if you know possible values
  reason: string;
  requested_at: string;
  requested_by: string;
  status: "Active" | "Inactive"; // use union if you know possible values
  type: string;
  type_id: string;
}

// CashFlow Category

export type CashFlowCategory = {
  category_id: string;
  category_name: string;
  category_type: string;
  parent_category_id: string;
  default_mapping: string;
  cashflow_nature: string;
  usage_flag: string;
  description: string;
  status: string;
  old_category_name: string;
  old_category_type: string;
  old_parent_category_id: string;
  old_default_mapping: string;
  old_cashflow_nature: string;
  old_usage_flag: string;
  old_description: string;
  old_status: string;
  category_level: number;
  old_category_level: number;
  is_top_level_category: boolean;
  is_deleted: boolean;
  processing_status: string;
  requested_by: string;
  requested_at: string; // ISO string
  action_type: string;
  action_id: string;
  checker_by: string;
  checker_at: string; // ISO string
  checker_comment: string;
  reason: string;
  created_by?: string;
  created_at?: string;
  edited_by?: string;
  edited_at?: string;
  deleted_by?: string;
  deleted_at?: string;
  children: string[]; // children are category_ids
};

//CostProfit Center

// export interface CostProfitCenterData {
//   centre_id: string;
//   centre_code: string;
//   centre_name: string;
//   centre_type: string;
//   parent_centre_id: string;
//   entity_name: string;
//   status: string;

//   old_centre_code: string;
//   old_centre_name: string;
//   old_centre_type: string;
//   old_parent_centre_id: string;
//   old_entity_name: string;
//   old_status: string;

//   centre_level: number;
//   old_centre_level: number;
//   is_top_level_centre: boolean;
//   is_deleted: boolean;

//   processing_status: string;
//   action_type: string;
//   action_id: string;
//   checker_by: string;
//   checker_at: string;      // ISO timestamp
//   checker_comment: string;
//   reason: string;
//   requested_by: string;
//   requested_at: string;    // ISO timestamp

//   created_by?: string;
//   created_at?: string;     // ISO timestamp
//   edited_by?: string;
//   edited_at?: string;      // ISO timestamp
//   deleted_by?: string;
//   deleted_at?: string;     // ISO timestamp
// }

export type CostProfitCenterData = {
  action_id: string;
  action_type: string;
  centre_code: string;
  centre_id: string;
  centre_level: number;
  centre_name: string;
  centre_type: string;

  checker_at: string | null;
  checker_by: string | null;
  edited_at?: string | null;
  edited_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;

  checker_comment: string;
  created_at: string;
  created_by: string;
  default_currency: string;
  effective_from: string;
  effective_to: string;
  entity_name: string;
  erp_type: string;
  external_code: string;
  is_deleted: boolean;
  is_top_level_centre: boolean;
  old_centre_code: string;
  old_centre_level: number;
  old_centre_name: string;
  old_centre_type: string;
  old_default_currency: string;
  old_effective_from: string;
  old_effective_to: string;
  old_entity_name: string;
  old_erp_type: string;
  old_external_code: string;
  old_oracle_dept: string;
  old_oracle_ledger: string;
  old_oracle_profit_center: string;
  old_owner: string;
  old_owner_email: string;
  old_parent_centre_id: string;
  old_sage_cost_centre_code: string;
  old_sage_department_code: string;
  old_sap_bukrs: string;
  old_sap_kokrs: string;
  old_sap_kostl: string;
  old_sap_prctr: string;
  old_segment: string;
  old_source: string;
  old_status: string;
  old_tags: string;
  old_tally_ledger_group: string;
  old_tally_ledger_name: string;
  oracle_dept: string;
  oracle_ledger: string;
  oracle_profit_center: string;
  owner: string;
  owner_email: string;
  parent_centre_id: string;
  processing_status: string;
  reason: string;
  requested_at: string;
  requested_by: string;
  sage_cost_centre_code: string;
  sage_department_code: string;
  sap_bukrs: string;
  sap_kokrs: string;
  sap_kostl: string;
  sap_prctr: string;
  segment: string;
  source: string;
  status: string;
  tags: string;
  tally_ledger_group: string;
  tally_ledger_name: string;
};

