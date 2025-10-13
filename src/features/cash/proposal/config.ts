import type {Section, Template, ValidationConfig } from "../../../types/type";
import type {Proposal} from "../../../types/cashType"

const sections: Section<Proposal>[] = [
  {
    title: "Identifiers",
    fields: [
      { key: "ProjectionID", label: "Projection ID", type: "text" },
      { key: "ProposalType", label: "Proposal Type", type: "text" },
    ],
  },
  {
    title: "Dates",
    fields: [
      { key: "StartDate", label: "Start Date", type: "date" },
      { key: "CreatedAt", label: "Created At", type: "date" },
      { key: "UpdatedAt", label: "Updated At", type: "date" },
    ],
  },
  {
    title: "Entity & Department",
    fields: [
      { key: "EntityID", label: "Entity ID", type: "text" },
      { key: "DepartmentID", label: "Department ID", type: "text" },
      { key: "CategoryID", label: "Category ID", type: "text" },
    ],
  },
  {
    title: "Financial Details",
    fields: [
      { key: "Type", label: "Type", type: "text" },
      { key: "ExpectedAmount", label: "Expected Amount", type: "number" },
      { key: "Recurring", label: "Recurring", type: "checkbox" },
      { key: "CurrencyCode", label: "Currency Code", type: "text" },
    ],
  },
];

const proposalValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "ProjectionID",
    "ProposalType",
    "StartDate",
    "CategoryID",
    "Type",
    "EntityID",
    "DepartmentID",
    "ExpectedAmount",
    "CurrencyCode",
  ],
  requiredFields: [
    "ProjectionID",
    "ProposalType",
    "StartDate",
    "CategoryID",
    "Type",
    "EntityID",
    "DepartmentID",
    "ExpectedAmount",
    "CurrencyCode",
  ],
  numericFields: ["ExpectedAmount"],
};

const templates: Template[] = [
  {
    id: "proposal",
    name: "Proposal Template",
    type: "Excel",
    description: "Template for entering proposal details",
    headers: [
      "ProjectionID",
      "ProposalType",
      "StartDate",
      "CategoryID",
      "Type",
      "EntityID",
      "DepartmentID",
      "ExpectedAmount",
      "Recurring",
      "CurrencyCode",
    ],
    sampleRow: [
      "PRJ001",
      "Yearly",
      "2025-09-01",
      "CAT1001",
      "Inflow",
      "ENT2001",
      "DEP3001",
      "100000.00",
      "true",
      "INR",
    ],
  },
];

export { sections, proposalValidationConfig, templates };