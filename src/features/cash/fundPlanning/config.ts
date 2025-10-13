import type {
  // Template,
  Section,
  // ValidationConfig,
  FieldConfig,
} from "../../../types/type";

import type { PlanRequestSummary } from "../../../types/cashType.ts";


const commonAuditFields: FieldConfig<PlanRequestSummary>[] = [
  { key: "reason", label: "Reason", type: "text" },
  { key: "requested_by", label: "Requested By", type: "text" },
  { key: "requested_at", label: "Requested At", type: "date" },
];

const auditFieldsByActionType = (
  data: PlanRequestSummary
): FieldConfig<PlanRequestSummary>[] => {
  switch (data.processing_status) {
  
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

const sections: Section<PlanRequestSummary>[] = [
 
  {
    title: "Audit Details",
    fields: auditFieldsByActionType,
  },
];

export {sections};