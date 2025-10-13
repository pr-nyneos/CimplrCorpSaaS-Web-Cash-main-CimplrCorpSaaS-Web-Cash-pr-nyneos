import type { Template } from "../../../../types/type";

const templates: Template[] = [
  {
    id: "fbl1n",
    name: "FBL1N",
    type: "Excel",
    description: "SAP Vendor details template",
    headers: [
      "Company Code",           // CompanyCode
      "Account",                // Party
      "Document Currency",      // DocumentCurrency
      "Document Number",        // DocumentNumber
      "Document Date",          // DocumentDate
      "Posting Date",           // PostingDate
      "Net Due Date",           // NetDueDate
      "Document Amount",   // AmountDoc
      // "Document Number",        // product_id
      "Text",                   // product_description
      "Amount in Doc. Curr.",   // line_item_amount
      "Quantity",               // quantity
      "UoM",                    // unit_of_measure
      "Unit Price",             // unit_price
      // ...other existing headers if needed
    ],
    sampleRow: [
      "2100",
      "CA00571",
      "RMB",
      "2101005738",
      "10-05-2024",
      "10-05-2024",
      "10-05-2024",
      "5,92,000.00",
      "2101005738",
      "1st 40% advance for tooling PO 2101435915",
      "5,92,000.00",
      "100",
      "PCS",
      "59.20",
      // ...other sample values if needed
    ],
  },
  {
    id: "fbl3n",
    name: "FBL3N",
    type: "Excel",
    description: "SAP GR/IR details template",
    headers: [
      "Company Code",           // CompanyCode
      "Account",                // Party
      "Document Currency",      // DocumentCurrency
      // "Document Number",        // DocumentNumber
      "Document Date",          // DocumentDate
      "Posting Date",           // PostingDate
      "Clearing Date",          // NetDueDate
      "Amount in Doc. Curr.",   // AmountDoc
      "Document Number",        // product_id
      "Text",                   // product_description
      // "Amount in Doc. Curr.",   // line_item_amount
      // ...other existing headers if needed
    ],
    sampleRow: [
      "1100",
      "261901",
      "USD",
      "1150010349",
      "23-04-2025",
      "23-04-2025",
      "23-04-2025",
      "-5670",
      "1150010349",
      "",
      "-5670",
      // ...other sample values if needed
    ],
  },
  {
    id: "fbl5n",
    name: "FBL5N",
    type: "Excel",
    description: "SAP Customer details template",
    headers: [
      "Company Code",           // CompanyCode
      "Customer",               // Party
      "Document Currency",      // DocumentCurrency
      // "Document Number",        // DocumentNumber
      "Document Date",          // DocumentDate
      "Posting Date",           // PostingDate
      "Net Due Date",           // NetDueDate
      "Amount in Doc. Curr.",   // AmountDoc
      "Document Number",        // product_id
      "Text",                   // product_description
      // "Amount in Doc. Curr.",   // line_item_amount
      // ...other existing headers if needed
    ],
    sampleRow: [
      "1000",
      "101956",
      "EUR",
      "1018000109",
      "25-06-2025",
      "25-06-2025",
      "25-06-2025",
      "3503.37",
      "1018000109",
      "IT SECURITY CHGS FOR APR-JUN 25",
      "3503.37",
      // ...other sample values if needed
    ],
  },
];

const quickSummaryColumns = [
  {
    accessorKey: "company",
    header: "Company",
  },
  {
    accessorKey: "currency",
    header: "Currency",
  },
  {
    accessorKey: "total_exposure",
    header: "Total Exposure",
  },
];

export { templates, quickSummaryColumns };
