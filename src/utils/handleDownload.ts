import * as XLSX from "xlsx";

type Template = {
  id: string | number;
  name: string;
  type: string;
  description?: string;
  headers?: string[];
  sampleRow?: any[];
};

const handleDownload = (template: Template, format: "csv" | "xlsx") => {
  const { headers, sampleRow, name } = template;
  if (!headers || !sampleRow || !format) return;
  const filename = name || "Template";

  if (format === "csv") {
    const csvContent = [headers, sampleRow]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const wsData = [headers, sampleRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename + ".xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export default handleDownload;
