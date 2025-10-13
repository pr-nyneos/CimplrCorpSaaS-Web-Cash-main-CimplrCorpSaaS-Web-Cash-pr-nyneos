// Uploader Type
export type ValidationError = {
  description: string;
  row?: number;
  column?: number;
  currentValue?: string;
};

export type PreviewState = {
  data: string[][];
  headers: string[];
  show: boolean;
  validationErrors: ValidationError[];
};

export type Template = {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  headers?: string[];
  sampleRow?: any[];
  
};

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  status: "pending" | "processing" | "success" | "error";
  uploadDate: Date;
  file?: File;
  validationErrors?: ValidationError[];
  error?: string;
  rowCount?: number;
  columnCount?: number;
  hasHeaders?: boolean;
  hasMissingValues?: boolean;
};

export type ValidationConfig = {
  requiredHeaders: string[];
  requiredFields: string[];
  numericFields: string[];
};

//Table

export type FieldConfig<T> = {
  key: keyof T;
  label?: string;
  type?: string; // "text" | "number" | "date" | "select"
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  options?: { value: string | number; label: string }[];
  oldValue?: keyof T;
  customRender?: (row: any) => React.ReactNode;
};

export type Section<T> = {
  title: string;
  // fields: FieldConfig<T>[];
  fields: FieldConfig<T>[] | ((data: T) => FieldConfig<T>[]);
  editableKeys?: (keyof T)[];
};

export type Update = {
  success: boolean; // overall success (true only if all items succeeded)
  results: {
    success: boolean;
    // present if update succeeds
    error?: string; // present if update fails
  }[];
};

export type UpdateRow = {
  success: boolean; // overall success (true only if all items succeeded)
  rows: {
    success: boolean;

    error?: string; // present if update fails
  }[];
};

export type UploadBankResponse = {
  success: true;
  batch_ids?: string[];
  error?: string;
};


//v2
export type ManualEntryAPIResponse = {
  success: boolean;
  rows: {
    error: string;
    success: boolean;
  }[];
  error?: string;
};

// Visibility Type

export type MasterVisibleTab = {
  uploadTab: boolean;
  erpTab: boolean;
  allTab: boolean;
  manualEntryForm: boolean;
};