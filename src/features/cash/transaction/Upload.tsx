import React, { useState } from "react";
import Button from "../../../components/ui/Button.tsx";
import UploadSummaryItem from "../../../components/upload/UploadSummaryItem.tsx";
import FileUpload from "../../../components/upload/FileUpload.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
// import {
//   // validateFileContent,
//   // validatePreviewData,
// } from "../../../utils/realValidation.ts";
import TemplateGrid from "../../../components/upload/TemplateGrid.tsx";
import handleDownload from "../../../utils/handleDownload.ts";
import {
  templates,
  receivablesValidationConfig,
  payablesValidationConfig,
} from "./config.ts";
import type {
  PreviewState,
  UploadBankResponse,
  UploadedFile,
} from "../../../types/type.ts";
import nos from "../../../utils/nos.tsx";
// import parseExcel from "../../../utils/parseExcel.ts";
// import parseCSV from "../../../utils/parseCSV.ts";
import convertToCSVBlob from "../../../utils/convertToCSVBlob.ts";
// import convertToCSVBlob from "../../fx/exposureUpload.tsx/UPLOADER/convertToCSVBlob.ts";
// import parseExcel from "../../fx/exposureUpload.tsx/UPLOADER/parseExcel.ts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const getValidationConfigFromSelected = (selectedType: string) => {
  switch (selectedType) {
    case "payables":
      return payablesValidationConfig;
    case "receivables":
      return receivablesValidationConfig;
    default:
      return receivablesValidationConfig;
  }
};

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
    if (!selectedType) {
      notify(
        "Please select a type of transaction before uploading files.",
        "error"
      );
      return;
    }

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
      status: "success",
      uploadDate: new Date(),
      file: file,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    notify(`Processing ${fileList.length} file(s)...`, "info");
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
    notify("Uploading files...", "info");

    const pendingUploads: { blob: Blob; name: string }[] = [];

    for (const file of files as UploadedFile[]) {
      try {
        let blob: Blob | undefined;
        let fileName: string;

        if (previewStates[file.id]) {
          // Use edited preview data if available
          const { headers, data }: PreviewState = previewStates[file.id];
          blob = convertToCSVBlob(headers, data);
          fileName =
            file.name.replace(/\.(csv|xlsx|xls)$/i, "") + "_modified.csv";
        } else {
          // Otherwise, upload the original file as-is
          blob = file.file;
          fileName = file.name;
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
      const fieldName =
        selectedType === "payables" ? "payables" : "receivables";
      formData.append(fieldName, new File([blob], name, { type: "text/csv" }));

      try {
        const res = await nos.post<UploadBankResponse>(
          `${apiBaseUrl}/cash/transactions/upload-payrec-batch`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 1000000,
          }
        );

        if (res.data.success) {
          notify(`${name} uploaded successfully`, "success");
          setFiles([]);
          setPreviewStates({});
        } else {
          notify(
            `✗ Upload failed for ${name}: ${res.data.error || "Unknown error"}`,
            "error"
          );
        }
      } catch (error) {
        notify(
          `Upload failed for ${name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          "error"
        );
      }
    }

 
  };

  return (
    <React.Fragment>
      <div className="space-y-6">
        <div className="bg-secondary-color-lt border-border p-6 rounded-lg shadow-sm border">
          <FileUpload
            disabled={!selectedType}
            title={"Please select a type of Transaction first."}
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
            validationConfig={getValidationConfigFromSelected(selectedType)}
            // validatePreviewData={validatePreviewData}
          />
        )}

        {/* Templates Grid */}
        <TemplateGrid templates={templates} handleDownload={handleDownload} />
      </div>
    </React.Fragment>
  );
};

export default UploadFile;
