import React, { useState } from "react";
import Button from "../../../components/ui/Button.tsx";
import UploadSummaryItem from "../../../components/upload/UploadSummaryItem.tsx";
import FileUpload from "../../../components/upload/FileUpload.tsx";
import { useNotification } from "../../../app/providers/NotificationProvider/Notification.tsx";
import {
  validateFileContent,
  validatePreviewData,
} from "../../../utils/realValidation.ts";
import TemplateGrid from "../../../components/upload/TemplateGrid.tsx";
import handleDownload from "../../../utils/handleDownload.ts";
import { templates, proposalValidationConfig} from "./config.ts";
import type {
  PreviewState,
  UploadedFile,
} from "../../../types/type.ts";
// import convertToCSVBlob from "../../fx/exposureUpload.tsx/UPLOADER/convertToCSVBlob.ts";
// import parseExcel from "../../fx/exposureUpload.tsx/UPLOADER/parseExcel.ts";


const ProposalUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { notify } = useNotification();
  // const [selectedType, setSelectedType] = useState("");
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
        const validationConfig = proposalValidationConfig;
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
      // console.log(fileData.name, "processed with status:", fileData.status);
    }
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

//   const handleSetManually = async () => {
//     if (!selectedType) {
//       notify("Please select an exposure type before submitting.", "error");
//       return;
//     }

//     // Check if there are any files with validation errors
//     const filesWithErrors = files.filter(
//       (file) => file.validationErrors && file.validationErrors.length > 0
//     );

//     if (filesWithErrors.length > 0) {
//       notify(
//         "Please resolve all validation errors before submitting.",
//         "error"
//       );
//       return;
//     }

//     notify("Uploading files...", "info");

//     let successCount = 0;
//     let errorCount = 0;

//     for (const file of files) {
//       try {
//         let blob: Blob | File | undefined;
//         let fileName: string;

//         // Check if file is Excel format
//         const isExcelFile =
//           file.name.toLowerCase().endsWith(".xlsx") ||
//           file.name.toLowerCase().endsWith(".xls");

//         // Use edited preview data if available
//         if (
//           (file as any).previewEdited &&
//           previewStates[file.id]?.headers &&
//           previewStates[file.id]?.data
//         ) {
//           // Convert preview data to CSV
//           blob = convertToCSVBlob(
//             previewStates[file.id].headers,
//             previewStates[file.id].data
//           );
//           fileName = `${file.name.replace(
//             /\.(csv|xlsx|xls)$/i,
//             ""
//           )}_modified.csv`;
//         } else if (isExcelFile && file.file) {
//           // Convert Excel file to CSV for upload
//           try {
//             const arrayBuffer = await file.file.arrayBuffer();
//             const excelData = parseExcel(arrayBuffer);

//             if (excelData.length === 0) {
//               throw new Error("Excel file appears to be empty");
//             }

//             const [headers, ...rows] = excelData;
//             blob = convertToCSVBlob(headers, rows);
//             fileName = `${file.name.replace(
//               /\.(xlsx|xls)$/i,
//               ""
//             )}_converted.csv`;

//             // notify(`Converting ${file.name} to CSV format...`, "info");
//           } catch (excelError) {
//             errorCount++;

//             continue;
//           }
//         } else if (file.file) {
//           // Use original file (CSV)
//           blob = file.file;
//           fileName = file.name;
//         } else {
//           errorCount++;
//           notify(`No file data found for ${file.name}`, "error");
//           continue;
//         }

//         const formData = new FormData();
//         const fieldName =
//           selectedType === "PO"
//             ? "input_purchase_orders"
//             : selectedType === "LC"
//             ? "input_letters_of_credit"
//             : selectedType === "GRN"
//             ? "input_grn"
//             : selectedType === "Creditor"
//             ? "input_creditors"
//             : selectedType === "Debtors"
//             ? "input_debitors"
//             : "input_sales_orders";

//         formData.append(
//           fieldName,
//           new File([blob], fileName, { type: "text/csv" }) // Always set type as CSV
//         );

//         console.log(formData, "FormData for upload", fieldName);

//         // notify(`Uploading ${fileName}...`, "info");

//         const res = await axios.post(
//           "https://backend-slqi.onrender.com/api/exposureUpload/batch-upload",
//           formData,
//           {
//             headers: {
//               "Content-Type": "multipart/form-data",
//             },
//             timeout: 30000, // 30 second timeout
//           }
//         );

//         if (res.data.results && res.data.results[0]?.success) {
//           successCount++;
//           notify(`✓ ${file.name} uploaded successfully`, "success");
//         } else if (res.data.results && res.data.results[0]) {
//           errorCount++;
//           const errorMsg = res.data.results[0]?.error || "Unknown error";

//           // Handle specific error types
//           if (errorMsg.includes("duplicate key")) {
//             notify(
//               `✗ Upload failed for ${file.name}: Duplicate data found`,
//               "error"
//             );
//           } else if (errorMsg.includes("validation")) {
//             notify(
//               `✗ Upload failed for ${file.name}: Data validation error`,
//               "error"
//             );
//           } else {
//             notify(`✗ Upload failed for ${file.name}: ${errorMsg}`, "error");
//           }
//         } else {
//           errorCount++;
//           notify(
//             `✗ Upload failed for ${file.name}: Invalid response from server`,
//             "error"
//           );
//         }
//       } catch (err) {
//         errorCount++;
//         console.error(`Error uploading ${file.name}:`, err);

//         if (axios.isAxiosError(err)) {
//           if (err.code === "ECONNABORTED") {
//             notify(
//               `✗ Upload timeout for ${file.name}. Please try again.`,
//               "error"
//             );
//           } else if (err.response?.status === 413) {
//             notify(`✗ File ${file.name} is too large`, "error");
//           } else if (err.response?.status >= 500) {
//             notify(
//               `✗ Server error occurred during upload for ${file.name}`,
//               "error"
//             );
//           } else {
//             notify(
//               `✗ Network error occurred during upload for ${file.name}`,
//               "error"
//             );
//           }
//         } else {
//           notify(
//             `✗ Unexpected error occurred during upload for ${file.name}`,
//             "error"
//           );
//         }
//       }
//     }

//     // Final summary
//     if (successCount > 0 && errorCount === 0) {
//       notify(`All ${successCount} file(s) uploaded successfully!`, "success");
//       setFiles([]);
//       setPreviewStates({});
//     } else if (successCount > 0) {
//       notify(
//         `${successCount} file(s) uploaded successfully, ${errorCount} failed`,
//         "warning"
//       );
//     } else if (errorCount > 0) {
//       notify(`All ${errorCount} file(s) failed to upload`, "error");
//     }
//   };

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
            {/* <div>
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
            </div> */}

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
              <Button onClick={() => {}}>
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
            validationConfig={proposalValidationConfig}
            validatePreviewData={validatePreviewData}
          />
        )}

        {/* Templates Grid */}
        <TemplateGrid templates={templates} handleDownload={handleDownload} />
      </div>
    </React.Fragment>
  );
};

export default ProposalUpload;
