const convertToCSVBlob = (headers: string[], rows: string[][]): Blob => {
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  };

export default convertToCSVBlob;