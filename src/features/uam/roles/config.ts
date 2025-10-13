import type { Section } from '../../../types/type';

// Define the AllRoles type (should match the one in AllRoles.tsx)
export type AllRoles = {
  id: number;
  srNo: string | number;
  name: string;
  roleCode: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
  status?: string;
  createdBy?: string;
  approvedBy?: string;
  approveddate?: string;
};

const sections: Section<AllRoles>[] = [
  {
    title: 'Role Information',
    fields: [
  { key: 'name', label: 'Role Name', type: 'text', oldValue: 'name' },
  { key: 'roleCode', label: 'Role Code', type: 'text', oldValue: 'roleCode' },
  { key: 'description', label: 'Description', type: 'text', oldValue: 'description' },
  { key: 'status', label: 'Status', type: 'text', oldValue: 'status' },
    ],
    editableKeys: ['name', 'roleCode', 'description', 'status'],
  },
  {
    title: 'Timing',
    fields: [
  { key: 'startTime', label: 'Start Time', type: 'time', oldValue: 'startTime' },
  { key: 'endTime', label: 'End Time', type: 'time', oldValue: 'endTime' },
    ],
    editableKeys: ['startTime', 'endTime'],
  },
  {
    title: 'Audit Metadata',
    fields: [
      { key: 'id', label: 'Role ID', type: 'text' },
      { key: 'createdAt', label: 'Created At', type: 'date' },
      { key: 'createdBy', label: 'Created By', type: 'text' },
      { key: 'approvedBy', label: 'Approved By', type: 'text' },
      { key: 'approveddate', label: 'Approved Date', type: 'date' },
    ],
  },
];

export { sections };
