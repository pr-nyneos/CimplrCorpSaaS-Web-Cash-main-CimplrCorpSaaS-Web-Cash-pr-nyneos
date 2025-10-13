export type FxExposure = {
  additional_header_details: string | null;
  additional_line_details: string | null;
  amount_in_local_currency: number;
  approval_comment: string | null;
  approval_status: string; // e.g. "pending"
  approved_at: string | null; // ISO datetime
  approved_by: string | null;
  company_code: string;
  counterparty_code: string;
  counterparty_name: string;
  counterparty_type: string;
  created_at: string; // ISO datetime
  currency: string;
  delete_comment: string | null;
  delivery_date: string | null; // ISO date or null
  document_date: string; // ISO date
  document_id: string;
  entity: string;
  entity1: string | null;
  entity2: string | null;
  entity3: string | null;
  exposure_header_id: string;
  exposure_type: string;
  gl_account: string;
  inco_terms: string | null;
  is_active: boolean;
  line_item_amount: number;
  line_item_id: string;
  line_number: string;
  payment_terms: string | null;
  plant_code: string | null;
  posting_date: string; // ISO date
  product_description: string | null;
  product_id: string | null;
  quantity: number | null;
  reference: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_comment: string | null;
  requested_by: string | null;
  status: string; // e.g. "Open"
  text: string;
  time_based: string; // ISO datetime
  total_open_amount: number;
  total_original_amount: number;
  unit_of_measure: string | null;
  unit_price: number | null;
  updated_at: string; // ISO date
  value_date: string; // ISO date
};

// Exposure Creation Config

export type QuickSummaryRow = {
  CompanyCode: string;
  currency: string;
  AmountDoc: string | number;
};

export type ValidationRow = {
  CompanyCode: string;
  Party: string;
  DocumentCurrency: string;
  DocumentNumber: string;
  issues: string;
};

export type NonQualifiedRow = {
  CompanyCode: string;
  Party: string;
  DocumentCurrency: string;
  DocumentNumber: string;
  PostingDate: string;
  NetDueDate: string;
  AmountDoc: string;
  Source: string;
  issues: string;
};
