import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { useNotification } from "../../app/providers/NotificationProvider/Notification.tsx";

type FileUploadProps = {
  disabled?: boolean;
  title?: string;
  handleFiles: (files: FileList) => void;
  handleFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const FileUpload: React.FC<FileUploadProps> = ({
  disabled = false,
  title = "",
  handleFiles,
  handleFileInput,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const { notify } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showDisabledWarning = () => notify("Upload is disabled.", "warning");

  // Helper for drag events
  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  // Helper for drop event
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (disabled) {
      showDisabledWarning();
      return;
    }
    const files = event.dataTransfer.files;
    if (files?.length) {
      handleFiles(files);
    } else {
      notify("No valid files dropped.", "warning");
    }
  };

  // Helper for border classes
  const getBorderClasses = () => {
    if (dragActive) return "border-green-500 bg-secondary-color-lt";
    if (disabled) return "border-primary bg-secondary-color-lt cursor-not-allowed";
    return "border-border hover:border-primary-lt";
  };

  // Helper for click and keyboard
  const handleButtonClick = () => {
    // Prefer explicit methods for each action instead of relying solely on "disabled"
    if (disabled) {
      showDisabledWarning();
      return;
    }
    // If not disabled, trigger file input
    fileInputRef.current?.click();
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2 mb-4">
        <Upload className="w-4 h-4 text-primary" />
        <label className="text-sm font-medium text-secondary-text-dark">
          Upload File (CSV/XLSX):
        </label>
      </div>
      <button
        type="button"
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors w-full ${getBorderClasses()}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        onKeyDown={handleButtonKeyDown}
        disabled={disabled}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          disabled={disabled}
          title={title}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ pointerEvents: "none" }}
          tabIndex={-1}
        />
        <div className="space-y-2 pointer-events-none">
          <Upload className="w-8 h-8 mx-auto text-primary" />
          <p className="text-sm text-primary">
            {!disabled ? (
              <>
                <span className="font-medium text-primary">Click to upload</span>{" "}
                <span className="text-secondary-text">or drag and drop</span>
              </>
            ) : (
              <span className="text-primary">{title}</span>
            )}
          </p>
          <p className="text-xs text-secondary-text-dark">
            {!disabled ? "CSV, XLSX files up to 10MB" : "Enable upload to proceed"}
          </p>
        </div>
      </button>
    </div>
  );
};

export default FileUpload;
