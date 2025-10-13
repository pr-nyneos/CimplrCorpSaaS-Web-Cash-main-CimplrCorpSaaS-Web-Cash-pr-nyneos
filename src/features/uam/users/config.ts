import type { Section } from '../../../types/type';
import AllUsers from './AllUser';

const sections: Section<AllUsers>[] = [
  {
    title: 'User Information',
    fields: [
      { key: 'employee_name', label: 'Employee Name', type: 'text', oldValue: 'employee_name' },
      { key: 'username_or_employee_id', label: 'Username', type: 'text', oldValue: 'username_or_employee_id' },
      { key: 'email', label: 'Email', type: 'email', oldValue: 'email' },
      { key: 'mobile', label: 'Mobile', type: 'text', oldValue: 'mobile' },
      { key: 'address', label: 'Address', type: 'text', oldValue: 'address' },
    ],
    editableKeys: ['employee_name', 'username_or_employee_id', 'email', 'mobile', 'address'],
  },
  {
    title: 'Authentication & Business',
    fields: [
      { key: 'authentication_type', label: 'Auth Type', type: 'text', oldValue: 'authentication_type' },
      { key: 'business_unit_name', label: 'Business Unit', type: 'text', oldValue: 'business_unit_name' },
      { key: 'status', label: 'Status', type: 'text', oldValue: 'status' },
      { key: 'status_change_request', label: 'Status Change Request', type: 'text', oldValue: 'status_change_request' },
    ],
    editableKeys: ['authentication_type', 'business_unit_name', 'status', 'status_change_request'],
  },
  {
    title: 'Audit Metadata',
    fields: [
      { key: 'id', label: 'User ID', type: 'text' },
      { key: 'sr_no', label: 'Sr No', type: 'text' },
      { key: 'created_by', label: 'Created By', type: 'text' },
      { key: 'created_at', label: 'Created Date', type: 'date' },
    ],
  },
];

export { sections };