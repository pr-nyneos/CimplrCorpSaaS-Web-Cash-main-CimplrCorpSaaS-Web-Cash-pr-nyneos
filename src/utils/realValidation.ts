import type { ValidationConfig, ValidationError, UploadedFile} from "../types/type";
import parseCSV from "./parseCSV.ts";
import parseExcel from "./parseExcel.ts";

export function validateTemplateData(
  data: string[][],
  config: ValidationConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.length === 0) {
    errors.push({ description: "File appears empty or no data" });
    return errors;
  }

  const headers = data[0].map((h) =>
    String(h || "")
      .trim()
      .toLowerCase()
  );

  // Check headers presence and duplicates
  config.requiredHeaders.forEach((requiredHeader: string) => {
    if (!headers.includes(requiredHeader.toLowerCase())) {
      errors.push({
        description: `Missing required header: ${requiredHeader}`,
      });
    }
  });

  const duplicateHeaders = headers.filter(
    (h, idx) => h !== "" && headers.indexOf(h) !== idx
  );

  if (duplicateHeaders.length > 0) {
    errors.push({
      description: `Duplicate headers found: ${duplicateHeaders.join(", ")}`,
    });
  }

  const requiredFields = config.requiredFields.map((f) => f.toLowerCase());

  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (row.length !== headers.length) {
      errors.push({
        description: `Row ${rowIndex + 1} has ${row.length} columns, expected ${
          headers.length
        }`,
        row: rowIndex + 1,
      });
      continue;
    }

    const rowObj: Record<string, string> = {};
    headers.forEach((header, i) => {
      rowObj[header] = (row[i] || "").trim();
    });

    // Required fields verification
    requiredFields.forEach((field) => {
      if (!rowObj[field] || rowObj[field] === "") {
        errors.push({
          description: `Row ${rowIndex + 1}: '${field}' is required`,
          row: rowIndex + 1,
          column: headers.indexOf(field) + 1,
          currentValue: rowObj[field],
        });
      }
    });

    // Numeric fields validation
    config.numericFields.forEach((field) => {
      const value = rowObj[field.toLowerCase()];
      if (value && isNaN(Number(value.replace(/,/g, "")))) {
        errors.push({
          description: `Row ${rowIndex + 1}: '${field}' must be a valid number`,
          row: rowIndex + 1,
          column: headers.indexOf(field.toLowerCase()) + 1,
          currentValue: value,
        });
      }
    });
  }

  return errors;
}

export const validateFileContent = (
  file: File,
  config: ValidationConfig // Pass config object directly
): Promise<Partial<UploadedFile>> => {
  return new Promise((resolve) => {
    const validationErrors: ValidationError[] = [];
    let rowCount = 0;
    let columnCount = 0;
    let hasHeaders = false;
    let hasMissingValues = false;

    const processData = (data: string[][]) => {
      try {
        if (data.length === 0) {
          resolve({
            status: "error",
            validationErrors: [{ description: "File appears to be empty i dont " }],
            error: "Empty file",
            rowCount: 0,
            columnCount: 0,
            hasHeaders: false,
            hasMissingValues: false,
          });
          return;
        }

        const errors = validateTemplateData(data, config);
        validationErrors.push(...errors);

        rowCount = data.length > 0 ? data.length - 1 : 0;
        columnCount = data.length > 0 ? data[0].length : 0;
        hasHeaders = data.length > 0;

        // ADD THIS BLOCK
        if (rowCount === 0) {
          resolve({
            status: "error",
            validationErrors: [
              {
                description: "File is empty. No data rows found.",
              },
            ],
            error: "File is empty. No data rows found.",
            rowCount,
            columnCount,
            hasHeaders,
            hasMissingValues,
          });
          return;
        }
        // END BLOCK

        const status = validationErrors.length > 0 ? "error" : "success";

        const errorDescription =
          validationErrors.length > 0
            ? validationErrors.map((e) => e.description).join(", ")
            : undefined;

        resolve({
          status,
          validationErrors,
          hasHeaders,
          hasMissingValues,
          rowCount,
          columnCount,
          error: errorDescription,
        } as Partial<UploadedFile>);
      } catch (error) {
        resolve({
          status: "error",
          validationErrors: [{ description: "Processing failed" }],
          error: "Processing failed",
        });
        // Log the error for debugging purposes
        if (error instanceof Error) {
          console.error("Validation processing failed:", error.message, error.stack);
        } else {
          console.error("Validation processing failed:", error);
        }
      }
    };

    const reader = new FileReader();

    reader.onload = (e) => {
      const fileData = e.target?.result;
      if (!fileData) {
        resolve({
          status: "error",
          validationErrors: [{ description: "File read error" }],
          error: "File read error",
        });
        return;
      }

      try {
        let parsedData: string[][];

        if (file.name.toLowerCase().endsWith(".csv")) {
          parsedData = parseCSV(fileData as string);
        } else if (
          file.name.toLowerCase().endsWith(".xlsx") ||
          file.name.toLowerCase().endsWith(".xls")
        ) {
          parsedData = parseExcel(fileData as ArrayBuffer);
        } else {
          resolve({
            status: "error",
            validationErrors: [
              {
                description:
                  "Unsupported file format. Only CSV and Excel files are supported.",
              },
            ],
            error: "Unsupported format",
          });
          return;
        }

        processData(parsedData);
      } catch (error) {
        resolve({
          status: "error",
          validationErrors: [
            {
              description: `Failed to parse file: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          error: "Parsing failed",
        });
      }
    };

    reader.onerror = () => {
      resolve({
        status: "error",
        validationErrors: [{ description: "Failed to read file" }],
        error: "File read error",
      });
    };

    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

export const validatePreviewData = (
  data: string[][],
  config: ValidationConfig
): ValidationError[] => {
  const errors = validateTemplateData(data, config);
  return errors;
};
