import ExcelJS from "exceljs";

const parseExcel = async (arrayBuffer: ArrayBuffer): Promise<string[][]> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer); // load from ArrayBuffer in browser

    const worksheet = workbook.worksheets[0]; // first sheet
    const data: string[][] = [];

    worksheet.eachRow((row, rowNumber) => {
      const rowData: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        let cellValue = cell.text || "";
        cellValue = cellValue.trim();
        rowData.push(cellValue);
      });

      if (rowData.some(cell => cell !== "")) {
        data.push(rowData);
      }
    });

    return data;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error(
      "Failed to parse Excel file. Please ensure it's a valid Excel or XLSX file."
    );
  }
};

export default parseExcel;
