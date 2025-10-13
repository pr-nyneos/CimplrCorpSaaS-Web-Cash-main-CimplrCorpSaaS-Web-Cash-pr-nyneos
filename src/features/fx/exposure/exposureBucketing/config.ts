import React from 'react';
import type { Section } from '../../../../types/type';
import type { AllExposureBucketing } from './ExposureBucketing';

const sections: Section<AllExposureBucketing>[] = [
  {
    title: 'Document Information',
    fields: [
      { key: 'document_id', label: 'Document ID', type: 'text', oldValue: 'document_id' },
      { key: 'exposure_type', label: 'Exposure Type', type: 'text', oldValue: 'exposure_type' },
      { key: 'entity', label: 'Entity', type: 'text', oldValue: 'entity' },
      { key: 'counterparty_name', label: 'Counterparty Name', type: 'text', oldValue: 'counterparty_name' },
      { key: 'currency', label: 'Currency', type: 'text', oldValue: 'currency' },
      { key: 'document_date', label: 'Document Date', type: 'date', oldValue: 'document_date' },
      { key: 'posting_date', label: 'Posting Date', type: 'date', oldValue: 'posting_date' },
      { key: 'value_date', label: 'Value Date', type: 'date', oldValue: 'value_date' },
    ],
    // editableKeys: ['document_id', 'exposure_type', 'entity', 'counterparty_name', 'currency', 'document_date', 'posting_date', 'value_date'],
  },
  {
    title: 'Financial Information',
    fields: [
      { key: 'total_original_amount', label: 'Total Original Amount', type: 'number', oldValue: 'total_original_amount' },
      { key: 'total_open_amount', label: 'Total Open Amount', type: 'number', oldValue: 'total_open_amount' },
      { key: 'line_item_amount', label: 'Line Item Amount', type: 'number', oldValue: 'line_item_amount' },
      { key: 'amount_in_local_currency', label: 'Amount in Local Currency', type: 'number', oldValue: 'amount_in_local_currency' },
    ],
    // editableKeys: ['total_original_amount', 'total_open_amount', 'line_item_amount', 'amount_in_local_currency'],
  },
  {
    title: 'Bucketing Information',
    fields: [
      { key: 'advance', label: 'Advance', type: 'text', oldValue: 'advance' },
      { key: 'month_1', label: 'Month 1', type: 'number', oldValue: 'old_month1' },
      { key: 'month_2', label: 'Month 2', type: 'number', oldValue: 'old_month2' },
      { key: 'month_3', label: 'Month 3', type: 'number', oldValue: 'old_month3' },
      { key: 'month_4', label: 'Month 4', type: 'number', oldValue: 'old_month4' },
      { key: 'month_4_6', label: 'Month 4-6', type: 'number', oldValue: 'old_month4to6' },
      { key: 'month_6plus', label: 'Month 6+', type: 'number', oldValue: 'old_month6plus' },
      { 
        key: 'remaining_percentage', 
        label: 'Remaining %', 
        type: 'number',
        customRender: (row: any) => {
          const {
            total_original_amount = "0",
            advance = 0,
            month_1 = 0,
            month_2 = 0,
            month_3 = 0,
            month_4_6 = 0,
            month_6plus = 0,
          } = row.original;

          const totalAmount = Number(total_original_amount);
          const totalPaid =
            Number(advance) +
            Number(month_1) +
            Number(month_2) +
            Number(month_3) +
            Number(month_4_6) +
            Number(month_6plus);

          const remaining = totalAmount - totalPaid;
          const percentage = totalAmount ? (remaining / totalAmount) * 100 : 0;

          let color = "text-green-600";
          if (percentage > 50) {
            color = "text-red-600";
          } else if (percentage > 20) {
            color = "text-yellow-600";
          } else if (percentage > 0) {
            color = "text-blue-600";
          } else {
            color = "text-red-600";
          }

          return React.createElement('span', 
            { className: `text-sm font-semibold ${color}` },
            `${percentage.toFixed(2)}%`
          );
        }
      },
    ],
    editableKeys: ['advance','month_1', 'month_2', 'month_3', 'month_4', 'month_4_6', 'month_6plus'],
  },
  {
    title: 'Status & Approval',
    fields: [
      { key: 'status', label: 'Status', type: 'text', oldValue: 'status' },
      { key: 'status_bucketing', label: 'Bucketing Status', type: 'text', oldValue: 'status_bucketing' },
      { key: 'approval_status', label: 'Approval Status', type: 'text', oldValue: 'approval_status' },
      { key: 'approval_comment', label: 'Approval Comment', type: 'text', oldValue: 'approval_comment' },
      { key: 'rejection_comment', label: 'Rejection Comment', type: 'text', oldValue: 'rejection_comment' },
    ],
    // editableKeys: ['status', 'status_bucketing', 'approval_comment', 'rejection_comment'],
  },
//   {
//     title: 'Company Information',
//     fields: [
//       { key: 'company_code', label: 'Company Code', type: 'text', oldValue: 'company_code' },
//       { key: 'counterparty_code', label: 'Counterparty Code', type: 'text', oldValue: 'counterparty_code' },
//       { key: 'counterparty_type', label: 'Counterparty Type', type: 'text', oldValue: 'counterparty_type' },
//       { key: 'gl_account', label: 'GL Account', type: 'text', oldValue: 'gl_account' },
//       { key: 'plant_code', label: 'Plant Code', type: 'text', oldValue: 'plant_code' },
//     ],
//     // editableKeys: ['company_code', 'counterparty_code', 'counterparty_type', 'gl_account', 'plant_code'],
//   },
//   {
//     title: 'Product Information',
//     fields: [
//       { key: 'product_id', label: 'Product ID', type: 'text', oldValue: 'product_id' },
//       { key: 'product_description', label: 'Product Description', type: 'text', oldValue: 'product_description' },
//       { key: 'quantity', label: 'Quantity', type: 'text', oldValue: 'quantity' },
//       { key: 'unit_of_measure', label: 'Unit of Measure', type: 'text', oldValue: 'unit_of_measure' },
//       { key: 'unit_price', label: 'Unit Price', type: 'text', oldValue: 'unit_price' },
//       { key: 'text', label: 'Description', type: 'text', oldValue: 'text' },
//     ],
//     // editableKeys: ['product_id', 'product_description', 'quantity', 'unit_of_measure', 'unit_price', 'text'],
//   },
//   {
//     title: 'Terms & Conditions',
//     fields: [
//       { key: 'payment_terms', label: 'Payment Terms', type: 'text', oldValue: 'payment_terms' },
//       { key: 'inco_terms', label: 'Inco Terms', type: 'text', oldValue: 'inco_terms' },
//       { key: 'delivery_date', label: 'Delivery Date', type: 'date', oldValue: 'delivery_date' },
//       { key: 'reference', label: 'Reference', type: 'text', oldValue: 'reference' },
//       { key: 'reference_no', label: 'Reference Number', type: 'text', oldValue: 'reference_no' },
//     ],
//     // editableKeys: ['payment_terms', 'inco_terms', 'delivery_date', 'reference', 'reference_no'],
//   },
//   {
//     title: 'Additional Details',
//     fields: [
//       { key: 'additional_header_details', label: 'Additional Header Details', type: 'text', oldValue: 'additional_header_details' },
//       { key: 'additional_line_details', label: 'Additional Line Details', type: 'text', oldValue: 'additional_line_details' },
//       { key: 'comments', label: 'Comments', type: 'text', oldValue: 'comments' },
//       { key: 'entity1', label: 'Entity 1', type: 'text', oldValue: 'entity1' },
//       { key: 'entity2', label: 'Entity 2', type: 'text', oldValue: 'entity2' },
//       { key: 'entity3', label: 'Entity 3', type: 'text', oldValue: 'entity3' },
//     ],
//     // editableKeys: ['additional_header_details', 'additional_line_details', 'comments', 'advance', 'entity1', 'entity2', 'entity3'],
//   },
  {
    title: 'Audit Metadata',
    fields: [
      { key: 'exposure_header_id', label: 'Exposure Header ID', type: 'text' },
      { key: 'line_item_id', label: 'Line Item ID', type: 'text' },
      { key: 'line_number', label: 'Line Number', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
      { key: 'time_based', label: 'Time Based', type: 'date' },
      { key: 'approved_at', label: 'Approved At', type: 'date' },
      { key: 'approved_by', label: 'Approved By', type: 'text' },
      { key: 'rejected_at', label: 'Rejected At', type: 'date' },
      { key: 'rejected_by', label: 'Rejected By', type: 'text' },
      { key: 'requested_by', label: 'Requested By', type: 'text' },
      { key: 'updated_by', label: 'Updated By', type: 'text' },
      { key: 'delete_comment', label: 'Delete Comment', type: 'text' },
      { key: 'is_active', label: 'Is Active', type: 'boolean' },
    ],
  },
];

export { sections };
