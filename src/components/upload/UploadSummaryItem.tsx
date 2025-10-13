import React, { useState, useRef, useEffect } from "react";
import { Check, AlertCircle, Eye, X, FileText } from "lucide-react";
// @ts-ignore
// import { FixedSizeList as List } from "react-window";
// @ts-ignore


import parseCSV from "../../utils/parseCSV.ts";
import parseExcel from "../../utils/parseExcel.ts";
import PreviewTable from "./PreviewTable.tsx";
import LoadingSpinner from "../../components/layout/LoadingSpinner.tsx";
import { useNotification } from "../../app/providers/NotificationProvider/Notification.tsx";
import {
  getFileStatusColor,
  getFileTextColor,
  formatFileSize,
} from "../../utils/function.ts";
import type {
  ValidationConfig,
  PreviewState,
  UploadedFile,
  ValidationError,
} from "../../types/type.ts";

type MappedValidationError = {
  description: string;
  row?: number;
  column?: number;
  currentValue?: string;
};

function mapValidationErrors(errors: unknown[]): MappedValidationError[] {
  return Array.isArray(errors)
    ? errors
        .map((err) => {
          if (typeof err === "string") {
            return { description: err };
          } else if (
            typeof err === "object" &&
            err !== null &&
            "description" in err
          ) {
            return err as MappedValidationError;
          } else {
            return null;
          }
        })
        .filter((e): e is MappedValidationError => e !== null)
    : [];
}

type PreviewStates = Record<string, PreviewState>;

interface UploadSummaryItemProps {
  files: UploadedFile[];
  previewStates: PreviewStates;
  setPreviewStates: (
    updater: (
      prev: Record<string, PreviewState>
    ) => Record<string, PreviewState>
  ) => void;
  setFiles: (updater: (prev: UploadedFile[]) => UploadedFile[]) => void;
  validationConfig: ValidationConfig;
  validatePreviewData?: (
    data: string[][],
    config: ValidationConfig
  ) => ValidationError[];
}

const ROWS_WARNING_THRESHOLD = 1000;

const MemoizedPreviewTable = React.memo(PreviewTable);

const UploadSummaryItem: React.FC<UploadSummaryItemProps> = ({
  files,
  previewStates,
  setFiles,
  setPreviewStates,
  validationConfig,
  validatePreviewData,
}) => {
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);

  // Store FileReader instances for cleanup
  const fileReaders = useRef<Record<string, FileReader>>({});

  useEffect(() => {
    return () => {
      // Abort any ongoing file reads when component unmounts
      Object.values(fileReaders.current).forEach((reader) => {
        if (reader && typeof reader.abort === "function") {
          reader.abort();
        }
      });
    };
  }, []);

  const handlePreviewFile = (uploadedFile: UploadedFile) => {
    // Check if preview is already showing for this file
    if (previewStates[uploadedFile.id]?.show) {
      // Close the preview
      setPreviewStates((prev) => ({
        ...prev,
        [uploadedFile.id]: {
          ...prev[uploadedFile.id],
          show: false,
        },
      }));
      return;
    }

    if (!uploadedFile.file) {
      console.error("No file found for preview");
      return;
    }

    const fileName = uploadedFile.file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const reader = new FileReader();

    // Store the reader for cleanup
    fileReaders.current[uploadedFile.id] = reader;

    setLoading(true);

    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        if (!fileData) return;

        let rows: string[][];

        if (isExcel) {
          // Handle Excel files
          rows = parseExcel(fileData as ArrayBuffer);
        } else {
          // Handle CSV files - Fix this part
          const text = fileData as string;
          rows = parseCSV(text);
        }

        if (rows.length === 0) return;

        const [headerRow, ...dataRows] = rows;

        // Warn user if file is very large
        if (dataRows.length > ROWS_WARNING_THRESHOLD) {
          notify(
            `Large file detected (${dataRows.length} rows). Only visible rows will be rendered for performance.`,
            "warning"
          );
        }

        const validationErrors = validatePreviewData
          ? validatePreviewData([headerRow, ...dataRows], validationConfig)
          : [];
        const mappedValidationErrors = mapValidationErrors(validationErrors);

        setPreviewStates((prev) => ({
          ...prev,
          [uploadedFile.id]: {
            headers: headerRow || [],
            data: dataRows, // all data, no slice
            show: true,
            validationErrors: mappedValidationErrors,
          },
        }));
      } catch (error) {
        console.error("Error parsing file for preview:", error);
      } finally {
        setLoading(false);
        // Cleanup reader after use
        delete fileReaders.current[uploadedFile.id];
      }
    };

    reader.onerror = () => {
      setLoading(false);
      console.error("Error reading file for preview");
      notify("Error reading file for preview", "error");
      // Cleanup reader on error
      delete fileReaders.current[uploadedFile.id];
    };

    // Read file based on type
    if (isExcel) {
      reader.readAsArrayBuffer(uploadedFile.file);
    } else {
      reader.readAsText(uploadedFile.file);
    }
  };

  const handleIssuesResolved = (fileId: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId
          ? {
              ...file,
              status: "success",
              validationErrors: [],
              error: undefined,
              hasMissingValues: false,
            }
          : file
      )
    );
  };
  const handleRemoveRow = (rowIndex: number, fileId: string) => {
  setPreviewStates((prev) => {
    const updated = { ...prev };
    if (updated[fileId]) {
      updated[fileId].data = updated[fileId].data.filter((_, i) => i !== rowIndex);
      // Validate after removal
      const fullData = [updated[fileId].headers, ...updated[fileId].data];
      const validationErrors = validatePreviewData
        ? validatePreviewData(fullData, validationConfig)
        : [];
      const hasIssues = validationErrors.length > 0;
      if (!hasIssues) {
        handleIssuesResolved(fileId);
      }
      updated[fileId].validationErrors = validationErrors;
      // Optionally, hide preview if no data left
      // if (updated[fileId].data.length === 0) updated[fileId].show = false;
    }
    return updated;
  });
};


  const handleUpdateRow = (
    rowIndex: number,
    updatedData: Record<string, string>,
    fileId: string
  ) => {
    setPreviewStates((prev) => {
      const updated = { ...prev };
      const fileState = updated[fileId];
      if (fileState) {
        // Helper to update a single row
        const updateRow = (row: string[], idx: number): string[] => {
          if (idx !== rowIndex) return row;
          return row.map((val, colIdx) => {
            const key = `col_${colIdx}`;
            return Object.hasOwn(updatedData, key)
              ? updatedData[key]
              : val;
          });
        };

        // Create a new data array with the updated row
        const newData = fileState.data.map(updateRow);

        updated[fileId] = {
          ...fileState,
          data: newData,
        };
      }
      return updated;
    });
  };

  const handleSavePreview = (fileId: string) => {
    // Helper to get updated file if it matches fileId
    const getUpdatedFile = (file: UploadedFile) => {
      if (file.id !== fileId || !previewStates[fileId]) return file;

      const headers = previewStates[fileId].headers;
      const data = previewStates[fileId].data;
      const csvData = [headers, ...data]
        .map((row) => row.join(","))
        .join("\n");
      console.log("Saved CSV data for file:", fileId, "\n" + csvData);

      return {
        ...file,
        previewHeaders: headers,
        previewData: data,
        previewEdited: true,
      };
    };

    setFiles((prevFiles) => prevFiles.map(getUpdatedFile));

    const fileName = files.find((f) => f.id === fileId)?.name || "file";
    notify(`Edits for ${fileName} saved.`, "success");
  };

  const clearAllFiles = () => setFiles(() => []);

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((file) => file.id !== id));

  return (
    <div className="bg-secondary-color-lt rounded-lg shadow-sm border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Upload Summary
          {files.some(
            (f) =>
              f.status === "error" ||
              (f.validationErrors && f.validationErrors.length > 0)
          ) && (
            <span className="ml-2 text-red-600 text-sm">Issues Detected</span>
          )}
        </h3>
        <button
          onClick={clearAllFiles}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Clear All
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {files.map((file) => (
          <div
            key={file.id}
            className={`p-4 hover:opacity-90 transition-colors ${getFileStatusColor(
              file
            )}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {file.status === "success" &&
                    !(
                      file.validationErrors && file.validationErrors.length > 0
                    ) && <Check className="w-5 h-5 text-green-500" />}
                  {(file.status === "error" ||
                    (file.validationErrors &&
                      file.validationErrors.length > 0)) && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {file.status === "processing" && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {file.status === "pending" && (
                    <FileText className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${getFileTextColor(file)}`}
                  >
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} •{" "}
                    {file.uploadDate.toLocaleString()}
                    {file.rowCount && file.columnCount && (
                      <span>
                        {" "}
                        • {file.rowCount} rows, {file.columnCount} columns
                      </span>
                    )}
                  </p>

                  {file.status === "success" &&
                    !(
                      file.validationErrors && file.validationErrors.length > 0
                    ) && (
                      <div className="text-xs text-green-600 mt-1 flex items-center space-x-2">
                        <Check className="w-3 h-3" />
                        <span>Headers: | Values: Complete</span>
                      </div>
                    )}

                  {file.validationErrors &&
                    file.validationErrors.length > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        <div className="flex items-center space-x-1 mb-1">
                          <AlertCircle className="w-3 h-3" />
                          <span className="font-medium">
                            Validation Issues ({file.validationErrors.length}):
                          </span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 ml-4 max-h-20 overflow-y-auto">
                          {file.validationErrors
                            .slice(0, 3)
                            .map((error) => (
                              <li key={error.description + (error.row ?? "") + (error.column ?? "")}>
                                {error.description}
                              </li>
                            ))}
                          {file.validationErrors.length > 3 && (
                            <li className="text-gray-500">
                              ...and {file.validationErrors.length - 3} more
                              issues
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                  {file.error &&
                    !(
                      file.validationErrors && file.validationErrors.length > 0
                    ) && (
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
                    )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {(file.status === "success" || file.status === "error") &&
                  file.file && (
                    <button
                      onClick={() => handlePreviewFile(file)}
                      className={`p-1 transition-colors ${
                        previewStates[file.id]?.show
                          ? "text-blue-800 bg-blue-100 hover:bg-blue-200"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                      title={
                        previewStates[file.id]?.show
                          ? "Close Preview"
                          : "Preview Data"
                      }
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                {previewStates[file.id]?.show && (
                  <button
                    onClick={() => handleSavePreview(file.id)}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="Save Edits"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    removeFile(file.id);
                    setPreviewStates((prev) => {
                      const updated = { ...prev };
                      delete updated[file.id];
                      return updated;
                    });
                  }}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Remove File"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview for this file */}
            {previewStates[file.id]?.show &&
              previewStates[file.id]?.data.length > 0 && (
                <div className="mt-4">
                  {previewStates[file.id]?.validationErrors &&
                    previewStates[file.id]?.validationErrors.length > 0 && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        Preview validation issues:{" "}
                        {previewStates[file.id]?.validationErrors?.length} found
                      </div>
                    )}
         
                  <MemoizedPreviewTable
                    headers={previewStates[file.id]?.headers}
                    rows={previewStates[file.id]?.data}
                    onRemoveRow={(rowIndex) => handleRemoveRow(rowIndex, file.id)}
                    onUpdateRow={(rowIndex, updatedData) =>
                      handleUpdateRow(rowIndex, updatedData, file.id)
                    }
                  />
                </div>
              )}
          </div>
        ))}
      </div>
      {loading && (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner /> {/* Show spinner while loading */}
        </div>
      )}
    </div>
  );
};

export default UploadSummaryItem;
