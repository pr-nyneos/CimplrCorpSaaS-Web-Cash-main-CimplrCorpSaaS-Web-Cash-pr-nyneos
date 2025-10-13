import type { Section, ValidationConfig, Template } from "../../../types/type";
import type { GLAccountMaster } from "../../../types/masterType";

const sections: Section<GLAccountMaster>[] = [
  {
    title: "GL Account Information",
    fields: [
      {
        key: "gl_account_code",
        label: "GL Account Code",
        type: "text",
        oldValue: "old_gl_account_code",
      },

      {
        key: "gl_account_name",
        label: "GL Account Name",
        type: "text",
        oldValue: "old_gl_account_name",
      },

      {
        key: "gl_account_type",
        label: "GL Account Type",
        type: "text",
      },
      {
        key: "status",
        label: "Status",
        type: "text",
        oldValue: "old_status",
      },
    ],
    editableKeys: [
      "gl_account_code",
      "gl_account_name",
      "gl_account_type",
      "status",
    ],
  },
];

const glAccountValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "gl_account_code",
    "gl_account_name",
    "gl_account_type",
    "status",
    "erp_ref",
    "cashflow_category_name",
  ],
  requiredFields: [
    "gl_account_code",
    "gl_account_name",
    "gl_account_type",
    "status",
    "erp_ref",
    "cashflow_category_name",
  ],
  numericFields: [],
};

const templates: Template[] = [
  {
    id: "gl_account",
    name: "GL Account Template",
    type: "Excel",
    description: "Template for GL Account upload",
    headers: [
      "gl_account_code",
      "gl_account_name",
      "gl_account_type",
      "status",
      "erp_ref",
      "cashflow_category_name",
    ],
    sampleRow: [
      "GL0001",
      "GL Account 1",
      "Liability",
      "Active",
      "2332cde9",
      "NN",
    ],
  },
];

export { templates, glAccountValidationConfig, sections };
