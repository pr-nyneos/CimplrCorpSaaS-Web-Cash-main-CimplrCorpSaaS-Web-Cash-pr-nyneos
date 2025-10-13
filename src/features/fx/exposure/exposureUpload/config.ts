import type { Section } from '../../../../types/type';
import type {AllExposureRequest} from './AllExposureRequest';

const sections: Section<AllExposureRequest>[] = [
  {
    title: 'Document Information',
    fields: [
      { key: 'document_id', label: 'Document ID', type: 'text', oldValue: 'document_id' },
      { key: 'exposure_type', label: 'Exposure Type', type: 'text', oldValue: 'exposure_type' },
      { key: 'entity', label: 'Entity', type: 'text', oldValue: 'entity' },
      { key: 'counterparty_name', label: 'Counterparty Name', type: 'text', oldValue: 'counterparty_name' },
      { key: 'currency', label: 'Currency', type: 'text', oldValue: 'currency' },
    ],
    editableKeys: ['document_id', 'exposure_type', 'entity', 'counterparty_name', 'currency'],
  },
  {
    title: 'Financial Information',
    fields: [
      { key: 'total_original_amount', label: 'Total Original Amount', type: 'number', oldValue: 'total_original_amount' },
      { key: 'total_open_amount', label: 'Total Open Amount', type: 'number', oldValue: 'total_open_amount' },
      { key: 'line_item_amount', label: 'Line Item Amount', type: 'number', oldValue: 'line_item_amount' },
      { key: 'amount_in_local_currency', label: 'Amount in Local Currency', type: 'number', oldValue: 'amount_in_local_currency' },
    ],
    editableKeys: ['total_original_amount', 'total_open_amount', 'line_item_amount', 'amount_in_local_currency'],
  },
  {
    title: 'Audit Metadata',
    fields: [
      { key: 'exposure_header_id', label: 'Exposure Header ID', type: 'text' },
      { key: 'line_item_id', label: 'Line Item ID', type: 'text' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
      { key: 'status', label: 'Status', type: 'text' },
    ],
  },
];

export { sections };