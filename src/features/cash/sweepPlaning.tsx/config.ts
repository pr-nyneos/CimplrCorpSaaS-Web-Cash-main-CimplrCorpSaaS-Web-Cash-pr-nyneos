import type {
  Section,
  FieldConfig,
} from "../../../types/type";
import type { SweepConfiguration } from "../../../types/cashType";

const sweepTypeOptions = [
  { value: "zero-balance", label: "Zero Balance" },
  { value: "concentration", label: "Concentration" },
  { value: "target-balance", label: "Target Balance" },
  { value: "standalone", label: "Standalone" },
];

const sweepFrequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const activeStatusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const commonAuditFields: FieldConfig<SweepConfiguration>[] = [
  { key: "reason", label: "Reason", type: "text" },
  { key: "created_by", label: "Created By", type: "text" },
  { key: "created_at", label: "Created At", type: "date" },
];

const auditFieldsByActionType = (
  data: SweepConfiguration
): FieldConfig<SweepConfiguration>[] => {
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
        { key: "checker_comment", label: "Checker Comment", type: "text" },
      ];
    default:
      return [
        { key: "reason", label: "Reason", type: "text" },
        { key: "created_by", label: "Created By", type: "text" },
        { key: "created_at", label: "Created At", type: "date" },
      ];
  }
};

const sections: Section<SweepConfiguration>[] = [
  {
    title: "Basic Information",
    fields: [
      {
        key: "entity_name",
        label: "Entity Name",
        type: "text",
        oldValue: "old_entity_name",
      },
      {
        key: "bank_name",
        label: "Bank Name",
        type: "text",
        oldValue: "old_bank_name",
      },
      {
        key: "bank_account",
        label: "Bank Account",
        type: "text",
        oldValue: "old_bank_account",
      },
      {
        key: "sweep_type",
        label: "Sweep Type",
        type: "select",
        options: sweepTypeOptions,
        oldValue: "old_sweep_type",
      },
      {
        key: "parent_account",
        label: "Parent Account",
        type: "text",
        oldValue: "old_parent_account",
      },
      {
        key: "buffer_amount",
        label: "Buffer Amount",
        type: "text",
        oldValue: "old_buffer_amount",
      },
    ],
    editableKeys: [
      "entity_name",
      "bank_name",
      "bank_account",
      "sweep_type",
      "parent_account",
      "buffer_amount",
    ],
  },
  {
    title: "Sweep Configuration",
    fields: [
      {
        key: "frequency",
        label: "Frequency",
        type: "select",
        options: sweepFrequencyOptions,
        oldValue: "old_frequency",
      },
      {
        key: "cutoff_time",
        label: "Cutoff Time",
        type: "text",
        oldValue: "old_cutoff_time",
      },
      {
        key: "auto_sweep",
        label: "Auto Sweep",
        type: "select",
        options: yesNoOptions,
        oldValue: "old_auto_sweep",
      },
      {
        key: "active_status",
        label: "Active Status",
        type: "select",
        options: activeStatusOptions,
        oldValue: "old_active_status",
      },
    ],
    editableKeys: [
      "frequency",
      "cutoff_time",
      "auto_sweep",
      "active_status",
    ],
  },
  {
    title: "Audit Details",
    fields: auditFieldsByActionType,
  },
];

export {
  sections,
  auditFieldsByActionType,
};