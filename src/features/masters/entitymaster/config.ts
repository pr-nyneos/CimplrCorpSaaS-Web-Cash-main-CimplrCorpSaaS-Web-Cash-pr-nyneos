import type {  Template, ValidationConfig } from "../../../types/type";


const entityCashValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "entity_code",
    "entity_name",
    "entity_type",
    "active_status",
  ],
  requiredFields: [
    "entity_code",
    "entity_name",
    "entity_type",
    "active_status",
  ],
  numericFields: ["opening_balance"],
};

const templates: Template[] = [
  {
    id: "entity_cash",
    name: "Entity Cash Template",
    type: "Excel",
    description: "Template for uploading Entity Cash details",
    headers: [
      "entity_code",
      "entity_name",
      "entity_type",
      "parent_entity_code",
      "currency",
      "opening_balance",
      "active_status",
      "description",
    ],
    sampleRow: [
      "ENT001",
      "Main Branch",
      "Branch",
      "",
      "INR",
      500000,
      "Active",
      "Primary branch cash entity",
    ],
  },
];

export { templates, entityCashValidationConfig };