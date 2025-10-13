import type {Template, ValidationConfig } from "../../../types/type";


const cashFlowCategoryValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "category_name",
    "category_type",
    "default_mapping",
    "cashflow_nature",
    "usage_flag",
    "description",
    "status",
    "parent_category_id",
    "category_level",
  ],
  requiredFields: [
    "category_name",
    "category_type",
    "default_mapping",
    "cashflow_nature",
    "usage_flag",
    "description",
    "status",
    // "parent_category_id",
    "category_level",
  ],
  numericFields: [],
};

const templates: Template[] = [
  {
    id: "cashflow_category",
    name: "Cash Flow Category Template",
    type: "Excel",
    description: "Template for uploading Cash Flow Categories",
    headers: [
      "category_name",
      "category_type",
      "default_mapping",
      "cashflow_nature",
      "usage_flag",
      "description",
      "status",
      "parent_category_id",
      "category_level",
    ],
    sampleRow: [
      "Category_2",
      "Outflow",
      "Receivable",
      "Investing",
      "ForecastingOnly",
      "Description for Category_1",
      "Inactive",
      "",
      "0",
    ],
  },
];


export { cashFlowCategoryValidationConfig, templates};