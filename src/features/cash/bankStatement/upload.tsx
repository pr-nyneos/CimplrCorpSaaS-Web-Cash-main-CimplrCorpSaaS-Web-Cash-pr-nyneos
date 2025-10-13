const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || "";
import React, { useState } from "react";
import parseExcel from "../../../utils/parseExcel";
import parseCSV from "../../../utils/parseCSV";
import { formatToYYYYMMDD, isLikelyDate } from "../../../utils/dateUtils";
import nos from "../../../utils/nos";
import Button from "../../../components/ui/Button.tsx";
import UploadSummaryItem from "../../../components/upload/UploadSummaryItem.tsx";
import FileUpload from "../../../components/upload/FileUpload.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import {
  // validateFileContent,
  validatePreviewData,
} from "../../../utils/realValidation.ts";
import TemplateGrid from "../../../components/upload/TemplateGrid.tsx";
import handleDownload from "../../../utils/handleDownload.ts";
import { templates,bankStatementValidationConfig} from "./config.ts";
import type {
  PreviewState,
  UploadedFile,
} from "../../../types/type.ts";
// import convertToCSVBlob from "../../fx/exposureUpload.tsx/UPLOADER/convertToCSVBlob.ts";
// import parseExcel from "../../fx/exposureUpload.tsx/UPLOADER/parseExcel.ts";




const EXPOSURE_OPTIONS = [
  { label: "Payables", value: "payables" },
  { label: "Receivables", value: "receivables" },
];

const Upload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { notify } = useNotification();
  const [selectedType, setSelectedType] = useState("");
  const [previewStates, setPreviewStates] = useState<
    Record<string, PreviewState>
  >({});

  // Store processed file blobs and names for upload on submit
  const [pendingUploads, setPendingUploads] = useState<{ blob: Blob; name: string }[]>([]);

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

    // Process and store formatted blobs for upload on submit
    const uploads: { blob: Blob; name: string }[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const file = fileList[i];
      // 1. Parse file to rows
      let rows: string[][] = [];
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        rows = parseCSV(text);
      } else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        const arrayBuffer = await file.arrayBuffer();
        rows = parseExcel(arrayBuffer);
      } else {
        notify(`Unsupported file type: ${file.name}`, "error");
        continue;
      }
      if (!rows.length) {
        notify(`File appears to be empty: ${file.name}`, "error");
        continue;
      }
      const headers = rows[0];
      const dataRows = rows.slice(1);
      // 2. Detect date columns
      const dateColIdxs: number[] = [];
      for (let col = 0; col < headers.length; col++) {
        if (dataRows.some(row => isLikelyDate(row[col]))) {
          dateColIdxs.push(col);
        }
      }
      // 3. Only format if not already YYYY-MM-DD
      const formattedRows = dataRows.map(row =>
        row.map((cell, idx) => {
          if (!dateColIdxs.includes(idx)) return cell;
          // If already YYYY-MM-DD, leave as is
          if (typeof cell === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cell)) return cell;
          // If already YYYYMMDD, convert to YYYY-MM-DD
          if (typeof cell === 'string' && /^\d{8}$/.test(cell)) {
            return `${cell.slice(0,4)}-${cell.slice(4,6)}-${cell.slice(6,8)}`;
          }
          return formatToYYYYMMDD(cell);
        })
      );
      // 4. Re-serialize to CSV
      const csvString = [headers, ...formattedRows].map(row =>
        row.map(cell => {
          const needsQuotes = typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'));
          const safeCell = String(cell).replace(/"/g, '""');
          return needsQuotes ? `"${safeCell}"` : safeCell;
        }).join(",")
      ).join("\r\n");
      const blob = new Blob([csvString], { type: "text/csv" });
      const fileName = file.name.replace(/\.(csv|xlsx|xls)$/i, "") + "_formatted.csv";
      uploads.push({ blob, name: fileName });
    }
    setPendingUploads(uploads);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    // if (!selectedType) {
    //   notify("Please select a type of exposure first.", "warning");
    //   event.target.value = "";
    //   return;
    // }

    if (event.target.files && event.target.files.length > 0) {
      handleFiles(event.target.files);
    } else {
      notify("No files selected.", "warning");
    }
    // Reset the input so the same file can be selected again if needed
    event.target.value = "";
  };


  // Upload all pending files on submit
  const handleSubmit = async () => {
    if (!pendingUploads.length) {
      notify("No files ready for upload.", "warning");
      return;
    }
    let successCount = 0;
    let errorCount = 0;
    for (const { blob, name } of pendingUploads) {
      const formData = new FormData();
      formData.append("file", new File([blob], name, { type: "text/csv" }));
      try {
        const res = await nos.post<any>(
          `${apiBaseUrl}/cash/upload-bank-statement`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 1000000,
          }
        );
        if (res.data && res.data.success) {
          successCount++;
        } else {
          errorCount++;
          notify(`✗ Upload failed for ${name}: ${res.data?.error || "Unknown error"}`, "error");
        }
      } catch (error) {
        errorCount++;
        notify(`✗ Upload failed for ${name}: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    }
    if (successCount > 0 && errorCount === 0) {
      notify(`All ${successCount} file(s) uploaded successfully!`, "success");
      setPendingUploads([]);
      setFiles([]);
    } else if (successCount > 0) {
      notify(`${successCount} file(s) uploaded successfully, ${errorCount} failed`, "warning");
    } else if (errorCount > 0) {
      notify(`All ${errorCount} file(s) failed to upload`, "error");
    }
  };

  return (
    <React.Fragment>
      <div className="space-y-6">
        <div className="bg-secondary-color-lt border-border p-6 rounded-lg shadow-sm border">
          <FileUpload
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
                disabled
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
              <Button onClick={handleSubmit}>
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
            validationConfig={bankStatementValidationConfig}
            validatePreviewData={validatePreviewData}
          />
        )}

        {/* Templates Grid */}
        <TemplateGrid templates={templates} handleDownload={handleDownload} />
      </div>
    </React.Fragment>
  );
};

export default Upload;
