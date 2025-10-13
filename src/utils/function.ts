import type { UploadedFile } from "../types/type";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const validateFileSize = (size: number) => {
  return size < MAX_FILE_SIZE;
};

export const getFileStatusColor = (file: UploadedFile) => {
  if (
    file.status === "error" ||
    (file.validationErrors && file.validationErrors.length > 0)
  ) {
    return "bg-red-50 border-red-200";
  }
  if (file.status === "success") {
    return "bg-green-50 border-green-200";
  }
  return "bg-gray-50 border-gray-200";
};

export const formatFileSize = (size: number) => {
  let formatted: string;
  if (size < 1024) {
    formatted = `${size} B`;
  } else if (size < 1024 * 1024) {
    formatted = `${(size / 1024).toFixed(2)} KB`;
  } else {
    formatted = `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  return formatted;
};

export const getFileTextColor = (file: UploadedFile) => {
  if (
    file.status === "error" ||
    (file.validationErrors && file.validationErrors.length > 0)
  ) {
    return "text-red-900";
  }
  if (file.status === "success") {
    return "text-green-900";
  }
  return "text-gray-900";
};