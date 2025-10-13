
import type { Template, Section, ValidationConfig } from "../../../types/type";
import type { CostProfitCenterMaster } from "../../../types/masterType";



const sections: Section<CostProfitCenterMaster>[] = [
  {
    title: "Cost/Profit Centre Information",
    fields: [
      { key: "centre_code", label: "Centre Code", type: "text" },
      { key: "centre_name", label: "Centre Name", type: "text" },
      {
        key: "centre_type",
        label: "Centre Type",
        type: "select",
        options: [
          { value: "Cost Centre", label: "Cost Centre" },
          { value: "Profit Centre", label: "Profit Centre" },
        ],
      },
      { key: "business_unit", label: "Business Unit", type: "text" },
      { key: "owner_manager", label: "Owner / Manager", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
      },
    ],
    editableKeys: [
      "centre_code",
      "centre_name",
      "centre_type",
      "business_unit",
      "owner_manager",
      "status",
    ],
  },
];

const centreValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "centre_code",
    "centre_name",
    "centre_type",
    "parent_centre_id",
    "entity_code",
    "status",
    // "source",
    "erp_ref",
    "centre_level",
    // "system_centre_id",
  ],
  requiredFields: [
    "centre_code",
    "centre_name",
    "centre_type",
    // "parent_centre_id",
    "entity_code",
    "status",
    // "source",
    "erp_ref",
    "centre_level",
    // "system_centre_id",
  ],
  numericFields: [],
};

const templates: Template[] = [
  {
    id: "cost_profit_center",
    name: "Cost/Profit Center Template",
    type: "Excel",
    description: "Template for Cost/Profit Center upload",
    headers: [
      "centre_code",
      "centre_name",
      "centre_type",
      "parent_centre_id",
      "entity_code",
      "status",
      // "source",
      "erp_ref",
      "centre_level",
      // "system_centre_id",
    ],
    sampleRow: [
      "CPC001",
      "Main Cost Center",
      "Cost",
      "",
      "ABC123",
      "Active",
      // "System",
      "ERP001",
      "0",
      // "SYS001",
    ],
  },
];

export { templates, centreValidationConfig, sections };
