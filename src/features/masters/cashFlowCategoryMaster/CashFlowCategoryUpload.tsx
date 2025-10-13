import React, { useState } from "react";
import UploadSummaryItem from "../../../components/upload/UploadSummaryItem.tsx";
import FileUpload from "../../../components/upload/FileUpload.tsx";

import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import Button from "../../../components/ui/Button.tsx";

import {
  validateFileContent,
  validatePreviewData,
} from "../../../utils/realValidation.ts";
import TemplateGrid from "../../../components/upload/TemplateGrid.tsx";
import handleDownload from "../../../utils/handleDownload.ts";
import type {
  UploadBankResponse,
  PreviewState,
  UploadedFile,
} from "../../../types/type.ts";
import nos from "../../../utils/nos.tsx";
import parseExcel from "../../../utils/parseExcel.ts";
import parseCSV from "../../../utils/parseCSV.ts";
import convertToCSVBlob from "../../../utils/convertToCSVBlob.ts";
import { templates, cashFlowCategoryValidationConfig } from "./config.ts";

// import convertToCSVBlob from "../../fx/exposureUpload.tsx/UPLOADER/convertToCSVBlob.ts";
// import parseExcel from "../../fx/exposureUpload.tsx/UPLOADER/parseExcel.ts";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;


const EXPOSURE_OPTIONS = [
  { label: "Payables", value: "payables" },
  { label: "Receivables", value: "receivables" },
];

const UploadFile: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { notify } = useNotification();
  const [selectedType, setSelectedType] = useState("");
  const [previewStates, setPreviewStates] = useState<
    Record<string, PreviewState>
  >({});

  const handleFiles = async (fileList: FileList) => {
    // Check if type is selected
    // if (!selectedType) {
    //   notify(
    //     "Please select a type of exposure before uploading files.",
    //     "error"
    //   );
    //   return;
    // }

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

    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: "processing",
      uploadDate: new Date(),
      file: file,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    notify(`Processing ${fileList.length} file(s)...`, "info");

    const processFile = async (file: File, fileData: UploadedFile) => {
      try {
        const validationConfig = cashFlowCategoryValidationConfig;
        const validation = await validateFileContent(file, validationConfig);

        if (!validation || !validation.status) {
          throw new Error("Invalid validation result");
        }

        return {
          id: fileData.id,
          update: {
            ...validation,
            status: validation.status,
          },
        };
      } catch (error) {
        console.error("Error processing file:", fileData.name, error);
        return {
          id: fileData.id,
          update: {
            status: "error" as const,
            error: "Validation failed",
            validationErrors: [{ description: "Validation failed" }],
          },
        };
      }
    };

    // Process all files
    for (let i = 0; i < newFiles.length; i++) {
      const file = fileList[i];
      const fileData = newFiles[i];

      const result = await processFile(file, fileData);

      // Apply the update
      setFiles((prev) => {
        return prev.map((f) => {
          if (f.id === result.id) {
            const updated = { ...f, ...result.update };
            console.log(
              `Updating file ${f.name} from ${f.status} to ${updated.status}`
            );
            return updated;
          }
          return f;
        });
      });
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedType) {
      notify("Please select a type of exposure first.", "warning");
      event.target.value = "";
      return;
    }

    if (event.target.files && event.target.files.length > 0) {
      handleFiles(event.target.files);
    } else {
      notify("No files selected.", "warning");
    }
    // Reset the input so the same file can be selected again if needed
    event.target.value = "";
  };

  const handleSetManually = async () => {
  // Validation error check
  const filesWithErrors = files.filter(
    (file: UploadedFile) => file.validationErrors ? file.validationErrors.length > 0 : false
  );
  if (filesWithErrors.length > 0) {
    notify("Please resolve all validation errors before submitting.", "error");
    return;
  }

  notify("Uploading files...", "info");

  const pendingUploads: { blob: Blob; name: string }[] = [];

  // Prepare all files for upload
  for (const file of files as UploadedFile[]) {
    try {
      let blob: Blob | undefined;
      let fileName: string;

      const isExcelFile = /\.(xlsx|xls)$/i.test(file.name);

      if (previewStates[file.id]) {
        // Case 1: Edited preview data
        const { headers, data }: PreviewState = previewStates[file.id];
        blob = convertToCSVBlob(headers, data);
        fileName = file.name.replace(/\.(csv|xlsx|xls)$/i, "") + "_modified.csv";
      } else if (isExcelFile && file.file) {
        // Case 2: Excel → CSV
        const excelData: string[][] = parseExcel(
          await file.file.arrayBuffer()
        );
        if (!excelData.length) throw new Error("Excel file appears to be empty");

        const [headers, ...rows] = excelData;
        blob = convertToCSVBlob(headers, rows);
        fileName = file.name.replace(/\.(xlsx|xls)$/i, "") + "_converted.csv";
      } else if (file.file) {
        // Case 3: CSV normalize
        const rows: string[][] = parseCSV(await file.file.text());
        if (!rows.length) throw new Error("CSV file appears to be empty");

        const csvString = rows
          .map((row) =>
            row
              .map((cell) => {
                const needsQuotes = /[,"\n]/.test(cell);
                const safeCell = cell.replace(/"/g, '""');
                return needsQuotes ? `"${safeCell}"` : safeCell;
              })
              .join(",")
          )
          .join("\r\n");

        blob = new Blob([csvString], { type: "text/csv" });
        fileName = file.name.replace(/\.csv$/i, "") + "_parsed.csv";
      } else {
        notify(`No file data found for ${file.name}`, "error");
        continue;
      }

      if (blob) {
        pendingUploads.push({ blob, name: fileName });
      }
    } catch (err) {
      notify(
        `✗ Error while preparing ${file.name}: ${
          err instanceof Error ? err.message : String(err)
        }`,
        "error"
      );
    }
  }

  // Upload prepared files
  for (const { blob, name } of pendingUploads) {
    const formData = new FormData();
    formData.append("file", new File([blob], name, { type: "text/csv" }));

    try {
      const res = await nos.post<UploadBankResponse>(
        `${apiBaseUrl}/master/cashflow-category/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 1000000,
        }
      );

      if (res.data.success) {
        notify(`✓ ${name} uploaded successfully`, "success");
      } else {
        notify(
          `✗ Upload failed for ${name}: ${res.data.error || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      notify(
        `✗ Upload failed for ${name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        "error"
      );
    }
  }

  // Clear state if everything succeeded
  if (pendingUploads.length > 0) {
    setFiles([]);
    setPreviewStates({});
  }
};

  return (
    <React.Fragment>
      <div className="space-y-6">
        <div className="bg-secondary-color-lt border-border p-6 rounded-lg shadow-sm border">
          <FileUpload
            // disabled={!selectedType}
            // title={"Please select a type of Transaction first."}
            handleFiles={handleFiles}
            handleFileInput={handleFileInput}
          />

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Type of Transaction
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setFiles([]);
                }}
              >
                <option value="">Choose...</option>
                {EXPOSURE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Business Unit
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
                value={selectedType}
                disabled
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Choose..</option>
                <option value="payable">BU1</option>
                <option value="receivable">BU2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Updated By:
              </label>
              <input
                type="text"
                placeholder="Current User"
                // value={localStorage.getItem("userEmail")}
                disabled
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none bg-secondary-color-lt text-secondary-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Updated Date/Time:
              </label>
              <input
                type="text"
                value={new Date().toLocaleString()}
                disabled
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none border-border bg-secondary-color-lt text-secondary-text"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:justify-end gap-4">
            <div className="w-full md:w-auto">
              <Button color="Fade" disabled>
                <span>Import Data</span>
              </Button>
            </div>

            <div className="w-full md:w-auto">
              <Button onClick={handleSetManually}>
                <span className="text-white">Submit</span>
              </Button>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <UploadSummaryItem
            files={files}
            setFiles={setFiles}
            setPreviewStates={setPreviewStates}
            previewStates={previewStates}
            validationConfig={cashFlowCategoryValidationConfig}
            validatePreviewData={validatePreviewData}
          />
        )}

        {/* Templates Grid */}
        <TemplateGrid templates={templates} handleDownload={handleDownload} />
      </div>
    </React.Fragment>
  );
};

export default UploadFile;
