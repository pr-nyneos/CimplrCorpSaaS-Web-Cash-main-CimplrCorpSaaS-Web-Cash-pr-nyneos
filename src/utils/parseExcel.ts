import * as XLSX from "xlsx";
import { isLikelyDate, formatToYYYYMMDD } from "./dateUtils";

const parseExcel = (arrayBuffer: ArrayBuffer): string[][] => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to 2D array
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "", // default empty string
      raw: false, // parse formatted values
    });

    // Filter out completely empty rows and trim cell values
    const cleanedData = data
      .filter(row => row.some(cell => cell !== "" && cell !== null && cell !== undefined))
      .map((row, rowIdx) =>
        row.map(cell => {
          if (rowIdx === 0) return String(cell || "").trim(); // header row
          if (isLikelyDate(cell)) return formatToYYYYMMDD(cell);
          return String(cell || "").trim();
        })
      );

    return cleanedData;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error(
      "Failed to parse Excel file. Please ensure it's a valid Excel or XLS file."
    );
  }
};

export default parseExcel;
