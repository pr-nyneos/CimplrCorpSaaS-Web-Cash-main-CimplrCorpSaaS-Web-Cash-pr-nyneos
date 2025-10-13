import React, { useState, useEffect, useMemo } from "react";
import { Settings, RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useForm } from "react-hook-form";
import CustomSelect from "../../../../components/ui/SearchSelect";
import Button from "../../../../components/ui/Button";
import { useNotification } from "../../../../app/providers/NotificationProvider/Notification";
import parseExcel from "./parse.ts";
import parseCSV from "../../../../utils/parseCSV";
import TemplateGrid from "../../../../components/upload/TemplateGrid.tsx";
import { templates } from "./config";
import handleDownload from "../../../../utils/handleDownload.ts";
import DropdownGroup from "../../../../components/ui/DropdownGroup";
import InputGroup from "../../../../components/ui/InputGroup";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import LoadingSpinner from "../../../../components/layout/LoadingSpinner.tsx";
import type {
  QuickSummaryRow,
  ValidationRow,
  NonQualifiedRow,
} from "../../../../types/fxType.ts";
import Pagination from "../../../../components/table/Pagination.tsx";
import NyneOSTable2 from "../../../cashDashboard/NyneOSTable2.tsx";

import nos from "../../../../utils/nos.tsx";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
interface UploadedFile {
  id: string;
  reportType: string;
  name: string;
  headers: string[];
  mapping: Record<string, string>;
  file: File;
  saved?: boolean; // <-- Add this property
}

function groupAndSumRows(rows: any[]): QuickSummaryRow[] {
  const summary: Record<
    string,
    { CompanyCode: string; currency: string; AmountDoc: number }
  > = {};
  rows.forEach((row) => {
    const CompanyCode = row.CompanyCode || row.company_code || "";
    const currency = row.currency || row.Currency || "";
    // Parse AmountDoc as float, fallback to 0 if not present
    const amount =
      row.AmountDoc !== undefined
        ? parseFloat(row.AmountDoc)
        : row.amount !== undefined
        ? parseFloat(row.amount)
        : 0;

    const key = `${CompanyCode}_${currency}`;
    if (!summary[key]) {
      summary[key] = { CompanyCode, currency, AmountDoc: 0 };
    }
    summary[key].AmountDoc += amount;
  });
  return Object.values(summary).map((item) => ({
    CompanyCode: item.CompanyCode,
    currency: item.currency,
    AmountDoc: item.AmountDoc, // keep as number for table formatting
  }));
}

export interface Knockoff {
  base: string;
  knock: string;
  amt_abs: string;
}

export interface DocumentRecord {
  document_number: string;
  company_code: string;
  source: string;
  party: string;
  currency: string;
  amount: string;
  status: string;
  document_date: string;
  posting_date: string;
  net_due_date: string;
  knockoffs: Knockoff[];
}

// New function to group and sum documents
function groupAndSumDocuments(rows: DocumentRecord[]) {
  const summary: Record<string, any> = {};
  rows.forEach((row) => {
    const key = `${row.company_code}_${row.party}_${row.currency}_${row.source}`;
    if (!summary[key]) {
      summary[key] = {
        company_code: row.company_code,
        party: row.party,
        currency: row.currency,
        source: row.source,
        total_exposure: 0,
        records: [],
      };
    }
    summary[key].total_exposure += parseFloat(row.amount);
    summary[key].records.push(row);
  });
  return Object.values(summary);
}

// Place ALL column definitions at the top, before any usage

const detailColumns = [
  { accessorKey: "document_number", header: "Base Doc" },
  { accessorKey: "posting_date", header: "Post" },
  { accessorKey: "document_date", header: "Orig Due" },
  { accessorKey: "net_due_date", header: "Effective Due" },
  { accessorKey: "amount", header: "Exposure" },
];

const knockoffColumns = [
  { accessorKey: "base", header: "Base Doc" },
  { accessorKey: "knock", header: "Knock Doc" },
  { accessorKey: "amt_abs", header: "Amount Applied" },
];

const summaryColumns = [
  { accessorKey: "company_code", header: "Company" },
  { accessorKey: "party", header: "Party" },
  { accessorKey: "currency", header: "Currency" },
  { accessorKey: "source", header: "Source" },
  {
    accessorKey: "total_exposure",
    header: "Total Exposure",
    cell: (info) => Number(info.getValue()).toLocaleString(),
  },

  {
    id: "expand",
    header: ({ table }) => (
      <button
        type="button"
        className="p-2 flex items-center justify-start"
        onClick={() => table.toggleAllRowsExpanded()}
        title={table.getIsAllRowsExpanded() ? "Collapse All" : "Expand All"}
      >
        {table.getIsAllRowsExpanded() ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
      </button>
    ),
    cell: ({ row }) => (
      <button
        onClick={() => {
          row.toggleExpanded();
          if (!row.getIsExpanded()) {
            setTimeout(() => scrollExpandedRowIntoView(row.id), 100);
          }
        }}
        className="p-2 hover:bg-primary-xl text-primary rounded-md transition-colors"
        aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
      >
        {row.getIsExpanded() ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
      </button>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
];

function scrollExpandedRowIntoView(rowId: string) {
  const el = document.querySelector(`[data-row-id="${rowId}-expanded"]`);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function DetailTable({ records }: { records: DocumentRecord[] }) {
  const detailTable = useReactTable({
    data: records,
    columns: detailColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });
  const pageIndex = detailTable.getState().pagination.pageIndex;
  const pageSize = detailTable.getState().pagination.pageSize;
  const paginatedRecords = records.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );
  return (
    <>
      <table className="min-w-full table-auto rounded-lg border mt-4">
        <thead className="bg-secondary-color">
          <tr>
            {detailColumns.map((col) => (
              <th
                key={col.accessorKey}
                className="px-4 py-2 text-left text-sm font-semibold text-header-color border-b"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRecords.map((record, idx) => (
            <tr
              key={`${record.document_number}-${idx}`}
              className={
                idx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"
              }
            >
              {detailColumns.map((col) => (
                <td key={col.accessorKey} className="px-4 py-2 text-sm">
                  {record[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        table={detailTable}
        totalItems={records.length}
        startIndex={records.length === 0 ? 0 : pageIndex * pageSize + 1}
        endIndex={Math.min((pageIndex + 1) * pageSize, records.length)}
      />
    </>
  );
}

function KnockoffTable({ knockoffRecords }: { knockoffRecords: Knockoff[] }) {
  const knockoffTable = useReactTable({
    data: knockoffRecords,
    columns: knockoffColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });
  const pageIndex = knockoffTable.getState().pagination.pageIndex;
  const pageSize = knockoffTable.getState().pagination.pageSize;
  const paginatedKnockoffs = knockoffRecords.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );
  return (
    <>
      <h4 className="text-md font-medium text-primary mb-3 pb-2 mt-4">
        Knock-off matches (FIFO consumption):
      </h4>
      <table className="min-w-full table-auto rounded-lg border mt-4">
        <thead className="bg-secondary-color">
          <tr>
            {knockoffColumns.map((col) => (
              <th
                key={col.accessorKey}
                className="px-4 py-2 text-left text-sm font-semibold text-header-color border-b"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedKnockoffs.map((knockoff, idx) => (
            <tr
              key={`${knockoff.base}-${knockoff.knock}-${idx}`}
              className={
                idx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"
              }
            >
              {knockoffColumns.map((col) => (
                <td key={col.accessorKey} className="px-4 py-2 text-sm">
                  {knockoff[col.accessorKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        table={knockoffTable}
        totalItems={knockoffRecords.length}
        startIndex={knockoffRecords.length === 0 ? 0 : pageIndex * pageSize + 1}
        endIndex={Math.min((pageIndex + 1) * pageSize, knockoffRecords.length)}
      />
    </>
  );
}

const UploadMap = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [groupBy] = useState<string[]>(["CompanyCode", "currency"]);
  const { notify } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm();

  const handleFiles = async (fileList: FileList, reportType: string) => {
    // Validate file types
    const invalidFiles = Array.from(fileList).filter((file) => {
      const fileName = file.name.toLowerCase();
      return (
        !fileName.endsWith(".csv") &&
        !fileName.endsWith(".xlsx") &&
        !fileName.endsWith(".xls")
      );
    });

    if (invalidFiles.length > 0) {
      notify(
        `Invalid file type(s): ${invalidFiles
          .map((f) => f.name)
          .join(", ")}. Only CSV and Excel files are accepted.`,
        "error"
      );
      return;
    }

    // Validate file sizes (10MB limit)
    const oversizedFiles = Array.from(fileList).filter(
      (file) => file.size > 10 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      notify(
        `File(s) too large: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}. Maximum size is 10MB.`,
        "error"
      );
      return;
    }

    // Check if files are not empty
    const emptyFiles = Array.from(fileList).filter((file) => file.size === 0);
    if (emptyFiles.length > 0) {
      notify(
        `Empty file(s) detected: ${emptyFiles.map((f) => f.name).join(", ")}.`,
        "error"
      );
      return;
    }

    // Process the file to extract headers
    try {
      const file = fileList[0];
      let headers: string[] = [];

      if (file.name.toLowerCase().endsWith(".csv")) {
        const csvText = await file.text();
        const rows = parseCSV(csvText);
        if (rows.length > 0) {
          headers = rows[0];
        }
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const excelData = await parseExcel(arrayBuffer);
        if (excelData.length > 0) {
          headers = excelData[0];
        }
      }

      const fileId = crypto.randomUUID();
      const templateHeaders = getTemplateHeaders(reportType);

      // Auto-populate matching headers
      const autoMapping: Record<string, string> = {};
      templateHeaders.forEach((templateHeader) => {
        const matchingHeader = headers.find(
          (h) => h.toLowerCase().trim() === templateHeader.toLowerCase().trim()
        );
        if (matchingHeader) {
          autoMapping[templateHeader] = matchingHeader;
          setValue(`${fileId}-${templateHeader}`, matchingHeader);
        }
      });

      const newFile: UploadedFile = {
        id: fileId,
        reportType,
        name: file.name,
        headers,
        mapping: autoMapping,
        file, // <-- Store the actual file object
      };

      setUploadedFiles((prev) => [...prev, newFile]);
      setShowForm(true);

      notify(
        `${reportType} file processed successfully. ${
          Object.keys(autoMapping).length
        } fields auto-mapped.`,
        "success"
      );
    } catch (error) {
      notify(
        "Error processing file: " +
          (error instanceof Error ? error.message : "Unknown error"),
        "error"
      );
    }
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setShowForm(false);
    setShowSummary(false);
  };

  const handleUpload = (reportType: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls";
    input.multiple = false;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        handleFiles(target.files, reportType);
      }
    };
    input.click();
  };

  const validateMapping = (fileId: string, templateHeaders: string[]) => {
    const mappingValues: string[] = [];
    const duplicates: string[] = [];

    for (const header of templateHeaders) {
      const value = watch(`${fileId}-${header}`);

      if (value && value !== "") {
        if (mappingValues.includes(value)) {
          duplicates.push(value);
        } else {
          mappingValues.push(value);
        }
      }
    }

    if (duplicates.length > 0) {
      notify(
        `Duplicate mappings detected: ${[...new Set(duplicates)].join(
          ", "
        )}. Each file column can only be mapped once.`,
        "error"
      );
      return false;
    }

    return true;
  };

  const onSubmit = (fileId: string, reportType: string) => {
    const templateHeaders = getTemplateHeaders(reportType);

    if (!validateMapping(fileId, templateHeaders)) {
      return;
    }

    const mapping: Record<string, string> = {};
    templateHeaders.forEach((header) => {
      const value = watch(`${fileId}-${header}`);
      if (value && value !== "") {
        mapping[header] = value;
      }
    });

    setUploadedFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, mapping, saved: true } : file
      )
    );

    notify(`${reportType} mapping saved successfully!`, "success");
  };

  // Get template headers for a report type
  const getTemplateHeaders = (reportType: string) => {
    const template = templates.find((t) =>
      reportType.toLowerCase().includes(t.name.toLowerCase())
    );
    return template?.headers || [];
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    if (uploadedFiles.length === 1) {
      setShowForm(false);
    }
  };

  const quickSummaryColumns = useMemo<ColumnDef<QuickSummaryRow>[]>(
    () => [
      {
        accessorKey: "CompanyCode",
        header: "Company",
        enableGrouping: true,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        enableGrouping: true,
      },
      {
        accessorKey: "AmountDoc",
        header: "Total Amount",
        // aggregationFn: "sum",
        cell: (info) => Number(info.getValue()).toLocaleString(), // Format as number
      },
    ],
    []
  );

  const nonQualifiedColumns = useMemo<ColumnDef<NonQualifiedRow>[]>(
    () => [
      { accessorKey: "CompanyCode", header: "Company Code" },
      { accessorKey: "Party", header: "Party" },
      { accessorKey: "DocumentCurrency", header: "Currency" },
      { accessorKey: "DocumentNumber", header: "Document No." },
      { accessorKey: "PostingDate", header: "Posting Date" },
      { accessorKey: "NetDueDate", header: "Net Due Date" },
      { accessorKey: "AmountDoc", header: "Amount (Doc Curr.)" },
      { accessorKey: "Source", header: "Source" },
      { accessorKey: "issues", header: "Issues" },
    ],
    []
  );

  const validationColumns = useMemo<ColumnDef<ValidationRow>[]>(
    () => [
      { accessorKey: "CompanyCode", header: "Company Code" },
      { accessorKey: "Party", header: "Party" },
      { accessorKey: "DocumentCurrency", header: "Currency" },
      { accessorKey: "DocumentNumber", header: "Document No." },
      { accessorKey: "issues", header: "Issues" },
    ],
    []
  );

  const [quickSummaryData, setQuickSummaryData] = useState<QuickSummaryRow[]>(
    []
  );
  const [validationData, setValidationData] = useState<ValidationRow[]>([]);
  const [nonQualifiedData, setNonQualifiedData] = useState<NonQualifiedRow[]>(
    []
  );
  console.log("Quick Summary Data:", quickSummaryData);

  const quickSummaryTable = useReactTable({
    data: quickSummaryData,
    columns: quickSummaryColumns,
    state: {
      grouping: groupBy, // <-- use your groupBy state here
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(), // <-- add this line
    initialState: {
      pagination: { pageSize: 5 },
      grouping: groupBy, // <-- set initial grouping
    },
  });

  const validationTable = useReactTable({
    data: validationData,
    columns: validationColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  const nonQualifiedTable = useReactTable({
    data: nonQualifiedData,
    columns: nonQualifiedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  // Utility to transform flat mapping to nested mapping for each report type
  function transformMapping(
    reportType: string,
    mapping: Record<string, string>
  ) {
    if (reportType === "FBL1N") {
      return {
        CompanyCode: mapping["Company Code"] || "Company Code",
        Party: mapping["Account"] || "Account",
        DocumentCurrency: mapping["Document Currency"] || "Document Currency",
        DocumentNumber: mapping["Document Number"] || "Document Number",
        DocumentDate: mapping["Document Date"] || "Document Date",
        PostingDate: mapping["Posting Date"] || "Posting Date",
        NetDueDate: mapping["Net Due Date"] || "Net Due Date",
        AmountDoc: mapping["Document Amount"] || "Amount in Doc. Curr.",
        LineItems: {
          product_id: mapping["Document Number"] || "Document Number",
          product_description: mapping["Text"] || "Text",
          line_item_amount:
            mapping["Amount in Doc. Curr."] || "Amount in Doc. Curr.",
          quantity: mapping["Quantity"] || "Quantity",
          unit_of_measure: mapping["UoM"] || "UoM",
          unit_price: mapping["Unit Price"] || "Unit Price",
        },
      };
    }
    if (reportType === "FBL3N") {
      return {
        CompanyCode: mapping["Company Code"] || "",
        Party: mapping["Account"] || "",
        DocumentCurrency: mapping["Document Currency"] || "",
        DocumentNumber: mapping["Document Number"] || "",
        DocumentDate: mapping["Document Date"] || "",
        PostingDate: mapping["Posting Date"] || "",
        NetDueDate: mapping["Clearing Date"] || "",
        AmountDoc: mapping["Amount in Doc. Curr."] || "",
        LineItems: {
          product_id: mapping["Document Number"] || "",
          product_description: mapping["Text"] || "",
          line_item_amount: mapping["Amount in Doc. Curr."] || "",
        },
      };
    }
    if (reportType === "FBL5N") {
      return {
        CompanyCode: mapping["Company Code"] || "",
        Party: mapping["Customer"] || "",
        DocumentCurrency: mapping["Document Currency"] || "",
        DocumentNumber: mapping["Document Number"] || "",
        DocumentDate: mapping["Document Date"] || "",
        PostingDate: mapping["Posting Date"] || "",
        NetDueDate: mapping["Net Due Date"] || "",
        AmountDoc: mapping["Amount in Doc. Curr."] || "",
        LineItems: {
          product_id: mapping["Document Number"] || "",
          product_description: mapping["Text"] || "",
          line_item_amount: mapping["Amount in Doc. Curr."] || "",
        },
      };
    }
    return mapping;
  }

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "group_label",
    "group_id",
    "count",
    "total_amount",
    "direction",
    "suggested_accounts",
    "proposed_allocation",
    "allocation",
    "confidence",
    "warnings",
    "actions",
    "expand",
  ]);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  const handleApiUpload = async (userId: string = "1") => {
    if (uploadedFiles.length === 0) {
      notify("No files to upload.", "error");
      return;
    }

    // Check if all mappings are saved

    for (const file of uploadedFiles) {
      try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("files", file.file);
        formData.append("source", file.reportType || "");
        const transformedMapping = transformMapping(
          file.reportType,
          file.mapping || {}
        );
        formData.append("mapping", JSON.stringify(transformedMapping));

        const res = await nos.post<any>(
          `${apiBaseUrl}/fx/exposures/upload/v91`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 1000000,
          }
        );

        notify("Upload successful!", "success");
        setUploadedFiles([]);

        // Set row data and non-qualified items from response
        if (res.data?.results?.length > 0) {
          console.log("API Response:", res.data);
          const allRows: any[] = [];
          const allNonQualified: any[] = [];

          res.data.results.forEach((result: any) => {
            if (Array.isArray(result.rows)) {
              allRows.push(...result.rows);
            }

            if (Array.isArray(result.non_qualified)) {
              result.non_qualified.forEach((item: any) => {
                const baseRow = {
                  Source: item.row.Source,
                  CompanyCode: item.row.CompanyCode,
                  Party: item.row.Party,
                  DocumentCurrency: item.row.DocumentCurrency,
                  DocumentNumber: item.row.DocumentNumber,
                  DocumentDate: item.row.DocumentDate,
                  PostingDate: item.row.PostingDate,
                  NetDueDate: item.row.NetDueDate,
                  AmountDoc: item.row.AmountDoc,
                  // issues will be set below
                };

                if (item.row.LineItems?.length) {
                  item.row.LineItems.forEach((line: any) => {
                    if (Array.isArray(item.issues) && item.issues.length > 0) {
                      item.issues.forEach((issue: string) => {
                        allNonQualified.push({
                          ...baseRow,
                          LineItemAmount: line.line_item_amount || "",
                          ProductID: line.product_id || "",
                          ProductDescription: line.product_description || "",
                          issues: issue,
                        });
                      });
                    } else {
                      allNonQualified.push({
                        ...baseRow,
                        LineItemAmount: line.line_item_amount || "",
                        ProductID: line.product_id || "",
                        ProductDescription: line.product_description || "",
                        issues: "",
                      });
                    }
                  });
                } else {
                  if (Array.isArray(item.issues) && item.issues.length > 0) {
                    item.issues.forEach((issue: string) => {
                      allNonQualified.push({
                        ...baseRow,
                        issues: issue,
                      });
                    });
                  } else {
                    allNonQualified.push({
                      ...baseRow,
                      issues: "",
                    });
                  }
                }
              });
            }
          });

          setQuickSummaryData(groupAndSumRows(allRows));
          setNonQualifiedData(allNonQualified);
          setValidationData(allNonQualified);
          setGroupedDocs(groupAndSumDocuments([...allRows]));
          setShowSummary(true);
        }
      } catch (error) {
        notify("Upload failed.", "error");
        console.error(error);
      }
    }
  };
  const [groupedDocs, setGroupedDocs] = useState<any[]>([]);

  // After you fetch and process your API data, call:
  // setDocumentRows([...allRows]);
  // setGroupedDocs(groupAndSumDocuments([...allRows]));

  const summaryTable = useReactTable({
    data: groupedDocs,
    columns: summaryColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    getExpandedRowModel: getExpandedRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });
  // ...existing code...

  const handleFifoClick = async () => {
    if (uploadedFiles.some((file) => !file.saved)) {
      notify("All mappings must be saved before running FIFO.", "error");
      return;
    }

    setIsLoading(true); // Start loading
    setShowForm(false);
    await handleApiUpload(); // <-- Trigger API upload here
    setIsLoading(false); // Stop loading
  };

  return (
    <>
      <div className="bg-secondary-color-lt border-border p-6 mb-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold text-secondary-text-dark">
          Upload SAP Line Item Reports (CSV/Excel)
        </h2>
        <div className="flex justify-between mt-6">
          <div className="flex gap-3">
            <button
              onClick={() => handleUpload("FBL1N")}
              disabled={showSummary}
              className={`bg-primary-lt hover:bg-primary text-white font-medium py-2 px-4 rounded-lg shadow-sm transition
    ${
      showSummary
        ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
        : ""
    }
  `}
            >
              Upload FBL1N
            </button>
            <button
              onClick={() => handleUpload("FBL3N")}
              disabled={showSummary}
              className={`bg-primary-lt hover:bg-primary text-white font-medium py-2 px-4 rounded-lg shadow-sm transition
    ${
      showSummary
        ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
        : ""
    }
  `}
            >
              Upload FBL3N
            </button>
            <button
              onClick={() => handleUpload("FBL5N")}
              disabled={showSummary}
              className={`bg-primary-lt hover:bg-primary text-white font-medium py-2 px-4 rounded-lg shadow-sm transition
    ${
      showSummary
        ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
        : ""
    }`}
            >
              Upload FBL5N
            </button>
          </div>

          {/* Right side buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleFifoClick}
              disabled={showSummary}
              className={`bg-primary-lt hover:bg-primary text-white font-medium py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2
    ${
      showSummary
        ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
        : ""
    }
  `}
            >
              <Settings size={18} /> Run FIFO Adjustments
            </button>
            <button
              onClick={handleReset}
              className="bg-primary-lt hover:bg-primary text-white font-medium py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
            >
              <RefreshCcw size={18} /> Reset
            </button>
          </div>
        </div>
        {showForm && (
          <div className="mt-8">
            <div className="bg-white border border-border rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-3 gap-4">
                {/* Receivables logic select */}
                <DropdownGroup
                  label="Receivables logic"
                  name="receivablesLogic"
                  options={[
                    "Standard (Debits base, Credits knock)",
                    "Reverse (Credits base, Debits knock)",
                  ]}
                />

                {/* Payables logic select */}
                <DropdownGroup
                  label="Payables logic"
                  name="payablesLogic"
                  options={[
                    "Standard (Credits base, Debits knock)",
                    "Reverse (Debits base, Credits knock)",
                  ]}
                />

                {/* Currency aliases: select + input */}

                <InputGroup
                  label="Custom alias"
                  name="customAlias"
                  placeholder="Currency alias"
                />
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="mt-8">
            <div className="flex flex-col gap-6">
              {uploadedFiles.map((file) => {
                const templateHeaders = getTemplateHeaders(file.reportType);

                return (
                  <div
                    key={file.id}
                    className="bg-white border border-border rounded-lg shadow-sm p-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-secondary-text-dark text-lg">
                        {file.reportType} Mapping - {file.name} -{" "}
                        {file.saved ? "Saved" : "Not Saved"}
                      </h4>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-800 transition"
                        title="Remove"
                        type="button"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <circle cx="10" cy="10" r="10" fill="none" />
                          <path
                            d="M6 6L14 14M14 6L6 14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <form
                      onSubmit={handleSubmit(() =>
                        onSubmit(file.id, file.reportType)
                      )}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-3 mb-6">
                        {templateHeaders.map((templateHeader, idx) => (
                          <div key={`${file.id}-${templateHeader}-${idx}`}>
                            <CustomSelect
                              label={templateHeader}
                              options={[
                                { value: "", label: "Choose..." },
                                ...file.headers.map((h) => ({
                                  value: h,
                                  label: h,
                                })),
                              ]}
                              selectedValue={watch(
                                `${file.id}-${templateHeader}`
                              )}
                              onChange={(value) =>
                                setValue(
                                  `${file.id}-${templateHeader}`,
                                  value,
                                  {
                                    shouldValidate: true,
                                  }
                                )
                              }
                              placeholder="Select..."
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <div>
                          <Button
                            type="submit"
                            categories="Medium"
                            color="Green"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Saving..." : "Save Mapping"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {!showSummary && !isLoading && (
        <TemplateGrid templates={templates} handleDownload={handleDownload} />
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && showSummary && (
        <div className="mt-8 flex flex-col gap-8 bg-white p-6 rounded-lg shadow-sm border border-border">
          {/* Quick Summary Table */}
          <div className="bg-white border border-border rounded-lg shadow-sm pt-6 h-max-[600px]">
            <div className="flex justify-between items-center mb-4 px-6">
              <h3 className="text-xl font-semibold">
                Quick Summary (Company × Currency)
              </h3>
              {/* <div>
                <Button categories="Medium" color="Fade" onClick={() => {}}>
                  Export Quick Summary
                </Button>
              </div> */}
            </div>
            <NyneOSTable2
              table={quickSummaryTable}
              columns={quickSummaryColumns}
              nonDraggableColumns={[]}
              nonSortingColumns={[]}
              loading={false}
            />
            <Pagination
              table={quickSummaryTable}
              totalItems={quickSummaryData.length}
              startIndex={
                quickSummaryData.length === 0
                  ? 0
                  : quickSummaryTable.getState().pagination.pageIndex *
                      quickSummaryTable.getState().pagination.pageSize +
                    1
              }
              endIndex={Math.min(
                (quickSummaryTable.getState().pagination.pageIndex + 1) *
                  quickSummaryTable.getState().pagination.pageSize,
                quickSummaryData.length
              )}
            />
          </div>

          {/* Documents Summary Table */}
          <div className="bg-white border border-border rounded-lg shadow-sm pt-6 h-max-[600px]">
            <div className="flex justify-between items-center mb-4 px-6">
              <h3 className="text-xl font-semibold">Documents Summary</h3>
            </div>
            <div className="flex-1 bg-white overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <DndContext
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToFirstScrollableAncestor]}
                >
                  <table className="min-w-full table-auto">
                    <thead className="bg-secondary-color rounded-xl">
                      {summaryTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border select-none group"
                              style={{ width: header.getSize() }}
                            >
                              <div className="flex items-center gap-1">
                                <span>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y">
                      {summaryTable.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={summaryColumns.length}
                            className="px-6 py-12 text-center text-primary"
                          >
                            No Data Available
                          </td>
                        </tr>
                      ) : (
                        summaryTable.getRowModel().rows.map((row, idx) => (
                          <React.Fragment key={row.id}>
                            <tr
                              className={
                                idx % 2 === 0
                                  ? "bg-primary-md"
                                  : "bg-secondary-color-lt"
                              }
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-4 py-3 text-sm">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </tr>
                            {row.getIsExpanded() && (
                              <tr
                                key={`${row.id}-expanded`}
                                data-row-id={`${row.id}-expanded`}
                              >
                                <td
                                  colSpan={summaryColumns.length}
                                  className="px-6 py-4 bg-primary-md"
                                >
                                  <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
                                    <h4 className="text-md font-medium text-primary mb-3 pb-2">
                                      Adjustment Details
                                    </h4>
                                    {/* Detail Table Pagination */}
                                    <DetailTable
                                      records={row.original.records.filter(
                                        (r: DocumentRecord) =>
                                          r.status === "ok" ||
                                          r.status === "knocked_off" ||
                                          r.status === "non_qualified"
                                      )}
                                    />
                                    {/* Knockoff Table Pagination */}
                                    {row.original.records.some(
                                      (r: DocumentRecord) =>
                                        r.status === "knocked_off" &&
                                        Array.isArray(r.knockoffs) &&
                                        r.knockoffs.length > 0
                                    ) && (
                                      <KnockoffTable
                                        knockoffRecords={row.original.records
                                          .filter(
                                            (r: DocumentRecord) =>
                                              r.status === "knocked_off" &&
                                              Array.isArray(r.knockoffs) &&
                                              r.knockoffs.length > 0
                                          )
                                          .flatMap(
                                            (r: DocumentRecord) => r.knockoffs
                                          )}
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </DndContext>
              </div>
              <Pagination
                table={summaryTable}
                totalItems={groupedDocs.length}
                startIndex={
                  groupedDocs.length === 0
                    ? 0
                    : summaryTable.getState().pagination.pageIndex *
                        summaryTable.getState().pagination.pageSize +
                      1
                }
                endIndex={Math.min(
                  (summaryTable.getState().pagination.pageIndex + 1) *
                    summaryTable.getState().pagination.pageSize,
                  groupedDocs.length
                )}
              />
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg shadow-sm pt-6 h-max-[600px]">
            <h3 className="text-xl font-semibold mb-4 px-6">
              Validation Panel
            </h3>
            <NyneOSTable2
              table={validationTable}
              columns={validationColumns}
              nonDraggableColumns={[]}
              nonSortingColumns={[]}
              loading={false}
            />
            <Pagination
              table={validationTable}
              totalItems={validationData.length}
              startIndex={
                validationData.length === 0
                  ? 0
                  : validationTable.getState().pagination.pageIndex *
                      validationTable.getState().pagination.pageSize +
                    1
              }
              endIndex={Math.min(
                (validationTable.getState().pagination.pageIndex + 1) *
                  validationTable.getState().pagination.pageSize,
                validationData.length
              )}
            />
          </div>

          <div className="bg-white border border-border rounded-lg shadow-sm pt-6 h-max-[600px]">
            <div className="flex justify-between items-center mb-4 px-6">
              <h3 className="text-xl font-semibold">Non-Qualified Items</h3>
              {/* <div>
                <Button categories="Medium" color="Fade" onClick={() => {}}>
                  Export Non-Qualified CSV
                </Button>
              </div> */}
            </div>
            <NyneOSTable2
              table={nonQualifiedTable}
              columns={nonQualifiedColumns}
              nonDraggableColumns={[]}
              nonSortingColumns={[]}
              loading={false}
            />
            <Pagination
              table={nonQualifiedTable}
              totalItems={nonQualifiedData.length}
              startIndex={
                nonQualifiedData.length === 0
                  ? 0
                  : nonQualifiedTable.getState().pagination.pageIndex *
                      nonQualifiedTable.getState().pagination.pageSize +
                    1
              }
              endIndex={Math.min(
                (nonQualifiedTable.getState().pagination.pageIndex + 1) *
                  nonQualifiedTable.getState().pagination.pageSize,
                nonQualifiedData.length
              )}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UploadMap;
