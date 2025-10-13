import type {
  Section,
  Template,
  ValidationConfig,
  // FieldConfig,
} from "../../../types/type";
import type { CurrencyMaster } from "../../../types/masterType";

const sections: Section<CurrencyMaster>[] = [
  {
    title: "General Information",
    fields: [
      { key: "currency_code", label: "Currency Code", type: "text" },
      { key: "currency_id", label: "Currenct ID", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "symbol", label: "Symbol", type: "text" },
      { key: "decimal_places", label: "Decimal Place", type: "number", oldValue: "old_decimal_places" },
      { key: "status", label: "Active Status", type: "select", oldValue:"old_status" ,options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" }
        ] },
    ],
    editableKeys:["decimal_places","status"]
  },
  {
    title: "Action & Request Details",
    fields: [
      { key: "checker_comment", label: "Comments", type: "textarea" },
      { key: "created_at", label: "Created At", type: "datetime" },
      { key: "created_by", label: "Created By", type: "text" },
      { key: "reason", label: "Reason", type: "textarea" },
      { key: "checker_at", label: "Checker At", type: "datetime" },
      { key: "checker_by", label: "Checker By", type: "text" },
      { key: "checker_comment", label: "Checker Comment", type: "textarea" },
    ],
    editableKeys: ["reason"],
  },
];


const currencyMasterValidationConfig: ValidationConfig = {
  requiredHeaders: [
    "code",
    "name",
    "country",
    "symbol",
    "decimalPlace",
    "status",
  ],
  requiredFields: [
    "code",
    "name",
    "country",
    "symbol",
    "decimalPlace",
    "status",
  ],
  numericFields: ["decimalPlace"], // only decimalPlace must be numeric
};

const templates: Template[] = [
  {
    id: "currency_master",
    name: "Currency Master Template",
    type: "Excel",
    description: "Currency Master details template",
    headers: ["code", "name", "country", "symbol", "decimalPlace", "status"],
    sampleRow: [
      "USD", // code
      "US Dollar", // name
      "United States", // country
      "$", // symbol
      "2", // decimalPlace
      "Active", // status
    ],
  },
];

export { templates, currencyMasterValidationConfig, sections };
